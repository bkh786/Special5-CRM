'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { 
  Users, 
  CreditCard, 
  BookOpen, 
  Mail, 
  Phone, 
  ArrowLeft,
  Loader2,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudentData() {
      if (!id) return;
      setLoading(true);

      // 1. Fetch Student Profile with Profile/Account info
      const { data: sData, error: sError } = await supabase
        .from('students')
        .select('*, profiles:student_id(email, phone)')
        .eq('student_id', id)
        .single();

      if (sError) {
        console.error('Error fetching student:', sError);
        router.push('/admin/students');
        return;
      }
      setStudent(sData);

      // 2. Fetch Assigned Batches
      const { data: bMapping } = await supabase
        .from('batch_students')
        .select('*, batches(*, profiles:teacher_id(name))')
        .eq('student_id', id);
      
      const batchList = bMapping?.map((m: any) => ({
        ...m.batches,
        teacher_name: m.batches?.profiles?.name || 'TBD'
      })) || [];
      setBatches(batchList);

      // 3. Fetch Fee History
      const { data: fData } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', id)
        .order('month', { ascending: false });
      setFees(fData || []);

      setLoading(false);
    }
    loadStudentData();
  }, [id]);

  const handleMarkPaid = async (feeId: string) => {
    setActionLoading(feeId);
    const { error } = await supabase
      .from('fees')
      .update({ 
        paid: true, 
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: 'Cash/Manual'
      })
      .eq('fee_id', feeId);

    if (!error) {
       setFees(prev => prev.map(f => f.fee_id === feeId ? { ...f, paid: true, payment_mode: 'Manual', payment_date: new Date() } : f));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  if (!student) return null;

  const totalPending = fees.filter(f => !f.paid).reduce((acc, f) => acc + Number(f.amount), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link href="/admin/students" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {student.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{student.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                 <Users size={14} /> Class: {student.class}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                 <Calendar size={14} /> Joined: {new Date(student.join_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="card" style={{ borderLeft: '4px solid #0369a1' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Active Batches</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{batches.length}</div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${totalPending > 0 ? '#dc2626' : '#10b981'}` }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Fees Pending</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalPending > 0 ? '#dc2626' : '#10b981' }}>
            ₹{totalPending.toLocaleString()}
          </div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Standard Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{student.monthly_fee?.toLocaleString()}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #64748b' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Teaching Mode</div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{student.mode || 'Online'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Enrollment & Workload */}
        <div className="col-span-2">
           <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', backgroundColor: '#f8fafc' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={20} color="var(--primary)" /> Academic Enrollment
                </h2>
              </div>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Batch Code</th>
                      <th>Subject</th>
                      <th>Instructor</th>
                      <th>Days/Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{batch.name}</td>
                        <td>{batch.subject}</td>
                        <td>{batch.teacher_name}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{batch.timing}</td>
                      </tr>
                    ))}
                    {batches.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No active batches found for this profile.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="card" style={{ padding: '0', overflow: 'hidden', marginTop: '1.5rem' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--card-border)', backgroundColor: '#fffcf0' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#854d0e' }}>
                  <CreditCard size={20} /> Financial Ledger (Fees)
                </h2>
              </div>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Billing Month</th>
                      <th>Amount</th>
                      <th>Paid / Unpaid</th>
                      <th>Payment Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((fee, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{fee.month}</td>
                        <td>₹{fee.amount}</td>
                        <td>
                          {fee.paid ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#059669', fontSize: '0.8125rem', fontWeight: '700' }}>
                               <CheckCircle2 size={14} /> Paid
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626', fontSize: '0.8125rem', fontWeight: '700' }}>
                               <AlertCircle size={14} /> Unpaid
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                           {fee.paid ? (
                             `${fee.payment_mode || 'Online'} on ${new Date(fee.payment_date).toLocaleDateString()}`
                           ) : (
                             <button 
                               onClick={() => handleMarkPaid(fee.fee_id)} 
                               disabled={!!actionLoading}
                               className="btn btn-primary" 
                               style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                             >
                               {actionLoading === fee.fee_id ? 'Updating...' : 'Mark as Paid'}
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                    {fees.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No billing records have been generated yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right: Personal Information */}
        <div className="col-span-1">
           <div className="card">
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
                Parent / Primary Contact
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Primary Email</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Mail size={16} color="var(--primary)" /> {student.profiles?.email || 'No email registered'}
                    </div>
                 </div>
                 <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Primary Phone</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <Phone size={16} color="var(--primary)" /> {student.profiles?.phone || 'No phone registered'}
                    </div>
                 </div>
                 <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                    <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }}>Edit Basic Info</button>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Send Email Alert</button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
