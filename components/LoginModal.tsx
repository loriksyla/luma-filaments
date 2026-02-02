import React, { useState } from 'react';
import { X, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login, completeNewPassword, signUpWithEmail, confirmSignUpCode } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [confirmCode, setConfirmCode] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [needsConfirmation, setNeedsConfirmation] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isNewPasswordRequired, setIsNewPasswordRequired] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (mode === 'signup') {
                if (needsConfirmation) {
                    if (!confirmCode) {
                        setError('Shkruani kodin e konfirmimit.');
                        return;
                    }
                    const confirmRes = await confirmSignUpCode(email, confirmCode);
                    if (confirmRes.ok) {
                        setNeedsConfirmation(false);
                        setMode('login');
                        setConfirmCode('');
                    } else {
                        setError(confirmRes.message || 'Konfirmimi dështoi.');
                    }
                    return;
                }

                if (!fullName) {
                    setError('Shkruani emrin dhe mbiemrin.');
                    return;
                }
                const signUpRes = await signUpWithEmail(email, password, fullName);
                if (signUpRes.ok && signUpRes.confirmRequired) {
                    setNeedsConfirmation(true);
                    return;
                }
                if (signUpRes.ok) {
                    setMode('login');
                    setPassword('');
                    return;
                }
                setError(signUpRes.message || 'Regjistrimi dështoi.');
                return;
            }
            if (isNewPasswordRequired) {
                if (!newPassword) {
                    setError('Ju lutem vendosni fjalëkalimin e ri.');
                    return;
                }
                const result = await completeNewPassword(newPassword);
                if (result.ok) {
                    onClose();
                    setEmail('');
                    setPassword('');
                    setNewPassword('');
                    setIsNewPasswordRequired(false);
                } else {
                    setError(result.message || 'Konfirmimi i fjalëkalimit të ri dështoi.');
                }
                return;
            }

            const result = await login(email, password);
            if (result.ok) {
                onClose();
                // Reset form
                setEmail('');
                setPassword('');
                setNewPassword('');
                setIsNewPasswordRequired(false);
                setMode('login');
                setNeedsConfirmation(false);
            } else if (result.newPasswordRequired) {
                setIsNewPasswordRequired(true);
                setError(result.message || 'Ju duhet të vendosni një fjalëkalim të ri.');
            } else {
                setError(result.message || 'Invalid credentials. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
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
                        {mode === 'signup' && !needsConfirmation && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Emri dhe Mbiemri</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Emër Mbiemër"
                                    required
                                />
                            </div>
                        )}
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
                                required={!isNewPasswordRequired}
                                disabled={isNewPasswordRequired}
                            />
                        </div>
                        {mode === 'signup' && !needsConfirmation && (
                            <div className="text-xs text-slate-500">
                                Pas regjistrimit do të merrni një kod konfirmimi në email.
                            </div>
                        )}
                        {mode === 'signup' && needsConfirmation && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Kodi i konfirmimit</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                    value={confirmCode}
                                    onChange={(e) => setConfirmCode(e.target.value)}
                                    placeholder="123456"
                                    required
                                />
                            </div>
                        )}
                        {isNewPasswordRequired && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Fjalëkalimi i ri</label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Fjalëkalimi i ri"
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 border-2 border-black text-black font-bold rounded-xl transition-colors mt-4 hover:bg-black hover:text-white disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                            {isNewPasswordRequired
                                ? 'Vendos fjalëkalim të ri'
                                : mode === 'signup'
                                ? (needsConfirmation ? 'Konfirmo kodin' : 'Regjistrohu')
                                : 'Hyni në llogari'}
                        </button>
                    </form>

                    <div className="mt-4 text-center text-xs text-slate-500">
                        {mode === 'login' ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('signup');
                                    setError('');
                                    setIsNewPasswordRequired(false);
                                    setNeedsConfirmation(false);
                                }}
                                className="font-bold text-teal-600 hover:text-teal-700"
                            >
                                Nuk keni llogari? Regjistrohu
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    setError('');
                                    setNeedsConfirmation(false);
                                    setConfirmCode('');
                                }}
                                className="font-bold text-teal-600 hover:text-teal-700"
                            >
                                Keni llogari? Kyçu
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
