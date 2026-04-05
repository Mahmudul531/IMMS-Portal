import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Package, Inbox, ArrowLeft, Loader2, MapPin, Briefcase } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property {
  id: number;
  name: string;
  address: string;
  locLat: string;
  locLon: string;
}

interface Asset {
  id: number;
  name: string;
  type: string;
}

interface WorkOrder {
  id: number;
  description: string;
  status: string;
  amount: number;
  asset: Asset;
  vendor?: { username: string };
}

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, assetsRes, woRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/properties`),
          axios.get(`${API_BASE_URL}/api/assets`),
          axios.get(`${API_BASE_URL}/api/work-orders`)
        ]);

        const currentProp = propsRes.data.find((p: any) => p.id === parseInt(id!));
        if (!currentProp) {
          navigate('/dashboard');
          return;
        }

        setProperty(currentProp);
        
        const propAssets = (assetsRes.data || []).filter((a: any) => a.property?.id === currentProp.id);
        setAssets(propAssets);

        const assetIds = propAssets.map((a: any) => a.id);
        const propWOs = (woRes.data || []).filter((wo: any) => wo.asset && assetIds.includes(wo.asset.id));
        setWorkOrders(propWOs);

      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Overview */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center gap-3 mb-6">
              <Building2 size={32} color="var(--primary)" />
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{property.name}</h1>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address</label>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <MapPin size={18} style={{ marginTop: '2px' }} />
                  <span>{property.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="stat-card">
                  <Package size={20} color="var(--success)" />
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{assets.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Assets</div>
                  </div>
                </div>
                <div className="stat-card">
                  <Briefcase size={20} color="var(--warning)" />
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{workOrders.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets & Work Orders */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Linked Assets Table */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Inbox size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Linked Infrastructure Assets</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Asset Name</th>
                  <th>Category / Type</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td>#{asset.id}</td>
                    <td><strong>{asset.name}</strong></td>
                    <td><span className="badge badge-info">{asset.type}</span></td>
                  </tr>
                ))}
                {assets.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No assets found for this property.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Associated Work Orders */}
          <div className="card shadow-md border-t-4 border-warning">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={20} color="var(--warning)" />
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Current Maintenance Work Orders</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Duty ID</th>
                  <th>Asset</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Vendor</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.id}>
                    <td>#{wo.id}</td>
                    <td style={{ fontWeight: 600 }}>{wo.asset?.name || 'Unknown Asset'}</td>
                    <td>{wo.description}</td>
                    <td>
                      <span className={`badge ${wo.status === 'ASSIGNED' ? 'badge-success' : 'badge-warning'}`}>
                        {wo.status}
                      </span>
                    </td>
                    <td>{wo.vendor?.username ? <span style={{ color: 'var(--primary)' }}>@{wo.vendor.username}</span> : '--'}</td>
                  </tr>
                ))}
                {workOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active maintenance work orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
