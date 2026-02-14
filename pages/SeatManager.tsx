
import React, { useEffect, useState } from 'react';
import { Store } from '../services/store';
import { Seat, Student, Room } from '../types';
import { Card, Badge, Modal, Button, Input } from '../components/ui';
import { User, UserPlus, Armchair, Filter, Zap, Heart, Accessibility } from 'lucide-react';
import { format, addDays } from 'date-fns';

export const SeatManager = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  // Removed Room State as we now show all seats
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  
  // Advanced Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'GENERAL' | 'AC' | 'LADIES'>('ALL');
  
  // Assignment State
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
    switch (seat.status) {
      case 'AVAILABLE': 
        return 'bg-white border-slate-200 text-slate-700 hover:border-primary-400 hover:shadow-md';
      
      case 'OCCUPIED':
        // Find the student to check attributes
        const occupant = students.find(s => s.id === seat.studentId);
        if (!occupant) return 'bg-primary-900 border-primary-950 text-white'; // Fallback Dark Blue

        if (occupant.isHandicapped) return 'bg-black border-slate-900 text-white';
        if (occupant.gender === 'FEMALE') return 'bg-pink-900 border-pink-950 text-white';
        return 'bg-primary-900 border-primary-950 text-white'; // Default Male
      
      case 'MAINTENANCE': 
        return 'bg-red-50 border-red-200 text-red-400';
      
      case 'RESERVED': 
        return 'bg-purple-50 border-purple-200 text-purple-600';
      
      default: 
        return 'bg-white';
    }
  };

  const handleAssignExisting = async () => {
    if (!selectedSeat || !selectedStudentId) return;
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    // 1. Update Student
    const updatedStudent = { ...student, seatId: selectedSeat.id };
    await Store.updateStudent(updatedStudent);

    // 2. Update Seat Status
    const updatedSeat: Seat = { ...selectedSeat, status: 'OCCUPIED', studentId: student.id };
    Store.updateSeat(updatedSeat);

    loadData();
    setSelectedSeat(null);
    setSelectedStudentId('');
  };

  const handleQuickAdd = async () => {
    if (!selectedSeat || !newStudent.fullName || !newStudent.mobile) return;

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
        planType: 'MONTHLY'
    };

    await Store.addStudent(studentData); // handles seat update internally in Store.addStudent
    loadData();
    setSelectedSeat(null);
    setNewStudent({});
  };

  const handleVacateSeat = async () => {
      if(!selectedSeat || !selectedSeat.studentId) return;

      // 1. Find Student and remove seatId
      const student = students.find(s => s.id === selectedSeat.studentId);
      if(student) {
          const updatedStudent = { ...student, seatId: null };
          await Store.updateStudent(updatedStudent);
      }

      // 2. Update Seat
      const updatedSeat: Seat = { ...selectedSeat, status: 'AVAILABLE', studentId: undefined };
      Store.updateSeat(updatedSeat);
      
      loadData();
      setSelectedSeat(null);
  };

  // Filter Logic - No Room Filter
  const filteredSeats = seats.filter(s => {
      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
      const seatCat = s.category || 'GENERAL';
      const matchCategory = categoryFilter === 'ALL' || seatCat === categoryFilter;
      return matchStatus && matchCategory;
  });
  
  const occupiedStudent = selectedSeat?.studentId ? students.find(s => s.id === selectedSeat.studentId) : null;
  const unseatedStudents = students.filter(s => !s.seatId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Seat Management</h1>
            <p className="text-sm text-slate-500">Manage seating arrangement, reservations and maintenance.</p>
        </div>
        
        {/* Removed Room Tabs - Showing All Seats */}

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                <div className="flex flex-wrap gap-1">
                    {['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f as any)}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${statusFilter === f ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Category:</span>
                <div className="flex flex-wrap gap-1">
                    {['ALL', 'GENERAL', 'AC', 'LADIES'].map(f => (
                        <button
                            key={f}
                            onClick={() => setCategoryFilter(f as any)}
                            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${categoryFilter === f ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      <Card className="p-6 min-h-[500px]">
        {filteredSeats.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
            {filteredSeats.map(seat => {
                 const occupant = seat.studentId ? students.find(s => s.id === seat.studentId) : null;
                 const isHandicapped = occupant?.isHandicapped;
                 const isSelected = selectedSeat?.id === seat.id;

                 return (
                <div
                    key={seat.id}
                    onClick={() => { setSelectedSeat(seat); setAssignTab('EXISTING'); setSelectedStudentId(''); setNewStudent({}); }}
                    className={`relative group aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isSelected ? 'bg-slate-800 text-white border-slate-900 ring-4 ring-primary-700 shadow-md transform -translate-y-1' : getSeatColor(seat)}`}
                >
                    {/* Category Indicator Dot */}
                    {seat.category === 'AC' && <div className="absolute top-2 left-2"><Zap className="h-3 w-3 text-blue-400 fill-blue-400" /></div>}
                    {seat.category === 'LADIES' && <div className="absolute top-2 left-2"><Heart className="h-3 w-3 text-pink-400 fill-pink-400" /></div>}
                    {isHandicapped && <div className="absolute top-2 left-2"><Accessibility className="h-3 w-3 text-slate-200" /></div>}

                    {/* Seat Icon */}
                    <Armchair className={`h-8 w-8 mb-1 transition-transform group-hover:scale-110 ${seat.status === 'OCCUPIED' || isSelected ? 'fill-slate-800 text-slate-600 opacity-80' : 'text-slate-400'}`} strokeWidth={1.5} />
                    
                    {/* Seat Number */}
                    <span className={`text-sm font-bold font-mono ${seat.status === 'OCCUPIED' || isSelected ? 'text-white' : 'text-slate-700'}`}>{seat.label}</span>
                    
                    {/* Status Pulse */}
                    {seat.status === 'OCCUPIED' && !isSelected && (
                        <div className="absolute top-2 right-2">
                            <div className="bg-emerald-500 rounded-full p-1 shadow-sm animate-pulse"></div>
                        </div>
                    )}
                     {seat.status === 'MAINTENANCE' && (
                        <div className="absolute top-2 right-2 text-xs text-red-500">⚠</div>
                    )}
                </div>
            )})}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Armchair className="h-12 w-12 mb-2 opacity-20" />
                <p>No seats found matching your filters.</p>
                <button onClick={() => {setStatusFilter('ALL'); setCategoryFilter('ALL')}} className="text-primary-700 text-sm mt-2 hover:underline">Clear Filters</button>
            </div>
        )}
        
        <div className="mt-8 flex gap-6 justify-center flex-wrap border-t border-slate-100 pt-6">
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-primary-900 border border-primary-950 rounded"></div>
               <span className="text-xs font-medium text-slate-500">Male</span>
           </div>
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-pink-900 border border-pink-950 rounded"></div>
               <span className="text-xs font-medium text-slate-500">Female</span>
           </div>
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-black border border-slate-800 rounded"></div>
               <span className="text-xs font-medium text-slate-500">Handicapped</span>
           </div>
            <div className="w-px h-4 bg-slate-300 mx-2"></div>
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
               <span className="text-xs font-medium text-slate-500">Available</span>
           </div>
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
               <span className="text-xs font-medium text-slate-500">Maintenance</span>
           </div>
        </div>
      </Card>

      <Modal 
        isOpen={!!selectedSeat} 
        onClose={() => setSelectedSeat(null)} 
        title={`Seat Details: ${selectedSeat?.label}`}
      >
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                     <span className="text-sm font-medium text-slate-500 block">Status</span>
                     <Badge variant={selectedSeat?.status === 'OCCUPIED' ? 'warning' : 'success'}>
                        {selectedSeat?.status}
                     </Badge>
                </div>
                {selectedSeat?.category && (
                    <div className="text-right">
                        <span className="text-sm font-medium text-slate-500 block">Category</span>
                        <span className="text-sm font-bold text-slate-900">{selectedSeat.category}</span>
                    </div>
                )}
            </div>
            
            {/* Maintenance Toggle */}
            <div className="flex items-center gap-2 pb-2">
                 <input 
                    type="checkbox" 
                    id="maint" 
                    checked={selectedSeat?.status === 'MAINTENANCE'} 
                    onChange={(e) => {
                        if(selectedSeat?.status === 'OCCUPIED') return alert("Cannot set occupied seat to maintenance.");
                        const newStatus = e.target.checked ? 'MAINTENANCE' : 'AVAILABLE';
                        Store.updateSeat({...selectedSeat!, status: newStatus});
                        loadData();
                        setSelectedSeat({...selectedSeat!, status: newStatus});
                    }}
                 />
                 <label htmlFor="maint" className="text-sm text-slate-600">Mark as Under Maintenance</label>
            </div>

            {selectedSeat?.status === 'OCCUPIED' && occupiedStudent ? (
                <div className="space-y-3 border-t border-slate-100 pt-3">
                    <h4 className="font-semibold text-slate-900">Occupant Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-slate-500">Name:</div>
                        <div className="font-medium">{occupiedStudent.fullName}</div>
                        <div className="text-slate-500">Mobile:</div>
                        <div className="font-medium">{occupiedStudent.mobile}</div>
                        <div className="text-slate-500">Plan Ends:</div>
                        <div className="font-medium text-primary-700">{occupiedStudent.planEndDate}</div>
                    </div>
                    {occupiedStudent.isHandicapped && (
                         <Badge variant="neutral">♿ Handicapped Seat</Badge>
                    )}
                    <div className="pt-4 flex gap-2">
                         <Button size="sm" variant="outline" className="flex-1">View Profile</Button>
                         <Button size="sm" variant="danger" className="flex-1" onClick={handleVacateSeat}>Vacate Seat</Button>
                    </div>
                </div>
            ) : (selectedSeat?.status === 'AVAILABLE') ? (
                <div className="pt-2">
                    <div className="flex border-b border-slate-200 mb-4">
                        <button 
                            className={`flex-1 py-2 text-sm font-medium border-b-2 ${assignTab === 'EXISTING' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500'}`}
                            onClick={() => setAssignTab('EXISTING')}
                        >
                            Select Student
                        </button>
                        <button 
                            className={`flex-1 py-2 text-sm font-medium border-b-2 ${assignTab === 'NEW' ? 'border-primary-700 text-primary-700' : 'border-transparent text-slate-500'}`}
                            onClick={() => setAssignTab('NEW')}
                        >
                            New Admission
                        </button>
                    </div>

                    {assignTab === 'EXISTING' ? (
                        <div className="space-y-3 animate-fade-in-up">
                            <label className="block text-sm font-medium text-slate-700">Select Unseated Student</label>
                            {unseatedStudents.length > 0 ? (
                                <select 
                                    className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                >
                                    <option value="">-- Choose Student --</option>
                                    {unseatedStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.fullName} ({s.mobile})</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-slate-400 italic py-2">No students currently waiting for a seat.</p>
                            )}
                            <Button 
                                className="w-full mt-2" 
                                disabled={!selectedStudentId} 
                                onClick={handleAssignExisting}
                            >
                                Confirm Assignment
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in-up">
                            <Input 
                                label="Full Name" 
                                placeholder="Student Name"
                                value={newStudent.fullName || ''}
                                onChange={e => setNewStudent({...newStudent, fullName: e.target.value})}
                            />
                            <Input 
                                label="Mobile Number" 
                                placeholder="10-digit mobile"
                                value={newStudent.mobile || ''}
                                onChange={e => setNewStudent({...newStudent, mobile: e.target.value})}
                            />
                            <Button className="w-full mt-2" onClick={handleQuickAdd} icon={UserPlus}>
                                Register & Assign
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-4 text-slate-500">
                    <p>This seat is currently unavailable ({selectedSeat?.status}).</p>
                    {selectedSeat?.status === 'MAINTENANCE' && (
                         <Button size="sm" variant="outline" className="mt-2" onClick={() => {
                            Store.updateSeat({...selectedSeat!, status: 'AVAILABLE'});
                            loadData();
                            setSelectedSeat({...selectedSeat!, status: 'AVAILABLE'});
                        }}>
                            Mark Active
                        </Button>
                    )}
                </div>
            )}
        </div>
      </Modal>
    </div>
  );
};
