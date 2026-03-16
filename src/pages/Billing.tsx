import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Zap, 
  History, 
  CheckCircle2, 
  ArrowUpRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'الباقة الأساسية',
    price: 99,
    credits: 100,
    features: ['100 طلب شهرياً', 'دعم فني عبر واتساب', 'تقارير مبيعات بسيطة'],
    color: 'bg-blue-600'
  },
  {
    id: 'pro',
    name: 'الباقة الاحترافية',
    price: 249,
    credits: 300,
    features: ['300 طلب شهرياً', 'ذكاء اصطناعي متقدم', 'تحليلات مبيعات ذكية', 'أولوية في الدعم'],
    color: 'bg-emerald-600',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'باقة الشركات',
    price: 599,
    credits: 1000,
    features: ['1000 طلب شهرياً', 'تخصيص كامل للذكاء الاصطناعي', 'مدير حساب خاص', 'ربط API متقدم'],
    color: 'bg-purple-600'
  }
];

const Billing: React.FC = () => {
  const { merchant } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('pro');

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">الاشتراك والرصيد</h2>
          <p className="text-gray-400 text-sm mt-1">إدارة باقتك وشحن رصيد الطلبات الخاص بك.</p>
        </div>
      </div>

      {/* Current Balance Card */}
      <div className="bg-gray-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-gray-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
              <Zap size={16} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest">الرصيد الحالي</span>
            </div>
            <h3 className="text-6xl font-black tracking-tighter">
              {merchant?.credits || 0} <span className="text-2xl font-bold text-gray-400">رصيد</span>
            </h3>
            <p className="text-gray-400 text-sm max-w-sm">
              يتم خصم رصيد واحد مقابل كل طلب يتم تحويله بنجاح عبر الذكاء الاصطناعي.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3">
              <CreditCard size={24} />
              شحن الرصيد الآن
            </button>
            <button className="bg-white/5 text-white px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <History size={20} />
              سجل المدفوعات
            </button>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-black">اختر الباقة المناسبة لنمو تجارتك</h3>
          <p className="text-gray-400 mt-2">باقات مرنة تناسب جميع أحجام المتاجر.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={cn(
                "bg-white rounded-[3rem] p-10 border-2 transition-all relative",
                plan.popular ? "border-emerald-600 shadow-2xl shadow-emerald-100" : "border-gray-50 shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  الأكثر طلباً
                </div>
              )}

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", plan.color)}>
                    {plan.id === 'starter' ? <Zap size={28} /> : plan.id === 'pro' ? <Star size={28} /> : <ShieldCheck size={28} />}
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{plan.price}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ريال / شهرياً</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-black">{plan.name}</h4>
                  <p className="text-emerald-600 font-bold text-sm mt-1">{plan.credits} رصيد طلبات</p>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-50">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={cn(
                  "w-full py-5 rounded-2xl font-black text-sm transition-all active:scale-95 mt-8",
                  plan.popular 
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700" 
                    : "bg-gray-900 text-white hover:bg-gray-800"
                )}>
                  اشترك الآن
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ / Info */}
      <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="text-xl font-black">كيف يعمل نظام الرصيد؟</h4>
            <p className="text-gray-500 leading-relaxed text-sm">
              نظام مدى يعتمد على الرصيد. كل رسالة واتساب يتم تحويلها إلى طلب مكتمل عبر الذكاء الاصطناعي تستهلك رصيداً واحداً. الرصيد لا ينتهي بانتهاء الشهر، بل يرحل معك طالما اشتراكك نشط.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-black">هل يمكنني تغيير باقتي؟</h4>
            <p className="text-gray-500 leading-relaxed text-sm">
              نعم، يمكنك الترقية أو تقليل الباقة في أي وقت. سيتم احتساب الفرق في الرصيد وإضافته لحسابك فوراً. نحن نؤمن بالمرونة الكاملة لنمو تجارتك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
