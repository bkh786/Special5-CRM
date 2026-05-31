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
import { exportToCSV } from '@/utils/exportToCSV';

export default function TeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHiringStatus, setFilterHiringStatus] = useState('all');
  const [filterWorkingStatus, setFilterWorkingStatus] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          teacher.subjects?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHiring = filterHiringStatus === 'all' || 
                          (teacher.hiring_status || 'applied').toLowerCase() === filterHiringStatus.toLowerCase();
    const matchesWorking = filterWorkingStatus === 'all' || 
                           (teacher.working_status || 'Active').toLowerCase() === filterWorkingStatus.toLowerCase();
    
    return matchesSearch && matchesHiring && matchesWorking;
  });

  const handleDownload = () => {
    if (!teachers.length) return;
    const exportData = teachers.map(t => ({
      'Teacher ID': t.teacher_id || t.id,
      'Name': t.name,
      'Email': t.email,
      'Phone': t.phone,
      'Subjects': t.subjects,
      'Hiring Status': t.hiring_status,
      'Working Status': t.working_status
    }));
    exportToCSV(exportData, `teachers_export_${new Date().toISOString().split('T')[0]}`);
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
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} />
              Filters
            </button>
            {isFilterOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: 'white',
                border: '1px solid var(--card-border)',
                borderRadius: '8px',
                padding: '1rem',
                width: '240px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 10
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.5rem' }}>Hiring Status</label>
                  <select 
                    className="input" 
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={filterHiringStatus}
                    onChange={(e) => setFilterHiringStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="applied">Applied</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="selected">Selected</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.5rem' }}>Working Status</label>
                  <select 
                    className="input" 
                    style={{ width: '100%', padding: '0.5rem' }}
                    value={filterWorkingStatus}
                    onChange={(e) => setFilterWorkingStatus(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}
          </div>
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
                        <button 
                          onClick={() => {
                            if (teacher.phone) {
                              const phoneStr = teacher.phone.toString().replace(/\D/g, '');
                              const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
                              window.open(`https://wa.me/${formattedPhone}`, '_blank');
                            } else {
                              alert('No phone number provided for this teacher.');
                            }
                          }}
                          className="btn" 
                          style={{ padding: '0.375rem', color: '#25D366', backgroundColor: '#dcf8c6', border: 'none', borderRadius: '6px' }}
                          title="WhatsApp"
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
