import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Bell, 
  Lock, 
  Globe, 
  Smartphone, 
  CreditCard,
  Save,
  MessageSquare,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

const Settings: React.FC = () => {
  const { merchant } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'whatsapp', label: 'ربط واتساب', icon: MessageSquare },
    { id: 'ai', label: 'إعدادات الذكاء الاصطناعي', icon: Bot },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Lock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black tracking-tight">الإعدادات</h2>
        <p className="text-gray-400 text-sm mt-1">إدارة حسابك، ربط واتساب، وتخصيص تجربة الذكاء الاصطناعي.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                  : "bg-white text-gray-500 hover:bg-gray-50"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm">
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex items-center justify-center text-gray-400 border-4 border-white shadow-xl">
                  <User size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-black">{merchant?.name || 'اسم المتجر'}</h3>
                  <p className="text-gray-400 text-sm">تحديث صورة المتجر والمعلومات الأساسية.</p>
                  <button className="mt-2 text-emerald-600 text-xs font-bold hover:underline">تغيير الصورة</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">اسم المتجر</label>
                  <input 
                    type="text" 
                    defaultValue={merchant?.name}
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">البريد الإلكتروني</label>
                  <input 
                    type="email" 
                    defaultValue="admin@mada.sa"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">رقم الضريبة</label>
                  <input 
                    type="text" 
                    defaultValue={merchant?.vat_number}
                    placeholder="300000000000003"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 mr-2">رقم الجوال</label>
                  <input 
                    type="text" 
                    defaultValue="+966 50 000 0000"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex justify-end">
                <button className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2">
                  <Save size={18} />
                  حفظ التغييرات
                </button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-8">
              <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-900">حالة الربط: متصل</h3>
                  <p className="text-emerald-700 text-sm">متجرك مرتبط حالياً برقم +966 50 000 0000</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-black">إعدادات الرد الآلي</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                    <div>
                      <p className="font-bold text-sm">تفعيل الرد الآلي</p>
                      <p className="text-xs text-gray-400">السماح للذكاء الاصطناعي بالرد على استفسارات العملاء.</p>
                    </div>
                    <div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full translate-x-6 transition-all"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                    <div>
                      <p className="font-bold text-sm">تحويل المحادثات البشرية</p>
                      <p className="text-xs text-gray-400">تنبيهك عند رغبة العميل في التحدث مع شخص حقيقي.</p>
                    </div>
                    <div className="w-12 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full translate-x-6 transition-all"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-lg font-black">شخصية المساعد الذكي</h4>
                <p className="text-gray-400 text-sm">حدد كيف يتفاعل الذكاء الاصطناعي مع عملائك.</p>
                <textarea 
                  className="w-full bg-gray-50 border-none rounded-3xl py-5 px-6 text-sm min-h-[150px] focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="مثال: أنت مساعد مبيعات ودود لمتجر قهوة مختصة. استخدم لهجة سعودية بيضاء ورحب بالعملاء دائماً..."
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-black">قواعد العمل</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="font-bold text-sm mb-2">الحد الأدنى للطلب</p>
                    <input type="number" defaultValue="50" className="w-full bg-white border-none rounded-xl py-2 px-4 text-sm" />
                  </div>
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <p className="font-bold text-sm mb-2">تكلفة التوصيل</p>
                    <input type="number" defaultValue="25" className="w-full bg-white border-none rounded-xl py-2 px-4 text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
