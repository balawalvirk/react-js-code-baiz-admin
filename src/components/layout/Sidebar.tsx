'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Briefcase, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Logo from '../../../public/logo.png';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/careers', label: 'Careers', icon: Briefcase },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/login');
      toast.success('Signed out');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavContent = () => (
    <>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors ${
              isActive(href)
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>

      {/* User / Sign Out */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Image alt="logo" src={Logo} width={30} height={30} />
            <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
          </div>
        </div>
        <NavContent />
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Image alt="logo" src={Logo} width={26} height={26} />
          <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-white flex flex-col h-full shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image alt="logo" src={Logo} width={28} height={28} />
                <span className="font-semibold text-gray-900 text-sm">Admin Panel</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}