'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { GraduationCap, Lock, Loader2, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      setSuccess(true);
      
      // Delay redirect to show success message
      setTimeout(() => {
        router.push('/login?message=Password%20reset%20successful.%20Please%20login.');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        textAlign: 'center'
      }}>
        {/* Branding Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            backgroundColor: 'var(--primary)', 
            borderRadius: '14px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'white'
          }}>
            <GraduationCap size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Set New Password</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Secure your account with a new password.
          </p>
        </div>

        {success ? (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#f0fdf4', 
              color: '#15803d', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Success!</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '1.25rem' }}>
            {error && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: '#fef2f2', 
                color: '#b91c1c', 
                borderRadius: '8px', 
                fontSize: '0.8125rem',
                border: '1px solid #fee2e2',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textAlign: 'left'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.50rem', display: 'block' }}>New Password</label>
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
                  min={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }} 
                />
              </div>
            </div>

            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.50rem', display: 'block' }}>Confirm New Password</label>
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
                  min={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
