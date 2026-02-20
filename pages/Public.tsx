
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../services/store';
import { Button, Input, Card } from '../components/ui';
import { 
  Library, 
  CheckCircle, 
  Zap, 
  ArrowRight, 
  LayoutDashboard, 
  Smartphone, 
  FileText, 
  PieChart, 
  Users,
  Database,
  BellRing,
  IndianRupee, 
  Receipt,
  TrendingUp, 
  MapPin,
  XCircle, 
  ShieldCheck,
  Star,
  ArrowLeft,
  Mail,
  Globe,
  ArrowDown,
  LogIn
} from 'lucide-react';
import { LibraryProfile } from '../types';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh_Y56WdBxrCloSgXFwUGPI96xrDhH3pNHoLDAaltDDvg-5QQe7LflPvxcAvE4hyphenhyphen_hqimXuJy4V4DsIo2rKtKnkOEDY3JRVgHKpnZJunLs6d9ilffrMMXhZzAz-Xp5pWibseXWrwysTt_iKBrlpBAdaL6RcTgKirVRPAIHvoEZaigtS6iB44OH7xsjfFwk/s16000/Digital%20Abhyasika%20Logo%20Borderd.png";
const HERO_LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh_Y56WdBxrCloSgXFwUGPI96xrDhH3pNHoLDAaltDDvg-5QQe7LflPvxcAvE4hyphenhyphen_hqimXuJy4V4DsIo2rKtKnkOEDY3JRVgHKpnZJunLs6d9ilffrMMXhZzAz-Xp5pWibseXWrwysTt_iKBrlpBAdaL6RcTgKirVRPAIHvoEZaigtS6iB44OH7xsjfFwk/s16000/Digital%20Abhyasika%20Logo%20Borderd.png";
const LOGIN_BG_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjFZSUauRg9kZY6ng1y4pSumm_Cc_rU8SdEPi57ov3r57zWTZuPRyzBFc38vLf22jkbQHGcgouNargxXrNQfP8OX80PPHgJ6kmfo9ZM0pzirgmqRzZNNWKEAjCz5YJ3Pg3Xfx9Od-hR4J9D6HGzxus6LjXWhlORFD6jeLVgcwoc3CCKOX3ewdGEWdUa3nk/s16000/Login%20Background%20Image.jpg";
const HERO_BG_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgk19oVKHi6eLVWrNN-A4YccjkHRRwzO3XLRFXOpYCgSza6np27DFj0p-ImUiwZrglS9L28Gt7yCCOiugFtdIfxu2rfbbDtQrF7oFUSMR6hdvHv3d7m3qeDXPmnmlWe41XmTeKuxezV5RJvTaSa_dohKEm2EcI8xMYnMpgZ10VI6ZC2qcihhAp033g-RxY/s16000/Hero%20Section%20Background.jpg";

// --- Components for Landing Page ---

// 1. Typing Effect Component
const Typewriter = () => {
  const words = ["अभ्यासिका", "Library", "Reading Hall", "Study Point", "Study Rooms", "Self Study Lab"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const word = words[currentWordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(word.substring(0, currentText.length + 1));
        if (currentText.length === word.length) {
          setTimeout(() => setIsDeleting(true), 1500); // Wait before deleting
        }
      } else {
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText.length === 0) {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex]);

  return (
    <span className="text-orange-500 inline-block min-w-[200px]">
      {currentText}
      <span className="animate-cursor border-r-2 border-orange-500 ml-1"></span>
    </span>
  );
};

// --- Landing Page ---
export const Landing = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.classList.remove('opacity-0');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' 
    });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const heroFeatures = [
      { icon: LayoutDashboard, label: "Seats Mgmt", color: "text-blue-600", bg: "bg-white/80 backdrop-blur-sm border-blue-100" },
      { icon: IndianRupee, label: "Fees Mgmt", color: "text-green-600", bg: "bg-white/80 backdrop-blur-sm border-green-100" },
      { icon: BellRing, label: "Reminders", color: "text-red-600", bg: "bg-white/80 backdrop-blur-sm border-red-100" },
      { icon: Database, label: "Cloud Data", color: "text-purple-600", bg: "bg-white/80 backdrop-blur-sm border-purple-100" },
      { icon: Receipt, label: "Receipts", color: "text-indigo-600", bg: "bg-white/80 backdrop-blur-sm border-indigo-100" },
      { icon: TrendingUp, label: "Reports", color: "text-orange-600", bg: "bg-white/80 backdrop-blur-sm border-orange-100" },
  ];

  const testimonials = [
      { text: "सीट रिकामी आहे का नाही हे बघायला आता रजिस्टर शोधावे लागत नाही. डॅशबोर्ड वर लगेच समजते.", name: "Ganesh Shinde", city: "Sadashiv Peth, Pune", role: "Owner, Saraswati Library" },
      { text: "Software is very easy. My staff learned it in 1 day. Receipts on WhatsApp is a great feature.", name: "Dr. Anjali Patil", city: "Latur", role: "Director, Wisdom Study Circle" },
      { text: "महिन्याच्या शेवटी हिशोब करायला खूप त्रास व्हायचा. आता एका क्लिक वर रिपोर्ट मिळतो.", name: "Suresh Deshmukh", city: "Akola", role: "Manager" },
      { text: "स्टुडंट्स ची फी बाकी असेल तर SMS जातो, त्यामुळे वसुली वेळेवर होते. बेस्ट सॉफ्टवेअर.", name: "Rameshwar Bhau", city: "Parbhani", role: "Owner, Mauli Abhyasika" },
      { text: "We manage 3 branches in Sambhajinagar using Digital Abhyasika. Centralized data is very helpful.", name: "Vikram Rane", city: "Chhatrapati Sambhajinagar", role: "Founder" },
      { text: "ग्रामीण भागातील लायब्ररी साठी खूप उपयुक्त. इंटरनेट नसताना पण मोबाइल वर बघता येते.", name: "Kishor Patil", city: "Jalgaon", role: "Owner" },
      { text: "Cost effective solution. Support team speaks Marathi and is very helpful.", name: "Pooja Kulkarni", city: "Nashik", role: "Admin" },
      { text: "Excel maintain करणे बंद केले. आता सगळं काम ऑनलाइन आणि सुरक्षित.", name: "Amit Joshi", city: "Thane", role: "Owner, Focus Point" },
      { text: "Students love the digital ID card and fee receipts. Adds a professional touch.", name: "Rahul Gaikwad", city: "Solapur", role: "Manager" },
      { text: "Best decision for my study room business. Highly recommended for Maharashtra libraries.", name: "Vaibhav Chavan", city: "Satara", role: "Owner" },
      { text: "रात्री अपरात्री पण लायब्ररीची स्थिती मोबाइल वर पाहता येते. खूप छान सुविधा.", name: "Nitin Pawar", city: "Baramati", role: "Owner" },
      { text: "No technical knowledge needed. Very simple interface designed for common people.", name: "Sanjay More", city: "Kolhapur", role: "Trustee" },
  ];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const autoScroll = () => {
        if (isPaused.current) return;

        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        const currentScroll = scrollContainer.scrollLeft;
        
        // If near end, loop back to start smoothly
        if (currentScroll >= maxScroll - 10) {
             scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
             // Scroll by one card width (assuming first card width + gap)
             const card = scrollContainer.firstElementChild as HTMLElement;
             const gap = 32; // gap-8 is 2rem = 32px
             if (card) {
                scrollContainer.scrollBy({ left: card.offsetWidth + gap, behavior: 'smooth' });
             }
        }
    };

    const interval = setInterval(autoScroll, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <header className="fixed w-full bg-[#061525]/95 backdrop-blur-md z-50 border-b border-slate-800 transition-all duration-300 h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-16 w-auto flex items-center justify-center">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
            </div>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/login')} className="shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 border-none">
                Enter <LogIn className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20 overflow-x-hidden">
        {/* Hero Section */}
        <div className="relative min-h-[550px] lg:min-h-[600px] flex items-center pb-24 pt-10 lg:pt-0 lg:pb-0 isolate">
           {/* Background Image Container */}
           <div className="absolute inset-0 -z-10">
              <img 
                src={HERO_BG_URL} 
                alt="Hero Background" 
                className="w-full h-full object-cover object-center lg:object-[center_top]"
              />
              {/* Gradient Overlay - Optimized for text readability on left, visibility on right */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/70 to-transparent lg:w-[80%]"></div>
              {/* Mobile overlay */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] lg:hidden"></div>
           </div>

           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full h-full">
              <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-12 lg:h-[500px]">
                  
                  {/* Left Column: Text - Strictly constrained width */}
                  <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in-up lg:max-w-xl xl:max-w-2xl lg:pb-28">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-sm font-bold mb-2 shadow-sm">
                         <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                         Maharashtra's #1 Choice
                      </div>

                      <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] drop-shadow-sm">
                        Automate Your <br/>
                        <Typewriter />
                      </h1>
                      
                      <p className="text-lg md:text-xl text-slate-700 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                        Say goodbye to registers and Excel sheets. Manage admissions, fees, and seat allocation from your phone with zero effort.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                         <Button size="lg" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 h-14 text-lg bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 hover:translate-y-[-2px] transition-transform">
                           Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                         </Button>
                         <div className="hidden sm:flex items-center gap-4 text-sm font-bold text-slate-600">
                             <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-600" /> Secure</span>
                             <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                             <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-600" /> Scalable</span>
                         </div>
                      </div>
                  </div>

                  {/* Right Column: Features Grid - Aligned Bottom Right */}
                  <div className="hidden lg:flex lg:flex-1 flex-col justify-end items-end pb-12 w-full animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <div className="w-full max-w-md">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 text-right pr-2 drop-shadow-sm">Everything you need</p>
                          <div className="grid grid-cols-2 gap-3">
                              {heroFeatures.map((feat, idx) => (
                                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm transition-transform hover:scale-105 ${feat.bg}`}>
                                      <feat.icon className={`h-5 w-5 ${feat.color}`} />
                                      <span className="text-xs font-bold text-slate-800">{feat.label}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
           </div>

           {/* Scroll Down Arrow */}
           <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-20">
               <div 
                 className="cursor-pointer animate-bounce bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-slate-200 hover:bg-white transition-colors"
                 onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
               >
                   <ArrowDown className="h-5 w-5 text-orange-600" />
               </div>
           </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white border-y border-slate-200 py-12 reveal opacity-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
                    {[
                        { num: "500+", label: "Libraries" },
                        { num: "35+", label: "Cities" },
                        { num: "50k+", label: "Students Managed" },
                        { num: "100%", label: "Data Safety" }
                    ].map((stat, i) => (
                        <div key={i} className="p-2">
                            <div className="text-4xl font-extrabold text-slate-800 mb-1">{stat.num}</div>
                            <div className="text-slate-500 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="py-24 bg-slate-50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 reveal opacity-0">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features for Growth</h2>
              <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full mb-4"></div>
              <p className="text-slate-600 text-lg">Everything you need to run your Abhyasika efficiently.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 reveal opacity-0">
              {[
                { 
                  icon: LayoutDashboard, 
                  color: "bg-blue-100 text-blue-600",
                  title: 'Smart Dashboard', 
                  desc: 'Get a bird\'s eye view of your library. Track daily occupancy, pending dues, and new admissions in real-time.' 
                },
                { 
                  icon: CheckCircle, 
                  color: "bg-green-100 text-green-600",
                  title: 'Visual Seat Matrix', 
                  desc: 'Drag-and-drop interface to assign seats. Mark seats as reserved, under maintenance, or occupied instantly.' 
                },
                { 
                  icon: Zap, 
                  color: "bg-yellow-100 text-yellow-600",
                  title: 'Lightning Fast Admissions', 
                  desc: 'Register new students in under 30 seconds. Digital forms that capture photos and ID proof automatically.' 
                },
                { 
                  icon: FileText, 
                  color: "bg-purple-100 text-purple-600",
                  title: 'Digital Receipts', 
                  desc: 'Generate professional fee receipts instantly. Download as PDF or share directly via WhatsApp.' 
                },
                { 
                  icon: Smartphone, 
                  color: "bg-pink-100 text-pink-600",
                  title: 'Mobile Friendly', 
                  desc: 'Manage your library from anywhere. Our responsive design works perfectly on your smartphone or tablet.' 
                },
                { 
                  icon: PieChart, 
                  color: "bg-orange-100 text-orange-600",
                  title: 'Financial Reports', 
                  desc: 'Track every rupee. detailed reports on daily collections, monthly revenue, and pending dues.' 
                }
              ].map((f, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 shadow-sm ${f.color}`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Problem vs Solution Section */}
        <div className="py-20 bg-white">
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal opacity-0">
                 <div className="grid md:grid-cols-2 gap-12">
                     <div className="bg-tomato-50 p-8 rounded-3xl border border-tomato-100">
                         <h3 className="text-2xl font-bold text-tomato-800 mb-6 flex items-center gap-2">
                             <XCircle className="fill-tomato-200 text-tomato-600"/> The Old Way
                         </h3>
                         <ul className="space-y-4">
                             {[
                                 "Manual registers that get lost",
                                 "Calculating fees on calculator",
                                 "No idea which seat is empty",
                                 "Forgot to remind students for fees",
                                 "Writing receipts by hand"
                             ].map((item, i) => (
                                 <li key={i} className="flex items-center gap-3 text-tomato-700/80 font-medium">
                                     <div className="h-2 w-2 rounded-full bg-tomato-400"></div> {item}
                                 </li>
                             ))}
                         </ul>
                     </div>
                     <div className="bg-green-50 p-8 rounded-3xl border border-green-100 shadow-lg shadow-green-100/50">
                         <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-2">
                             <CheckCircle className="fill-green-200 text-green-600"/> The Smart Seat Way
                         </h3>
                         <ul className="space-y-4">
                             {[
                                 "Secure Cloud Database",
                                 "Automated Calculations & Reports",
                                 "Visual Seat Map",
                                 "Auto WhatsApp Reminders (Coming Soon)",
                                 "Instant PDF Receipts"
                             ].map((item, i) => (
                                 <li key={i} className="flex items-center gap-3 text-green-800 font-bold">
                                     <div className="h-6 w-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center text-xs">✓</div> {item}
                                 </li>
                             ))}
                         </ul>
                     </div>
                 </div>
             </div>
        </div>

        {/* Auto Slider Testimonials (Not Marquee) */}
        <div id="testimonials" className="bg-slate-900 py-20 overflow-hidden relative border-y border-slate-800">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-900/20 rounded-full blur-[100px]"></div>

            <div className="max-w-7xl mx-auto px-4 mb-12 text-center relative z-10 reveal opacity-0">
                <h2 className="text-3xl font-bold text-white mb-2">Trusted by Libraries Across Maharashtra</h2>
                <p className="text-slate-400">Join 500+ owners from Pune, Nashik, Aurangabad & more.</p>
            </div>
            
            {/* Slider Container */}
            <div className="max-w-7xl mx-auto px-4 relative reveal opacity-0">
                <div 
                    ref={scrollRef}
                    className="flex gap-8 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-4"
                    onMouseEnter={() => isPaused.current = true}
                    onMouseLeave={() => isPaused.current = false}
                >
                    {testimonials.map((t, i) => (
                        <div key={i} className="min-w-[300px] md:min-w-[400px] snap-center flex-shrink-0 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800 transition-colors cursor-default flex flex-col justify-between">
                             <div>
                                 <div className="flex items-center gap-2 mb-4">
                                     <div className="bg-orange-500/20 p-2 rounded-full">
                                         <MapPin className="h-4 w-4 text-orange-500" />
                                     </div>
                                     <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">{t.city}</span>
                                 </div>
                                 <p className="font-marathi text-lg text-slate-200 leading-relaxed mb-6 italic">"{t.text}"</p>
                             </div>
                             <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {t.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{t.name}</p>
                                    <p className="text-xs text-slate-400">{t.role}</p>
                                </div>
                             </div>
                        </div>
                    ))}
                    {/* Extra padding to ensuring last element is visible nicely */}
                    <div className="min-w-[20px] md:min-w-[0px]"></div>
                </div>
                {/* Visual Cue for Scroll */}
                <div className="flex justify-center mt-6 gap-2">
                     <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 animate-pulse w-1/2"></div>
                     </div>
                </div>
            </div>
        </div>

        {/* Contact Form Section */}
        <div id="contact" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="reveal opacity-0">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-6">Get in touch with us</h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Interested in digitizing your library? Have questions about pricing or features? 
                            Fill out the form and our team will contact you shortly.
                        </p>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Email Us</h4>
                                    <p className="text-slate-500">nishatechx@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Call Us</h4>
                                    <p className="text-slate-500">+91 9699658462</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-green-100 p-3 rounded-lg text-green-600">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Office</h4>
                                    <p className="text-slate-500">Nisha Tech Solutions,<br/>Civil Lines, Washim - 444505.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-xl reveal opacity-0">
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you! We will contact you soon.'); }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Name</label>
                                    <Input placeholder="Your Name" required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700">Mobile</label>
                                    <Input placeholder="Mobile Number" required />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Library Name</label>
                                <Input placeholder="e.g. Saraswati Library" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">City</label>
                                <Input placeholder="e.g. Pune" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700">Message</label>
                                <textarea className="w-full border rounded-md p-3 text-sm h-24 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Tell us about your requirements..."></textarea>
                            </div>
                            <Button type="submit" className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800">Send Message</Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 reveal opacity-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-auto flex items-center justify-center">
                        <img src={LOGO_URL} className="w-full h-full object-contain"/>
                    </div>
                </div>
                <div className="flex gap-6 text-sm font-medium">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
                    <a href="#contact" className="hover:text-white transition-colors">Contact</a>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-center items-center text-sm">
                <div className="text-center w-full">
                    <p className="text-white font-medium mb-1">
                        Powered by Nish Tech Solutions
                    </p>
                    <p className="opacity-60">© 2026 All Rights Reserved.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

// --- Login Page (Glassmorphism) ---
export const Login = ({ onLogin }: { onLogin: (u: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
        const user = await Store.login(email, password, false);
        onLogin(user);
        const profile = Store.getProfile();
        navigate(profile ? '/dashboard' : '/onboarding');
    } catch (e: any) {
        setLoading(false); 
        if (e.message === 'EMAIL_NOT_VERIFIED') {
            setError("Your email is not verified yet. Please check your inbox and click the verification link.");
        } else {
            setError("Invalid credentials. Please check your username and password.");
        }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background Image */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                backgroundImage: `url('${LOGIN_BG_URL}')`,
            }}
        >
            {/* Dark Overlay for better contrast */}
            <div className="absolute inset-0 bg-black/40"></div>
        </div>

      <div className="relative z-10 w-full max-w-sm p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-fade-in-up">
        <div className="text-center mb-8">
            <img src={HERO_LOGO_URL} className="h-12 w-auto mx-auto mb-6 drop-shadow-md" alt="Logo" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
            <div className="space-y-1">
                <input 
                    type="text"
                    placeholder="Username or Email"
                    className="w-full h-12 px-4 bg-white/80 border border-white/30 rounded-xl text-slate-900 placeholder:text-slate-500 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-1">
                <input 
                    type="password"
                    placeholder="Password"
                    className="w-full h-12 px-4 bg-white/80 border border-white/30 rounded-xl text-slate-900 placeholder:text-slate-500 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            {error && (
                <div className="text-xs font-bold text-red-100 bg-red-500/50 p-3 rounded-lg border border-red-500/50 text-center backdrop-blur-sm">
                    {error}
                </div>
            )}

            <Button className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 border border-orange-500/50" isLoading={loading}>
                Sign In
            </Button>
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => navigate('/')} className="text-xs font-bold text-white/70 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto">
                <ArrowLeft className="h-3 w-3" /> Back
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Onboarding Page ---
export const Onboarding = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Partial<LibraryProfile>>({ totalSeats: 50 });

  const handleSave = async () => {
    if (!data.name || !data.address) return alert("Please fill required fields");
    await Store.saveProfile(data as LibraryProfile);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Setup your Library</h2>
            <p className="mt-2 text-slate-600">Let's get your digital profile ready.</p>
        </div>

        <Card className="p-8 shadow-xl border-slate-200">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Library Name</label>
                    <Input 
                        placeholder="e.g. Saraswati Study Point" 
                        value={data.name || ''} 
                        onChange={e => setData({...data, name: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <Input 
                        placeholder="Area, City" 
                        value={data.address || ''} 
                        onChange={e => setData({...data, address: e.target.value})} 
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contact Number</label>
                    <Input 
                        placeholder="+91 9999999999" 
                        value={data.contact || ''} 
                        onChange={e => setData({...data, contact: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Total Seats</label>
                    <Input 
                        type="number" 
                        placeholder="50" 
                        value={data.totalSeats} 
                        onChange={e => setData({...data, totalSeats: parseInt(e.target.value)})} 
                    />
                </div>
                <Button className="w-full" onClick={handleSave}>Complete Setup</Button>
            </div>
        </Card>
      </div>
    </div>
  );
};
