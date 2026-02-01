import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  confirmSignIn,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { User, Address, Order, Product, FilamentType, OrderStatus, Role, CartItem } from '../types';

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
  login: (email: string, pass: string) => Promise<{ ok: boolean; newPasswordRequired?: boolean; message?: string }>;
  completeNewPassword: (newPassword: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'isDefault'>) => void;
  editAddress: (address: Address) => void;
  setDefaultAddress: (id: string) => void;
  deleteAddress: (id: string) => void;
  // Admin Methods
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const client = generateClient<Schema>();

const statusToBackend = (status: OrderStatus) => {
  switch (status) {
    case 'Krijuar':
      return 'KRIJUAR';
    case 'Në proces':
      return 'NE_PROCES';
    case 'Në dërgim':
      return 'NE_DERGIM';
    case 'Dorëzuar':
      return 'DOREZUAR';
    case 'Anuluar':
      return 'ANULUAR';
    default:
      return 'KRIJUAR';
  }
};

const statusFromBackend = (status: string | null | undefined): OrderStatus => {
  switch (status) {
    case 'KRIJUAR':
      return 'Krijuar';
    case 'NE_PROCES':
      return 'Në proces';
    case 'NE_DERGIM':
      return 'Në dërgim';
    case 'DOREZUAR':
      return 'Dorëzuar';
    case 'ANULUAR':
      return 'Anuluar';
    default:
      return 'Krijuar';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  const resolveUserRole = async (): Promise<Role> => {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens?.accessToken?.payload?.['cognito:groups'];
      if (Array.isArray(groups) && groups.includes('ADMINS')) {
        return 'admin';
      }
      if (typeof groups === 'string' && groups === 'ADMINS') {
        return 'admin';
      }
    } catch {
      // Ignore and default to user
    }
    return 'user';
  };

  const buildUserFromSession = async (): Promise<User | null> => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email ?? currentUser.username;
      const name = attributes.name ?? attributes.given_name ?? email.split('@')[0];
      const role = await resolveUserRole();
      return {
        email,
        name,
        addresses: [],
        role,
      };
    } catch {
      return null;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      const result = await signIn({ username: email, password: pass });
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { ok: false, newPasswordRequired: true, message: 'Ju duhet të vendosni një fjalëkalim të ri.' };
      }
      if (result.isSignedIn) {
        const profile = await buildUserFromSession();
        setUser(profile);
        return { ok: true };
      }
      return { ok: false, message: 'Hyrja kërkon hapa shtesë. Ju lutem provoni përsëri.' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Hyrja dështoi. Ju lutem provoni përsëri.' };
    }
  };

  const completeNewPassword = async (newPassword: string) => {
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      if (result.isSignedIn) {
        const profile = await buildUserFromSession();
        setUser(profile);
        return { ok: true };
      }
      return { ok: false, message: 'Nuk u konfirmua fjalëkalimi i ri.' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Konfirmimi dështoi.' };
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
  };

  const loadProducts = async () => {
    const { data } = await client.models.Product.list();
    if (!data) {
      setProducts([]);
      return;
    }
    const mapped = data.map((item) => ({
      id: item.id,
      name: item.name ?? '',
      type: (item.type as FilamentType) ?? FilamentType.PLA,
      color: item.color ?? '',
      hex: item.hex ?? '#000000',
      price: item.price ?? 0,
      weight: item.weight ?? '',
      description: item.description ?? '',
      imageUrl: item.imageUrl ?? '',
      available: item.available ?? false,
      brand: item.brand ?? undefined,
      stock: item.stock ?? 0,
    }));
    setProducts(mapped);
  };

  const loadOrders = async () => {
    const { data } = await client.models.Order.list();
    if (!data) {
      setOrders([]);
      return;
    }
    const mapped = data.map((item) => ({
      id: item.id,
      userId: 'user',
      customerName: item.customerName ?? '',
      customerEmail: item.customerEmail ?? '',
      total: item.total ?? 0,
      date: item.date ?? '',
      status: statusFromBackend(item.status),
      items: (item.items as CartItem[]) ?? [],
      address: (item.address as Address) ?? '',
    }));
    setOrders(mapped);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const profile = await buildUserFromSession();
      if (mounted) {
        setUser(profile);
        if (profile) {
          await Promise.all([loadProducts(), loadOrders()]);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

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

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await client.models.Order.update({
      id: orderId,
      status: statusToBackend(status),
    });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const addProduct = async (product: Product) => {
    const { data } = await client.models.Product.create({
      name: product.name,
      type: product.type,
      color: product.color,
      hex: product.hex,
      price: product.price,
      weight: product.weight,
      description: product.description,
      imageUrl: product.imageUrl,
      available: product.available,
      brand: product.brand,
      stock: product.stock,
    });
    if (data) {
      setProducts(prev => [
        ...prev,
        { ...product, id: data.id },
      ]);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    await client.models.Product.update({
      id: updatedProduct.id,
      name: updatedProduct.name,
      type: updatedProduct.type,
      color: updatedProduct.color,
      hex: updatedProduct.hex,
      price: updatedProduct.price,
      weight: updatedProduct.weight,
      description: updatedProduct.description,
      imageUrl: updatedProduct.imageUrl,
      available: updatedProduct.available,
      brand: updatedProduct.brand,
      stock: updatedProduct.stock,
    });
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = async (id: string) => {
    await client.models.Product.delete({ id });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const addOrder = async (order: Order) => {
    const { data } = await client.models.Order.create({
      orderNumber: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      date: order.date,
      status: statusToBackend(order.status),
      items: order.items,
      address: order.address,
    });
    if (data) {
      setOrders(prev => [
        {
          ...order,
          id: data.id,
        },
        ...prev,
      ]);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        products, 
        orders, 
        login, 
        completeNewPassword,
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
