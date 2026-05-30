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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get('teacher_id');

    let batchesQuery = supabaseAdmin.from('batches').select('*').order('created_at', { ascending: false });
    
    if (teacherId) {
       batchesQuery = batchesQuery.eq('teacher_id', teacherId);
    }

    const [batchesRes, teachersRes, studentsRes] = await Promise.all([
      batchesQuery,
      supabaseAdmin.from('teachers').select('teacher_id, name'),
      supabaseAdmin.from('batch_students').select('batch_id')
    ]);

    if (batchesRes.error) {
      console.error('Batch fetch error via secure API:', batchesRes.error);
      throw batchesRes.error;
    }

    const tMap = new Map(teachersRes.data?.map((t: any) => [t.teacher_id, t.name]) || []);
    
    // Calculate mappings safely
    const batchCounts = new Map();
    if (studentsRes.data) {
       studentsRes.data.forEach((s: any) => {
          batchCounts.set(s.batch_id, (batchCounts.get(s.batch_id) || 0) + 1);
       });
    }

    const enriched = batchesRes.data.map((b: any) => ({
      ...b,
      teachers: { name: tMap.get(b.teacher_id) || 'Unassigned' },
      batch_students: [{ count: batchCounts.get(b.batch_id) || 0 }]
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { error: insertError } = await supabaseAdmin.from('batches').insert([payload]);

    if (insertError) throw insertError;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PATCH(req: Request) {
  try {
    const payload = await req.json();
    const { batch_id, ...updates } = payload;
    
    if (!batch_id) {
       return NextResponse.json({ error: 'Batch ID is required for updates' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('batches')
      .update(updates)
      .eq('batch_id', batch_id);

    if (updateError) throw updateError;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
