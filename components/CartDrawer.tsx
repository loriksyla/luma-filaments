import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (productId: string) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onSetQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
}

interface CartItemRowProps {
    item: CartItem;
    onRemoveItem: (id: string) => void;
    onUpdateQuantity: (id: string, delta: number) => void;
    onSetQuantity: (id: string, qty: number) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ 
    item, 
    onRemoveItem, 
    onUpdateQuantity, 
    onSetQuantity 
}) => {
    // Local state to manage input value (allows string for empty state)
    const [localQty, setLocalQty] = useState<string | number>(item.quantity);

    // Sync local state when prop changes (e.g. from +/- buttons)
    useEffect(() => {
        setLocalQty(item.quantity);
    }, [item.quantity]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            setLocalQty('');
        } else {
            const num = parseInt(val);
            if (!isNaN(num)) {
                setLocalQty(num);
                // Requirement: "when user types 0 ... it removes"
                if (num === 0) {
                    onRemoveItem(item.product.id);
                } else {
                    onSetQuantity(item.product.id, num);
                }
            }
        }
    };

    const handleBlur = () => {
        if (localQty === '' || localQty === 0) {
            // Remove if empty or 0 on blur
             onRemoveItem(item.product.id);
        } else if (typeof localQty === 'number') {
             onSetQuantity(item.product.id, localQty);
        }
    };

    return (
        <div className="flex gap-4 items-start bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl animate-fade-in border border-slate-100 dark:border-slate-800/50">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                <div className="w-10 h-10 rounded-full border-[6px]" style={{ borderColor: item.product.hex }}></div>
            </div>
            <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-900 dark:text-white text-base truncate pr-2">{item.product.name}</h4>
                <button 
                    onClick={() => onRemoveItem(item.product.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove item"
                >
                    <Trash2 size={16} />
                </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{item.product.type} • {item.product.weight}</p>
            
            <div className="flex justify-between items-end">
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 h-8">
                    <button 
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="px-2 h-full flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        disabled={item.quantity <= 1}
                    >
                        <Minus size={12} />
                    </button>
                    <input 
                        type="number" 
                        className="w-10 bg-transparent text-center text-xs font-bold text-slate-900 dark:text-white focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={localQty}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    <button 
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="px-2 h-full flex items-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <p className="text-teal-600 dark:text-teal-400 font-bold text-base">€{(item.product.price * item.quantity).toFixed(2)}</p>
            </div>
            </div>
        </div>
    );
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, cartItems, onRemoveItem, onUpdateQuantity, onSetQuantity, onCheckout }) => {
  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag size={20} />
              YOUR CART ({cartItems.length})
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <ShoppingBag size={48} className="opacity-20" />
                <p>Your cart is empty.</p>
                <button onClick={onClose} className="text-teal-600 dark:text-teal-400 font-bold text-sm hover:underline">Start Shopping</button>
              </div>
            ) : (
              cartItems.map((item) => (
                <CartItemRow 
                    key={item.product.id} 
                    item={item} 
                    onRemoveItem={onRemoveItem} 
                    onUpdateQuantity={onUpdateQuantity}
                    onSetQuantity={onSetQuantity}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-white">€{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-sm">Shipping</span>
                    <span className="text-teal-600 dark:text-teal-400 text-sm font-bold">Free</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-900 dark:text-white font-black text-lg">Total</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">€{total.toFixed(2)}</span>
                </div>
            </div>
            <button 
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={cartItems.length === 0}
                onClick={onCheckout}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;