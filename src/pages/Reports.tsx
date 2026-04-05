import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Search, Filter, History, Download, FileJson } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Reports = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchLogs();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/properties`);
      setProperties(res.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const fetchLogs = async (propertyId?: string) => {
    setLoading(true);
    try {
      const url = propertyId 
        ? `${API_BASE_URL}/api/assets/transfer-logs?propertyId=${propertyId}`
        : `${API_BASE_URL}/api/assets/transfer-logs`;
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedPropertyId(val);
    fetchLogs(val);
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    try {
      const url = `${API_BASE_URL}/api/reports/transfer/${format}${selectedPropertyId ? `?propertyId=${selectedPropertyId}` : ''}`;
      const response = await axios.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `asset_transfer_report_${new Date().getTime()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      link.click();
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <FileText size={28} style={{ marginRight: '12px', color: '#10b981' }} />
          Activity Reports
        </h1>
        <p className="page-subtitle">Historical logs and activity audits for all infrastructure entities.</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 500 }}>Filter by Property:</span>
          </div>
          <select 
            className="form-input" 
            style={{ maxWidth: '300px', marginBottom: 0 }}
            value={selectedPropertyId}
            onChange={handleFilter}
          >
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => downloadReport('pdf')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}
          >
            <Download size={18} /> Download PDF
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => downloadReport('excel')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', borderColor: '#22c55e' }}
          >
            <FileJson size={18} /> Download Excel (XLSX)
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={20} color="#3b82f6" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Asset Transfer Activity</h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading report data...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No transfer activity found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Asset</th>
                <th>From Property</th>
                <th>To Property</th>
                <th>Transferred By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{log.transferDate ? new Date(log.transferDate).toLocaleString() : '-'}</td>
                  <td><span className="badge badge-info">{log.assetName}</span></td>
                  <td>{log.fromPropertyName}</td>
                  <td>{log.toPropertyName}</td>
                  <td><strong>{log.transferredBy}</strong></td>
                  <td style={{ fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>{log.transferNote || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Reports;
