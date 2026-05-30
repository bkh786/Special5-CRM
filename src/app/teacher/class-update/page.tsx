'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Save, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

function parseDays(timing: string): string[] {
  if (!timing) return [];
  return timing.split(',')[0].split('-');
}

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

function getAcademicYear(date: string) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed, Apr = 3
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export default function ClassUpdatePage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localInputs, setLocalInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Filters
  const [filterBatch, setFilterBatch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [batches, setBatches] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: batchData } = await supabase.from('batches').select('*').eq('teacher_id', user.id);
    const myBatches = batchData || [];
    setBatches(myBatches);

    const batchIds = myBatches.map((b: any) => b.batch_id);

    // Load existing class topics
    const { data: topicsData } = await supabase
      .from('class_topics')
      .select('*')
      .in('batch_id', batchIds);

    const topicsMap: Record<string, any> = {};
    (topicsData || []).forEach((t: any) => {
      topicsMap[`${t.batch_id}|${t.class_date}`] = t;
    });

    // Build rows
    const newRows: any[] = [];
    for (const batch of myBatches) {
      const dates = getScheduledDates(batch.timing || '', 30);
      for (const date of dates) {
        const key = `${batch.batch_id}|${date}`;
        const existing = topicsMap[key];
        newRows.push({ batch, date, key, existing, saved: !!existing?.topics_covered });
      }
    }
    newRows.sort((a, b) => b.date.localeCompare(a.date));
    setRows(newRows);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (row: any) => {
    const topic = localInputs[row.key];
    if (!topic?.trim()) return;
    setSaving(prev => ({ ...prev, [row.key]: true }));

    await supabase.from('class_topics').upsert({
      batch_id: row.batch.batch_id,
      teacher_id: user!.id,
      class_date: row.date,
      topics_covered: topic.trim()
    }, { onConflict: 'batch_id,class_date' });

    setSaving(prev => ({ ...prev, [row.key]: false }));
    // Reload to reflect saved state
    await loadData();
  };

  // Apply filters
  const filteredRows = rows.filter(row => {
    if (filterBatch && row.batch.batch_id !== filterBatch) return false;
    if (filterMonth && new Date(row.date).getMonth() + 1 !== parseInt(filterMonth)) return false;
    if (filterYear && getAcademicYear(row.date) !== filterYear) return false;
    return true;
  });

  const academicYears = [...new Set(rows.map(r => getAcademicYear(r.date)))];
  const months = [
    { val: '1', label: 'January' }, { val: '2', label: 'February' }, { val: '3', label: 'March' },
    { val: '4', label: 'April' }, { val: '5', label: 'May' }, { val: '6', label: 'June' },
    { val: '7', label: 'July' }, { val: '8', label: 'August' }, { val: '9', label: 'September' },
    { val: '10', label: 'October' }, { val: '11', label: 'November' }, { val: '12', label: 'December' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Class Update</h1>
          <p style={{ color: 'var(--muted)' }}>Log topics covered each session. <span style={{ color: '#ef4444', fontWeight: '600' }}>Red</span> = pending, <span style={{ color: '#94a3b8', fontWeight: '600' }}>Grey</span> = saved.</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Filter size={16} color="var(--muted)" style={{ marginBottom: '0.25rem' }} />
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>Batch</label>
          <select className="input" value={filterBatch} onChange={e => setFilterBatch(e.target.value)} style={{ minWidth: '160px' }}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.batch_id} value={b.batch_id}>{b.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>Month</label>
          <select className="input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ minWidth: '130px' }}>
            <option value="">All Months</option>
            {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', marginBottom: '0.25rem' }}>Academic Year</label>
          <select className="input" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ minWidth: '120px' }}>
            <option value="">All Years</option>
            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {(filterBatch || filterMonth || filterYear) && (
          <button onClick={() => { setFilterBatch(''); setFilterMonth(''); setFilterYear(''); }} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--card-border)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Batch</th>
                <th style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Topics Covered</th>
                <th style={{ padding: '1rem 1.25rem', width: '120px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No sessions found.</td>
                </tr>
              ) : filteredRows.map(row => {
                const isSaved = row.saved;
                return (
                  <tr
                    key={row.key}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSaved ? '#f8fafc' : '#fff5f5'
                    }}
                  >
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: isSaved ? 'var(--muted)' : '#dc2626', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: isSaved ? 'var(--muted)' : 'var(--foreground)', fontWeight: '500' }}>
                      {row.batch.name}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{row.batch.subject}</div>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      {isSaved ? (
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{row.existing?.topics_covered}</span>
                      ) : (
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. Chapter 3 - Quadratic Equations..."
                          value={localInputs[row.key] || ''}
                          onChange={e => setLocalInputs(prev => ({ ...prev, [row.key]: e.target.value }))}
                          style={{ fontSize: '0.875rem', borderColor: '#fca5a5' }}
                        />
                      )}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      {isSaved ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                          <CheckCircle2 size={14} /> Saved
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSave(row)}
                          disabled={saving[row.key] || !localInputs[row.key]?.trim()}
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                        >
                          {saving[row.key] ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                          Save
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
