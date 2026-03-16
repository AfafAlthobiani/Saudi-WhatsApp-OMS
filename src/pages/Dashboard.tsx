import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const data = [
  { name: 'السبت', sales: 4000 },
  { name: 'الأحد', sales: 3000 },
  { name: 'الاثنين', sales: 2000 },
  { name: 'الثلاثاء', sales: 2780 },
  { name: 'الأربعاء', sales: 1890 },
  { name: 'الخميس', sales: 2390 },
  { name: 'الجمعة', sales: 3490 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold",
        trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
      )}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trendValue}%
      </div>
    </div>
    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
    <p className="text-2xl font-black">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const { user, merchant } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeCustomers: 0,
    pendingOrders: 0
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchInsights();
    }
  }, [user, merchant]);

  const fetchStats = async () => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('merchant_id', '==', user.uid));
    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());
    
    if (orders) {
      setStats({
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + Number(o.total_amount), 0),
        activeCustomers: new Set(orders.map(o => o.customer_phone)).size,
        pendingOrders: orders.filter(o => o.status === 'pending').length
      });
    }
  };

  const fetchInsights = async () => {
    if (!user) return;
    setLoadingInsights(true);
    try {
      const q = query(collection(db, 'orders'), where('merchant_id', '==', user.uid), limit(50));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => doc.data());

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
        Analyze this sales data for a merchant:
        Orders: ${JSON.stringify(orders)}
        
        Generate 3 key insights in Arabic for the merchant dashboard.
        Focus on: Best selling, stock recommendations, and revenue trends.
        Return as a JSON array of strings.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" }
      });

      const insightsData = JSON.parse(result.text || "[]");
      setInsights(insightsData);
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">نظرة عامة</h2>
          <p className="text-gray-400 text-sm mt-1">أهلاً بك مجدداً، إليك ملخص أداء متجرك اليوم.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <Clock size={18} />
            آخر 7 أيام
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي المبيعات" 
          value={`${stats.totalRevenue.toLocaleString()} ريال`} 
          icon={DollarSign} 
          trend="up" 
          trendValue="12" 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="إجمالي الطلبات" 
          value={stats.totalOrders} 
          icon={ShoppingBag} 
          trend="up" 
          trendValue="8" 
          color="bg-blue-600" 
        />
        <StatCard 
          title="العملاء النشطون" 
          value={stats.activeCustomers} 
          icon={Users} 
          trend="up" 
          trendValue="5" 
          color="bg-purple-600" 
        />
        <StatCard 
          title="طلبات معلقة" 
          value={stats.pendingOrders} 
          icon={Clock} 
          trend="down" 
          trendValue="2" 
          color="bg-orange-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">تحليل المبيعات</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-gray-400">الإيرادات</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Sparkles className="text-emerald-400" size={20} />
              </div>
              <h3 className="text-xl font-black">رؤى مدى الذكية</h3>
            </div>
            
            <div className="space-y-4">
              {loadingInsights ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-2/3"></div>
                </div>
              ) : insights.length > 0 ? (
                insights.map((insight, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm"
                  >
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2 shrink-0"></div>
                    <p className="text-sm leading-relaxed text-emerald-50">{insight}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-emerald-200">لا توجد رؤى كافية حالياً. ابدأ باستقبال الطلبات لتفعيل الذكاء الاصطناعي.</p>
              )}
            </div>

            <button 
              onClick={fetchInsights}
              className="mt-8 w-full bg-white text-emerald-900 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              <TrendingUp size={18} />
              تحديث التحليلات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
