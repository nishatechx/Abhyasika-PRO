
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Store } from '../services/store';
import { Student, Attendance } from '../types';
import { format } from 'date-fns';
import { CheckCircle, AlertCircle, Camera, ArrowLeft, RefreshCw, ScanLine, Clock, User, History, XCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScanHistoryItem {
    id: string;
    studentName: string;
    time: string;
    status: 'IN' | 'OUT';
    type: 'success' | 'error';
    msg?: string;
    photoUrl?: string;
}

export const Scanner = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanningState, setIsScanningState] = useState(false);
  
  // Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [lastScan, setLastScan] = useState<ScanHistoryItem | null>(null);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [time, setTime] = useState(new Date());

  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  // Throttling & Timer Refs
  const lastCodeRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // 1. Load Data & Cameras on Mount
  useEffect(() => {
    setStudents(Store.getStudents());
    const clockInterval = setInterval(() => setTime(new Date()), 1000);

    // Fetch Cameras
    Html5Qrcode.getCameras().then((devices) => {
        if (devices && devices.length) {
            setCameras(devices);
            setSelectedCameraId(devices[devices.length - 1].id);
        }
    }).catch(err => {
        console.error("Error getting cameras", err);
    });

    return () => {
        clearInterval(clockInterval);
        cleanupScanner();
        if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cleanupScanner = async () => {
      if (scannerRef.current) {
          try {
              if (scannerRef.current.isScanning) {
                  await scannerRef.current.stop();
              }
              scannerRef.current.clear();
          } catch (e) {
              console.warn("Cleanup error", e);
          }
      }
  };

  // 2. Start/Restart Scanner when Camera Changes
  useEffect(() => {
    if (!selectedCameraId) return;

    const startScanner = async () => {
        await cleanupScanner();

        // Ensure DOM element exists
        if(!document.getElementById("reader")) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        try {
            await html5QrCode.start(
                selectedCameraId,
                {
                    fps: 10,
                    qrbox: { width: 300, height: 300 },
                    aspectRatio: 1.0,
                    disableFlip: false
                },
                (decodedText) => handleScan(decodedText),
                (errorMessage) => { /* ignore frame errors */ }
            );
            setIsScanningState(true);
        } catch (err) {
            console.error("Error starting scanner", err);
            setIsScanningState(false);
        }
    };

    // Small delay to allow layout to settle
    const t = setTimeout(startScanner, 100);
    return () => clearTimeout(t);
  }, [selectedCameraId]);

  const handleScan = async (decodedText: string) => {
      const now = Date.now();
      
      // THROTTLE: Prevent scanning the SAME code within 3 seconds
      if (decodedText === lastCodeRef.current && (now - lastTimeRef.current < 3000)) {
          return;
      }

      // Update Refs immediately to block duplicate processing
      lastCodeRef.current = decodedText;
      lastTimeRef.current = now;

      // Logic
      const parts = decodedText.split('|');
      const studentId = parts[0];
      const student = students.find(s => s.id === studentId);

      let resultItem: ScanHistoryItem;

      if (student) {
          // Check latest status from store (or calculate toggle)
          const today = format(new Date(), 'yyyy-MM-dd');
          const allRecords = Store.getAttendance();
          const lastRecord = allRecords.find(r => r.studentId === studentId && r.date === today);
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

          resultItem = {
              id: record.id,
              studentName: student.fullName,
              time: format(new Date(), 'hh:mm:ss a'),
              status: newStatus,
              type: 'success',
              photoUrl: student.photoUrl
          };

          // Play Beep (Best effort)
          try {
             // const audio = new Audio('/beep.mp3'); audio.play();
          } catch(e){}

      } else {
          resultItem = {
              id: `err-${Date.now()}`,
              studentName: 'Unknown ID',
              time: format(new Date(), 'hh:mm:ss a'),
              status: 'OUT', // Default
              type: 'error',
              msg: 'Invalid QR Code'
          };
      }

      // Update UI
      // Clear previous timer if exists
      if (timerRef.current) clearTimeout(timerRef.current);
      
      setLastScan(resultItem);
      setRecentScans(prev => [resultItem, ...prev]);

      // Set new timer to hide details after 5 seconds
      timerRef.current = setTimeout(() => {
          setLastScan(null);
      }, 5000);
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex justify-between items-center px-4 shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                  <ArrowLeft className="h-5 w-5 text-slate-400" />
              </button>
              <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                      <ScanLine className="text-green-500"/> Attendance Scanner
                  </h1>
              </div>
          </div>
          <div className="flex items-center gap-4">
               <div className="text-right">
                   <div className="text-xl font-mono font-bold text-green-400 leading-none">{format(time, 'hh:mm:ss a')}</div>
                   <div className="text-[10px] text-slate-500 uppercase tracking-widest">{format(time, 'EEE, dd MMM')}</div>
               </div>
          </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Panel: Camera View */}
          <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-4">
              <div className="relative w-full h-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 flex items-center justify-center group">
                  <div id="reader" className="w-full h-full object-cover"></div>
                  
                  {/* Overlay Graphics: Cinematic Full Frame Scan Animation */}
                  {isScanningState && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                          {/* Vignette for depth */}
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6)_100%)]"></div>

                          {/* Tech Grid Background - subtle */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,197,94,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,197,94,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>

                          {/* Corner Markers with Glow */}
                          <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-green-500 rounded-tl-2xl shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                          <div className="absolute top-6 right-6 w-16 h-16 border-t-4 border-r-4 border-green-500 rounded-tr-2xl shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                          <div className="absolute bottom-6 left-6 w-16 h-16 border-b-4 border-l-4 border-green-500 rounded-bl-2xl shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-green-500 rounded-br-2xl shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                          
                          {/* Scanning Laser Line (Full Frame) with Trail Shadow */}
                          <div className="absolute left-0 w-full h-0.5 bg-green-400 shadow-[0_0_30px_rgba(34,197,94,1),0_-4px_10px_rgba(34,197,94,0.5)] animate-scan opacity-90"></div>
                      </div>
                  )}
              </div>

              {/* Camera Selector */}
              <div className="absolute bottom-8 z-20">
                  <div className="bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center px-4 py-2 hover:bg-black/80 transition-colors cursor-pointer group">
                      <Camera className="h-4 w-4 text-slate-400 mr-2 group-hover:text-white" />
                      <select 
                          className="bg-transparent text-sm text-white focus:outline-none appearance-none cursor-pointer"
                          value={selectedCameraId}
                          onChange={(e) => setSelectedCameraId(e.target.value)}
                      >
                          {cameras.map(cam => (
                              <option key={cam.id} value={cam.id} className="bg-slate-900">{cam.label || `Camera ${cam.id.slice(0,5)}...`}</option>
                          ))}
                      </select>
                      <RefreshCw className="h-3 w-3 text-slate-500 ml-2 group-hover:rotate-180 transition-transform" />
                  </div>
              </div>
          </div>

          {/* Right Panel: Info & History */}
          <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10 h-1/2 lg:h-auto relative">
              
              {/* Top Section: Active Result - Amazing Success Animation */}
              <div className="h-2/5 min-h-[220px] border-b border-slate-800 p-6 flex items-center justify-center bg-gradient-to-b from-slate-800/50 to-slate-900/50 relative overflow-hidden">
                  
                  {/* Success Flash Background */}
                  {lastScan?.type === 'success' && (
                     <div className="absolute inset-0 bg-green-500/10 animate-[pulse_1s_ease-out_infinite]"></div>
                  )}

                  {lastScan ? (
                      <div className="relative z-10 w-full flex flex-col items-center animate-[zoomIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]">
                           {lastScan.type === 'success' ? (
                               <>
                                   {/* Photo with Ring Animation */}
                                   <div className="relative mb-4">
                                       <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 blur opacity-75 animate-spin-slow"></div>
                                       <div className="relative w-24 h-24 rounded-full p-1 bg-slate-900">
                                            {lastScan.photoUrl ? (
                                                <img src={lastScan.photoUrl} className="w-full h-full rounded-full object-cover border-2 border-green-500" />
                                            ) : (
                                                <div className="w-full h-full rounded-full flex items-center justify-center bg-slate-800 border-2 border-green-500">
                                                    <User className="h-10 w-10 text-green-500" />
                                                </div>
                                            )}
                                       </div>
                                       {/* Status Icon Badge */}
                                       <div className={`absolute bottom-0 right-0 p-2 rounded-full border-4 border-slate-900 shadow-lg ${lastScan.status === 'IN' ? 'bg-green-500' : 'bg-orange-500'}`}>
                                           {lastScan.status === 'IN' ? <CheckCircle className="h-5 w-5 text-white"/> : <Clock className="h-5 w-5 text-white"/>}
                                       </div>
                                   </div>

                                   <h2 className="text-2xl font-bold text-white mb-1 truncate max-w-full">{lastScan.studentName}</h2>
                                   
                                   <div className={`mt-2 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg transform transition-transform hover:scale-105 ${lastScan.status === 'IN' ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'}`}>
                                       MARKED {lastScan.status}
                                   </div>
                                   
                                   <p className="mt-3 text-slate-400 text-xs font-mono flex items-center gap-2">
                                       <ShieldCheck className="h-3 w-3 text-green-500"/> Verified at {lastScan.time}
                                   </p>
                               </>
                           ) : (
                               <>
                                   <div className="mb-4 relative">
                                       <div className="absolute -inset-4 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                                       <XCircle className="h-20 w-20 text-red-500 relative z-10" />
                                   </div>
                                   <h2 className="text-xl font-bold text-white mb-1">Scan Failed</h2>
                                   <p className="text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded border border-red-900/50">{lastScan.msg}</p>
                               </>
                           )}
                      </div>
                  ) : (
                      <div className="text-center text-slate-600 flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-3 animate-[spin_10s_linear_infinite]">
                              <ScanLine className="h-8 w-8 text-slate-700" />
                          </div>
                          <p className="text-sm font-medium">Ready to Scan...</p>
                          <p className="text-xs text-slate-700 mt-1">Place QR code within the frame</p>
                      </div>
                  )}
              </div>

              {/* Bottom Section: History List */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-900">
                  <div className="flex items-center gap-2 mb-3 px-2">
                      <History className="h-4 w-4 text-slate-500" />
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session History</span>
                  </div>
                  
                  <div className="space-y-2">
                      {recentScans.map((scan, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-slate-800 ${idx === 0 ? 'bg-slate-800 border-slate-700 shadow-md transform scale-[1.02]' : 'bg-slate-900/50 border-slate-800 opacity-75'}`}>
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${scan.type === 'error' ? 'bg-red-500' : scan.status === 'IN' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'}`}></div>
                                  <div className="truncate">
                                      <p className="text-sm font-medium text-white truncate">{scan.studentName}</p>
                                      <p className="text-[10px] text-slate-500 font-mono">{scan.time}</p>
                                  </div>
                              </div>
                              {scan.type === 'success' ? (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${scan.status === 'IN' ? 'text-green-400 bg-green-950/30 border-green-900/50' : 'text-orange-400 bg-orange-950/30 border-orange-900/50'}`}>
                                      {scan.status}
                                  </span>
                              ) : (
                                  <span className="text-[10px] font-bold text-red-400 bg-red-950/30 border border-red-900/50 px-2 py-0.5 rounded">ERR</span>
                              )}
                          </div>
                      ))}
                      {recentScans.length === 0 && (
                          <div className="text-center py-12 text-slate-700 text-xs italic">
                              <div className="inline-block p-3 rounded-full bg-slate-800/50 mb-2">
                                  <Clock className="h-4 w-4" />
                              </div>
                              <p>Waiting for scans...</p>
                          </div>
                      )}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
