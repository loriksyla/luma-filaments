import React, { useState } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(email, password);
        if (success) {
            onClose();
            // Reset form
            setEmail('');
            setPassword('');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10">
                    <X size={20} />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-teal-100 dark:bg-teal-500/20 rounded-full text-teal-600 dark:text-teal-400">
                            <LogIn size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Kyçu</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Email</label>
                            <input 
                                type="email" 
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Fjalëkalimi</label>
                            <input 
                                type="password" 
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity mt-4"
                        >
                            Hyni në llogari
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center text-xs text-slate-500">
                        Default: loriksyla@gmail.com / LorikSyla12
                    </div>
                </div>
            </div>
        </div>
    );
};