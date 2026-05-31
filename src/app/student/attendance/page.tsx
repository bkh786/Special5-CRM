'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Loader2, XCircle } from 'lucide-react';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase.from('attendance').select('*').eq('student_id', user.id);
      if (data) setAttendance(data);
      setLoading(false);
    }
    loadAttendance();
  }, [user]);

  const totalSessions = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'Present').length;
  const attendancePercentage = totalSessions === 0 ? 0 : Math.round((presentDays / totalSessions) * 100);

  // Map to easily look up status by date string (YYYY-MM-DD)
  const attendanceMap: Record<string, string> = {};
  attendance.forEach(a => {
    attendanceMap[a.date] = a.status;
  });

  const renderCalendar = (monthOffset: number) => {
    const displayDate = new Date();
    displayDate.setMonth(displayDate.getMonth() - monthOffset); // 0 = current, 1 = last, 2 = 2 months ago
    
    const monthName = displayDate.toLocaleString('default', { month: 'long' });
    const year = displayDate.getFullYear();

    const daysInMonth = new Date(year, displayDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(year, displayDate.getMonth(), 1).getDay(); // 0 is Sunday
    
    const calendarGrid = [];
    for (let i = 0; i < firstDay; i++) calendarGrid.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarGrid.push(i);

    return (
      <div className="card" style={{ flex: 1, minWidth: '250px', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
          <CalendarIcon size={18} color="var(--primary)" /> {monthName} {year}
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
             <div key={i} style={{ fontWeight: '600', color: 'var(--muted)', fontSize: '0.75rem', paddingBottom: '0.25rem' }}>{day}</div>
          ))}
          
          {calendarGrid.map((day, ix) => {
             if (day === null) return <div key={`empty-${ix}`} />;
             
             // format date as YYYY-MM-DD
             const monthStr = String(displayDate.getMonth() + 1).padStart(2, '0');
             const dayStr = String(day).padStart(2, '0');
             const dateStr = `${year}-${monthStr}-${dayStr}`;
             
             const status = attendanceMap[dateStr];
             let bg = 'transparent';
             let border = 'transparent';
             let color = 'var(--foreground)';
             
             if (status === 'Present') { bg = '#ecfdf5'; border = '#10b981'; color = '#059669'; }
             else if (status === 'Absent') { bg = '#fef2f2'; border = '#ef4444'; color = '#dc2626'; }
             
             // Local time comparison
             const today = new Date();
             const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
             const isToday = dateStr === todayStr;

             if (isToday && status === undefined) {
               bg = 'var(--secondary)';
               border = 'var(--primary)';
             } else if (status === undefined) {
               bg = 'var(--secondary)';
             }

             return (
               <div 
                 key={day} 
                 style={{ 
                   height: '35px', 
                   backgroundColor: bg,
                   border: `2px solid ${border}`,
                   borderRadius: '6px', 
                   display: 'flex',
                   flexDirection: 'column',
                   justifyContent: 'center',
                   alignItems: 'center',
                   position: 'relative',
                   color: color
                 }}
               >
                 <span style={{ fontWeight: isToday ? '800' : '600', fontSize: '0.8rem' }}>{day}</span>
               </div>
             );
          })}
        </div>
      </div>
    );
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
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #3b82f6', height: '120px', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Total Session Days</div>
              <div style={{ fontSize: '2rem', fontWeight: '800' }}>{totalSessions}</div>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #10b981', height: '120px', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Days Present</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981' }}>{presentDays}</div>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '4px solid #f59e0b', height: '120px', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted)' }}>Attendance %</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f59e0b' }}>{attendancePercentage}%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {renderCalendar(3)}
            {renderCalendar(2)}
            {renderCalendar(1)}
            {renderCalendar(0)}
          </div>

          <div className="card" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '1.5rem', fontSize: '0.875rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#ecfdf5', border: '2px solid #10b981' }} /> Present</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fef2f2', border: '2px solid #ef4444' }} /> Absent</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--secondary)', border: '2px solid transparent' }} /> No Session</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: 'var(--secondary)', border: '2px solid var(--primary)' }} /> Today</div>
          </div>
        </>
      )}
    </div>
  );
}
