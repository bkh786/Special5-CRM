'use client';

import React, { useState, useEffect } from 'react';
import { Download, Upload, Loader2, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

export default function StudentPerformancePage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('batches').select('*').eq('teacher_id', user.id).then(({ data }) => setBatches(data || []));
  }, [user]);

  useEffect(() => {
    if (!selectedBatchId) { setStudents([]); setAssessments([]); return; }
    setLoading(true);
    Promise.all([
      supabase.from('batch_students').select('students(student_id, name, class)').eq('batch_id', selectedBatchId),
      supabase.from('assessments').select('*').eq('batch_id', selectedBatchId)
    ]).then(([bsRes, asmRes]) => {
      setStudents((bsRes.data || []).map((r: any) => r.students).filter(Boolean));
      setAssessments(asmRes.data || []);
      setLoading(false);
    });
  }, [selectedBatchId]);

  const handleDownloadTemplate = () => {
    if (students.length === 0) return alert('Select a batch with enrolled students first.');
    const templateData = students.map((s: any) => ({
      student_id: s.student_id,
      student_name: s.name,
      class: s.class,
      score: '',
      remarks: ''
    }));
    const ws = XLSX.utils.json_to_sheet(templateData);
    // Style header widths
    ws['!cols'] = [{ wch: 38 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assessment Results');
    const batchName = batches.find(b => b.batch_id === selectedBatchId)?.name || 'Batch';
    XLSX.writeFile(wb, `Assessment_Template_${batchName.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAssessmentId) return;

    setUploadLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = ev.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const ws = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws);

        if (json.length === 0) throw new Error('File is empty.');

        const records = json
          .filter(row => row.student_id && (row.score !== '' && row.score !== undefined))
          .map(row => ({
            assessment_id: selectedAssessmentId,
            student_id: String(row.student_id),
            score: parseFloat(String(row.score)) || 0,
            remarks: row.remarks || ''
          }));

        if (records.length === 0) throw new Error('No valid score rows found. Make sure student_id and score are filled.');

        const { error: insertError } = await supabase
          .from('assessment_scores')
          .upsert(records, { onConflict: 'assessment_id,student_id' });

        if (insertError) throw insertError;
        setSuccess(`Successfully uploaded ${records.length} assessment score(s).`);
      } catch (err: any) {
        setError(err.message || 'Upload failed.');
      } finally {
        setUploadLoading(false);
        e.target.value = '';
      }
    };
    reader.onerror = () => { setError('Failed to read file.'); setUploadLoading(false); };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Student Performance</h1>
        <p style={{ color: 'var(--muted)' }}>Download a pre-filled template with your students, fill in scores, then upload results.</p>
      </div>

      {/* Step 1 - Select Batch */}
      <div className="card">
        <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 1 — Select Batch</h3>
        <select className="input" value={selectedBatchId} onChange={e => { setSelectedBatchId(e.target.value); setSelectedAssessmentId(''); }}>
          <option value="">-- Choose Batch --</option>
          {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.name}</option>)}
        </select>

        {selectedBatchId && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
              <GraduationCap size={16} /> {loading ? 'Loading...' : `${students.length} students enrolled`}
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={students.length === 0 || loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <Download size={15} /> Download Template
            </button>
          </div>
        )}
      </div>

      {/* Step 2 - Select Assessment */}
      {selectedBatchId && (
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 2 — Select Assessment</h3>
          {assessments.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>No assessments created for this batch yet. Create one in the Assessments page first.</p>
          ) : (
            <select className="input" value={selectedAssessmentId} onChange={e => setSelectedAssessmentId(e.target.value)}>
              <option value="">-- Choose Assessment --</option>
              {assessments.map(a => (
                <option key={a.id} value={a.id}>{a.title} ({new Date(a.created_at).toLocaleDateString()})</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Step 3 - Upload */}
      {selectedAssessmentId && (
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Step 3 — Upload Filled Results</h3>

          <div style={{ border: '2px dashed var(--card-border)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
            <input type="file" id="perf-upload" accept=".xlsx,.xls" onChange={handleUpload} style={{ display: 'none' }} />
            <label htmlFor="perf-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {uploadLoading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
              </div>
              <div>
                <p style={{ fontWeight: '600' }}>Click to upload filled template</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Supports .xlsx and .xls</p>
              </div>
            </label>
          </div>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.875rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {error}
            </div>
          )}
          {success && (
            <div style={{ marginTop: '1rem', padding: '0.875rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px', display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
