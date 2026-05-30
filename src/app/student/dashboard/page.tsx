'use client';

import React from 'react';
import { BookOpen, Calendar, Star, CreditCard, Video, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const performanceData = [
  { name: 'Aug', marks: 65 },
  { name: 'Sep', marks: 72 },
  { name: 'Oct', marks: 85 },
  { name: 'Nov', marks: 82 },
  { name: 'Dec', marks: 95 },
];

export default function StudentDashboard() {
  const { user } = useAuth();

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
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>3</div>
        </a>

        <a href="/student/attendance" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #10b981', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Attendance %</span>
            <Calendar size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>92%</div>
        </a>

        <a href="/student/performance" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #f59e0b', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Avg Marks</span>
            <Star size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>85%</div>
        </a>

        <a href="/student/fees" className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #ef4444', textDecoration: 'none', color: 'inherit', height: '140px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Fees Pending</span>
            <CreditCard size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>₹2,500</div>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Performance Chart */}
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>Subject-wise Performance Chart</h2>
          </div>
          <div style={{ padding: '1.25rem', height: '300px' }}>
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
          </div>
        </div>

        {/* Fees / Attendance Split */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Fees & Invoices</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                 <div>
                   <div style={{ fontWeight: '600', color: '#991b1b' }}>Pending: November Fee</div>
                   <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>Due: 5th Nov</div>
                 </div>
                 <div style={{ fontWeight: '700', color: '#991b1b' }}>₹2,500</div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                 <div>
                   <div style={{ fontWeight: '600', color: '#065f46' }}>Paid: October Fee</div>
                   <div style={{ fontSize: '0.75rem', color: '#059669' }}>Paid on: 4th Oct</div>
                 </div>
                 <div style={{ fontWeight: '700', color: '#065f46' }}>
                   <CheckCircle2 size={18} />
                 </div>
               </div>
             </div>
          </div>
          
          <div className="card" style={{ flex: 1 }}>
             <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Recent Homework</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.75rem', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Maths Worksheet 4</span>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', backgroundColor: '#fff7ed', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>Due Tomorrow</span>
                </div>
                <div style={{ padding: '0.75rem', border: '1px solid var(--card-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Science Notes Ch-3</span>
                  <span style={{ fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.25rem 0.5rem', borderRadius: '12px' }}>Submitted</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
