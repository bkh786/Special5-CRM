'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen, Users, TrendingUp, CreditCard, Star, Calendar,
  CheckCircle2, Loader2, Video
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function parseBatchTiming(timing: string): { days: string[]; time: string } {
  if (!timing) return { days: [], time: '' };
  const parts = timing.split(', ');
  const days = parts[0]?.split('-') || [];
  const time = parts.slice(1).join(', ') || '';
  return { days, time };
}

function StatCard({ title, icon: Icon, color, children }: any) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <div style={{ padding: '0.5rem', backgroundColor: `${color}15`, borderRadius: '8px' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {children}
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [totalEarning, setTotalEarning] = useState(0);
  const [paidEarning, setPaidEarning] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setLoading(true);
      // Batches
      const { data: batchData } = await supabase
        .from('batches')
        .select('*, batch_students(count)')
        .eq('teacher_id', user!.id);
      const myBatches = batchData || [];
      setBatches(myBatches);

      // Student count across all batches
      const batchIds = myBatches.map((b: any) => b.batch_id);
      if (batchIds.length > 0) {
        const { data: bsData } = await supabase
          .from('batch_students')
          .select('student_id')
          .in('batch_id', batchIds);
        const unique = new Set((bsData || []).map((r: any) => r.student_id));
        setStudentCount(unique.size);
      }

      // Earnings
      const { data: earningsData } = await supabase
        .from('teacher_earnings')
        .select('earning_amount, paid_amount, is_paid')
        .eq('teacher_id', user!.id);
      const allEarnings = earningsData || [];
      setTotalEarning(allEarnings.reduce((s: number, e: any) => s + Number(e.earning_amount), 0));
      setPaidEarning(allEarnings.filter((e: any) => e.is_paid).reduce((s: number, e: any) => s + Number(e.paid_amount), 0));

      // Rating
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('rating')
        .eq('teacher_id', user!.id);
      if (ratingData && ratingData.length > 0) {
        const avg = ratingData.reduce((s: number, r: any) => s + r.rating, 0) / ratingData.length;
        setRating(Math.round(avg * 10) / 10);
      }

      // Self attendance today
      const today = new Date().toISOString().split('T')[0];
      const { data: att } = await supabase
        .from('teacher_attendance')
        .select('id')
        .eq('teacher_id', user!.id)
        .eq('date', today)
        .maybeSingle();
      if (att) setAttendanceMarked(true);

      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleSelfAttendance = async () => {
    if (!user) return;
    setLoadingAction(true);
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('teacher_attendance').insert([{ teacher_id: user.id, date: today, status: 'Present' }]);
    setAttendanceMarked(true);
    setLoadingAction(false);
  };

  const pendingEarning = totalEarning - paidEarning;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800' }}>Welcome back, {user?.name || 'Teacher'} 👋</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Here's your teaching overview.</p>
        </div>
        <div className="card" style={{ padding: '1rem', backgroundColor: attendanceMarked ? '#ecfdf5' : 'white', borderColor: attendanceMarked ? '#10b981' : 'var(--card-border)' }}>
          {attendanceMarked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: '600' }}>
              <CheckCircle2 size={20} /> Marked Present Today
            </div>
          ) : (
            <button onClick={handleSelfAttendance} disabled={loadingAction} className="btn btn-primary" style={{ backgroundColor: '#10b981' }}>
              {loadingAction ? <Loader2 className="animate-spin" size={18} /> : 'Record Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Tiles */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
          <StatCard title="Batches Assigned" icon={BookOpen} color="#6366f1">
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{batches.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Active batches</div>
          </StatCard>

          <StatCard title="Students Mapped" icon={Users} color="#0ea5e9">
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{studentCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Across all batches</div>
          </StatCard>

          <StatCard title="Total Earnings" icon={TrendingUp} color="#10b981">
            <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>₹{totalEarning.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Cumulative</div>
          </StatCard>

          <StatCard title="Payments" icon={CreditCard} color="#f59e0b">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#059669', fontWeight: '600' }}>Received</span>
                <span style={{ fontWeight: '700' }}>₹{paidEarning.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>Pending</span>
                <span style={{ fontWeight: '700' }}>₹{pendingEarning.toLocaleString()}</span>
              </div>
            </div>
          </StatCard>

          <StatCard title="Avg Rating" icon={Star} color="#ec4899">
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{rating !== null ? `${rating} ⭐` : 'N/A'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
              {rating !== null ? 'Cumulative score' : 'No ratings yet'}
            </div>
          </StatCard>
        </div>
      )}

      {/* Weekly Batch Schedule */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={20} color="var(--primary)" />
          <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Your Batch Schedule</h2>
        </div>
        <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem', minWidth: '700px' }}>
            {DAYS.map(day => {
              const dayBatches = batches.filter(b => {
                const { days } = parseBatchTiming(b.timing || '');
                return days.includes(day);
              });
              return (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    textAlign: 'center',
                    fontWeight: '700',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                    textTransform: 'uppercase',
                    padding: '0.5rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px'
                  }}>{day}</div>
                  {dayBatches.length === 0 ? (
                    <div style={{ padding: '1rem 0.5rem', textAlign: 'center', fontSize: '0.7rem', color: '#cbd5e1' }}>—</div>
                  ) : dayBatches.map(b => {
                    const { time } = parseBatchTiming(b.timing || '');
                    return (
                      <div key={b.batch_id} style={{
                        padding: '0.5rem',
                        backgroundColor: '#e0e7ff',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--primary)'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4f46e5' }}>{b.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#6366f1', marginTop: '0.2rem' }}>{time}</div>
                        {b.zoom_link && (
                          <a href={b.zoom_link} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#2563eb', marginTop: '0.25rem' }}>
                            <Video size={10} /> Join
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
