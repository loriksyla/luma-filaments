import React, { createContext, useContext, useState } from 'react';
import { User, Address, Order, Product, FilamentType, OrderStatus } from '../types';

// Mock Initial Data
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Arctic White',
    type: FilamentType.PLA,
    color: 'White',
    hex: '#F8FAFC',
    price: 24.99,
    weight: '1kg',
    description: 'Pure, stark white with high opacity.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 50
  },
  {
    id: '2',
    name: 'Void Black',
    type: FilamentType.PLA,
    color: 'Black',
    hex: '#0F172A',
    price: 24.99,
    weight: '1kg',
    description: 'Deep, matte black finish.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 42
  },
  {
    id: '3',
    name: 'Cyber Teal',
    type: FilamentType.PETG,
    color: 'Teal',
    hex: '#2DD4BF',
    price: 28.99,
    weight: '1kg',
    description: 'High strength PETG with a vibrant neon teal hue.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 15
  },
  {
    id: '4',
    name: 'Inferno Red',
    type: FilamentType.PLA,
    color: 'Red',
    hex: '#EF4444',
    price: 24.99,
    weight: '1kg',
    description: 'Aggressive, bright red.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 8
  },
  {
    id: '5',
    name: 'Mech Grey',
    type: FilamentType.ABS,
    color: 'Grey',
    hex: '#64748B',
    price: 29.99,
    weight: '1kg',
    description: 'Industrial grade ABS.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 100
  },
  {
    id: '6',
    name: 'Volt Yellow',
    type: FilamentType.TPU,
    color: 'Yellow',
    hex: '#FACC15',
    price: 34.99,
    weight: '1kg',
    description: '95A Shore hardness flexible filament.',
    imageUrl: '',
    available: true,
    brand: 'LUMA',
    stock: 5
  },
];

const INITIAL_ORDERS: Order[] = [
    {
        id: 'ORD-001',
        userId: 'guest',
        customerName: 'Agim Gashi',
        customerEmail: 'agim@example.com',
        total: 49.98,
        date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 days ago
        status: 'Dorëzuar',
        items: [
            { product: INITIAL_PRODUCTS[0], quantity: 2 }
        ],
        address: 'Rruga B, Prishtinë'
    },
    {
        id: 'ORD-002',
        userId: 'guest',
        customerName: 'Teuta Krasniqi',
        customerEmail: 'teuta@example.com',
        total: 28.99,
        date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), // 1 day ago
        status: 'Në dërgim',
        items: [
            { product: INITIAL_PRODUCTS[2], quantity: 1 }
        ],
        address: 'Qendra, Prizren'
    },
     {
        id: 'ORD-003',
        userId: 'guest',
        customerName: 'Blerim Shala',
        customerEmail: 'blerim@example.com',
        total: 74.97,
        date: new Date().toISOString(), // Today
        status: 'Krijuar',
        items: [
            { product: INITIAL_PRODUCTS[1], quantity: 3 }
        ],
        address: 'Dardania, Prishtinë'
    }
];

interface AuthContextType {
  user: User | null;
  products: Product[];
  orders: Order[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  editAddress: (address: Address) => void;
  setDefaultAddress: (id: string) => void;
  deleteAddress: (id: string) => void;
  // Admin Methods
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addOrder: (order: Order) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const login = (email: string, pass: string) => {
    if (email === 'loriksyla@gmail.com' && pass === 'LorikSyla12') {
      const mockUser: User = {
        email: email,
        name: 'Lorik Syla',
        addresses: [],
        role: 'user'
      };
      setUser(mockUser);
      return true;
    }
    
    if (email === 'admin@admin.com' && pass === '1231') {
        const adminUser: User = {
            email: email,
            name: 'Administrator',
            addresses: [],
            role: 'admin'
        };
        setUser(adminUser);
        return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addAddress = (newAddrData: Omit<Address, 'id' | 'isDefault'>) => {
    if (!user) return;
    
    const newAddress: Address = {
        ...newAddrData,
        id: Math.random().toString(36).substr(2, 9),
        isDefault: user.addresses.length === 0 // First address is default
    };

    setUser({
        ...user,
        addresses: [...user.addresses, newAddress]
    });
  };

  const editAddress = (updatedAddr: Address) => {
    if (!user) return;
    setUser({
        ...user,
        addresses: user.addresses.map(a => a.id === updatedAddr.id ? updatedAddr : a)
    });
  };

  const setDefaultAddress = (id: string) => {
    if (!user) return;
    const updatedAddresses = user.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
    }));
    setUser({ ...user, addresses: updatedAddresses });
  };

  const deleteAddress = (id: string) => {
    if (!user) return;
    setUser({
        ...user,
        addresses: user.addresses.filter(a => a.id !== id)
    });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addOrder = (order: Order) => {
      setOrders(prev => [order, ...prev]);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        products, 
        orders, 
        login, 
        logout, 
        addAddress, 
        editAddress, 
        setDefaultAddress, 
        deleteAddress,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};