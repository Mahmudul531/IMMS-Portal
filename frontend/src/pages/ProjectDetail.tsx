import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Briefcase, MapPin, Package, Users, Edit2,
    XCircle, CheckCircle, Loader2, Calendar, DollarSign,
    User, Phone, Mail, AlertTriangle, FileText
} from 'lucide-react';
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

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: '#f5f5f5',                  color: '#666',          label: 'Pending' },
    APPLIED:   { bg: '#fff4cc',                  color: '#997a00',       label: 'Applications Received' },
    ASSIGNED:  { bg: 'rgba(0,180,100,0.1)',       color: 'var(--success)', label: 'Assigned' },
    CANCELLED: { bg: '#ffebee',                  color: '#c62828',       label: 'Cancelled' },
    COMPLETED: { bg: 'rgba(16,185,129,0.1)',      color: '#059669',       label: 'Completed' },
};

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div style={{ display: 'flex', gap: '1rem', paddingBottom: '0.6rem', marginBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: 140, flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
);

const ProjectDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isVendor = user?.role === 'VENDOR';

    const [wo, setWo] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [applyAmount, setApplyAmount] = useState('');
    const [applyLoading, setApplyLoading] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [woRes, appsRes] = await Promise.all([
                axios.get(`${API}/api/work-orders/${id}`),
                axios.get(`${API}/api/work-orders/${id}/applications`),
            ]);
            setWo(woRes.data);
            const apps = Array.isArray(appsRes.data) ? appsRes.data : [];
            setApplications(apps);
            if (isVendor && user?.id) {
                setHasApplied(apps.some((a: any) => a.vendor?.id === user.id));
            }
        } catch (err) {
            toast.error('Failed to load project details');
        } finally {
            setLoading(false);
        }
    }, [id, isVendor, user?.id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleAssign = async (appId: number) => {
        if (!confirm('Assign this vendor to the project?')) return;
        setAssigning(appId);
        try {
            await axios.put(`${API}/api/work-orders/${id}/assign?applicationId=${appId}`);
            toast.success('Vendor assigned successfully');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data || 'Assignment failed');
        } finally {
            setAssigning(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Cancel this project? This action cannot be undone.')) return;
        setCancelling(true);
        try {
            await axios.put(`${API}/api/work-orders/${id}/cancel`);
            toast.success('Project cancelled');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data || 'Cancel failed');
        } finally {
            setCancelling(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(applyAmount);
        if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid bid amount'); return; }
        setApplyLoading(true);
        try {
            await axios.post(`${API}/api/work-orders/${id}/applications?vendorId=${user?.id}&amount=${amount}`);
            toast.success('Application submitted!');
            setApplyAmount('');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data || 'Application failed');
        } finally {
            setApplyLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
            <Loader2 size={36} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Loading project details...</span>
        </div>
    );

    if (!wo) return (
        <div className="page-container">
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <AlertTriangle size={40} color="var(--warning)" style={{ marginBottom: 12 }} />
                <p>Project not found.</p>
                <button className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }} onClick={() => navigate('/work-orders/list')}>Back to List</button>
            </div>
        </div>
    );

    const statusStyle = STATUS_STYLES[wo.status] || STATUS_STYLES.PENDING;
    const property = wo.property;
    const taggedAssets: any[] = wo.taggedAssets || [];
    const canCancel = isAdmin && ['PENDING', 'APPLIED'].includes(wo.status);

    const propLat = property?.locLat ? parseFloat(property.locLat) : null;
    const propLon = property?.locLon ? parseFloat(property.locLon) : null;
    const hasMap = propLat !== null && !isNaN(propLat) && propLon !== null && !isNaN(propLon);

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>

            {/* Back + Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <button
                    className="btn"
                    onClick={() => navigate('/work-orders/list')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', width: 'auto' }}
                >
                    <ArrowLeft size={18} /> Back to List
                </button>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {isAdmin && wo.status !== 'CANCELLED' && (
                        <button
                            className="btn"
                            onClick={() => navigate(`/work-orders/add?id=${wo.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', width: 'auto', color: 'var(--primary)' }}
                        >
                            <Edit2 size={16} /> Edit Project
                        </button>
                    )}
                    {canCancel && (
                        <button
                            className="btn"
                            onClick={handleCancel}
                            disabled={cancelling}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffebee', border: '1px solid #f44336', color: '#c62828', width: 'auto' }}
                        >
                            <XCircle size={16} /> {cancelling ? 'Cancelling...' : 'Cancel Project'}
                        </button>
                    )}
                </div>
            </div>

            {/* Title card */}
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `5px solid ${statusStyle.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <Briefcase size={28} color={statusStyle.color} />
                            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{wo.jobTitle || wo.description || `Work Order #${wo.id}`}</h1>
                        </div>
                        {wo.jobCode && (
                            <div style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: 'var(--text-muted)', marginLeft: 40, letterSpacing: 1 }}>
                                {wo.jobCode}
                            </div>
                        )}
                    </div>
                    <span style={{
                        padding: '6px 18px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700,
                        background: statusStyle.bg, color: statusStyle.color, flexShrink: 0, alignSelf: 'flex-start'
                    }}>
                        {statusStyle.label}
                    </span>
                </div>
            </div>

            {/* Two-column: Job Info + Engineer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Job Details */}
                <div className="card">
                    <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} color="var(--primary)" /> Job Details
                    </h2>
                    <InfoRow label="Method" value={wo.method} />
                    <InfoRow label="Status" value={statusStyle.label} />
                    <InfoRow
                        label="Timeline"
                        value={wo.publishDate && wo.closeDate ? `${wo.publishDate} → ${wo.closeDate}` : wo.publishDate || wo.closeDate || null}
                    />
                    <InfoRow
                        label="Budget Range"
                        value={wo.budgetStart && wo.budgetEnd
                            ? `৳${Number(wo.budgetStart).toLocaleString()} – ৳${Number(wo.budgetEnd).toLocaleString()}`
                            : wo.budgetStart ? `৳${Number(wo.budgetStart).toLocaleString()}` : null}
                    />
                    <InfoRow label="Created" value={wo.createdAt} />
                    {wo.vendor && (
                        <InfoRow label="Assigned Vendor" value={`@${wo.vendor.username}`} />
                    )}
                    {wo.amount && (
                        <InfoRow label="Contracted Amount" value={`৳${Number(wo.amount).toLocaleString()}`} />
                    )}
                </div>

                {/* Field Engineer */}
                <div className="card">
                    <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={18} color="var(--primary)" /> Field Engineer
                    </h2>
                    {wo.fieldEngineer ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={24} color="var(--primary)" />
                            </div>
                            <div>
                                <div
                                    style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                                    onClick={() => navigate(`/personnel/${wo.fieldEngineer.id}`)}
                                >
                                    {wo.fieldEngineer.fullName || wo.fieldEngineer.username}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{wo.fieldEngineer.username}</div>
                                {wo.fieldEngineer.designation && <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 2 }}>{wo.fieldEngineer.designation}</div>}
                                {wo.fieldEngineer.phone && (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                        <Phone size={12} />{wo.fieldEngineer.phone}
                                    </div>
                                )}
                                {wo.fieldEngineer.email && (
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                        <Mail size={12} />{wo.fieldEngineer.email}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                            No engineer assigned
                        </div>
                    )}
                </div>
            </div>

            {/* Description / Eligibility */}
            {(wo.eligibility || wo.description) && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={18} color="var(--primary)" /> Description & Eligibility
                    </h2>
                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, lineHeight: 1.7, fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                        {wo.eligibility || wo.description}
                    </div>
                </div>
            )}

            {/* Property */}
            {property && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={18} color="var(--primary)" /> Property / Location
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: hasMap ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                        <div>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span
                                    style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                                    onClick={() => navigate(`/properties/${property.id}`)}
                                >
                                    {property.name}
                                </span>
                                {property.code && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{property.code}</span>}
                            </div>
                            {property.propertyType?.name && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 600 }}>
                                        {property.propertyType.name}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                                {property.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem' }}>
                                        <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                                        <span>{property.address}{property.city ? `, ${property.city}` : ''}</span>
                                    </div>
                                )}
                                {property.managerName && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                                        <User size={14} color="var(--text-muted)" />
                                        <span>Manager: <strong>{property.managerName}</strong></span>
                                    </div>
                                )}
                                {property.contactPhone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                                        <Phone size={14} color="var(--text-muted)" />
                                        <span>{property.contactPhone}</span>
                                    </div>
                                )}
                                {property.contactEmail && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
                                        <Mail size={14} color="var(--text-muted)" />
                                        <span>{property.contactEmail}</span>
                                    </div>
                                )}
                                {property.description && (
                                    <div style={{ marginTop: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', lineHeight: 1.6, border: '1px solid var(--border)' }}>
                                        {property.description}
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: 'auto', marginTop: '1rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                onClick={() => navigate(`/properties/${property.id}`)}
                            >
                                View Full Property Details →
                            </button>
                        </div>
                        {hasMap && (
                            <div style={{ height: '240px', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <MapContainer center={[propLat!, propLon!]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[propLat!, propLon!]}>
                                        <Popup>{property.name}</Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tagged Assets */}
            {taggedAssets.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Package size={18} color="var(--primary)" /> Tagged Assets
                        <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem' }}>{taggedAssets.length}</span>
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {taggedAssets.map((a: any) => (
                            <div
                                key={a.id}
                                onClick={() => navigate(`/assets/${a.id}`)}
                                style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem', cursor: 'pointer', transition: 'all 0.15s', borderLeft: '4px solid var(--primary)' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.04)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.name}</div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {a.type && (
                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>{a.type}</span>
                                    )}
                                    {a.category && (
                                        <span style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem' }}>{a.category}</span>
                                    )}
                                </div>
                                {a.description && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {a.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vendor Bid - Apply Form (for Vendors) */}
            {isVendor && wo.status === 'PENDING' && !hasApplied && (
                <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                    <h2 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DollarSign size={18} color="var(--warning)" /> Submit Your Bid
                    </h2>
                    <form onSubmit={handleApply} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', maxWidth: 480 }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="form-label">Bid Amount (৳) <span style={{ color: 'red' }}>*</span></label>
                            <input
                                className="form-input"
                                type="number"
                                step="0.01"
                                min="1"
                                value={applyAmount}
                                onChange={e => setApplyAmount(e.target.value)}
                                placeholder="Enter your bid..."
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1.5rem', height: 40 }} disabled={applyLoading}>
                            {applyLoading ? 'Submitting...' : 'Submit Bid'}
                        </button>
                    </form>
                </div>
            )}
            {isVendor && hasApplied && (
                <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', background: 'rgba(16,185,129,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={22} color="var(--success)" />
                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>You have already submitted a bid for this project.</span>
                    </div>
                </div>
            )}

            {/* Applications table (Admin only) */}
            {isAdmin && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} color="var(--warning)" /> Vendor Applications
                        <span style={{ background: 'var(--warning)', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem' }}>{applications.length}</span>
                    </h2>
                    {applications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>
                            No applications submitted yet.
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Vendor</th>
                                        <th>Bid Amount</th>
                                        <th>Applied On</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app, index) => (
                                        <tr key={app.id} style={{ background: app.status === 'APPROVED' ? 'rgba(16,185,129,0.04)' : 'white' }}>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{index + 1}</td>
                                            <td>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{app.vendor?.username}</div>
                                                    {app.vendor?.email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.vendor.email}</div>}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: app.status === 'APPROVED' ? 'var(--success)' : 'inherit' }}>
                                                ৳{Number(app.amount).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {app.appliedAt || '—'}
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                                                    background: app.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : '#fff4cc',
                                                    color: app.status === 'APPROVED' ? 'var(--success)' : '#997a00'
                                                }}>
                                                    {app.status === 'APPROVED' ? 'Assigned' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                {app.status === 'APPLIED' && wo.status !== 'ASSIGNED' && wo.status !== 'CANCELLED' ? (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                                        onClick={() => handleAssign(app.id)}
                                                        disabled={assigning === app.id}
                                                    >
                                                        <CheckCircle size={14} />
                                                        {assigning === app.id ? 'Assigning...' : 'Assign Vendor'}
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                        {app.status === 'APPROVED' ? '✓ Assigned' : '—'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Project (bottom, prominent) */}
            {canCancel && (
                <div className="card" style={{ borderLeft: '4px solid #f44336', background: '#fff8f8' }}>
                    <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#c62828', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={18} /> Danger Zone
                    </h2>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#555' }}>
                        Cancelling this project will set it to <strong>CANCELLED</strong> status. This cannot be undone.
                    </p>
                    <button
                        className="btn"
                        onClick={handleCancel}
                        disabled={cancelling}
                        style={{ background: '#c62828', color: 'white', border: 'none', width: 'auto', padding: '0.6rem 1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <XCircle size={18} /> {cancelling ? 'Cancelling...' : 'Cancel This Project'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProjectDetail;
