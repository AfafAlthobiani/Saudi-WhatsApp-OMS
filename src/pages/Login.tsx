import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Send, ArrowLeft, Sparkles } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error("Login error:", error);
      alert('فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans" dir="rtl">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200">
            <Smartphone className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-2">مدى OMS</h1>
          <p className="text-gray-400 font-medium">نظام إدارة الطلبات الذكي لتجار واتساب</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100"
        >
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">مرحباً بك مجدداً</h2>
              <p className="text-gray-400 text-sm">سجل الدخول لإدارة متجرك بذكاء</p>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-200 text-gray-700 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              {loading ? "جاري التحميل..." : "المتابعة باستخدام جوجل"}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-300 font-bold tracking-widest">آمن ومحمي بواسطة Firebase</span></div>
            </div>
          </div>
        </motion.div>

        <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
          <Sparkles size={16} className="text-emerald-400" />
          <p className="text-xs font-bold uppercase tracking-widest">مدعوم بالذكاء الاصطناعي</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
