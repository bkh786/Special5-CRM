'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  CreditCard, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  AlertCircle,
  Plus,
  RefreshCw,
  FileText,
  Upload,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';
import FeeForm from '@/components/forms/FeeForm';
import FeeBulkUploadForm from '@/components/forms/FeeBulkUploadForm';
import { useAdminStats } from '@/hooks/use-admin-stats';
import { exportToCSV } from '@/utils/exportToCSV';
import { Download } from 'lucide-react';

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isSavingQr, setIsSavingQr] = useState(false);
  const { stats, loading: statsLoading } = useAdminStats();

  const fetchFees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fees')
        .select(`
          *,
          students (
            name,
            class
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setFees(data || []);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
    const savedQr = localStorage.getItem('global_qr_code_url');
    if (savedQr) setQrCodeUrl(savedQr);
  }, []);

  const handleSaveQr = () => {
    setIsSavingQr(true);
    localStorage.setItem('global_qr_code_url', qrCodeUrl);
    setTimeout(() => {
      setIsSavingQr(false);
      alert('QR Code URL updated successfully!');
    }, 500);
  };

  const filteredFees = fees.filter(fee => 
    fee.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    fee.fee_id?.toString().includes(searchTerm)
  );

  const pendingConfirmations = fees.filter(f => !f.paid && (f.screenshot_url || f.pending_transaction_id || f.status === 'Processing'));
  const totalCollected = fees.filter(f => f.paid).reduce((sum, f) => sum + Number(f.amount), 0);
  const pendingTotal = fees.filter(f => !f.paid).reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Fee Management</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Track collections, pending dues, and revenue projections.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchFees} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              const exportData = filteredFees.map(f => ({
                Transaction_ID: f.fee_id,
                Month: f.month,
                Student_Name: f.students?.name,
                Class: f.students?.class,
                Amount: f.amount,
                Date: f.payment_date ? new Date(f.payment_date).toLocaleDateString() : 'N/A',
                Method: f.payment_mode,
                Status: f.paid ? 'Paid' : 'Pending'
              }));
              exportToCSV(exportData, 'Fees_Export');
            }}
            className="btn btn-secondary"
            style={{ backgroundColor: '#f1f5f9', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
          >
            <Download size={18} />
            Export Data
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary"
            style={{ backgroundColor: '#f1f5f9', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
          >
            <Upload size={18} />
            Bulk Upload
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Log Payment
          </button>
        </div>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Fee Payment"
        description="Record a new tuition fee transaction in the database."
      >
        <FeeForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchFees();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </ActionModal>

      <ActionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Bulk Upload Payment Collections"
        description="Upload an Excel sheet to import multiple fee collections at once."
      >
        <FeeBulkUploadForm 
          onSuccess={() => {
            setIsUploadModalOpen(false);
            fetchFees();
          }}
          onCancel={() => setIsUploadModalOpen(false)}
        />
      </ActionModal>

      <div className="grid grid-cols-4 gap-6 mb-8" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '12px' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Total Outstanding Fee</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {statsLoading ? <Loader2 size={16} className="animate-spin" /> : `₹${stats?.total_pending_fees?.toLocaleString() || pendingTotal.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', color: 'var(--primary)', borderRadius: '12px' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Current Month Expected</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                 {statsLoading ? <Loader2 size={16} className="animate-spin" /> : `₹${stats?.current_month_fee_expected?.toLocaleString() || 0}`}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Collected (Total)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>₹{totalCollected.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#f59e0b', borderRadius: '12px' }}>
              <CalendarIcon size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Transactions</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{fees.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Settings */}
      <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Payment Settings
        </h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Global QR Code URL (For Student Portal)</label>
            <input 
              type="url" 
              placeholder="https://example.com/qr.png" 
              className="input" 
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
            />
          </div>
          <button onClick={handleSaveQr} className="btn btn-primary" disabled={isSavingQr}>
            {isSavingQr ? <Loader2 size={16} className="animate-spin" /> : 'Save URL'}
          </button>
        </div>
      </div>

      {/* Confirm Payments Section */}
      {pendingConfirmations.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid #fde047', backgroundColor: '#fefce8' }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ca8a04' }}>
            <AlertCircle size={20} />
            Confirm Payments ({pendingConfirmations.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ borderBottom: '1px solid #fef08a' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#a16207' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#a16207' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', color: '#a16207' }}>Proof / UTR</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.75rem', color: '#a16207' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingConfirmations.map(fee => (
                  <tr key={fee.fee_id} style={{ borderBottom: '1px solid #fef08a' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{fee.students?.name}</td>
                    <td style={{ padding: '0.75rem', fontWeight: '700' }}>₹{fee.amount}</td>
                    <td style={{ padding: '0.75rem' }}>
                      {fee.pending_transaction_id ? (
                        <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{fee.pending_transaction_id}</span>
                      ) : fee.screenshot_url ? (
                        <a href={fee.screenshot_url} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: '0.875rem' }}>View Proof</a>
                      ) : 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={async () => {
                          await supabase.from('fees').update({ paid: true, status: 'Paid', payment_date: new Date().toISOString().split('T')[0] }).eq('fee_id', fee.fee_id);
                          
                          if (fee.students?.phone) {
                            const phoneStr = fee.students.phone.toString().replace(/\D/g, '');
                            const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
                            const utrRef = fee.pending_transaction_id || 'your transaction';
                            const message = encodeURIComponent(`Hi ${fee.students.name}, your payment of ₹${fee.amount} with UTR no. ${utrRef} for ${fee.students.name} has been successfully confirmed. Thank you! - Special5 CRM`);
                            window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
                          }
                          
                          fetchFees();
                        }}
                        className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                      >Accept</button>
                      <button 
                        onClick={async () => {
                          await supabase.from('fees').update({ screenshot_url: null, pending_transaction_id: null, status: 'Pending' }).eq('fee_id', fee.fee_id);
                          fetchFees();
                        }}
                        className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444' }}
                      >Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginRight: 'auto' }}>All Transactions</h3>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Search by student name..." 
              className="input" 
              style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
             <div style={{ display: 'flex', padding: '4rem', alignItems: 'center', justifyContent: 'center' }}>
               <Loader2 className="animate-spin" size={32} color="var(--primary)" />
             </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--card-border)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Transaction Info</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.length > 0 ? filteredFees.map((fee) => (
                  <tr key={fee.fee_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>#{fee.fee_id?.toString().slice(0,8).toUpperCase()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{fee.month || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: '500' }}>{fee.students?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{fee.students?.class || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: '700' }}>₹{Number(fee.amount).toLocaleString()}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{fee.payment_mode || 'N/A'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className="badge" style={{ 
                        backgroundColor: fee.paid ? '#ecfdf5' : '#fef2f2', 
                        color: fee.paid ? '#047857' : '#991b1b' 
                      }}>
                        {fee.paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }} title="View Invoice">
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (fee.students?.phone) {
                              const phoneStr = fee.students.phone.toString().replace(/\D/g, '');
                              const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
                              const message = encodeURIComponent(`Hello ${fee.students.name},\nThis is a friendly reminder for your pending fee of ₹${fee.amount} for the month of ${fee.month || 'this month'}. Please clear your dues at the earliest.\n\nThank you,\nSpecial5 Team`);
                              window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
                            } else {
                              alert('No phone number available for this student.');
                            }
                          }}
                          className="btn" 
                          style={{ padding: '0.5rem', color: '#25D366', backgroundColor: '#dcf8c6', border: 'none', borderRadius: '6px' }}
                          title="Send WhatsApp Reminder"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Real-time financial records active
          </div>
        </div>
      </div>
    </div>
  );
}
