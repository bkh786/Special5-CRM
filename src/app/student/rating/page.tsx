'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

export default function StudentRatingPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [ratingVal, setRatingVal] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function fetchTeachers() {
      if (!user) return;
      setLoading(true);
      
      // Get batches mapped to this student
      const { data: bData } = await supabase.from('batch_students').select('batch_id').eq('student_id', user.id);
      const batchIds = bData?.map(b => b.batch_id) || [];
      
      if (batchIds.length > 0) {
        // Find teachers of those batches
        const { data: tData, error: tErr } = await supabase.from('batches').select('teacher_id, batch_id, subject, teachers(name)').in('batch_id', batchIds);
        if (tErr) console.error('Error fetching teachers for rating:', tErr);
        
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

        const formatted = (tData || [])
          .filter(t => t.teacher_id != null)
          .map(t => {
             const tObj = Array.isArray(t.teachers) ? t.teachers[0] : t.teachers;
             return {
               teacher_id: t.teacher_id,
               batch_id: t.batch_id,
               name: tObj?.name || 'Assigned Instructor',
               subjects: t.subject || 'General',
               alreadyRated: ratedTeacherIds.has(t.teacher_id)
             };
          })
          .filter((v, i, a) => a.findIndex(t => t.teacher_id === v.teacher_id) === i); // deduplicate by teacher
        
        setTeachers(formatted);
      }
      setLoading(false);
    }
    fetchTeachers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedTeacherId) return alert("Please select a teacher from the dropdown menu.");
    if (ratingVal === 0) return alert("Please select a star rating.");

    const teacher = teachers.find(t => t.teacher_id === selectedTeacherId);
    if (!teacher) return;

    setSubmitting(true);
    setSuccessMsg('');

    await supabase.from('ratings').insert([{
      student_id: user.id,
      teacher_id: selectedTeacherId,
      batch_id: teacher.batch_id,
      rating: ratingVal,
      feedback: feedback
    }]);

    setTeachers(prev => prev.map(t => t.teacher_id === selectedTeacherId ? {...t, alreadyRated: true} : t));
    setSubmitting(false);
    setSuccessMsg(`Thank you! Your rating for ${teacher.name} has been submitted.`);
    setSelectedTeacherId('');
    setRatingVal(0);
    setFeedback('');
  };

  const pendingTeachers = teachers.filter(t => !t.alreadyRated);
  const ratedTeachers = teachers.filter(t => t.alreadyRated);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Teacher Rating</h1>
        <p style={{ color: 'var(--muted)' }}>Select a teacher from the drop-down menu and submit your feedback once per month.</p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} /></div>
      ) : pendingTeachers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          {ratedTeachers.length > 0 ? "You have already rated all your assigned teachers this month." : "No teachers mapped to you currently."}
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {successMsg && (
            <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
              <CheckCircle size={20} /> {successMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Select Teacher</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }} />
                <select 
                  className="input" 
                  style={{ paddingLeft: '2.5rem', width: '100%', appearance: 'auto' }}
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select a teacher --</option>
                  {pendingTeachers.map(t => (
                    <option key={t.teacher_id} value={t.teacher_id}>
                      {t.name} ({t.subjects})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTeacherId && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
                  <label style={{ fontWeight: '600' }}>Rate your experience</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        type="button"
                        onClick={() => setRatingVal(s)}
                        style={{ color: ratingVal >= s ? '#f59e0b' : '#cbd5e1' }}
                      >
                        <Star size={40} fill={ratingVal >= s ? '#f59e0b' : 'transparent'} />
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
                      rows={4}
                      style={{ paddingLeft: '2.5rem', resize: 'vertical' }}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={submitting || ratingVal === 0} className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
                   {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Rating'}
                </button>
              </>
            )}
          </form>
        </div>
      )}
      
      {ratedTeachers.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--muted)' }}>Already Rated This Month</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ratedTeachers.map(t => (
              <div key={t.teacher_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.subjects}</div>
                </div>
                <div style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '600' }}>
                  <CheckCircle size={16} /> Rated
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
