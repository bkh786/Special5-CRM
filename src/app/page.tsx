'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const dashboardPath = user.role.toLowerCase();
        router.push(`/${dashboardPath}/dashboard`);
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: 'var(--background)',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        <h2 style={{ fontWeight: '600', color: 'var(--muted)', marginTop: '1rem' }}>
          Redirecting to Special5 - Online Tuitions Portal...
        </h2>
      </div>
    </div>
  );
}
