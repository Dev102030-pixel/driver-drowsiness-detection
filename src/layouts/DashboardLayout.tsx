import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, LogOut, LayoutDashboard, FileText } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function DashboardLayout() {
  const navigate = useNavigate();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = session.role === 'admin' 
    ? [{ to: '/admin/reports', icon: FileText, label: 'All Reports' }]
    : [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Live Monitor' },
        { to: '/reports', icon: FileText, label: 'My Reports' },
      ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 shadow-lg shadow-sky-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Guardian Vision</h1>
            <p className="text-xs font-medium text-slate-500 capitalize">{session.role} Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                twMerge(
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 px-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Logged in as</p>
            <p className="truncate text-sm font-semibold text-slate-900">{session.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
