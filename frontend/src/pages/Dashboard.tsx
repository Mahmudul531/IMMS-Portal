import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Building2, MapPin, Eye, EyeOff, AlertTriangle, BarChart2, CheckCircle2, Briefcase } from 'lucide-react';
import WorkOrders from './WorkOrders';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createLabelIcon = (name: string, isActive: boolean) => L.divIcon({
    className: 'property-label-marker',
    html: `<div class="property-label-pin">
              <div class="property-label-dot" style="${!isActive ? 'background: #cbd5e1;' : ''}"></div>
              <div class="property-label-tag" style="${!isActive ? 'background: #f8f9fa; color: #94a3b8; border: 1px solid #e2e8f0;' : ''}">${isActive ? '' : '⚠️ '}${name}</div>
           </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 24],
});

interface Property { id: number; name: string; address: string; locLat?: string; locLon?: string; active?: boolean; }
interface Asset { id: number; name: string; type: string; property: Property; }

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'ADMIN';
    const isEngineer = user?.role === 'ENGINEER';

    const [properties, setProperties] = useState<Property[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [showLabels, setShowLabels] = useState(true);
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [completions, setCompletions] = useState<Record<number, any>>({});
    const [loadingProjects, setLoadingProjects] = useState(false);

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

                // Fetch completion per project
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

    const mappableProperties = properties.filter(p => {
        const lat = parseFloat(p.locLat || '');
        const lon = parseFloat(p.locLon || '');
        return !isNaN(lat) && !isNaN(lon);
    });

    const labelIcons = useMemo(() => {
        const map: Record<number, L.DivIcon> = {};
        mappableProperties.forEach(p => { map[p.id] = createLabelIcon(p.name, p.active !== false); });
        return map;
    }, [mappableProperties]);

    // Global overdue count for admin warning
    const globalOverdue = Object.values(completions).reduce((s: number, c: any) => s + (c.overdueTasks || 0), 0);

    return (
        <div>
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <h2>IMMS Global Dashboard</h2>
            </div>

            {/* Welcome card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3>Welcome back, {user?.username}!</h3>
                <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    Your role: <strong>{user?.role}</strong>.{' '}
                    {user?.role === 'VENDOR' ? 'Below are active work orders open for applications.' : 'Live property registry and project overview below.'}
                </p>
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

            {/* Spatial Map (non-vendor) */}
            {user?.role !== 'VENDOR' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Spatial Registry Map</h3>
                        <button
                            onClick={() => setShowLabels(prev => !prev)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: showLabels ? 'var(--primary)' : 'transparent', color: showLabels ? 'white' : 'var(--text-muted)', border: showLabels ? 'none' : '1px solid var(--border)', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s ease' }}
                        >
                            {showLabels ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showLabels ? 'Hide Labels' : 'Show Labels'}
                        </button>
                    </div>
                    <div style={{ height: '500px', width: '100%' }}>
                        <MapContainer center={[23.8103, 90.4125]} zoom={7} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            {mappableProperties.map(prop => (
                                <Marker key={`${prop.id}-${showLabels}`} position={[parseFloat(prop.locLat!), parseFloat(prop.locLon!)]} icon={showLabels ? labelIcons[prop.id] : new L.Icon.Default()}>
                                    <Popup>
                                        <div>
                                            <h3 style={{ margin: '0 0 4px 0', color: 'var(--primary)', fontSize: '16px' }}>{prop.name}</h3>
                                            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>{prop.address}</p>
                                            <button className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '12px' }} onClick={() => navigate(`/properties/${prop.id}`)}>View Property Details</button>
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
