'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, UserPlus, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function SettingsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    permissions: {
      leads: 'view',
      students: 'view',
      teachers: 'view',
      batches: 'view',
      fees: 'view'
    }
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'ADMIN');
      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handlePermissionChange = (module: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: value
      }
    }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: 'ADMIN',
          details: {
            phone: formData.phone,
            permissions: formData.permissions
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create admin');
      
      setFormSuccess(true);
      setTimeout(() => {
        setIsCreating(false);
        setFormSuccess(false);
        setFormData({
          name: '', email: '', phone: '',
          permissions: { leads: 'view', students: 'view', teachers: 'view', batches: 'view', fees: 'view' }
        });
        fetchAdmins();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Error creating admin');
    } finally {
      setFormLoading(false);
    }
  };

  const updatePermissions = async (id: string, newPermissions: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ permissions: newPermissions })
        .eq('id', id);
      if (error) throw error;
      fetchAdmins();
    } catch (err) {
      console.error('Error updating permissions', err);
      alert('Failed to update permissions');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Settings & Access Control</h1>
        <p style={{ color: 'var(--muted)' }}>Manage platform settings, administrators, and module permissions.</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            User Management
          </h2>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem' }}
          >
            {isCreating ? 'Cancel' : <><Plus size={16} /> Add Admin User</>}
          </button>
        </div>

        {isCreating && (
          <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} /> Create New Administrator
            </h3>
            
            {formError && (
              <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}
            
            {formSuccess && (
              <div style={{ padding: '0.75rem', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} /> Administrator created successfully!
              </div>
            )}

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Full Name *</label>
                  <input type="text" required className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Email Address *</label>
                  <input type="email" required className="input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Phone Number</label>
                  <input type="tel" className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.75rem' }}>Module Permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                  {Object.entries(formData.permissions).map(([module, perm]) => (
                    <div key={module} style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ textTransform: 'capitalize', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{module}</div>
                      <select 
                        className="input" 
                        value={perm} 
                        onChange={(e) => handlePermissionChange(module, e.target.value)}
                        style={{ padding: '0.25rem', fontSize: '0.75rem' }}
                      >
                        <option value="none">None</option>
                        <option value="view">View Only</option>
                        <option value="edit">Edit/Full Access</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Administrator
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>Admin Info</th>
                  {['leads', 'students', 'teachers', 'batches', 'fees'].map(mod => (
                    <th key={mod} style={{ textAlign: 'center', padding: '1rem', fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'capitalize' }}>{mod}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{admin.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{admin.email}</div>
                    </td>
                    {['leads', 'students', 'teachers', 'batches', 'fees'].map(mod => {
                      const currentPerm = admin.permissions?.[mod] || 'none';
                      return (
                        <td key={mod} style={{ padding: '1rem', textAlign: 'center' }}>
                          <select
                            value={currentPerm}
                            onChange={(e) => updatePermissions(admin.id, { ...(admin.permissions || {}), [mod]: e.target.value })}
                            style={{
                              padding: '0.25rem',
                              borderRadius: '4px',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.75rem',
                              backgroundColor: currentPerm === 'edit' ? '#ecfdf5' : currentPerm === 'view' ? '#f0f9ff' : '#f8fafc',
                              color: currentPerm === 'edit' ? '#047857' : currentPerm === 'view' ? '#0369a1' : '#64748b'
                            }}
                          >
                            <option value="none">None</option>
                            <option value="view">View Only</option>
                            <option value="edit">Edit Access</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
