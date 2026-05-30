'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, Clock, Video, ChevronDown, X, Loader2, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';

export default function TeacherBatchesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const fetchBatches = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('batches')
      .select('*, batch_students(count)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setBatches(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBatches(); }, [user]);

  const handleViewStudents = async (batch: any) => {
    setSelectedBatch(batch);
    setStudentsLoading(true);
    const { data } = await supabase
      .from('batch_students')
      .select('students(student_id, name, class)')
      .eq('batch_id', batch.batch_id);
    setBatchStudents((data || []).map((r: any) => r.students).filter(Boolean));
    setStudentsLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Classes</h1>
          <p style={{ color: 'var(--muted)' }}>Your assigned batches and upcoming class links.</p>
        </div>
        <button onClick={fetchBatches} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Students Modal */}
      <ActionModal
        isOpen={!!selectedBatch}
        onClose={() => { setSelectedBatch(null); setBatchStudents([]); }}
        title={`Students in ${selectedBatch?.name || ''}`}
        description="Student name and class only — contact details are protected."
      >
        {studentsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {batchStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem' }}>No students enrolled yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--card-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Class</th>
                  </tr>
                </thead>
                <tbody>
                  {batchStudents.map((s: any, i: number) => (
                    <tr key={s.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{i + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600' }}>{s.name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{s.class}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </ActionModal>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : batches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
          No batches assigned to you yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {batches.map(batch => {
            const studentCount = batch.batch_students?.[0]?.count || 0;
            return (
              <div key={batch.batch_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>{batch.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                      {batch.subject} · Class {batch.class}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '3px 8px', backgroundColor: '#e0e7ff', color: 'var(--primary)', borderRadius: '20px' }}>
                    ACTIVE
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    <Clock size={14} /> {batch.timing || 'Timing TBD'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                    <Users size={14} /> {studentCount} / {batch.max_students || 5} students enrolled
                  </div>
                  {/* Fill bar */}
                  <div style={{ height: '4px', backgroundColor: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(studentCount / (batch.max_students || 5)) * 100}%`,
                      height: '100%',
                      backgroundColor: studentCount >= (batch.max_students || 5) ? '#ef4444' : 'var(--primary)'
                    }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    onClick={() => handleViewStudents(batch)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                  >
                    <Users size={14} /> View Students
                  </button>
                  {batch.zoom_link ? (
                    <a
                      href={batch.zoom_link}
                      target="_blank"
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: '0.8rem', textAlign: 'center' }}
                    >
                      <Video size={14} /> Join Class
                    </a>
                  ) : (
                    <button className="btn btn-secondary" disabled style={{ flex: 1, fontSize: '0.8rem', opacity: 0.5 }}>
                      No Link Set
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
