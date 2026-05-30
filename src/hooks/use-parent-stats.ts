'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';

export function useParentStats() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchParentData() {
      try {
        setLoading(true);
        // 1. Fetch Student linked to Parent
        const { data: students } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', user?.id)
          .limit(1);
        
        if (students && students.length > 0) {
          const s = students[0];
          setStudent(s);

          // 2. Fetch specific stats for that student
          const { data: attendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', s.student_id);
          
          const presentCount = attendance?.filter(a => a.status === 'Present').length || 0;
          const attnPct = attendance?.length ? Math.round((presentCount / attendance.length) * 100) : 0;

          const { data: tests } = await supabase
            .from('tests')
            .select('marks')
            .eq('student_id', s.student_id);
          
          const avgMarks = tests?.length ? Math.round(tests.reduce((sum, t) => sum + Number(t.marks), 0) / tests.length) : 0;

          const { data: fees } = await supabase
            .from('fees')
            .select('amount, paid')
            .eq('student_id', s.student_id);
          
          const totalPending = fees?.filter(f => !f.paid).reduce((sum, f) => sum + Number(f.amount), 0) || 0;

          setStats({
            attendance_percentage: attnPct,
            avg_test_marks: avgMarks,
            pending_fees: totalPending,
            is_fees_paid: totalPending === 0
          });
        }
      } catch (err) {
        console.error('Error fetching parent stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchParentData();
  }, [user]);

  return { student, stats, loading };
}
