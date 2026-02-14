
import React, { useState, useEffect, useRef } from 'react';
import { Store } from '../services/store';
import { Student, Payment, Enquiry, LibraryProfile, Room, Seat, AppSettings, Attendance } from '../types';
import { Button, Input, Card, Badge, Modal } from '../components/ui';
import { Plus, Search, FileText, Trash2, Send, Save, Layout, Settings as SettingsIcon, Armchair, Building2, UserCircle, Calculator, Wallet, Tag, X, ChevronRight, Printer, Download, List, CheckSquare, Square, Clock, Calendar, Filter, Phone, MessageCircle, Grid } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

// Fallback logo if user hasn't uploaded one
const DEFAULT_LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEioaLqxKHxm_CiO9-ZIkOlt5t90C2zoAOWvuNSWh4uA-kHMC3_rXZJduG5LthPp5tz68BOfxMaVapFdXIgOqurdd9f1GQ1_moTmCm4nYnbFTN8Oskv7AQoNF-yBrAz0v9LUL03XsN7uKzniFGsacozdWUDhDQuohxHYPF50H7Hr245Ha4hVG1mx3jSCbHc/s16000/Smart%20Seat%20Pro.jpg";

// --- Student Module ---
export const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AppSettings>(Store.getSettings());
  const [profile, setProfile] = useState<LibraryProfile | null>(Store.getProfile());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [paymentData, setPaymentData] = useState({ duration: 1, amountPaid: 0 });
  const [search, setSearch] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ID_CARDS'>('DIRECTORY');
  
  // Selection State for Bulk Print
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Seat Picker State
  const [isSeatPickerOpen, setIsSeatPickerOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [pickerRoomId, setPickerRoomId] = useState('');
  
  // Hidden Ref for Download Generation
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setStudents(Store.getStudents());
    setSettings(Store.getSettings());
    setProfile(Store.getProfile());
    
    // Load Lab Data for Seat Picker
    const r = Store.getRooms();
    setRooms(r);
    setSeats(Store.getSeats());
    if(r.length > 0) setPickerRoomId(r[0].id);

    // Auto-open modal if navigated from Dashboard
    if (location.state && (location.state as any).openAdmission) {
        setFormData({});
        setPaymentData({duration: 1, amountPaid: 0});
        setIsModalOpen(true);
        navigate(location.pathname, { replace: true, state: {} });
    }

  }, [location.pathname]);

  // Auto Calculate Fees
  useEffect(() => {
    if(isModalOpen) {
        const months = paymentData.duration || 1;
        const total = (months * settings.monthlyFee);
        setCalculatedTotal(total);
    }
  }, [paymentData.duration, settings, isModalOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
      setFormData({ ...formData, seatId: seat.id });
      setIsSeatPickerOpen(false);
  };

  const getSeatLabel = (seatId?: string | null) => {
      if (!seatId) return '';
      const seat = seats.find(s => s.id === seatId);
      return seat ? seat.label : seatId;
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === filtered.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filtered.map(s => s.id)));
      }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.mobile) return alert("Name and Mobile are required");
    
    if (formData.seatId && paymentData.amountPaid <= 0) {
        return alert("Cannot allot a seat without fee payment. Please collect fees first.");
    }
    
    const calculatedDues = calculatedTotal - paymentData.amountPaid;

    const newStudent: Student = {
        id: formData.id || 's-' + Date.now(),
        fullName: formData.fullName!,
        mobile: formData.mobile!,
        seatId: formData.seatId || null,
        status: 'ACTIVE',
        joinDate: formData.joinDate || format(new Date(), 'yyyy-MM-dd'),
        planEndDate: format(addMonths(new Date(formData.joinDate || new Date()), paymentData.duration), 'yyyy-MM-dd'),
        gender: formData.gender || 'MALE',
        dob: formData.dob,
        village: formData.village,
        class: formData.class,
        preparation: formData.preparation,
        photoUrl: formData.photoUrl,
        isHandicapped: formData.isHandicapped,
        dues: calculatedDues,
        totalFeeFixed: calculatedTotal,
        durationMonths: paymentData.duration,
        planType: 'MONTHLY'
    };
    
    if (formData.id) {
        await Store.updateStudent(newStudent);
    } else {
        await Store.addStudent(newStudent);
        if (paymentData.amountPaid > 0) {
            Store.addPayment({
                id: 'pay-' + Date.now(),
                studentId: newStudent.id,
                studentName: newStudent.fullName,
                amount: paymentData.amountPaid,
                date: format(new Date(), 'yyyy-MM-dd'),
                type: 'REGISTRATION',
                method: 'CASH'
            });
        }
    }
    setIsModalOpen(false);
    setStudents(Store.getStudents());
  };

  // --- WIDE ID CARD PRINTING LOGIC ---
  const handlePrintIDCard = () => {
    const studentsToPrint = students.filter(s => selectedIds.has(s.id));
    
    if (studentsToPrint.length === 0) return alert("Please select at least one student to print.");

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoToUse = profile?.logoUrl || DEFAULT_LOGO;

    const cardsHtml = studentsToPrint.map(student => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(student.id + '|' + student.fullName)}`;
        const seatLabel = getSeatLabel(student.seatId);
        const joinDate = student.joinDate ? parseISO(student.joinDate) : new Date();
        const displayId = `${seatLabel || 'GEN'}${format(joinDate, 'ddMMM').toUpperCase()}`;
        
        return `
        <div class="id-card">
            <div class="id-header">
                <img src="${logoToUse}" class="logo" />
                <div class="lib-info">
                    <h1>${profile?.name || 'Library'}</h1>
                    <p>${profile?.address || ''}</p>
                </div>
            </div>
            <div class="id-content">
                <div class="left-col">
                    ${student.photoUrl 
                        ? `<div class="photo-wrapper"><img src="${student.photoUrl}" class="photo" /></div>` 
                        : `<div class="photo placeholder"><span>PHOTO</span></div>`
                    }
                    <div class="id-number">ID: ${displayId}</div>
                </div>
                <div class="right-col">
                    <div class="student-name">${student.fullName}</div>
                    <div class="badge-row">
                        <span class="role-badge">STUDENT</span>
                        ${seatLabel ? `<span class="seat-badge">Seat: ${seatLabel}</span>` : ''}
                    </div>
                    <div class="bottom-section">
                        <div class="details-grid-aligned">
                             <label>MOBILE</label><span>${student.mobile}</span>
                             <label>COURSE</label><span>${student.preparation || 'General'}</span>
                             <label>VALID</label><span class="highlight">${student.planEndDate}</span>
                        </div>
                        <div class="qr-wrapper"><img src="${qrUrl}" class="qr" /></div>
                    </div>
                </div>
            </div>
            <div class="bottom-bar"></div>
        </div>
        `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print ID Cards</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; background: #f1f5f9; -webkit-print-color-adjust: exact; }
          .print-wrapper { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
          .id-card { width: 340px; height: 214px; background: white; border-radius: 10px; border: 2px solid #1e293b; position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); page-break-inside: avoid; display: flex; flex-direction: column; }
          /* Updated Header Color to New Primary Blue */
          .id-header { background: #1D4ED8; padding: 6px 10px; display: flex; align-items: center; gap: 8px; height: 46px; color: white; border-bottom: 2px solid #1e40af; }
          .logo { height: 32px; width: auto; max-width: 80px; object-fit: contain; background: white; border-radius: 4px; padding: 2px; border: 1px solid white; }
          .logo-placeholder { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 4px; }
          .lib-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center; }
          .lib-info h1 { margin: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.2; }
          .lib-info p { margin: 0; font-size: 8px; opacity: 0.95; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .id-content { display: flex; padding: 10px; gap: 12px; flex: 1; background: #fff; position: relative; }
          .left-col { width: 85px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; }
          .photo-wrapper { width: 85px; height: 100px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; background: #f8fafc; }
          .photo { width: 100%; height: 100%; object-fit: cover; display: block; }
          .photo.placeholder { width: 85px; height: 100px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; font-weight: bold; border: 1px solid #e2e8f0; }
          .id-number { font-size: 10px; font-weight: bold; text-align: center; color: #1e293b; font-family: monospace; letter-spacing: 0.5px; }
          .right-col { flex: 1; display: flex; flex-direction: column; }
          .student-name { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; line-height: 1.1; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-height: 32px; }
          .badge-row { display: flex; gap: 4px; margin-bottom: 8px; }
          .role-badge { background: #1e293b; color: white; font-size: 7px; font-weight: 700; padding: 2px 5px; border-radius: 2px; letter-spacing: 0.5px; }
          .seat-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1D4ED8; font-size: 7px; font-weight: 700; padding: 1px 5px; border-radius: 2px; }
          .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
          .details-grid-aligned { display: grid; grid-template-columns: 45px 1fr; column-gap: 4px; row-gap: 2px; flex: 1; min-width: 0; align-self: flex-start; }
          .details-grid-aligned label { font-size: 6px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; align-self: center; }
          .details-grid-aligned span { font-size: 10px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .details-grid-aligned span.highlight { color: #1D4ED8; font-weight: 700; }
          .qr-wrapper { margin-left: 8px; border: 1px solid #e2e8f0; padding: 2px; border-radius: 4px; background: white; }
          .qr { width: 80px; height: 80px; object-fit: contain; display: block; }
          .bottom-bar { height: 6px; background: #1e293b; width: 100%; margin-top: auto; }
          @media print { body { background: white; margin: 0; padding: 0; } .print-wrapper { gap: 10px; } .id-card { border: 2px solid #1e293b; break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="print-wrapper">${cardsHtml}</div>
        <script>window.onload = function() { setTimeout(function(){ window.print(); }, 1000); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
      const studentsToPrint = students.filter(s => selectedIds.has(s.id));
      if (studentsToPrint.length === 0) return alert("Select at least one student.");
      if (studentsToPrint.length > 1) return alert("Select only one student to download as image.");

      setIsDownloading(true);
      setTimeout(async () => {
          if (idCardRef.current) {
              try {
                  const canvas = await html2canvas(idCardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
                  const link = document.createElement('a');
                  link.download = `ID_${studentsToPrint[0].fullName.replace(/\s+/g, '_')}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
              } catch (e) {
                  console.error("Download failed", e);
                  alert("Failed to download image.");
              } finally {
                  setIsDownloading(false);
              }
          }
      }, 100);
  };

  const filtered = students.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()));
  const pickerSeats = seats.filter(s => s.roomId === pickerRoomId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold">Students & Admissions</h1>
            <p className="text-sm text-slate-500">Manage student directory, admissions and ID cards.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <div className="bg-white border border-slate-200 p-1 rounded-lg flex shadow-sm">
                <button onClick={() => setActiveTab('DIRECTORY')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'DIRECTORY' ? 'bg-primary-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><List className="h-4 w-4"/> Directory</button>
                <button onClick={() => setActiveTab('ID_CARDS')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'ID_CARDS' ? 'bg-primary-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Grid className="h-4 w-4"/> ID Cards</button>
            </div>
            
            <Button variant="outline" icon={Download} onClick={handleDownloadImage} disabled={selectedIds.size !== 1} isLoading={isDownloading} title="Select exactly one student to download image">Download Image</Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrintIDCard} disabled={selectedIds.size === 0}>Print / PDF</Button>
            <Button onClick={() => { setFormData({}); setPaymentData({duration: 1, amountPaid: 0}); setIsModalOpen(true); }} icon={Plus}>New Admission</Button>
        </div>
      </div>

      <div className="flex gap-2">
         <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search by name, mobile..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      {activeTab === 'DIRECTORY' ? (
        <Card>
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-4 py-3 w-10">
                        <button onClick={toggleSelectAll} className="flex items-center text-slate-400 hover:text-slate-600">
                            {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                    </th>
                    <th className="px-4 py-3 font-medium text-slate-500">Student</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Academic</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Seat</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Plan Ends</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Dues</th>
                    <th className="px-4 py-3 font-medium text-slate-500">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                    <tr key={s.id} className={`hover:bg-slate-50 ${selectedIds.has(s.id) ? 'bg-primary-50/50' : ''}`}>
                    <td className="px-4 py-3">
                        <button onClick={() => toggleSelection(s.id)} className={`flex items-center ${selectedIds.has(s.id) ? 'text-primary-700' : 'text-slate-300 hover:text-slate-400'}`}>
                            {selectedIds.has(s.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                    </td>
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            {s.photoUrl ? (
                                <img src={s.photoUrl} alt="s" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                                    {s.fullName[0]}
                                </div>
                            )}
                            <div>
                                <div className="font-medium">{s.fullName}</div>
                                <div className="text-xs text-slate-500">{s.mobile} | {s.village || 'N/A'}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-700">{s.class || '-'}</div>
                        <div className="text-slate-500">{s.preparation || '-'}</div>
                    </td>
                    <td className="px-4 py-3"><Badge>{getSeatLabel(s.seatId) || 'None'}</Badge></td>
                    <td className="px-4 py-3 text-xs">{s.planEndDate}</td>
                    <td className="px-4 py-3 text-red-600 font-bold">{s.dues > 0 ? `₹${s.dues}` : '-'}</td>
                    <td className="px-4 py-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setFormData(s); setIsModalOpen(true); }}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => { Store.deleteStudent(s.id); setStudents(Store.getStudents()); }}><Trash2 className="h-3 w-3"/></Button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(s => (
                <div key={s.id} onClick={() => toggleSelection(s.id)} className={`cursor-pointer bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all group ${selectedIds.has(s.id) ? 'ring-2 ring-primary-700 border-primary-700' : 'border-slate-200'}`}>
                    <div className="h-20 bg-gradient-to-r from-primary-700 to-primary-800 relative">
                        {profile?.logoUrl && <div className="absolute top-2 left-2 bg-white rounded-md p-1 h-8 w-auto flex items-center justify-center"><img src={profile.logoUrl} className="h-full w-auto object-contain rounded-sm"/></div>}
                        <div className="absolute top-2 right-2">
                             {selectedIds.has(s.id) ? <div className="bg-white text-primary-700 rounded-full p-1"><CheckSquare className="h-4 w-4" /></div> : <div className="bg-black/20 text-white rounded-full p-1 hover:bg-black/40"><Square className="h-4 w-4" /></div>}
                        </div>
                    </div>
                    <div className="px-4 pb-4 -mt-10 text-center relative z-10">
                        {s.photoUrl ? <img src={s.photoUrl} className="w-20 h-20 rounded-full border-4 border-white shadow-sm mx-auto object-cover bg-white" /> : <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm mx-auto bg-slate-100 flex items-center justify-center text-slate-400 font-bold">{s.fullName.charAt(0)}</div>}
                        <h3 className="mt-2 font-bold text-slate-900 truncate">{s.fullName}</h3>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.preparation || s.class || 'Student'}</p>
                        <div className="mt-4 flex flex-col gap-2 text-xs text-left bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between"><span className="text-slate-500">ID:</span><span className="font-mono font-medium">{s.id.slice(-6).toUpperCase()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Seat:</span><span className="font-medium">{getSeatLabel(s.seatId) || 'None'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Valid Upto:</span><span className="font-medium text-primary-700">{s.planEndDate}</span></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Hidden Render Container for Download */}
      {isDownloading && (
          <div className="fixed top-0 left-0 z-[-1] opacity-0 pointer-events-none">
              <div ref={idCardRef} className="w-[340px] h-[214px] bg-white rounded-[10px] border-2 border-slate-800 relative overflow-hidden shadow-lg flex flex-col box-border">
                  {(() => {
                      const s = students.find(st => st.id === Array.from(selectedIds)[0]);
                      if(!s) return null;
                      
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(s.id + '|' + s.fullName)}`;
                      const seatLabel = getSeatLabel(s.seatId);
                      const joinDate = s.joinDate ? parseISO(s.joinDate) : new Date();
                      const displayId = `${seatLabel || 'GEN'}${format(joinDate, 'ddMMM').toUpperCase()}`;
                      const logoToUse = profile?.logoUrl || DEFAULT_LOGO;

                      return (
                        <>
                            <div className="bg-primary-700 px-3 py-2 flex items-center gap-2 h-[46px] text-white border-b-2 border-primary-800">
                                <img src={logoToUse} className="h-8 w-auto object-contain bg-white rounded-sm p-0.5 border border-white" />
                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                    <h1 className="m-0 text-[13px] font-extrabold uppercase whitespace-nowrap overflow-hidden text-ellipsis leading-tight">{profile?.name || 'Library'}</h1>
                                    <p className="m-0 text-[8px] opacity-95 whitespace-nowrap overflow-hidden text-ellipsis">{profile?.address || ''}</p>
                                </div>
                            </div>
                            <div className="flex p-3 gap-3 flex-1 bg-white relative">
                                <div className="w-[85px] shrink-0 flex flex-col gap-1">
                                    <div className="w-[85px] h-[100px] rounded border border-slate-300 bg-slate-50 overflow-hidden">
                                        {s.photoUrl ? <img src={s.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-slate-400">PHOTO</div>}
                                    </div>
                                    <div className="text-[10px] font-bold text-center text-slate-800 font-mono tracking-wide">ID: {displayId}</div>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="text-[14px] font-extrabold text-slate-800 uppercase leading-tight mb-1 whitespace-nowrap overflow-hidden text-ellipsis">{s.fullName}</div>
                                    <div className="flex gap-1 mb-2">
                                        <span className="bg-slate-800 text-white text-[7px] font-bold px-1.5 py-0.5 rounded tracking-wide">STUDENT</span>
                                        {seatLabel && <span className="bg-primary-50 border border-primary-200 text-primary-700 text-[7px] font-bold px-1.5 py-0.5 rounded">Seat: {seatLabel}</span>}
                                    </div>
                                    <div className="flex justify-between items-end mt-auto">
                                        <div className="grid grid-cols-[45px_1fr] gap-x-1 gap-y-0.5 flex-1 min-w-0 self-start">
                                            <label className="text-[6px] font-bold text-slate-400 uppercase self-center tracking-wide">MOBILE</label><span className="text-[10px] font-semibold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{s.mobile}</span>
                                            <label className="text-[6px] font-bold text-slate-400 uppercase self-center tracking-wide">COURSE</label><span className="text-[10px] font-semibold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis">{s.preparation || 'General'}</span>
                                            <label className="text-[6px] font-bold text-slate-400 uppercase self-center tracking-wide">VALID</label><span className="text-[10px] font-bold text-primary-700">{s.planEndDate}</span>
                                        </div>
                                        <div className="ml-2 border border-slate-200 p-0.5 rounded bg-white">
                                            <img src={qrUrl} className="w-[80px] h-[80px] object-contain block" crossOrigin="anonymous"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-800 w-full mt-auto"></div>
                        </>
                      );
                  })()}
              </div>
          </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Student" : "New Admission Form"}>
         <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
             <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><UserCircle className="h-4 w-4"/> Personal Details</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 flex items-center gap-4">
                        <div className="h-16 w-16 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden relative">
                             {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">Photo</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                    </div>
                    <Input label="Full Name" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    <Input label="Mobile" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select className="w-full border rounded-md p-2 text-sm" value={formData.gender || 'MALE'} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                         <input type="checkbox" id="handicap" checked={formData.isHandicapped || false} onChange={e => setFormData({...formData, isHandicapped: e.target.checked})} className="h-4 w-4 text-primary-700 rounded border-slate-300"/>
                         <label htmlFor="handicap" className="text-sm font-medium text-slate-700">Physically Challenged / Handicapped</label>
                    </div>
                    <Input type="date" label="Date of Birth" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    <Input label="Village / City" value={formData.village || ''} onChange={e => setFormData({...formData, village: e.target.value})} />
                 </div>
             </div>
             <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><FileText className="h-4 w-4"/> Academic Info</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class / Education</label>
                        <select className="w-full border rounded-md p-2 text-sm" value={formData.class || ''} onChange={e => setFormData({...formData, class: e.target.value})}>
                            <option value="">-- Select --</option>
                            {settings.classes?.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preparation For</label>
                        <select className="w-full border rounded-md p-2 text-sm" value={formData.preparation || ''} onChange={e => setFormData({...formData, preparation: e.target.value})}>
                            <option value="">-- Select --</option>
                            {settings.preparations?.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Allocated Seat</label>
                        <div className="flex gap-2">
                             <div onClick={() => setIsSeatPickerOpen(true)} className="flex-1 flex items-center justify-between h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm cursor-pointer hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <span className={formData.seatId ? "text-slate-900 font-medium" : "text-slate-400"}>{formData.seatId ? `Seat ${getSeatLabel(formData.seatId)}` : "Click to select seat"}</span>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                            {formData.seatId && <button onClick={() => setFormData({...formData, seatId: null})} className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-200" title="Clear Seat"><X className="h-4 w-4" /></button>}
                        </div>
                    </div>
                 </div>
             </div>
             <div className="space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-2"><Calculator className="h-4 w-4"/> Fee Calculation</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
                    <Input type="date" label="Join Date" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                    <Input type="number" label="Duration (Months)" value={paymentData.duration} onChange={e => setPaymentData({...paymentData, duration: parseInt(e.target.value) || 0})} />
                    <div className="col-span-2 text-sm space-y-1 text-slate-600 pt-2 border-t border-primary-200">
                        <div className="flex justify-between"><span>Monthly Fee ({paymentData.duration} x ₹{settings.monthlyFee})</span> <span>₹{paymentData.duration * settings.monthlyFee}</span></div>
                        <div className="flex justify-between font-bold text-slate-900 text-base pt-1"><span>Total Payable</span> <span>₹{calculatedTotal}</span></div>
                    </div>
                    <div className="col-span-2">
                        <Input label="Amount Paid Now (₹)" type="number" className="bg-white font-bold text-green-700 border-green-300" value={paymentData.amountPaid} onChange={e => setPaymentData({...paymentData, amountPaid: parseInt(e.target.value) || 0})} />
                        {formData.seatId && paymentData.amountPaid <= 0 && <p className="text-xs text-red-600 font-bold mt-1">⚠ Payment required to allot seat.</p>}
                        <p className="text-right text-sm font-bold text-red-600 mt-1">Pending Dues: ₹{calculatedTotal - paymentData.amountPaid}</p>
                    </div>
                 </div>
             </div>
             <Button className="w-full h-12 text-lg" onClick={handleSubmit}>Save & Register Student</Button>
         </div>
      </Modal>

      <Modal isOpen={isSeatPickerOpen} onClose={() => setIsSeatPickerOpen(false)} title="Select a Seat">
         <div className="space-y-4">
             <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-slate-100">
                {rooms.map(room => (
                    <button key={room.id} onClick={() => setPickerRoomId(room.id)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${pickerRoomId === room.id ? 'bg-primary-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{room.name}</button>
                ))}
             </div>
             <div className="max-h-[300px] overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                 {pickerSeats.length > 0 ? (
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                        {pickerSeats.map(seat => {
                             const isOccupied = seat.status === 'OCCUPIED' && seat.studentId !== formData.id;
                             const isSelected = formData.seatId === seat.id;
                             return (
                                <button key={seat.id} disabled={isOccupied} onClick={() => handleSeatSelect(seat)} className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${isSelected ? 'bg-primary-700 text-white border-primary-700 ring-2 ring-primary-200' : ''} ${isOccupied ? 'bg-slate-800 text-white border-slate-900 cursor-not-allowed opacity-60' : 'bg-white text-slate-700 border-slate-300 hover:border-primary-500 hover:shadow-sm'} ${!isOccupied && !isSelected ? 'hover:bg-primary-50' : ''}`} title={isOccupied ? "Occupied" : "Available"}>{seat.label}</button>
                             );
                        })}
                    </div>
                 ) : (
                     <div className="text-center py-8 text-slate-400 text-sm">No seats in this room.</div>
                 )}
             </div>
             <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Available</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded"></div> Occupied</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary-700 rounded"></div> Selected</div>
             </div>
         </div>
      </Modal>
    </div>
  );
};

export const Finance = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPayment, setNewPayment] = useState<Partial<Payment>>({ method: 'CASH', type: 'FEE', date: format(new Date(), 'yyyy-MM-dd') });
    const [students, setStudents] = useState<Student[]>([]);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        setPayments(Store.getPayments());
        setStudents(Store.getStudents());
        if (location.state && (location.state as any).openCollection) {
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location]);

    const handleSave = async () => {
        if(!newPayment.studentId || !newPayment.amount) return alert("Select student and enter amount");
        const s = students.find(st => st.id === newPayment.studentId);
        
        await Store.addPayment({
            id: 'pay-' + Date.now(),
            studentId: newPayment.studentId,
            studentName: s?.fullName || 'Unknown',
            amount: Number(newPayment.amount),
            date: newPayment.date!,
            type: newPayment.type as any,
            method: newPayment.method as any
        });
        setPayments(Store.getPayments());
        setIsModalOpen(false);
        setNewPayment({ method: 'CASH', type: 'FEE', date: format(new Date(), 'yyyy-MM-dd') });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Finance & Fees</h1>
                <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Collect Fee</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Student</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Method</th>
                                <th className="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(p => (
                                <tr key={p.id} className="border-b">
                                    <td className="px-4 py-3">{p.date}</td>
                                    <td className="px-4 py-3 font-medium">{p.studentName}</td>
                                    <td className="px-4 py-3"><Badge variant="neutral">{p.type}</Badge></td>
                                    <td className="px-4 py-3">{p.method}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">₹{p.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Collect Payment">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Student</label>
                        <select className="w-full border rounded p-2 text-sm" value={newPayment.studentId || ''} onChange={e => setNewPayment({...newPayment, studentId: e.target.value})}>
                            <option value="">-- Select Student --</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                        </select>
                    </div>
                    <Input label="Amount (₹)" type="number" value={newPayment.amount || ''} onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})} />
                    <Input label="Date" type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select className="w-full border rounded p-2 text-sm" value={newPayment.type} onChange={e => setNewPayment({...newPayment, type: e.target.value as any})}>
                                <option value="FEE">Monthly Fee</option>
                                <option value="REGISTRATION">Registration</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Method</label>
                            <select className="w-full border rounded p-2 text-sm" value={newPayment.method} onChange={e => setNewPayment({...newPayment, method: e.target.value as any})}>
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>
                    </div>
                    <Button className="w-full" onClick={handleSave}>Record Payment</Button>
                </div>
            </Modal>
        </div>
    );
};

export const Enquiries = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Enquiry>>({ status: 'NEW', date: format(new Date(), 'yyyy-MM-dd') });

    useEffect(() => {
        setEnquiries(Store.getEnquiries());
    }, []);

    const handleSave = async () => {
        if(!formData.name || !formData.mobile) return alert("Name and Mobile required");
        
        const enq: Enquiry = {
            id: formData.id || 'enq-' + Date.now(),
            name: formData.name,
            mobile: formData.mobile,
            source: formData.source || 'Walk-in',
            status: formData.status || 'NEW',
            date: formData.date!,
            notes: formData.notes
        };

        if(formData.id) await Store.updateEnquiry(enq);
        else await Store.addEnquiry(enq);

        setEnquiries(Store.getEnquiries());
        setIsModalOpen(false);
        setFormData({ status: 'NEW', date: format(new Date(), 'yyyy-MM-dd') });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Enquiries</h1>
                <Button icon={Plus} onClick={() => setIsModalOpen(true)}>Add Enquiry</Button>
            </div>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Mobile</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enquiries.map(e => (
                                <tr key={e.id} className="border-b">
                                    <td className="px-4 py-3">{e.date}</td>
                                    <td className="px-4 py-3 font-medium">{e.name}</td>
                                    <td className="px-4 py-3">{e.mobile}</td>
                                    <td className="px-4 py-3"><Badge>{e.status}</Badge></td>
                                    <td className="px-4 py-3 text-right">
                                        <Button size="sm" variant="outline" onClick={() => {setFormData(e); setIsModalOpen(true);}}>Edit</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Enquiry" : "New Enquiry"}>
                <div className="space-y-4">
                    <Input label="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <Input label="Mobile" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                    <Input label="Source" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="e.g. Friend, Poster" />
                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select className="w-full border rounded p-2 text-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="NEW">New</option>
                            <option value="FOLLOW_UP">Follow Up</option>
                            <option value="CONVERTED">Converted</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea className="w-full border rounded p-2 text-sm" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                    <Button className="w-full" onClick={handleSave}>Save</Button>
                </div>
            </Modal>
        </div>
    );
};

export const Settings = () => {
    const [profile, setProfile] = useState<LibraryProfile | null>(null);
    const [settings, setSettings] = useState<AppSettings>(Store.getSettings());
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [newCapacity, setNewCapacity] = useState('');

    useEffect(() => {
        setProfile(Store.getProfile());
        setSettings(Store.getSettings());
        setRooms(Store.getRooms());
    }, []);

    const handleSaveProfile = async () => {
        if(profile) {
            await Store.saveProfile(profile);
            alert("Profile Saved");
        }
    };

    const handleSaveSettings = async () => {
        await Store.saveSettings(settings);
        alert("Settings Saved");
    };
    
    const handleAddRoom = async () => {
        if(!newRoomName || !newCapacity) return;
        await Store.addRoom({
            id: 'room-' + Date.now(),
            name: newRoomName,
            capacity: parseInt(newCapacity)
        });
        setRooms(Store.getRooms());
        setNewRoomName('');
        setNewCapacity('');
    };

    const handleDeleteRoom = async (id: string) => {
        if(confirm("Delete room and all its seats?")) {
            await Store.deleteRoom(id);
            setRooms(Store.getRooms());
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <h1 className="text-2xl font-bold">Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Library Profile">
                    <div className="space-y-4">
                        <Input label="Library Name" value={profile?.name || ''} onChange={e => setProfile({...profile!, name: e.target.value})} />
                        <Input label="Address" value={profile?.address || ''} onChange={e => setProfile({...profile!, address: e.target.value})} />
                        <Input label="Contact" value={profile?.contact || ''} onChange={e => setProfile({...profile!, contact: e.target.value})} />
                        <div>
                             <label className="block text-sm font-medium mb-1">Logo URL</label>
                             <div className="flex gap-2">
                                 <Input value={profile?.logoUrl || ''} onChange={e => setProfile({...profile!, logoUrl: e.target.value})} placeholder="https://..." />
                                 {profile?.logoUrl && <img src={profile.logoUrl} className="h-10 w-auto rounded border object-contain" />}
                             </div>
                        </div>
                        <Button onClick={handleSaveProfile}>Update Profile</Button>
                    </div>
                </Card>

                <Card title="Configuration">
                    <div className="space-y-4">
                        <Input label="Monthly Fee (Default)" type="number" value={settings.monthlyFee} onChange={e => setSettings({...settings, monthlyFee: Number(e.target.value)})} />
                        <div className="space-y-2 pt-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="rounded border-slate-300 text-primary-700 focus:ring-primary-700" />
                                <span className="text-sm font-medium">Maintenance Mode</span>
                            </label>
                            <p className="text-xs text-slate-500 pl-6">Prevents student login (if applicable) and shows maintenance message.</p>
                        </div>
                        <Button onClick={handleSaveSettings}>Save Configuration</Button>
                    </div>
                </Card>
            </div>
            
            <Card title="Room Management">
                <div className="space-y-4">
                     <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg">
                         <Input label="Room Name" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Hall A" />
                         <Input label="Capacity" type="number" value={newCapacity} onChange={e => setNewCapacity(e.target.value)} placeholder="Seats" />
                         <Button onClick={handleAddRoom} icon={Plus}>Add Room</Button>
                     </div>
                     
                     <div className="space-y-2">
                         {rooms.map(r => (
                             <div key={r.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                                 <div>
                                     <span className="font-bold">{r.name}</span>
                                     <span className="text-sm text-slate-500 ml-2">({r.capacity || 0} Seats)</span>
                                 </div>
                                 <Button size="sm" variant="danger" onClick={() => handleDeleteRoom(r.id)}><Trash2 className="h-4 w-4"/></Button>
                             </div>
                         ))}
                     </div>
                </div>
            </Card>
        </div>
    );
};

export const AttendanceHistory = () => {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    setRecords(Store.getAttendance());
  }, []);

  const filtered = records.filter(r => r.date === filterDate);

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Attendance Log</h1>
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-auto" />
        </div>
        <Card>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                    <tr>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filtered.length > 0 ? filtered.map(r => (
                        <tr key={r.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-mono text-slate-500">{r.time}</td>
                            <td className="px-4 py-3 font-medium">{r.studentName}</td>
                            <td className="px-4 py-3"><Badge variant={r.status === 'IN' ? 'success' : 'neutral'}>{r.status}</Badge></td>
                        </tr>
                    )) : <tr><td colSpan={3} className="p-4 text-center text-slate-500">No records for this date</td></tr>}
                </tbody>
            </table>
        </Card>
    </div>
  );
};
