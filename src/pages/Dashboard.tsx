import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, MapPin, Eye, EyeOff } from 'lucide-react';
import WorkOrders from './WorkOrders';

// Fix leaflet icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create a labeled marker icon with property name
const createLabelIcon = (name: string, isActive: boolean) => L.divIcon({
    className: 'property-label-marker',
    html: `<div class="property-label-pin">
              <div class="property-label-dot" style="${!isActive ? 'background: #cbd5e1;' : ''}"></div>
              <div class="property-label-tag" style="${!isActive ? 'background: #f8f9fa; color: #94a3b8; border: 1px solid #e2e8f0;' : ''}">${isActive ? '' : '⚠️ '}${name}</div>
           </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 24],
});

interface Property {
    id: number;
    name: string;
    address: string;
    locLat?: string;
    locLon?: string;
    active?: boolean;
}

interface Asset {
    id: number;
    name: string;
    type: string;
    property: Property;
}

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showLabels, setShowLabels] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [propsRes, assetsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets`)
                ]);
                setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
                setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    const mappableProperties = properties.filter(p => {
        const lat = parseFloat(p.locLat || '');
        const lon = parseFloat(p.locLon || '');
        return !isNaN(lat) && !isNaN(lon);
    });

    // Memoize label icons so they don't get recreated every render
    const labelIcons = useMemo(() => {
        const map: Record<number, L.DivIcon> = {};
        mappableProperties.forEach(p => { 
            map[p.id] = createLabelIcon(p.name, p.active !== false); 
        });
        return map;
    }, [mappableProperties]);

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
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Spatial Registry Map</h3>
                        <button
                            onClick={() => setShowLabels(prev => !prev)}
                            title={showLabels ? 'Hide property names' : 'Show property names'}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: showLabels ? 'var(--primary)' : 'transparent',
                                color: showLabels ? 'white' : 'var(--text-muted)',
                                border: showLabels ? 'none' : '1px solid var(--border)',
                                borderRadius: '6px', padding: '0.4rem 0.75rem',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {showLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showLabels ? 'Hide Labels' : 'Show Labels'}
                        </button>
                    </div>
                    <div style={{ height: '600px', width: '100%' }}>
                        <MapContainer 
                            center={[23.8103, 90.4125]} 
                            zoom={7} 
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution="&copy; OpenStreetMap contributors"
                            />
                            {mappableProperties.map(prop => (
                                <Marker 
                                    key={`${prop.id}-${showLabels}`} 
                                    position={[parseFloat(prop.locLat!), parseFloat(prop.locLon!)]}
                                    icon={showLabels ? labelIcons[prop.id] : new L.Icon.Default()}
                                >
                                    <Popup>
                                        <div style={{ margin: 0 }}>
                                            <h3 style={{ margin: '0 0 4px 0', color: 'var(--primary)', fontSize: '16px' }}>{prop.name}</h3>
                                            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>{prop.address}</p>
                                            
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ width: '100%', padding: '0.5rem', fontSize: '12px' }}
                                                onClick={() => navigate(`/properties/${prop.id}`)}
                                            >
                                                View Property Details
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            )}

            {user?.role === 'VENDOR' && (
                <div style={{ marginTop: '2rem' }}>
                    <WorkOrders />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
