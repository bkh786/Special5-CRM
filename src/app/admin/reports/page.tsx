'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Filter, 
  ChevronDown, 
  ArrowUpRight, 
  PieChart as PieIcon 
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.25rem' }}>Detailed insights into business performance and student growth.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary">
            <Calendar size={18} />
            May 2024
            <ChevronDown size={14} />
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Full Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '700' }}>Student Growth Trend</h3>
            <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>+12% vs LY</span>
          </div>
          <div style={{ height: '300px', width: '100%', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={48} color="var(--primary)" opacity={0.5} />
            <span style={{ marginLeft: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>Growth Chart Loading...</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '700' }}>Revenue Distribution</h3>
            <span className="badge" style={{ backgroundColor: '#f0f9ff', color: '#0369a1' }}>Total: ₹84.5L</span>
          </div>
          <div style={{ height: '300px', width: '100%', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PieIcon size={48} color="var(--primary)" opacity={0.5} />
            <span style={{ marginLeft: '1rem', color: 'var(--muted)', fontSize: '0.875rem' }}>Pie Chart Loading...</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ padding: '0.5rem', backgroundColor: '#eff6ff', width: 'fit-content', borderRadius: '8px', color: '#3b82f6', marginBottom: '1rem' }}>
            <Users size={20} />
          </div>
          <h4 style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: '500' }}>Lead Conversion</h4>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>68.4%</span>
            <span style={{ color: '#10b981', fontSize: '0.8125rem', fontWeight: '600' }}>+4.2%</span>
          </div>
        </div>
        <div className="card">
          <div style={{ padding: '0.5rem', backgroundColor: '#f0fdf4', width: 'fit-content', borderRadius: '8px', color: '#10b981', marginBottom: '1rem' }}>
            <TrendingUp size={20} />
          </div>
          <h4 style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: '500' }}>Retention Rate</h4>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>92.8%</span>
            <span style={{ color: '#10b981', fontSize: '0.8125rem', fontWeight: '600' }}>+1.5%</span>
          </div>
        </div>
        <div className="card">
          <div style={{ padding: '0.5rem', backgroundColor: '#f8fafc', width: 'fit-content', borderRadius: '8px', color: '#64748b', marginBottom: '1rem' }}>
            <TrendingUp size={20} />
          </div>
          <h4 style={{ color: 'var(--muted)', fontSize: '0.875rem', fontWeight: '500' }}>Active Batches</h4>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800' }}>144</span>
            <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>Target: 150</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Generating Advanced Business Insights</h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Our analytics engine is calculating complex projection models for 2024. Please check back in a few minutes.</p>
        <button className="btn btn-secondary" style={{ marginTop: '1.5rem', marginInline: 'auto' }}>
          Schedule Analytics Run
        </button>
      </div>
    </div>
  );
}
