import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signUp,
  signIn,
  signOut,
} from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { User, Address, Order, Product, FilamentType, OrderStatus, CartItem } from '../types';

// Mock Initial Data
const INITIAL_PRODUCTS: Product[] = [];
const INITIAL_ORDERS: Order[] = [];
const ORDERS_PAGE_SIZE = 15;

interface AuthContextType {
  isAuthReady: boolean;
  user: User | null;
  products: Product[];
  orders: Order[];
  hasMoreOrders: boolean;
  loadMoreOrders: () => Promise<void>;
  isLoadingMoreOrders: boolean;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ ok: boolean; confirmRequired?: boolean; message?: string }>;
  confirmSignUpCode: (email: string, code: string) => Promise<{ ok: boolean; message?: string }>;
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

const toJsonValue = <T,>(value: T): string => JSON.stringify(value ?? null);
const fromJsonValue = <T,>(value: unknown, fallback: T): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (value == null) return fallback;
  return value as T;
};

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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [ordersNextToken, setOrdersNextToken] = useState<string | null>(null);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);
  const orderRefreshTimerRef = useRef<number | null>(null);
  const currentUserRef = useRef<User | null>(null);

  const checkIsAdmin = async (): Promise<boolean> => {
    try {
      const session = await fetchAuthSession();
      const groups = session.tokens?.accessToken?.payload?.['cognito:groups'];
      if (Array.isArray(groups) && groups.includes('ADMINS')) {
        return true;
      }
      if (typeof groups === 'string' && groups === 'ADMINS') {
        return true;
      }
    } catch {
      // Ignore and default to user
    }
    return false;
  };

  const buildUserFromSession = async (): Promise<User | null> => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email ?? currentUser.username;
      const name = attributes.name ?? attributes.given_name ?? email.split('@')[0];
      const isAdmin = await checkIsAdmin();
      return {
        email,
        name,
        addresses: [],
        isAdmin,
      };
    } catch {
      return null;
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      try {
        await signOut();
      } catch {
        // Ignore if no active session
      }
      const result = await signIn({ username: email, password: pass });
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { ok: false, newPasswordRequired: true, message: 'Ju duhet të vendosni një fjalëkalim të ri.' };
      }
      if (result.isSignedIn) {
        const profile = await buildUserFromSession();
        if (profile) {
          const synced = await syncUserProfile(profile);
          setOrders(INITIAL_ORDERS);
          setOrdersLoaded(false);
          setOrdersNextToken(null);
          setHasMoreOrders(false);
          setUser(synced);
          await loadProducts('userPool');
        }
        return { ok: true };
      }
      return { ok: false, message: 'Hyrja kërkon hapa shtesë. Ju lutem provoni përsëri.' };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Hyrja dështoi. Ju lutem provoni përsëri.' };
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      try {
        await signOut();
      } catch {
        // Ignore if no active session
      }
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name,
          },
        },
      });
      if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
        return { ok: true, confirmRequired: true };
      }
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Regjistrimi dështoi.' };
    }
  };

  const confirmSignUpCode = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message || 'Konfirmimi dështoi.' };
    }
  };

  const completeNewPassword = async (newPassword: string) => {
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword });
      if (result.isSignedIn) {
        const profile = await buildUserFromSession();
        if (profile) {
          const synced = await syncUserProfile(profile);
          setOrders(INITIAL_ORDERS);
          setOrdersLoaded(false);
          setOrdersNextToken(null);
          setHasMoreOrders(false);
          setUser(synced);
          await loadProducts('userPool');
        }
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
    setUserProfileId(null);
    setOrders(INITIAL_ORDERS);
    setOrdersLoaded(false);
    setOrdersNextToken(null);
    setHasMoreOrders(false);
    await loadProducts('identityPool');
  };

  const loadProducts = async (authMode?: 'identityPool' | 'userPool') => {
    const { data } = await client.models.Product.list(
      authMode ? { authMode } : undefined
    );
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

  const mapOrders = (items: Array<any>) =>
    items.map((item) => ({
      id: item.id,
      userId: 'user',
      customerName: item.customerName ?? '',
      customerEmail: item.customerEmail ?? '',
      total: item.total ?? 0,
      date: item.date ?? '',
      status: statusFromBackend(item.status),
      items: fromJsonValue<CartItem[]>(item.items, []),
      address: fromJsonValue<Address | string>(item.address, ''),
    }));

  const sortOrders = (items: Order[]) =>
    [...items].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return b.id.localeCompare(a.id);
    });

  const mergeOrders = (existing: Order[], incoming: Order[]) => {
    const byId = new Map<string, Order>();
    existing.forEach((order) => byId.set(order.id, order));
    incoming.forEach((order) => byId.set(order.id, order));
    return sortOrders(Array.from(byId.values()));
  };

  const listOrdersPage = async (nextToken?: string | null, limit = ORDERS_PAGE_SIZE) => {
    const currentUser = currentUserRef.current;
    if (!currentUser) {
      return { data: [] as Order[], nextToken: null as string | null };
    }
    const options: Record<string, unknown> = {
      authMode: 'userPool',
      limit,
      sortDirection: 'DESC',
    };
    if (nextToken) {
      options.nextToken = nextToken;
    }
    if (!currentUser.isAdmin) {
      options.filter = { customerEmail: { eq: currentUser.email } };
    }
    const response = await client.models.Order.list(options as any);
    return {
      data: mapOrders(response.data ?? []),
      nextToken: (response as { nextToken?: string | null }).nextToken ?? null,
    };
  };

  const loadOrders = async (reset = false, limit = ORDERS_PAGE_SIZE) => {
    const token = reset ? null : ordersNextToken;
    if (!reset && !token) return;
    if (!reset) setIsLoadingMoreOrders(true);
    try {
      const { data, nextToken } = await listOrdersPage(token, limit);
      if (reset) {
        setOrders(sortOrders(data));
      } else {
        setOrders((prev) => mergeOrders(prev, data));
      }
      setOrdersNextToken(nextToken);
      setHasMoreOrders(Boolean(nextToken));
      setOrdersLoaded(true);
    } finally {
      if (!reset) setIsLoadingMoreOrders(false);
    }
  };

  const refreshOrders = async () => {
    await loadOrders(true, ORDERS_PAGE_SIZE);
  };

  const loadMoreOrders = async () => {
    if (!hasMoreOrders || isLoadingMoreOrders) return;
    await loadOrders(false, ORDERS_PAGE_SIZE);
  };

  const syncUserProfile = async (profile: User): Promise<User> => {
    const { data } = await client.models.UserProfile.list({ authMode: 'userPool' });
    if (data && data.length > 0) {
      const record = data[0];
      setUserProfileId(record.id);
      const addresses = fromJsonValue<Address[]>(record.addresses, []);
      return {
        ...profile,
        addresses,
      };
    }

    const { data: created } = await client.models.UserProfile.create({
      name: profile.name,
      email: profile.email,
      addresses: toJsonValue(profile.addresses),
    } as any, { authMode: 'userPool' });

    if (created) {
      setUserProfileId(created.id);
    }

    return profile;
  };

  const persistAddresses = async (addresses: Address[]) => {
    if (!user) return;
    if (userProfileId) {
      await client.models.UserProfile.update({
        id: userProfileId,
        name: user.name,
        email: user.email,
        addresses: toJsonValue(addresses),
      } as any, { authMode: 'userPool' });
      return;
    }

    const { data } = await client.models.UserProfile.create({
      name: user.name,
      email: user.email,
      addresses: toJsonValue(addresses),
    } as any, { authMode: 'userPool' });
    if (data) {
      setUserProfileId(data.id);
    }
  };

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const profile = await buildUserFromSession();
        if (mounted) {
          if (profile) {
            const synced = await syncUserProfile(profile);
            setOrders(INITIAL_ORDERS);
            setOrdersLoaded(false);
            setOrdersNextToken(null);
            setHasMoreOrders(false);
            setUser(synced);
            await loadProducts('userPool');
          } else {
            setUser(null);
            setOrders(INITIAL_ORDERS);
            setOrdersLoaded(false);
            setOrdersNextToken(null);
            setHasMoreOrders(false);
            await loadProducts('identityPool');
          }
        }
      } finally {
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const subscriptions: Array<{ unsubscribe: () => void }> = [];

    const scheduleOrderRefresh = () => {
      if (!ordersLoaded) return;
      if (orderRefreshTimerRef.current !== null) {
        window.clearTimeout(orderRefreshTimerRef.current);
      }
      orderRefreshTimerRef.current = window.setTimeout(() => {
        void loadOrders(true, Math.max(orders.length, ORDERS_PAGE_SIZE));
        orderRefreshTimerRef.current = null;
      }, 500);
    };

    subscriptions.push(
      client.models.Order.onCreate().subscribe({
        next: (event: unknown) => {
          const payload = event as
            | { customerEmail?: string }
            | { data?: { customerEmail?: string } }
            | { element?: { customerEmail?: string } };
          const customerEmail =
            (payload as { customerEmail?: string })?.customerEmail ??
            (payload as { data?: { customerEmail?: string } })?.data?.customerEmail ??
            (payload as { element?: { customerEmail?: string } })?.element?.customerEmail;
          if (user.isAdmin || (customerEmail && customerEmail === user.email)) {
            scheduleOrderRefresh();
          }
        },
      }),
      client.models.Order.onUpdate().subscribe({
        next: (event: unknown) => {
          const payload = event as
            | { customerEmail?: string }
            | { data?: { customerEmail?: string } }
            | { element?: { customerEmail?: string } };
          const customerEmail =
            (payload as { customerEmail?: string })?.customerEmail ??
            (payload as { data?: { customerEmail?: string } })?.data?.customerEmail ??
            (payload as { element?: { customerEmail?: string } })?.element?.customerEmail;
          if (user.isAdmin || (customerEmail && customerEmail === user.email)) {
            scheduleOrderRefresh();
          }
        },
      }),
      client.models.Order.onDelete().subscribe({
        next: () => {
          if (user.isAdmin) {
            scheduleOrderRefresh();
          }
        },
      })
    );

    return () => {
      if (orderRefreshTimerRef.current !== null) {
        window.clearTimeout(orderRefreshTimerRef.current);
        orderRefreshTimerRef.current = null;
      }
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    };
  }, [user?.email, user?.isAdmin, ordersLoaded, orders.length]);

  const addAddress = (newAddrData: Omit<Address, 'id' | 'isDefault'>) => {
    if (!user) return;

    const newAddress: Address = {
      ...newAddrData,
      id: Math.random().toString(36).substr(2, 9),
      isDefault: user.addresses.length === 0 // First address is default
    };

    const updated = [...user.addresses, newAddress];
    setUser({
      ...user,
      addresses: updated
    });
    persistAddresses(updated);
  };

  const editAddress = (updatedAddr: Address) => {
    if (!user) return;
    const updated = user.addresses.map(a => a.id === updatedAddr.id ? updatedAddr : a);
    setUser({
      ...user,
      addresses: updated
    });
    persistAddresses(updated);
  };

  const setDefaultAddress = (id: string) => {
    if (!user) return;
    const updatedAddresses = user.addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    }));
    setUser({ ...user, addresses: updatedAddresses });
    persistAddresses(updatedAddresses);
  };

  const deleteAddress = (id: string) => {
    if (!user) return;
    const updated = user.addresses.filter(a => a.id !== id);
    setUser({
      ...user,
      addresses: updated
    });
    persistAddresses(updated);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await client.models.Order.update({
      id: orderId,
      status: statusToBackend(status),
    } as any, { authMode: 'userPool' });
    await refreshOrders();
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
    } as any, { authMode: 'userPool' });
    if (!data) {
      throw new Error('Nuk u krijua produkti.');
    }
    await loadProducts('userPool');
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
    } as any, { authMode: 'userPool' });
    await loadProducts('userPool');
  };

  const deleteProduct = async (id: string) => {
    await client.models.Product.delete({ id }, { authMode: 'userPool' });
    await loadProducts('userPool');
  };

  const addOrder = async (order: Order) => {
    const { data, errors } = await client.mutations.placeOrder({
      orderNumber: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      date: order.date,
      items: toJsonValue(order.items),
      address: toJsonValue(order.address),
    }, { authMode: user ? 'userPool' : 'identityPool' });

    if (errors && errors.length > 0) {
      const rawMessage = errors[0]?.message;
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : rawMessage
            ? JSON.stringify(rawMessage)
            : 'Porosia nuk u krijua.';
      throw new Error(message);
    }
    if (!data?.ok) {
      const rawMessage = data?.message;
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : rawMessage
            ? JSON.stringify(rawMessage)
            : 'Porosia nuk u krijua.';
      throw new Error(message);
    }

    await loadProducts(user ? 'userPool' : 'identityPool');
    if (user) {
      await refreshOrders();
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthReady,
      user,
      products,
      orders,
      hasMoreOrders,
      loadMoreOrders,
      isLoadingMoreOrders,
      refreshProducts: () => loadProducts(user ? 'userPool' : 'identityPool'),
      refreshOrders,
      signUpWithEmail,
      confirmSignUpCode,
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
