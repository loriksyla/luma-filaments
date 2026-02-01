import React, { useState } from 'react';
import { getPrintAdvice } from '../services/geminiService';
import { PrintSettings, AdvisorRequest, FilamentType } from '../types';
import { Sparkles, Thermometer, Wind, Zap, Layers, Cpu } from 'lucide-react';

const Advisor: React.FC = () => {
  const [request, setRequest] = useState<AdvisorRequest>({
    printerModel: '',
    filamentType: FilamentType.PLA,
    application: ''
  });
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSettings(null);

    try {
      const result = await getPrintAdvice(request);
      setSettings(result);
    } catch (err) {
      setError("Failed to generate settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="advisor" className="py-24 bg-slate-100 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/5 dark:from-teal-900/10 to-transparent pointer-events-none"></div>

      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Left: Input Form */}
            <div className="w-full md:w-1/3">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-teal-100 dark:bg-teal-500/20 rounded-lg">
                        <Sparkles className="text-teal-600 dark:text-teal-400" size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">LUMA AI Advisor</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    Not sure what settings to use? Our Gemini-powered AI analyzes your specific printer and use-case to recommend professional-grade parameters.
                </p>

                <form onSubmit={handleAnalyze} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Printer Model</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Ender 3 V2, Prusa MK4..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                            value={request.printerModel}
                            onChange={(e) => setRequest({...request, printerModel: e.target.value})}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Filament Type</label>
                        <select 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                            value={request.filamentType}
                            onChange={(e) => setRequest({...request, filamentType: e.target.value})}
                        >
                            {Object.values(FilamentType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">What are you printing?</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Outdoor plant pot, Cosplay helmet..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors placeholder-slate-400 dark:placeholder-slate-600"
                            value={request.application}
                            onChange={(e) => setRequest({...request, application: e.target.value})}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-lg font-bold text-sm uppercase tracking-widest transition-all ${
                            loading 
                            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-teal-500 text-white dark:text-slate-900 hover:bg-teal-600 dark:hover:bg-teal-400 hover:shadow-lg'
                        }`}
                    >
                        {loading ? 'Analyzing...' : 'Generate Profile'}
                    </button>
                    
                    {error && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</p>}
                </form>
            </div>

            {/* Right: Results Display */}
            <div className="w-full md:w-2/3 min-h-[400px]">
                <div className="h-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 backdrop-blur relative overflow-hidden shadow-sm">
                    {!settings && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-600 flex-col gap-4">
                            <Cpu size={64} className="opacity-20" />
                            <p className="font-mono text-sm">Waiting for input data stream...</p>
                        </div>
                    )}

                    {loading && (
                         <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-teal-600 dark:text-teal-400 font-mono text-sm animate-pulse">Consulting Neural Network...</p>
                        </div>
                    )}

                    {settings && (
                        <div className="animate-fade-in">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-4 flex justify-between items-center">
                                <span>Recommended Profile</span>
                                <span className="text-xs bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/20 font-mono">
                                    CONFIDENCE: HIGH
                                </span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <SettingCard icon={<Thermometer size={20}/>} label="Nozzle Temp" value={settings.nozzleTemp} color="text-red-500 dark:text-red-400" bg="bg-red-50 dark:bg-slate-800" />
                                <SettingCard icon={<Layers size={20}/>} label="Bed Temp" value={settings.bedTemp} color="text-orange-500 dark:text-orange-400" bg="bg-orange-50 dark:bg-slate-800" />
                                <SettingCard icon={<Zap size={20}/>} label="Print Speed" value={settings.speed} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-50 dark:bg-slate-800" />
                                <SettingCard icon={<Wind size={20}/>} label="Cooling Fan" value={settings.fanSpeed} color="text-blue-500 dark:text-blue-400" bg="bg-blue-50 dark:bg-slate-800" />
                                <SettingCard icon={<Cpu size={20}/>} label="Retraction" value={settings.retraction} color="text-purple-500 dark:text-purple-400" bg="bg-purple-50 dark:bg-slate-800" />
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-6 border-l-4 border-teal-500">
                                <h4 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Expert Tip</h4>
                                <p className="text-slate-700 dark:text-slate-200 italic">"{settings.expertTip}"</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

const SettingCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: string, color: string, bg: string }) => (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
            <p className="text-slate-900 dark:text-white font-mono text-lg">{value}</p>
        </div>
    </div>
);

export default Advisor;