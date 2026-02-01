import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Product, CartItem } from './types';
import { CheckCircle2, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const [filter, setFilter] = useState<string>('ALL');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  const { user, products } = useAuth(); // Use products from context now

  // Toggle class on html element for Tailwind
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddToCart = (product: Product, quantity: number) => {
    if (quantity <= 0 || product.stock <= 0) return;
    
    setCartItems(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const maxAddable = Math.max(0, product.stock - currentQty);
      const qtyToAdd = Math.min(quantity, maxAddable);
      if (qtyToAdd <= 0) return prev;
      if (existingItem) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        const clampedQuantity = Math.min(newQuantity, item.product.stock);
        return clampedQuantity > 0 ? { ...item, quantity: clampedQuantity } : item;
      }
      return item;
    }));
  };

  const handleSetQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
        handleRemoveFromCart(productId);
        return;
    }
    
    setCartItems(prev => prev.map(item => {
        if (item.product.id === productId) {
            const clampedQuantity = Math.min(quantity, item.product.stock);
            return { ...item, quantity: clampedQuantity };
        }
        return item;
    }));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUserClick = () => {
    if (user) {
        setIsProfileOpen(true);
    } else {
        setIsLoginOpen(true);
    }
  };

  const filteredProducts = filter === 'ALL' 
    ? products 
    : products.filter(p => p.type === filter);

  // Calculate total number of items for the badge
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <NavBar 
        isDarkMode={isDarkMode} 
        toggleTheme={() => setIsDarkMode(!isDarkMode)} 
        cartCount={totalCartCount}
        onCartClick={() => setIsCartOpen(true)}
        onUserClick={handleUserClick}
        onAdminClick={() => setIsAdminOpen(true)}
      />
      
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onSetQuantity={handleSetQuantity}
        onCheckout={handleCheckout}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onClearCart={handleClearCart}
        total={cartTotal}
        cartItems={cartItems}
      />

      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <AdminDashboard 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <main>
        <Hero />

        {/* Features / Benefits Strip */}
        <section className="py-12 border-y border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30">
            <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                <FeatureItem icon={<CheckCircle2 className="text-teal-600 dark:text-teal-400"/>} title="±0.02mm Tolerance" desc="Laser measured precision" />
                <FeatureItem icon={<Truck className="text-teal-600 dark:text-teal-400"/>} title="Next Day Shipping" desc="On orders before 2PM" />
                <FeatureItem icon={<ShieldCheck className="text-teal-600 dark:text-teal-400"/>} title="Moisture Locked" desc="Vacuum sealed w/ desiccant" />
                <FeatureItem icon={<RefreshCw className="text-teal-600 dark:text-teal-400"/>} title="Tangle Free" desc="Perfectly wound spools" />
            </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-24 container mx-auto px-6 scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">THE COLLECTION</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md">Engineered thermoplastics for creators, engineers, and dreamers.</p>
                </div>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'PLA', 'PETG', 'ABS', 'TPU'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                                filter === type 
                                ? 'bg-teal-600 text-white dark:bg-white dark:text-slate-900' 
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={handleAddToCart}
                    />
                ))}
            </div>
        </section>

        {/* Technology/Info Section */}
        <section id="tech" className="py-24 container mx-auto px-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-16 flex flex-col lg:flex-row gap-12 items-center shadow-lg dark:shadow-none">
                <div className="flex-1 space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">PURE POLYMER.<br />NO FILLERS.</h2>
                    <ul className="space-y-4 mt-4">
                        <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            High-Speed Printing Capable (up to 500mm/s)
                        </li>
                        <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            Jam-Free Technology
                        </li>
                        <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                            <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                            Eco-Friendly Cardboard Spools
                        </li>
                    </ul>
                </div>
                <div className="flex-1 w-full relative h-[400px] bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                    {/* Abstract illustration of filament extrusion */}
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800">
                        {/* Nozzle */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-32 bg-slate-300 dark:bg-slate-700 rounded-b-xl z-20 shadow-xl"></div>
                        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-4 h-8 bg-yellow-600 rounded-b-lg z-10"></div>
                        
                        {/* Extruding Material */}
                        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-1 h-[300px] bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.5)] z-0 animate-pulse"></div>
                        
                        {/* Layer Lines Grid */}
                         <div className="absolute bottom-0 w-full h-1/2 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_20px]"></div>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-12">
        <div className="container mx-auto px-6 text-center">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">LUMA</h3>
            <div className="flex justify-center gap-8 mb-8 text-slate-500 text-sm font-medium">
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Shipping Policy</a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Returns</a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-slate-400 dark:text-slate-700 text-sm">© 2024 LUMA Filaments. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const FeatureItem = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="flex flex-col items-center text-center gap-2">
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-2">
            {icon}
        </div>
        <h4 className="font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{desc}</p>
    </div>
)

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App;
