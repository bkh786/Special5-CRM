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
    } catch (err: any) {
      console.error('Error hiring teacher:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const phoneStr = teacher.phone ? teacher.phone.toString().replace(/\D/g, '') : '';
    const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
    
    const message = `Hello *${teacher.name}*,

Welcome to *Special5 Online Tuitions*! 🎉

Your faculty account has been successfully created.

🔐 *CRM Login Details*

• User ID: ${teacher.email}
• Password: Special5@1234

🌐 CRM Login URL: https://crm.special5.in/

We look forward to a great teaching journey together!

*Thank You!*
*Special5 Online Tuitions*`;

    const whatsappLink = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}` : '';

    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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

        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: '600', color: '#334155', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Teacher Details</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div><span style={{ color: '#64748b' }}>Name:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{teacher.name}</span></div>
            <div><span style={{ color: '#64748b' }}>Subjects:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{teacher.subjects || 'N/A'}</span></div>
          </div>

          <h4 style={{ fontWeight: '600', color: '#334155', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Per Student Pass-On Fee</h4>
          <div className="grid grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div><span style={{ color: '#64748b' }}>Class 1-4:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{rate1to4 || 0}</span></div>
            <div><span style={{ color: '#64748b' }}>Class 5-8:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{rate5to8 || 0}</span></div>
            <div><span style={{ color: '#64748b' }}>Class 9-10:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{rate9to10 || 0}</span></div>
          </div>

          <h4 style={{ fontWeight: '600', color: '#334155', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Login Credentials</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div><span style={{ color: '#64748b' }}>Login URL:</span> <a href="https://crm.special5.in/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: '500' }}>https://crm.special5.in/</a></div>
            <div><span style={{ color: '#64748b' }}>User ID / Email:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{teacher.email}</span></div>
            <div><span style={{ color: '#64748b' }}>Password:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>Special5@1234</span></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          {whatsappLink && (
            <a 
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onSuccess} 
              className="btn" 
              style={{ flex: 1, backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <Phone size={18} /> Send Onboarding Message
            </a>
          )}
          <button 
            type="button"
            onClick={onSuccess} 
            className="btn btn-secondary" 
            style={{ flex: whatsappLink ? 0.4 : 1 }}
          >
            Ignore
          </button>
        </div>
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
