'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0); // 0 = current, -1 = last month, -2 = 2 months ago

  useEffect(() => {
    async function loadAttendance() {
      if (!user) return;
      setLoading(true);
      // Using generic mock until we build a student attendance tracker table matching teacher mappings
      // Assuming a table `attendance` exists or falling back to mock visually
      const { data } = await supabase.from('attendance').select('*').eq('student_id', user.id);
      if (data) setAttendance(data);
      setLoading(false);
    }
    loadAttendance();
  }, [user]);

  const displayDate = new Date();
  displayDate.setMonth(displayDate.getMonth() + monthOffset);
  
  const monthName = displayDate.toLocaleString('default', { month: 'long' });
  const year = displayDate.getFullYear();

  // Generate days
  const daysInMonth = new Date(year, displayDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(year, displayDate.getMonth(), 1).getDay(); // 0 is Sunday
  
  const calendarGrid = [];
  for (let i = 0; i < firstDay; i++) calendarGrid.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);

  // Mocks dynamic status: random simulation since table depends on teacher marking
  const getSimulatedStatus = (day: number) => {
     if (day > new Date().getDate() && monthOffset === 0) return 'future'; // Can't be attended yet
     if (day % 7 === 0) return 'absent';
     return 'present';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Attendance Calendar</h1>
        <p style={{ color: 'var(--muted)' }}>Track your monthly attendance status across all enrolled batches.</p>
      </div>

      {loading ? (
         <div style={{ padding: '4rem', display: 'flex', justifyContent: 'center' }}>
           <Loader2 className="animate-spin" size={32} color="var(--primary)" />
         </div>
      ) : (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)', padding: '1rem', borderRadius: '8px' }}>
              <button 
                onClick={() => setMonthOffset(m => Math.max(m - 1, -2))} 
                disabled={monthOffset === -2}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }}
              >
                <ChevronLeft size={20} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CalendarIcon size={20} color="var(--primary)" /> {monthName} {year}
              </h2>
              <button 
                onClick={() => setMonthOffset(m => Math.min(m + 1, 0))} 
                disabled={monthOffset === 0}
                className="btn btn-secondary" 
                style={{ padding: '0.5rem' }}
              >
                <ChevronRight size={20} />
              </button>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} style={{ fontWeight: '600', color: 'var(--muted)', fontSize: '0.875rem', paddingBottom: '0.5rem' }}>{day}</div>
              ))}
              
              {calendarGrid.map((day, ix) => {
                 if (day === null) return <div key={`empty-${ix}`} />;
                 
                 const status = getSimulatedStatus(day);
                 let bg = 'var(--secondary)';
                 let border = 'transparent';
                 if (status === 'present') { bg = '#ecfdf5'; border = '#10b981'; }
                 if (status === 'absent') { bg = '#fef2f2'; border = '#ef4444'; }
                 
                 const isToday = day === new Date().getDate() && monthOffset === 0;

                 return (
                   <div 
                     key={day} 
                     style={{ 
                       height: '60px', 
                       backgroundColor: bg,
                       border: `2px solid ${isToday ? 'var(--primary)' : border}`,
                       borderRadius: '8px', 
                       display: 'flex',
                       flexDirection: 'column',
                       justifyContent: 'center',
                       alignItems: 'center',
                       position: 'relative'
                     }}
                   >
                     <span style={{ fontWeight: '600', color: isToday ? 'var(--primary)' : 'inherit' }}>{day}</span>
                     {status === 'present' && <CheckCircle2 size={14} color="#10b981" style={{ marginTop: '4px' }} />}
                     {status === 'absent' && <XCircle size={14} color="#ef4444" style={{ marginTop: '4px' }} />}
                   </div>
                 );
              })}
           </div>

           <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="#10b981" /> Present</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={16} color="#ef4444" /> Absent</div>
           </div>

        </div>
      )}
    </div>
  );
}
