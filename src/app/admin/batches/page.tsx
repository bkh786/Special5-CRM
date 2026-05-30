'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Users, 
  BookOpen, 
  Clock, 
  Calendar, 
  Video, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';
import BatchForm from '@/components/forms/BatchForm';

export default function AdminBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/batches');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBatches();
  }, []);

  const handleEdit = (batch: any) => {
    setSelectedBatch(batch);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBatch(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Batch Management</h1>
          <p style={{ color: 'var(--muted)' }}>Create, assign teachers, and manage batch schedules in Supabase</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchBatches} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Create New Batch
          </button>
        </div>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedBatch ? "Update Batch Details" : "Create New Batch"}
        description={selectedBatch ? "Modify faculty assignment, payouts, or meeting links." : "Schedule a new batch and assign a faculty member."}
      >
        <BatchForm 
          initialData={selectedBatch}
          onSuccess={() => {
            handleCloseModal();
            fetchBatches();
          }}
          onCancel={handleCloseModal}
        />
      </ActionModal>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid var(--card-border)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Batch Name</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Faculty</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Schedule</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Students</th>
                  <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {batches.length > 0 ? batches.map((batch) => {
                  const studentCount = batch.batch_students?.[0]?.count || 0;
                  const isFull = studentCount >= (batch.max_students || 5);
                  
                  return (
                    <tr key={batch.batch_id} style={{ 
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isFull ? '#f8fafc' : 'transparent',
                      opacity: isFull ? 0.9 : 1
                    }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {batch.name}
                          {isFull && <span style={{ fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>FULL</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{batch.subject} • {batch.class}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                          <ShieldCheck size={16} color="var(--primary)" />
                          {batch.teachers?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <Clock size={14} color="var(--muted)" />
                          {batch.timing || 'TBD'}
                        </div>
                        {batch.zoom_link && (
                          <a href={batch.zoom_link} target="_blank" style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Video size={12} /> Link
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: isFull ? '#ef4444' : 'inherit' }}>{studentCount} / {batch.max_students || 5}</div>
                        <div style={{ width: '80px', height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(studentCount / (batch.max_students || 5)) * 100}%`, height: '100%', backgroundColor: isFull ? '#ef4444' : 'var(--primary)' }} />
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => router.push(`/admin/batches/${batch.batch_id}`)}
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--primary)' }}
                            onClick={() => handleEdit(batch)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No active batches found.
                    </td>
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
