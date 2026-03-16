import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  FileText, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Smartphone,
  Send,
  Plus,
  ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { generateZatcaInvoice } from '../lib/invoice';
import { cn } from '../lib/utils';

type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered';

const STATUS_CONFIG = {
  new: { label: 'جديد', color: 'bg-blue-500', icon: Clock },
  preparing: { label: 'قيد التجهيز', color: 'bg-orange-500', icon: Clock },
  shipped: { label: 'تم الشحن', color: 'bg-purple-500', icon: Truck },
  delivered: { label: 'تم التوصيل', color: 'bg-green-500', icon: CheckCircle2 },
};

const Orders: React.FC = () => {
  const { merchant } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSimulate, setShowSimulate] = useState(false);
  const [simMessage, setSimMessage] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [merchant]);

  const fetchOrders = async () => {
    if (!merchant) return;
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
  };

  const handleSimulate = async () => {
    if (!simMessage || !merchant) return;
    setSimLoading(true);
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: simMessage, merchantId: merchant.id })
      });
      const extracted = await res.json();
      
      if (extracted.error) throw new Error(extracted.error);

      // Create order in DB
      const total = 150; // Mock total for demo
      const vat = total * 0.15;
      
      const { data: order } = await supabase.from('orders').insert({
        merchant_id: merchant.id,
        customer_name: extracted.customer_name,
        customer_phone: extracted.customer_phone || "966500000000",
        city: extracted.city,
        district: extracted.district,
        total_amount: total,
        vat_amount: vat,
        status: 'new'
      }).select().single();

      setShowSimulate(false);
      setSimMessage('');
      fetchOrders();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSimLoading(false);
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    const { data: items } = await supabase.from('order_items').select('*, products(name)').eq('order_id', order.id);
    const invoiceData = {
      merchantName: merchant.name,
      vatNumber: merchant.vat_number || "300000000000003",
      invoiceDate: order.created_at,
      totalAmount: Number(order.total_amount),
      vatAmount: Number(order.vat_amount),
      items: items?.map(i => ({ name: i.products.name, quantity: i.quantity, price: Number(i.price) })) || [
        { name: "منتج تجريبي", quantity: 1, price: Number(order.total_amount) - Number(order.vat_amount) }
      ]
    };
    const pdf = await generateZatcaInvoice(invoiceData);
    const link = document.createElement('a');
    link.href = pdf;
    link.download = `invoice-${order.id.slice(0, 8)}.pdf`;
    link.click();
  };

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const matchesSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">الطلبات</h2>
          <p className="text-gray-400 text-sm mt-1">إدارة الطلبات القادمة من واتساب وتتبع حالتها.</p>
        </div>
        <button 
          onClick={() => setShowSimulate(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Smartphone size={20} />
          محاكاة رسالة واتساب
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {(['all', 'new', 'preparing', 'shipped', 'delivered'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border",
              activeTab === tab 
                ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" 
                : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200"
            )}
          >
            {tab === 'all' ? 'الكل' : STATUS_CONFIG[tab].label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث برقم الطلب أو اسم العميل..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
          />
        </div>
        <button className="bg-white border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-2 text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
          <Filter size={18} />
          تصفية متقدمة
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">رقم الطلب</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">العميل</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">الموقع</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">المبلغ</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">الحالة</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-widest">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-gray-400">جاري التحميل...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <ShoppingCart className="text-gray-200" size={32} />
                      </div>
                      <p className="text-gray-400 font-medium">لا توجد طلبات حالياً</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="font-black text-sm text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">{new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-sm">{order.customer_name}</p>
                    <p className="text-xs text-emerald-600 font-medium">{order.customer_phone}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-medium">{order.city}</p>
                    <p className="text-xs text-gray-400">{order.district}</p>
                  </td>
                  <td className="px-8 py-5 font-black text-sm">
                    {Number(order.total_amount).toFixed(2)} <span className="text-[10px] text-gray-400">ر.س</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      STATUS_CONFIG[order.status as OrderStatus].color.replace('bg-', 'text-').replace('500', '600'),
                      STATUS_CONFIG[order.status as OrderStatus].color.replace('bg-', 'bg-') + '/10',
                      STATUS_CONFIG[order.status as OrderStatus].color.replace('bg-', 'border-') + '/20'
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", STATUS_CONFIG[order.status as OrderStatus].color)}></div>
                      {STATUS_CONFIG[order.status as OrderStatus].label}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      {order.status !== 'delivered' && (
                        <button 
                          onClick={() => {
                            const next: Record<OrderStatus, OrderStatus> = { new: 'preparing', preparing: 'shipped', shipped: 'delivered', delivered: 'delivered' };
                            updateStatus(order.id, next[order.status as OrderStatus]);
                          }}
                          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95"
                        >
                          تحديث الحالة
                        </button>
                      )}
                      <button 
                        onClick={() => handleDownloadInvoice(order)}
                        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                      >
                        <FileText size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulate Modal */}
      <AnimatePresence>
        {showSimulate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSimulate(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Smartphone className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">محاكاة رسالة واتساب</h3>
                  <p className="text-gray-400 text-sm">اختبر كيف يقوم الذكاء الاصطناعي بتحويل الرسائل إلى طلبات.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">مثال للرسالة</p>
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    "أهلاً، أريد طلب 2 قهوة عربية و1 تمر خلاص. أنا أحمد من الرياض، حي الملقا."
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">نص الرسالة</label>
                  <textarea 
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                    placeholder="اكتب رسالة العميل هنا..."
                    className="w-full bg-gray-50 border-none rounded-3xl py-5 px-6 text-sm min-h-[120px] focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleSimulate}
                    disabled={simLoading || !simMessage}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {simLoading ? "جاري المعالجة..." : "تحويل إلى طلب"}
                    <Send size={18} />
                  </button>
                  <button 
                    onClick={() => setShowSimulate(false)}
                    className="px-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
