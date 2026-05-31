'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Star, CreditCard, Video, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Data state
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [avgMarks, setAvgMarks] = useState(0);
  const [activeCourses, setActiveCourses] = useState(0);
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [feesPending, setFeesPending] = useState(0);
  const [pendingAssessments, setPendingAssessments] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      setLoading(true);

      // 1. Fetch performance (assessment_scores)
      const { data: scores } = await supabase
        .from('assessment_scores')
        .select('*, assessments(created_at)')
        .eq('student_id', user.id);

      if (scores && scores.length > 0) {
        let total = 0;
        const monthGroups: Record<string, { sum: number, count: number }> = {};
        
        scores.forEach(s => {
          total += s.score || 0;
          
          // Use assessment creation date or score creation date
          const date = new Date(s.assessments?.created_at || s.created_at || new Date());
          const monthStr = date.toLocaleString('default', { month: 'short' });
          
          if (!monthGroups[monthStr]) monthGroups[monthStr] = { sum: 0, count: 0 };
          monthGroups[monthStr].sum += s.score || 0;
          monthGroups[monthStr].count += 1;
        });
        
        setAvgMarks(Math.round(total / scores.length));
        
        // Convert map to array for chart, sorted by month roughly
        const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = Object.entries(monthGroups).map(([name, data]) => ({
          name,
          marks: Math.round(data.sum / data.count)
        })).sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
        
        setPerformanceData(chartData);
      }

      // 2. Fetch active courses
      const { count: courseCount } = await supabase
        .from('batch_students')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);
      if (courseCount) setActiveCourses(courseCount);

      // 3. Fetch attendance
      const { data: attData } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', user.id);
      if (attData && attData.length > 0) {
        const present = attData.filter(a => a.status === 'Present').length;
        setAttendancePercent(Math.round((present / attData.length) * 100));
      }

      // 4. Fetch pending fees (from fees table, where status = pending or not paid)
      const { data: feesData } = await supabase
        .from('fees')
        .select('amount, status')
        .eq('student_id', user.id)
        .eq('status', 'pending');
      
      if (feesData) {
        const pendingAmount = feesData.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
        setFeesPending(pendingAmount);
      }

      // 5. Fetch recent homework / pending assessments
      // Get batch ids
      const { data: bData } = await supabase.from('batch_students').select('batch_id').eq('student_id', user.id);
      const mappedBatchIds = bData?.map(b => b.batch_id) || [];
      if (mappedBatchIds.length > 0) {
         const { data: aData } = await supabase
           .from('assessments')
           .select('*, batches(subject)')
           .in('batch_id', mappedBatchIds)
           .order('created_at', { ascending: false });
           
         if (aData) {
            const evaluatedMap = new Set((scores || []).map(s => s.assessment_id));
            const pending = aData.filter(a => !evaluatedMap.has(a.assessment_id || a.id)).slice(0, 3); // top 3 pending
            setPendingAssessments(pending);
         }
      }

      setLoading(false);
    }
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={40} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: 'var(--foreground)' }}>
          Hello, {user?.name || 'Student'} 🎓
        </h1>
        <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Here is your academic overview for the current month.</p>
      </div>

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <a href="/student/classes" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #3b82f6', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Active Courses</span>
            <BookOpen size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{activeCourses}</div>
        </a>

        <a href="/student/attendance" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #10b981', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Attendance %</span>
            <Calendar size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{attendancePercent}%</div>
        </a>

        <a href="/student/performance" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #f59e0b', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Avg Marks</span>
            <Star size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{avgMarks}%</div>
        </a>

        <a href="/student/fees" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #ef4444', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Fees Pending</span>
            <CreditCard size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>₹{feesPending}</div>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Performance Chart */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Monthly Assessment Performance</h2>
          </div>
          <div style={{ padding: '1.25rem', height: '300px' }}>
            {performanceData.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--muted)' }}>
                No performance data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMarks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  />
                  <Area type="monotone" dataKey="marks" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMarks)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fees / Attendance Split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Fees Overview</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {feesPending > 0 ? (
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                   <div>
                     <div style={{ fontWeight: '600', color: '#991b1b' }}>Pending Dues</div>
                     <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Please clear your dues</div>
                   </div>
                   <div style={{ fontWeight: '700', color: '#991b1b' }}>₹{feesPending}</div>
                 </div>
               ) : (
                 <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                   <div>
                     <div style={{ fontWeight: '600', color: '#065f46' }}>All Clear</div>
                     <div style={{ fontSize: '0.75rem', color: '#059669' }}>No pending fees!</div>
                   </div>
                   <div style={{ fontWeight: '700', color: '#065f46' }}>
                     <CheckCircle2 size={18} />
                   </div>
                 </div>
               )}
             </div>
          </div>
          
          <div className="card" style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Pending Assessments</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingAssessments.length === 0 ? (
                  <div style={{ padding: '0.75rem', color: 'var(--muted)', textAlign: 'center', fontSize: '0.875rem' }}>
                    No pending assessments!
                  </div>
                ) : (
                  pendingAssessments.map(a => (
                    <div key={a.assessment_id || a.id} style={{ padding: '0.75rem', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{a.title}</span>
                      <a href={a.google_form_link} target="_blank" style={{ fontSize: '0.75rem', color: '#d97706', backgroundColor: '#fff7ed', padding: '0.25rem 0.5rem', borderRadius: '12px', textDecoration: 'none' }}>Take Test</a>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
