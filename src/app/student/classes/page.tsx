'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/context/auth-context';
import { Video, Clock, Loader2, Users } from 'lucide-react';

export default function StudentClassesPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      if (!user) return;
      setLoading(true);
      const { data: bData } = await supabase.from('batch_students').select('batch_id').eq('student_id', user.id);
      const batchIds = bData?.map(b => b.batch_id) || [];
      if (batchIds.length > 0) {
        // Fetch batches via relations
        const { data } = await supabase
           .from('batches')
           .select('*, teachers(name)')
           .in('batch_id', batchIds);
        if (data) setBatches(data);
      }
      setLoading(false);
    }
    loadBatches();
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Classes</h1>
        <p style={{ color: 'var(--muted)' }}>View your active course enrollments and live class links.</p>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} color="var(--primary)" style={{ margin: '0 auto' }} /></div>
      ) : batches.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
           You are not enrolled in any active classes currently.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {batches.map(b => (
            <div key={b.batch_id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontWeight: '700', fontSize: '1.25rem' }}>{b.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{b.subject} • {b.class}</p>
                  </div>
                  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: '600' }}>Enrolled</span>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                     <Users size={16} color="var(--primary)" />
                     <span style={{ fontWeight: '500' }}>Instructor: {b.teachers?.name || 'TBD'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
                     <Clock size={16} color="var(--muted)" />
                     <span>Timings: {b.timing || 'Schedule Pending'}</span>
                  </div>
               </div>

               {b.zoom_link ? (
                  <a href={b.zoom_link} target="_blank" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                     <Video size={18} /> Join Live Class
                  </a>
               ) : (
                  <button disabled className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', opacity: 0.7 }}>
                     Live Link Unavailable
                  </button>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
