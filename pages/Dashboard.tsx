
import React, { useEffect, useState, useRef } from 'react';
import { Store } from '../services/store';
import { StatCard, Card, Badge, Button, Modal, Input } from '../components/ui';
import { Users, Armchair, IndianRupee, AlertCircle, UserPlus, Wallet, ClipboardCheck, Search, Clock, Camera, List, X, ScanLine, QrCode, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
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
        
        // Initialize Cameras
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length) {
                setCameras(devices);
                // Default to last camera (usually back camera)
                setSelectedCameraId(devices[devices.length - 1].id);
            }
        }).catch(err => console.error("Camera Error", err));

        return () => {
            clearInterval(timer);
            // Robust cleanup
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

    // Start/Restart Scanner when camera changes
    useEffect(() => {
        if (!selectedCameraId) return;

        const startScanner = async () => {
            // 1. Cleanup existing instance properly
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

            // 2. Create new instance
            // Ensure element exists
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

    const handleScan = async (decodedText: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.pause();
        }

        // 1. Process Code
        const parts = decodedText.split('|');
        const studentId = parts[0];
        const students = Store.getStudents();
        const student = students.find(s => s.id === studentId);

        if (student) {
            // 2. Logic
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

            setScanResult({
                msg: `Marked ${newStatus}`,
                type: 'success',
                student,
                status: newStatus
            });
        } else {
            setScanResult({ msg: 'Invalid ID Card', type: 'error' });
        }

        // 3. Resume
        setTimeout(() => {
            setScanResult(null);
            isProcessingRef.current = false;
            if (scannerRef.current && scannerRef.current.isScanning) { 
                 try { scannerRef.current.resume(); } catch(e) {}
            }
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col text-white animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft className="h-6 w-6 text-slate-400" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ScanLine className="text-green-500 animate-pulse"/> Attendance Scanner
                        </h2>
                        <p className="text-xs text-slate-400">Ready to Scan</p>
                    </div>
                </div>
                <div className="text-right hidden sm:block">
                    <div className="text-2xl font-mono font-bold text-green-400">{format(time, 'hh:mm:ss a')}</div>
                    <div className="text-xs text-slate-500">{format(time, 'EEEE, dd MMMM yyyy')}</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                {/* Scanner Frame */}
                <div className="relative w-full max-w-md aspect-square bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700">
                    <div id="reader-overlay" className="w-full h-full"></div>
                    
                    {/* Green Laser Animation */}
                    {isScanningState && !scanResult && (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)] z-10 animate-scan"></div>
                            {/* Corners */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-green-500 rounded-tl-lg z-20"></div>
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-green-500 rounded-tr-lg z-20"></div>
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-green-500 rounded-bl-lg z-20"></div>
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-green-500 rounded-br-lg z-20"></div>
                        </>
                    )}

                    {/* Result Overlay */}
                    {scanResult && (
                        <div className="absolute inset-0 bg-slate-900/95 z-30 flex flex-col items-center justify-center p-6 animate-zoom-in text-center">
                            {scanResult.type === 'success' ? (
                                <>
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-900/50">
                                        <CheckCircle className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1">{scanResult.student?.fullName}</h3>
                                    <div className="text-green-400 text-xl font-bold uppercase tracking-widest mb-4">
                                        Marked {scanResult.status}
                                    </div>
                                    <p className="text-slate-500 text-sm">
                                        Seat: {scanResult.student?.seatId || 'N/A'} • {format(new Date(), 'hh:mm a')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Scan Failed</h3>
                                    <p className="text-slate-400 mt-2">{scanResult.msg}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Camera Selector */}
                <div className="w-full max-w-md bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                        <Camera className="h-3 w-3" /> Select Camera
                    </label>
                    <div className="relative">
                        <select 
                            className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-green-500 outline-none"
                            value={selectedCameraId}
                            onChange={(e) => setSelectedCameraId(e.target.value)}
                        >
                            {cameras.map(cam => (
                                <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.slice(0,5)}`}</option>
                            ))}
                        </select>
                        <RefreshCw className="absolute right-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
  const [time, setTime] = useState(new Date());

  // View States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualAttendanceOpen, setIsManualAttendanceOpen] = useState(false);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const studentsData = Store.getStudents();
    const seatsData = Store.getSeats();
    const payments = Store.getPayments();
    
    // Calculate stats
    const totalSeats = seatsData.length;
    const occupiedSeats = seatsData.filter(s => s.status === 'OCCUPIED').length;
    const totalDues = studentsData.reduce((acc, s) => acc + (s.dues || 0), 0);
    const monthlyCollection = payments.reduce((acc, p) => acc + p.amount, 0);

    setStats({
      totalStudents: studentsData.length,
      occupiedSeats,
      totalSeats,
      monthlyCollection,
      totalDues
    });
    setSeats(seatsData);
    setStudents(studentsData);
    setRecentJoiners(studentsData.slice(-5).reverse());
    setAttendanceRecords(Store.getAttendance());

    // Clock
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isManualAttendanceOpen, isScannerOpen]); // Refresh stats when modes close


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
      setAttendanceRecords(Store.getAttendance()); // Refresh
  };

  const getLatestStatus = (studentId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const records = attendanceRecords.filter(r => r.studentId === studentId && r.date === today);
      if (records.length === 0) return null;
      return records[0]; 
  };

  // Blue for occupied, slate for empty
  const occupancyData = [
    { name: 'Occupied', value: stats.occupiedSeats },
    { name: 'Available', value: stats.totalSeats - stats.occupiedSeats },
  ];
  const COLORS = ['#1D4ED8', '#e2e8f0']; // Blue-700, Slate-200

  const filteredStudents = students.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.mobile.includes(searchQuery)
  );

  // --- RENDER SCANNER OVERLAY IF ACTIVE ---
  if (isScannerOpen) {
      return <ScannerOverlay onClose={() => setIsScannerOpen(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
           <p className="text-slate-500">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
             <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 font-mono text-lg font-semibold text-slate-700 hidden md:block">
                {format(time, 'hh:mm:ss a')}
             </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
          <Button icon={UserPlus} onClick={() => navigate('/students', { state: { openAdmission: true } })} className="shadow-md shadow-primary-700/20">
              Add Candidate
          </Button>
          <Button variant="secondary" icon={Wallet} onClick={() => navigate('/finance', { state: { openCollection: true } })}>
              Collect Fees
          </Button>
          <Button 
            variant="accent" // Accent Orange
            icon={QrCode} 
            onClick={() => setIsScannerOpen(true)} 
            className="shadow-md shadow-accent-500/20"
          >
              Mark Attendance
          </Button>
          <Button variant="outline" icon={ClipboardCheck} onClick={() => setIsManualAttendanceOpen(true)} className="bg-white hover:bg-slate-50">
              Manual Attendance
          </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Students" value={stats.totalStudents} icon={Users} trend="+2 this week" trendUp color="blue" />
        <StatCard label="Occupancy" value={`${stats.occupiedSeats}/${stats.totalSeats}`} icon={Armchair} color="green" />
        <StatCard label="Total Dues" value={`₹${stats.totalDues}`} icon={AlertCircle} trend="Action needed" color="tomato" />
        <StatCard label="Collections" value={`₹${stats.monthlyCollection}`} icon={IndianRupee} trend="+12% vs last month" trendUp color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Seat Utilization" className="col-span-1 min-h-[300px]">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occupancyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-700"></div> Occupied ({stats.occupiedSeats})
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200"></div> Available ({stats.totalSeats - stats.occupiedSeats})
            </div>
          </div>
        </Card>

        <Card title="Recent Admissions" className="col-span-1 lg:col-span-2">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-slate-600">
               <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                 <tr>
                   <th className="px-4 py-3">Name</th>
                   <th className="px-4 py-3">Seat</th>
                   <th className="px-4 py-3">Plan</th>
                   <th className="px-4 py-3">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {recentJoiners.length > 0 ? recentJoiners.map(s => (
                   <tr key={s.id}>
                     <td className="px-4 py-3 font-medium text-slate-900">{s.fullName}</td>
                     <td className="px-4 py-3 text-primary-700 font-bold">{s.seatId || '-'}</td>
                     <td className="px-4 py-3">{s.planType}</td>
                     <td className="px-4 py-3">
                       <Badge variant={s.status === 'ACTIVE' ? 'success' : 'error'}>{s.status}</Badge>
                     </td>
                   </tr>
                 )) : (
                     <tr><td colSpan={4} className="p-4 text-center">No recent activity</td></tr>
                 )}
               </tbody>
             </table>
           </div>
        </Card>
      </div>

      {/* Manual Attendance Modal */}
      <Modal isOpen={isManualAttendanceOpen} onClose={() => setIsManualAttendanceOpen(false)} title="Manual Attendance Log">
           <div className="flex flex-col h-[70vh] w-full">
               <div className="flex-1 flex flex-col min-h-0">
                   <div className="relative mb-3 flex-shrink-0">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input className="pl-9" placeholder="Search student..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                   </div>
                   
                   <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                       {filteredStudents.length > 0 ? filteredStudents.map(student => {
                           const lastRecord = getLatestStatus(student.id);
                           const isPresent = lastRecord?.status === 'IN';

                           return (
                               <div key={student.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors">
                                   <div>
                                       <p className="font-medium text-slate-900">{student.fullName}</p>
                                       <p className="text-xs text-slate-500">{student.seatId ? `Seat: ${student.seatId}` : 'No Seat'}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       {lastRecord && (
                                           <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                               <Clock className="h-3 w-3"/> {lastRecord.time}
                                           </span>
                                       )}
                                       {isPresent ? (
                                           <Button size="sm" variant="danger" onClick={() => handleAttendance(student, 'OUT')}>Mark OUT</Button>
                                       ) : (
                                           <Button size="sm" variant="primary" className="bg-green-600 hover:bg-green-700" onClick={() => handleAttendance(student, 'IN')}>Mark IN</Button>
                                       )}
                                   </div>
                               </div>
                           );
                       }) : (
                           <div className="text-center py-6 text-slate-500">No students found</div>
                       )}
                   </div>
               </div>
           </div>
      </Modal>
    </div>
  );
};
