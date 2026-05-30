import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-build',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    const [studentsRes, profilesRes, feeRes, batchesRes, batchStudentsRes] = await Promise.all([
      supabaseAdmin.from('students').select('*').order('join_date', { ascending: false }),
      supabaseAdmin.from('profiles').select('id, email'),
      supabaseAdmin.from('fees').select('*'),
      supabaseAdmin.from('batches').select('batch_id, name'),
      supabaseAdmin.from('batch_students').select('batch_id, student_id')
    ]);

    if (studentsRes.error) throw studentsRes.error;

    const emailMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.email]));
    const batchMap = new Map((batchesRes.data || []).map((b: any) => [b.batch_id, b.name]));
    
    const studentBatches = new Map();
    if (batchStudentsRes.data) {
        batchStudentsRes.data.forEach((bs: any) => {
            studentBatches.set(bs.student_id, batchMap.get(bs.batch_id) || 'Unassigned');
        });
    }

    const feesMap = new Map();
    if (feeRes.data) {
       feeRes.data.forEach((fee: any) => {
         if (!fee.paid) {
            feesMap.set(fee.student_id, (feesMap.get(fee.student_id) || 0) + parseFloat(fee.amount));
         }
       });
    }

    const enriched = (studentsRes.data || []).map((s: any) => ({
      ...s,
      email: emailMap.get(s.student_id) || 'No Email',
      pending_fees: feesMap.get(s.student_id) || 0,
      mapped_batch: studentBatches.get(s.student_id) || 'Not Enrolled'
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
