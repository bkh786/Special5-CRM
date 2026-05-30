import React, { useState } from 'react';
import { Upload, Download, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase-client';

export default function LeadBulkUploadForm({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const downloadSample = () => {
    const ws = XLSX.utils.json_to_sheet([{
      student_name: 'John Doe',
      phone: '9876543210',
      email_id: 'john@example.com',
      class: '10th',
      subjects: 'Maths, Science',
      source: 'Website',
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'Special5_Leads_Sample.xlsx');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          throw new Error('The uploaded file is empty.');
        }

        const formattedData = json.map((row: any) => ({
          student_name: row.student_name || 'Unknown',
          phone: row.phone ? String(row.phone) : null,
          email_id: row.email_id || null,
          class: row.class || null,
          subjects: row.subjects || null,
          source: row.source || 'Bulk Upload',
          status: 'Received',
        }));

        const { error: uploadError } = await supabase.from('leads').insert(formattedData);

        if (uploadError) throw uploadError;

        setSuccessCount(formattedData.length);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } catch (err: any) {
        console.error('Upload Error:', err);
        setError(err.message || 'Failed to upload leads. Please check the format.');
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file.');
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div>
          <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Download Sample Format</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Use this template to format your lead data.</p>
        </div>
        <button type="button" onClick={downloadSample} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
          <Download size={16} style={{ marginRight: '0.25rem' }} />
          Sample.xlsx
        </button>
      </div>

      <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2rem', textAlign: 'center' }}>
        <input 
          type="file" 
          id="excel-upload" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />
        <label htmlFor="excel-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
          </div>
          <div>
            <p style={{ fontWeight: 600 }}>Click to browse Excel file</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Supports .xlsx and .xls formats</p>
          </div>
        </label>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} style={{ marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {successCount !== null && (
        <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
          <CheckCircle2 size={16} style={{ marginTop: '2px' }} />
          <span>Successfully imported {successCount} leads! Redirecting...</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
}
