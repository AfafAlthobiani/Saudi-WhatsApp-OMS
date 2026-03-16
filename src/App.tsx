/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Plus, 
  MoreVertical,
  Search,
  Bell,
  User,
  ArrowRight,
  FileText,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { supabase } from './lib/supabase';
import { generateZatcaInvoice } from './lib/invoice';

// Types
type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  district: string;
  status: OrderStatus;
  total_amount: number;
  vat_amount: number;
  created_at: string;
  items?: any[];
}

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-orange-500', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: CheckCircle2 },
};

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [view, setView] = useState<'dashboard' | 'products' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [merchant, setMerchant] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
    fetchMerchant();

    // Real-time subscription
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMerchant = async () => {
    const { data } = await supabase.from('merchants').select('*').limit(1).single();
    if (data) setMerchant(data);
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const handleGenerateInvoice = async (order: Order) => {
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', order.id);

      if (!items) return;

      const invoiceData = {
        merchantName: merchant?.name || "Mada Merchant",
        vatNumber: merchant?.vat_number || "300000000000003",
        invoiceDate: new Date(order.created_at).toISOString(),
        totalAmount: Number(order.total_amount),
        vatAmount: Number(order.vat_amount),
        items: items.map(item => ({
          name: item.products?.name || "Product",
          quantity: item.quantity,
          price: Number(item.price)
        }))
      };

      const pdfData = await generateZatcaInvoice(invoiceData);
      const link = document.createElement('a');
      link.href = pdfData;
      link.download = `invoice-${order.id.slice(0, 8)}.pdf`;
      link.click();
    } catch (err) {
      console.error("Failed to generate invoice", err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      fetchOrders(); // Rollback on error
      return;
    }

    if (newStatus === 'shipped') {
      try {
        await fetch(`/api/orders/${orderId}/ship`, { method: 'POST' });
      } catch (err) {
        console.error("Failed to ship order", err);
      }
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans pb-24">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
            <Smartphone className="text-white w-5 h-5" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Mada OMS</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {view === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
                <p className="text-2xl font-black text-emerald-600">
                  {orders.reduce((acc, o) => acc + Number(o.total_amount), 0).toLocaleString()} 
                  <span className="text-xs font-medium ml-1">SAR</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active</p>
                <p className="text-2xl font-black">{orders.filter(o => o.status !== 'delivered').length}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 mr-2">
                {(['all', 'new', 'preparing', 'shipped', 'delivered'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border",
                      activeTab === tab 
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105" 
                        : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200"
                    )}
                  >
                    {tab === 'all' ? 'All Orders' : STATUS_CONFIG[tab].label}
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchOrders}
                disabled={loading}
                className={cn(
                  "w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-emerald-600 transition-all active:rotate-180",
                  loading && "animate-spin"
                )}
              >
                <Clock className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer or ID..." 
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>

            {/* Order List */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    onStatusChange={updateOrderStatus}
                    onGenerateInvoice={handleGenerateInvoice}
                  />
                ))}
              </AnimatePresence>
              
              {filteredOrders.length === 0 && !loading && (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium">No orders found.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'products' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">Inventory</h2>
              <button className="bg-emerald-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid gap-3">
              {[
                { name: 'Oud Perfume', stock: 12, price: 150 },
                { name: 'Saffron 10g', stock: 3, price: 85 },
                { name: 'Arabic Coffee', stock: 45, price: 45 },
              ].map((product, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Package className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-base">{product.name}</p>
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-full">{product.price} SAR</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-black", product.stock < 5 ? "text-red-500" : "text-gray-900")}>
                      {product.stock} <span className="text-[10px] font-bold text-gray-400 uppercase">units</span>
                    </p>
                    {product.stock < 5 && <p className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">Low Stock</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-black tracking-tight">Settings</h2>
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Merchant Name</label>
                  <input 
                    type="text" 
                    value={merchant?.name || ''} 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm mt-1"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VAT Number</label>
                  <input 
                    type="text" 
                    value={merchant?.vat_number || ''} 
                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm mt-1"
                    readOnly
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-50">
                <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 active:scale-95 transition-transform">
                  Update Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-100 px-6 py-4 flex items-center justify-between z-50">
        <NavButton icon={LayoutDashboard} label="Home" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavButton icon={Package} label="Inventory" active={view === 'products'} onClick={() => setView('products')} />
        <div className="relative -top-10">
          <button className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 text-white hover:bg-emerald-700 transition-all active:scale-90 rotate-45">
            <Plus className="w-8 h-8 -rotate-45" />
          </button>
        </div>
        <NavButton icon={FileText} label="Settings" active={view === 'settings'} onClick={() => setView('settings')} />
        <NavButton icon={User} label="Profile" />
      </nav>
    </div>
  );
}

function OrderCard({ order, onStatusChange, onGenerateInvoice }: { order: Order, onStatusChange: (id: string, status: OrderStatus) => void, onGenerateInvoice: (order: Order) => void }) {
  const config = STATUS_CONFIG[order.status];
  const Icon = config.icon;

  const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
    new: 'preparing',
    preparing: 'shipped',
    shipped: 'delivered',
    delivered: null
  };

  const nextStatus = nextStatusMap[order.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-[2rem] border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", config.color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm tracking-tight">#{order.id.slice(0, 8).toUpperCase()}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString('en-GB')}</p>
          </div>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border", config.color.replace('bg-', 'text-').replace('500', '600'), config.color.replace('bg-', 'bg-') + '/10', config.color.replace('bg-', 'border-') + '/20')}>
          {config.label}
        </div>
      </div>

      <div className="mb-5">
        <p className="font-black text-base mb-1">{order.customer_name}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{order.customer_phone}</span>
          <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tighter">
            <Truck className="w-3 h-3" /> {order.district}, {order.city}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Total Amount</p>
          <p className="font-black text-lg text-gray-900 leading-none mt-1">
            {Number(order.total_amount).toFixed(2)} 
            <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">sar</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {order.status === 'delivered' && (
            <button 
              onClick={() => onGenerateInvoice(order)}
              className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
            >
              <FileText className="w-5 h-5" />
            </button>
          )}

          {nextStatus && (
            <button 
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              {STATUS_CONFIG[nextStatus].label}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NavButton({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 transition-all",
        active ? "text-emerald-600 scale-110" : "text-gray-300 hover:text-gray-500"
      )}
    >
      <Icon className={cn("w-6 h-6", active ? "stroke-[3px]" : "stroke-[2px]")} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
