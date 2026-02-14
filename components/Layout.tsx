
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Armchair, 
  Users, 
  IndianRupee, 
  MessageCircle, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Lock,
  ClipboardList,
  Bell,
  Library
} from 'lucide-react';
import { Store } from '../services/store';
import { cn } from './ui';
import { Notification, LibraryProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  setUser: (u: any) => void;
}

const DEFAULT_LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEioaLqxKHxm_CiO9-ZIkOlt5t90C2zoAOWvuNSWh4uA-kHMC3_rXZJduG5LthPp5tz68BOfxMaVapFdXIgOqurdd9f1GQ1_moTmCm4nYnbFTN8Oskv7AQoNF-yBrAz0v9LUL03XsN7uKzniFGsacozdWUDhDQuohxHYPF50H7Hr245Ha4hVG1mx3jSCbHc/s16000/Smart%20Seat%20Pro.jpg";

export const Layout: React.FC<LayoutProps> = ({ children, user, setUser }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [profile, setProfile] = useState<LibraryProfile | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  // isActive is now effectively always true for logged in users
  const isActive = true;

  // Load Notifications & Profile
  useEffect(() => {
    // 1. Load from local first
    setNotifications(Store.getNotifications());
    setProfile(Store.getProfile());
    
    // 2. Try to refresh from cloud if online
    Store.refreshNotifications().then(data => setNotifications(data));
  }, []);

  const handleLogout = () => {
    Store.logout();
    setUser(null);
    navigate('/');
  };

  const handleMarkRead = (id: string) => {
      Store.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Attendance', icon: ClipboardList, path: '/attendance' },
    { label: 'Seat Manager', icon: Armchair, path: '/seats' },
    { label: 'Students', icon: Users, path: '/students' },
    { label: 'Finance', icon: IndianRupee, path: '/finance' },
    { label: 'Enquiries', icon: MessageCircle, path: '/enquiries' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-8">
        <img src={profile?.logoUrl || DEFAULT_LOGO} alt="Logo" className="h-10 w-auto rounded-md object-contain shadow-lg bg-[#061525] border border-slate-700" />
        <div className="overflow-hidden">
          <h1 className="text-sm font-bold text-white leading-tight truncate">{profile?.name || 'Library'}</h1>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Library Manager</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isRouteActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isRouteActive 
                  ? "bg-primary-700 text-white shadow-md border-l-4 border-accent-500" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", isRouteActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                {user.displayName?.[0] || 'U'}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-700 hover:text-white focus:outline-none transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center justify-between bg-sidebar px-4 py-3 shadow-md border-b border-slate-800">
         <div className="flex items-center gap-2 overflow-hidden">
            <img src={profile?.logoUrl || DEFAULT_LOGO} className="h-8 w-auto rounded-md bg-[#061525] border border-slate-700" />
            <span className="font-bold text-white truncate">{profile?.name || 'Library'}</span>
         </div>
         <div className="flex items-center gap-4">
            <button className="relative text-slate-400" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                <Bell className="h-6 w-6"/>
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-slate-900">{unreadCount}</span>}
            </button>
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-slate-400 hover:text-white">
                {isMobileOpen ? <X /> : <Menu />}
            </button>
         </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 flex-col border-r border-slate-800 bg-sidebar fixed inset-y-0 z-10">
        <NavContent />
      </div>

      {/* Sidebar - Mobile */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 flex">
          <div className="w-64 flex-col bg-sidebar border-r border-slate-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col pt-16 lg:pt-0">
        
        {/* Desktop Header for Notifications */}
        <header className="hidden lg:flex justify-end items-center px-8 py-4 bg-white border-b border-slate-200">
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors relative"
                 >
                     <Bell className="h-5 w-5 text-slate-600" />
                     {unreadCount > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-accent-500 rounded-full border border-white"></span>}
                 </button>

                 {/* Notification Panel */}
                 {showNotifPanel && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)}></div>
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-zoom-in origin-top-right">
                             <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                 <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                                 <span className="text-xs text-slate-500">{unreadCount} Unread</span>
                             </div>
                             <div className="max-h-96 overflow-y-auto">
                                 {notifications.length > 0 ? notifications.map(n => (
                                     <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${!n.isRead ? 'bg-primary-50/50' : ''}`}>
                                         <div className="flex justify-between items-start mb-1">
                                             <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                                             <span className="text-[10px] text-slate-400">{n.date.split(' ')[0]}</span>
                                         </div>
                                         <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                                         {n.imageUrl && <img src={n.imageUrl} className="mt-2 rounded-md w-full h-32 object-cover border border-slate-200" />}
                                         {n.link && (
                                             <a href={n.link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-primary-700 hover:underline">
                                                 {n.linkText || "View Details"} →
                                             </a>
                                         )}
                                     </div>
                                 )) : (
                                     <div className="p-8 text-center text-slate-400 text-xs">No notifications</div>
                                 )}
                             </div>
                        </div>
                     </>
                 )}
             </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative bg-[#F8FAFC]">
            {/* Mobile Notification Panel */}
            {showNotifPanel && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col animate-fade-in-up">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 shadow-sm bg-white">
                        <h2 className="font-bold text-lg">Notifications</h2>
                        <button onClick={() => setShowNotifPanel(false)} className="p-2"><X className="h-6 w-6"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {notifications.map(n => (
                             <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 rounded-lg border ${!n.isRead ? 'bg-primary-50 border-primary-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                 <h4 className="font-bold text-slate-900 mb-1">{n.title}</h4>
                                 <p className="text-sm text-slate-600 mb-2">{n.message}</p>
                                 {n.imageUrl && <img src={n.imageUrl} className="rounded w-full h-40 object-cover mb-2" />}
                                 {n.link && (
                                     <a href={n.link} className="block text-center bg-primary-700 text-white py-2 rounded text-sm font-bold mt-2">
                                         {n.linkText || "Open Link"}
                                     </a>
                                 )}
                                 <div className="text-xs text-slate-400 mt-2 text-right">{n.date}</div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
            
            {children}
        </main>
      </div>
    </div>
  );
};
