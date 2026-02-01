import React from 'react';
import { ArrowDown } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToProducts = () => {
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-[120px]" style={{ animationDuration: '4s' }}></div>
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <h2 className="text-teal-600 dark:text-teal-400 font-medium tracking-[0.2em] mb-4 text-sm md:text-base animate-fade-in-up">
          ENGINEERED FOR EXCELLENCE
        </h2>
        <h1 className="text-6xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter mb-8 leading-none">
          PRINT <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-600 to-slate-900 dark:from-slate-200 dark:to-slate-500">
            PERFECTION
          </span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
            Premium dimensional accuracy. Zero tangles. The filament chosen by professionals who can't afford a failure.
        </p>
        
        <div className="flex gap-4 justify-center">
            <button 
                onClick={scrollToProducts}
                className="px-10 py-4 bg-black text-white font-bold text-sm tracking-widest hover:bg-zinc-800 transition-colors shadow-lg rounded-sm cursor-pointer inline-block"
            >
                SHOP COLLECTION
            </button>
        </div>
      </div>

      <div className="absolute bottom-10 animate-bounce text-slate-400 dark:text-slate-600">
        <ArrowDown size={24} />
      </div>
    </section>
  );
};

export default Hero;