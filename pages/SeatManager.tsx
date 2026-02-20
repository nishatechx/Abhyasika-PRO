
import React, { useEffect, useState } from 'react';
import { Store } from '../services/store';
import { Seat, Student, Room } from '../types';
import { Card, Badge, Modal, Button, Input } from '../components/ui';
// Added Users to imports
import { User, UserPlus, Armchair, Filter, Zap, Heart, Accessibility, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const SeatManager = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'GENERAL' | 'AC' | 'LADIES'>('ALL');
  
  const [assignTab, setAssignTab] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const loadedSeats = Store.getSeats();
    setSeats(loadedSeats || []);
    setStudents(Store.getStudents() || []);
  };

  const getSeatColor = (seat: Seat) => {
    if (seat.status === 'AVAILABLE') return 'bg-white border-slate-200 text-slate-700 hover:border-primary-400 hover:shadow-md';
    if (seat.status === 'MAINTENANCE') return 'bg-gradient-to-br from-yellow-300 to-yellow-500 border-yellow-500 text-yellow-900 shadow-sm';
    if (seat.status === 'OCCUPIED') {
        const occupant = students.find(s => s.id === seat.studentId);
        if (!occupant) return 'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-800 text-white shadow-md';
        
        // Priority 1: Handicap
        if (occupant.isHandicapped) return 'bg-black border-slate-900 text-white shadow-md';
        
        // Priority 2: Admission Type
        if (occupant.admissionType === 'RESERVED') return 'bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-700 text-white shadow-md';
        
        // Priority 3: Gender 
        // Note: Moving Gender above Regular to ensure gender colors are visible if admission is just standard regular
        if (occupant.gender === 'FEMALE') return 'bg-gradient-to-br from-pink-400 to-pink-600 border-pink-600 text-white shadow-md';
        if (occupant.gender === 'MALE') return 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-700 text-white shadow-md';

        // Fallback for Regular if no gender match (shouldn't happen given types)
        if (occupant.admissionType === 'REGULAR') return 'bg-gradient-to-br from-red-500 to-red-700 border-red-700 text-white shadow-md';
        
        return 'bg-gradient-to-br from-blue-500 to-blue-700 border-blue-700 text-white shadow-md';
    }
    return 'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-800 text-white shadow-md';
  };

  const checkRegularLimit = (isNewRegular: boolean) => {
      if (!isNewRegular) return true;
      const regularCount = students.filter(s => s.seatId && s.admissionType === 'REGULAR').length;
      if (regularCount >= 2) {
          alert("Limit Reached: Only 2 students can hold a 'Not Reserved' seat per session.");
          return false;
      }
      return true;
  };

  const handleAssignExisting = async () => {
    if (!selectedSeat || !selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    // Removed strict regular limit check as per general usage patterns, but kept helper if needed later
    // if (!checkRegularLimit(student.admissionType === 'REGULAR')) return;
    
    const updatedStudent = { ...student, seatId: selectedSeat.id };
    await Store.updateStudent(updatedStudent);
    const updatedSeat: Seat = { ...selectedSeat, status: 'OCCUPIED', studentId: student.id };
    Store.updateSeat(updatedSeat);
    loadData();
    setSelectedSeat(null);
    setSelectedStudentId('');
  };

  const handleQuickAdd = async () => {
    if (!selectedSeat || !newStudent.fullName || !newStudent.mobile) return;
    // if (!checkRegularLimit(true)) return;
    const studentData: Student = {
        id: 's-' + Date.now(),
        fullName: newStudent.fullName,
        mobile: newStudent.mobile,
        seatId: selectedSeat.id,
        status: 'ACTIVE',
        joinDate: format(new Date(), 'yyyy-MM-dd'),
        planEndDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        gender: 'MALE', 
        dues: 0,
        planType: 'MONTHLY',
        admissionType: 'REGULAR'
    };
    await Store.addStudent(studentData);
    loadData();
    setSelectedSeat(null);
    setNewStudent({});
  };

  const handleVacateSeat = async () => {
      if(!selectedSeat) return;
      
      // If occupied, remove student assignment
      if(selectedSeat.studentId) {
          const student = students.find(s => s.id === selectedSeat.studentId);
          if(student) {
              const updatedStudent = { ...student, seatId: null };
              await Store.updateStudent(updatedStudent);
          }
      }
      
      // Make seat available
      const updatedSeat: Seat = { ...selectedSeat, status: 'AVAILABLE', studentId: undefined };
      Store.updateSeat(updatedSeat);
      loadData();
      setSelectedSeat(null);
  };

  const filteredSeats = seats.filter(s => {
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const seatCat = s.category || 'GENERAL';
      const matchCategory = categoryFilter === 'ALL' || seatCat === categoryFilter;
      return matchStatus && matchCategory;
  }).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
  
  const occupiedStudent = selectedSeat?.studentId ? students.find(s => s.id === selectedSeat.studentId) : null;
  const unseatedStudents = students.filter(s => !s.seatId);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-5">
        <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Seat Manager</h1>
            <p className="text-sm text-slate-500 font-medium">Real-time floor arrangement</p>
        </div>
        
        {/* Color Legend Bar - UPDATED */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-blue-500 to-blue-700"></div><span className="text-xs font-bold text-slate-600">Male</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-pink-400 to-pink-600"></div><span className="text-xs font-bold text-slate-600">Female</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-black flex items-center justify-center"><Accessibility className="h-2 w-2 text-white"/></div><span className="text-xs font-bold text-slate-600">Handicap</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-red-500 to-red-700"></div><span className="text-xs font-bold text-slate-600">Regular</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-emerald-500 to-emerald-700"></div><span className="text-xs font-bold text-slate-600">Reserved</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-white border border-slate-300"></div><span className="text-xs font-bold text-slate-600">Empty</span></div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-gradient-to-br from-yellow-300 to-yellow-500"></div><span className="text-xs font-bold text-slate-600">Repair</span></div>
            </div>
            
            {/* Filters integrated into bar */}
            <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select className="bg-slate-50 border-none text-xs font-bold text-slate-600 rounded-lg focus:ring-0 cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                    <option value="ALL">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                </select>
            </div>
        </div>
      </div>

      <Card className="p-4 sm:p-6 overflow-hidden">
        {filteredSeats.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3 sm:gap-4">
            {filteredSeats.map(seat => {
                 const occupant = seat.studentId ? students.find(s => s.id === seat.studentId) : null;
                 const isSelected = selectedSeat?.id === seat.id;

                 return (
                <div
                    key={seat.id}
                    onClick={() => { setSelectedSeat(seat); setAssignTab('EXISTING'); setSelectedStudentId(''); setNewStudent({}); }}
                    className={`relative group aspect-square rounded-xl sm:rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 active:scale-90 touch-manipulation ${isSelected ? 'bg-slate-800 text-white border-slate-900 ring-4 ring-primary-700/30 z-10 scale-110 shadow-xl' : getSeatColor(seat)}`}
                >
                    {seat.category === 'AC' && <div className="absolute top-1.5 left-1.5"><Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-400 fill-blue-400 drop-shadow-sm" /></div>}
                    {seat.category === 'LADIES' && <div className="absolute top-1.5 left-1.5"><Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-pink-400 fill-pink-400 drop-shadow-sm" /></div>}
                    {occupant?.isHandicapped && <div className="absolute top-1.5 left-1.5"><Accessibility className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white drop-shadow-md" /></div>}

                    <Armchair className={`h-6 w-6 sm:h-8 sm:w-8 mb-0.5 sm:mb-1 transition-transform group-hover:scale-110 ${seat.status === 'OCCUPIED' || isSelected ? 'fill-white/10 text-white/50' : 'text-slate-300'}`} strokeWidth={1.5} />
                    <span className={`text-[10px] sm:text-xs font-black font-mono ${seat.status === 'OCCUPIED' || isSelected ? 'text-white' : 'text-slate-700'}`}>{seat.label}</span>
                    
                    {seat.status === 'OCCUPIED' && !isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white/40 rounded-full animate-pulse shadow-sm"></div>
                        </div>
                    )}
                </div>
            )})}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Armchair className="h-16 w-16 mb-4 opacity-10" />
                <p className="font-bold uppercase tracking-widest text-xs">No matching seats</p>
                <button onClick={() => {setStatusFilter('ALL'); setCategoryFilter('ALL')}} className="text-primary-700 text-sm mt-3 font-bold hover:underline">Reset View</button>
            </div>
        )}
      </Card>

      <Modal isOpen={!!selectedSeat} onClose={() => setSelectedSeat(null)} title={`Unit Terminal: ${selectedSeat?.label}`}>
        <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                     <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Live Status</span>
                     <Badge variant={selectedSeat?.status === 'OCCUPIED' ? 'warning' : 'success'}>
                        {selectedSeat?.status}
                     </Badge>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Configuration</span>
                    <span className="text-sm font-black text-slate-900">{selectedSeat?.category || 'GENERAL'}</span>
                </div>
            </div>
            
            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
                 <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded-md text-primary-700 border-slate-300 focus:ring-primary-500"
                    checked={selectedSeat?.status === 'MAINTENANCE'} 
                    onChange={(e) => {
                        if(selectedSeat?.status === 'OCCUPIED') return alert("Operation Denied: Seat is currently in use.");
                        const newStatus = e.target.checked ? 'MAINTENANCE' : 'AVAILABLE';
                        Store.updateSeat({...selectedSeat!, status: newStatus});
                        loadData();
                        setSelectedSeat({...selectedSeat!, status: newStatus});
                    }}
                 />
                 <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Toggle Maintenance Lock</span>
            </label>

            {selectedSeat?.status === 'OCCUPIED' ? (
                <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Occupant</h4>
                    {occupiedStudent ? (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                        {occupiedStudent.photoUrl ? (
                                            <img src={occupiedStudent.photoUrl} className="w-full h-full object-cover" alt="Student" />
                                        ) : (
                                            <User className="h-6 w-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{occupiedStudent.fullName}</h3>
                                        <p className="text-xs text-slate-500 font-medium">{occupiedStudent.mobile}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant={occupiedStudent.dues > 0 ? 'error' : 'success'}>
                                        {occupiedStudent.dues > 0 ? `Due: ₹${occupiedStudent.dues}` : 'Paid'}
                                    </Badge>
                                    <span className={`text-[10px] font-bold ${occupiedStudent.gender === 'FEMALE' ? 'text-pink-500' : 'text-blue-500'}`}>{occupiedStudent.gender}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Course</span>
                                    <span className="text-xs font-bold text-slate-700">{occupiedStudent.preparation || occupiedStudent.class || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Plan Ends</span>
                                    <span className={`text-xs font-bold ${new Date(occupiedStudent.planEndDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                        {occupiedStudent.planEndDate}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Admission</span>
                                    <span className="text-xs font-bold text-primary-700">{occupiedStudent.admissionType === 'REGULAR' ? 'Not Reserved' : 'Reserved'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Joined</span>
                                    <span className="text-xs font-bold text-slate-700">{occupiedStudent.joinDate}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 text-sm font-bold flex items-center gap-2">
                             <AlertCircle className="h-5 w-5" />
                             Student data not found (Ghost Seat)
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                         <Button variant="danger" className="flex-1 h-12 rounded-xl text-sm font-bold" onClick={handleVacateSeat}>Make Available</Button>
                    </div>
                </div>
            ) : (selectedSeat?.status === 'AVAILABLE') ? (
                <div className="pt-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
                        <button 
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${assignTab === 'EXISTING' ? 'bg-white shadow-sm text-primary-700' : 'text-slate-500'}`}
                            onClick={() => setAssignTab('EXISTING')}
                        >
                            Waitlist
                        </button>
                        <button 
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${assignTab === 'NEW' ? 'bg-white shadow-sm text-primary-700' : 'text-slate-500'}`}
                            onClick={() => setAssignTab('NEW')}
                        >
                            Quick Add
                        </button>
                    </div>

                    {assignTab === 'EXISTING' ? (
                        <div className="space-y-4 animate-fade-in-up">
                            {unseatedStudents.length > 0 ? (
                                <>
                                    <div className="relative">
                                        <select 
                                            className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none transition-all"
                                            value={selectedStudentId}
                                            onChange={(e) => setSelectedStudentId(e.target.value)}
                                        >
                                            <option value="">-- Choose Profile --</option>
                                            {unseatedStudents.map(s => (
                                                <option key={s.id} value={s.id}>{s.fullName} ({s.admissionType || 'REGULAR'})</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 rotate-90 pointer-events-none" />
                                    </div>
                                    <Button className="w-full h-12 rounded-xl text-sm font-bold" disabled={!selectedStudentId} onClick={handleAssignExisting}>Complete Assignment</Button>
                                </>
                            ) : (
                                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waitlist Empty</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in-up">
                            <Input label="Full Name" placeholder="Search or Type Name" value={newStudent.fullName || ''} onChange={e => setNewStudent({...newStudent, fullName: e.target.value})} className="h-11 rounded-xl" />
                            <Input label="Mobile" placeholder="Contact Number" value={newStudent.mobile || ''} onChange={e => setNewStudent({...newStudent, mobile: e.target.value})} className="h-11 rounded-xl" />
                            <Button className="w-full h-12 rounded-xl text-sm font-bold mt-2" onClick={handleQuickAdd} icon={UserPlus}>Onboard Student</Button>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
      </Modal>
    </div>
  );
};
