'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  DollarSign,
  MoreVertical,
  Loader2,
  RefreshCw,
  UserCheck,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';
import TeacherForm from '@/components/forms/TeacherForm';
import HiringConfirmationForm from '@/components/forms/HiringConfirmationForm';

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHiringModalOpen, setIsHiringModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleWorkingStatusChange = async (teacherId: string, newStatus: string) => {
    try {
      // Find teacher details for unbind logic
      const teacher = teachers.find(t => (t.teacher_id || t.id) === teacherId);
      const actualId = teacher.teacher_id || teacher.id;

      const { error } = await supabase
        .from('teachers')
        .update({ working_status: newStatus })
        .eq(teacher.teacher_id ? 'teacher_id' : 'id', actualId);
      
      if (error) throw error;

      if (newStatus === 'Inactive' && teacher.teacher_id) {
        await handleUnassignTeacherFromBatches(teacher.teacher_id);
      } else {
        fetchTeachers();
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleUnassignTeacherFromBatches = async (teacherId: string) => {
    try {
      setLoading(true);
      // 1. Unbind teacher from all their batches
      const { error } = await supabase
        .from('batches')
        .update({ teacher_id: null })
        .eq('teacher_id', teacherId);
      
      if (error) throw error;

      fetchTeachers();
      alert('Teacher deactivated. All assigned batches are now teacherless, but students remain enrolled.');
    } catch (err: any) {
      console.error('Error unassigning teacher:', err);
      alert('Teacher deactivated but failed to unassign from batches automatically. Please check manually.');
      fetchTeachers();
    } finally {
      setLoading(false);
    }
  };

  const handleHireClick = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsHiringModalOpen(true);
  };

  const filteredTeachers = teachers.filter(teacher => 
    teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subjects?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownload = () => {
    if (!teachers.length) return;
    const headers = ['Teacher ID', 'Name', 'Email', 'Phone', 'Subjects', 'Hiring Status', 'Working Status'];
    const csvContent = [
      headers.join(','),
      ...teachers.map(t => [
        t.teacher_id || t.id,
        `"${t.name || ''}"`,
        `"${t.email || ''}"`,
        `"${t.phone || ''}"`,
        `"${t.subjects || ''}"`,
        `"${t.hiring_status || ''}"`,
        `"${t.working_status || ''}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `teachers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applicationsReceived = teachers.filter(t => t.hiring_status === 'applied').length;
  const applicationsReviewed = teachers.filter(t => t.hiring_status === 'reviewed').length;
  const teachersHired = teachers.filter(t => t.hiring_status === 'selected' || t.hiring_status === 'hired').length;

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Teacher Management</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Monitor performance, payouts, and workload of all teachers.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchTeachers} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <Download size={18} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Hire New Teacher
          </button>
        </div>
        </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Hire New Teacher"
        description="Add a new faculty member to the academic team."
      >
        <TeacherForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchTeachers();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </ActionModal>

      <ActionModal
        isOpen={isHiringModalOpen}
        onClose={() => setIsHiringModalOpen(false)}
        title="Confirm Hiring"
        description="Verify profile details and set salary for the new instructor."
      >
        {selectedTeacher && (
          <HiringConfirmationForm 
            teacher={selectedTeacher}
            onSuccess={() => {
              setIsHiringModalOpen(false);
              fetchTeachers();
            }}
            onCancel={() => setIsHiringModalOpen(false)}
          />
        )}
      </ActionModal>



      <div className="grid grid-cols-3 gap-6 mb-8" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#e0e7ff', color: 'var(--primary)', borderRadius: '12px' }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Applications Received</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{applicationsReceived}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '12px' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Reviewed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{applicationsReviewed}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#f59e0b', borderRadius: '12px' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Hired</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{teachersHired}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input 
              type="text" 
              placeholder="Find a teacher by name or subject..." 
              className="input" 
              style={{ paddingLeft: '2.5rem', height: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary">
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
                  <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Teacher Name</th>
                   <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Hiring Status</th>
                   <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Working Status</th>
                  <th style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length > 0 ? filteredTeachers.map((teacher) => (
                  <tr key={teacher.teacher_id || teacher.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserCheck size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{teacher.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{teacher.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className="badge" style={{
                        backgroundColor: teacher.hiring_status === 'hired' ? '#ecfdf5' : teacher.hiring_status === 'rejected' ? '#fef2f2' : '#eff6ff',
                        color: teacher.hiring_status === 'hired' ? '#047857' : teacher.hiring_status === 'rejected' ? '#991b1b' : '#1d4ed8',
                        textTransform: 'capitalize'
                      }}>
                        {teacher.hiring_status || 'Applied'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      {(teacher.hiring_status === 'selected' || teacher.hiring_status === 'hired') ? (
                        <select 
                          value={teacher.working_status || 'Active'} 
                          onChange={(e) => handleWorkingStatusChange(teacher.teacher_id || teacher.id, e.target.value)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            border: '1px solid var(--card-border)',
                            fontSize: '0.875rem',
                            backgroundColor: (teacher.working_status || 'Active') === 'Active' ? '#f0fdf4' : '#fef2f2',
                            color: (teacher.working_status || 'Active') === 'Active' ? '#166534' : '#991b1b',
                            fontWeight: '500'
                          }}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>N/A</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        {teacher.hiring_status === 'applied' && (
                          <button 
                            onClick={() => handleHireClick(teacher)}
                            className="btn btn-primary" 
                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                          >
                            Hire
                          </button>
                        )}
                        <button 
                          onClick={() => router.push(`/admin/teachers/${teacher.teacher_id || teacher.id}`)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          View Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                      No teachers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Live faculty database active
        </div>
        </div>
      </div>
    </div>
  );
}
