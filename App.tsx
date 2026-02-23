import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import NavBar from './components/NavBar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import { Product, CartItem } from './types';
import { CheckCircle2, Truck, ShieldCheck, Package } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

const CartDrawer = lazy(() => import('./components/CartDrawer'));
const CheckoutModal = lazy(() =>
  import('./components/CheckoutModal').then((module) => ({ default: module.CheckoutModal }))
);
const LoginModal = lazy(() =>
  import('./components/LoginModal').then((module) => ({ default: module.LoginModal }))
);
const ProfileModal = lazy(() =>
  import('./components/ProfileModal').then((module) => ({ default: module.ProfileModal }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const ContactModal = lazy(() =>
  import('./components/ContactModal').then((module) => ({ default: module.ContactModal }))
);

const UI_STATE_KEY = 'luma-ui-state-v1';
const SCROLL_KEY = 'luma-scroll-y-v1';

type PersistedUiState = {
  filter?: string;
  isDarkMode?: boolean;
};

const loadUiState = (): PersistedUiState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(UI_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedUiState;
  } catch {
    return {};
  }
};

const getSystemPrefersDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const FullscreenLoader = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <div className={`fixed inset-0 z-[200] flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
    <span className="h-6 w-6 rounded-full border-2 border-black border-t-transparent animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const initialUiState = loadUiState();
  const [filter, setFilter] = useState<string>(initialUiState.filter ?? 'ALL');
  const [isDarkMode, setIsDarkMode] = useState(initialUiState.isDarkMode ?? getSystemPrefersDark());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const hasRestoredScroll = useRef(false);

  const { user, products, isAuthReady } = useAuth(); // Use products from context now

  // Toggle class on html element for Tailwind
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!user && isProfileOpen) {
      setIsProfileOpen(false);
    }
    if (!user?.isAdmin && isAdminOpen) {
      setIsAdminOpen(false);
    }
  }, [isAuthReady, user, isProfileOpen, isAdminOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stateToPersist: PersistedUiState = {
      filter,
      isDarkMode,
    };
    window.sessionStorage.setItem(UI_STATE_KEY, JSON.stringify(stateToPersist));
  }, [filter, isDarkMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || hasRestoredScroll.current || !isAuthReady) return;
    const raw = window.sessionStorage.getItem(SCROLL_KEY);
    const savedY = raw ? Number(raw) : 0;
    if (Number.isNaN(savedY) || savedY <= 0) {
      hasRestoredScroll.current = true;
      return;
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, savedY);
      hasRestoredScroll.current = true;
    });
  }, [isAuthReady, products.length]);

  const isAnyModalOpen = isCartOpen || isCheckoutOpen || isLoginOpen || isProfileOpen || isAdminOpen || isContactOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persistScroll = () => {
      window.sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    };
    window.addEventListener('scroll', persistScroll, { passive: true });
    window.addEventListener('beforeunload', persistScroll);
    return () => {
      window.removeEventListener('scroll', persistScroll);
      window.removeEventListener('beforeunload', persistScroll);
    };
  }, []);

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
  const shouldBlockForAuthRestore = !isAuthReady && (isAdminOpen || isProfileOpen);

  // Calculate total number of items for the badge
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (shouldBlockForAuthRestore) {
    return <FullscreenLoader isDarkMode={isDarkMode} />;
  }

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

      <Suspense fallback={null}>
        {/* Keep overlay components mounted; their CSS transitions depend on toggling `isOpen` between rendered states. */}
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

        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />
      </Suspense>

      <main>
        <Hero />

        {/* Features / Benefits Strip */}
        <section className="py-12 border-y border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/30">
          <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <FeatureItem icon={<CheckCircle2 className="text-teal-600 dark:text-teal-400" />} title="Cilësi e Garantuar" desc="Të testuara dhe verifikuara" />
            <FeatureItem icon={<ShieldCheck className="text-teal-600 dark:text-teal-400" />} title="Marka të Besuara" desc="Cilësi globale për ju" />
            <FeatureItem icon={<Truck className="text-teal-600 dark:text-teal-400" />} title="Dërgesë e Shpejtë" desc="Dërgesa merr 1-3 ditë" />
            <FeatureItem icon={<Package className="text-teal-600 dark:text-teal-400" />} title="Paketim i Sigurt" desc="E mbyllur me vakum" />
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-24 container mx-auto px-6 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">KOLEKSIONI</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['ALL', 'PLA', 'PETG', 'ABS', 'TPU', 'ASA']
                .filter(type => type === 'ALL' || products.some(p => p.type === type))
                .map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilter(type)}
                    className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${filter === type
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



      </main>

      <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">LUMA</h3>
            <button
              onClick={() => setIsContactOpen(true)}
              className="px-5 py-2 rounded-full text-sm font-bold border-2 border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-400 dark:hover:text-slate-900 transition-all"
            >
              Na Kontaktoni / Kërkesa &amp; Sugjerime
            </button>
          </div>
          <p className="text-slate-400 dark:text-slate-700 text-sm text-center sm:text-left">© 2026 LUMA Filaments. Të gjitha të drejtat e rezervuara.</p>
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
