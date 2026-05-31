import React, { useState, useEffect } from 'react';
import { Loader2, Users, Calendar, CreditCard, BookOpen, CheckCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface LeadConversionFormProps {
  lead: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function LeadConversionForm({ lead, onSuccess, onCancel }: LeadConversionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState('');
  
  const [batches, setBatches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    dateOfJoining: new Date().toISOString().split('T')[0],
    batchId: '',
    feesPlan: 'monthly',
    monthly_fee: '',
    subjects: lead.subjects || '',
    email: lead.email_id || ''
  });

  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/admin/batches');
        const data = await res.json();
        if (res.ok) setBatches(data);
      } catch(err) {
        console.error(err);
      }
    }
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError(null);

    try {
      // 1. Call API to create Auth Account and write to Students table
      const finalEmail = formData.email || `${lead.student_name.replace(/\s+/g, '').toLowerCase()}${Math.floor(Math.random() * 1000)}@student.com`;
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail,
          name: lead.student_name,
          role: 'STUDENT',
          details: {
            class: lead.class,
            phone: lead.phone,
            enrollment_date: formData.dateOfJoining,
            batchId: formData.batchId,
            batchName: batches.find(b => b.batch_id === formData.batchId)?.name,
            fees: formData.monthly_fee ? parseFloat(formData.monthly_fee) : 0
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student account');

      // 2. Add Fees plan if required
      if (formData.feesPlan && formData.batchId) {
        // Find batch to pull amount
        const batch = batches.find(b => b.batch_id === formData.batchId);
        if (batch) {
          const { error: feeError } = await supabase.from('fees').insert([{
            student_id: data.user.id,
            batch_id: batch.batch_id,
            amount: formData.monthly_fee ? parseFloat(formData.monthly_fee) : (batch.monthly_fee || 0),
            paid: false,
            due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // Due next month
            month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
          }]);
          if (feeError) console.error('Fee insertion failed:', feeError);
        }
      }

      // 3. Update Lead Status
      const { error: leadError } = await supabase.from('leads').update({ status: 'Converted' }).eq('lead_id', lead.lead_id || lead.id);
      if (leadError) throw new Error(`Lead update failed: ${leadError.message}`);

      // 4. Send WhatsApp Welcome Message
      if (lead.phone) {
        const phoneStr = lead.phone.toString().replace(/\D/g, '');
        const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
        const batchDetails = batches.find(b => b.batch_id === formData.batchId);
        
        const message = `Hello *${lead.student_name}*,

Welcome to *Special5 Online Tuitions*! 🎉

We are delighted to have you onboard with us. Your enrollment has been successfully completed and your student account has been created.

📚 *Student Details*

• Student Name: ${lead.student_name}
• Class Registered For: ${lead.class}
• Batch Timing: ${batchDetails?.timing || 'TBD'}
• Monthly Fee: ₹${formData.monthly_fee}
• Fee Plan: ${formData.feesPlan}
• Date of Onboarding: ${formData.dateOfJoining}
• Subjects: ${formData.subjects}

🔐 *CRM Login Details*

• User ID: ${finalEmail}
• Password: Special5@1234

🌐 CRM Login URL: https://crm.special5.in/

We look forward to being a part of your academic journey and helping you achieve your learning goals.

*Thank You!*
*Special5 Online Tuitions*`;

        setWhatsappLink(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setError(err.message || 'An error occurred during conversion');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          backgroundColor: '#ecfdf5',
          color: '#10b981',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <CheckCircle size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Student Onboarded!</h3>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>{lead.student_name} has been successfully converted into a student.</p>
        
        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          {whatsappLink && (
            <button 
              onClick={() => {
                window.open(whatsappLink, '_blank');
                onSuccess();
              }} 
              className="btn" 
              style={{ flex: 1, backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <MessageCircle size={18} /> Send Onboarding Message
            </button>
          )}
          <button 
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
        <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Date of Joining</label>
          <div style={{ position: 'relative' }}>
            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="date" 
              required
              className="input" 
              value={formData.dateOfJoining}
              onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Assign Batch</label>
          <div style={{ position: 'relative' }}>
            <Users size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <select 
              className="input" 
              required
              value={formData.batchId}
              onChange={(e) => setFormData({...formData, batchId: e.target.value})}
              style={{ paddingLeft: '2.5rem', appearance: 'none' }}
            >
              <option value="" disabled>Select a Batch</option>
              {batches.map(b => {
                const studentCount = b.batch_students?.[0]?.count || 0;
                const isFull = studentCount >= (b.max_students || 5);
                return (
                  <option key={b.batch_id} value={b.batch_id} disabled={isFull}>
                    {b.name} ({b.teachers?.name || 'No Teacher'}) {isFull ? '[FULL - No bandwidth]' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group col-span-2">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Email ID *</label>
          <input 
            type="email" 
            required
            className="input" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="student@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Fees Plan</label>
          <div style={{ position: 'relative' }}>
            <CreditCard size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <select 
              className="input" 
              value={formData.feesPlan}
              onChange={(e) => setFormData({...formData, feesPlan: e.target.value})}
              style={{ paddingLeft: '2.5rem', appearance: 'none' }}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly (Lump Sum)</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Monthly Fee (₹) *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontWeight: '600', fontSize: '0.9rem' }}>₹</span>
            <input 
              type="number" 
              required
              min="0"
              className="input" 
              placeholder="e.g. 3000"
              value={formData.monthly_fee}
              onChange={(e) => setFormData({...formData, monthly_fee: e.target.value})}
              style={{ paddingLeft: '2rem' }}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>Subjects</label>
        <div style={{ position: 'relative' }}>
          <BookOpen size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            readOnly
            className="input" 
            value={formData.subjects}
            style={{ paddingLeft: '2.5rem', backgroundColor: 'var(--secondary)' }}
          />
        </div>
      </div>

      <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: '500', marginBottom: '0.5rem' }}>
          System Automation Active:
        </p>
        <ul style={{ fontSize: '0.75rem', color: '#1e3a8a', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>✔ A secure login account will be created as a <strong>STUDENT</strong>.</li>
          <li>✔ The default password <code>Special5@1234</code> will be assigned.</li>
          <li>✔ An onboarding email will dispatch to {lead.email || 'the provided address'}.</li>
          <li>✔ The Lead will map sequentially into the Students & Batches tables.</li>
        </ul>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : 'Confirm & Convert'}
        </button>
      </div>
    </form>
  );
}
