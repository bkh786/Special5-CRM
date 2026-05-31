import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Fetch batch mappings bypassing RLS
    const { data: bData, error: bError } = await supabaseAdmin
      .from('batch_students')
      .select('batch_id')
      .eq('student_id', studentId);

    if (bError) throw bError;

    const batchIds = bData?.map(b => b.batch_id) || [];
    if (batchIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch batches
    const { data: batchesData, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('*')
      .in('batch_id', batchIds);

    if (batchError) throw batchError;

    // Manually map teachers
    const teacherIds = batchesData?.map(b => b.teacher_id).filter(Boolean) || [];
    let tMap = new Map();

    if (teacherIds.length > 0) {
      const { data: tData } = await supabaseAdmin
        .from('teachers')
        .select('teacher_id, name')
        .in('teacher_id', teacherIds);
      tMap = new Map(tData?.map((t: any) => [t.teacher_id, t.name]) || []);
    }

    const enriched = batchesData?.map((b: any) => ({
      ...b,
      teachers: { name: tMap.get(b.teacher_id) || 'TBD' }
    })) || [];

    return NextResponse.json(enriched);

  } catch (error: any) {
    console.error('Error fetching student classes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
