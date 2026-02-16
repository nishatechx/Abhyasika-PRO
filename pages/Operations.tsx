
import React, { useState, useEffect, useRef } from 'react';
import { Store } from '../services/store';
import { Student, Payment, Enquiry, LibraryProfile, Room, Seat, AppSettings, Attendance } from '../types';
import { Button, Input, Card, Badge, Modal } from '../components/ui';
import { Plus, Search, FileText, Trash2, Send, Save, Layout, Settings as SettingsIcon, Armchair, Building2, UserCircle, Calculator, Wallet, Tag, X, ChevronRight, Printer, Download, List, CheckSquare, Square, Clock, Calendar, Filter, Phone, MessageCircle, Grid, Zap, ShieldCheck, CreditCard, Banknote, HelpCircle, AlertTriangle, FileSpreadsheet, Edit, TrendingUp, User, PieChart, IndianRupee } from 'lucide-react';
import { format, addMonths, parseISO, isWithinInterval, startOfMonth, endOfMonth, parse, startOfDay, endOfDay } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const DEFAULT_LOGO = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhGrS0W_C2fEoxXrGD9yVHhOSlX5uy_gZgATDGGFEKQMvAdczkaY8odZof1-WHMQbOTiACJ1zRGLmw6vn4jpXboQJ1Te52ep9ngIfBVXB1BBWzhX9Cjv0PzRG5OXr5hPjf9hg24ekO2JITnXCMLIdS5K_qwCyZjI_0Q6w1i0Crf5GTJCzj9F_rWDYDJURo/s16000/Digital%20Abhyasika%20Logo.png";

// Helper for stop propagation to be used on Action Containers
const stopProp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
};

export const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AppSettings>(Store.getSettings());
  const [profile, setProfile] = useState<LibraryProfile | null>(Store.getProfile());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Student>>({ admissionType: 'REGULAR' });
  const [paymentData, setPaymentData] = useState({ duration: 1, amountPaid: 0, mode: 'CASH' });
  const [search, setSearch] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [seatFilter, setSeatFilter] = useState<'ALL' | 'SEATED' | 'UNSEATED'>('ALL');
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ID_CARDS'>('DIRECTORY');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSeatPickerOpen, setIsSeatPickerOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [pickerRoomId, setPickerRoomId] = useState('');
  const idCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    if (location.state && (location.state as any).openAdmission) {
        setFormData({ admissionType: 'REGULAR' });
        setPaymentData({duration: 1, amountPaid: 0, mode: 'CASH'});
        setIsModalOpen(true);
        navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname]);

  const loadData = () => {
      setStudents([...Store.getStudents()]); // Spread to ensure new reference
      setSettings(Store.getSettings());
      setProfile(Store.getProfile());
      const r = Store.getRooms();
      setRooms(r);
      setSeats(Store.getSeats());
      if(r.length > 0) setPickerRoomId(r[0].id);
  };

  useEffect(() => {
    if(isModalOpen) {
        const months = paymentData.duration || 1;
        const monthlyRate = formData.admissionType === 'RESERVED' ? (settings.reservedFee || 1000) : (settings.monthlyFee || 800);
        const total = months * monthlyRate;
        setCalculatedTotal(total);
        if(!formData.id) {
             setPaymentData(prev => ({...prev, amountPaid: total}));
        }
    }
  }, [paymentData.duration, settings, isModalOpen, formData.admissionType, formData.id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photoUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
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
      if (selectedIds.size === filtered.length) setSelectedIds(new Set());
      else setSelectedIds(new Set(filtered.map(s => s.id)));
  };

  const handleEditStudent = (e: React.MouseEvent, student: Student) => {
      stopProp(e);
      setFormData(student); 
      setIsModalOpen(true);
  };

  const handleDeleteStudent = async (e: React.MouseEvent, id: string) => {
      stopProp(e);
      if(window.confirm("Are you sure you want to delete this student profile? This action cannot be undone.")) {
          await Store.deleteStudent(id);
          loadData(); 
      }
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.mobile) return alert("Required fields missing");
    
    // Logic to preserve dues if editing
    const isEdit = !!formData.id;
    const calculatedDues = calculatedTotal - paymentData.amountPaid;
    const finalDues = isEdit ? (formData.dues || 0) : calculatedDues;

    const newStudent: Student = {
        id: formData.id || 's-' + Date.now(),
        fullName: formData.fullName!,
        mobile: formData.mobile!,
        email: formData.email,
        alternateMobile: formData.alternateMobile,
        seatId: formData.seatId || null,
        status: formData.status || 'ACTIVE',
        joinDate: formData.joinDate || format(new Date(), 'yyyy-MM-dd'),
        planEndDate: formData.planEndDate || format(addMonths(new Date(formData.joinDate || new Date()), paymentData.duration), 'yyyy-MM-dd'),
        gender: formData.gender || 'MALE',
        dob: formData.dob,
        village: formData.village,
        class: formData.class,
        preparation: formData.preparation,
        photoUrl: formData.photoUrl,
        isHandicapped: formData.isHandicapped,
        admissionType: formData.admissionType || 'REGULAR',
        dues: finalDues,
        totalFeeFixed: isEdit ? formData.totalFeeFixed : calculatedTotal,
        durationMonths: isEdit ? formData.durationMonths : paymentData.duration,
        planType: 'MONTHLY'
    };

    if (formData.id) {
        await Store.updateStudent(newStudent);
        // Basic Seat Swapping Logic if Seat Changed for existing student
        if (newStudent.seatId) {
             const seat = seats.find(s => s.id === newStudent.seatId);
             if (seat && seat.status === 'AVAILABLE') {
                 Store.updateSeat({ ...seat, status: 'OCCUPIED', studentId: newStudent.id });
             }
        }
    } else {
        await Store.addStudent(newStudent);
        if (paymentData.amountPaid > 0) {
            Store.addPayment({
                id: 'pay-' + Date.now(), studentId: newStudent.id, studentName: newStudent.fullName,
                amount: paymentData.amountPaid, date: format(new Date(), 'yyyy-MM-dd'),
                type: 'REGISTRATION', method: paymentData.mode as any
            });
        }
    }
    setIsModalOpen(false);
    loadData();
  };

  const handlePrintIDCard = () => {
    const studentsToPrint = students.filter(s => selectedIds.has(s.id));
    if (studentsToPrint.length === 0) return alert("Selection required.");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const logoToUse = DEFAULT_LOGO;
    const cardsHtml = studentsToPrint.map(student => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=0&data=${encodeURIComponent(student.id + '|' + student.fullName)}`;
        const seatLabel = getSeatLabel(student.seatId);
        const joinDate = student.joinDate ? parseISO(student.joinDate) : new Date();
        const displayId = `${seatLabel || 'GEN'}${format(joinDate, 'ddMMM').toUpperCase()}`;
        return `
        <div class="id-card">
            <div class="id-header"><img src="${logoToUse}" class="logo" /><div class="lib-info"><h1>${profile?.name || 'Library'}</h1><p>${profile?.address || ''}</p></div></div>
            <div class="id-content">
                <div class="left-col">${student.photoUrl ? `<div class="photo-wrapper"><img src="${student.photoUrl}" class="photo" /></div>` : `<div class="photo placeholder"><span>PHOTO</span></div>`}<div class="id-number">ID: ${displayId}</div></div>
                <div class="right-col"><div class="student-name">${student.fullName}</div><div class="badge-row"><span class="role-badge">STUDENT</span>${seatLabel ? `<span class="seat-badge">Seat: ${seatLabel}</span>` : ''}</div><div class="bottom-section"><div class="details-grid-aligned"><label>MOBILE</label><span>${student.mobile}</span><label>COURSE</label><span>${student.preparation || 'General'}</span><label>VALID</label><span class="highlight">${student.planEndDate}</span></div><div class="qr-wrapper"><img src="${qrUrl}" class="qr" /></div></div></div>
            </div>
            <div class="bottom-bar"></div>
        </div>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Print ID Cards</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; background: #f1f5f9; -webkit-print-color-adjust: exact; } .print-wrapper { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; } .id-card { width: 340px; height: 214px; background: white; border-radius: 10px; border: 2px solid #1e293b; position: relative; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); page-break-inside: avoid; display: flex; flex-direction: column; } .id-header { background: #1D4ED8; padding: 6px 10px; display: flex; align-items: center; gap: 8px; height: 46px; color: white; border-bottom: 2px solid #1e40af; } .logo { height: 32px; width: auto; max-width: 80px; object-fit: contain; } .lib-info { flex: 1; overflow: hidden; } .lib-info h1 { margin: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .lib-info p { margin: 0; font-size: 8px; opacity: 0.95; } .id-content { display: flex; padding: 10px; gap: 12px; flex: 1; } .left-col { width: 85px; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; } .photo-wrapper { width: 85px; height: 100px; border-radius: 4px; overflow: hidden; border: 1px solid #cbd5e1; } .photo { width: 100%; height: 100%; object-fit: cover; } .id-number { font-size: 10px; font-weight: bold; text-align: center; font-family: monospace; } .right-col { flex: 1; display: flex; flex-direction: column; } .student-name { font-size: 14px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin-bottom: 4px; } .badge-row { display: flex; gap: 4px; margin-bottom: 8px; } .role-badge { background: #1e293b; color: white; font-size: 7px; font-weight: 700; padding: 2px 5px; border-radius: 2px; } .seat-badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1D4ED8; font-size: 7px; font-weight: 700; padding: 1px 5px; border-radius: 2px; } .bottom-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; } .details-grid-aligned { display: grid; grid-template-columns: 45px 1fr; gap: 2px; flex: 1; } .details-grid-aligned label { font-size: 6px; font-weight: 700; color: #94a3b8; } .details-grid-aligned span { font-size: 10px; font-weight: 600; color: #334155; } .qr { width: 80px; height: 80px; } .bottom-bar { height: 6px; background: #1e293b; width: 100%; }</style></head><body><div class="print-wrapper">${cardsHtml}</div><script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); }</script></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleDownloadImage = async () => {
      const studentsToPrint = students.filter(s => selectedIds.has(s.id));
      if (studentsToPrint.length !== 1) return alert("Select exactly one student.");
      setIsDownloading(true);
      setTimeout(async () => {
          if (idCardRef.current) {
              try {
                  const canvas = await html2canvas(idCardRef.current, { scale: 2, useCORS: true });
                  const link = document.createElement('a');
                  link.download = `ID_${studentsToPrint[0].fullName.replace(/\s+/g, '_')}.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
              } finally { setIsDownloading(false); }
          }
      }, 100);
  };

  const filtered = students.filter(s => {
      const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.mobile.includes(search);
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? s.status === 'ACTIVE' : s.status !== 'ACTIVE');
      const matchSeat = seatFilter === 'ALL' || (seatFilter === 'SEATED' ? !!s.seatId : !s.seatId);
      return matchSearch && matchStatus && matchSeat;
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Directory</h1>
            <p className="text-sm text-slate-500 font-medium">Students & ID Cards</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-xs w-full sm:w-auto">
                <button onClick={() => setActiveTab('DIRECTORY')} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'DIRECTORY' ? 'bg-primary-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><List className="h-4 w-4"/> List</button>
                <button onClick={() => setActiveTab('ID_CARDS')} className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ID_CARDS' ? 'bg-primary-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}><Grid className="h-4 w-4"/> Cards</button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                 <Button variant="secondary" className="flex-1 sm:flex-none py-2.5 rounded-xl text-xs" onClick={() => setIsModalOpen(true)} icon={Plus}>Add</Button>
                 {activeTab === 'ID_CARDS' && (
                     <>
                        <Button variant="outline" className="flex-1 sm:flex-none py-2.5 rounded-xl text-xs bg-white" onClick={handleDownloadImage} disabled={selectedIds.size !== 1} isLoading={isDownloading} icon={Download}>Get PNG</Button>
                        <Button variant="outline" className="flex-1 sm:flex-none py-2.5 rounded-xl text-xs bg-white" onClick={handlePrintIDCard} disabled={selectedIds.size === 0} icon={Printer}>Print</Button>
                     </>
                 )}
            </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-10 h-11 rounded-xl border-slate-200" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
         <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
             <select className="border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 min-w-[120px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                 <option value="ALL">Status: All</option>
                 <option value="ACTIVE">Active</option>
                 <option value="EXPIRED">Inactive</option>
             </select>
             <select className="border-slate-200 rounded-xl px-3 py-2 text-xs font-bold bg-slate-50 min-w-[120px]" value={seatFilter} onChange={(e) => setSeatFilter(e.target.value as any)}>
                 <option value="ALL">Seats: All</option>
                 <option value="SEATED">Seated</option>
                 <option value="UNSEATED">Waitlist</option>
             </select>
         </div>
      </div>

      {activeTab === 'DIRECTORY' ? (
        <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                <tr>
                    <th className="px-6 py-4 w-10">
                        <button onClick={toggleSelectAll} className="flex items-center text-slate-300 hover:text-primary-700 transition-colors">
                            {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                    </th>
                    <th className="px-6 py-4">Occupant</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Details</th>
                    <th className="px-6 py-4">Seat</th>
                    <th className="px-6 py-4 hidden md:table-cell">Expiry</th>
                    <th className="px-6 py-4">Dues</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filtered.map(s => (
                    <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(s.id) ? 'bg-primary-50/30' : ''}`}>
                    <td className="px-6 py-4">
                        <button onClick={() => toggleSelection(s.id)} className={`flex items-center ${selectedIds.has(s.id) ? 'text-primary-700' : 'text-slate-300'}`}>
                            {selectedIds.has(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </button>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            {s.photoUrl ? (
                                <img src={s.photoUrl} alt="p" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-black border border-slate-200">
                                    {s.fullName[0]}
                                </div>
                            )}
                            <div>
                                <div className="font-bold text-slate-900 text-sm leading-tight">{s.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-medium sm:hidden">{s.mobile}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                        <div className="text-[11px] font-bold text-slate-700">{s.class || '-'}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{s.preparation || '-'}</div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-black text-primary-700">{getSeatLabel(s.seatId) || 'N/A'}</span></td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs font-medium text-slate-500">{s.planEndDate}</td>
                    <td className="px-6 py-4"><span className={s.dues > 0 ? "text-xs font-black text-red-600" : "text-xs font-bold text-slate-300"}>₹{s.dues}</span></td>
                    {/* Buffer Zone: onClick StopPropagation prevents row click interference */}
                    <td className="px-6 py-4 text-right" onClick={stopProp}>
                        <div className="flex justify-end gap-1 sm:gap-2 relative z-10">
                            <Button type="button" size="sm" variant="ghost" onClick={(e) => handleEditStudent(e, s)} title="Edit"><Edit className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                            <Button type="button" size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={(e) => handleDeleteStudent(e, s.id)} title="Delete"><Trash2 className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                        </div>
                    </td>
                    </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">No records matching search criteria</td></tr>}
                </tbody>
            </table>
            </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map(s => (
                <div key={s.id} onClick={() => toggleSelection(s.id)} className={`cursor-pointer bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all group relative active:scale-95 ${selectedIds.has(s.id) ? 'ring-2 ring-primary-700 border-primary-700' : 'border-slate-200'}`}>
                    <div className="h-20 bg-primary-800 relative">
                        <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md rounded-lg p-1 h-8 w-auto flex items-center justify-center border border-white/10"><img src={DEFAULT_LOGO} className="h-full w-auto object-contain brightness-0 invert opacity-80" alt="Logo"/></div>
                        <div className="absolute top-3 right-3">
                             {selectedIds.has(s.id) ? <div className="bg-white text-primary-700 rounded-full p-1"><CheckSquare className="h-5 w-5" /></div> : <div className="bg-black/20 text-white/50 rounded-full p-1"><Square className="h-5 w-5" /></div>}
                        </div>
                    </div>
                    <div className="px-4 pb-5 -mt-10 text-center relative z-10">
                        {s.photoUrl ? <img src={s.photoUrl} className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto object-cover bg-white" alt="Profile" /> : <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto bg-slate-100 flex items-center justify-center text-slate-300 font-black text-2xl uppercase">{s.fullName.charAt(0)}</div>}
                        <h3 className="mt-3 font-extrabold text-slate-900 truncate leading-tight">{s.fullName}</h3>
                        <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">{s.preparation || s.class || 'Regular'}</p>
                        <div className="mt-5 grid grid-cols-2 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div><span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">Seat Unit</span><span className="text-xs font-black text-primary-700">{getSeatLabel(s.seatId) || 'None'}</span></div>
                            <div className="text-right"><span className="text-[8px] font-bold text-slate-400 uppercase block leading-none">Valid Upto</span><span className="text-xs font-black text-slate-900">{s.planEndDate}</span></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Seat Picker Modal - NOW WITH HIGHER Z-INDEX */}
      <Modal isOpen={isSeatPickerOpen} onClose={() => setIsSeatPickerOpen(false)} title="Select Seat Assignment" zIndex="z-[60]">
          <div className="space-y-4">
              <div className="flex gap-4 items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Available</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-800 rounded"></div> Occupied</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary-700 rounded"></div> Selected</div>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[50vh] overflow-y-auto p-1">
                  {[...seats].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })).map(seat => {
                      const isOccupied = seat.status === 'OCCUPIED' && seat.studentId !== formData.id;
                      const isSelected = formData.seatId === seat.id;
                      return (
                          <button 
                              key={seat.id}
                              disabled={isOccupied}
                              onClick={() => { setFormData({...formData, seatId: seat.id}); setIsSeatPickerOpen(false); }}
                              className={`
                                  aspect-square rounded-lg flex flex-col items-center justify-center border text-xs font-bold transition-all relative
                                  ${isOccupied ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed' : 
                                    isSelected ? 'bg-primary-700 text-white border-primary-800 shadow-md ring-2 ring-primary-200' : 
                                    'bg-white text-slate-700 border-slate-200 hover:border-primary-400 hover:shadow-sm'}
                              `}
                          >
                              <Armchair className={`h-4 w-4 mb-1 ${isSelected ? 'text-white' : isOccupied ? 'text-slate-300' : 'text-slate-400'}`} />
                              {seat.label}
                          </button>
                      );
                  })}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button onClick={() => { setFormData({...formData, seatId: null}); setIsSeatPickerOpen(false); }} className="text-xs font-bold text-red-600 hover:underline">Clear Selection</button>
                  <button onClick={() => setIsSeatPickerOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Member" : "New Onboarding"}>
         <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1 scrollbar-hide">
             <div className="space-y-4">
                 <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Member Profile</h3>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="col-span-full flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="h-16 w-16 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                             {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <User className="h-8 w-8 text-slate-200" />}
                        </div>
                        <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-extrabold text-slate-400 uppercase mb-2">Member Photo</p>
                             <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-primary-700 file:text-white hover:file:bg-primary-800 transition-colors"/>
                        </div>
                    </div>
                    <Input label="Name" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} className="rounded-xl" />
                    <Input label="Phone" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} className="rounded-xl" />
                    
                    {/* New Fields */}
                    <Input label="Email Address" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="rounded-xl" />
                    <Input label="Alternate Mobile" value={formData.alternateMobile || ''} onChange={e => setFormData({...formData, alternateMobile: e.target.value})} className="rounded-xl" />
                    <Input label="Date of Birth" type="date" value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} className="rounded-xl" />

                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gender</label>
                        <select className="w-full h-11 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-primary-500" value={formData.gender || 'MALE'} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pt-6 pl-1">
                         <input type="checkbox" id="handicap" checked={formData.isHandicapped || false} onChange={e => setFormData({...formData, isHandicapped: e.target.checked})} className="h-5 w-5 text-primary-700 rounded-lg border-slate-200 focus:ring-primary-500"/>
                         <label htmlFor="handicap" className="text-xs font-bold text-slate-600">Handicapped Person</label>
                    </div>
                 </div>
             </div>
             
             <div className="space-y-4">
                 <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Academic & Seat</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Standard</label>
                        <select className="w-full h-11 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white" value={formData.class || ''} onChange={e => setFormData({...formData, class: e.target.value})}>
                            <option value="">Select Level</option>
                            {settings.classes?.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Target Exam</label>
                        <select className="w-full h-11 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold bg-white" value={formData.preparation || ''} onChange={e => setFormData({...formData, preparation: e.target.value})}>
                            <option value="">Select Course</option>
                            {settings.preparations?.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Improved Seat Selection UI */}
                    <div className="col-span-full">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assign Seat</label>
                        <div className="flex gap-2">
                            <div className="flex-1 h-11 border border-slate-200 rounded-xl px-3 flex items-center bg-slate-50 text-sm font-bold text-slate-700">
                                {formData.seatId ? (
                                    <span className="flex items-center gap-2"><Armchair className="h-4 w-4 text-primary-700"/> Seat {getSeatLabel(formData.seatId)}</span>
                                ) : (
                                    <span className="text-slate-400">No seat assigned</span>
                                )}
                            </div>
                            <Button variant="secondary" className="px-6 rounded-xl" onClick={() => setIsSeatPickerOpen(true)}>Select Seat</Button>
                        </div>
                    </div>

                    <div className="col-span-full">
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 ml-1">Admission Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['REGULAR', 'RESERVED'].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({...formData, admissionType: type as any})}
                                    className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${formData.admissionType === type ? 'bg-primary-50 border-primary-700 text-primary-700 ring-2 ring-primary-700/10' : 'bg-white border-slate-100 text-slate-400'}`}
                                >
                                    <span className="text-xs font-black tracking-widest">{type}</span>
                                    <span className="text-[10px] font-bold opacity-60">₹{type === 'REGULAR' ? settings.monthlyFee : settings.reservedFee}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
             </div>
             
             {!formData.id && (
             <div className="space-y-4">
                 <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Initial Payment</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Plan Duration (Months)</label>
                        <input type="number" min="1" max="12" className="w-full h-11 border-slate-200 rounded-xl px-3" value={paymentData.duration} onChange={e => setPaymentData({...paymentData, duration: parseInt(e.target.value) || 1})} />
                     </div>
                     <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Payment Mode</label>
                        <select className="w-full h-11 border-slate-200 rounded-xl px-3 font-bold" value={paymentData.mode} onChange={e => setPaymentData({...paymentData, mode: e.target.value})}>
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI / Online</option>
                            <option value="CARD">Card</option>
                        </select>
                     </div>
                     <div className="col-span-full">
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">Amount Received</label>
                            <span className="text-xs font-medium text-slate-400">Total Due: ₹{calculatedTotal}</span>
                        </div>
                        <div className="relative">
                            <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/>
                            <input type="number" className="w-full h-11 border-slate-200 rounded-xl pl-9 font-bold text-lg text-green-700" value={paymentData.amountPaid} onChange={e => setPaymentData({...paymentData, amountPaid: parseInt(e.target.value) || 0})} />
                        </div>
                     </div>
                 </div>
             </div>
             )}

             <Button className="w-full h-14 rounded-2xl text-base font-black shadow-lg shadow-primary-700/20" onClick={handleSubmit}>Authorize Registration</Button>
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
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [methodFilter, setMethodFilter] = useState('ALL');
    const [profile, setProfile] = useState<LibraryProfile | null>(Store.getProfile());

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
        if (location.state && (location.state as any).openCollection) {
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location]);

    const loadData = () => {
        setPayments([...Store.getPayments()]); // Spread new reference
        setStudents(Store.getStudents());
        setProfile(Store.getProfile());
    };

    const handleDeletePayment = async (e: React.MouseEvent, id: string) => {
        stopProp(e);
        if(window.confirm("Are you sure you want to void this transaction? This action cannot be undone.")) {
            await Store.deletePayment(id);
            loadData();
        }
    };

    const handlePrintReceipt = (e: React.MouseEvent, payment: Payment) => {
        stopProp(e);
        const student = students.find(s => s.id === payment.studentId);
        if(!student) return alert("Student record not found for this payment.");

        const printWindow = window.open('', '_blank');
        if(!printWindow) return;

        const html = `
        <html><head><title>Receipt #${payment.id}</title><style>
        body { font-family: sans-serif; padding: 20px; }
        .receipt { max-width: 350px; margin: 0 auto; border: 1px solid #ccc; padding: 15px; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .total { border-top: 2px dashed #ccc; padding-top: 10px; font-weight: bold; font-size: 16px; margin-top: 10px; }
        .footer { text-align: center; font-size: 10px; color: #666; margin-top: 20px; }
        </style></head><body>
        <div class="receipt">
            <div class="header">
                <h3>${profile?.name || 'Library'}</h3>
                <p style="font-size:12px">${profile?.address}</p>
                <p style="font-size:12px">Ph: ${profile?.contact}</p>
            </div>
            <div class="row"><span>Receipt No:</span><span>${payment.id.slice(-6).toUpperCase()}</span></div>
            <div class="row"><span>Date:</span><span>${payment.date}</span></div>
            <div class="row"><span>Student:</span><span>${payment.studentName}</span></div>
            <div class="row"><span>Type:</span><span>${payment.type}</span></div>
            <div class="row"><span>Mode:</span><span>${payment.method}</span></div>
            <div class="row total"><span>AMOUNT PAID:</span><span>₹${payment.amount}</span></div>
            <div class="footer">Thank you for your payment!<br/>Computer Generated Receipt</div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
        </body></html>`;
        
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleWhatsApp = (e: React.MouseEvent, payment: Payment) => {
        stopProp(e);
        const student = students.find(s => s.id === payment.studentId);
        if(student) {
            const cleanMobile = student.mobile.replace(/\D/g, '').slice(-10);
            const msg = `Dear ${student.fullName}, we have received your payment of ₹${payment.amount} on ${payment.date}. Receipt No: ${payment.id.slice(-6).toUpperCase()}. Thank you! - ${profile?.name || 'Admin'}`;
            window.open(`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            alert("Student mobile number not found.");
        }
    };

    const filtered = payments.filter(p => {
        const matchSearch = p.studentName.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
        const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
        let matchDate = true;
        if (startDate && endDate) {
            matchDate = isWithinInterval(parseISO(p.date), { start: parseISO(startDate), end: parseISO(endDate) });
        }
        return matchSearch && matchMethod && matchDate;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ledger</h1>
                <Button icon={Plus} className="rounded-xl px-6 h-11 shadow-md shadow-primary-700/10" onClick={() => setIsModalOpen(true)}>Collect</Button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 h-11 rounded-xl" placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Input type="date" value={startDate} label="From" onChange={e => setStartDate(e.target.value)} className="h-10 rounded-lg text-xs" />
                    <Input type="date" value={endDate} label="To" onChange={e => setEndDate(e.target.value)} className="h-10 rounded-lg text-xs" />
                    <div className="col-span-full md:col-span-1">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 block">Mode</label>
                        <select className="w-full h-10 border border-slate-200 rounded-lg px-3 text-xs font-bold bg-slate-50" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
                            <option value="ALL">All Channels</option>
                            <option value="CASH">Cash Only</option>
                            <option value="UPI">Digital (UPI)</option>
                            <option value="CARD">Debit/Credit</option>
                        </select>
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Receipt</th>
                                <th className="px-6 py-4">Occupant</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Channel</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                                <th className="px-6 py-4 text-right w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-[10px] font-bold text-slate-400">#{p.id.slice(-6).toUpperCase()}</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{p.date}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{p.studentName}</td>
                                    <td className="px-6 py-4 hidden sm:table-cell uppercase text-[10px] font-black text-slate-400">{p.method}</td>
                                    <td className="px-6 py-4 text-right font-black text-green-700">₹{p.amount}</td>
                                    {/* Stop Prop Buffer Zone */}
                                    <td className="px-6 py-4 text-right" onClick={stopProp}>
                                        <div className="flex justify-end gap-1 relative z-10">
                                            <Button type="button" size="sm" variant="ghost" onClick={(e) => handleWhatsApp(e, p)} className="p-2 text-slate-400 hover:text-green-600" title="WhatsApp Receipt"><MessageCircle className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={(e) => handlePrintReceipt(e, p)} className="p-2 text-slate-400 hover:text-primary-700" title="Print Receipt"><Printer className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={(e) => handleDeletePayment(e, p.id)} className="p-2 text-slate-400 hover:text-red-600" title="Delete Payment"><Trash2 className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400 italic">Financial logs are empty</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export const Enquiries = () => {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Enquiry>>({ status: 'NEW', date: format(new Date(), 'yyyy-MM-dd') });
    const [search, setSearch] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = () => {
        setEnquiries([...Store.getEnquiries()]);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.mobile) return alert("Required fields missing");
        const newEnq: Enquiry = { id: formData.id || 'enq-' + Date.now(), name: formData.name, mobile: formData.mobile, source: formData.source || 'Direct', status: formData.status as any || 'NEW', date: formData.date || format(new Date(), 'yyyy-MM-dd'), notes: formData.notes };
        if (formData.id) await Store.updateEnquiry(newEnq);
        else await Store.addEnquiry(newEnq);
        loadData();
        setIsModalOpen(false);
    };

    const handleDeleteEnquiry = async (e: React.MouseEvent, id: string) => {
        stopProp(e);
        if(window.confirm("Are you sure you want to remove this enquiry?")) {
            await Store.deleteEnquiry(id);
            loadData();
        }
    };

    const handleEditEnquiry = (e: React.MouseEvent, enq: Enquiry) => {
        stopProp(e);
        setFormData(enq);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leads</h1>
                <Button icon={Plus} className="rounded-xl px-6" onClick={() => { setFormData({ status: 'NEW', date: format(new Date(), 'yyyy-MM-dd') }); setIsModalOpen(true); }}>New Enquiry</Button>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="relative">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 h-11 rounded-xl" placeholder="Search by name/source..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
            </div>
            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Lead Info</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Source</th>
                                <th className="px-6 py-4 text-right">Status</th>
                                <th className="px-6 py-4 text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {enquiries.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).map(e => (
                                <tr key={e.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => { setFormData(e); setIsModalOpen(true); }}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 leading-tight">{e.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold tracking-wider">{e.mobile}</div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell font-medium text-slate-500">{e.source}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge variant={e.status === 'CONVERTED' ? 'success' : 'warning'}>{e.status}</Badge>
                                    </td>
                                    {/* Stop Prop Buffer Zone */}
                                    <td className="px-6 py-4 text-right" onClick={stopProp}>
                                        <div className="flex justify-end gap-1 relative z-10">
                                            <Button type="button" size="sm" variant="ghost" onClick={(ev) => handleEditEnquiry(ev, e)} className="p-2 text-slate-400 hover:text-primary-700" title="Edit"><Edit className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                                            <Button type="button" size="sm" variant="ghost" onClick={(ev) => handleDeleteEnquiry(ev, e.id)} className="p-2 text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="h-4 w-4" style={{pointerEvents: 'none'}}/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {enquiries.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">No active enquiries found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Enquiry" : "New Enquiry"}>
                <div className="space-y-4">
                    <Input label="Name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    <Input label="Mobile" value={formData.mobile || ''} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                            <select className="w-full border rounded-md p-2 text-sm" value={formData.source || 'Direct'} onChange={e => setFormData({...formData, source: e.target.value})}>
                                <option value="Direct">Direct Visit</option>
                                <option value="Referral">Referral</option>
                                <option value="Social Media">Social Media</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select className="w-full border rounded-md p-2 text-sm" value={formData.status || 'NEW'} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                <option value="NEW">New</option>
                                <option value="FOLLOW_UP">Follow Up</option>
                                <option value="CONVERTED">Converted</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea className="w-full border rounded-md p-2 text-sm h-24" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                    </div>
                    <Button className="w-full" onClick={handleSave}>Save Record</Button>
                </div>
            </Modal>
        </div>
    );
};

export const Reports = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [seats, setSeats] = useState<Seat[]>([]);
    useEffect(() => { setStudents(Store.getStudents()); setSeats(Store.getSeats()); }, []);
    const maleCount = students.filter(s => s.gender === 'MALE').length;
    const femaleCount = students.filter(s => s.gender === 'FEMALE').length;
    const occupied = seats.filter(s => s.status === 'OCCUPIED').length;
    const available = Math.max(0, seats.length - occupied);
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Intelligence</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Demographic Split" className="min-h-[300px]">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart><Pie data={[{name: 'Male', value: maleCount}, {name: 'Female', value: femaleCount}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"><Cell fill="#3b82f6"/><Cell fill="#ec4899"/></Pie><Tooltip/></RePieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Inventory Capacity" className="min-h-[300px]">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart><Pie data={[{name: 'Occupied', value: occupied}, {name: 'Empty', value: available}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"><Cell fill="#10b981"/><Cell fill="#e2e8f0"/></RePieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const AttendanceHistory = () => {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        setAttendance(Store.getAttendance());
    }, []);

    const filtered = attendance.filter(a => {
        const matchDate = a.date === dateFilter;
        const matchSearch = a.studentName.toLowerCase().includes(search.toLowerCase());
        return matchDate && matchSearch;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Log</h1>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <Input className="pl-10 h-11 rounded-xl" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
                 </div>
                 <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="h-11 rounded-xl sm:w-48" />
            </div>

            <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-extrabold text-slate-400 tracking-widest">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(a => (
                                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{a.time}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900">{a.studentName}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge variant={a.status === 'IN' ? 'success' : 'neutral'}>{a.status}</Badge>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && <tr><td colSpan={3} className="p-12 text-center text-slate-400 italic">No attendance records found for this date</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export const Settings = () => {
    const [profile, setProfile] = useState<LibraryProfile | null>(null);
    const [settings, setSettings] = useState<AppSettings>(Store.getSettings());
    const [activeModal, setActiveModal] = useState<'PROFILE' | 'FEES' | 'ROOMS' | 'ACADEMIC' | null>(null);
    
    // Room Management State
    const [rooms, setRooms] = useState<Room[]>([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [newCapacity, setNewCapacity] = useState('');

    // Academic Tag State
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        setProfile(Store.getProfile());
        setSettings(Store.getSettings());
        setRooms(Store.getRooms());
    }, []);

    const handleSaveProfile = async () => {
        if(profile) { await Store.saveProfile(profile); setActiveModal(null); }
    };

    const handleAddRoom = async () => {
        if(!newRoomName || !newCapacity) return alert("Enter Name and Capacity");
        const cap = parseInt(newCapacity);
        if(cap <= 0) return alert("Capacity must be positive");

        const room: Room = {
            id: 'room-' + Date.now(),
            name: newRoomName,
            capacity: cap
        };
        await Store.addRoom(room);
        setRooms([...Store.getRooms()]);
        setNewRoomName('');
        setNewCapacity('');
        alert("Room added! Seats have been generated automatically.");
    };

    const handleDeleteRoom = async (e: React.MouseEvent, id: string) => {
        stopProp(e);
        if(window.confirm("Warning: Deleting this room will remove all associated seats permanently. Continue?")) {
            await Store.deleteRoom(id);
            setRooms([...Store.getRooms()]); // Force refresh state
        }
    };

    const handleAddTag = (type: 'classes' | 'preparations') => {
        if(!newTag) return;
        const current = settings[type] || [];
        if(current.includes(newTag)) return;
        
        const updated = { ...settings, [type]: [...current, newTag] };
        setSettings(updated);
        Store.saveSettings(updated);
        setNewTag('');
    };

    const handleRemoveTag = (type: 'classes' | 'preparations', value: string) => {
        const current = settings[type] || [];
        const updated = { ...settings, [type]: current.filter(t => t !== value) };
        setSettings(updated);
        Store.saveSettings(updated);
    };

    return (
        <div className="space-y-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">System Settings</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[
                    { id: 'PROFILE', label: 'Library Branding', desc: 'Logo, Name & Public info', icon: Building2, color: 'blue' },
                    { id: 'FEES', label: 'Revenue & Tiers', desc: 'Pricing and maintenance', icon: Banknote, color: 'green' },
                    { id: 'ROOMS', label: 'Space Blueprint', desc: 'Manage units and rooms', icon: Armchair, color: 'purple' },
                    { id: 'ACADEMIC', label: 'Curriculum tags', desc: 'Exam lists & Leveling', icon: FileText, color: 'orange' }
                ].map(card => (
                    <div key={card.id} onClick={() => setActiveModal(card.id as any)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg cursor-pointer transition-all hover:border-primary-400 group active:scale-95">
                        <div className={`h-12 w-12 bg-${card.color}-50 rounded-xl flex items-center justify-center text-${card.color}-600 mb-4 group-hover:scale-110 transition-transform shadow-xs`}>
                            <card.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-extrabold text-slate-900 mb-1">{card.label}</h3>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Profile Modal */}
            <Modal isOpen={activeModal === 'PROFILE'} onClose={() => setActiveModal(null)} title="Identity Console">
                <div className="space-y-4">
                    <Input label="Business Name" value={profile?.name || ''} onChange={e => setProfile({...profile!, name: e.target.value})} className="rounded-xl" />
                    <Input label="Public Address" value={profile?.address || ''} onChange={e => setProfile({...profile!, address: e.target.value})} className="rounded-xl" />
                    <Input label="Contact Desk" value={profile?.contact || ''} onChange={e => setProfile({...profile!, contact: e.target.value})} className="rounded-xl" />
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Visual ID (Logo URL)</label>
                         <div className="flex gap-4 items-center">
                             <input className="flex-1 h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs" value={profile?.logoUrl || ''} onChange={e => setProfile({...profile!, logoUrl: e.target.value})} placeholder="https://..." />
                             {profile?.logoUrl && <img src={profile.logoUrl} className="h-10 w-10 rounded-lg object-contain border bg-white" alt="L"/>}
                         </div>
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-primary-700/10">Synchronize Identity</Button>
                </div>
            </Modal>

            {/* Fees Modal */}
            <Modal isOpen={activeModal === 'FEES'} onClose={() => setActiveModal(null)} title="Pricing Framework">
                <div className="space-y-5">
                    <Input label="Monthly Subscription (Regular)" type="number" value={settings.monthlyFee} onChange={e => setSettings({...settings, monthlyFee: Number(e.target.value)})} className="rounded-xl" />
                    <Input label="Premium Tier (Reserved)" type="number" value={settings.reservedFee || ''} onChange={e => setSettings({...settings, reservedFee: Number(e.target.value)})} className="rounded-xl" />
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                        <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} className="w-5 h-5 rounded-lg text-orange-600 border-orange-200" />
                        <div>
                            <span className="text-xs font-bold text-orange-900 block">MAINTENANCE LOCKDOWN</span>
                            <span className="text-[10px] font-medium text-orange-700 leading-tight">Restrict unit assignments and student interactions.</span>
                        </div>
                    </div>
                    <Button onClick={() => { Store.saveSettings(settings); setActiveModal(null); }} className="w-full h-12 rounded-xl text-sm font-bold">Apply Changes</Button>
                </div>
            </Modal>

            {/* Space Blueprint Modal */}
            <Modal isOpen={activeModal === 'ROOMS'} onClose={() => setActiveModal(null)} title="Space Blueprint">
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Add New Zone</h4>
                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-3">
                                <Input placeholder="Room Name (e.g. Hall A)" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="h-10 text-xs" />
                            </div>
                            <div className="col-span-2">
                                <Input type="number" placeholder="Cap." value={newCapacity} onChange={e => setNewCapacity(e.target.value)} className="h-10 text-xs" />
                            </div>
                            <Button onClick={handleAddRoom} className="col-span-5 h-10 text-xs font-bold bg-slate-900">Generate Zone & Seats</Button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Seats are automatically created based on capacity.</p>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {rooms.map(room => (
                            <div key={room.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                <div>
                                    <div className="font-bold text-sm text-slate-900">{room.name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Capacity: {room.capacity} Units</div>
                                </div>
                                <Button type="button" size="sm" variant="danger" className="h-8 px-3 text-[10px] font-bold" onClick={(e) => handleDeleteRoom(e, room.id)}>Delete Zone</Button>
                            </div>
                        ))}
                        {rooms.length === 0 && <div className="text-center text-xs text-slate-400 py-4 italic">No rooms configured.</div>}
                    </div>
                </div>
            </Modal>

            {/* Academic Modal */}
            <Modal isOpen={activeModal === 'ACADEMIC'} onClose={() => setActiveModal(null)} title="Curriculum Tags">
                <div className="space-y-6">
                    {/* Classes Section */}
                    <div>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Classes / Academy, Self Study</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {settings.classes?.map(c => (
                                <span key={c} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                                    {c}
                                    <button onClick={() => handleRemoveTag('classes', c)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add Class (e.g. 10th)" value={newTag} onChange={e => setNewTag(e.target.value)} className="h-9 text-xs" />
                            <Button onClick={() => handleAddTag('classes')} className="h-9 w-9 p-0 bg-slate-900"><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    {/* Preparations Section */}
                    <div>
                        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-1">Target Exams / Courses</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {settings.preparations?.map(p => (
                                <span key={p} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
                                    {p}
                                    <button onClick={() => handleRemoveTag('preparations', p)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input placeholder="Add Course (e.g. UPSC)" value={newTag} onChange={e => setNewTag(e.target.value)} className="h-9 text-xs" />
                            <Button onClick={() => handleAddTag('preparations')} className="h-9 w-9 p-0 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
