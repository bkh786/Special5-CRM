'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle, AlertCircle, Briefcase, MessageCircle } from 'lucide-react';

interface TeacherFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TeacherForm({ onSuccess, onCancel }: TeacherFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');

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
    if (loading) return; // Prevent double submission

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

      // If hired, we might need to update the additional fields
      if (formData.hiring_status === 'selected' && teacherUuid) {
        await supabase.from('teachers').update({
          subjects: formData.subjects,
          classes: formData.classes,
          experience: formData.experience,
          working_status: formData.working_status,
          hiring_status: 'selected'
        }).eq('teacher_id', teacherUuid);

        // Send WhatsApp Welcome Message
        const phoneStr = phoneNumber.replace(/\D/g, '');
        const formattedPhone = `${countryCode.replace('+', '')}${phoneStr}`;
        
        const message = `Hello *${formData.name}*,

Welcome to *Special5 Online Tuitions*! 🎉

We are pleased to welcome you to our teaching team. Your profile has been successfully onboarded and your teacher account has been created.

👨‍🏫 *Teacher Details*

• Teacher Name: ${formData.name}
• Subjects Assigned: ${formData.subjects}

💰 *Per Student Pass-On Fee*

• Class 1–4: ₹${formData.class_1_to_4_rate || 0}
• Class 5–8: ₹${formData.class_5_to_8_rate || 0}
• Class 9–10: ₹${formData.class_9_to_10_rate || 0}

🔐 *CRM Login Details*

• Login ID: ${formData.email}
• Password: Special5@1234

🌐 CRM Login URL: https://crm.special5.in/

We look forward to working together to deliver high-quality learning experiences to our students.

*Thank You!*
*Special5 Online Tuitions*`;

        setWhatsappLink(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error hiring teacher:', err);
      setError(err.message || 'Failed to hire teacher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <CheckCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Teacher Hired!</h3>
          <p style={{ color: '#64748b' }}>Faculty member {formData.name} added successfully.</p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: '600', color: '#334155', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Teacher Details</h4>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div><span style={{ color: '#64748b' }}>Name:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{formData.name}</span></div>
            <div><span style={{ color: '#64748b' }}>Subjects:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{formData.subjects || 'N/A'}</span></div>
            <div><span style={{ color: '#64748b' }}>Classes:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{formData.classes || 'N/A'}</span></div>
          </div>

          <h4 style={{ fontWeight: '600', color: '#334155', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Per Student Pass-On Fee</h4>
          <div className="grid grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div><span style={{ color: '#64748b' }}>Class 1-4:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{formData.class_1_to_4_rate || 0}</span></div>
            <div><span style={{ color: '#64748b' }}>Class 5-8:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{formData.class_5_to_8_rate || 0}</span></div>
            <div><span style={{ color: '#64748b' }}>Class 9-10:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>₹{formData.class_9_to_10_rate || 0}</span></div>
          </div>

          <h4 style={{ fontWeight: '600', color: '#334155', marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>Login Credentials</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div><span style={{ color: '#64748b' }}>Login URL:</span> <a href="https://crm.special5.in/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: '500' }}>https://crm.special5.in/</a></div>
            <div><span style={{ color: '#64748b' }}>User ID / Email:</span> <span style={{ fontWeight: '500', color: '#0f172a' }}>{formData.email}</span></div>
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
              <MessageCircle size={18} /> Send Onboarding Message
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
