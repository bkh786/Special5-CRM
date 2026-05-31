'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface LeadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const SUBJECT_OPTIONS = ['English', 'Hindi', 'Maths', 'SST', 'Science'];

export default function LeadForm({ onSuccess, onCancel, initialData }: LeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // For multi-select
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    student_name: '',
    email_id: '',
    class: '',
    source: 'Website',
    status: 'Received'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        student_name: initialData.student_name || '',
        email_id: initialData.email_id || '',
        class: initialData.class || '',
        source: initialData.source || 'Website',
        status: initialData.status || 'Received'
      });
      if (initialData.phone) {
        let p = initialData.phone.toString();
        if (p.startsWith('+91')) { setCountryCode('+91'); setPhoneNumber(p.slice(3)); }
        else if (p.startsWith('+1')) { setCountryCode('+1'); setPhoneNumber(p.slice(2)); }
        else if (p.startsWith('+44')) { setCountryCode('+44'); setPhoneNumber(p.slice(3)); }
        else if (p.startsWith('+971')) { setCountryCode('+971'); setPhoneNumber(p.slice(4)); }
        else { setCountryCode('+91'); setPhoneNumber(p.replace(/\D/g, '')); }
      }
      if (initialData.subjects) {
        setSelectedSubjects(initialData.subjects.split(', '));
      }
    }
  }, [initialData]);

  // Watch class changes to update subjects
  useEffect(() => {
    if (!formData.class) {
      if (!initialData) setSelectedSubjects([]);
      return;
    }

    const classNum = parseInt(formData.class.replace('Class ', ''));
    if (classNum >= 1 && classNum <= 5) {
      // Auto-fill all subjects for primary
      setSelectedSubjects(['All Subjects']);
    } else {
      // Clear if moving from primary to secondary so they have to pick
      if (selectedSubjects.includes('All Subjects') && !initialData) {
         setSelectedSubjects([]);
      }
    }
  }, [formData.class]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.student_name || !phoneNumber || !formData.class || selectedSubjects.length === 0) {
      setError("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    const finalPhone = `${countryCode}${phoneNumber}`;

    try {
      if (initialData) {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            student_name: formData.student_name,
            phone: finalPhone,
            email_id: formData.email_id,
            class: formData.class,
            subjects: selectedSubjects.join(', '),
            source: formData.source,
            status: formData.status
          })
          .eq('lead_id', initialData.lead_id || initialData.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('leads')
          .insert([
            {
              student_name: formData.student_name,
              phone: finalPhone,
              email_id: formData.email_id,
              class: formData.class,
              subjects: selectedSubjects.join(', '),
              source: formData.source,
              status: formData.status
            }
          ]);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('Error adding lead:', err);
      setError(err.message || 'Failed to add lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPrimary = formData.class ? parseInt(formData.class.replace('Class ', '')) <= 5 : false;

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
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Lead {initialData ? 'Updated' : 'Added'} Successfully!</h3>
        <p style={{ color: '#64748b' }}>The lead has been recorded in the database.</p>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Student Name *</label>
          <input 
            type="text" 
            name="student_name" 
            required 
            placeholder="Enter full name" 
            className="input" 
            value={formData.student_name}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Phone Number *</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <select 
               className="input" 
               style={{ width: '90px', padding: '0.5rem' }} 
               value={countryCode} 
               onChange={(e) => setCountryCode(e.target.value)}
             >
               <option value="+91">+91 (IN)</option>
               <option value="+1">+1 (US)</option>
               <option value="+44">+44 (UK)</option>
               <option value="+971">+971 (AE)</option>
             </select>
             <input 
              type="tel" 
              required
              placeholder="9876543210" 
              className="input" 
              style={{ flex: 1 }}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g,''))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Email ID *</label>
          <input 
            type="email" 
            name="email_id" 
            required
            placeholder="student@example.com" 
            className="input" 
            value={formData.email_id}
            onChange={handleChange}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Grade / Class *</label>
          <select 
            name="class" 
            required
            className="input"
            style={{ width: '100%' }}
            value={formData.class}
            onChange={handleChange}
          >
             <option value="" disabled>Select Class</option>
             {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Subjects *</label>
        {isPrimary ? (
           <input 
             type="text" 
             className="input" 
             disabled 
             value="All Subjects" 
             style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
           />
        ) : formData.class ? (
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--input-border)', borderRadius: 'var(--radius)' }}>
              {SUBJECT_OPTIONS.map(subject => (
                <label key={subject} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.25rem 0.5rem', backgroundColor: selectedSubjects.includes(subject) ? '#e0e7ff' : '#f8fafc', border: `1px solid ${selectedSubjects.includes(subject) ? 'var(--primary)' : '#e2e8f0'}`, borderRadius: '4px' }}>
                   <input 
                     type="checkbox" 
                     checked={selectedSubjects.includes(subject)} 
                     onChange={() => handleSubjectToggle(subject)} 
                     style={{ display: 'none' }}
                   />
                   {subject}
                </label>
              ))}
           </div>
        ) : (
           <div style={{ fontSize: '0.875rem', color: '#94a3b8', padding: '0.5rem 0' }}>Please select a class first.</div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Inquiry Source</label>
        <select 
          name="source" 
          className="input" 
          style={{ width: '100%' }}
          value={formData.source}
          onChange={handleChange}
        >
          <option value="Website">Website</option>
          <option value="Reference">Reference</option>
          <option value="Social Media">Social Media</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Phone Call">Phone Call</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
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
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            initialData ? 'Save Changes' : 'Add Lead'
          )}
        </button>
      </div>
    </form>
  );
}
