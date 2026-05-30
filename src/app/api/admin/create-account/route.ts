import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize external services securely server-side
const resend = new Resend(process.env.RESEND_API_KEY || 'mock_key');
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, role, details } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Create-account flow might fail due to RLS if standard keys are restricted.');
    }

    // 1. Create Supabase Auth User
    const defaultPassword = role.toUpperCase() === 'TEACHER' ? 'teacher@special5' : 'Special5@1234';
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true, // Auto-confirm to bypass standard email verification
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        return NextResponse.json({ error: 'User email already exists in system' }, { status: 409 });
      }
      throw authError;
    }

    const userId = authData.user.id;

    // 2. Set strict Auth Profile Mapping
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      { 
        id: userId, 
        name, 
        role: role.toUpperCase(), 
        email, 
        phone: details?.phone || '',
        permissions: details?.permissions || null
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      // If profile fails, ideally we rollback, but for now we throw error
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    // 3. Write data to relevant role-based tables
    if (role.toUpperCase() === 'TEACHER') {
      // Upsert teacher record, keyed on email. If teacher already existed
      // (e.g. added manually before account creation), we update their teacher_id
      // to the new Auth UUID so all FKs stay consistent.
      const { error: teacherError } = await supabaseAdmin.from('teachers').upsert(
        { 
          teacher_id: userId,
          name, 
          email, 
          phone: details?.phone || '', 
          working_status: 'Active', 
          hiring_status: 'selected'
        },
        { onConflict: 'email' }
      );
      if (teacherError) throw new Error(`Teacher insert/update failed: ${teacherError.message}`);

      // Fetch the actual teacher_id that was stored (may differ from userId if
      // the upsert matched an existing row with a different PK).
      const { data: teacherRow, error: fetchError } = await supabaseAdmin
        .from('teachers')
        .select('teacher_id')
        .eq('email', email)
        .single();
      if (fetchError) throw new Error(`Teacher fetch failed: ${fetchError.message}`);
      const actualTeacherId = teacherRow.teacher_id;

      // Upsert rate card using the real teacher_id (handles duplicate-key errors too)
      const { error: rateCardError } = await supabaseAdmin.from('teachers_rate_card').upsert(
        {
          teacher_id: actualTeacherId,
          class_1_to_4_rate: details?.class_1_to_4_rate || 0,
          class_5_to_8_rate: details?.class_5_to_8_rate || 0,
          class_9_to_10_rate: details?.class_9_to_10_rate || 0
        },
        { onConflict: 'teacher_id' }
      );
      if (rateCardError) throw new Error(`Teacher rate card upsert failed: ${rateCardError.message}`);
    } else if (role.toUpperCase() === 'STUDENT') {
      const { error: studentError } = await supabaseAdmin.from('students').insert([
        { 
          student_id: userId, 
          name, 
          class: details?.class || '', 
          subjects: details?.subjects || 'All Subjects',
          mode: details?.mode || 'Offline',
          join_date: details?.join_date || new Date().toISOString().split('T')[0],
          status: details?.status || 'Active',
          monthly_fee: details?.fees || 0
        }
      ]);
      if (studentError) throw new Error(`Student insert failed: ${studentError.message}`);
      
      // Assign to Batch if provided
      if (details?.batchId) {
        await supabaseAdmin.from('batch_students').insert([
          { batch_id: details?.batchId, student_id: userId }
        ]);
      }
    }

    // 4. Send Welcome Email containing Auto-Generated Credentials
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Special5 - Online Tuitions <onboarding@resend.dev>',
          to: [email],
          subject: 'Welcome to Special5 - Online Tuitions - Your Portal Access',
          html: `
            <h2>Welcome, ${name}!</h2>
            <p>Your account has been successfully created. You can now log in to access your dashboard.</p>
            <h3>Your Login Credentials:</h3>
            <ul>
              <li><strong>Portal URL:</strong> <a href="https://special5-crm.vercel.app/login">Login Here</a></li>
              <li><strong>Email/Username:</strong> ${email}</li>
              <li><strong>Password:</strong> ${defaultPassword}</li>
            </ul>
            <p>Please log in and change your password as soon as possible.</p>
            ${details?.batchName ? `<p><strong>Assigned Batch:</strong> ${details.batchName}</p>` : ''}
          `
        });
      } else {
        console.log('RESEND_API_KEY missing - Email skipped:', { to: email, password: defaultPassword });
      }
    } catch (emailErr) {
      console.warn('Failed to send email:', emailErr);
      // We don't fail the whole user creation just because email failed
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: userId, email, role } 
    });

  } catch (error: any) {
    console.error('Account Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
