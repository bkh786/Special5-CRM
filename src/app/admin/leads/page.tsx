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
import { exportToCSV } from '@/utils/exportToCSV';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [conversionLead, setConversionLead] = useState<any | null>(null);
  const [editLead, setEditLead] = useState<any | null>(null);

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
    const exportData = leads.map(l => ({
      'Lead ID': l.lead_id || l.id,
      'Student Name': l.student_name,
      'Email': l.email_id,
      'Phone': l.phone,
      'Class': l.class,
      'Subjects': l.subjects,
      'Status': l.status,
      'Created At': new Date(l.created_at).toLocaleDateString()
    }));
    exportToCSV(exportData, `leads_export_${new Date().toISOString().split('T')[0]}`);
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
            onClick={() => {
              setEditLead(null);
              setIsModalOpen(true);
            }}
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
        onClose={() => {
          setIsModalOpen(false);
          setEditLead(null);
        }}
        title={editLead ? "Edit Lead" : "Add New Lead"}
        description={editLead ? "Update lead details below." : "Fill in the details below to record a new student enquiry."}
      >
        <LeadForm 
          initialData={editLead}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditLead(null);
            fetchLeads();
          }}
          onCancel={() => {
            setIsModalOpen(false);
            setEditLead(null);
          }}
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
                        <button 
                          onClick={() => {
                            if (lead.phone) {
                              const phoneStr = lead.phone.toString().replace(/\D/g, '');
                              const formattedPhone = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr}`;
                              window.open(`https://wa.me/${formattedPhone}`, '_blank');
                            } else {
                              alert('No phone number provided for this lead.');
                            }
                          }}
                          className="btn" 
                          style={{ padding: '0.375rem', color: '#25D366', backgroundColor: '#dcf8c6', border: 'none', borderRadius: '6px' }}
                          title="WhatsApp"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            setEditLead(lead);
                            setIsModalOpen(true);
                          }}
                          className="btn btn-secondary" 
                          style={{ padding: '0.375rem', fontSize: '0.75rem' }}
                          title="Edit Lead"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
