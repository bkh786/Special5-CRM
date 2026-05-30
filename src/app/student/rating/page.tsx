'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

export default function StudentRatingPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingVals, setRatingVals] = useState<Record<string, number>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchTeachers() {
      if (!user) return;
      setLoading(true);
      
      // Get batches mapped to this student
      const { data: bData } = await supabase.from('batch_students').select('batch_id').eq('student_id', user.id);
      const batchIds = bData?.map(b => b.batch_id) || [];
      
      if (batchIds.length > 0) {
        // Find teachers of those batches
        const { data: tData } = await supabase.from('batches').select('teacher_id, teachers(name, subjects), batch_id').in('batch_id', batchIds);
        
        // Find if already rated this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: rData } = await supabase
          .from('ratings')
          .select('teacher_id')
          .eq('student_id', user.id)
          .gte('created_at', startOfMonth.toISOString());
          
        const ratedTeacherIds = new Set(rData?.map(r => r.teacher_id));

        const formatted = tData?.map(t => {
           const tObj = Array.isArray(t.teachers) ? t.teachers[0] : t.teachers;
           return {
             teacher_id: t.teacher_id,
             batch_id: t.batch_id,
             name: tObj?.name || 'Assigned Instructor',
             subjects: tObj?.subjects || 'General',
             alreadyRated: ratedTeacherIds.has(t.teacher_id)
           };
        }).filter((v, i, a) => a.findIndex(t => (t.teacher_id === v.teacher_id)) === i); // deduplicate by teacher
        
        setTeachers(formatted || []);
      }
      setLoading(false);
    }
    fetchTeachers();
  }, [user]);

  const handleSubmit = async (teacherId: string, batchId: string) => {
    if (!user) return;
    const rate = ratingVals[teacherId] || 0;
    if (rate === 0) return alert("Select a star rating first.");

    setSubmitting(prev => ({...prev, [teacherId]: true}));

    await supabase.from('ratings').insert([{
      student_id: user.id,
      teacher_id: teacherId,
      batch_id: batchId,
      rating: rate,
      feedback: feedbacks[teacherId] || ''
    }]);

    setTeachers(prev => prev.map(t => t.teacher_id === teacherId ? {...t, alreadyRated: true} : t));
    setSubmitting(prev => ({...prev, [teacherId]: false}));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Teacher Rating</h1>
        <p style={{ color: 'var(--muted)' }}>Submit feedback for your assigned faculty once per month to help us improve.</p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} /></div>
      ) : teachers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>No teachers mapped to you currently.</div>
      ) : (
        teachers.map(teacher => (
          <div key={teacher.teacher_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: teacher.alreadyRated ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem'}}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  {teacher.name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 style={{ fontWeight: '600' }}>{teacher.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{teacher.subjects}</p>
                </div>
              </div>
              {teacher.alreadyRated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600' }}>
                  <CheckCircle size={18} /> Rated This Month
                </div>
              )}
            </div>

            {!teacher.alreadyRated && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                  <label style={{ fontWeight: '600' }}>Rate your experience</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setRatingVals(prev => ({...prev, [teacher.teacher_id]: s}))}
                        style={{ color: (ratingVals[teacher.teacher_id] || 0) >= s ? '#f59e0b' : '#cbd5e1' }}
                      >
                        <Star size={32} fill={(ratingVals[teacher.teacher_id] || 0) >= s ? '#f59e0b' : 'transparent'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Additional Feedback</label>
                  <div style={{ position: 'relative' }}>
                    <MessageSquare size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                    <textarea 
                      className="input" 
                      placeholder="Tell us what you like or what can be improved..."
                      rows={3}
                      style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
                      value={feedbacks[teacher.teacher_id] || ''}
                      onChange={(e) => setFeedbacks(prev => ({ ...prev, [teacher.teacher_id]: e.target.value }))}
                    />
                  </div>
                </div>

                <button onClick={() => handleSubmit(teacher.teacher_id, teacher.batch_id)} disabled={submitting[teacher.teacher_id]} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                   {submitting[teacher.teacher_id] ? <Loader2 className="animate-spin" size={18} /> : 'Submit Rating'}
                </button>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
