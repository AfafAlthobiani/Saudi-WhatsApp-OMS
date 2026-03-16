import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
        : "text-gray-500 hover:bg-gray-50 hover:text-emerald-600"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout: React.FC = () => {
  const location = useLocation();
  const { merchant } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => supabase.auth.signOut();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "الرئيسية" },
    { to: "/orders", icon: ShoppingCart, label: "الطلبات" },
    { to: "/products", icon: Package, label: "المنتجات" },
    { to: "/billing", icon: CreditCard, label: "الفواتير والرصيد" },
    { to: "/settings", icon: Settings, label: "الإعدادات" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]" dir="rtl">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-white border-l border-gray-100 transition-transform duration-300 lg:translate-x-0 lg:static",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <ShoppingCart className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">مدى OMS</h1>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to} 
              />
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-50">
            <div className="bg-emerald-50 p-4 rounded-2xl mb-4">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">رصيدك الحالي</p>
              <p className="text-xl font-black text-emerald-700">{merchant?.credits || 0} <span className="text-xs font-medium">ريال</span></p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <button 
            className="lg:hidden p-2 text-gray-500"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>

          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن طلب، عميل..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pr-12 pl-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-emerald-600 transition-colors relative">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-[1px] bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold">{merchant?.name || "تاجر مدى"}</p>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">متصل الآن</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://ui-avatars.com/api/?name=${merchant?.name || 'M'}&background=ecfdf5&color=059669`} 
                  alt="Avatar" 
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
