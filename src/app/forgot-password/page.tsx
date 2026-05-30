'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { GraduationCap, Mail, Loader2, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setSubmitted(true);
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Password Recovery</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div style={{ padding: '2rem 0' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              backgroundColor: '#ecfdf5', 
              color: '#059669', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Check Your Email</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              We've sent a password reset link to <strong>{email}</strong>.
            </p>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/login" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'grid', gap: '1.5rem' }}>
            {error && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: '#fef2f2', 
                color: '#b91c1c', 
                borderRadius: '8px', 
                fontSize: '0.8125rem',
                border: '1px solid #fee2e2',
                textAlign: 'left'
              }}>
                {error}
              </div>
            )}
            
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.50rem', display: 'block' }}>Email Address</label>
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

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.875rem', gap: '0.5rem' }}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              {!loading && <ChevronRight size={18} />}
            </button>

            <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)', fontWeight: '600', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              Return to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
