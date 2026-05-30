'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Loader2, Edit3, X } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabase-client';

export default function StudentProfilePage() {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({ phone: '', email: '' });

  useEffect(() => {
    async function loadFullProfile() {
      if (!user) return;
      const { data: prof } = await supabase.from('profiles').select('phone, email').eq('id', user.id).single();
      if (prof) {
        setProfileData({ 
          phone: prof.phone || '', 
          email: prof.email || user.email || '' 
        });
      }
    }
    loadFullProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           userId: user.id,
           role: 'STUDENT',
           phone: profileData.phone,
           email: profileData.email
        })
      });

      if (!res.ok) throw new Error('Failed to update profile');
    } catch(err) {
      console.error(err);
      alert("Failed updating records.");
    }
    
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>My Profile</h1>
        <p style={{ color: 'var(--muted)' }}>Manage your personal details and account settings.</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{user?.name || 'Student Profile'}</h2>
            <p style={{ color: 'var(--muted)' }}>Role: {user?.role || 'STUDENT'}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                  <X size={16} /> Cancel
                 </button>
                 <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save
                 </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase' }}>Email Address</label>
            <div style={{ marginTop: '0.5rem' }}>
               {isEditing ? (
                 <input 
                   type="email" 
                   className="input" 
                   value={profileData.email} 
                   onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                 />
               ) : (
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                   <Mail size={16} color="var(--muted)" /> {profileData.email || 'Not setup'}
                 </span>
               )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase' }}>Phone Number</label>
            <div style={{ marginTop: '0.5rem' }}>
              {isEditing ? (
                 <input 
                   type="text" 
                   className="input" 
                   value={profileData.phone} 
                   onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                 />
               ) : (
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                   <Phone size={16} color="var(--muted)" /> {profileData.phone || 'Not setup'}
                 </span>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
