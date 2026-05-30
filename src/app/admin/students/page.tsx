'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MoreVertical, 
  GraduationCap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = () => {
    if (!students.length) return;
    
    const headers = ['Student ID', 'Name', 'Email', 'Class', 'Batch', 'Mode', 'Join Date', 'Pending Fees'];
    const csvContent = [
      headers.join(','),
      ...students.map(s => [
        s.student_id || s.id,
        `"${s.name || ''}"`,
        `"${s.email || ''}"`,
        `"${s.class || ''}"`,
        `"${s.mapped_batch || ''}"`,
        `"${s.mode || ''}"`,
        `"${s.join_date || ''}"`,
        s.pending_fees || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Student Management</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>View and manage all active students at Special5 - Online Tuitions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStudents} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleDownload} className="btn btn-secondary">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name, ID or email..." 
              className="input" 
              style={{ paddingLeft: '2.5rem', height: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" style={{ border: '1px solid var(--card-border)' }}>
            <Filter size={18} />
            Filters
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
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Enrolled Batch</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Onboarding Date</th>
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Pending Fees</th>
                  <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                  <tr key={student.student_id || student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GraduationCap size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '500' }}>{student.mapped_batch}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Class: {student.class}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '500' }}>{student.join_date || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{student.mode || 'Offline'}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {student.pending_fees > 0 ? (
                        <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#991b1b' }}>
                          ₹{student.pending_fees} Due
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                          Paid Up
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => router.push(`/admin/students/${student.student_id || student.id}`)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Connected to real-time database
          </div>
        </div>
      </div>
    </div>
  );
}
