import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2, Filter, MapPin, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const statusColors: Record<string, { bg: string; color: string }> = {
    PENDING:   { bg: '#f5f5f5', color: '#666' },
    APPLIED:   { bg: '#fff4cc', color: '#997a00' },
    ASSIGNED:  { bg: 'rgba(0,180,100,0.1)', color: 'var(--success)' },
    CANCELLED: { bg: '#ffebee', color: '#c62828' },
    COMPLETED: { bg: 'rgba(16,185,129,0.1)', color: '#059669' },
};

const ProjectList = () => {
    const { user, hasPermission } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const navigate = useNavigate();

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [methodFilter, setMethodFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 8;

    const [appliedWoIds, setAppliedWoIds] = useState<Set<number>>(new Set());
    const [showAppsModal, setShowAppsModal] = useState(false);
    const [activeApps, setActiveApps] = useState<any[]>([]);
    const [activeWoId, setActiveWoId] = useState<number | null>(null);
    const [showMapModal, setShowMapModal] = useState(false);
    const [mapParams, setMapParams] = useState<{ lat: number; lon: number; title: string } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const woRes = await axios.get(`${API}/api/work-orders`);
            setWorkOrders([...(Array.isArray(woRes.data) ? woRes.data : [])].reverse());

            if (!isAdmin && user?.id) {
                const appsRes = await axios.get(`${API}/api/work-orders/my-applications?vendorId=${user.id}`);
                setAppliedWoIds(new Set((appsRes.data || []).map((a: any) => a.workOrder?.id).filter(Boolean)));
            }
        } catch (err) {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this project/work order?')) return;
        try {
            await axios.delete(`${API}/api/work-orders/${id}`);
            toast.success('Deleted');
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data || err.message;
            toast.error(typeof msg === 'string' ? msg : 'Delete failed — project may have linked records.');
        }
    };

    const handleApply = async (id: number) => {
        const amountStr = prompt('Enter your bid amount (৳):');
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) { alert('Enter a valid amount.'); return; }
        try {
            await axios.post(`${API}/api/work-orders/${id}/applications?vendorId=${user?.id}&amount=${amount}`);
            toast.success('Application submitted!');
            fetchData();
        } catch { toast.error('Application failed.'); }
    };

    const viewApplications = async (woId: number) => {
        const res = await axios.get(`${API}/api/work-orders/${woId}/applications`);
        setActiveApps(res.data);
        setActiveWoId(woId);
        setShowAppsModal(true);
    };

    const handleApprove = async (appId: number) => {
        if (!activeWoId) return;
        if (!confirm('Assign this vendor?')) return;
        await axios.put(`${API}/api/work-orders/${activeWoId}/assign?applicationId=${appId}`);
        setShowAppsModal(false);
        fetchData();
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Cancel this work order?')) return;
        try {
            await axios.put(`${API}/api/work-orders/${id}/cancel`);
            fetchData();
        } catch (err: any) { toast.error(err.response?.data || 'Cancel failed'); }
    };

    const openMap = (lat: string, lon: string, name: string) => {
        const pLat = parseFloat(lat), pLon = parseFloat(lon);
        if (isNaN(pLat) || isNaN(pLon)) { alert('No coordinates available.'); return; }
        setMapParams({ lat: pLat, lon: pLon, title: name });
        setShowMapModal(true);
    };

    const allMethods = [...new Set(workOrders.map(w => w.method).filter(Boolean))];

    const filtered = workOrders.filter(wo => {
        let visible = isAdmin || wo.status === 'PENDING' || wo.vendor?.id === user?.id;
        if (!visible) return false;
        if (statusFilter !== 'ALL' && wo.status !== statusFilter) return false;
        if (methodFilter && wo.method !== methodFilter) return false;
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!wo.jobTitle?.toLowerCase().includes(t) && !wo.jobCode?.toLowerCase().includes(t) && !wo.property?.name?.toLowerCase().includes(t)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Projects / Work Orders</h2>
                {hasPermission('CREATE_WORK_ORDER') && (
                    <button className="btn btn-primary" onClick={() => navigate('/work-orders/add')} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> New Project
                    </button>
                )}
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <Filter size={18} style={{ color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', minWidth: '240px' }} placeholder="Search title, code, property..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    <select className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPLIED">Applied</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <select className="form-input" style={{ background: 'white', padding: '0.4rem 0.8rem', width: 'auto' }} value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="">All Methods</option>
                        {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="page-loader"><span className="page-spinner" /><span>Loading projects...</span></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Job Title / Code</th>
                                    <th>Property</th>
                                    <th>Method</th>
                                    <th>Timeline</th>
                                    <th>Budget</th>
                                    <th>Engineer</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(wo => (
                                    <tr key={wo.id}>
                                        <td>
                                            <div
                                                onClick={() => navigate(`/work-orders/${wo.id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                                                    {wo.jobTitle || wo.description || `WO #${wo.id}`}
                                                </div>
                                                {wo.jobCode && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{wo.jobCode}</div>}
                                            </div>
                                        </td>
                                        <td>
                                            {wo.property ? (
                                                <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'transparent', color: 'var(--primary)' }}
                                                    onClick={() => wo.property?.locLat && openMap(wo.property.locLat, wo.property.locLon, wo.property.name)}>
                                                    <MapPin size={13} style={{ marginRight: 4 }} />{wo.property.name}
                                                </button>
                                            ) : '—'}
                                        </td>
                                        <td>{wo.method || '—'}</td>
                                        <td style={{ fontSize: '0.8rem' }}>
                                            {wo.publishDate && <div>From: {wo.publishDate}</div>}
                                            {wo.closeDate && <div style={{ color: 'var(--danger)' }}>To: {wo.closeDate}</div>}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {wo.budgetStart && wo.budgetEnd ? `৳${Number(wo.budgetStart).toLocaleString()} – ৳${Number(wo.budgetEnd).toLocaleString()}` : wo.budgetStart ? `৳${Number(wo.budgetStart).toLocaleString()}` : '—'}
                                        </td>
                                        <td style={{ fontSize: '0.85rem' }}>
                                            {wo.fieldEngineer ? (
                                                <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/personnel/${wo.fieldEngineer.id}`)}>
                                                    {wo.fieldEngineer.fullName || wo.fieldEngineer.username}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, ...(statusColors[wo.status] || {}) }}>
                                                {wo.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                {hasPermission('EDIT_WORK_ORDER') && (
                                                    <>
                                                        {wo.status !== 'CANCELLED' && (
                                                            <button className="action-btn" title="Edit" onClick={() => navigate(`/work-orders/add?id=${wo.id}`)}><Edit2 size={16} /></button>
                                                        )}
                                                        {['PENDING', 'APPLIED'].includes(wo.status) && isAdmin && (
                                                            <>
                                                                <button className="action-btn" title="View Applications" onClick={() => viewApplications(wo.id)} style={{ color: 'var(--warning)' }}><Users size={16} /></button>
                                                                <button className="action-btn" title="Cancel" onClick={() => handleCancel(wo.id)} style={{ color: 'var(--danger)' }}><X size={16} /></button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {hasPermission('DELETE_WORK_ORDER') && (
                                                    <button className="action-btn" title="Delete" onClick={() => handleDelete(wo.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                                                )}
                                                {!isAdmin && wo.status === 'PENDING' && !appliedWoIds.has(wo.id) && (
                                                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', width: 'auto' }} onClick={() => handleApply(wo.id)}>Apply</button>
                                                )}
                                                {!isAdmin && appliedWoIds.has(wo.id) && (
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>Applied ✓</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {paginated.length === 0 && (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No projects found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                        <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Previous</button>
                        <span style={{ fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                        <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Next</button>
                    </div>
                )}
            </div>

            {/* Applications Modal */}
            {showAppsModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Vendor Applications</h3>
                            <button onClick={() => setShowAppsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table><thead><tr><th>Vendor</th><th>Bid Amount</th><th>Action</th></tr></thead>
                                <tbody>
                                    {activeApps.map(app => (
                                        <tr key={app.id}>
                                            <td><strong>@{app.vendor.username}</strong></td>
                                            <td>৳{app.amount?.toFixed(2)}</td>
                                            <td>{app.status === 'APPLIED' ? <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', width: 'auto' }} onClick={() => handleApprove(app.id)}>Assign</button> : <span style={{ color: 'var(--success)', fontWeight: 700 }}>{app.status}</span>}</td>
                                        </tr>
                                    ))}
                                    {activeApps.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No applications yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && mapParams && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', width: '700px', height: '500px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{mapParams.title}</h3>
                            <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
                            <MapContainer center={[mapParams.lat, mapParams.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[mapParams.lat, mapParams.lon]}><Popup>{mapParams.title}</Popup></Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectList;
