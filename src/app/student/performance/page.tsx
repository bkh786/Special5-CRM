'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { Award, FileText, Loader2, ArrowRight } from 'lucide-react';

export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerformanceData() {
      if (!user) return;
      setLoading(true);

      // Fetch scores mapped to student
      const { data: sData } = await supabase
        .from('assessment_scores')
        .select('*, assessments(title, batch_id, google_form_link, batches(subject))')
        .eq('student_id', user.id);

      if (sData) setScores(sData);

      // Fetch pending assessments (mapped via batches)
      const { data: bData } = await supabase.from('batch_students').select('batch_id').eq('student_id', user.id);
      const mappedBatchIds = bData?.map(b => b.batch_id) || [];

      if (mappedBatchIds.length > 0) {
         const { data: aData } = await supabase
           .from('assessments')
           .select('*, batches(subject)')
           .in('batch_id', mappedBatchIds);
           
         if (aData) setAssessments(aData);
      }

      setLoading(false);
    }
    loadPerformanceData();
  }, [user]);

  // Merge datasets to find explicit "Pending" links vs "Rated" feedback
  const evaluatedMap = new Set(scores.map(s => s.assessment_id));
  const pendingAssessments = assessments.filter(a => !evaluatedMap.has(a.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Performance & Assessments</h1>
        <p style={{ color: 'var(--muted)' }}>Take interactive assessments and review your historically evaluated remarks.</p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', backgroundColor: '#fff7ed', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} /> Active Assessment Links
                </h2>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#c2410c', backgroundColor: '#ffedd5', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                  {pendingAssessments.length} Pending
                </div>
              </div>
             <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Topic</th>
                     <th>Subject</th>
                     <th>Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {pendingAssessments.map(a => (
                     <tr key={a.id}>
                       <td style={{ fontWeight: '600' }}>{a.title}</td>
                       <td>{a.batches?.subject}</td>
                       <td>
                          <a href={a.google_form_link} target="_blank" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Take Test <ArrowRight size={14} />
                          </a>
                       </td>
                     </tr>
                   ))}
                   {pendingAssessments.length === 0 && (
                     <tr>
                       <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>You have no pending assessments to complete!</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="#6366f1" /> Monthly Evaluation Results
                </h2>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)', backgroundColor: '#e0e7ff', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                  {scores.length} Released
                </div>
              </div>
             <div className="table-container">
               <table>
                 <thead>
                   <tr>
                     <th>Assessment Topic</th>
                     <th>Subject Area</th>
                     <th>Score Achieved</th>
                     <th>Faculty Remarks</th>
                   </tr>
                 </thead>
                 <tbody>
                   {scores.map(s => (
                     <tr key={s.id}>
                       <td style={{ fontWeight: '600' }}>{s.assessments?.title}</td>
                       <td>{s.assessments?.batches?.subject}</td>
                       <td>
                          <div style={{ fontWeight: '700', color: s.score >= 80 ? '#059669' : s.score >= 50 ? '#d97706' : '#dc2626' }}>
                             {s.score !== null ? `${s.score} Marks` : 'N/A'}
                          </div>
                       </td>
                       <td style={{ fontStyle: 'italic', color: 'var(--muted)' }}>"{s.remarks || 'No detailed remarks provided.'}"</td>
                     </tr>
                   ))}
                   {scores.length === 0 && (
                     <tr>
                       <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>No marks have been explicitly published yet.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </>
      )}
    </div>
  );
}
