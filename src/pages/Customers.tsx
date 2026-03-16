import React, { useEffect, useState } from 'react';
import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Calendar,
  MoreVertical,
  MessageSquare
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Customers: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), where('merchant_id', '==', user.uid));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => doc.data());
      
      if (orders) {
        const customerMap = new Map();
        orders.forEach(o => {
          if (!customerMap.has(o.customer_phone)) {
            customerMap.set(o.customer_phone, {
              name: o.customer_name,
              phone: o.customer_phone,
              city: o.city,
              totalOrders: 0,
              totalSpent: 0,
              lastOrder: o.created_at?.toDate?.() || new Date(o.created_at)
            });
          }
          const c = customerMap.get(o.customer_phone);
          c.totalOrders += 1;
          c.totalSpent += Number(o.total_amount);
          const orderDate = o.created_at?.toDate?.() || new Date(o.created_at);
          if (orderDate > c.lastOrder) {
            c.lastOrder = orderDate;
          }
        });
        setCustomers(Array.from(customerMap.values()));
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight">العملاء</h2>
        <p className="text-gray-400 text-sm mt-1">قاعدة بيانات عملائك وتاريخ مشترياتهم عبر واتساب.</p>
      </div>

      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="بحث باسم العميل أو رقم الجوال..." 
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pr-12 pl-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <User className="text-gray-200 mx-auto mb-4" size={48} />
            <p className="text-gray-400 font-medium">لا يوجد عملاء مسجلون بعد</p>
          </div>
        ) : customers.map((customer, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <User size={32} />
              </div>
              <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black">{customer.name}</h3>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mt-1">
                  <Phone size={14} />
                  {customer.phone}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                <MapPin size={14} />
                {customer.city}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">إجمالي الطلبات</p>
                  <p className="text-lg font-black">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">إجمالي الإنفاق</p>
                  <p className="text-lg font-black text-emerald-600">{customer.totalSpent.toFixed(0)} <span className="text-[10px]">ر.س</span></p>
                </div>
              </div>

              <button className="w-full mt-4 bg-gray-50 text-gray-600 py-3 rounded-xl font-bold text-xs hover:bg-emerald-50 hover:text-emerald-600 transition-all flex items-center justify-center gap-2">
                <MessageSquare size={14} />
                فتح محادثة واتساب
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;
