import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, MapPin } from 'lucide-react';
import WorkOrders from './WorkOrders';

// Fix leaflet icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Property {
    id: number;
    name: string;
    address: string;
    locLat?: string;
    locLon?: string;
}

interface Asset {
    id: number;
    name: string;
    type: string;
    property: Property;
}

interface WorkOrder {
    id: number;
    description: string;
    status: string;
    amount?: number;
    asset: Asset;
    vendor?: { username: string };
}

const Dashboard = () => {
    const { user } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);

    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [activeWoPopup, setActiveWoPopup] = useState<WorkOrder[] | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [propsRes, assetsRes, woRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/properties'),
                    axios.get('http://localhost:8080/api/assets'),
                    axios.get('http://localhost:8080/api/work-orders')
                ]);
                setProperties(propsRes.data);
                setAssets(assetsRes.data);
                setWorkOrders(woRes.data.reverse());
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    // Filter properties that actually have locLat / locLon mapped
    const mappableProperties = properties.filter(p => p.locLat && p.locLon);

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h2>IMMS Global Dashboard</h2>
            </div>
            
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Welcome back, {user?.username}!</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Your assigned role is: <strong>{user?.role}</strong>. {user?.role === 'VENDOR' ? 'Below are the active operational work tasks open for applications.' : 'Below is the live satellite view of all registered properties and internal assets.'}
                </p>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={24} color="var(--primary)" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{properties.length}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Total Properties</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={24} color="var(--success)" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{assets.length}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Total Assets</span>
                    </div>
                </div>
            </div>

            {user?.role !== 'VENDOR' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Spatial Registry Map</h3>
                    </div>
                    <div style={{ height: '600px', width: '100%' }}>
                        <MapContainer 
                            center={[23.8103, 90.4125]} /* Default to Central BD */
                            zoom={7} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {mappableProperties.map(prop => {
                                const propertyAssets = assets.filter(a => a.property?.id === prop.id);
                                const propertyAssetIds = propertyAssets.map(a => a.id);
                                const propertyWorkOrders = workOrders.filter(wo => propertyAssetIds.includes(wo.asset.id));

                                return (
                                    <Marker 
                                        key={prop.id} 
                                        position={[parseFloat(prop.locLat!), parseFloat(prop.locLon!)]}
                                    >
                                        <Popup minWidth={250}>
                                            <div style={{ margin: 0 }}>
                                                <h3 style={{ margin: '0 0 4px 0', color: 'var(--primary)', fontSize: '16px' }}>{prop.name}</h3>
                                                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>{prop.address}</p>
                                                
                                                <div style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                                                    <strong style={{ fontSize: '12px', color: '#444' }}>Linked Assets ({propertyAssets.length})</strong>
                                                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#333' }}>
                                                        {propertyAssets.map(asset => (
                                                            <li key={asset.id}>{asset.name} <span style={{ color: '#888', fontSize:'11px' }}>({asset.type})</span></li>
                                                        ))}
                                                        {propertyAssets.length === 0 && <li style={{listStyle:'none', marginLeft:'-20px', color:'#999'}}>No assets mapped.</li>}
                                                    </ul>
                                                </div>

                                                {propertyWorkOrders.length > 0 && (
                                                    <div style={{ marginTop: '12px' }}>
                                                        <button 
                                                            className="btn btn-primary" 
                                                            style={{ width: '100%', padding: '0.4rem', fontSize: '12px', background: '#f57c00' }}
                                                            onClick={() => setActiveWoPopup(propertyWorkOrders)}
                                                        >
                                                            View Associated Work Orders ({propertyWorkOrders.length})
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            })}
                        </MapContainer>
                    </div>
                </div>
            )}

            {user?.role === 'VENDOR' && (
                <div style={{ marginTop: '2rem' }}>
                    <WorkOrders />
                </div>
            )}

            {activeWoPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Asset Work Orders Log</h3>
                            <button onClick={() => setActiveWoPopup(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize:'16px', fontWeight:'bold' }}>X</button>
                        </div>
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
                                <thead>
                                    <tr style={{borderBottom: '2px solid var(--border)'}}>
                                        <th style={{padding: '0.8rem'}}>Duty ID</th>
                                        <th style={{padding: '0.8rem'}}>Asset Name</th>
                                        <th style={{padding: '0.8rem'}}>Task Description</th>
                                        <th style={{padding: '0.8rem'}}>Current Status</th>
                                        <th style={{padding: '0.8rem'}}>Assigned Vendor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeWoPopup.map(wo => (
                                        <tr key={wo.id} style={{borderBottom: '1px solid #efefef'}}>
                                            <td style={{padding: '0.8rem'}}>#{wo.id}</td>
                                            <td style={{padding: '0.8rem', color: 'var(--primary)', fontWeight: 'bold'}}>{wo.asset.name}</td>
                                            <td style={{padding: '0.8rem'}}><strong>{wo.description}</strong></td>
                                            <td style={{padding: '0.8rem'}}>
                                                <span style={{ padding: '0.2rem 0.5rem', background: '#ffebee', color: '#c62828', borderRadius: '4px', fontSize: '0.75rem', fontWeight:'bold' }}>
                                                    {wo.status}
                                                </span>
                                            </td>
                                            <td style={{padding: '0.8rem'}}>{wo.vendor ? <span style={{color: '#2e7d32', fontWeight: 600}}>@{wo.vendor.username}</span> : '--'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
