'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';

export interface TeacherStats {
  batches_assigned: number;
  total_students_enrolled: number;
  attendance_avg: number;
  avg_test_marks: number;
  monthly_earnings: number;
}

export function useTeacherStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      try {
        setLoading(true);
        // Call the RPC function
        const { data, error } = await supabase.rpc('get_teacher_dashboard_stats', {
          p_teacher_id: user?.id || ''
        });

        if (error) throw error;
        setStats(data?.[0] || null);
      } catch (err) {
        console.error('Error fetching teacher stats:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return { stats, loading, error };
}

export function useTeacherBatches() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchBatches() {
      try {
        const { data, error } = await supabase
          .from('batches')
          .select(`
            *,
            batch_students (
              count
            )
          `)
          .eq('teacher_id', user?.id || '');
        if (error) throw error;
        setBatches(data || []);
      } catch (err) {
        console.error('Error fetching teacher batches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBatches();
  }, [user]);

  return { batches, loading };
}
