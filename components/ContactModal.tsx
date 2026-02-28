import React, { useState, useEffect } from 'react';
import { X, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../context/AuthContext';

const client = generateClient<Schema>();

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('Kërkesë për filament të ri');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const result = await client.mutations.contact({
                name,
                email,
                subject,
                message,
            });

            if (result.data?.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setMessage('');
                    setSubject('Kërkesë për filament të ri');
                }, 3000);
            } else {
                setError(result.data?.message || 'Ndodhi një gabim gjatë dërgimit.');
            }
        } catch (err: any) {
            console.error(err);
            setError('Ndodhi një gabim i papritur. Ju lutem provoni përsëri.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white z-10 bg-slate-100 dark:bg-slate-800 p-3 rounded-full">
                    <X size={20} />
                </button>

                <div className="p-8 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-teal-100 dark:bg-teal-500/20 rounded-full text-teal-600 dark:text-teal-400">
                            <Mail size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Na Kontaktoni</h2>
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                            <CheckCircle2 className="w-16 h-16 text-teal-500 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Mesazhi u dërgua!</h3>
                            <p className="text-slate-500">Faleminderit që na kontaktuat. Do t'ju kthejmë përgjigje së shpejti.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Emri dhe Mbiemri</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Emër Mbiemër"
                                        required
                                    />
                                </div>
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
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Arsyeja e kontaktit</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white appearance-none"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                >
                                    <option value="Kërkesë për filament të ri">Kërkesë për filament të ri</option>
                                    <option value="Pyetje rreth porosive">Pyetje rreth porosive</option>
                                    <option value="Problem teknik">Problem teknik / Llogaria ime</option>
                                    <option value="Tjetër">Tjetër</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Mesazhi / Kërkesa</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 transition-all text-slate-900 dark:text-white min-h-[120px] resize-y"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={subject === 'Kërkesë për filament të ri' ? 'Cilin filament / ngjyrë po kërkoni?' : 'Shkruani mesazhin tuaj këtu...'}
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
                                disabled={isSubmitting}
                                className="w-full py-4 border-2 border-black text-black font-bold rounded-xl transition-colors mt-2 hover:bg-black hover:text-white disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 bg-transparent dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
                            >
                                {isSubmitting && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                                Dërgo
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
