import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingBag, Plus, Minus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState<string | number>(1);

  const increment = () => setQuantity(q => (typeof q === 'number' ? q + 1 : 1));
  const decrement = () => setQuantity(q => (typeof q === 'number' ? Math.max(1, q - 1) : 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
        setQuantity('');
    } else {
        const num = parseInt(val);
        if (!isNaN(num)) {
            setQuantity(num);
        }
    }
  };

  const handleBlur = () => {
    if (quantity === '' || quantity === 0 || (typeof quantity === 'number' && quantity < 1)) {
        setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    const qtyToAdd = typeof quantity === 'number' ? quantity : 1;
    onAddToCart(product, qtyToAdd);
    setQuantity(1); // Reset to default
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex flex-col">
      <div className="aspect-square relative p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        {/* Visual representation of filament spool using CSS */}
        <div className="relative w-48 h-48 rounded-full border-8 border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12 bg-white dark:bg-slate-900">
             {/* The "Filament" color */}
            <div 
                className="absolute inset-0 rounded-full border-[32px] opacity-90"
                style={{ borderColor: product.hex }}
            ></div>
             {/* Spool Inner */}
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full z-10 flex items-center justify-center text-slate-500 dark:text-slate-700 text-xs font-bold tracking-widest text-center px-1">
                {product.brand ? product.brand.toUpperCase() : 'LUMA'}
            </div>
            {/* Gloss reflection overlay */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
        </div>

        {/* Floating Tag */}
        <div className="absolute top-4 left-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs font-bold text-slate-900 dark:text-slate-300 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {product.type}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{product.weight}</p>
            </div>
            <span className="text-lg font-bold text-teal-600 dark:text-teal-400">€{product.price.toFixed(2)}</span>
        </div>
        
        <p className="text-slate-600 dark:text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{product.description}</p>

        <div className="flex gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={decrement}
                    className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <Minus size={16} />
                </button>
                <input 
                    type="number" 
                    className="w-12 bg-transparent text-center font-bold text-sm text-slate-900 dark:text-white focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={quantity}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    min="1"
                />
                <button 
                    onClick={increment}
                    className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            <button 
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-white/5 dark:hover:bg-white text-white dark:text-white dark:hover:text-slate-900 font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 rounded-lg"
            >
                <ShoppingBag size={16} />
                Add
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;