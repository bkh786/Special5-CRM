'use client';

import React, { useState } from 'react';
import { Loader2, UserCheck, Mail, Phone, Briefcase, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

interface HiringConfirmationFormProps {
  teacher: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HiringConfirmationForm({ teacher, onSuccess, onCancel }: HiringConfirmationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rate1to4, setRate1to4] = useState('');
  const [rate5to8, setRate5to8] = useState('');
  const [rate9to10, setRate9to10] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: teacher.email,
          name: teacher.name,
          role: 'TEACHER',
          details: {
            phone: teacher.phone,
            class_1_to_4_rate: rate1to4 ? parseFloat(rate1to4) : 0,
            class_5_to_8_rate: rate5to8 ? parseFloat(rate5to8) : 0,
            class_9_to_10_rate: rate9to10 ? parseFloat(rate9to10) : 0
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to hire teacher');

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      console.error('Error hiring teacher:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: '#f0fdf4', 
          color: '#16a34a', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1rem' 
        }}>
          <CheckCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Success!</h3>
        <p style={{ color: '#64748b' }}>{teacher.name} has been hired and their account is ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Teacher Profile Preview */}
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f8fafc', 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#e0e7ff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#4f46e5'
          }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>{teacher.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Mail size={14} /> {teacher.email}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Phone</label>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={14} /> {teacher.phone || 'N/A'}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Subjects</label>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Briefcase size={14} /> {teacher.subjects || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>Per Student Pass-On Fee (₹)</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="rate1to4" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Class 1 to 4</label>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                id="rate1to4" type="number" required placeholder="0" className="input" 
                style={{ paddingLeft: '1.75rem', fontSize: '0.875rem' }}
                value={rate1to4} onChange={(e) => setRate1to4(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="rate5to8" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Class 5 to 8</label>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                id="rate5to8" type="number" required placeholder="0" className="input" 
                style={{ paddingLeft: '1.75rem', fontSize: '0.875rem' }}
                value={rate5to8} onChange={(e) => setRate5to8(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="rate9to10" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Class 9 to 10</label>
            <div style={{ position: 'relative', marginTop: '0.25rem' }}>
              <DollarSign size={14} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                id="rate9to10" type="number" required placeholder="0" className="input" 
                style={{ paddingLeft: '1.75rem', fontSize: '0.875rem' }}
                value={rate9to10} onChange={(e) => setRate9to10(e.target.value)}
              />
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Please confirm the per-student segment-wise remuneration for this faculty member.</p>
      </div>

      {error && (
        <div style={{ 
          padding: '0.75rem', 
          backgroundColor: '#fef2f2', 
          color: '#b91c1c', 
          borderRadius: '8px', 
          fontSize: '0.875rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          border: '1px solid #fee2e2'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button 
          type="button" 
          onClick={onCancel} 
          className="btn btn-secondary" 
          style={{ flex: 1 }}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ flex: 2, backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : (
            <>
              <UserCheck size={20} />
              Confirm & Hire
            </>
          )}
        </button>
      </div>
    </form>
  );
}
