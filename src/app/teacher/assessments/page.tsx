'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { Loader2, Save, GraduationCap, Plus, FileText, ExternalLink } from 'lucide-react';
import ActionModal from '@/components/common/ActionModal';

export default function TeacherPerformanceEntryPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsm, setNewAsm] = useState({ title: '', link: '', batch_id: '' });
  const [asmLoading, setAsmLoading] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      if (!user) return;
      setLoading(true);
      const { data: bData } = await supabase.from('batches').select('*').eq('teacher_id', user.id);
      if (bData) setBatches(bData);
      setLoading(false);
    }
    loadInitial();
  }, [user]);

  // Load assessments when batch changes
  useEffect(() => {
    async function loadAssessments() {
      if (!selectedBatchId) return;
      const { data } = await supabase.from('assessments').select('*').eq('batch_id', selectedBatchId);
      if (data) setAssessments(data);
      setSelectedAssessmentId(''); // Reset selector
      setStudents([]);
    }
    loadAssessments();
  }, [selectedBatchId]);

  // Load students & existing scores when assessment changes
  useEffect(() => {
    async function loadStudentsAndScores() {
      if (!selectedAssessmentId || !selectedBatchId) return;
      setLoading(true);
      
      // 1. Fetch Students mapped to batch_students
      const { data: studentMapping } = await supabase
        .from('batch_students')
        .select('*, students(name, student_id)')
        .eq('batch_id', selectedBatchId);
        
      const mappedStudents = studentMapping?.map(m => m.students) || [];
      setStudents(mappedStudents);

      // 2. Fetch existing scores for this assessment
      const { data: existingScores } = await supabase
        .from('assessment_scores')
        .select('*')
        .eq('assessment_id', selectedAssessmentId);

      setScores(existingScores || []);
      setLoading(false);
    }
    loadStudentsAndScores();
  }, [selectedAssessmentId]);

  const handleScoreChange = (studentId: string, value: string, type: 'score' | 'remarks') => {
    setScores(prev => {
      const existing = prev.find(s => s.student_id === studentId) || { student_id: studentId, score: '', remarks: '' };
      const updated = { ...existing, [type]: value };
      return [...prev.filter(s => s.student_id !== studentId), updated];
    });
  };

  const handleSaveGrades = async () => {
    if (!selectedAssessmentId) return;
    setIsSaving(true);
    
    // Prepare upsert payload
    const payload = scores.map(s => ({
      assessment_id: selectedAssessmentId,
      student_id: s.student_id,
      score: s.score === '' ? null : Number(s.score),
      remarks: s.remarks || null
    }));

    // In a production app with conflicts allowed on unique constraints we'd use upsert. 
    // Since we don't have unique constraint on (assessment_id, student_id) guaranteed in simple schema, 
    // we delete old and inset new.

    await supabase.from('assessment_scores').delete().eq('assessment_id', selectedAssessmentId);
    await supabase.from('assessment_scores').insert(payload);

    alert("Grades successfully published to students!");
    setIsSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Student Performance Entry</h1>
          <p style={{ color: 'var(--muted)' }}>Record marks derived from your Google Forms assessments against the student roster.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} /> Create New Assessment
        </button>
      </div>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Assessment"
        description="Launch a new Google Forms test for your students."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Assessment Title *</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. Monthly Maths Quiz - Nov" 
              value={newAsm.title}
              onChange={(e) => setNewAsm(p => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Google Forms Link *</label>
            <input 
              type="url" 
              className="input" 
              placeholder="https://forms.gle/..." 
              value={newAsm.link}
              onChange={(e) => setNewAsm(p => ({ ...p, link: e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Target Batch *</label>
            <select 
              className="input" 
              value={newAsm.batch_id}
              onChange={(e) => setNewAsm(p => ({ ...p, batch_id: e.target.value }))}
            >
              <option value="">-- Select Batch --</option>
              {batches.map(b => (
                <option key={b.batch_id} value={b.batch_id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button 
              onClick={async () => {
                if (!newAsm.title || !newAsm.link || !newAsm.batch_id || !user) return alert('Fill all fields');
                setAsmLoading(true);
                await supabase.from('assessments').insert([{
                  title: newAsm.title,
                  google_form_link: newAsm.link,
                  batch_id: newAsm.batch_id,
                  teacher_id: user.id
                }]);
                setAsmLoading(false);
                setIsModalOpen(false);
                setNewAsm({ title: '', link: '', batch_id: '' });
                // Reload assessments if needed (state is already synced via useEffect on batchId changes)
                if (selectedBatchId === newAsm.batch_id) {
                   const { data } = await supabase.from('assessments').select('*').eq('batch_id', selectedBatchId);
                   if (data) setAssessments(data);
                }
              }} 
              disabled={asmLoading}
              className="btn btn-primary" 
              style={{ flex: 1 }}
            >
              {asmLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Link'}
            </button>
          </div>
        </div>
      </ActionModal>

      <div className="card" style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'var(--secondary)' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Select Batch Filter</label>
          <select 
            className="input" 
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            <option value="">-- Choose Batch --</option>
            {batches.map(b => (
              <option key={b.batch_id} value={b.batch_id}>{b.name}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Select Assesment Payload</label>
          <select 
            className="input" 
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
            disabled={!selectedBatchId}
          >
            <option value="">-- Choose Assessment Topic --</option>
            {assessments.map(a => (
              <option key={a.id} value={a.id}>{a.title} ({new Date(a.created_at).toLocaleDateString()})</option>
            ))}
          </select>
        </div>
      </div>

      {loading && selectedAssessmentId ? (
        <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : selectedAssessmentId ? (
         <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ padding: '0.5rem', backgroundColor: '#e0e7ff', color: 'var(--primary)', borderRadius: '8px' }}>
                  <GraduationCap size={20} />
                </div>
                <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Evaluation Roster</h2>
              </div>
              <button onClick={handleSaveGrades} disabled={isSaving} className="btn btn-primary">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                Publish Grades
              </button>
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th style={{ width: '150px' }}>Score / Marks</th>
                    <th>Analytical Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const activeScoreRow = scores.find(s => s.student_id === student.student_id);
                    return (
                      <tr key={student.student_id}>
                        <td style={{ fontWeight: '600' }}>{student.name}</td>
                        <td>
                           <input 
                              type="number" 
                              className="input" 
                              placeholder="e.g. 85"
                              value={activeScoreRow?.score || ''}
                              onChange={(e) => handleScoreChange(student.student_id, e.target.value, 'score')}
                           />
                        </td>
                        <td>
                           <input 
                              type="text" 
                              className="input" 
                              placeholder="Needs improvement bridging equations..."
                              value={activeScoreRow?.remarks || ''}
                              onChange={(e) => handleScoreChange(student.student_id, e.target.value, 'remarks')}
                           />
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                        No students are dynamically mapped to this batch. Ask the admin to assign students.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
      ) : (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Please select a Batch and an Assessment above to begin grading.
        </div>
      )}
    </div>
  );
}
