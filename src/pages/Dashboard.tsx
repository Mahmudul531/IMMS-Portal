import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, MapPin, Eye, EyeOff, AlertTriangle, BarChart2, CheckCircle2, Briefcase, Filter, X, ArrowRight } from 'lucide-react';
import WorkOrders from './WorkOrders';

// Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createLabelIcon = (name: string, isActive: boolean, type: string) => L.divIcon({
    className: 'property-label-marker',
    html: `<div class="map-marker-card ${!isActive ? 'inactive' : ''}">
             <div class="map-marker-name">${name}</div>
             <div class="map-marker-badge ${!isActive ? 'inactive' : ''}">${type || 'INFRASTRUCTURE'}</div>
             <div class="map-marker-arrow ${!isActive ? 'inactive' : ''}"></div>
           </div>`,
    iconSize: [0, 0],
    iconAnchor: [55, 45],
});

interface Property {
    id: number;
    name: string;
    code: string;
    address: string;
    city?: string;
    locLat?: string;
    locLon?: string;
    active?: boolean;
    propertyType?: { id: number, name: string };
    division?: string;
    district?: string;
    upazila?: string;
}

interface Asset { id: number; name: string; type: string; property: Property; }

// Geo data types
type GeoUnion = { id: string; name: string };
type GeoUpazila = { id: string; name: string; unions: GeoUnion[] };
type GeoDistrict = { id: string; name: string; upazilas: GeoUpazila[] };
type GeoDivision = { id: string; name: string; districts: GeoDistrict[] };

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';

    const [properties, setProperties] = useState<Property[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showLabels, setShowLabels] = useState(true);
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [completions, setCompletions] = useState<Record<number, any>>({});
    const [loadingProjects, setLoadingProjects] = useState(false);

    // Geo & Filtering State
    const [geoData, setGeoData] = useState<GeoDivision[]>([]);
    const [filterDivision, setFilterDivision] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterUpazila, setFilterUpazila] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({ division: '', district: '', upazila: '' });
    
    // Polygon State
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [propsRes, assetsRes] = await Promise.all([
                    axios.get(`${API}/api/properties`),
                    axios.get(`${API}/api/assets`),
                ]);
                setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
                setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
            } catch { console.error('Failed to fetch dashboard data'); }
        };
        fetchDashboardData();

        // Fetch BD Geo Data
        fetch(`${API}/BD_Geo_Mapping_All.json`)
            .then(r => r.json())
            .then(setGeoData)
            .catch(console.error);
    }, []);

    // Load project completion data for admin/engineer
    useEffect(() => {
        if (user?.role === 'VENDOR') return;
        const fetchProjects = async () => {
            setLoadingProjects(true);
            try {
                const { data } = await axios.get(`${API}/api/work-orders`);
                const all = Array.isArray(data) ? data : [];
                const filtered = isAdmin ? all : all.filter((w: any) => w.fieldEngineer?.id === user?.id);
                setWorkOrders([...filtered].reverse());

                const compMap: Record<number, any> = {};
                await Promise.all(filtered.map(async (w: any) => {
                    try {
                        const r = await axios.get(`${API}/api/tasks/completion/${w.id}`);
                        compMap[w.id] = r.data;
                    } catch { compMap[w.id] = { completionPct: 0, totalTasks: 0, overdueTasks: 0 }; }
                }));
                setCompletions(compMap);
            } catch { } finally { setLoadingProjects(false); }
        };
        fetchProjects();
    }, [user?.id, isAdmin, user?.role]);

    // Handle Search / Apply Filters
    const applyFilters = async () => {
        setAppliedFilters({ division: filterDivision, district: filterDistrict, upazila: filterUpazila });
        
        let query = '';
        if (filterUpazila) {
            query = `${filterUpazila},${filterDistrict},Bangladesh`;
        } else if (filterDistrict) {
            query = `${filterDistrict},Bangladesh`;
        }

        if (query) {
            try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&q=${encodeURIComponent(query)}`);
                if (res.data && res.data.features && res.data.features.length > 0) {
                    // Pick the first result that has a polygon/multipolygon
                    const feature = res.data.features.find((f: any) => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon') || res.data.features[0];
                    setGeoJsonData(feature);
                    
                    if (mapRef.current && feature) {
                        const geoJsonLayer = L.geoJSON(feature);
                        mapRef.current.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50] });
                    }
                } else {
                    setGeoJsonData(null);
                }
            } catch (err) {
                console.error("Failed to fetch polygon:", err);
                setGeoJsonData(null);
            }
        } else {
            setGeoJsonData(null);
            if (mapRef.current) {
                mapRef.current.setView([23.8103, 90.4125], 7);
            }
        }
    };

    const resetFilters = () => {
        setFilterDivision('');
        setFilterDistrict('');
        setFilterUpazila('');
        setAppliedFilters({ division: '', district: '', upazila: '' });
        setGeoJsonData(null);
        if (mapRef.current) {
            mapRef.current.setView([23.8103, 90.4125], 7);
        }
    };

    const divisionOptions = geoData;
    const districtOptions = filterDivision ? (geoData.find(d => d.name === filterDivision)?.districts || []) : [];
    const upazilaOptions = filterDistrict ? (districtOptions.find(d => d.name === filterDistrict)?.upazilas || []) : [];

    const activeFilterCount = (appliedFilters.division ? 1 : 0) + (appliedFilters.district ? 1 : 0) + (appliedFilters.upazila ? 1 : 0);

    const filteredProperties = properties.filter(p => {
        const addressMatch = p.address?.toLowerCase() || '';
        const cityMatch = p.city?.toLowerCase() || '';
        const pDiv = (p.division || '').toLowerCase();
        const pDist = (p.district || '').toLowerCase();
        const pUpa = (p.upazila || '').toLowerCase();

        if (appliedFilters.division) {
            const fDiv = appliedFilters.division.toLowerCase();
            if (pDiv !== fDiv && !addressMatch.includes(fDiv) && !cityMatch.includes(fDiv)) return false;
        }
        if (appliedFilters.district) {
            const fDist = appliedFilters.district.toLowerCase();
            if (pDist !== fDist && !addressMatch.includes(fDist) && !cityMatch.includes(fDist)) return false;
        }
        if (appliedFilters.upazila) {
            const fUpa = appliedFilters.upazila.toLowerCase();
            if (pUpa !== fUpa && !addressMatch.includes(fUpa) && !cityMatch.includes(fUpa)) return false;
        }
        return true;
    });

    const mappableProperties = filteredProperties.filter(p => {
        const lat = parseFloat(p.locLat || '');
        const lon = parseFloat(p.locLon || '');
        return !isNaN(lat) && !isNaN(lon);
    });

    const labelIcons = useMemo(() => {
        const map: Record<number, L.DivIcon> = {};
        mappableProperties.forEach(p => { 
            map[p.id] = createLabelIcon(p.name, p.active !== false, p.propertyType?.name || 'INFRASTRUCTURE'); 
        });
        return map;
    }, [mappableProperties]);

    const globalOverdue = Object.values(completions).reduce((s: number, c: any) => s + (c.overdueTasks || 0), 0);

    return (
        <div>
            {/* Header ... */}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h2>IMMS Global Dashboard</h2>
            </div>

            {/* Welcome card ... */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Welcome back, {user?.username}!</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Your role: <strong>{user?.role}</strong>.{' '}
                    {user?.role === 'VENDOR' ? 'Below are active work orders open for applications.' : 'Live property registry and project overview below.'}
                </p>
                {/* Stats ... */}
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {user?.role !== 'VENDOR' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={24} color="var(--primary)" />
                                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{properties.length}</span>
                                <span style={{ color: 'var(--text-muted)' }}>Properties</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building2 size={24} color="var(--success)" />
                                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{assets.length}</span>
                                <span style={{ color: 'var(--text-muted)' }}>Assets</span>
                            </div>
                        </>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Briefcase size={24} color="var(--warning)" />
                        <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{workOrders.length}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Projects</span>
                    </div>
                </div>
            </div>

            {/* ===== Global overdue warning (Admin only) ===== */}
            {isAdmin && globalOverdue > 0 && (
                <div style={{ background: '#ffebee', border: '1px solid #f44336', borderRadius: 10, padding: '0.85rem 1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <AlertTriangle size={22} color="#c62828" style={{ flexShrink: 0 }} />
                    <div>
                        <strong style={{ color: '#c62828' }}>⚠️ {globalOverdue} overdue task{globalOverdue > 1 ? 's' : ''} across all projects</strong>
                        <div style={{ fontSize: '0.85rem', color: '#c62828', marginTop: 2 }}>
                            These tasks have passed their deadline and are less than 100% complete. Click a project below to view details.
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Project Overview (Admin + Engineer) ===== */}
            {user?.role !== 'VENDOR' && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart2 size={20} color="var(--primary)" /> Project Overview
                        </h3>
                        <button className="btn" onClick={() => navigate('/tasks/list')} style={{ width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                            View All Tasks →
                        </button>
                    </div>

                    {loadingProjects ? (
                        <div className="page-loader"><span className="page-spinner" /></div>
                    ) : workOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            {isAdmin ? 'No projects yet.' : 'No projects assigned to you.'}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {workOrders.map(wo => {
                                const comp = completions[wo.id] || {};
                                const pct = comp.completionPct || 0;
                                const overdue = comp.overdueTasks || 0;

                                return (
                                    <div
                                        key={wo.id}
                                        onClick={() => navigate(`/tasks/gantt?projectId=${wo.id}`)}
                                        style={{
                                            border: `1px solid ${overdue > 0 ? '#ffcdd2' : 'var(--border)'}`,
                                            borderLeft: `4px solid ${pct === 100 ? '#10b981' : overdue > 0 ? '#ef4444' : 'var(--primary)'}`,
                                            borderRadius: 8, padding: '0.9rem 1rem',
                                            cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s',
                                            background: overdue > 0 ? '#fff8f8' : 'white',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = ''; (e.currentTarget as HTMLElement).style.transform = ''; }}
                                    >
                                        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.92rem' }}>{wo.jobTitle || wo.description || `WO #${wo.id}`}</div>
                                        {wo.jobCode && <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{wo.jobCode}</div>}

                                        {/* Progress bar */}
                                        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#10b981' : overdue > 0 ? '#ef4444' : 'var(--primary)', borderRadius: 4, transition: 'width 0.4s' }} />
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>{comp.totalTasks || 0} tasks</span>
                                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                    <CheckCircle2 size={12} style={{ marginRight: 2 }} />{comp.completedTasks || 0} done
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {overdue > 0 && (
                                                    <span style={{ color: '#c62828', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                                                        <AlertTriangle size={12} />{overdue} overdue
                                                    </span>
                                                )}
                                                <span style={{ fontWeight: 800, color: pct === 100 ? '#10b981' : overdue > 0 ? '#ef4444' : 'var(--primary)', fontSize: '1rem' }}>{pct}%</span>
                                            </div>
                                        </div>

                                        {wo.fieldEngineer && (
                                            <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                👷 {wo.fieldEngineer.fullName || wo.fieldEngineer.username}
                                            </div>
                                        )}

                                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: '#f5f5f5', color: '#666' }}>{wo.status}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <BarChart2 size={11} /> View Gantt
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Spatial Map & Filters (non-vendor) */}
            {user?.role !== 'VENDOR' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
                    <div style={{ height: '600px', width: '100%', position: 'relative' }}>
                        
                        {/* Map Filter Panel Overlay */}
                        <div className="map-filter-panel">
                            <div className="map-filter-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Filter size={16} /> Filters
                                </div>
                                {activeFilterCount > 0 && (
                                    <span className="map-filter-badge">{activeFilterCount}</span>
                                )}
                            </div>
                            <div className="map-filter-body">
                                <div>
                                    <div className="map-filter-label">Division</div>
                                    <select className="map-filter-select" value={filterDivision} onChange={e => { setFilterDivision(e.target.value); setFilterDistrict(''); setFilterUpazila(''); }}>
                                        <option value="">Select Division</option>
                                        {divisionOptions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div className="map-filter-label">District</div>
                                    <select className="map-filter-select" value={filterDistrict} onChange={e => { setFilterDistrict(e.target.value); setFilterUpazila(''); }} disabled={!filterDivision}>
                                        <option value="">Select District</option>
                                        {districtOptions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <div className="map-filter-label">Upazila</div>
                                    <select className="map-filter-select" value={filterUpazila} onChange={e => setFilterUpazila(e.target.value)} disabled={!filterDistrict}>
                                        <option value="">Select Upazila</option>
                                        {upazilaOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ padding: '0 12px 10px 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textAlign: 'center' }}>
                                📍 {filteredProperties.length} Infrastructures Found
                            </div>

                            <div className="map-filter-actions">
                                <button className="map-filter-btn-reset" onClick={resetFilters} title="Reset">
                                    <X size={16} />
                                </button>
                                <button className="map-filter-btn-search" onClick={applyFilters}>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Top right toggle */}
                        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}>
                            <button
                                onClick={() => setShowLabels(prev => !prev)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: showLabels ? 'var(--primary)' : 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            >
                                {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
                                {showLabels ? 'Hide Labels' : 'Show Labels'}
                            </button>
                        </div>

                        <MapContainer center={[23.8103, 90.4125]} zoom={7} zoomControl={false} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            <ZoomControl position="bottomright" />
                            
                            {/* Polygon for selected area */}
                            {geoJsonData && (
                                <GeoJSON 
                                    key={geoJsonData.properties?.place_id || 'polygon'}
                                    data={geoJsonData}
                                    style={{
                                        color: 'var(--primary)',
                                        weight: 2,
                                        fillColor: 'var(--primary)',
                                        fillOpacity: 0.15
                                    }}
                                />
                            )}

                            {mappableProperties.map(prop => (
                                <Marker key={`${prop.id}-${showLabels}`} position={[parseFloat(prop.locLat!), parseFloat(prop.locLon!)]} icon={showLabels ? labelIcons[prop.id] : new L.Icon.Default()}>
                                    <Popup>
                                        <div style={{ minWidth: 200 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <span className={`map-marker-badge ${prop.active === false ? 'inactive' : ''}`}>{prop.propertyType?.name || 'INFRASTRUCTURE'}</span>
                                                {prop.active === false && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>INACTIVE</span>}
                                            </div>
                                            <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '15px' }}>{prop.name}</h3>
                                            <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '12px' }}>
                                                <MapPin size={12} style={{ display: 'inline', marginRight: 4 }}/>{prop.address}
                                            </p>
                                            <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '12px' }}>
                                                {prop.division} {prop.district && `> ${prop.district}`} {prop.upazila && `> ${prop.upazila}`}
                                            </p>
                                            
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, fontSize: '11px', flex: 1, textAlign: 'center' }}>
                                                    <strong>{assets.filter(a => a.property?.id === prop.id).length}</strong> Assets
                                                </div>
                                            </div>
                                            
                                            <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '12px', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => navigate(`/properties/${prop.id}`)}>
                                                View Details <ArrowRight size={14}/>
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            )}

            {/* Vendor: work orders */}
            {user?.role === 'VENDOR' && (
                <div style={{ marginTop: '2rem' }}>
                    <WorkOrders />
                </div>
            )}
        </div>
    );
};

export default Dashboard;
