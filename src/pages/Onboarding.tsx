import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, CheckCircle2, ArrowRight, Store, MessageSquare, Zap } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Onboarding: React.FC = () => {
  const { user, refreshMerchant } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!name || !user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'merchants', user.uid), {
        name,
        credits: 10, // Free trial credits
        vat_number: "300000000000003",
        created_at: serverTimestamp()
      });
      await refreshMerchant();
      navigate('/');
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans" dir="rtl">
      <div className="max-w-2xl w-full">
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                step >= i ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "bg-white text-gray-300 border border-gray-100"
              }`}>
                {step > i ? <CheckCircle2 size={20} /> : i}
              </div>
              {i < 3 && <div className={`w-12 h-1 rounded-full ${step > i ? "bg-emerald-600" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100"
        >
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600">
                  <Store size={40} />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">مرحباً بك في مدى</h2>
                <p className="text-gray-400">لنبدأ بتجهيز متجرك الإلكتروني الذكي.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-widest">اسم المتجر</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: متجر القهوة الفاخرة"
                  className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!name}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                التالي
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-emerald-600">
                  <MessageSquare size={40} />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">ربط واتساب</h2>
                <p className="text-gray-400">اربط رقم واتساب الخاص بمتجرك لتفعيل الذكاء الاصطناعي.</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-center space-y-4">
                <div className="w-32 h-32 bg-white rounded-3xl mx-auto flex items-center justify-center border border-gray-100 shadow-sm">
                  <div className="w-24 h-24 bg-gray-100 rounded-xl animate-pulse" />
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">امسح رمز QR للربط</p>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all active:scale-95"
                >
                  تم الربط بنجاح
                </button>
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 py-5 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                >
                  السابق
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-purple-600">
                  <Zap size={40} />
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">أنت جاهز للانطلاق!</h2>
                <p className="text-gray-400">لقد منحناك 10 أرصدة مجانية لتجربة النظام.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                  <p className="text-sm font-bold text-emerald-900">تم تفعيل الذكاء الاصطناعي</p>
                </div>
                <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                  <CheckCircle2 className="text-blue-600" size={24} />
                  <p className="text-sm font-bold text-blue-900">تم تجهيز لوحة التحكم</p>
                </div>
              </div>

              <button 
                onClick={handleComplete}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
              >
                {loading ? "جاري التجهيز..." : "ابدأ الآن"}
                <ArrowRight size={20} />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
