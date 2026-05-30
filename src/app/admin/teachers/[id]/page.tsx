'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { 
  Users, 
  Star, 
  DollarSign, 
  BookOpen, 
  Mail, 
  Phone, 
  ArrowLeft,
  Loader2,
  GraduationCap,
  Calendar,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherData() {
      if (!id) return;
      setLoading(true);

      // 1. Fetch Teacher Profile
      const { data: tData, error: tError } = await supabase
        .from('teachers')
        .select('*')
        .eq('teacher_id', id)
        .single();

      if (tError) {
        console.error('Error fetching teacher:', tError);
        router.push('/admin/teachers');
        return;
      }
      setTeacher(tData);

      // 2. Fetch Assigned Batches
      const { data: bData } = await supabase
        .from('batches')
        .select('*')
        .eq('teacher_id', id);
      setBatches(bData || []);

      // 3. Fetch Ratings
      const { data: rData } = await supabase
        .from('ratings')
        .select('*, students(name)')
        .eq('teacher_id', id);
      setRatings(rData || []);

      // 4. Fetch Attendance (Last 30 records)
      const { data: aData } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('teacher_id', id)
        .order('date', { ascending: false })
        .limit(30);
      setAttendance(aData || []);

      setLoading(false);
    }

    loadTeacherData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!teacher) return null;

  const avgRating = ratings.length > 0 
    ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link href="/admin/teachers" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {teacher.name?.charAt(0) || 'T'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{teacher.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                 <Mail size={14} /> {teacher.email}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                 <Phone size={14} /> {teacher.phone || 'No Phone Registered'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Assigned Batches</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{batches.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Student Rating</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {avgRating} <Star size={20} fill="#f59e0b" color="#f59e0b" />
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Salary / Batch</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{teacher.salary_per_batch?.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Hiring | Working</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: teacher.hiring_status === 'hired' ? '#059669' : '#1d4ed8', textTransform: 'capitalize' }}>
              {teacher.hiring_status || 'Applied'}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: teacher.working_status === 'Active' ? '#059669' : '#dc2626' }}>
              {teacher.working_status || 'Active'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Workload Section */}
        <div className="col-span-2">
           <div className="card" style={{ padding: '0' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={20} color="var(--primary)" /> Mapped Batches
                </h2>
              </div>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Batch Name</th>
                      <th>Subject</th>
                      <th>Schedule</th>
                      <th style={{ textAlign: 'right' }}>Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.batch_id}>
                        <td style={{ fontWeight: '600' }}>{batch.name}</td>
                        <td>{batch.subject}</td>
                        <td>{batch.timing}</td>
                        <td style={{ textAlign: 'right' }}>{batch.max_students} Max</td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No batches assigned to this instructor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', backgroundColor: '#fdf2f2' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b' }}>
                  <Users size={20} /> Daily Attendance History
                </h2>
              </div>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Time Recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((entry, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
                            {entry.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No attendance records found for this instructor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Professional Details Section */}
        <div className="col-span-1">
           <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                <Briefcase size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Professional File
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Specialization</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{teacher.subjects}</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Preferred Grades</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>{teacher.classes}</div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Payout Mode</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem' }}>Per Batch (Consolidated)</div>
                 </div>
                 <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Update Salary Settings</button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
