
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
  Globe
} from 'lucide-react';
import { LibraryProfile } from '../types';

const LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGrS0W_C2fEoxXrGD9yVHhOSlX5uy_gZgATDGGFEKQMvAdczkaY8odZof1-WHMQbOTiACJ1zRGLmw6vn4jpXboQJ1Te52ep9ngIfBVXB1BBWzhX9Cjv0PzRG5OXr5hPjf9hg24ekO2JITnXCMLIdS5K_qwCyZjI_0Q6w1i0Crf5GTJCzj9F_rWDYDJURo/s16000/Digital%20Abhyasika%20Logo.png";
const HERO_LOGO_URL = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGrS0W_C2fEoxXrGD9yVHhOSlX5uy_gZgATDGGFEKQMvAdczkaY8odZof1-WHMQbOTiACJ1zRGLmw6vn4jpXboQJ1Te52ep9ngIfBVXB1BBWzhX9Cjv0PzRG5OXr5hPjf9hg24ekO2JITnXCMLIdS5K_qwCyZjI_0Q6w1i0Crf5GTJCzj9F_rWDYDJURo/s16000/Digital%20Abhyasika%20Logo.png";

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

// 2. Feature Orbit Animation
const FeatureOrbit = () => {
    const features = [
        { icon: Users, label: "Registration", color: "bg-blue-600" },
        { icon: LayoutDashboard, label: "Seats Mgmt", color: "bg-green-600" },
        { icon: IndianRupee, label: "Fees Mgmt", color: "bg-amber-600" },
        { icon: BellRing, label: "Reminders", color: "bg-red-600" },
        { icon: Database, label: "Database", color: "bg-purple-600" },
        { icon: PieChart, label: "Reports", color: "bg-pink-600" },
        { icon: Receipt, label: "Receipts", color: "bg-indigo-600" },
        { icon: TrendingUp, label: "Growth", color: "bg-orange-600" },
    ];

    return (
        <div className="relative w-[350px] h-[350px] md:w-[450px] md:h-[450px] mx-auto hidden lg:block">
            {/* Center Core */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-40 h-40 rounded-full flex flex-col items-center justify-center z-20 relative animate-float overflow-hidden">
                    <img src={HERO_LOGO_URL} alt="App Logo" className="w-full h-full object-contain" />
                </div>
                 {/* Pulse Effect */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-orange-500 rounded-full opacity-10 animate-ping z-10"></div>
            </div>

            {/* Orbit Ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-slate-300 animate-spin-slow">
                {features.map((feat, index) => {
                    // Calculate position on circle
                    const angle = (index / features.length) * 2 * Math.PI;
                    const radius = 48; // Percentage
                    const left = 50 + radius * Math.cos(angle) + '%';
                    const top = 50 + radius * Math.sin(angle) + '%';
                    
                    return (
                        <div 
                            key={index}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left, top }}
                        >
                            {/* Counter rotate to keep text upright */}
                            <div className="animate-reverse-spin flex flex-col items-center gap-1 hover:scale-110 transition-transform cursor-pointer">
                                <div className={`${feat.color} text-white p-2.5 rounded-xl shadow-lg border-2 border-white`}>
                                    <feat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-100">
                                    {feat.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Decorative Background Blobs */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-100 rounded-full blur-xl opacity-60 mix-blend-multiply animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-100 rounded-full blur-xl opacity-60 mix-blend-multiply animate-float" style={{animationDelay: '2s'}}></div>
        </div>
    );
};

// --- Landing Page ---
export const Landing = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPaused = useRef(false);

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
      <header className="fixed w-full bg-[#061525]/95 backdrop-blur-md z-50 border-b border-slate-800 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-16 w-auto flex items-center justify-center">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
            </div>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
              <a href="#" className="hover:text-white transition-colors">Home</a>
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/login')} className="shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 border-none">
                Login / Admin Access
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <div className="relative pb-10 pt-10 lg:pb-20 lg:pt-20">
           {/* Background Decoration */}
           <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-orange-50/80 to-transparent"></div>
              <div className="absolute top-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-green-50/30 rounded-full blur-3xl opacity-40"></div>
           </div>

           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                  
                  {/* Left Column: Text */}
                  <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in-up">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-sm font-bold mb-2 shadow-sm">
                         <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
                         Maharashtra's #1 Choice
                      </div>

                      <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                        Automate Your <br/>
                        <Typewriter />
                      </h1>
                      
                      <p className="text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Say goodbye to registers and Excel sheets. Manage admissions, fees, and seat allocation from your phone with zero effort.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                         <Button size="lg" onClick={() => navigate('/login')} className="w-full sm:w-auto px-8 h-14 text-lg bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 hover:translate-y-[-2px] transition-transform">
                           Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                         </Button>
                      </div>
                      
                      <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium pt-4">
                          <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-green-600" /> Secure Data</span>
                          <span className="flex items-center gap-1"><Users className="h-4 w-4 text-blue-600" /> Unlimited Students</span>
                          <span className="flex items-center gap-1"><IndianRupee className="h-4 w-4 text-orange-600" /> Affordable</span>
                      </div>
                  </div>

                  {/* Right Column: Orbit Animation */}
                  <div className="flex-1 w-full flex justify-center lg:justify-end">
                      <FeatureOrbit />
                  </div>
              </div>
           </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white border-y border-slate-200 py-12">
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
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features for Growth</h2>
              <div className="h-1 w-20 bg-orange-500 mx-auto rounded-full mb-4"></div>
              <p className="text-slate-600 text-lg">Everything you need to run your Abhyasika efficiently.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div id="reviews" className="bg-slate-900 py-20 overflow-hidden relative border-y border-slate-800">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-900/20 rounded-full blur-[100px]"></div>

            <div className="max-w-7xl mx-auto px-4 mb-12 text-center relative z-10">
                <h2 className="text-3xl font-bold text-white mb-2">Trusted by Libraries Across Maharashtra</h2>
                <p className="text-slate-400">Join 500+ owners from Pune, Nashik, Aurangabad & more.</p>
            </div>
            
            {/* Slider Container */}
            <div className="max-w-7xl mx-auto px-4 relative">
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
                    <div>
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
                                    <p className="text-slate-500">support@digitalabhyasika.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                                    <Smartphone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Call Us</h4>
                                    <p className="text-slate-500">+91 99999 99999</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-green-100 p-3 rounded-lg text-green-600">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Office</h4>
                                    <p className="text-slate-500">Pune, Maharashtra, India</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-xl">
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
      
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-auto flex items-center justify-center">
                        <img src={LOGO_URL} className="w-full h-full object-contain"/>
                    </div>
                </div>
                <div className="flex gap-6 text-sm font-medium">
                    <a href="#features" className="hover:text-white transition-colors">Features</a>
                    <a href="#reviews" className="hover:text-white transition-colors">Reviews</a>
                    <a href="#contact" className="hover:text-white transition-colors">Contact</a>
                </div>
            </div>
            <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-center items-center text-sm">
                <div className="text-center w-full">
                    <p className="text-white font-medium mb-1">
                        Powered by <a href="https://www.nishatech.in" target="_blank" className="text-orange-500 hover:text-orange-400 transition-colors">Nish Tech</a>
                    </p>
                    <p className="opacity-60">© 2024 All Rights Reserved.</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

// --- Login Page (Standard) ---
export const Login = ({ onLogin }: { onLogin: (u: any) => void }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successUser, setSuccessUser] = useState<any>(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
        const user = await Store.login(email, password, false);
        
        // Success Logic
        setSuccessUser(user);
        setShowSuccess(true);
        
        // Delay Navigation to show animation
        setTimeout(() => {
            onLogin(user);
            const profile = Store.getProfile();
            navigate(profile ? '/dashboard' : '/onboarding');
        }, 2200);

    } catch (e: any) {
        setLoading(false); 
        if (e.message === 'EMAIL_NOT_VERIFIED') {
            setError("Your email is not verified yet. Please check your inbox and click the verification link.");
        } else {
            setError("Invalid credentials. Please check your username and password.");
        }
    }
  };

  const handleResend = async () => {
      setLoading(true);
      setError('');
      try {
          await Store.resendVerification(email, password);
          alert("Verification email sent! Please check your inbox (and spam folder).");
          setError("Verification email sent! Please check your inbox (and spam folder).");
      } catch(e: any) {
          setError("Failed to resend: " + e.message);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* SUCCESS ANIMATION OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] bg-[#061525] flex flex-col items-center justify-center animate-fade-in-up">
            <div className="scale-150 mb-8 p-4 rounded-full bg-green-500/10 border-4 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.4)]">
                <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-xl text-slate-400 font-medium">{successUser?.displayName || 'Admin'}</p>
            
            <div className="mt-12 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-[bounce_1s_infinite_0ms]"></div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-[bounce_1s_infinite_200ms]"></div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-[bounce_1s_infinite_400ms]"></div>
            </div>
        </div>
      )}

      {/* Back Button (Top Left) */}
      <button 
        onClick={() => navigate('/')} 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="h-5 w-5" /> Back to Home
      </button>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-900/20 rounded-full blur-3xl opacity-50 animate-float"></div>
          <div className="absolute bottom-[0%] left-[0%] w-[400px] h-[400px] bg-orange-900/20 rounded-full blur-3xl opacity-50 animate-float" style={{animationDelay: '1.5s'}}></div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#061525] py-10 px-6 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border border-slate-800">
          
          {/* Logo Section - No Background Container */}
          <div className="flex justify-center mb-8">
            <div className="h-32 w-auto flex items-center justify-center">
              <img src={HERO_LOGO_URL} className="h-full w-auto object-contain" alt="App Logo" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username / Email</label>
                <input 
                    className="flex h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input 
                    type="password"
                    className="flex h-11 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                />
            </div>
            
            {error && (
                <div className="text-red-400 text-sm font-bold bg-red-900/20 p-3 rounded border border-red-900/50 break-words">
                    {error}
                    {error.includes("not verified") && (
                        <button onClick={handleResend} className="mt-2 text-xs text-red-300 hover:text-white underline">
                            Resend Verification Email
                        </button>
                    )}
                </div>
            )}

            <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white font-bold h-12 shadow-lg shadow-orange-900/20 border-none" onClick={handleLogin} isLoading={loading}>Sign In</Button>

            <div className="text-center mt-6 pt-4 border-t border-slate-800">
                <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-white font-medium transition-colors">
                    ← Back to Landing Page
                </button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-600">
             By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

// --- Onboarding Page ---
export const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
