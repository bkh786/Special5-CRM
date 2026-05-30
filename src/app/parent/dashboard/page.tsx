'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  CreditCard,
  MessageCircle,
  FileDown,
  Loader2,
  ChevronRight,
  Send,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useParentStats } from '@/hooks/use-parent-stats';
import { supabase } from '@/lib/supabase-client';

const ProgressDonut = ({ percentage, label, color }: any) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
          <circle 
            cx="40" cy="40" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="6" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '0.875rem',
          fontWeight: '700',
          color: 'var(--foreground)'
        }}>
          {percentage}%
        </div>
      </div>
      <span style={{ fontSize: '0.625rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const { student, stats, loading } = useParentStats();
  const [activeTab, setActiveTab] = useState('performance');

  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    if (!student) return;
    async function fetchReports() {
      const { data } = await supabase.from('reports').select('*').eq('student_id', student.student_id);
      setReports(data || []);
    }
    fetchReports();
  }, [student]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <HelpCircle size={48} color="var(--muted)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontWeight: '700' }}>Waiting for profile link</h3>
        <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>Please contact Admin to link your student to this account.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Academic Journey</h1>
          <p style={{ color: 'var(--muted)' }}>Tracking progress for <strong>{student.name}</strong> • Grade {student.class}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary">
            <MessageCircle size={18} />
            Contact Teacher
          </button>
          <button className="btn btn-primary">
            <CreditCard size={18} />
            Pay Remaining Fees
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Core Stats Donut Card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: 'white' }}>
          <ProgressDonut percentage={stats.attendance_percentage} label="Attendance" color="#6366f1" />
          <ProgressDonut percentage={stats.avg_test_marks} label="Avg. Score" color="#10b981" />
          <ProgressDonut percentage={100} label="Homework" color="#f59e0b" />
        </div>

        {/* Fees Quick Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: stats.is_fees_paid ? '#ecfdf5' : '#fef2f2', 
            color: stats.is_fees_paid ? '#059669' : '#dc2626', 
            borderRadius: '16px' 
          }}>
            <CreditCard size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>Fees Status</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.125rem' }}>
              {stats.is_fees_paid ? 'Paid' : `₹${stats.pending_fees.toLocaleString()}`}
            </h3>
            <p style={{ fontSize: '0.625rem', color: 'var(--muted)', marginTop: '0.125rem' }}>
              {stats.is_fees_paid ? 'No pending dues' : 'Action Required'}
            </p>
          </div>
        </div>

        {/* Schedule Quick Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#eff6ff', 
            color: '#2563eb', 
            borderRadius: '16px' 
          }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600' }}>Mode of Study</p>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginTop: '0.125rem' }}>{student.mode}</h3>
            <p style={{ fontSize: '0.625rem', color: 'var(--muted)', marginTop: '0.125rem' }}>{student.subjects || 'All Subjects'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Performance & Report Module */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ 
            padding: '1.25rem', 
            borderBottom: '1px solid var(--card-border)',
            display: 'flex',
            gap: '1.5rem'
          }}>
            <button 
              onClick={() => setActiveTab('performance')} 
              style={{ fontWeight: '700', fontSize: '0.875rem', color: activeTab === 'performance' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'performance' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.25rem' }}
            >Tests & Marks</button>
            <button 
              onClick={() => setActiveTab('reports')} 
              style={{ fontWeight: '700', fontSize: '0.875rem', color: activeTab === 'reports' ? 'var(--primary)' : 'var(--muted)', borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : 'none', paddingBottom: '0.25rem' }}
            >Monthly Reports</button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {activeTab === 'performance' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--secondary)', borderRadius: '12px' }}>
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '0.875rem' }}>Mathematics - Chapter 4</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Latest Test Results</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '800', color: '#10b981' }}>94%</div>
                    <div style={{ fontSize: '0.625rem', color: '#059669', fontWeight: '600' }}>EXCELLENT</div>
                  </div>
                </div>
                {/* Fallback to list message */}
                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '1rem' }}>Historical test scores are synchronized and visible below.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reports.length > 0 ? reports.map((report, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', border: '1px solid var(--card-border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <FileDown size={20} color="var(--muted)" />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>Report Card - {report.month}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--muted)' }}>Overall Grade: A+</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                      <FileDown size={16} />
                    </button>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    <Award size={32} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
                    <p style={{ fontSize: '0.875rem' }}>No monthly reports available yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Feedback & Engagement Module */}
        <div className="card">
          <h3 style={{ fontWeight: '700', marginBottom: '1.25rem' }}>Support & Feedback</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ 
              padding: '1.25rem', 
              backgroundColor: '#eff6ff', 
              borderRadius: '16px',
              border: '1px solid #dbeafe'
            }}>
              <h4 style={{ fontWeight: '700', fontSize: '0.875rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} />
                Student remarks from Ms. Aisha
              </h4>
              <p style={{ fontSize: '0.8125rem', color: '#1e40af', marginTop: '0.5rem', lineHeight: '1.5' }}>
                "Rohan is showing remarkable focus in Geometry basics. We are now transitioning into more advanced topics."
              </p>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
               <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Quick Support Ticket</label>
               <textarea 
                className="input" 
                placeholder="Describe your query or parent feedback here..."
                rows={3}
               />
               <button className="btn btn-primary" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}>
                <Send size={18} />
                Send Connection Request
               </button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none', color: '#ef4444' }}>
                <AlertCircle size={16} />
                Complaint
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                <HelpCircle size={16} />
                FAQ
              </button>
            </div>
          </div>
        </div>
      </div>

       {/* My Batches / Class Schedule Visualization */}
       <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--card-border)' }}>
          <h3 style={{ fontWeight: '700' }}>Weekly Academic Timeline</h3>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Subject</th>
                <th>Timing</th>
                <th>Mode</th>
                <th>Tutor Status</th>
              </tr>
            </thead>
            <tbody>
              {['Monday', 'Wednesday', 'Friday'].map((day, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: '700' }}>{day}</td>
                  <td>Mathematics (Advanced)</td>
                  <td><span style={{ fontWeight: '600' }}>5:00 PM - 6:30 PM</span></td>
                  <td>{student.mode}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: '600', fontSize: '0.75rem' }}>
                      <CheckCircle2 size={14} /> Confirmed
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
