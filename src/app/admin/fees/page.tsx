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

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
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
  }, []);

  const filteredFees = fees.filter(fee => 
    fee.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    fee.id?.toString().includes(searchTerm)
  );

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
                      <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '6px' }}>
                        <FileText size={16} />
                      </button>
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
