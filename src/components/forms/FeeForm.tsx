'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle, AlertCircle, CreditCard, DollarSign } from 'lucide-react';

interface FeeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function FeeForm({ onSuccess, onCancel }: FeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Generate next 12 months dynamically
  const generatedMonths = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
        const optionDate = new Date(date.getFullYear(), date.getMonth() + i, 1);
        const monthStr = optionDate.toLocaleString('default', { month: 'short' });
        const yearStr = optionDate.getFullYear().toString().slice(-2);
        list.push(`${monthStr}-${yearStr}`);
    }
    return list;
  }, []);

  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_mode: 'UPI',
    payment_date: new Date().toISOString().split('T')[0],
    month: generatedMonths[0],
    paid: true
  });

  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase.from('students').select('student_id, name, class');
      if (data) setStudents(data);
    }
    fetchStudents();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.student_id || !formData.amount || !formData.month || !formData.payment_date) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('fees')
        .insert([
          {
            student_id: formData.student_id || null,
            amount: formData.amount ? parseFloat(formData.amount) : null,
            payment_mode: formData.payment_mode,
            payment_date: formData.payment_date,
            month: formData.month,
            paid: formData.paid
          }
        ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error logging payment:', err);
      setError(err.message || 'Failed to record payment. Please check entry.');
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
          backgroundColor: '#ecfdf5',
          color: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <CheckCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Payment Recorded!</h3>
        <p style={{ color: '#64748b' }}>The transaction has been successfully logged.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreditCard size={18} /> Payment Information
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Select Student *</label>
            <select name="student_id" required className="input" style={{ width: '100%' }} value={formData.student_id} onChange={handleChange}>
              <option value="" disabled>Choose Student...</option>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>{s.name} – {s.class}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Amount (₹) *</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input type="number" name="amount" required className="input" style={{ paddingLeft: '2rem' }} placeholder="e.g. 3000" value={formData.amount} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Month *</label>
            <select name="month" required className="input" style={{ width: '100%' }} value={formData.month} onChange={handleChange}>
               <option value="" disabled>Select Month</option>
               {generatedMonths.map(m => (
                 <option key={m} value={m}>{m}</option>
               ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Payment Date *</label>
            <input type="date" name="payment_date" required className="input" value={formData.payment_date} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>Payment Mode</label>
            <select name="payment_mode" className="input" style={{ width: '100%' }} value={formData.payment_mode} onChange={handleChange}>
              <option value="UPI">UPI (GPay / PhonePe)</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card Payment</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="col-span-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="paid"
              name="paid"
              checked={formData.paid}
              onChange={handleChange}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="paid" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Mark as Paid</label>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log Payment'}
        </button>
      </div>
    </form>
  );
}
