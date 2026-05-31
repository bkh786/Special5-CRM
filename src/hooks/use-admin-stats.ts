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

      const [
        { data: leads },
        { data: students },
        { data: teachers },
        { data: batches },
        { data: fees },
        { data: earnings }
      ] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('students').select('*'),
        supabase.from('teachers').select('*'),
        supabase.from('batches').select('*, batch_students(count)'),
        supabase.from('fees').select('*'),
        supabase.from('teacher_earnings').select('*')
      ]);

      let filteredLeads = leads || [];
      let filteredStudents = students || [];
      let filteredFees = fees || [];
      let filteredEarnings = earnings || [];

      if (month !== 'all' || year !== 'all') {
        const m = month === 'all' ? -1 : Number(month) - 1; // 0-indexed
        const y = year === 'all' ? -1 : Number(year);

        const filterByDate = (dateStr: string) => {
          if (!dateStr) return false;
          const d = new Date(dateStr);
          const matchMonth = m === -1 || d.getMonth() === m;
          const matchYear = y === -1 || d.getFullYear() === y;
          return matchMonth && matchYear;
        };

        filteredLeads = filteredLeads.filter(l => filterByDate(l.created_at));
        filteredStudents = filteredStudents.filter(s => filterByDate(s.join_date || s.created_at));
        // Fees has `month` string like "Jan-2024", but let's filter by created_at or payment_date
        filteredFees = filteredFees.filter(f => filterByDate(f.created_at));
        // Earnings has `month` string
        filteredEarnings = filteredEarnings.filter(e => filterByDate(e.created_at));
      }

      const total_leads = filteredLeads.length;
      const students_connected = filteredLeads.filter(l => l.status === 'Connected').length;
      const demo_scheduled_count = filteredLeads.filter(l => l.status === 'Demo Scheduled').length;
      const total_converted_students = filteredLeads.filter(l => l.status === 'Converted').length;
      
      const active_students = filteredStudents.length;
      const total_teachers = (teachers || []).length;
      const total_batches = (batches || []).length;

      const monthly_revenue = filteredFees.filter(f => f.paid).reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
      const total_pending_fees = filteredFees.filter(f => !f.paid).reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
      
      const total_teacher_payout_liability = filteredEarnings.reduce((acc, e) => {
        return acc + (Number(e.earning_amount) - Number(e.paid_amount));
      }, 0);

      let totalCapacity = 0;
      let totalEnrolled = 0;
      (batches || []).forEach(b => {
        totalCapacity += Number(b.max_students) || 5;
        totalEnrolled += Number(b.batch_students?.[0]?.count || 0);
      });
      const batch_fill_rate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

      setStats({
        total_leads,
        students_connected,
        demo_scheduled_count,
        active_students,
        total_converted_students,
        total_teachers,
        total_batches,
        monthly_revenue,
        total_pending_fees,
        total_teacher_payout_liability,
        batch_fill_rate
      });
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
        const [ { data: fees }, { data: earnings } ] = await Promise.all([
          supabase.from('fees').select('*'),
          supabase.from('teacher_earnings').select('*')
        ]);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const trendDataMap = new Map();
        
        const last6 = Array.from({length: 6}).map((_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const item = { month: months[d.getMonth()], revenue: 0, cost: 0, net_margin: 0 };
          trendDataMap.set(key, item);
          return { key, item };
        });

        (fees || []).forEach((f: any) => {
          if (!f.paid) return;
          const d = f.payment_date ? new Date(f.payment_date) : new Date(f.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (trendDataMap.has(key)) {
            trendDataMap.get(key).revenue += Number(f.amount || 0);
          }
        });

        (earnings || []).forEach((e: any) => {
          const d = new Date(e.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (trendDataMap.has(key)) {
            trendDataMap.get(key).cost += Number(e.earning_amount || 0);
          }
        });

        const trendData = last6.map(({ item }) => {
          item.net_margin = item.revenue - item.cost;
          // Add a tiny fallback value so empty charts still render flat lines
          if (item.revenue === 0 && item.cost === 0) {
            item.revenue = 0.1;
            item.cost = 0.1;
            item.net_margin = 0.1;
          }
          return item;
        });

        setTrends(trendData);
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
        const { data: leads } = await supabase.from('leads').select('*');
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const today = new Date();
        const trendDataMap = new Map();
        
        const last6 = Array.from({length: 6}).map((_, i) => {
          const d = new Date(today.getFullYear(), today.getMonth() - 5 + i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const item = { month: months[d.getMonth()], incoming_leads: 0, converted_leads: 0 };
          trendDataMap.set(key, item);
          return { key, item };
        });

        (leads || []).forEach((l: any) => {
          const d = new Date(l.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (trendDataMap.has(key)) {
            trendDataMap.get(key).incoming_leads += 1;
            if (l.status === 'Converted') {
               trendDataMap.get(key).converted_leads += 1;
            }
          }
        });

        const trendData = last6.map(({ item }) => {
          if (item.incoming_leads === 0 && item.converted_leads === 0) {
            item.incoming_leads = 0.1;
            item.converted_leads = 0.1;
          }
          return item;
        });

        setTrends(trendData);
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
