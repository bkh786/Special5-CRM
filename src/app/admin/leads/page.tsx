'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import ActionModal from '@/components/common/ActionModal';
import LeadForm from '@/components/forms/LeadForm';
import LeadConversionForm from '@/components/forms/LeadConversionForm';
import LeadBulkUploadForm from '@/components/forms/LeadBulkUploadForm';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [conversionLead, setConversionLead] = useState<any | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Fetched leads data:', data);
      if (error) {
        console.error('Supabase error fetching leads:', error);
        throw error;
      }
      setLeads(data || []);
    } catch (err: any) {
      console.error('Error in fetchLeads:', err);
      setError(err.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => 
    (lead.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (lead.subjects?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Converted': return { bg: '#ecfdf5', text: '#059669', icon: CheckCircle2 };
      case 'Received': return { bg: '#eff6ff', text: '#2563eb', icon: Clock };
      case 'Connected': return { bg: '#fdf4ff', text: '#9333ea', icon: Phone };
      case 'Demo Scheduled': return { bg: '#fff7ed', text: '#d97706', icon: Calendar };
      case 'Lost': return { bg: '#fef2f2', text: '#dc2626', icon: XCircle };
      default: return { bg: '#f1f5f9', text: '#64748b', icon: Clock };
    }
  };

  const handleStatusUpdate = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('lead_id', leadId);
      
      if (error) throw error;
      
      if (newStatus === 'Converted') {
        const lead = leads.find(l => l.id === leadId);
        if (lead) setConversionLead(lead);
      }
      
      fetchLeads();
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDownload = () => {
    if (!leads.length) return;
    
    const headers = ['Lead ID', 'Student Name', 'Email', 'Phone', 'Class', 'Subjects', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...leads.map(l => [
        l.lead_id || l.id,
        `"${l.student_name || ''}"`,
        `"${l.email_id || ''}"`,
        `"${l.phone || ''}"`,
        `"${l.class || ''}"`,
        `"${l.subjects || ''}"`,
        `"${l.status || ''}"`,
        `"${new Date(l.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Lead Management</h1>
          <p style={{ color: 'var(--muted)' }}>Manage and track student enquiries from Supabase</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchLeads} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-secondary"
            style={{ backgroundColor: '#f1f5f9', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
          >
            <Upload size={18} />
            Bulk Upload
          </button>
          <button 
            onClick={handleDownload}
            className="btn btn-secondary"
            style={{ backgroundColor: '#f1f5f9', color: 'var(--text-color)', border: '1px solid var(--border-color)' }}
          >
            <Download size={18} />
            Export Data
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Add New Lead
          </button>
        </div>
      </div>

      <ActionModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Bulk Upload Leads"
        description="Upload an Excel sheet to import multiple leads at once."
      >
        <LeadBulkUploadForm 
          onSuccess={() => {
            setIsUploadModalOpen(false);
            fetchLeads();
          }}
          onCancel={() => setIsUploadModalOpen(false)}
        />
      </ActionModal>

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Lead"
        description="Fill in the details below to record a new student enquiry."
      >
        <LeadForm 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchLeads();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </ActionModal>

      <ActionModal
        isOpen={!!conversionLead}
        onClose={() => setConversionLead(null)}
        title="Convert Lead to Student"
        description={`Configure batch assignments and system access for ${conversionLead?.student_name}.`}
      >
        {conversionLead && (
          <LeadConversionForm 
            lead={conversionLead}
            onSuccess={() => {
              setConversionLead(null);
              fetchLeads();
            }}
            onCancel={() => setConversionLead(null)}
          />
        )}
      </ActionModal>

      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            placeholder="Search leads by name or subject..." 
            className="input" 
            style={{ paddingLeft: '2.5rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '40vh', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Contact Info</th>
                <th>Email ID</th>
                <th>Class / Subjects</th>
                <th>Status</th>
                <th>Created On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? filteredLeads.map((lead) => {
                const isConverted = lead.status === 'Converted';
                const status = getStatusColor(lead.status || 'Received');
                
                return (
                  <tr key={lead.id || lead.lead_id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{lead.student_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        <Phone size={12} /> {lead.phone || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Source: {lead.source || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '500' }}>{lead.email_id || 'N/A'}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{lead.class} - {lead.subjects}</div>
                    </td>
                    <td>
                      <select 
                        value={lead.status || 'Received'} 
                        onChange={(e) => handleStatusUpdate(lead.id || lead.lead_id, e.target.value)}
                        disabled={isConverted}
                        style={{ 
                          padding: '0.375rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: status.bg,
                          color: status.text,
                          border: 'none',
                          cursor: isConverted ? 'not-allowed' : 'pointer',
                          outline: 'none',
                          opacity: isConverted ? 0.7 : 1
                        }}
                      >
                        <option value="Received">Received</option>
                        <option value="Connected">Connected</option>
                        <option value="Demo Scheduled">Demo Scheduled</option>
                        {isConverted ? (
                           <option value="Converted">Converted</option>
                        ) : (
                           <option value="Converted" disabled>Converted (Via System)</option>
                        )}
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                          <Mail size={16} />
                        </button>
                        {!isConverted ? (
                          <button 
                            onClick={() => setConversionLead(lead)}
                            className="btn btn-primary" 
                            style={{ padding: '0.5rem', backgroundColor: '#10b981', fontSize: '0.75rem' }}
                          >
                            Convert
                          </button>
                        ) : (
                          <button className="btn btn-secondary" style={{ padding: '0.5rem', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                            <CheckCircle2 size={16} color="#10b981" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                    No leads found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
