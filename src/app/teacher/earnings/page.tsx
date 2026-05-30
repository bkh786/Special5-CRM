'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, CreditCard, Loader2, RefreshCw, IndianRupee, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

function StatCard({ title, value, subtitle, icon: Icon, color, splitView }: any) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        <div style={{ padding: '0.5rem', backgroundColor: `${color}18`, borderRadius: '8px' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {splitView ? splitView : (
        <>
          <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>{value}</div>
          {subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{subtitle}</div>}
        </>
      )}
    </div>
  );
}

export default function TeacherEarningsPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEarnings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('teacher_earnings')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });
    setEarnings(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEarnings(); }, [loadEarnings]);

  const currentMonthKey = new Date().toLocaleString('default', { month: 'short', year: 'numeric' }).replace(' ', '-');

  const totalEarning = earnings.reduce((s, e) => s + Number(e.earning_amount), 0);
  const thisMonthEarning = earnings.filter(e => e.month === currentMonthKey).reduce((s, e) => s + Number(e.earning_amount), 0);
  const payoutReceived = earnings.reduce((s, e) => s + Number(e.paid_amount), 0);
  const payoutPending = totalEarning - payoutReceived;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Earnings</h1>
          <p style={{ color: 'var(--muted)' }}>Your earning history and payout status managed by the admin.</p>
        </div>
        <button onClick={loadEarnings} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <StatCard
              title="Total Earning"
              value={`₹${totalEarning.toLocaleString()}`}
              subtitle="All time cumulative"
              icon={TrendingUp}
              color="#10b981"
            />
            <StatCard
              title="Earning This Month"
              value={`₹${thisMonthEarning.toLocaleString()}`}
              subtitle={currentMonthKey}
              icon={IndianRupee}
              color="#6366f1"
            />
            <StatCard
              title="Payout Received"
              value={`₹${payoutReceived.toLocaleString()}`}
              subtitle="Total paid out"
              icon={CreditCard}
              color="#0ea5e9"
            />
            <StatCard
              title="Payout Pending"
              value={`₹${payoutPending.toLocaleString()}`}
              subtitle={payoutPending > 0 ? 'Awaiting admin release' : 'All cleared!'}
              icon={Clock}
              color={payoutPending > 0 ? '#f59e0b' : '#10b981'}
            />
          </div>

          {/* Earnings History Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)' }}>
              <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Month-wise Earning History</h2>
            </div>
            {earnings.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                No earnings records yet. Your admin will update this monthly.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--card-border)' }}>
                    <tr>
                      {['Month', 'Students', 'Earning', 'Paid Out', 'Pending', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '1rem 1.25rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map(e => {
                      const pending = Number(e.earning_amount) - Number(e.paid_amount);
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: '600' }}>{e.month}</td>
                          <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)' }}>{e.students_count}</td>
                          <td style={{ padding: '1rem 1.25rem', fontWeight: '700' }}>₹{Number(e.earning_amount).toLocaleString()}</td>
                          <td style={{ padding: '1rem 1.25rem', color: '#059669', fontWeight: '600' }}>₹{Number(e.paid_amount).toLocaleString()}</td>
                          <td style={{ padding: '1rem 1.25rem', color: pending > 0 ? '#f59e0b' : '#94a3b8', fontWeight: '600' }}>₹{pending.toLocaleString()}</td>
                          <td style={{ padding: '1rem 1.25rem' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              padding: '3px 10px',
                              borderRadius: '20px',
                              backgroundColor: e.is_paid ? '#ecfdf5' : '#fef3c7',
                              color: e.is_paid ? '#059669' : '#d97706'
                            }}>
                              {e.is_paid ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
