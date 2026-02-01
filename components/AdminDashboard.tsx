import React, { useEffect, useState } from 'react';
import { X, Package, LayoutDashboard, ShoppingBag, Plus, Search, ChevronDown, Check, TrendingUp, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrderStatus, FilamentType, Product } from '../types';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const ORDER_STATUSES: OrderStatus[] = ['Krijuar', 'Në proces', 'Në dërgim', 'Dorëzuar', 'Anuluar'];

const DEFAULT_COLORS = [
    { name: 'White', hex: '#F8FAFC' },
    { name: 'Black', hex: '#0F172A' },
    { name: 'Red', hex: '#EF4444' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#22C55E' },
    { name: 'Yellow', hex: '#FACC15' },
    { name: 'Teal', hex: '#2DD4BF' },
    { name: 'Orange', hex: '#F97316' },
    { name: 'Purple', hex: '#A855F7' },
    { name: 'Grey', hex: '#64748B' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
    const { user, orders, products, updateOrderStatus, addProduct, updateProduct, deleteProduct, refreshOrders, refreshProducts } = useAuth();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');

    // New/Edit Product State
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        type: FilamentType.PLA,
        color: 'White',
        hex: '#F8FAFC',
        price: 24.99,
        weight: '1kg',
        description: '',
        stock: 0,
        available: true,
        brand: 'LUMA'
    });
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    useEffect(() => {
        if (isOpen && user?.role === 'admin') {
            refreshOrders();
            refreshProducts();
        }
    }, [isOpen, user, refreshOrders, refreshProducts]);

    if (!isOpen || !user || user.role !== 'admin') return null;

    // --- Dashboard Stats ---
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'Dorëzuar').length;

    // --- Filtering Logic ---
    const filteredOrders = orders.filter(order => 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper for visual spool preview
    const VisualSpool = ({ hex, brand }: { hex: string, brand: string }) => (
        <div className="relative w-40 h-40 rounded-full border-4 border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-center bg-white dark:bg-slate-900 mx-auto">
             <div 
                className="absolute inset-0 rounded-full border-[24px] opacity-90 transition-colors duration-300"
                style={{ borderColor: hex }}
            ></div>
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full z-10 flex items-center justify-center text-slate-500 dark:text-slate-700 text-[10px] font-bold tracking-widest text-center px-1">
                {brand.toUpperCase() || 'LUMA'}
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
        </div>
    );

    const resetForm = () => {
        setNewProduct({
            name: '',
            type: FilamentType.PLA,
            color: 'White',
            hex: '#F8FAFC',
            price: 24.99,
            weight: '1kg',
            description: '',
            stock: 0,
            available: true,
            brand: 'LUMA'
        });
        setEditingProductId(null);
        setIsAddingProduct(false);
    };

    const handleTabChange = (tab: 'dashboard' | 'orders' | 'products') => {
        setActiveTab(tab);
        setSearchQuery('');
        resetForm();
    };

    const handleSaveProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProduct.name && newProduct.price) {
            if (editingProductId) {
                // Update Existing
                const productToUpdate = {
                    ...newProduct,
                    id: editingProductId,
                    type: newProduct.type as FilamentType,
                    // Ensure defaults if missing
                    color: newProduct.color || 'Custom',
                    hex: newProduct.hex || '#CCCCCC',
                    weight: newProduct.weight || '1kg',
                    description: newProduct.description || 'No description',
                    imageUrl: '',
                    available: true,
                    brand: newProduct.brand || 'LUMA'
                } as Product;
                updateProduct(productToUpdate);
            } else {
                // Create New
                const productToAdd: Product = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: newProduct.name,
                    type: newProduct.type as FilamentType,
                    color: newProduct.color || 'Custom',
                    hex: newProduct.hex || '#CCCCCC',
                    price: Number(newProduct.price),
                    weight: newProduct.weight || '1kg',
                    description: newProduct.description || 'No description',
                    imageUrl: '',
                    available: true,
                    stock: Number(newProduct.stock),
                    brand: newProduct.brand || 'LUMA'
                };
                addProduct(productToAdd);
            }
            resetForm();
        }
    };

    const handleEditClick = (product: Product) => {
        setNewProduct({ ...product });
        setEditingProductId(product.id);
        setIsAddingProduct(true);
    };

    const handleDeleteClick = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-md z-[100] flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-20 md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shrink-0">
                        <Package size={20} />
                    </div>
                    <span className="font-black text-lg text-slate-900 dark:text-white hidden md:block tracking-tight">LUMA ADMIN</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => handleTabChange('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'dashboard' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="hidden md:block">Dashboard</span>
                    </button>
                    <button 
                        onClick={() => handleTabChange('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'orders' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <ShoppingBag size={20} />
                        <span className="hidden md:block">Orders</span>
                    </button>
                    <button 
                        onClick={() => handleTabChange('products')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'products' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Package size={20} />
                        <span className="hidden md:block">Products</span>
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                     <button onClick={onClose} className="w-full flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white px-4 py-2">
                        <span className="hidden md:block text-sm font-bold">Close Panel</span>
                        <X size={20} className="md:ml-auto" />
                     </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white capitalize">{activeTab}</h1>
                    <div className="flex items-center gap-4">
                        {activeTab !== 'dashboard' && (
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 focus-within:text-slate-900 dark:focus-within:text-white focus-within:border-rose-500 transition-colors text-sm w-64">
                                <Search size={16} />
                                <input 
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    className="bg-transparent outline-none w-full placeholder-slate-400"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">€{totalRevenue.toFixed(2)}</div>
                                <div className="flex items-center gap-1 text-emerald-500 text-xs mt-2 font-bold">
                                    <TrendingUp size={14} /> +12.5% this month
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Orders</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{totalOrders}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Delivered</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{deliveredOrders}</div>
                            </div>
                        </div>

                        {/* Revenue Graph (Visual only) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Monthly Revenue</h3>
                            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                                {[35, 45, 30, 60, 55, 75, 50, 65, 80, 70, 90, 85].map((h, i) => (
                                    <div key={i} className="w-full bg-rose-100 dark:bg-rose-900/20 rounded-t-lg relative group">
                                        <div 
                                            className="absolute bottom-0 w-full bg-rose-500 rounded-t-lg transition-all duration-1000 group-hover:bg-rose-600"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            €{(h * 150).toFixed(0)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Order ID</th>
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Customer</th>
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Date</th>
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Total</th>
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Status</th>
                                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Items</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">#{order.id}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                                                    <div className="text-xs text-slate-500">{order.customerEmail}</div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(order.date).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 font-bold text-slate-900 dark:text-white">€{order.total.toFixed(2)}</td>
                                                <td className="p-4">
                                                    <div className="relative inline-block">
                                                        <select 
                                                            value={order.status}
                                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                                            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border-0 cursor-pointer outline-none focus:ring-2 focus:ring-rose-500 ${
                                                                order.status === 'Dorëzuar' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                                order.status === 'Anuluar' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                order.status === 'Në dërgim' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            }`}
                                                        >
                                                            {ORDER_STATUSES.map(status => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                                                    </div>
                                                </td>
                                                <td className="p-4 text-xs text-slate-500">
                                                    {order.items.length} items
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="space-y-8">
                        {!isAddingProduct ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Inventory</h3>
                                    <button 
                                        onClick={() => setIsAddingProduct(true)}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors"
                                    >
                                        <Plus size={16} /> Add Product
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredProducts.length === 0 ? (
                                        <div className="col-span-full text-center py-12 text-slate-500">
                                            No products found matching "{searchQuery}".
                                        </div>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <div key={product.id} className="relative group flex gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/20 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all">
                                                <div className="w-16 h-16 rounded-full border-4 shrink-0 bg-white dark:bg-slate-900" style={{ borderColor: product.hex }}></div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{product.name}</h4>
                                                    <p className="text-xs text-slate-500 mb-2 truncate">{product.type} • {product.brand}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-rose-600 dark:text-rose-400 font-bold">€{product.price}</span>
                                                        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-0.5">
                                                            <span className="text-xs text-slate-400 font-mono">Stock:</span>
                                                            <input 
                                                                type="number"
                                                                className="w-12 bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 outline-none p-0 border-none focus:ring-0"
                                                                defaultValue={product.stock}
                                                                onBlur={(e) => updateProduct({...product, stock: Number(e.target.value)})}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.currentTarget.blur();
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEditClick(product)}
                                                        className="p-1.5 bg-blue-50 text-blue-500 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                                        title="Edit Product"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(product.id)}
                                                        className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 max-w-4xl mx-auto animate-fade-in">
                                <div className="flex items-center gap-2 mb-6 cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={resetForm}>
                                    <span>←</span> <span className="text-sm font-bold">Back to List</span>
                                </div>
                                
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8">
                                    {editingProductId ? 'Edit Product' : 'New Product'}
                                </h2>
                                
                                <div className="flex flex-col md:flex-row gap-12">
                                    {/* Visual Preview */}
                                    <div className="w-full md:w-1/3 flex flex-col items-center">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Live Preview</h3>
                                        <VisualSpool hex={newProduct.hex || '#ccc'} brand={newProduct.brand || 'LUMA'} />
                                        <div className="mt-8 text-center">
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{newProduct.name || 'Product Name'}</h4>
                                            <p className="text-rose-600 dark:text-rose-400 font-bold mt-1">€{newProduct.price || '0.00'}</p>
                                        </div>
                                    </div>

                                    {/* Form */}
                                    <form onSubmit={handleSaveProduct} className="flex-1 space-y-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                                                <input 
                                                    required 
                                                    value={newProduct.name}
                                                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Brand Text</label>
                                                <input 
                                                    value={newProduct.brand}
                                                    onChange={e => setNewProduct({...newProduct, brand: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                                    placeholder="LUMA"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                                                <select 
                                                    value={newProduct.type}
                                                    onChange={e => setNewProduct({...newProduct, type: e.target.value as FilamentType})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500 appearance-none"
                                                >
                                                    {Object.values(FilamentType).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Price (€)</label>
                                                <input 
                                                    type="number"
                                                    step="0.01"
                                                    required 
                                                    value={newProduct.price}
                                                    onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Color</label>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {DEFAULT_COLORS.map(c => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        onClick={() => setNewProduct({...newProduct, color: c.name, hex: c.hex})}
                                                        className={`w-8 h-8 rounded-full border-2 transition-all ${newProduct.hex === c.hex ? 'border-rose-500 scale-110' : 'border-slate-200 dark:border-slate-700 hover:scale-105'}`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="color"
                                                    value={newProduct.hex}
                                                    onChange={e => setNewProduct({...newProduct, hex: e.target.value, color: 'Custom'})}
                                                    className="w-10 h-10 rounded cursor-pointer"
                                                />
                                                <input 
                                                    value={newProduct.hex}
                                                    onChange={e => setNewProduct({...newProduct, hex: e.target.value, color: 'Custom'})}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 outline-none uppercase font-mono text-sm"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Stock Quantity</label>
                                                <input 
                                                    type="number"
                                                    required 
                                                    value={newProduct.stock}
                                                    onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Weight</label>
                                                <input 
                                                    value={newProduct.weight}
                                                    onChange={e => setNewProduct({...newProduct, weight: e.target.value})}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-rose-500"
                                                    placeholder="1kg"
                                                />
                                            </div>
                                        </div>

                                        <button 
                                            type="submit"
                                            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-rose-500/20"
                                        >
                                            {editingProductId ? 'Update Product' : 'Create Product'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
