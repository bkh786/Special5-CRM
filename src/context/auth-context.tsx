'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  fetchUserProfile: (authUser: User) => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(authUser: User): Promise<AuthUser | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      } else if (data) {
        const profile = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as UserRole,
        };
        setUser(profile);
        return profile;
      }
      return null;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, logout, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
