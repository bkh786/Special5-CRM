'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

function LoginForm() {
  const { user, fetchUserProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(searchParams.get('message'));

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const dashboardPath = user.role.toLowerCase();
      router.push(`/${dashboardPath}/dashboard`);
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // 1. Sign in with Supabase Auth
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        } else if (signInError.message.includes('User not found')) {
          throw new Error('User not registered');
        }
        throw signInError;
      }

      if (authUser) {
        // 2. Fetch User Profile for role mapping
        const profile = await fetchUserProfile(authUser);
        if (!profile || !profile.role) {
          throw new Error('User role not assigned. Contact admin.');
        }

        // 3. Redirect to dashboard
        const dashboardPath = profile.role.toLowerCase();
        router.push(`/${dashboardPath}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/Special5-logo.png" alt="Special5 - Online Tuitions" style={{ height: '80px', objectFit: 'contain' }} />
        </div>
        <p style={{ 
          color: 'var(--muted)', 
          marginTop: '0.625rem', 
          fontSize: '0.9375rem', 
          fontWeight: '500',
          lineHeight: '1.4'
        }}>
          Small Batch Learning. Personal Attention. Better Results.
        </p>
      </div>

      {error && (
        <div style={{ 
          padding: '0.875rem', 
          backgroundColor: '#fef2f2', 
          color: '#b91c1c', 
          borderRadius: '10px', 
          fontSize: '0.8125rem', 
          marginBottom: '1.5rem',
          border: '1px solid #fee2e2',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          textAlign: 'left'
        }}>
          <AlertCircle size={16} />
          <span style={{ fontWeight: '500' }}>{error}</span>
        </div>
      )}
      {message && (
        <div style={{ 
          padding: '0.875rem', 
          backgroundColor: '#f0fdf4', 
          color: '#15803d', 
          borderRadius: '10px', 
          fontSize: '0.8125rem', 
          marginBottom: '1.5rem',
          border: '1px solid #dcfce7',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          textAlign: 'left'
        }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: '500' }}>{message}</span>
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'grid', gap: '1.25rem' }}>
        <div className="form-group text-left" style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail 
              size={18} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} 
            />
            <input 
              type="email" 
              required 
              className="input" 
              placeholder="you@special5.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '2.75rem' }} 
            />
          </div>
        </div>

        <div className="form-group" style={{ textAlign: 'left' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.5rem', display: 'block' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock 
              size={18} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} 
            />
            <input 
              type="password" 
              required 
              className="input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '2.75rem' }} 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary" 
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            padding: '0.875rem', 
            marginTop: '0.5rem',
            boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.3)'
          }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login to Dashboard'}
        </button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/forgot-password" 
          style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          Forgot Password?
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem',
    }}>
      <div className="card" style={{ 
        maxWidth: '440px', 
        width: '100%', 
        padding: '3.5rem 2.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        textAlign: 'center'
      }}>
        <Suspense fallback={<Loader2 className="animate-spin" size={32} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
