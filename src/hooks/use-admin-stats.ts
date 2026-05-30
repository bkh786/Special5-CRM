'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface AdminStats {
  total_leads: number;
  students_connected: number;
  demo_scheduled_count: number;
  active_students: number;
  total_converted_students: number;
  total_teachers: number;
  total_batches: number;
  monthly_revenue: number;
  total_pending_fees: number;
  total_teacher_payout_liability: number;
  batch_fill_rate: number;
}

export function useAdminStats(month: number | string = 'all', year: number | string = 'all') {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const currentMonth = month === 'all' ? null : Number(month);
      const currentYear = year === 'all' ? null : Number(year);

      // Call the RPC for dynamic filtering
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
        p_month: currentMonth,
        p_year: currentYear
      });

      if (error) throw error;
      setStats(Array.isArray(data) ? data[0] : data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          console.log('Database changed, refreshing stats...', payload);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [month, year]);

  return { stats, loading, error, refresh: fetchStats };
}

export function useRevenueTrends() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const { data, error } = await supabase
          .from('view_revenue_trends')
          .select('*');
        if (error) throw error;
        setTrends(data?.reverse() || []);
      } catch (err) {
        console.error('Error fetching revenue trends:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  return { trends, loading };
}

export function useLeadTrends() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const { data, error } = await supabase
          .from('view_lead_trends')
          .select('*');
        if (error) throw error;
        setTrends(data?.reverse() || []);
      } catch (err) {
        console.error('Error fetching lead trends:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, []);

  return { trends, loading };
}
