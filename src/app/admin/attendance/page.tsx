'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Calendar, Search, Filter, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          students(name, class),
          batches(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const filteredData = attendance.filter(record => 
    record.students?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.batches?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Attendance Tracker</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Monitor student attendance records across batches.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <h3 style={{ fontWeight: '700', fontSize: '1.125rem', marginRight: 'auto' }}>All Attendance Records</h3>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Search by student or batch..." 
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
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Batch</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? filteredData.map((record) => (
                  <tr key={record.attendance_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <Calendar size={14} color="var(--muted)" />
                         {new Date(record.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: '500' }}>{record.students?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{record.students?.class}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>{record.batches?.name || 'Unknown'}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {record.status === 'Present' ? (
                         <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                           <CheckCircle size={12} style={{ marginRight: '4px' }}/> Present
                         </span>
                      ) : (
                         <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                           <XCircle size={12} style={{ marginRight: '4px' }}/> Absent
                         </span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No attendance records found.
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
