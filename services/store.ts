
import { LibraryProfile, Student, Seat, Payment, Enquiry, AppSettings, User, LibraryAccount, Room, Attendance, Notification } from '../types';
import { addDays, format, subDays } from 'date-fns';
import { db, auth, firebaseConfig, googleProvider } from './firebase'; // Imported config for secondary app
import { collection, getDocs, query, where, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

// Keys for LocalStorage
const STORAGE_KEYS = {
  PROFILE: 'abhyasika_profile',
  STUDENTS: 'abhyasika_students',
  SEATS: 'abhyasika_seats',
  ROOMS: 'abhyasika_rooms',
  PAYMENTS: 'abhyasika_payments',
  ENQUIRIES: 'abhyasika_enquiries',
  SETTINGS: 'abhyasika_settings',
  USER: 'abhyasika_user',
  ACCOUNTS: 'abhyasika_accounts',
  ATTENDANCE: 'abhyasika_attendance',
  NOTIFICATIONS: 'abhyasika_notifications'
};

// Seed Data Generators
const generateSeats = (count: number, roomId: string): Seat[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: roomId + '-' + (i + 1),
    label: String(i + 1),
    status: 'AVAILABLE',
    category: 'GENERAL',
    roomId: roomId
  }));
};

const SEED_STUDENTS: Student[] = [
  {
    id: 's1',
    fullName: 'Rahul Sharma',
    mobile: '9876543210',
    seatId: 'main-1',
    joinDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    planEndDate: format(addDays(new Date(), 20), 'yyyy-MM-dd'),
    status: 'ACTIVE',
    gender: 'MALE',
    dues: 0,
    planType: 'MONTHLY',
    village: 'Pune',
    class: 'MPSC',
    preparation: 'Competitive'
  },
  {
    id: 's2',
    fullName: 'Priya Verma',
    mobile: '9876500000',
    seatId: 'main-2',
    joinDate: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    planEndDate: format(addDays(new Date(), 25), 'yyyy-MM-dd'),
    status: 'ACTIVE',
    gender: 'FEMALE',
    dues: 500,
    planType: 'MONTHLY',
    village: 'Mumbai',
    class: 'UPSC',
    preparation: 'Civil Services'
  }
];

const DEFAULT_SETTINGS: AppSettings = {
    monthlyFee: 800,
    maintenanceMode: false,
    classes: ['10th', '12th', 'Graduation', 'Post Graduation', 'MPSC', 'UPSC', 'Engineering', 'Medical'],
    preparations: ['Board Exams', 'Competitive Exams', 'Entrance Exams', 'Self Study', 'Remote Work']
};

// Helper to create a user in Firebase Auth without logging out the current admin
const createAuthUser = async (email: string, pass: string): Promise<string> => {
    let secondaryApp: FirebaseApp;
    // Check if 'Secondary' app exists to avoid "App already exists" error
    const apps = getApps();
    const existingApp = apps.find(app => app.name === "Secondary");
    
    if (existingApp) {
        secondaryApp = existingApp;
    } else {
        secondaryApp = initializeApp(firebaseConfig, "Secondary");
    }

    try {
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
        // Send Verification Email
        await sendEmailVerification(userCredential.user);
        await signOut(secondaryAuth);
        return userCredential.user.uid;
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            console.log("User already exists in Auth, proceeding...");
            throw new Error("Email already registered in Authentication system.");
        } else if (e.code === 'auth/weak-password') {
             throw new Error("Password too weak (min 6 chars)");
        } else if (e.code === 'auth/invalid-email') {
             throw new Error("Invalid Email Address format.");
        } else if (e.code === 'auth/operation-not-allowed') {
             throw new Error("Email/Password Sign-in is disabled in Firebase Console.");
        } else {
            console.error("Failed to create auth user", e);
            throw e;
        }
    }
};

// Internal Helper to Process Login after Auth
const processLoginForAccount = async (account: LibraryAccount) => {
    if (!account.isActive) throw new Error('Account is inactive. License Suspended.');
    
    const user: User = {
        id: account.id,
        email: account.username,
        displayName: account.libraryName,
        role: 'ADMIN',
        licenseExpiry: account.licenseExpiry,
        accountLicenseKey: account.licenseKey
    };
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    // --- CRITICAL: Fetch Data from Cloud for this Library ---
    const libId = account.id;
    const loadCollection = async (colName: string, storageKey: string) => {
        try {
            const q = query(collection(db, colName), where('libraryId', '==', libId));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => {
                const item = d.data();
                delete item.libraryId; // Clean data for local usage
                return item;
            });
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch(e: any) {
            console.error(`Error loading ${colName} (using local fallback)`, e.message);
            // Permission denied usually means auth token expired or not present.
            // We ignore cloud fetch and rely on what's in localStorage if offline/unauthed.
        }
    };

    // Load all collections concurrently
    // We wrap these in a try/catch to ensure login succeeds even if sync fails
    try {
        await Promise.all([
            loadCollection('students', STORAGE_KEYS.STUDENTS),
            loadCollection('seats', STORAGE_KEYS.SEATS),
            loadCollection('rooms', STORAGE_KEYS.ROOMS),
            loadCollection('payments', STORAGE_KEYS.PAYMENTS),
            loadCollection('enquiries', STORAGE_KEYS.ENQUIRIES),
            loadCollection('attendance', STORAGE_KEYS.ATTENDANCE),
            loadCollection('notifications', STORAGE_KEYS.NOTIFICATIONS),
            // For Profile & Settings
            (async () => {
            const q = query(collection(db, 'profiles'), where('libraryId', '==', libId));
            try {
                const snap = await getDocs(q);
                if(!snap.empty) {
                    const p = snap.docs[0].data();
                    delete p.libraryId;
                    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
                } else {
                    // Only create if completely new and online
                    if (auth.currentUser) {
                        const newProfile: LibraryProfile = {
                            name: account!.libraryName,
                            address: account!.city,
                            contact: account!.mobile || '',
                            totalSeats: account!.maxSeats || 100,
                            licenseKey: account!.licenseKey
                        };
                        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
                        try {
                                await setDoc(doc(db, 'profiles', 'prof-' + libId), { ...newProfile, id: 'prof-' + libId, libraryId: libId });
                        } catch(e) {}
                    }
                }
            } catch(e) {}
            })(),
            (async () => {
            const q = query(collection(db, 'settings'), where('libraryId', '==', libId));
            try {
                const snap = await getDocs(q);
                if(!snap.empty) {
                    const s = snap.docs[0].data();
                    delete s.libraryId;
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(s));
                } else {
                    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
                }
            } catch(e) {}
            })()
        ]);
    } catch (e) {
        console.warn("Cloud sync partial failure during login, proceeding with local/cached data.");
    }

    // Initialize defaults if new (Local check logic remains)
    const existingRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!existingRooms || JSON.parse(existingRooms).length === 0) {
        // Create a unique default room if none loaded from cloud
        const roomId = 'room-' + account.id + '-main';
        const defaultRoom = { id: roomId, name: 'Main Hall' };
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([defaultRoom]));
        
        // Sync to cloud immediately if online
        if(auth.currentUser) {
             try {
                await setDoc(doc(db, 'rooms', roomId), { ...defaultRoom, libraryId: account.id });
             } catch(e) {}
        }
    }

    return user;
};

// Service Layer
export const Store = {
  // --- Cloud Sync Helpers ---
  _syncLocalToCloud: async (collectionName: string, data: any) => {
      const user = Store.getUser();
      // Only sync if user exists, is NOT demo, and is NOT super admin (unless syncing accounts)
      if (!user || user.isDemo) return;
      if (user.role === 'SUPER_ADMIN' && collectionName !== 'accounts' && collectionName !== 'notifications') return;
      if (!auth.currentUser) return; // Don't try to sync if not authenticated

      const libId = user.id;

      // Sanitize data: Firestore throws error if fields are 'undefined'. 
      // JSON serialization removes undefined keys.
      const cleanData = JSON.parse(JSON.stringify(data));

      try {
          // Auth is handled at login now
          if (collectionName === 'accounts') {
             await setDoc(doc(db, 'accounts', data.id), cleanData);
          } else if (collectionName === 'notifications') {
             // Notifications are cross-library sometimes, handled by caller
             await setDoc(doc(db, 'notifications', data.id), cleanData);
          } else {
             // Attach libraryId for multi-tenant isolation
             await setDoc(doc(db, collectionName, data.id), { ...cleanData, libraryId: libId });
          }
      } catch (e) { console.error(`Firebase Sync Error (${collectionName}):`, e); }
  },

  _deleteFromCloud: async (collectionName: string, id: string) => {
      const user = Store.getUser();
      if (!user || user.isDemo || !auth.currentUser) return;
      try {
          await deleteDoc(doc(db, collectionName, id));
      } catch (e) { console.error(`Firebase Delete Error (${collectionName}):`, e); }
  },

  // --- Master Database (Accounts) ---
  getAccounts: (): LibraryAccount[] => {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return data ? JSON.parse(data) : [];
  },

  // Call this to refresh accounts from cloud (e.g. in SuperAdmin)
  refreshAccounts: async (): Promise<LibraryAccount[]> => {
      try {
          // Requires Auth (Super Admin should be logged in via login())
          const snapshot = await getDocs(collection(db, 'accounts'));
          const accounts = snapshot.docs.map(d => d.data() as LibraryAccount);
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
          return accounts;
      } catch (e: any) {
          console.error("Failed to refresh accounts", e);
          if (e.code === 'permission-denied') {
              alert("FIREBASE PERMISSION DENIED: Unable to read 'accounts'.\n\nPossible reasons:\n1. Firestore Security Rules block access.\n2. You are not authenticated as Super Admin in Firebase.");
          } else if (e.message.includes('Cloud Firestore API')) {
              alert("SETUP ACTION REQUIRED: Please go to the Firebase Console -> Build -> Firestore Database and click 'Create Database'. Start in Test Mode for development.");
          }
          return Store.getAccounts();
      }
  },

  addAccount: async (account: LibraryAccount) => {
      // 1. Create Firebase Auth User & Get UID
      const uid = await createAuthUser(account.username, account.password);

      // 2. Set ID to match Auth UID
      account.id = uid;

      // 3. Add to Local Store
      const accounts = Store.getAccounts();
      accounts.push(account);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      
      // 4. Sync Account to Cloud (Firestore)
      await Store._syncLocalToCloud('accounts', account);

      // 5. Create Initial Profile & Settings in Cloud immediately
      try {
          // Profile
          const newProfile: LibraryProfile = {
               name: account.libraryName,
               address: account.city,
               contact: account.mobile || '',
               totalSeats: account!.maxSeats || 100,
               licenseKey: account.licenseKey
          };
          await setDoc(doc(db, 'profiles', 'prof-' + account.id), { ...newProfile, id: 'prof-' + account.id, libraryId: account.id });

          // Settings
          await setDoc(doc(db, 'settings', 'set-' + account.id), { ...DEFAULT_SETTINGS, id: 'set-' + account.id, libraryId: account.id });
          
          // Default Room (Unique ID per library)
          const roomId = 'room-' + account.id + '-main';
          const defaultRoom = { id: roomId, name: 'Main Hall' };
          await setDoc(doc(db, 'rooms', roomId), { ...defaultRoom, libraryId: account.id });
          
          // Note: Seats will be generated by the client upon first login if they detect the room but no seats
          
      } catch (e) {
          console.error("Error creating initial library data", e);
      }
  },

  updateAccount: async (updatedAccount: LibraryAccount) => {
      const accounts = Store.getAccounts();
      const idx = accounts.findIndex(a => a.id === updatedAccount.id);
      if (idx >= 0) {
          accounts[idx] = updatedAccount;
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
          await Store._syncLocalToCloud('accounts', updatedAccount);
          // Note: Password update in Auth not supported from client SDK for other users.
      }
  },

  deleteAccount: async (id: string) => {
      const accounts = Store.getAccounts().filter(a => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      await Store._deleteFromCloud('accounts', id);
  },
  
  toggleAccountStatus: async (id: string) => {
      const accounts = Store.getAccounts();
      const idx = accounts.findIndex(a => a.id === id);
      if (idx >= 0) {
          accounts[idx].isActive = !accounts[idx].isActive;
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
          await Store._syncLocalToCloud('accounts', accounts[idx]);
      }
  },

  // --- Notifications ---
  // Get notifications for current user/library
  getNotifications: (): Notification[] => {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
  },

  // Fetch latest notifications from cloud and update local
  refreshNotifications: async (): Promise<Notification[]> => {
      const user = Store.getUser();
      if (!user) return [];
      
      try {
          if (!auth.currentUser) throw new Error("Offline"); // Skip query if no auth to avoid permission error
          const q = query(collection(db, 'notifications'), where('libraryId', '==', user.id));
          const snap = await getDocs(q);
          const notifs = snap.docs.map(d => d.data() as Notification);
          // Sort by date desc (String compare works for yyyy-MM-dd HH:mm)
          notifs.sort((a,b) => b.date.localeCompare(a.date));
          
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
          return notifs;
      } catch(e) {
          // Silently fail on permissions/network to show cached data
          return Store.getNotifications();
      }
  },

  markNotificationRead: async (id: string) => {
      const notifs = Store.getNotifications();
      const idx = notifs.findIndex(n => n.id === id);
      if (idx >= 0) {
          notifs[idx].isRead = true;
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
          
          // Cloud update
          try {
              if(auth.currentUser) await updateDoc(doc(db, 'notifications', id), { isRead: true });
          } catch(e) {
              console.error("Failed to mark read in cloud", e);
          }
      }
  },

  sendNotification: async (notification: Notification) => {
      // Store in Firestore 'notifications' collection
      // Ensure 'libraryId' field is present so rules can allow library to read it
      // SANITIZE: JSON.stringify/parse removes undefined fields which cause Firestore errors
      const cleanData = JSON.parse(JSON.stringify(notification));
      await setDoc(doc(db, 'notifications', cleanData.id), cleanData);
  },

  // --- User / Auth ---
  getUser: (): User | null => {
    try {
        const u = localStorage.getItem(STORAGE_KEYS.USER);
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
  },

  resendVerification: async (email: string, password: string) => {
      try {
          // 1. Sign in to get the user object
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          
          if (user.emailVerified) {
              await signOut(auth);
              throw new Error("Email is already verified. Please login normally.");
          }

          // 2. Send Verification
          await sendEmailVerification(user);

          // 3. Sign Out
          await signOut(auth);
      } catch (e: any) {
          console.error("Resend Verification Failed", e);
          throw e;
      }
  },

  login: async (email?: string, password?: string, isDemo: boolean = false): Promise<User> => {
    // 1. Check Super Admin Hardcoded Credentials
    if ((email === 'Shrinath' || email === 'shri.workmail@gmail.com') && password === 'India@11') {
        // Authenticate as Super Admin in Firebase to allow Firestore Access
        try {
            const adminEmail = "shri.workmail@gmail.com";
            // Try login
            try {
                await signInWithEmailAndPassword(auth, adminEmail, password);
            } catch(e: any) {
                // If user doesn't exist, create it (Self-healing for admin)
                if(e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
                     try {
                        await createUserWithEmailAndPassword(auth, adminEmail, password);
                     } catch(createError: any) {
                         if (createError.code === 'auth/operation-not-allowed') {
                             alert("CRITICAL SETUP: Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.");
                             throw new Error("Auth provider disabled");
                         }
                         throw createError;
                     }
                } else if (e.code === 'auth/operation-not-allowed') {
                     alert("CRITICAL SETUP: Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.");
                     throw new Error("Auth provider disabled");
                } else {
                    throw e;
                }
            }
        } catch (e: any) {
            console.error("Super Admin Auth Failed:", e);
             // Don't swallow the error if it's the auth configuration issue
            if (e.message === "Auth provider disabled") throw e;
            if (e.code === 'auth/operation-not-allowed') {
                 alert("CRITICAL SETUP: Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.");
            }
        }

        const user: User = {
            id: 'super-admin-01',
            email: 'shri.workmail@gmail.com',
            displayName: 'Shrinath (Developer)',
            role: 'SUPER_ADMIN'
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        return user;
    }
    
    // 2. VLAB Login (Offline Mode for Demo)
    if (email === 'vlab' && password === 'vlab') {
         const user: User = {
            id: 'vlab-user',
            email: 'vlab@demo.com',
            displayName: 'Virtual Lab',
            role: 'ADMIN',
            licenseExpiry: '2030-01-01',
            accountLicenseKey: 'VLAB-DEMO'
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
            Store.seedDemoData();
            // Override name
            const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE)!);
            p.name = "Virtual Lab";
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
        }
        return user;
    }

    // 3. Demo Login - Legacy Support only
    if (isDemo) {
        const user: User = {
          id: 'demo-123',
          email: 'demo@abhyasika.pro',
          displayName: 'Demo Admin',
          isDemo: true,
          role: 'ADMIN',
          licenseExpiry: '2030-12-31',
          accountLicenseKey: 'DEMO-KEY-0001'
        };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) Store.seedDemoData();
        return user;
    }

    // 4. Cloud Login & Sync (Standard User)
    try {
        if (!email || !password) throw new Error("Credentials required");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // --- EMAIL VERIFICATION CHECK ---
        if (!userCredential.user.emailVerified) {
            await signOut(auth); // Log them out immediately
            throw new Error('EMAIL_NOT_VERIFIED');
        }

        // Fetch Account Details from Firestore
        const q = query(collection(db, 'accounts'), where('username', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const account = snapshot.docs[0].data() as LibraryAccount;
            return await processLoginForAccount(account);
        } else {
            // Check local cache if offline
            const localAccounts = Store.getAccounts();
            const account = localAccounts.find(a => a.username === email && a.password === password);
            if(account) return await processLoginForAccount(account);
        }

    } catch (e: any) {
        console.error("Login failed", e.code, e.message);
        if (e.message === 'EMAIL_NOT_VERIFIED') throw e;
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
            throw new Error('Invalid Credentials');
        }
        if (e.code === 'auth/operation-not-allowed') {
             alert("SETUP ACTION REQUIRED: Please go to the Firebase Console -> Build -> Authentication -> Sign-in method and Enable 'Email/Password' provider.");
        }
        // If account found locally but firebase failed (e.g. offline), we might want to try local login
        // But for now, just throw invalid creds to be safe
        throw e;
    }
    
    throw new Error('Invalid Credentials');
  },

  loginWithGoogle: async (): Promise<User> => {
      try {
          const result = await signInWithPopup(auth, googleProvider);
          const email = result.user.email;
          const user = result.user;

          if(!email) throw new Error("No email found from Google provider");

          // --- CONSTRAINT 1: CHECK VERIFICATION ---
          // Google usually verifies automatically, but if it doesn't, we must block.
          if (!user.emailVerified) {
              await signOut(auth); // Important: Clear session
              throw new Error("EMAIL_NOT_VERIFIED");
          }

          // --- CONSTRAINT 2: CHECK REGISTRATION IN SYSTEM ---
          // User must already exist in 'accounts' collection
          const q = query(collection(db, 'accounts'), where('username', '==', email));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
               const account = snapshot.docs[0].data() as LibraryAccount;
               return await processLoginForAccount(account);
          } else {
               // If not registered in our system, do not allow login even if Google Auth worked.
               await signOut(auth); // Clean up
               throw new Error("NOT_REGISTERED");
          }

      } catch (e: any) {
          console.error("Google Login failed", e);
          if (e.code === 'auth/popup-closed-by-user') throw new Error("Login cancelled");
          throw e;
      }
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    signOut(auth);
  },

  // --- Profile ---
  getProfile: (): LibraryProfile | null => {
    try {
        const p = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return p ? JSON.parse(p) : null;
    } catch(e) { return null; }
  },
  saveProfile: async (profile: LibraryProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    
    // Cloud Sync
    const user = Store.getUser();
    if (user && !user.isDemo) {
        // Profile ID is usually constant per library, use a prefix
        const cleanProfile = JSON.parse(JSON.stringify(profile));
        await Store._syncLocalToCloud('profiles', { ...cleanProfile, id: 'prof-' + user.id });
    }

    // Initialize defaults if new (Local check logic remains)
    const existingRooms = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!existingRooms) {
        // Local fallback
        const defaultRoom = { id: 'main', name: 'Main Hall' };
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify([defaultRoom]));
        const seats = generateSeats(profile.totalSeats, 'main');
        localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
    }
  },
  
  // --- License Activation ---
  isLicenseActive: (): boolean => {
      const user = Store.getUser();
      return !!user;
  },

  // --- Settings ---
  getSettings: (): AppSettings => {
      const s = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return s ? JSON.parse(s) : DEFAULT_SETTINGS;
  },
  saveSettings: async (settings: AppSettings) => {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      const user = Store.getUser();
      if (user && !user.isDemo) {
           await Store._syncLocalToCloud('settings', { ...settings, id: 'set-' + user.id });
      }
  },

  // --- Rooms ---
  getRooms: (): Room[] => {
    const r = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!r) {
        // No local rooms found. Return empty or default for display, 
        // but generally should be initialized by login process.
        return [];
    }
    return JSON.parse(r);
  },
  addRoom: async (room: Room) => {
      const rooms = Store.getRooms();
      rooms.push(room);
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      await Store._syncLocalToCloud('rooms', room);

      // --- AUTO SEAT GENERATION LOGIC ---
      if (room.capacity && room.capacity > 0) {
          const newSeats: Seat[] = Array.from({ length: room.capacity }, (_, i) => ({
              id: `${room.id}-${i + 1}`,
              label: String(i + 1),
              status: 'AVAILABLE',
              category: 'GENERAL',
              roomId: room.id
          }));

          const allSeats = Store.getSeats();
          const updatedSeats = [...allSeats, ...newSeats];
          localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(updatedSeats));
          
          // Cloud Sync for each new seat
          for (const seat of newSeats) {
              await Store._syncLocalToCloud('seats', seat);
          }
      }
  },
  deleteRoom: async (roomId: string) => {
      const rooms = Store.getRooms().filter(r => r.id !== roomId);
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
      await Store._deleteFromCloud('rooms', roomId);
      
      // Delete Seats in Room
      const seats = Store.getSeats().filter(s => s.roomId === roomId); // Seats to be deleted
      for (const seat of seats) {
          await Store._deleteFromCloud('seats', seat.id);
      }
      
      const remainingSeats = Store.getSeats().filter(s => s.roomId !== roomId);
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(remainingSeats));
  },

  // --- Seats ---
  getSeats: (): Seat[] => {
    const s = localStorage.getItem(STORAGE_KEYS.SEATS);
    let seats: Seat[] = s ? JSON.parse(s) : [];
    
    // Migration logic kept for local robustness
    const rooms = Store.getRooms();
    const defaultRoomId = rooms[0]?.id; // Don't default to 'main' blindly if room ID is dynamic
    
    if (seats.length > 0 && defaultRoomId) {
        let needsUpdate = false;
        seats = seats.map(seat => {
            if (!seat.roomId) {
                needsUpdate = true;
                return { ...seat, roomId: defaultRoomId };
            }
            return seat;
        });
        if (needsUpdate) localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
    }
    return seats;
  },
  addSeat: async (seat: Seat) => {
      const seats = Store.getSeats();
      seats.push(seat);
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
      await Store._syncLocalToCloud('seats', seat);
  },
  updateSeat: async (seat: Seat) => {
    const seats = Store.getSeats();
    const idx = seats.findIndex(s => s.id === seat.id);
    if (idx >= 0) {
      seats[idx] = seat;
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
      await Store._syncLocalToCloud('seats', seat);
    }
  },
  deleteSeat: async (seatId: string) => {
      const seats = Store.getSeats().filter(s => s.id !== seatId);
      localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
      await Store._deleteFromCloud('seats', seatId);
  },

  // --- Students ---
  getStudents: (): Student[] => {
    const s = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return s ? JSON.parse(s) : [];
  },
  addStudent: async (student: Student) => {
    const students = Store.getStudents();
    students.push(student);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    await Store._syncLocalToCloud('students', student);
    
    if (student.seatId) {
      const seats = Store.getSeats();
      const seatIdx = seats.findIndex(s => s.id === student.seatId);
      if (seatIdx >= 0) {
        seats[seatIdx].status = 'OCCUPIED';
        seats[seatIdx].studentId = student.id;
        localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
        await Store._syncLocalToCloud('seats', seats[seatIdx]);
      }
    }
  },
  updateStudent: async (student: Student) => {
    const students = Store.getStudents();
    const idx = students.findIndex(s => s.id === student.id);
    if (idx >= 0) {
      students[idx] = student;
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      await Store._syncLocalToCloud('students', student);
    }
  },
  deleteStudent: async (id: string) => {
      let students = Store.getStudents();
      const student = students.find(s => s.id === id);
      
      if(student && student.seatId) {
          const seats = Store.getSeats();
          const seatIdx = seats.findIndex(s => s.id === student.seatId);
          if(seatIdx >= 0) {
              seats[seatIdx].status = 'AVAILABLE';
              seats[seatIdx].studentId = undefined;
              localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
              await Store._syncLocalToCloud('seats', seats[seatIdx]);
          }
      }
      
      students = students.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      await Store._deleteFromCloud('students', id);
  },

  // --- Finance ---
  getPayments: (): Payment[] => {
    const p = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return p ? JSON.parse(p) : [];
  },
  addPayment: async (payment: Payment) => {
    const payments = Store.getPayments();
    payments.unshift(payment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    await Store._syncLocalToCloud('payments', payment);
    
    // Update student dues
    const students = Store.getStudents();
    const sIdx = students.findIndex(s => s.id === payment.studentId);
    if(sIdx >= 0) {
        students[sIdx].dues = Math.max(0, students[sIdx].dues - payment.amount);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        await Store._syncLocalToCloud('students', students[sIdx]);
    }
  },

  // --- Enquiries ---
  getEnquiries: (): Enquiry[] => {
    const e = localStorage.getItem(STORAGE_KEYS.ENQUIRIES);
    return e ? JSON.parse(e) : [];
  },
  addEnquiry: async (enquiry: Enquiry) => {
    const list = Store.getEnquiries();
    list.unshift(enquiry);
    localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(list));
    await Store._syncLocalToCloud('enquiries', enquiry);
  },
  updateEnquiry: async (enquiry: Enquiry) => {
      const list = Store.getEnquiries();
      const idx = list.findIndex(e => e.id === enquiry.id);
      if(idx >= 0) {
          list[idx] = enquiry;
          localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(list));
          await Store._syncLocalToCloud('enquiries', enquiry);
      }
  },

  // --- Attendance ---
  getAttendance: (): Attendance[] => {
    const a = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return a ? JSON.parse(a) : [];
  },
  addAttendance: async (record: Attendance) => {
    const list = Store.getAttendance();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    await Store._syncLocalToCloud('attendance', record);
  },

  // --- Seed Demo Data ---
  seedDemoData: () => {
    const profile: LibraryProfile = {
      name: "Saraswati Study Point",
      address: "2nd Floor, MG Road, Pune",
      contact: "9876543210",
      totalSeats: 50,
      licenseKey: 'DEMO-KEY-0001'
    };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    
    const rooms: Room[] = [{ id: 'main', name: 'Main Hall', capacity: 50 }];
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));

    const seats = generateSeats(50, 'main');
    seats[0].status = 'OCCUPIED';
    seats[0].studentId = 's1';
    seats[1].status = 'OCCUPIED';
    seats[1].studentId = 's2';
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seats));
    
    const students = SEED_STUDENTS.map(s => {
        if (s.id === 's1') return { ...s, seatId: 'main-1' };
        if (s.id === 's2') return { ...s, seatId: 'main-2' };
        return s;
    });
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    
    const payments: Payment[] = [
        { id: 'p1', studentId: 's1', studentName: 'Rahul Sharma', amount: 1000, date: format(new Date(), 'yyyy-MM-dd'), type: 'FEE', method: 'UPI' }
    ];
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    
    const enquiries: Enquiry[] = [
        { id: 'e1', name: 'Amit Kumar', mobile: '9988776655', source: 'Walk-in', status: 'NEW', date: format(new Date(), 'yyyy-MM-dd'), notes: 'Looking for AC seat' }
    ];
    localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(enquiries));
  }
};
