'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { CreditCard, QrCode, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';
import ActionModal from '@/components/common/ActionModal';

export default function StudentFeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFee, setActiveFee] = useState<any>(null);
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFees() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase.from('fees').select('*').eq('student_id', user.id).order('created_at', { ascending: false });
      if (data) setFees(data);
      setLoading(false);
    }
    loadFees();
  }, [user]);

  const handlePayRequest = (fee: any) => {
    setActiveFee(fee);
    setIsModalOpen(true);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || !activeFee) return;

    setSubmitting(true);
    await supabase.from('fees').update({ status: 'Processing', pending_transaction_id: utr }).eq('fee_id', activeFee.fee_id);

    setSubmitting(false);
    setIsModalOpen(false);
    setActiveFee(null);
    setUtr('');

    // Refresh
    const { data } = await supabase.from('fees').select('*').eq('student_id', user?.id).order('created_at', { ascending: false });
    if (data) setFees(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Fee Ledger & Payments</h1>
        <p style={{ color: 'var(--muted)' }}>Manage your invoices, scan QR for UPI payment, and upload UTRs for confirmation.</p>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Pay Fee - ${activeFee?.month} ${activeFee?.year}`}
        description="Scan the Admin UPI QR Code using PhonePe/GPay/Paytm, complete the transaction, and upload the 12-digit UTR below."
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
          
          <div style={{ padding: '1rem', border: '2px dashed var(--primary)', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
             <QrCode size={120} color="var(--primary)" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: '700', fontSize: '1.125rem' }}>Amount: ₹{activeFee?.amount}</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>UPI ID: admin.special5@upi</p>
          </div>

          <form onSubmit={handleSubmitUtr} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: '600' }}>12-Digit UTR / Reference No</label>
              <input 
                 type="text" 
                 className="input" 
                 placeholder="e.g. 312345678901" 
                 required 
                 value={utr}
                 onChange={(e) => setUtr(e.target.value)}
                 style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: '600' }}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? <Loader2 className="animate-spin" /> : <><Upload size={18} /> Confirm Payment Upload</>}
            </button>
          </form>

        </div>
      </ActionModal>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} /></div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Billing Cycle</th>
                  <th>Amount Due</th>
                  <th>Status Workflow</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee.fee_id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{fee.month} {fee.year}</div>
                    </td>
                    <td style={{ fontWeight: '700' }}>₹{fee.amount}</td>
                    <td>
                      {fee.status === 'Paid' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '600', width: 'fit-content' }}>
                           <CheckCircle size={14} /> Confirmed Paid
                        </span>
                      ) : fee.status === 'Processing' ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', backgroundColor: '#fff7ed', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '600', width: 'fit-content' }}>
                           <Clock size={14} /> Admin Reviewing UTR
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', backgroundColor: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '600', width: 'fit-content' }}>
                           Pending Payment
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{fee.admin_remarks || 'System auto-generated invoice.'}</td>
                    <td>
                      {fee.status === 'Pending' && (
                        <button onClick={() => handlePayRequest(fee)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                          <CreditCard size={14} /> Pay Now
                        </button>
                      )}
                      {fee.status !== 'Pending' && (
                        <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
                {fees.length === 0 && (
                   <tr>
                     <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Your fee ledger is completely clear. No invoices tracked.</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
