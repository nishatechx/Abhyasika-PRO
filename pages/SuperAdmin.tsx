
import React, { useState, useEffect } from 'react';
import { Store } from '../services/store';
import { LibraryAccount, Notification } from '../types';
import { Button, Input, Card, Badge, Modal, StatCard } from '../components/ui';
import { 
  Plus, Trash2, LogOut, Database, User, Building2, 
  Search, Check, ShieldCheck, Activity, Edit, 
  Settings as SettingsIcon, LayoutDashboard, Users, AlertCircle, 
  BellRing, PieChart, MessageSquare, Send, Mail, CheckSquare, Square
} from 'lucide-react';
import { format, addMonths, parseISO, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart as RePieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// --- DATA: MAHARASHTRA DISTRICTS ---
const MAHARASHTRA_DATA: Record<string, string[]> = {
    "Ahmednagar": ["Akole", "Jamkhed", "Karjat", "Kopargaon", "Nagar", "Nevasa", "Parner", "Pathardi", "Rahata", "Rahuri", "Sangamner", "Shevgaon", "Shrigonda", "Shrirampur"],
    "Akola": ["Akola", "Akot", "Balapur", "Barshitakli", "Murtijapur", "Patur", "Telhara"],
    "Amravati": ["Achalpur", "Amravati", "Anjangaon Surji", "Bhatkuli", "Chandur Railway", "Chandur Bazar", "Chikhaldara", "Daryapur", "Dhamangaon Railway", "Dharni", "Morshi", "Nandgaon-Khandeshwar", "Teosa", "Warud"],
    "Chhatrapati Sambhajinagar": ["Aurangabad", "Gangapur", "Kannad", "Khultabad", "Paithan", "Phulambri", "Sillod", "Soegaon", "Vaijapur"],
    "Beed": ["Ambejogai", "Ashti", "Beed", "Dharur", "Georai", "Kaij", "Majalgaon", "Parli", "Patoda", "Shirur (Kasar)", "Wadwani"],
    "Bhandara": ["Bhandara", "Lakhandur", "Lakhani", "Mohadi", "Pauni", "Sakoli", "Tumsar"],
    "Buldhana": ["Buldhana", "Chikhli", "Deulgaon Raja", "Jalgaon (Jamod)", "Khamgaon", "Lonar", "Malkapur", "Mehkar", "Motala", "Nandura", "Sangrampur", "Shegaon", "Sindkhed Raja"],
    "Chandrapur": ["Ballarpur", "Bhadrawati", "Bramhapuri", "Chandrapur", "Chimur", "Gondpipri", "Jivti", "Korpana", "Mul", "Nagbhid", "Pombhurna", "Rajura", "Sawali", "Sindewahi", "Warora"],
    "Dhule": ["Dhule", "Sakri", "Shirpur", "Sindkheda"],
    "Gadchiroli": ["Aheri", "Armori", "Bhamragad", "Chamorshi", "Desaiganj (Vadasa)", "Dhanora", "Etapalli", "Gadchiroli", "Korchi", "Kurkheda", "Mulchera", "Sironcha"],
    "Gondia": ["Amgaon", "Arjuni Morgaon", "Deori", "Gondia", "Goregaon", "Sadak Arjuni", "Salekasa", "Tirora"],
    "Hingoli": ["Aundha Nagnath", "Basmat", "Hingoli", "Kalamnuri", "Sengaon"],
    "Jalgaon": ["Amalner", "Bhadgaon", "Bhusawal", "Bodwad", "Chalisgaon", "Chopda", "Dharangaon", "Erandol", "Jalgaon", "Jamner", "Muktainagar", "Pachora", "Parola", "Raver", "Yawal"],
    "Jalna": ["Ambad", "Badnapur", "Bhokardan", "Ghansawangi", "Jafferabad", "Jalna", "Mantha", "Partur"],
    "Kolhapur": ["Ajara", "Bavda", "Bhudargad", "Chandgad", "Gadhinglaj", "Hatkanangle", "Kagal", "Karvir", "Panhala", "Radhanagari", "Shahuwadi", "Shirol"],
    "Latur": ["Ahmedpur", "Ausa", "Chakur", "Deoni", "Jalkot", "Latur", "Nilanga", "Renapur", "Shirur-Anantpal", "Udgir"],
    "Mumbai City": ["Mumbai City"],
    "Mumbai Suburban": ["Andheri", "Borivali", "Kurla"],
    "Nagpur": ["Bhiwapur", "Hingna", "Kalameshwar", "Kamptee", "Katol", "Kuhi", "Mauda", "Nagpur (Rural)", "Nagpur (Urban)", "Narkhed", "Parseoni", "Ramtek", "Saoner", "Umred"],
    "Nanded": ["Ardhapur", "Bhokar", "Biloli", "Deglur", "Dharmabad", "Hadgaon", "Himayatnagar", "Kandhar", "Kinwat", "Loha", "Mahur", "Mudkhed", "Mukhed", "Naigaon (Khairgaon)", "Nanded", "Umri"],
    "Nandurbar": ["Akkalkuwa", "Akrani", "Nandurbar", "Navapur", "Shahada", "Talode"],
    "Nashik": ["Baglan (Satana)", "Chandwad", "Deola", "Dindori", "Igatpuri", "Kalwan", "Malegaon", "Nandgaon", "Nashik", "Niphad", "Peint", "Sinnar", "Surgana", "Trimbakeshwar", "Yeola"],
    "Osmanabad": ["Bhoom", "Kalamb", "Lohara", "Osmanabad", "Paranda", "Tuljapur", "Umarga", "Washi"],
    "Palghar": ["Dahanu", "Jawahar", "Mokhada", "Palghar", "Talasari", "Vasai", "Vikramgad", "Wada"],
    "Parbhani": ["Gangakhed", "Jintur", "Manwath", "Palam", "Parbhani", "Pathri", "Purna", "Sailu", "Sonpeth"],
    "Pune": ["Ambegaon", "Baramati", "Bhor", "Daund", "Haveli", "Indapur", "Junnar", "Khed", "Maval", "Mulshi", "Pune City", "Purandhar", "Shirur", "Velhe"],
    "Raigad": ["Alibag", "Karjat", "Khalapur", "Mahad", "Mangaon", "Mhasla", "Murud", "Panvel", "Pen", "Poladpur", "Roha", "Shrivardhan", "Sudhagad", "Tala", "Uran"],
    "Ratnagiri": ["Chiplun", "Dapoli", "Guhagar", "Khed", "Lanja", "Mandangad", "Rajapur", "Ratnagiri", "Sangameshwar"],
    "Sangli": ["Atpadi", "Jat", "Kadegaon", "Kavathe-Mahankal", "Khanapur", "Miraj", "Palus", "Shirala", "Tasgaon", "Walwa"],
    "Satara": ["Jaoli", "Karad", "Khandala", "Khatav", "Koregaon", "Mahabaleshwar", "Man", "Patan", "Phaltan", "Satara", "Wai"],
    "Sindhudurg": ["Devgad", "Dodamarg", "Kankavli", "Kudal", "Malvan", "Sawantwadi", "Vaibhavwadi", "Vengurla"],
    "Solapur": ["Akkalkot", "Barshi", "Karmala", "Madha", "Malshiras", "Mangalvedha", "Mohol", "North Solapur", "Pandharpur", "Sangole", "South Solapur"],
    "Thane": ["Ambernath", "Bhiwandi", "Kalyan", "Murbad", "Shahapur", "Thane", "Ulhasnagar"],
    "Wardha": ["Arvi", "Ashti", "Deoli", "Hinganghat", "Karanja", "Samudrapur", "Seloo", "Wardha"],
    "Washim": ["Karanja", "Malegaon", "Mangrulpir", "Manora", "Risod", "Washim"],
    "Yavatmal": ["Arni", "Babulgaon", "Darwha", "Digras", "Ghatanji", "Kalamb", "Kelapur", "Mahagaon", "Maregaon", "Ner", "Pusad", "Ralegaon", "Umarkhed", "Wani", "Yavatmal", "Zari-Jamani"]
};

interface SuperAdminProps {
  setUser: (u: any) => void;
}

interface FormDataState {
    username?: string;
    password?: string;
    libraryName?: string;
    ownerName?: string;
    mobile?: string;
    city?: string;
    district?: string;
    taluka?: string;
    plan?: '6_MONTHS' | 'YEARLY' | 'LIFETIME';
    duration?: number;
}

// Sub-components for Tabs
const DashboardView = ({ accounts }: { accounts: LibraryAccount[] }) => {
    const totalLabs = accounts.length;
    const activeLabs = accounts.filter(a => a.isActive).length;
    const totalSeats = accounts.reduce((acc, curr) => acc + (curr.maxSeats || 0), 0);
    // Estimated Revenue Calculation
    const revenue = accounts.reduce((acc, curr) => {
        // Mock Revenue Calculation based on plan
        const price = curr.plan === 'LIFETIME' ? 25000 : curr.plan === 'YEARLY' ? 10000 : 6000;
        return acc + price;
    }, 0);

    const recentLabs = [...accounts].reverse().slice(0, 5);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Libraries" value={totalLabs} icon={Building2} trend={`${activeLabs} Active`} trendUp />
                <StatCard label="Total Capacity" value={totalSeats.toLocaleString()} icon={User} />
                <StatCard label="Total Revenue" value={`₹${revenue.toLocaleString()}`} icon={Activity} trend="Est." />
                <StatCard label="System Health" value="100%" icon={ShieldCheck} trend="Stable" trendUp />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Recent Onboarding">
                    <div className="divide-y divide-slate-100">
                        {recentLabs.map(lab => (
                            <div key={lab.id} className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded text-slate-500"><Building2 className="h-4 w-4"/></div>
                                    <div>
                                        <div className="font-semibold text-slate-800 text-sm">{lab.libraryName}</div>
                                        <div className="text-xs text-slate-500">{lab.district} • {lab.createdAt}</div>
                                    </div>
                                </div>
                                <Badge variant={lab.isActive ? 'success' : 'error'}>{lab.isActive ? 'Active' : 'Pending'}</Badge>
                            </div>
                        ))}
                    </div>
                 </Card>
                 <Card title="System Announcements">
                     <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 mb-4">
                         <h4 className="font-bold text-primary-800 text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Maintenance Scheduled</h4>
                         <p className="text-xs text-primary-700 mt-1">Database maintenance scheduled for Sunday, 2 AM - 4 AM. Low impact expected.</p>
                     </div>
                     <div className="text-sm text-slate-500 italic">No other active alerts.</div>
                 </Card>
            </div>
        </div>
    );
};

const LibrariesView = ({ accounts, onRefresh }: { accounts: LibraryAccount[], onRefresh: () => void }) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [districtFilter, setDistrictFilter] = useState('ALL');
    
    // Modals
    const [editModal, setEditModal] = useState<LibraryAccount | null>(null);
    const [detailModal, setDetailModal] = useState<LibraryAccount | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const districts = ['ALL', ...Array.from(new Set(accounts.map(a => a.district || 'Other').filter(d => d !== 'ALL')))];

    const filtered = accounts.filter(acc => {
      const matchSearch = acc.libraryName.toLowerCase().includes(search.toLowerCase()) || 
                          acc.username.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? acc.isActive : !acc.isActive);
      const matchDistrict = districtFilter === 'ALL' || acc.district === districtFilter;
      
      return matchSearch && matchStatus && matchDistrict;
    });

    // Actions
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Permanently delete this library?")) {
            await Store.deleteAccount(id);
            onRefresh();
        }
    };
    
    const handleToggle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await Store.toggleAccountStatus(id);
        onRefresh();
    };
    
    const handleEditClick = (e: React.MouseEvent, acc: LibraryAccount) => {
        e.stopPropagation();
        setEditModal(acc);
    };

    const handleSaveEdit = async () => {
        if(editModal) {
            await Store.updateAccount(editModal);
            setEditModal(null);
            onRefresh();
        }
    };

    const copy = (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search libraries..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    <select 
                        className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>

                    <select 
                        className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                    >
                         {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Library</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Duration/Expiry</th>
                                <th className="px-6 py-4 text-center">Access</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(acc => {
                                const daysLeft = differenceInDays(parseISO(acc.licenseExpiry || '2020-01-01'), new Date());
                                const isExpired = daysLeft < 0;

                                return (
                                <tr key={acc.id} className="hover:bg-slate-50/50 cursor-pointer group" onClick={() => setDetailModal(acc)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                {acc.libraryName[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{acc.libraryName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                                    <User className="h-3 w-3"/> {acc.ownerName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-700">{acc.taluka || '-'}</div>
                                        <div className="text-xs text-slate-500">{acc.district || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="neutral">{acc.plan?.replace('_', ' ') || 'STANDARD'}</Badge>
                                        <div className={`text-xs mt-1 font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                                            {isExpired ? 'Expired' : `${daysLeft} days left`}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                         <button 
                                            onClick={(e) => handleToggle(e, acc.id)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${acc.isActive ? 'bg-green-500' : 'bg-slate-200'}`}
                                         >
                                             <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${acc.isActive ? 'translate-x-6' : 'translate-x-1'}`}/>
                                         </button>
                                         <div className="text-[10px] text-slate-400 mt-1">{acc.isActive ? 'Locked' : 'Unlocked'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                                        <Button size="sm" variant="outline" onClick={(e) => handleEditClick(e, acc)} title="Edit"><Edit className="h-4 w-4"/></Button>
                                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(e, acc.id)} title="Delete"><Trash2 className="h-4 w-4"/></Button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Detail Modal */}
            <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Library Profile">
                {detailModal && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                                 {detailModal.libraryName[0]}
                             </div>
                             <div>
                                 <h2 className="text-xl font-bold text-slate-900">{detailModal.libraryName}</h2>
                                 <p className="text-sm text-slate-500">Registered: {detailModal.createdAt}</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Owner Name</label>
                                <p className="font-medium text-slate-900">{detailModal.ownerName}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Contact</label>
                                <p className="font-medium text-slate-900">{detailModal.mobile}</p>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">District</label>
                                <p className="font-medium text-slate-900">{detailModal.district}</p>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Taluka</label>
                                <p className="font-medium text-slate-900">{detailModal.taluka}</p>
                            </div>
                            <div className="space-y-1 col-span-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Credentials</label>
                                <div className="flex gap-4">
                                     <div className="bg-slate-100 px-3 py-1 rounded text-sm font-mono">{detailModal.username}</div>
                                     <div className="bg-slate-100 px-3 py-1 rounded text-sm font-mono">{detailModal.password}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                            <h4 className="font-bold text-primary-800 text-sm mb-2">Subscription Details</h4>
                            <div className="flex justify-between text-sm">
                                <span>Plan: <strong>{detailModal.plan}</strong></span>
                                <span>Expires: <strong>{detailModal.licenseExpiry}</strong></span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Library">
                 <div className="space-y-4">
                     {editModal && (
                         <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Library Name" value={editModal.libraryName} onChange={e => editModal && setEditModal({...editModal, libraryName: e.target.value})} />
                                <Input label="Owner Name" value={editModal.ownerName || ''} onChange={e => editModal && setEditModal({...editModal, ownerName: e.target.value})} />
                                <Input label="Mobile" value={editModal.mobile || ''} onChange={e => editModal && setEditModal({...editModal, mobile: e.target.value})} />
                                <Input label="Password" value={editModal.password} onChange={e => editModal && setEditModal({...editModal, password: e.target.value})} />
                                
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">District</label>
                                        <select 
                                            className="w-full border rounded p-2 text-sm" 
                                            value={editModal.district || ''} 
                                            onChange={e => editModal && setEditModal({...editModal, district: e.target.value, taluka: ''})}
                                        >
                                            {Object.keys(MAHARASHTRA_DATA).map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Taluka</label>
                                        <select 
                                            className="w-full border rounded p-2 text-sm" 
                                            value={editModal.taluka || ''} 
                                            onChange={e => editModal && setEditModal({...editModal, taluka: e.target.value})}
                                        >
                                            <option value="">Select Taluka</option>
                                            {editModal.district && MAHARASHTRA_DATA[editModal.district]?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Duration</label>
                                    <select className="w-full border rounded p-2 text-sm" value={editModal.plan} onChange={e => editModal && setEditModal({...editModal, plan: e.target.value as any})}>
                                        <option value="6_MONTHS">6 Months</option>
                                        <option value="YEARLY">Yearly</option>
                                        <option value="LIFETIME">Lifetime</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">License Expiry</label>
                                    <input type="date" className="w-full border rounded p-2 text-sm" value={editModal.licenseExpiry} onChange={e => editModal && setEditModal({...editModal, licenseExpiry: e.target.value})} />
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleSaveEdit}>Update Library</Button>
                         </>
                     )}
                 </div>
            </Modal>
        </div>
    );
};

const FollowupsView = ({ accounts }: { accounts: LibraryAccount[] }) => {
    const [msgModal, setMsgModal] = useState<LibraryAccount | null>(null);
    const [msgText, setMsgText] = useState('');
    const [msgImg, setMsgImg] = useState('');

    // Filter accounts expiring in next 30 days or already expired
    const expiring = accounts.filter(acc => {
        const days = differenceInDays(parseISO(acc.licenseExpiry || '2099-01-01'), new Date());
        return days < 30; // Upcoming expiry or expired
    }).sort((a,b) => parseISO(a.licenseExpiry!).getTime() - parseISO(b.licenseExpiry!).getTime());

    const handleSendMessage = async () => {
        if(!msgModal || !msgText) return;
        
        await Store.sendNotification({
            id: 'notif-' + Date.now(),
            libraryId: msgModal.id,
            title: 'Message from Admin',
            message: msgText,
            imageUrl: msgImg || undefined,
            date: format(new Date(), 'yyyy-MM-dd HH:mm'),
            isRead: false
        });
        
        alert("Message Sent!");
        setMsgModal(null);
        setMsgText('');
        setMsgImg('');
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800">Subscription Renewals</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {expiring.map(acc => {
                     const days = differenceInDays(parseISO(acc.licenseExpiry || '2099-01-01'), new Date());
                     return (
                         <div key={acc.id} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                             {days < 0 && <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">EXPIRED</div>}
                             
                             <div className="flex justify-between items-start mb-4">
                                 <div>
                                     <h3 className="font-bold text-slate-900">{acc.libraryName}</h3>
                                     <p className="text-sm text-slate-500">{acc.mobile}</p>
                                 </div>
                                 <div className={`text-2xl font-bold ${days < 0 ? 'text-red-600' : 'text-primary-700'}`}>
                                     {days < 0 ? Math.abs(days) : days}
                                 </div>
                             </div>
                             
                             <div className="text-xs text-slate-500 mb-4 bg-slate-50 p-2 rounded">
                                 {days < 0 ? 'Days Overdue' : 'Days Remaining'}
                             </div>

                             <Button variant="outline" className="w-full" icon={Mail} onClick={() => setMsgModal(acc)}>Send Message</Button>
                         </div>
                     )
                })}
                {expiring.length === 0 && <p className="text-slate-500 italic">No upcoming expiries.</p>}
            </div>

            {/* Message Modal */}
            <Modal isOpen={!!msgModal} onClose={() => setMsgModal(null)} title={`Message to ${msgModal?.libraryName}`}>
                <div className="space-y-4">
                    <Input placeholder="Type your message..." value={msgText} onChange={e => setMsgText(e.target.value)} />
                    <Input placeholder="Image URL (Optional)" value={msgImg} onChange={e => setMsgImg(e.target.value)} />
                    {msgImg && <img src={msgImg} className="h-32 w-full object-cover rounded-md" />}
                    <Button className="w-full" onClick={handleSendMessage}>Send Notification</Button>
                </div>
            </Modal>
        </div>
    );
};

const ReportsView = ({ accounts }: { accounts: LibraryAccount[] }) => {
    // 1. Plan Distribution Data
    const planCounts = accounts.reduce((acc: Record<string, number>, curr: LibraryAccount) => {
        const p = curr.plan ? curr.plan.replace('_', ' ') : 'STANDARD';
        acc[p] = (acc[p] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const pieData = Object.keys(planCounts).map(k => ({ name: k, value: planCounts[k] }));
    const PIE_COLORS = ['#1D4ED8', '#F59E0B', '#38BDF8'];

    // 2. District Distribution Data
    const distCounts = accounts.reduce((acc: Record<string, number>, curr: LibraryAccount) => {
        const d = curr.district || 'Unknown';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const barData = Object.keys(distCounts).map(k => ({ name: k, count: distCounts[k] })).sort((a,b) => b.count - a.count).slice(0, 8);

    return (
        <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-800">Analytics Console</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Subscription Types">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Top Districts">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const NotificationsView = ({ accounts }: { accounts: LibraryAccount[] }) => {
    const [target, setTarget] = useState<'ALL' | 'SELECTED'>('ALL');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [ctaLink, setCtaLink] = useState('');
    const [ctaText, setCtaText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [search, setSearch] = useState('');

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredAccounts.length) setSelectedIds(new Set<string>());
        else setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
    };

    const handleSend = async () => {
        if (!title || !message) return alert("Title and Message are required");
        if (target === 'SELECTED' && selectedIds.size === 0) return alert("Select at least one library");

        setIsSending(true);
        try {
            const targetIds: string[] = target === 'ALL' ? accounts.map(a => a.id) : Array.from(selectedIds);
            
            if (targetIds.length === 0) {
                alert("No libraries found to send message to.");
                setIsSending(false);
                return;
            }

            const batchSize = 100;
            
            // Process in batches (simulated)
            for (let i = 0; i < targetIds.length; i += batchSize) {
                const batch = targetIds.slice(i, i + batchSize);
                await Promise.all(batch.map(libId => 
                     Store.sendNotification({
                         id: `notif-${Date.now()}-${libId}`,
                         libraryId: libId,
                         title,
                         message,
                         imageUrl: imageUrl || undefined, // Use explicit undefined if empty
                         link: ctaLink || undefined,
                         linkText: ctaText || undefined,
                         date: format(new Date(), 'yyyy-MM-dd HH:mm'),
                         isRead: false
                     })
                ));
            }
            alert(`Notification sent to ${targetIds.length} libraries!`);
            setTitle(''); setMessage(''); setImageUrl(''); setCtaLink(''); setCtaText('');
            setSelectedIds(new Set<string>());
        } catch (e: unknown) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            alert("Failed to send: " + errorMessage);
        } finally {
            setIsSending(false);
        }
    };

    const filteredAccounts = accounts.filter(a => a.libraryName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Compose Notification">
                    <div className="space-y-4">
                        <Input label="Notification Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Maintenance Update" />
                        
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">Message Body</label>
                            <textarea className="w-full border rounded-md p-3 text-sm h-32 focus:ring-2 focus:ring-primary-700 outline-none" value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter your message here..."></textarea>
                        </div>

                        <Input label="Image URL (Optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                        
                        <div className="grid grid-cols-2 gap-4">
                             <Input label="CTA Link (Optional)" value={ctaLink} onChange={e => setCtaLink(e.target.value)} placeholder="https://..." />
                             <Input label="CTA Button Text" value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="e.g. Update Now" />
                        </div>
                    </div>
                </Card>
                
                <div className="flex justify-end">
                    <Button size="lg" icon={Send} onClick={handleSend} isLoading={isSending}>Send Broadcast</Button>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Target Audience">
                     <div className="space-y-4">
                         <div className="flex bg-slate-100 p-1 rounded-lg">
                             <button onClick={() => setTarget('ALL')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${target === 'ALL' ? 'bg-white shadow text-primary-700' : 'text-slate-500'}`}>All Libraries</button>
                             <button onClick={() => setTarget('SELECTED')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${target === 'SELECTED' ? 'bg-white shadow text-primary-700' : 'text-slate-500'}`}>Select Manual</button>
                         </div>

                         {target === 'SELECTED' && (
                             <div className="border border-slate-200 rounded-lg overflow-hidden bg-white h-[400px] flex flex-col">
                                 <div className="p-2 border-b border-slate-100">
                                     <input className="w-full text-sm p-2 border rounded bg-slate-50" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                                 </div>
                                 <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                     <button onClick={toggleSelectAll}>{selectedIds.size === filteredAccounts.length ? <CheckSquare className="h-4 w-4 text-primary-700"/> : <Square className="h-4 w-4 text-slate-400"/>}</button>
                                     <span className="text-xs font-bold text-slate-500">{selectedIds.size} Selected</span>
                                 </div>
                                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                     {filteredAccounts.map(acc => (
                                         <div key={acc.id} onClick={() => toggleSelection(acc.id)} className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-slate-50 ${selectedIds.has(acc.id) ? 'bg-primary-50' : ''}`}>
                                              {selectedIds.has(acc.id) ? <CheckSquare className="h-4 w-4 text-primary-700"/> : <Square className="h-4 w-4 text-slate-300"/>}
                                              <div className="overflow-hidden">
                                                  <div className="text-sm font-medium truncate">{acc.libraryName}</div>
                                                  <div className="text-[10px] text-slate-400">{acc.district}</div>
                                              </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                         
                         {target === 'ALL' && (
                             <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 text-center">
                                 <div className="text-3xl font-bold text-primary-700 mb-1">{accounts.length}</div>
                                 <div className="text-xs font-bold text-primary-800 uppercase">Libraries Targeted</div>
                             </div>
                         )}
                     </div>
                </Card>
            </div>
        </div>
    );
};

const SettingsView = () => {
    return (
        <div className="space-y-6 animate-fade-in-up max-w-2xl">
             <Card title="Platform Configuration">
                 <div className="space-y-6">
                     <div className="flex items-center justify-between">
                         <div>
                             <h4 className="font-bold text-slate-800">Maintenance Mode</h4>
                             <p className="text-xs text-slate-500">Disable login for all non-superadmin users.</p>
                         </div>
                         <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200">
                             <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
                         </div>
                     </div>
                 </div>
             </Card>
        </div>
    );
};

// Main Component
export const SuperAdmin: React.FC<SuperAdminProps> = ({ setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LIBRARIES' | 'FOLLOWUPS' | 'REPORTS' | 'NOTIFICATIONS' | 'SETTINGS'>('DASHBOARD');
  const [accounts, setAccounts] = useState<LibraryAccount[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Account Form State
  const [formData, setFormData] = useState<FormDataState>({ plan: 'YEARLY', duration: 12, district: 'Pune' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { loadAccounts(); }, []);

  const loadAccounts = async () => {
    const data = await Store.refreshAccounts();
    setAccounts(data);
  };

  const handleCreate = async () => {
    if (!formData.username || !formData.password || !formData.libraryName) return alert("Required fields missing");
    
    // Validate password length
    if (formData.password!.length < 6) {
        return alert("Password must be at least 6 characters long.");
    }

    // Validate email format
    if (!formData.username!.includes('@') || !formData.username!.includes('.')) {
        return alert("Username must be a valid email address (e.g., admin@library.com)");
    }

    // Check duplicates
    if (accounts.some(a => a.username === formData.username)) return alert("Username (Email) already taken");

    setIsSubmitting(true);
    try {
        let months = 12;
        if(formData.plan === '6_MONTHS') months = 6;
        if(formData.plan === 'LIFETIME') months = 1200; // 100 years

        const expiryDate = addMonths(new Date(), months);
        
        // Generate Key
        const uniqueKey = `ABHY-${Math.random().toString(36).substring(2,6).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

        const newAccount: LibraryAccount = {
            id: `lib-${Date.now()}`,
            username: formData.username || '',
            password: formData.password || '',
            libraryName: formData.libraryName || '',
            city: formData.city || (formData.taluka ? `${formData.taluka}, ${formData.district}` : 'Maharashtra'),
            district: formData.district || '',
            taluka: formData.taluka || '',
            isActive: true,
            createdAt: format(new Date(), 'yyyy-MM-dd'),
            ownerName: formData.ownerName || '',
            mobile: formData.mobile || '',
            plan: formData.plan as any,
            licenseKey: uniqueKey,
            licenseExpiry: format(expiryDate, 'yyyy-MM-dd'),
            maxSeats: 500 // Default max
        };

        await Store.addAccount(newAccount);
        setFormData({ plan: 'YEARLY', district: 'Pune' });
        setIsCreateModalOpen(false);
        loadAccounts();
        alert("Lab Profile Created! Verification email sent.");
    } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        alert("Failed to create library: " + errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    Store.logout();
    setUser(null);
    navigate('/');
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'DASHBOARD': return <DashboardView accounts={accounts} />;
          case 'LIBRARIES': return <LibrariesView accounts={accounts} onRefresh={loadAccounts} />;
          case 'FOLLOWUPS': return <FollowupsView accounts={accounts} />;
          case 'REPORTS': return <ReportsView accounts={accounts} />;
          case 'NOTIFICATIONS': return <NotificationsView accounts={accounts} />;
          case 'SETTINGS': return <SettingsView />;
          default: return <DashboardView accounts={accounts} />;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-slate-300 flex flex-col fixed inset-y-0 z-20">
          <div className="p-6 flex items-center gap-3 text-white font-bold text-xl">
              <div className="bg-primary-700 p-1.5 rounded-lg"><Database className="h-5 w-5"/></div>
              <span>Admin<span className="text-primary-700">Console</span></span>
          </div>
          
          <nav className="flex-1 px-3 space-y-1 mt-4">
              {[
                  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Dashboard' },
                  { id: 'LIBRARIES', icon: Users, label: 'Libraries' },
                  { id: 'FOLLOWUPS', icon: BellRing, label: 'Followups' },
                  { id: 'REPORTS', icon: PieChart, label: 'Analytics' },
                  { id: 'NOTIFICATIONS', icon: MessageSquare, label: 'Notifications' },
                  { id: 'SETTINGS', icon: SettingsIcon, label: 'Platform Settings' },
              ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-primary-700 text-white shadow-lg shadow-primary-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
                  >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                  </button>
              ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">S</div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-medium text-white truncate">Super Admin</p>
                      <p className="text-xs text-slate-500 truncate">System Owner</p>
                  </div>
              </div>
              <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-700 hover:text-white transition-colors">
                  <LogOut className="h-4 w-4" /> Logout
              </button>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
          <header className="flex justify-between items-center mb-8">
              <div>
                  <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab.toLowerCase()}</h1>
                  <p className="text-sm text-slate-500">Manage your SaaS platform efficiently.</p>
              </div>
              <Button icon={Plus} className="bg-primary-700 hover:bg-primary-800 shadow-lg shadow-primary-700/20" onClick={() => setIsCreateModalOpen(true)}>
                  Create Lab Profile
              </Button>
          </header>

          {renderContent()}

          {/* Create Modal */}
          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Lab Profile">
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Owner Profile</h4></div>
                      <Input placeholder="Owner Name" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
                      <Input placeholder="Mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                      <Input placeholder="Library Name" value={formData.libraryName} onChange={e => setFormData({...formData, libraryName: e.target.value})} />
                      
                      {/* Cascading Location */}
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">District</label>
                          <select 
                            className="w-full border rounded p-2 text-sm" 
                            value={formData.district} 
                            onChange={e => setFormData({...formData, district: e.target.value, taluka: ''})}
                          >
                             {Object.keys(MAHARASHTRA_DATA).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-500">Taluka</label>
                          <select 
                            className="w-full border rounded p-2 text-sm" 
                            value={formData.taluka} 
                            onChange={e => setFormData({...formData, taluka: e.target.value})}
                          >
                             <option value="">Select Taluka</option>
                             {formData.district && MAHARASHTRA_DATA[formData.district]?.map((t: string) => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>

                      <div className="col-span-2 pt-2"><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Access Duration</h4></div>
                      <select className="col-span-2 border rounded p-2 text-sm" value={formData.plan} onChange={e => setFormData({...formData, plan: e.target.value as any})}>
                          <option value="6_MONTHS">6 Months</option>
                          <option value="YEARLY">Yearly</option>
                          <option value="LIFETIME">Lifetime</option>
                      </select>

                      <div className="col-span-2 pt-2"><h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Credentials</h4></div>
                      <Input placeholder="Username (Email Address)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                      <Input placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <Button className="w-full bg-primary-700 hover:bg-primary-800" onClick={handleCreate} isLoading={isSubmitting}>Create Lab Profile</Button>
              </div>
          </Modal>
      </main>

    </div>
  );
};
