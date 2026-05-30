'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

// Parse timing string like "Mon-Wed-Fri, 6:00 PM - 7:30 PM" → days array
function parseDays(timing: string): string[] {
  if (!timing) return [];
  return timing.split(',')[0].split('-');
}

// Generate last N days that fall on batch schedule days
function getScheduledDates(timing: string, lookbackDays = 30): string[] {
  const days = parseDays(timing);
  const DAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayNums = days.map(d => DAY_MAP[d]).filter(n => n !== undefined);

  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i <= lookbackDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dayNums.includes(d.getDay())) {
      dates.push(d.toISOString().split('T')[0]);
    }
  }
  return dates;
}

interface AttendanceRecord {
  student_id: string;
  status: 'Present' | 'Absent' | '';
}

interface BatchDateEntry {
  batch: any;
  date: string;
  students: any[];
  existingAttendance: Record<string, string>;
  localMarks: Record<string, string>;
  isComplete: boolean;
  isExpanded: boolean;
  isSaving: boolean;
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<BatchDateEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get teacher's batches
    const { data: batchData } = await supabase
      .from('batches')
      .select('*')
      .eq('teacher_id', user.id);
    const batches = batchData || [];

    // Get all batch IDs
    const batchIds = batches.map((b: any) => b.batch_id);

    // Get all students for each batch
    const { data: bsData } = await supabase
      .from('batch_students')
      .select('batch_id, students(student_id, name, class)')
      .in('batch_id', batchIds);

    const studentsByBatch: Record<string, any[]> = {};
    (bsData || []).forEach((row: any) => {
      if (!studentsByBatch[row.batch_id]) studentsByBatch[row.batch_id] = [];
      if (row.students) studentsByBatch[row.batch_id].push(row.students);
    });

    // Get existing attendance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: attData } = await supabase
      .from('attendance')
      .select('batch_id, student_id, date, status')
      .in('batch_id', batchIds)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    // Build existing map: key = `batchId|date|studentId`
    const attMap: Record<string, string> = {};
    (attData || []).forEach((a: any) => {
      attMap[`${a.batch_id}|${a.date}|${a.student_id}`] = a.status;
    });

    // Build entries list — one per batch per scheduled date
    const newEntries: BatchDateEntry[] = [];
    for (const batch of batches) {
      const dates = getScheduledDates(batch.timing || '', 30);
      const students = studentsByBatch[batch.batch_id] || [];
      for (const date of dates) {
        // Build existing attendance for this batch+date
        const existingAttendance: Record<string, string> = {};
        students.forEach((s: any) => {
          const key = `${batch.batch_id}|${date}|${s.student_id}`;
          if (attMap[key]) existingAttendance[s.student_id] = attMap[key];
        });
        const isComplete = students.length > 0 && students.every((s: any) => existingAttendance[s.student_id]);
        if (!isComplete) {
          newEntries.push({
            batch, date, students,
            existingAttendance,
            localMarks: { ...existingAttendance },
            isComplete: false,
            isExpanded: false,
            isSaving: false
          });
        }
      }
    }

    // Sort by date desc
    newEntries.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(newEntries);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleExpand = (idx: number) => {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, isExpanded: !e.isExpanded } : e));
  };

  const handleMark = (idx: number, studentId: string, status: string) => {
    setEntries(prev => prev.map((e, i) => i === idx ? {
      ...e,
      localMarks: { ...e.localMarks, [studentId]: status }
    } : e));
  };

  const handleSave = async (idx: number) => {
    const entry = entries[idx];
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, isSaving: true } : e));

    const records = entry.students
      .filter((s: any) => entry.localMarks[s.student_id])
      .map((s: any) => ({
        batch_id: entry.batch.batch_id,
        student_id: s.student_id,
        date: entry.date,
        status: entry.localMarks[s.student_id]
      }));

    if (records.length > 0) {
      await supabase.from('attendance').upsert(records, {
        onConflict: 'batch_id,student_id,date'
      });
    }

    // Check if now complete — remove from list if so
    const allMarked = entry.students.every((s: any) => entry.localMarks[s.student_id]);
    if (allMarked) {
      setEntries(prev => prev.filter((_, i) => i !== idx));
    } else {
      setEntries(prev => prev.map((e, i) => i === idx ? {
        ...e, isSaving: false, existingAttendance: { ...e.localMarks }
      } : e));
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Attendance</h1>
          <p style={{ color: 'var(--muted)' }}>Mark student attendance for each batch session. Completed sessions disappear automatically.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>All caught up!</h3>
          <p style={{ color: 'var(--muted)' }}>All student attendance has been marked for recent sessions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map((entry, idx) => {
            const markedCount = entry.students.filter((s: any) => entry.localMarks[s.student_id]).length;
            const total = entry.students.length;
            return (
              <div key={`${entry.batch.batch_id}-${entry.date}`} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Row header */}
                <div
                  onClick={() => toggleExpand(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem', cursor: 'pointer',
                    backgroundColor: entry.isExpanded ? '#f8fafc' : 'white'
                  }}
                >
                  <div style={{ color: 'var(--primary)' }}>
                    {entry.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                  <Calendar size={16} color="var(--muted)" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{entry.batch.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(entry.date)} · {entry.batch.timing?.split(',')[1]?.trim() || ''}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '600', color: markedCount === total && total > 0 ? '#059669' : '#f59e0b' }}>
                    {markedCount}/{total} marked
                  </div>
                </div>

                {/* Expanded student rows */}
                {entry.isExpanded && (
                  <div style={{ borderTop: '1px solid var(--card-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f8fafc' }}>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Student</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Class</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)' }}>Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.students.map((s: any) => (
                          <tr key={s.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.75rem 1.25rem', fontWeight: '600' }}>{s.name}</td>
                            <td style={{ padding: '0.75rem 1.25rem', color: 'var(--muted)' }}>{s.class}</td>
                            <td style={{ padding: '0.75rem 1.25rem' }}>
                              <select
                                className="input"
                                value={entry.localMarks[s.student_id] || ''}
                                onChange={e => handleMark(idx, s.student_id, e.target.value)}
                                style={{
                                  width: '140px',
                                  backgroundColor: entry.localMarks[s.student_id] === 'Present' ? '#ecfdf5'
                                    : entry.localMarks[s.student_id] === 'Absent' ? '#fef2f2' : 'white',
                                  color: entry.localMarks[s.student_id] === 'Present' ? '#059669'
                                    : entry.localMarks[s.student_id] === 'Absent' ? '#dc2626' : '#64748b',
                                  fontWeight: '600'
                                }}
                              >
                                <option value="">-- Mark --</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        onClick={() => handleSave(idx)}
                        disabled={entry.isSaving}
                        className="btn btn-primary"
                        style={{ minWidth: '130px' }}
                      >
                        {entry.isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                        Save Attendance
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
