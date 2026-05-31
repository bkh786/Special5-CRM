'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen, Calendar, Filter } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

export default function StudentClassUpdatePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [filterBatch, setFilterBatch] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);

      // 1. Get student's enrolled batches
      const { data: bsData } = await supabase
        .from('batch_students')
        .select('batch_id, batches(*)')
        .eq('student_id', user.id);
        
      const myBatches = (bsData?.map(bs => bs.batches).filter(Boolean) as any[]) || [];
      setBatches(myBatches);
      
      const batchIds = myBatches.map((b: any) => b.batch_id);

      if (batchIds.length > 0) {
        // 2. Fetch class updates for these batches
        const { data: topicsData } = await supabase
          .from('class_topics')
          .select('*, batches(name, subject)')
          .in('batch_id', batchIds)
          .order('class_date', { ascending: false });

        if (topicsData) {
          setTopics(topicsData);
        }
      }
      
      setLoading(false);
    }
    loadData();
  }, [user]);

  const filteredTopics = filterBatch 
    ? topics.filter(t => t.batch_id === filterBatch)
    : topics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Class Updates</h1>
          <p style={{ color: 'var(--muted)' }}>View the topics covered by your teachers in recent sessions.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Filter size={16} color="var(--muted)" style={{ marginBottom: '0.25rem' }} />
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>Filter by Batch</label>
          <select 
            className="input" 
            value={filterBatch} 
            onChange={e => setFilterBatch(e.target.value)} 
            style={{ minWidth: '200px' }}
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b.batch_id} value={b.batch_id}>{b.name}</option>
            ))}
          </select>
        </div>
        {filterBatch && (
          <button 
            onClick={() => setFilterBatch('')} 
            className="btn btn-secondary" 
            style={{ fontSize: '0.8rem' }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--card-border)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Batch & Subject</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Topics Covered</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    No class updates found.
                  </td>
                </tr>
              ) : (
                filteredTopics.map(topic => (
                  <tr key={topic.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.25rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                        <Calendar size={14} color="var(--muted)" />
                        {new Date(topic.class_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '600' }}>{topic.batches?.name || 'Unknown Batch'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{topic.batches?.subject || ''}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <BookOpen size={16} color="var(--primary)" style={{ marginTop: '0.15rem' }} />
                        <span style={{ fontWeight: '500', color: 'var(--foreground)' }}>
                          {topic.topics_covered}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
