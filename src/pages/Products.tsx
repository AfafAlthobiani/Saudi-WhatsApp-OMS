import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  DollarSign,
  Layers
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Products: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', threshold: '5' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'products'), 
        where('merchant_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!user || !newProduct.name || !newProduct.price) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'products'), {
        merchant_id: user.uid,
        name: newProduct.name,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock) || 0,
        threshold: Number(newProduct.threshold) || 5,
        created_at: serverTimestamp()
      });
      setShowAdd(false);
      setNewProduct({ name: '', price: '', stock: '', threshold: '5' });
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">المنتجات</h2>
          <p className="text-gray-400 text-sm mt-1">إدارة مخزون متجرك وتحديث الأسعار والكميات.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          إضافة منتج جديد
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">إجمالي المنتجات</p>
            <p className="text-xl font-black">{products.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">مخزون منخفض</p>
            <p className="text-xl font-black">{products.filter(p => p.stock <= p.threshold).length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">متوسط الأسعار</p>
            <p className="text-xl font-black">
              {(products.reduce((acc, p) => acc + Number(p.price), 0) / (products.length || 1)).toFixed(2)} <span className="text-xs font-medium">ريال</span>
            </p>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              {product.stock <= product.threshold && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center">
                  مخزون منخفض جداً
                </div>
              )}
              
              <div className="flex items-start justify-between mb-6 pt-2">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Package size={32} />
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-300 hover:text-emerald-600 transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 leading-tight">{product.name}</h3>
                  <p className="text-emerald-600 font-black text-lg mt-1">
                    {Number(product.price).toFixed(2)} <span className="text-xs font-medium">ريال</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">المخزون</span>
                    <span className={cn(
                      "text-lg font-black",
                      product.stock <= product.threshold ? "text-red-500" : "text-gray-900"
                    )}>
                      {product.stock} <span className="text-[10px] font-bold text-gray-400 uppercase">قطعة</span>
                    </span>
                  </div>
                  <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                    <Plus size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {products.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="text-gray-200" size={40} />
            </div>
            <p className="text-gray-400 font-medium">ابدأ بإضافة منتجاتك لمتجرك</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
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
                  <Plus className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">إضافة منتج جديد</h3>
                  <p className="text-gray-400 text-sm">أدخل تفاصيل المنتج ليتمكن العملاء من طلبه.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">اسم المنتج</label>
                  <input 
                    type="text" 
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="مثال: قهوة عربية مختصة"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">السعر (ريال)</label>
                    <input 
                      type="number" 
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 mr-2">الكمية المتوفرة</label>
                    <input 
                      type="number" 
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      placeholder="0"
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">تنبيه عند وصول المخزون إلى</label>
                  <input 
                    type="number" 
                    value={newProduct.threshold}
                    onChange={(e) => setNewProduct({...newProduct, threshold: e.target.value})}
                    placeholder="5"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleAdd}
                    disabled={saving || !newProduct.name || !newProduct.price}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? "جاري الحفظ..." : "إضافة المنتج"}
                  </button>
                  <button 
                    onClick={() => setShowAdd(false)}
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

export default Products;
