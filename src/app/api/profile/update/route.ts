import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key-for-build';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: Request) {
  try {
    const { userId, role, phone, email } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. Update master profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ phone, email })
      .eq('id', userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 2. Conditionally update subsequent role tables mapping
    if (role === 'TEACHER') {
      const { error: teacherError } = await supabaseAdmin
        .from('teachers')
        .update({ phone, email })
        .eq('teacher_id', userId);
        
      if (teacherError) {
        return NextResponse.json({ error: teacherError.message }, { status: 500 });
      }
    } else if (role === 'STUDENT') {
      // Students update the leads payload (since CRM port maps here)
      const { error: studentError } = await supabaseAdmin
        .from('leads')
        .update({ phone })
        .eq('lead_id', userId);
        
      if (studentError) {
         console.warn("Could not target lead payload for update, possibly already migrated safely", studentError);
      }
    }

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
