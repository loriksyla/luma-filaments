import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingBag, Plus, Minus, Package } from 'lucide-react';
import { getUrl } from 'aws-amplify/storage';

const StorageImage = ({ path, className }: { path: string, className?: string }) => {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    if (!path) return;
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      setUrl(path);
      return;
    }
    getUrl({ path }).then(res => setUrl(res.url.toString())).catch(console.error);
  }, [path]);

  if (!url) return <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className || 'w-full h-full'}`}><Package size={48} className="text-slate-400" /></div>;
  return <img src={url} className={`object-cover ${className || 'w-full h-full'}`} loading="lazy" decoding="async" />;
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState<string | number>(1);

  const increment = () => setQuantity(q => {
    if (product.stock <= 0) return 1;
    const next = typeof q === 'number' ? q + 1 : 1;
    return Math.min(next, product.stock);
  });
  const decrement = () => setQuantity(q => (typeof q === 'number' ? Math.max(1, q - 1) : 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      setQuantity('');
    } else {
      const num = parseInt(val);
      if (!isNaN(num)) {
        const clamped = product.stock > 0 ? Math.min(num, product.stock) : num;
        setQuantity(clamped);
      }
    }
  };

  const handleBlur = () => {
    if (quantity === '' || quantity === 0 || (typeof quantity === 'number' && quantity < 1)) {
      setQuantity(product.stock > 0 ? 1 : 0);
      return;
    }
    if (typeof quantity === 'number' && product.stock > 0) {
      setQuantity(Math.min(quantity, product.stock));
    }
  };

  const handleAddToCart = () => {
    const qtyToAdd = typeof quantity === 'number' ? quantity : 1;
    onAddToCart(product, qtyToAdd);
    setQuantity(1); // Reset to default
  };

  return (
    <div className="group relative bg-white dark:bg-slate-800/50 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-500 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm flex flex-col">
      <div className="aspect-square relative flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
        <StorageImage path={product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

        {/* Floating Tag */}
        <div className="absolute top-4 left-4 bg-slate-600 text-white z-10 text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
          {product.type}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{product.weight}</p>
            <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${product.stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {product.stock > 0 ? `In stock: ${product.stock >= 10 ? '10+' : product.stock}` : 'Out of stock'}
            </p>
          </div>
          <span className="text-lg font-bold text-teal-600 dark:text-teal-400">€{product.price.toFixed(2)}</span>
        </div>

        <div className="flex gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={decrement}
              className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              disabled={typeof quantity === 'number' ? quantity <= 1 : false}
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
              max={product.stock > 0 ? product.stock : undefined}
            />
            <button
              onClick={increment}
              className="p-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={product.stock <= 0 || (typeof quantity === 'number' && quantity >= product.stock)}
            >
              <Plus size={16} />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 dark:bg-white/5 dark:hover:bg-white text-white dark:text-white dark:hover:text-slate-900 font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={product.stock <= 0}
          >
            <ShoppingBag size={16} />
            {product.stock > 0 ? 'Add' : 'Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
