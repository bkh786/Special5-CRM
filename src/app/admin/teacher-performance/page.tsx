'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, BarChart3, Users, Loader2 } from 'lucide-react';

export default function TeacherPerformancePage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: tData } = await supabase.from('teachers').select('*');
      if (tData) setTeachers(tData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const loadTeacherDetails = async (teacherId: string) => {
    const teacher = teachers.find(t => t.teacher_id === teacherId);
    setSelectedTeacher(teacher);
    
    // Pull historical ratings for drill down
    const { data } = await supabase
      .from('ratings')
      .select('*, students(name, class)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
      
    if (data) setRatings(data);
  };

  // Mocking 6-month historical trend since we don't have dense data
  const trendData = [
    { month: 'Oct', rating: 4.2 },
    { month: 'Nov', rating: 4.5 },
    { month: 'Dec', rating: 4.6 },
    { month: 'Jan', rating: 4.8 },
    { month: 'Feb', rating: 4.7 },
    { month: 'Mar', rating: 4.9 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Teacher Performance Tracking</h1>
          <p style={{ color: 'var(--muted)' }}>Analyze student feedback and aggregated star ratings.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - List of Teachers */}
        <div className="card" style={{ gridColumn: 'span 1', padding: '0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: '600' }}>Faculty Directory</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>
            ) : teachers.map(t => (
              <button 
                key={t.teacher_id}
                onClick={() => loadTeacherDetails(t.teacher_id)}
                style={{ 
                  display: 'flex', 
                  width: '100%',
                  alignItems: 'center', 
                  gap: '1rem', 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--card-border)',
                  backgroundColor: selectedTeacher?.teacher_id === t.teacher_id ? '#f1f5f9' : 'transparent',
                  textAlign: 'left'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {t.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{t.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.subjects || 'General'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {selectedTeacher ? (
            <>
              <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedTeacher.name}</h2>
                  <p style={{ color: 'var(--muted)' }}>{selectedTeacher.experience || 'Faculty'} • Avg. Rating: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>4.8/5</span></p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <Star size={24} color="#f59e0b" fill="#f59e0b" />
                  <Star size={24} color="#f59e0b" />
                </div>
              </div>

              <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>6-Month Rating Trend</h3>
                </div>
                <div style={{ padding: '1.25rem', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[3, 5]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="rating" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: '0' }}>
                 <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Recent Student Feedback</h3>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   {ratings.length > 0 ? ratings.map(r => (
                     <div key={r.id} style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', display: 'flex', gap: '1rem' }}>
                       <div style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '0.5rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', height: 'fit-content' }}>
                         {r.rating} <Star size={14} style={{ marginLeft: '4px' }} fill="#b45309" />
                       </div>
                       <div>
                         <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{r.students?.name || 'Anonymous Student'}</div>
                         <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--foreground)' }}>
                           "{r.feedback || 'No remarks provided.'}"
                         </div>
                       </div>
                     </div>
                   )) : (
                     <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>No feedback collected yet.</div>
                   )}
                 </div>
              </div>
            </>
          ) : (
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              <Users size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--foreground)' }}>Select a Teacher</h3>
              <p>Click on a faculty member to visualize their performance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
