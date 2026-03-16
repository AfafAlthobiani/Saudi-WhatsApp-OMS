import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Send, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });
    if (!error) setSent(true);
    setLoading(false);
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
          {!sent ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-widest">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all active:scale-95 shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
              >
                {loading ? "جاري الإرسال..." : "تسجيل الدخول"}
                <Send size={20} />
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-gray-400 font-bold tracking-widest">أو عبر</span></div>
              </div>

              <button 
                type="button"
                onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                className="w-full bg-white border border-gray-100 text-gray-600 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                المتابعة باستخدام جوجل
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <Send size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black mb-2">تحقق من بريدك!</h3>
                <p className="text-gray-400 text-sm leading-relaxed">أرسلنا لك رابط تسجيل الدخول. يرجى الضغط عليه للمتابعة.</p>
              </div>
              <button 
                onClick={() => setSent(false)}
                className="text-emerald-600 text-sm font-bold flex items-center gap-2 mx-auto hover:underline"
              >
                <ArrowLeft size={16} />
                العودة لتغيير البريد
              </button>
            </div>
          )}
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
