'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { CheckCircle2, XCircle, Search, RefreshCw, CreditCard, Banknote } from 'lucide-react';
import ActionModal from '@/components/common/ActionModal';

export default function ConfirmPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [remark, setRemark] = useState('');
  
  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('fee_transactions')
      .select('*, students(name, class), fees(month, amount)')
      .order('created_at', { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTx) return;
    
    // Update Transaction
    await supabase.from('fee_transactions').update({
      status,
      remarks: remark || selectedTx.remarks
    }).eq('id', selectedTx.id);

    // Update Fees Log
    if (status === 'Confirmed') {
      await supabase.from('fees').update({
        paid: true,
        payment_mode: selectedTx.payment_mode,
        payment_date: new Date().toISOString(),
        admin_remarks: remark
      }).eq('fee_id', selectedTx.fee_id);
    } else if (status === 'Rejected') {
      await supabase.from('fees').update({
        paid: false,
        admin_remarks: remark
      }).eq('fee_id', selectedTx.fee_id);
    }

    setRemark('');
    setSelectedTx(null);
    fetchTransactions();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Confirm Payment Status</h1>
          <p style={{ color: 'var(--muted)' }}>Verify and approve parent UTR/UPI payment submissions.</p>
        </div>
        <button onClick={fetchTransactions} className="btn btn-secondary">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <ActionModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Verify Payment"
        description={`Review the transaction submitted by ${selectedTx?.students?.name}`}
      >
        {selectedTx && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Month</label>
                <div style={{ fontWeight: '500' }}>{selectedTx.fees?.month}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Amount</label>
                <div style={{ fontWeight: '700', color: '#10b981' }}>₹{selectedTx.amount}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Mode</label>
                <div style={{ fontWeight: '500' }}>{selectedTx.payment_mode || 'UPI'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>UPI / UTR</label>
                <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{selectedTx.utr || selectedTx.upi_id || 'N/A'}</div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Admin Remarks (Rejection Reason / Notes)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. UTR Invalid, please retry."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => handleUpdateStatus('Rejected')} className="btn btn-secondary" style={{ flex: 1, color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
                <XCircle size={18} /> Reject
              </button>
              <button onClick={() => handleUpdateStatus('Confirmed')} className="btn btn-primary" style={{ flex: 1, backgroundColor: '#10b981' }}>
                <CheckCircle2 size={18} /> Confirm Received
              </button>
            </div>
          </div>
        )}
      </ActionModal>

      <div className="card" style={{ padding: '0' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Fee Month</th>
                <th>Amount & Mode</th>
                <th>Transaction Details (UTR)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{tx.students?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tx.students?.class}</div>
                  </td>
                  <td>{tx.fees?.month || 'N/A'}</td>
                  <td>
                    <div style={{ fontWeight: '700', color: '#10b981' }}>₹{tx.amount}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tx.payment_mode}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{tx.utr || tx.upi_id || 'N/A'}</td>
                  <td>
                     <span style={{ 
                       padding: '0.25rem 0.75rem', 
                       borderRadius: '16px', 
                       fontSize: '0.75rem',
                       fontWeight: '600',
                       backgroundColor: tx.status === 'Confirmed' ? '#ecfdf5' : tx.status === 'Rejected' ? '#fef2f2' : '#fefce8',
                       color: tx.status === 'Confirmed' ? '#059669' : tx.status === 'Rejected' ? '#dc2626' : '#ca8a04' 
                     }}>
                       {tx.status}
                     </span>
                  </td>
                  <td>
                    {tx.status === 'Pending Confirmation' ? (
                      <button onClick={() => setSelectedTx(tx)} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
                        Review
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    No pending payment verifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
