'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Search, Filter, Loader2, MessageSquare, CheckCircle, Clock } from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          students(name, class)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filteredData = complaints.filter(record => 
    record.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Complaints & Feedback</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Review parent/student feedback and track resolution status.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginRight: 'auto' }}>All Complaints</h3>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Search complaints..." 
              className="input" 
              style={{ paddingLeft: '2.25rem', height: '36px', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary">
            <Filter size={16} /> Filter
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
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Message / Issue</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((record) => (
                  <tr key={record.complaint_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{new Date(record.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: '500' }}>{record.students?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{record.students?.class}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                         <MessageSquare size={14} color="var(--muted)" style={{ marginTop: '3px', flexShrink: 0 }} />
                         <span style={{ color: 'var(--foreground)' }}>{record.message}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {record.status === 'Resolved' ? (
                         <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                           <CheckCircle size={12} style={{ marginRight: '4px' }}/> Resolved
                         </span>
                      ) : (
                         <span className="badge" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
                           <Clock size={12} style={{ marginRight: '4px' }}/> Pending
                         </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No complaints found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
