import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowRightLeft, Building2, Package, CheckCircle, XCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AssetTransfer = () => {
  const { user: _user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetPropertyId, setTargetPropertyId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assetsRes, propsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/assets`),
        axios.get(`${API_BASE_URL}/api/properties`)
      ]);
      const assetData = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      const propData = Array.isArray(propsRes.data) ? propsRes.data : [];
      setAssets(assetData);
      setProperties(propData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !targetPropertyId) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post(`${API_BASE_URL}/api/assets/${selectedAssetId}/transfer?username=${encodeURIComponent(_user?.username || '')}`, {
        targetPropertyId: parseInt(targetPropertyId),
        transferNote: note
      });
      setMessage({ type: 'success', text: 'Asset transferred successfully!' });
      setNote('');
      setSelectedAssetId('');
      setTargetPropertyId('');
      fetchData(); // Refresh list to see updated property mapping
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Transfer failed' });
    } finally {
      setLoading(false);
    }
  };

  const assetList = Array.isArray(assets) ? assets : [];
  const propertyList = Array.isArray(properties) ? properties : [];
  const selectedAsset = assetList.find(a => a.id === parseInt(selectedAssetId));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <ArrowRightLeft size={28} style={{ marginRight: '12px', color: '#3b82f6' }} />
          Asset Transfer
        </h1>
        <p className="page-subtitle">Move assets from one property to another with full activity tracking.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleTransfer} className="asset-form">
          {message.text && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              animation: 'slideDown 0.35s ease',
              background: message.type === 'success'
                ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
                : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              border: message.type === 'success'
                ? '1px solid #a7f3d0'
                : '1px solid #fecaca',
              boxShadow: message.type === 'success'
                ? '0 4px 12px rgba(16, 185, 129, 0.15)'
                : '0 4px 12px rgba(239, 68, 68, 0.15)',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: message.type === 'success' ? '#10b981' : '#ef4444',
              }}>
                {message.type === 'success'
                  ? <CheckCircle size={20} color="white" />
                  : <XCircle size={20} color="white" />
                }
              </div>
              <div>
                <div style={{
                  fontWeight: 700, fontSize: '0.95rem',
                  color: message.type === 'success' ? '#065f46' : '#991b1b',
                }}>
                  {message.type === 'success' ? 'Transfer Successful!' : 'Transfer Failed'}
                </div>
                <div style={{
                  fontSize: '0.82rem', marginTop: '2px',
                  color: message.type === 'success' ? '#047857' : '#b91c1c',
                }}>
                  {message.text}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Package size={16} style={{ marginRight: '8px' }} />
              Select Asset to Transfer
            </label>
            <select 
              className="form-input" 
              value={selectedAssetId} 
              onChange={(e) => setSelectedAssetId(e.target.value)}
              required
            >
              <option value="">-- Choose Asset --</option>
              {assetList.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.type}) - Currently at: {asset.property?.name || 'Unassigned'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Building2 size={16} style={{ marginRight: '8px' }} />
              Target Property
            </label>
            <select 
              className="form-input" 
              value={targetPropertyId} 
              onChange={(e) => setTargetPropertyId(e.target.value)}
              required
            >
              <option value="">-- Choose Target Property --</option>
              {propertyList.map(prop => (
                // Filter out current property to prevent redundant transfer
                selectedAsset?.property?.id !== prop.id && (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} - {prop.address}
                  </option>
                )
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Note (Reason)</label>
            <textarea 
              className="form-input" 
              rows={3} 
              value={note} 
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g., Routine maintenance, site relocation, etc."
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Processing...' : 'Execute Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetTransfer;
