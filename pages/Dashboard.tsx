
import React, { useEffect, useState, useRef } from 'react';
import { Store } from '../services/store';
import { StatCard, Card, Badge, Button, Modal, Input } from '../components/ui';
import { Users, Armchair, IndianRupee, AlertCircle, UserPlus, Wallet, ClipboardCheck, Search, Clock, Camera, ScanLine, ArrowLeft, RefreshCw, CheckCircle, QrCode } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Student, Seat, Attendance } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

// --- Scanner Overlay Component ---
const ScannerOverlay = ({ onClose }: { onClose: () => void }) => {
    const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
    const [selectedCameraId, setSelectedCameraId] = useState<string>('');
    const [scanResult, setScanResult] = useState<{ msg: string; type: 'success' | 'error'; student?: Student; status?: string } | null>(null);
    const [isScanningState, setIsScanningState] = useState(false); // UI state
    const [time, setTime] = useState(new Date());

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length) {
                setCameras(devices);
                setSelectedCameraId(devices[devices.length - 1].id);
            }
        }).catch(err => console.error("Camera Error", err));

        return () => {
            clearInterval(timer);
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                if (scanner.isScanning) {
                     scanner.stop()
                        .then(() => scanner.clear())
                        .catch((err) => console.warn("Cleanup error:", err));
                } else {
                     scanner.clear().catch(() => {});
                }
            }
        };
    }, []);

    useEffect(() => {
        if (!selectedCameraId) return;

        const startScanner = async () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                    await scannerRef.current.clear();
                } catch (e) {
                    console.warn("Failed to clear previous scanner", e);
                }
            }
            if(!document.getElementById("reader-overlay")) return;

            const html5QrCode = new Html5Qrcode("reader-overlay");
            scannerRef.current = html5QrCode;

            try {
                await html5QrCode.start(
                    selectedCameraId,
                    {
                        fps: 10,
                        qrbox: { width: 280, height: 280 },
                        aspectRatio: 1.0,
                        disableFlip: false
                    },
                    (decodedText) => handleScan(decodedText),
                    (errorMessage) => { /* ignore */ }
                );
                setIsScanningState(true);
            } catch (err) {
                console.error("Start Error", err);
                setIsScanningState(false);
            }
        };

        const t = setTimeout(startScanner, 100);
        return () => clearTimeout(t);
    }, [selectedCameraId]);

    const playBeep = () => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); 
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
        } catch(e) { console.error("Audio beep failed", e); }
    };

    const handleScan = async (decodedText: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        if (scannerRef.current && scannerRef.current.isScanning) scannerRef.current.pause();
        const parts = decodedText.split('|');
        const studentId = parts[0];
        const students = Store.getStudents();
        const student = students.find(s => s.id === studentId);

        if (student) {
            playBeep();
            const today = format(new Date(), 'yyyy-MM-dd');
            const records = Store.getAttendance();
            const lastRecord = records.find(r => r.studentId === studentId && r.date === today);
            const newStatus = lastRecord?.status === 'IN' ? 'OUT' : 'IN';
            const record: Attendance = {
                id: `att-${Date.now()}`,
                studentId: student.id,
                studentName: student.fullName,
                date: today,
                time: format(new Date(), 'HH:mm'),
                status: newStatus
            };
            await Store.addAttendance(record);
            setScanResult({ msg: `Marked ${newStatus}`, type: 'success', student, status: newStatus });
        } else {
            setScanResult({ msg: 'Invalid ID Card', type: 'error' });
        }

        setTimeout(() => {
            setScanResult(null);
            isProcessingRef.current = false;
            if (scannerRef.current && scannerRef.current.isScanning) { 
                 try { scannerRef.current.resume(); } catch(e) {}
            }
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col text-white animate-zoom-in">
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-md sticky top-0">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors active:scale-95">
                        <ArrowLeft className="h-6 w-6 text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <ScanLine className="text-green-500 animate-pulse h-5 w-5"/> Scanner
                        </h2>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">In/Out Terminal</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-mono font-bold text-green-400 leading-none">{format(time, 'hh:mm:ss a')}</div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-6 overflow-y-auto">
                <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700/50">
                    <div id="reader-overlay" className="w-full h-full"></div>
                    {isScanningState && !scanResult && (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_25px_rgba(34,197,94,1)] z-10 animate-scan"></div>
                            <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 border-green-500 rounded-tl-xl z-20 opacity-80"></div>
                            <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 border-green-500 rounded-tr-xl z-20 opacity-80"></div>
                            <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 border-green-500 rounded-bl-xl z-20 opacity-80"></div>
                            <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 border-green-500 rounded-br-xl z-20 opacity-80"></div>
                        </>
                    )}
                    {scanResult && (
                        <div className="absolute inset-0 bg-slate-900/98 z-30 flex flex-col items-center justify-center p-6 animate-zoom-in text-center">
                            {scanResult.type === 'success' ? (
                                <>
                                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-900/40 transform scale-110">
                                        <CheckCircle className="h-12 w-12 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{scanResult.student?.fullName}</h3>
                                    <div className={`text-xl font-extrabold uppercase tracking-[0.2em] mb-4 ${scanResult.status === 'IN' ? 'text-green-400' : 'text-orange-400'}`}>
                                        Marked {scanResult.status}
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
                                        Time: {format(new Date(), 'hh:mm a')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mb-6">
                                        <AlertCircle className="h-10 w-10 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Scan Failed</h3>
                                    <p className="text-red-400 text-sm font-medium">{scanResult.msg}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="w-full max-w-sm bg-slate-800/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-700/50 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                         <Camera className="h-4 w-4 text-primary-400" />
                         <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Hardware Interface</label>
                    </div>
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-900/80 text-white border border-slate-600 rounded-xl p-3.5 text-sm appearance-none focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={selectedCameraId}
                            onChange={(e) => setSelectedCameraId(e.target.value)}
                        >
                            {cameras.map(cam => (
                                <option key={cam.id} value={cam.id}>{cam.label || `Lense ${cam.id.slice(0,5)}`}</option>
                            ))}
                        </select>
                        <RefreshCw className="absolute right-4 top-4 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    occupiedSeats: 0,
    totalSeats: 0,
    monthlyCollection: 0,
    totalDues: 0
  });
  const [seats, setSeats] = useState<Seat[]>([]);
  const [recentJoiners, setRecentJoiners] = useState<Student[]>([]);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualAttendanceOpen, setIsManualAttendanceOpen] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initDashboard = async () => {
        // Run expiry check first
        await Store.checkExpirations();
        
        // Then load data
        const studentsData = Store.getStudents();
        const seatsData = Store.getSeats();
        const payments = Store.getPayments();
        
        const totalSeats = seatsData.length;
        const occupiedSeats = seatsData.filter(s => s.status === 'OCCUPIED').length;
        const totalDues = studentsData.reduce((acc, s) => acc + (s.dues || 0), 0);
        const monthlyCollection = payments.reduce((acc, p) => acc + p.amount, 0);

        setStats({ totalStudents: studentsData.length, occupiedSeats, totalSeats, monthlyCollection, totalDues });
        setSeats(seatsData);
        setStudents(studentsData);
        setRecentJoiners(studentsData.slice(-5).reverse());
        setAttendanceRecords(Store.getAttendance());
    };

    initDashboard();
  }, [isManualAttendanceOpen, isScannerOpen]);


  const handleAttendance = async (student: Student, status: 'IN' | 'OUT') => {
      const record: Attendance = {
          id: `att-${Date.now()}`,
          studentId: student.id,
          studentName: student.fullName,
          date: format(new Date(), 'yyyy-MM-dd'),
          time: format(new Date(), 'HH:mm'),
          status
      };
      await Store.addAttendance(record);
      setAttendanceRecords(Store.getAttendance()); 
  };

  const getLatestStatus = (studentId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const records = attendanceRecords.filter(r => r.studentId === studentId && r.date === today);
      if (records.length === 0) return null;
      return records[0]; 
  };

  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedSeats },
    { name: 'Available', value: Math.max(0, stats.totalSeats - stats.occupiedSeats) },
  ];
  const COLORS = ['#1D4ED8', '#e2e8f0']; 

  const filteredStudents = students.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.mobile.includes(searchQuery)
  );

  if (isScannerOpen) {
      return <ScannerOverlay onClose={() => setIsScannerOpen(false)} />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      
      {/* Quick Actions - Super Responsive Wrap */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mt-2">
          <Button icon={UserPlus} onClick={() => navigate('/students', { state: { openAdmission: true } })} className="flex-1 sm:flex-none shadow-lg shadow-primary-700/20 py-5 sm:py-2 px-6">
              Admission
          </Button>
          <Button variant="secondary" icon={Wallet} onClick={() => navigate('/finance', { state: { openCollection: true } })} className="flex-1 sm:flex-none py-5 sm:py-2 px-6">
              Collect
          </Button>
          <Button 
            variant="accent" 
            icon={QrCode} 
            onClick={() => setIsScannerOpen(true)} 
            className="w-full sm:w-auto shadow-lg shadow-accent-500/20 py-5 sm:py-2 px-6"
          >
              Mark Attendance
          </Button>
          <Button variant="outline" icon={ClipboardCheck} onClick={() => setIsManualAttendanceOpen(true)} className="w-full sm:w-auto bg-white hover:bg-slate-50 border-slate-200 py-5 sm:py-2 px-6">
              Manual Log
          </Button>
      </div>

      {/* Stats - Column Grid Responsiveness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div onClick={() => navigate('/students')} className="cursor-pointer active:scale-95 transition-transform">
            <StatCard label="Total Students" value={stats.totalStudents} icon={Users} color="blue" trend="+2 New Admissions" trendUp />
        </div>
        <div onClick={() => navigate('/seats')} className="cursor-pointer active:scale-95 transition-transform">
            <StatCard label="Occupancy" value={`${stats.occupiedSeats}/${stats.totalSeats}`} icon={Armchair} color="green" trend="Total Seats" trendUp />
        </div>
        <div onClick={() => navigate('/students')} className="cursor-pointer active:scale-95 transition-transform">
            <StatCard label="Total Dues" value={`₹${stats.totalDues}`} icon={AlertCircle} trend="Urgent Collection" color="tomato" />
        </div>
        <div onClick={() => navigate('/finance')} className="cursor-pointer active:scale-95 transition-transform">
            <StatCard label="Collections" value={`₹${stats.monthlyCollection}`} icon={IndianRupee} trend="This Month" trendUp color="orange" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Card - Height adjusts per screen */}
        <Card title="Seat Utilization" className="col-span-1 min-h-[350px]">
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-700 shadow-sm shadow-primary-700/50"></div> Occupied ({stats.occupiedSeats})
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div> Available ({Math.max(0, stats.totalSeats - stats.occupiedSeats)})
            </div>
          </div>
        </Card>

        {/* Table - Optimized for overflow */}
        <Card title="Recent Activity" className="col-span-1 lg:col-span-2 overflow-hidden">
           <div className="overflow-x-auto -mx-6 sm:mx-0">
             <div className="inline-block min-w-full align-middle">
               <table className="min-w-full text-left text-sm text-slate-600">
                 <thead className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-400 tracking-widest border-y border-slate-100">
                   <tr>
                     <th className="px-6 py-4">Student</th>
                     <th className="px-6 py-4">Allotted</th>
                     <th className="px-6 py-4 hidden sm:table-cell">Plan</th>
                     <th className="px-6 py-4 text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {recentJoiners.length > 0 ? recentJoiners.map(s => (
                     <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                       <td className="px-6 py-4">
                           <div className="font-bold text-slate-900">{s.fullName}</div>
                           <div className="text-[10px] text-slate-400 font-medium sm:hidden">{s.planType}</div>
                       </td>
                       <td className="px-6 py-4 text-primary-700 font-extrabold text-sm">{s.seatId || 'NONE'}</td>
                       <td className="px-6 py-4 hidden sm:table-cell font-medium">{s.planType}</td>
                       <td className="px-6 py-4 text-right">
                         <Badge variant={s.status === 'ACTIVE' ? 'success' : 'error'}>{s.status}</Badge>
                       </td>
                     </tr>
                   )) : (
                       <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No recent admissions found</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </Card>
      </div>

      {/* Manual Attendance Modal - Adaptive Sizing */}
      <Modal isOpen={isManualAttendanceOpen} onClose={() => setIsManualAttendanceOpen(false)} title="Manual Log Terminal">
           <div className="flex flex-col h-[75vh] sm:h-[60vh] w-full min-w-0">
               <div className="flex-1 flex flex-col min-h-0">
                   <div className="relative mb-4 flex-shrink-0">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input className="pl-10 h-11 rounded-xl border-slate-200" placeholder="Search by name/mobile..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                   </div>
                   
                   <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                       {filteredStudents.length > 0 ? filteredStudents.map(student => {
                           const lastRecord = getLatestStatus(student.id);
                           const isPresent = lastRecord?.status === 'IN';

                           return (
                               <div key={student.id} className="flex items-center justify-between p-4 bg-white active:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-all">
                                   <div className="min-w-0 flex-1 mr-4">
                                       <p className="font-bold text-slate-900 truncate leading-tight">{student.fullName}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 uppercase">{student.seatId || 'Waitlist'}</span>
                                            {lastRecord && (
                                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5"/> {lastRecord.time}
                                                </span>
                                            )}
                                       </div>
                                   </div>
                                   <div className="flex-shrink-0">
                                       {isPresent ? (
                                           <Button size="sm" variant="danger" className="rounded-lg px-4" onClick={() => handleAttendance(student, 'OUT')}>OUT</Button>
                                       ) : (
                                           <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700 rounded-lg px-4" onClick={() => handleAttendance(student, 'IN')}>IN</Button>
                                       )}
                                   </div>
                               </div>
                           );
                       }) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400">
                               <Users className="h-10 w-10 mb-2 opacity-10" />
                               <p className="text-xs font-medium uppercase tracking-widest">No match found</p>
                           </div>
                       )}
                   </div>
               </div>
           </div>
      </Modal>
    </div>
  );
};
