import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const salesData = [
  { name: 'يناير', sales: 4000, orders: 240 },
  { name: 'فبراير', sales: 3000, orders: 198 },
  { name: 'مارس', sales: 2000, orders: 150 },
  { name: 'أبريل', sales: 2780, orders: 210 },
  { name: 'مايو', sales: 1890, orders: 140 },
  { name: 'يونيو', sales: 2390, orders: 180 },
];

const categoryData = [
  { name: 'قهوة', value: 400 },
  { name: 'تمور', value: 300 },
  { name: 'حلويات', value: 300 },
  { name: 'أخرى', value: 200 },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">التحليلات</h2>
          <p className="text-gray-400 text-sm mt-1">تقارير مفصلة عن أداء مبيعاتك ونمو متجرك.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-100 px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={18} />
            تصدير التقرير
          </button>
          <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">
            <Calendar size={18} />
            آخر 30 يوم
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">معدل التحويل</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black">64.2%</h3>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              +12%
            </div>
          </div>
          <div className="w-full bg-gray-50 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-emerald-500 h-full w-[64%] rounded-full"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">متوسط قيمة الطلب</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black">185 <span className="text-lg font-bold text-gray-400">ر.س</span></h3>
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              +5%
            </div>
          </div>
          <div className="w-full bg-gray-50 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-blue-500 h-full w-[45%] rounded-full"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">معدل الارتداد</p>
          <div className="flex items-end justify-between">
            <h3 className="text-4xl font-black">12.5%</h3>
            <div className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg">
              <TrendingDown size={14} />
              -2%
            </div>
          </div>
          <div className="w-full bg-gray-50 h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-red-500 h-full w-[12%] rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Sales */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black mb-8">المبيعات الشهرية</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black mb-8">توزيع الفئات</h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4 pr-8">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-sm font-bold text-gray-600">{item.name}</span>
                  <span className="text-xs text-gray-400">{((item.value / 1200) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
