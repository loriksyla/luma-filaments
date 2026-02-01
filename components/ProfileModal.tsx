import React, { useState } from 'react';
import { X, User, MapPin, Plus, Trash2, Check, Star, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Address } from '../types';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const COUNTRIES = {
    'Kosovë': [
        'Prishtinë', 'Prizren', 'Pejë', 'Gjakovë', 'Ferizaj', 'Gjilan', 'Mitrovicë', 
        'Vushtrri', 'Podujevë', 'Fushë Kosovë', 'Lipjan', 'Obiliq', 'Drenas', 'Skënderaj', 
        'Suharekë', 'Rahovec', 'Malishevë', 'Deçan', 'Klinë', 'Istog', 'Kaçanik', 'Shtime', 
        'Kamenicë', 'Viti', 'Dragash', 'Hani i Elezit', 'Junik', 'Mamushë', 'Novobërdë', 
        'Partesh', 'Ranillug', 'Shtërpcë', 'Zveçan', 'Zubin Potok', 'Leposaviq', 'Tjetër'
    ],
    'Shqipëri': [
        'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 
        'Lushnjë', 'Pogradec', 'Kavajë', 'Gjirokastër', 'Lezhë', 'Sarandë', 'Kukës', 
        'Krujë', 'Burrel', 'Peshkopi', 'Kamëz', 'Vorë', 'Patos', 'Librazhd', 'Tepelenë', 
        'Gramsh', 'Përmet', 'Delvinë', 'Tjetër'
    ],
    'Maqedoni e Veriut': [
        'Shkup', 'Manastir', 'Kumanovë', 'Tetovë', 'Ohër', 'Gostivar', 'Strugë', 
        'Veles', 'Dibër', 'Kërçovë', 'Strumicë', 'Prilep', 'Koçan', 'Kavadar', 'Tjetër'
    ]
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, logout, addAddress, editAddress, setDefaultAddress, deleteAddress } = useAuth();
    const [view, setView] = useState<'details' | 'form'>('details');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Address Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        country: 'Kosovë',
        city: COUNTRIES['Kosovë'][0],
        customCity: '',
        address: '',
        postalCode: '',
        phone: ''
    });

    if (!isOpen || !user) return null;

    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: user.email,
            country: 'Kosovë',
            city: COUNTRIES['Kosovë'][0],
            customCity: '',
            address: '',
            postalCode: '',
            phone: ''
        });
        setEditingId(null);
    };

    const handleStartAdd = () => {
        resetForm();
        setView('form');
    };

    const handleStartEdit = (addr: Address) => {
        setFormData({
            firstName: addr.firstName,
            lastName: addr.lastName,
            email: addr.email,
            country: addr.country,
            city: addr.city,
            customCity: addr.customCity || '',
            address: addr.address,
            postalCode: addr.postalCode,
            phone: addr.phone
        });
        setEditingId(addr.id);
        setView('form');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingId) {
            // Find existing address to keep isDefault status or handle in context
            const existing = user.addresses.find(a => a.id === editingId);
            editAddress({
                ...formData,
                id: editingId,
                isDefault: existing?.isDefault || false
            });
        } else {
            addAddress(formData);
        }

        setView('details');
        resetForm();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800 my-8">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <User size={20} />
                        Llogaria Ime
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {view === 'details' ? (
                        <>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-full bg-teal-600 text-white flex items-center justify-center text-2xl font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                                    <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                                </div>
                                <button 
                                    onClick={async () => { await logout(); onClose(); }} 
                                    className="ml-auto text-red-500 hover:text-red-600 font-bold text-sm underline"
                                >
                                    Dilni (Logout)
                                </button>
                            </div>

                            <div className="mb-6 flex justify-between items-end">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Adresat e mia</h4>
                                <button 
                                    onClick={handleStartAdd}
                                    className="text-teal-600 dark:text-teal-400 font-bold text-sm flex items-center gap-1 hover:underline"
                                >
                                    <Plus size={16} /> Shto Adresë
                                </button>
                            </div>

                            <div className="space-y-4">
                                {user.addresses.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <MapPin className="mx-auto text-slate-400 mb-2" size={32} />
                                        <p className="text-slate-500 dark:text-slate-400">Nuk keni asnjë adresë të ruajtur.</p>
                                    </div>
                                ) : (
                                    user.addresses.map(addr => (
                                        <div key={addr.id} className={`p-4 rounded-xl border transition-all ${addr.isDefault ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 ${addr.isDefault ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`}>
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                            {addr.firstName} {addr.lastName}
                                                            {addr.isDefault && <span className="text-[10px] bg-teal-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                                                        </p>
                                                        <p className="text-slate-600 dark:text-slate-300 text-sm">{addr.address}</p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                                            {addr.city === 'Tjetër' ? addr.customCity : addr.city}, {addr.country} {addr.postalCode}
                                                        </p>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{addr.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => handleStartEdit(addr)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                                                        title="Ndrysho"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    {!addr.isDefault && (
                                                        <>
                                                            <button 
                                                                onClick={() => setDefaultAddress(addr.id)}
                                                                className="p-2 text-slate-400 hover:text-teal-500 transition-colors"
                                                                title="Bëje Default"
                                                            >
                                                                <Star size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => deleteAddress(addr.id)}
                                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                                title="Fshij"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                             <div className="flex items-center gap-2 mb-4 text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => setView('details')}>
                                <span className="text-lg">←</span> <span className="text-sm font-bold">Kthehu</span>
                            </div>
                            
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                {editingId ? 'Ndrysho Adresën' : 'Shto Adresë të Re'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="Emri" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                                <input required placeholder="Mbiemri" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <select 
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none"
                                    value={formData.country}
                                    onChange={e => setFormData({...formData, country: e.target.value, city: COUNTRIES[e.target.value as keyof typeof COUNTRIES][0]})}
                                >
                                    {Object.keys(COUNTRIES).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select 
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none appearance-none"
                                    value={formData.city}
                                    onChange={e => setFormData({...formData, city: e.target.value})}
                                >
                                    {COUNTRIES[formData.country as keyof typeof COUNTRIES].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                             {formData.city === 'Tjetër' && (
                                <input required placeholder="Shkruani Qytetin/Fshatin" value={formData.customCity} onChange={e => setFormData({...formData, customCity: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                            )}

                            <input required placeholder="Adresa" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Kodi Postar" value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                                <input required placeholder="Telefoni" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
                            </div>

                            <button type="submit" className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl mt-4">
                                {editingId ? 'Ruaj Ndryshimet' : 'Ruaj Adresën'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
