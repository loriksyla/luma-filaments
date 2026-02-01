import React, { useState, useEffect } from 'react';
import { X, Check, MapPin, Phone, Mail, User, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Address, CartItem, Order } from '../types';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClearCart: () => void;
    total: number;
    cartItems: CartItem[];
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

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onClearCart, total, cartItems }) => {
    const { user, addOrder, refreshOrders } = useAuth();
    
    // Mode can be 'form' (manual entry) or 'selection' (choose from saved)
    const [mode, setMode] = useState<'form' | 'selection'>('form');
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (user && user.addresses.length > 0) {
                setMode('selection');
                const defaultAddr = user.addresses.find(a => a.isDefault);
                setSelectedAddressId(defaultAddr ? defaultAddr.id : user.addresses[0].id);
            } else {
                setMode('form');
                if (user) {
                    setFormData(prev => ({
                        ...prev,
                        email: user.email,
                        firstName: user.name.split(' ')[0],
                        lastName: user.name.split(' ').slice(1).join(' ') || ''
                    }));
                } else {
                     setFormData({
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
                }
            }
        }
    }, [isOpen, user]);

    // Handle city reset when country changes in form mode
    useEffect(() => {
        if (mode === 'form') {
            setFormData(prev => {
                const cities = COUNTRIES[prev.country as keyof typeof COUNTRIES];
                if (!cities.includes(prev.city)) {
                     return { ...prev, city: cities[0], customCity: '' };
                }
                return prev;
            });
        }
    }, [formData.country, mode]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (cartItems.length === 0) {
            setError('Shporta është bosh.');
            return;
        }
        const outOfStock = cartItems.find(
            (item) => item.product.stock <= 0 || item.quantity > item.product.stock
        );
        if (outOfStock) {
            setError(`Sasia e kërkuar për "${outOfStock.product.name}" tejkalon stokun.`);
            return;
        }

        setIsSubmitting(true);

        const selectedAddress =
            mode === 'selection'
                ? user.addresses.find((addr) => addr.id === selectedAddressId) ?? null
                : null;

        const manualAddress: Address = {
            id: `addr-${Date.now()}`,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            country: formData.country,
            city: formData.city,
            customCity: formData.customCity || undefined,
            address: formData.address,
            postalCode: formData.postalCode,
            phone: formData.phone,
            isDefault: false,
        };

        const addressToSave = selectedAddress ?? manualAddress;

        const customerName =
            mode === 'form'
                ? `${formData.firstName} ${formData.lastName}`.trim()
                : user?.name ?? `${formData.firstName} ${formData.lastName}`.trim();
        const customerEmail = mode === 'form' ? formData.email : user?.email ?? formData.email;

        const order: Order = {
            id: `ORD-${Date.now()}`,
            userId: user?.email ?? 'guest',
            customerName,
            customerEmail,
            total,
            date: new Date().toISOString(),
            status: 'Krijuar',
            items: cartItems,
            address: addressToSave,
        };

        try {
            await addOrder(order);
            if (user) {
                await refreshOrders();
            }
            setIsSuccess(true);
        } catch (err: any) {
            const rawMessage = err?.message ?? err;
            const message =
                typeof rawMessage === 'string'
                    ? rawMessage
                    : rawMessage
                        ? JSON.stringify(rawMessage)
                        : 'Porosia nuk u krye. Provoni përsëri.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSuccess) {
            onClearCart();
        }
        setIsSuccess(false);
        setError('');
        setIsSubmitting(false);
        onClose();
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800 relative">
                    <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white">
                        <X size={20} />
                    </button>
                    <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Porosia u krye me sukses!</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Faleminderit për porosinë tuaj. Totali prej <span className="font-bold text-slate-900 dark:text-white">€{total.toFixed(2)}</span> do të paguhet me para në dorë gjatë dorëzimit.</p>
                    <button 
                        onClick={handleClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Mbyll
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 overflow-y-auto">
             <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800 my-8 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Detajet e Porosisë</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    {mode === 'selection' && user ? (
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Zgjidhni Adresën e Dërgesës</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {user.addresses.map(addr => (
                                    <div 
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                                            selectedAddressId === addr.id 
                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10 dark:border-teal-400' 
                                            : 'border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        <div className={`mt-1 p-1 rounded-full border ${selectedAddressId === addr.id ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                                            <div className={`w-2 h-2 rounded-full bg-white ${selectedAddressId === addr.id ? 'opacity-100' : 'opacity-0'}`}></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-slate-900 dark:text-white text-lg">
                                                    {addr.firstName} {addr.lastName}
                                                </p>
                                                {addr.isDefault && (
                                                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">{addr.address}</p>
                                            <p className="text-slate-500 dark:text-slate-400">
                                                {addr.city === 'Tjetër' ? addr.customCity : addr.city}, {addr.country} {addr.postalCode}
                                            </p>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                                                <Phone size={12} /> {addr.phone}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setMode('form')}
                                className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <PlusCircle size={20} />
                                Përdor një adresë të re
                            </button>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                {error && (
                                    <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-500 font-medium">Totali për pagesë</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">€{total.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Duke procesuar...
                                        </>
                                    ) : (
                                        'Konfirmo Porosinë'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                             {mode === 'form' && user && user.addresses.length > 0 && (
                                <button 
                                    type="button"
                                    onClick={() => setMode('selection')}
                                    className="text-teal-600 dark:text-teal-400 text-sm font-bold flex items-center gap-1 hover:underline mb-2"
                                >
                                    ← Kthehu tek adresat e ruajtura
                                </button>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Emri</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="Jeton"
                                            value={formData.firstName}
                                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Last Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mbiemri</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="Kelmendi"
                                            value={formData.lastName}
                                            onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Adresa</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="shembull@email.com"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Country */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shteti</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                                            value={formData.country}
                                            onChange={e => setFormData({...formData, country: e.target.value})}
                                        >
                                            {Object.keys(COUNTRIES).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Qyteti</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white appearance-none cursor-pointer"
                                            value={formData.city}
                                            onChange={e => setFormData({...formData, city: e.target.value})}
                                        >
                                            {COUNTRIES[formData.country as keyof typeof COUNTRIES].map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom City Input - Shown only if "Tjetër" is selected */}
                            {formData.city === 'Tjetër' && (
                                <div className="space-y-2 animate-fade-in-up">
                                     <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shkruani Qytetin / Fshatin</label>
                                     <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="Shkruani vendndodhjen tuaj"
                                            value={formData.customCity}
                                            onChange={e => setFormData({...formData, customCity: e.target.value})}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Adresa</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="Rruga, Nr. i nderteses, Hyrja"
                                        value={formData.address}
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Postal Code */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">kodi postar (Opsional)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                        placeholder="10000"
                                        value={formData.postalCode}
                                        onChange={e => setFormData({...formData, postalCode: e.target.value})}
                                    />
                                </div>

                                 {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">numri i telefonit</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="tel" 
                                            required
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
                                            placeholder="+383 4X XXX XXX"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                                {error && (
                                    <div className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                                        {error}
                                    </div>
                                )}
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-slate-500 font-medium">Totali për pagesë</span>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">€{total.toFixed(2)}</span>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-teal-500/20 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Duke procesuar...
                                        </>
                                    ) : (
                                        'Konfirmo Porosinë'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
             </div>
        </div>
    );
}
