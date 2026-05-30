'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  Link as LinkIcon, 
  ArrowLeft,
  Loader2,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function BatchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [batch, setBatch] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  const loadBatchData = async () => {
    if (!id) return;
    setLoading(true);

    // 1. Fetch Batch with Teacher Profile
    const { data: bData, error: bError } = await supabase
      .from('batches')
      .select('*, profiles:teacher_id(name, email)')
      .eq('batch_id', id)
      .single();

    if (bError) {
      console.error('Error fetching batch:', bError);
      router.push('/admin/batches');
      return;
    }
    setBatch(bData);

    // 2. Fetch Students mapped via batch_students
    const { data: sMapping, error: sError } = await supabase
      .from('batch_students')
      .select('student_id, students(name, class, join_date)')
      .eq('batch_id', id);

    if (sMapping) {
      const studentList = sMapping.map((m: any) => m.students);
      setStudents(studentList);
    }

    // 3. Fetch all active teachers for remapping
    const { data: tData } = await supabase
      .from('teachers')
      .select('*')
      .eq('working_status', 'Active');
    
    setTeachers(tData || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBatchData();
  }, [id]);

  const handleRemapTeacher = async () => {
    if (!selectedTeacherId) return;
    setLoading(true);

    try {
      const selectedTeacher = teachers.find(t => (t.teacher_id || t.id) === selectedTeacherId);
      if (!selectedTeacher) return;

      const tFirstName = selectedTeacher.name.split(' ')[0];
      
      // Extract start time from timing string if possible, or use name pattern
      // Pattern: "Mon-Wed-Fri, 5:00 PM - 6:30 PM" -> "5:00 PM"
      let startTime = 'Set Time';
      if (batch.timing && batch.timing.includes(',')) {
        const timePart = batch.timing.split(',')[1].trim(); // "5:00 PM - 6:30 PM"
        startTime = timePart.split('-')[0].trim(); // "5:00 PM"
      } else if (batch.name.includes('|')) {
        startTime = batch.name.split('|')[1].trim();
      }

      const newBatchName = `${tFirstName} | ${startTime}`;

      const { error } = await supabase
        .from('batches')
        .update({ 
          teacher_id: selectedTeacherId,
          name: newBatchName
        })
        .eq('batch_id', id);
      
      if (error) throw error;
      
      await loadBatchData();
      alert(`Teacher remapped successfully to ${newBatchName}`);
    } catch (err: any) {
      console.error('Error remapping teacher:', err);
      alert('Failed to remap teacher');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
// ... rest of loading logic
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!batch) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/admin/batches" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{batch.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
               <BookOpen size={14} /> {batch.subject}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
               <Users size={14} /> {batch.profiles?.name || 'No Teacher Assigned'}
            </span>
          </div>
          {!batch.teacher_id && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <select 
                 className="input" 
                 style={{ fontSize: '0.875rem', height: '36px', padding: '0 0.5rem' }}
                 value={selectedTeacherId}
                 onChange={(e) => setSelectedTeacherId(e.target.value)}
               >
                 <option value="">Select Teacher to Remap</option>
                 {teachers.map(t => (
                   <option key={t.teacher_id || t.id} value={t.teacher_id || t.id}>{t.name}</option>
                 ))}
               </select>
               <button 
                 onClick={handleRemapTeacher} 
                 className="btn btn-primary" 
                 style={{ padding: '0.375rem 1rem', fontSize: '0.875rem' }}
                 disabled={!selectedTeacherId || loading}
               >
                 Assign
               </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Batch Stats & Details */}
        <div className="col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
              Schedule Configuration
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '8px' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>Days</div>
                  <div style={{ fontWeight: '600' }}>{batch.days || 'Not Set'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#fef2f2', color: '#ef4444', borderRadius: '8px' }}>
                  <Clock size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>Timing</div>
                  <div style={{ fontWeight: '600' }}>{batch.timing || 'Not Set'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '8px' }}>
                  <LinkIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>Zoom / Meeting Link</div>
                  {batch.zoom_link ? (
                    <a href={batch.zoom_link} target="_blank" style={{ fontWeight: '600', color: 'var(--primary)', wordBreak: 'break-all' }}>Open Classroom</a>
                  ) : (
                    <div style={{ fontWeight: '600', color: '#94a3b8' }}>Link Not Shared</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ opacity: 0.8, fontSize: '0.875rem' }}>Total Students</div>
                <div style={{ fontSize: '2rem', fontWeight: '800' }}>{students.length}</div>
              </div>
              <GraduationCap size={48} style={{ opacity: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Right Column: Student Roster */}
        <div className="col-span-2">
          <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Student Roster ({students.length})</h2>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Grade</th>
                    <th>Join Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600' }}>{student.name}</td>
                      <td>{student.class}</td>
                      <td>{new Date(student.join_date).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                        No students are currently mapped to this batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
