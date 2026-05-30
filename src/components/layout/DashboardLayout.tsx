'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Calendar, 
  Search, 
  Bell, 
  LogOut,
  Menu,
  X,
  CreditCard,
  MessageSquare,
  FileText,
  BarChart3,
  BookOpen,
  Loader2,
  Settings,
  Star,
  User,
  ClipboardList,
  Upload
} from 'lucide-react';

const ADMIN_LINKS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/leads', icon: Search, label: 'Leads' },
  { href: '/admin/students', icon: GraduationCap, label: 'Students' },
  { href: '/admin/teachers', icon: Users, label: 'Teachers' },
  { href: '/admin/batches', icon: BookOpen, label: 'Batches' },
  { href: '/admin/fees', icon: CreditCard, label: 'Fees' },
  { href: '/admin/confirm-payments', icon: Search, label: 'Confirm Payments' },
  { href: '/admin/teacher-performance', icon: Star, label: 'Teacher Performance' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const TEACHER_LINKS = [
  { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/teacher/batches', icon: BookOpen, label: 'My Classes' },
  { href: '/teacher/attendance', icon: Calendar, label: 'Attendance' },
  { href: '/teacher/class-update', icon: Upload, label: 'Class Update' },
  { href: '/teacher/assessments', icon: FileText, label: 'Assessments' },
  { href: '/teacher/performance', icon: BarChart3, label: 'Student Performance' },
  { href: '/teacher/earnings', icon: CreditCard, label: 'Earnings' },
  { href: '/teacher/profile', icon: User, label: 'Profile' },
];

const STUDENT_LINKS = [
  { href: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/student/classes', icon: BookOpen, label: 'My Classes' },
  { href: '/student/attendance', icon: Calendar, label: 'Attendance' },
  { href: '/student/class-update', icon: ClipboardList, label: 'Class Update' },
  { href: '/student/performance', icon: BarChart3, label: 'Performance' },
  { href: '/student/fees', icon: CreditCard, label: 'Fees' },
  { href: '/student/rating', icon: Star, label: 'Teacher Rating' },
  { href: '/student/profile', icon: User, label: 'Profile' }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Protection is now primarily handled by middleware.ts
  if (isLoading || !user) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--background)' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          <p style={{ marginTop: '1rem', color: 'var(--muted)', fontWeight: '500' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const links = user.role.toUpperCase() === 'ADMIN' ? ADMIN_LINKS : user.role.toUpperCase() === 'TEACHER' ? TEACHER_LINKS : STUDENT_LINKS;

  return (
    <div className="dashboard-container">
      {/* Sidebar - Desktop & Mobile via classes */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/Special5-logo.png" alt="Special5 - Online Tuitions Logo" style={{ maxWidth: '180px', maxHeight: '60px', objectFit: 'contain' }} />
          {/* Close button for mobile */}
          <button 
            className="hideDesktop"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ marginLeft: 'auto', display: 'none' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => {
                  router.push(link.href);
                  setIsMobileMenuOpen(false);
                }}
                className="btn"
                style={{ 
                  justifyContent: 'flex-start',
                  backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--muted)',
                  width: '100%',
                  padding: '0.75rem 1rem'
                }}
              >
                <Icon size={20} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--sidebar-border)' }}>
          <button 
            onClick={logout}
            className="btn" 
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--destructive)', gap: '0.75rem' }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header */}
        <header style={{ 
          height: '64px', 
          backgroundColor: 'white', 
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="hideDesktop"
            style={{ border: '1px solid var(--card-border)', padding: '0.25rem', borderRadius: '4px' }}
          >
            <Menu size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
            <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
              <Bell size={20} />
            </button>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{user.role}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--secondary)', overflow: 'hidden' }}>
              <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt="user" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 35, backgroundColor: 'rgba(0,0,0,0.5)' }} 
          className="hideDesktop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Custom Styles for this specific layout fix */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 1024px) {
          .hideDesktop { display: none !important; }
        }
        @media (max-width: 1023px) {
          .hideDesktop { display: block !important; }
        }
      `}} />
    </div>
  );
}
