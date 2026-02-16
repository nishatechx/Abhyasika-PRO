
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
  ClipboardList, 
  Bell, 
  PieChart,
  ArrowRight
} from 'lucide-react';
import { Store } from '../services/store';
import { cn } from './ui';
import { Notification, LibraryProfile } from '../types';
import { format } from 'date-fns';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  setUser: (u: any) => void;
}

const DEFAULT_LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGrS0W_C2fEoxXrGD9yVHhOSlX5uy_gZgATDGGFEKQMvAdczkaY8odZof1-WHMQbOTiACJ1zRGLmw6vn4jpXboQJ1Te52ep9ngIfBVXB1BBWzhX9Cjv0PzRG5OXr5hPjf9hg24ekO2JITnXCMLIdS5K_qwCyZjI_0Q6w1i0Crf5GTJCzj9F_rWDYDJURo/s16000/Digital%20Abhyasika%20Logo.png";

export const Layout: React.FC<LayoutProps> = ({ children, user, setUser }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [profile, setProfile] = useState<LibraryProfile | null>(null);
  const [time, setTime] = useState(new Date());
  
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = true;

  useEffect(() => {
    setNotifications(Store.getNotifications());
    setProfile(Store.getProfile());
    Store.refreshNotifications().then(data => setNotifications(data));

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    { label: 'Fees Manager', icon: IndianRupee, path: '/finance' },
    { label: 'Enquiries', icon: MessageCircle, path: '/enquiries' },
    { label: 'Reports', icon: PieChart, path: '/reports' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center justify-center py-6 px-4 md:py-8 md:px-6">
        <img src={DEFAULT_LOGO} alt="Digital Abhyasika" className="h-12 md:h-16 w-auto object-contain" />
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
                "group flex items-center rounded-md px-3 py-3 md:py-2.5 text-sm font-medium transition-all duration-200",
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
        <div className="flex items-center gap-3 mb-4 px-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white border border-slate-600">
                {user.displayName?.[0] || 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-700 hover:text-white focus:outline-none transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header - Always Sticky */}
      <div className="lg:hidden sticky top-0 left-0 right-0 z-40 flex items-center justify-between bg-sidebar/95 backdrop-blur-md px-4 py-3 shadow-lg border-b border-slate-800">
         <div className="flex items-center gap-2 overflow-hidden" onClick={() => navigate('/dashboard')}>
            <img src={profile?.logoUrl || DEFAULT_LOGO} className="h-8 w-auto object-contain" alt="Logo" />
         </div>
         <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                <Bell className="h-6 w-6"/>
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-accent-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-slate-900 font-bold">{unreadCount}</span>}
            </button>
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-md">
                {isMobileOpen ? <X /> : <Menu />}
            </button>
         </div>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex w-64 flex-col border-r border-slate-800 bg-sidebar fixed inset-y-0 z-10 overflow-y-auto scrollbar-hide">
        <NavContent />
      </div>

      {/* Sidebar Overlay - Mobile */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-col bg-sidebar border-r border-slate-800 shadow-2xl flex animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <NavContent />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center px-8 py-4 bg-[#0a0a0a] border-b border-slate-800 shadow-sm sticky top-0 z-30">
             <div className="flex items-center gap-4 min-w-0">
                 <div className="h-10 w-auto flex items-center justify-center overflow-hidden flex-shrink-0">
                     <img src={profile?.logoUrl || DEFAULT_LOGO} alt="Digital Abhyasika" className="w-auto h-full object-contain" />
                 </div>
                 <div className="flex flex-col truncate">
                     <h2 className="text-lg font-bold text-white leading-none truncate">{profile?.name || 'Digital Abhyasika'}</h2>
                     <p className="text-xs text-slate-400 mt-1 font-medium truncate">{profile?.address || 'Dashboard'}</p>
                 </div>
             </div>

             <div className="flex items-center gap-6">
                 {/* Clock */}
                 <div className="font-mono text-lg font-bold text-slate-400 tabular-nums">
                    {format(time, 'hh:mm:ss a')}
                 </div>

                 <div className="relative">
                     <button 
                        onClick={() => setShowNotifPanel(!showNotifPanel)}
                        className="p-2.5 rounded-full hover:bg-slate-800 transition-colors relative text-slate-400"
                     >
                         <Bell className="h-5 w-5" />
                         {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-accent-500 rounded-full border border-slate-900"></span>}
                     </button>

                     {showNotifPanel && (
                         <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)}></div>
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-zoom-in origin-top-right">
                                 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                     <h3 className="font-bold text-sm text-slate-800">Notifications</h3>
                                     <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase">{unreadCount} New</span>
                                 </div>
                                 <div className="max-h-[450px] overflow-y-auto">
                                     {notifications.length > 0 ? notifications.map(n => (
                                         <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary-50/40' : ''}`}>
                                             <div className="flex justify-between items-start mb-1">
                                                 <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                                                 <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{n.date.split(' ')[0]}</span>
                                             </div>
                                             <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{n.message}</p>
                                             {n.imageUrl && <img src={n.imageUrl} className="mt-2 rounded-lg w-full h-32 object-cover border border-slate-200 shadow-sm" alt="Notif" />}
                                             {n.link && (
                                                 <a href={n.link} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline">
                                                     {n.linkText || "View Details"} <ArrowRight className="ml-1 h-3 w-3" />
                                                 </a>
                                             )}
                                         </div>
                                     )) : (
                                         <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                             <Bell className="h-8 w-8 mb-2 opacity-20" />
                                             <p className="text-xs font-medium">No notifications yet</p>
                                         </div>
                                     )}
                                 </div>
                            </div>
                         </>
                     )}
                 </div>
             </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 bg-[#F8FAFC]">
            {/* Notification Panel - Mobile View */}
            {showNotifPanel && (
                <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col animate-fade-in-up">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 shadow-sm bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                             <Bell className="h-5 w-5 text-primary-700" />
                             <h2 className="font-bold text-lg">Notifications</h2>
                        </div>
                        <button onClick={() => setShowNotifPanel(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="h-6 w-6"/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                        {notifications.length > 0 ? notifications.map(n => (
                             <div key={n.id} onClick={() => { handleMarkRead(n.id); if(n.link) window.open(n.link, '_blank'); }} className={`p-4 rounded-xl border transition-all ${!n.isRead ? 'bg-primary-50/50 border-primary-200 shadow-sm' : 'bg-white border-slate-200 shadow-xs'}`}>
                                 <div className="flex justify-between items-start gap-2">
                                     <h4 className="font-bold text-slate-900 mb-1 leading-tight">{n.title}</h4>
                                     {!n.isRead && <div className="h-2 w-2 rounded-full bg-accent-500 shrink-0 mt-1.5"></div>}
                                 </div>
                                 <p className="text-sm text-slate-600 mb-2 leading-relaxed">{n.message}</p>
                                 {n.imageUrl && <img src={n.imageUrl} className="rounded-lg w-full h-48 object-cover mb-3 shadow-sm" alt="Update" />}
                                 {n.link && (
                                     <div className="block text-center bg-primary-700 text-white py-2.5 rounded-lg text-sm font-bold mt-2 shadow-sm active:scale-95 transition-transform">
                                         {n.linkText || "Open Details"}
                                     </div>
                                 )}
                                 <div className="text-[10px] text-slate-400 mt-3 text-right font-medium">{n.date}</div>
                             </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 pb-20">
                                <Bell className="h-16 w-16 mb-4 opacity-10" />
                                <p className="font-medium">No notifications for you</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Main Content Wrapper for Scroll Consistency */}
            <div className="max-w-7xl mx-auto w-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};
