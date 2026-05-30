'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';

interface TeacherFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TeacherForm({ onSuccess, onCancel }: TeacherFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subjects: '',
    classes: '',
    experience: '',
    class_1_to_4_rate: '',
    class_5_to_8_rate: '',
    class_9_to_10_rate: '',
    working_status: 'Active',
    hiring_status: 'applied'
  });

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let teacherUuid = null;

      if (formData.hiring_status === 'selected') {
        const res = await fetch('/api/admin/create-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            role: 'TEACHER',
            details: {
              phone: `${countryCode}${phoneNumber}`,
              class_1_to_4_rate: formData.class_1_to_4_rate ? parseFloat(formData.class_1_to_4_rate) : 0,
              class_5_to_8_rate: formData.class_5_to_8_rate ? parseFloat(formData.class_5_to_8_rate) : 0,
              class_9_to_10_rate: formData.class_9_to_10_rate ? parseFloat(formData.class_9_to_10_rate) : 0
            }
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create teacher account');
        teacherUuid = data.user.id;
      } else {
        // Just insert as a lead/applied teacher without Auth account
        const { data: insertData, error: insertError } = await supabase
          .from('teachers')
          .insert([{
            name: formData.name,
            email: formData.email,
            phone: `${countryCode}${phoneNumber}`,
            subjects: formData.subjects,
            classes: formData.classes,
            experience: formData.experience,
            working_status: formData.hiring_status === 'selected' ? formData.working_status : 'Inactive',
            hiring_status: formData.hiring_status
          }])
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Also insert into rate card if we have rates (even if not hired yet)
        if (insertData && insertData.teacher_id) {
          await supabase.from('teachers_rate_card').insert([{
            teacher_id: insertData.teacher_id,
            class_1_to_4_rate: formData.class_1_to_4_rate ? parseFloat(formData.class_1_to_4_rate) : 0,
            class_5_to_8_rate: formData.class_5_to_8_rate ? parseFloat(formData.class_5_to_8_rate) : 0,
            class_9_to_10_rate: formData.class_9_to_10_rate ? parseFloat(formData.class_9_to_10_rate) : 0
          }]);
        }
      }

      // If hired, we might need to update the additional fields (though the API does some, let's ensure all are set)
      if (formData.hiring_status === 'selected' && teacherUuid) {
        await supabase.from('teachers').update({
          subjects: formData.subjects,
          classes: formData.classes,
          experience: formData.experience,
          working_status: formData.working_status,
          hiring_status: 'selected'
        }).eq('teacher_id', teacherUuid);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error hiring teacher:', err);
      setError(err.message || 'Failed to hire teacher. Please try again.');
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
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Teacher Hired!</h3>
        <p style={{ color: '#64748b' }}>Faculty member {formData.name} added successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          border: '1px solid #fee2e2',
          borderRadius: '8px',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#475569', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={18} /> Professional Details
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Full Name *</label>
            <input type="text" name="name" required className="input" placeholder="e.g. Dr. Priya Singh" value={formData.name} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Email *</label>
            <input type="email" name="email" required className="input" placeholder="priya@school.com" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Phone Number *</label>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
               <select 
                 className="input" 
                 style={{ width: '80px', padding: '0.5rem' }} 
                 value={countryCode} 
                 onChange={(e) => setCountryCode(e.target.value)}
               >
                 <option value="+91">+91</option>
                 <option value="+1">+1</option>
                 <option value="+44">+44</option>
                 <option value="+971">+971</option>
               </select>
               <input 
                 type="tel" 
                 required 
                 className="input" 
                 style={{ flex: 1 }}
                 placeholder="9876543210" 
                 value={phoneNumber} 
                 onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g,''))} 
               />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Subjects *</label>
            <input type="text" name="subjects" required className="input" placeholder="e.g. Math, JEE Physics" value={formData.subjects} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Classes Taught</label>
            <input type="text" name="classes" className="input" placeholder="e.g. Class 10, 11, 12" value={formData.classes} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Experience</label>
            <input type="text" name="experience" className="input" placeholder="e.g. 5 years" value={formData.experience} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Class 1-4 Rate (₹)</label>
            <input type="number" name="class_1_to_4_rate" className="input" placeholder="e.g. 500" value={formData.class_1_to_4_rate} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Class 5-8 Rate (₹)</label>
            <input type="number" name="class_5_to_8_rate" className="input" placeholder="e.g. 700" value={formData.class_5_to_8_rate} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Class 9-10 Rate (₹)</label>
            <input type="number" name="class_9_to_10_rate" className="input" placeholder="e.g. 1000" value={formData.class_9_to_10_rate} onChange={handleChange} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Hiring Status</label>
            <select name="hiring_status" className="input" style={{ width: '100%' }} value={formData.hiring_status} onChange={handleChange}>
              <option value="applied">Applied</option>
              <option value="reviewed">Reviewed</option>
              <option value="selected">Selected (Create Account)</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Working Status</label>
            <select name="working_status" className="input" style={{ width: '100%' }} value={formData.working_status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Hiring'}
        </button>
      </div>
    </form>
  );
}
