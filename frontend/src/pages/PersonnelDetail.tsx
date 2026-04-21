import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Building2, Package, Briefcase, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ROLE_COLORS: Record<string, string> = {
    ADMIN: '#7c3aed',
    ENGINEER: '#0284c7',
    TECHNICIAN: '#0891b2',
    VENDOR: '#d97706',
};

const PersonnelDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [person, setPerson] = useState<any>(null);
    const [properties, setProperties] = useState<any[]>([]);
    const [assets, setAssets] = useState<any[]>([]);
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [allProperties, setAllProperties] = useState<any[]>([]);
    const [permGroup, setPermGroup] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [userRes, allPropsRes, assetsRes, woRes] = await Promise.all([
                    axios.get(`${API}/api/users/${id}`),
                    axios.get(`${API}/api/properties`),
                    axios.get(`${API}/api/assets`),
                    axios.get(`${API}/api/work-orders`),
                ]);
                const u = userRes.data;
                setPerson(u);
                setAllProperties(Array.isArray(allPropsRes.data) ? allPropsRes.data : []);

                // Tagged property (from propertyId)
                if (u.propertyId) {
                    const tagged = (Array.isArray(allPropsRes.data) ? allPropsRes.data : []).filter((p: any) => p.id === u.propertyId);
                    setProperties(tagged);
                }

                // Assets assigned to this user
                const allAssets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
                setAssets(allAssets.filter((a: any) => a.assignedUser?.id === parseInt(id!)));

                // Work orders where this user is field engineer
                const allWo = Array.isArray(woRes.data) ? woRes.data : [];
                setWorkOrders(allWo.filter((wo: any) => wo.fieldEngineer?.id === parseInt(id!)));

                // Permission group
                if (u.permissionGroupId) {
                    try {
                        const { data: pg } = await axios.get(`${API}/api/permission-groups`);
                        const group = (Array.isArray(pg) ? pg : []).find((g: any) => g.id === u.permissionGroupId);
                        setPermGroup(group || null);
                    } catch {}
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (!person) return <div className="page-container"><p>User not found.</p></div>;

    const taggedProperty = allProperties.find(p => p.id === person.propertyId);

    return (
        <div className="page-container fade-in">
            <div style={{ marginBottom: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ArrowLeft size={18} /> Back
                </button>
            </div>

            {/* Profile Header */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: `${ROLE_COLORS[person.role] || 'var(--primary)'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `3px solid ${ROLE_COLORS[person.role] || 'var(--primary)'}` }}>
                    <User size={40} color={ROLE_COLORS[person.role] || 'var(--primary)'} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{person.fullName || person.username}</h1>
                        <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, background: `${ROLE_COLORS[person.role] || '#666'}20`, color: ROLE_COLORS[person.role] || '#666' }}>
                            {person.role}
                        </span>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: person.active === false ? '#ffebee' : 'rgba(16,185,129,0.1)', color: person.active === false ? '#c62828' : '#10b981' }}>
                            {person.active === false ? 'Inactive' : 'Active'}
                        </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                        {person.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={14} />{person.email}</span>}
                        {person.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} />{person.phone}</span>}
                        {person.designation && <span>{person.designation}</span>}
                        {person.department && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14} />{person.department}</span>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'center', flexShrink: 0 }}>
                    <div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{assets.length}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assets</div></div>
                    <div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{workOrders.length}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projects</div></div>
                </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Personal Details */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Personal Information</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            ['Username', `@${person.username}`],
                            ['Date of Birth', person.dob || '—'],
                            ['Gender', person.gender || '—'],
                            ['NID / Passport', person.nidOrPassport || '—'],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{val}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Organization + Permissions */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Organization & Permissions</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            ['Department', person.department || '—'],
                            ['Designation', person.designation || '—'],
                            ['Property / Location', taggedProperty?.name || '—'],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{val}</span>
                            </div>
                        ))}
                    </div>
                    {permGroup && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.85rem' }}>Permission Group: <span style={{ color: 'var(--primary)' }}>{permGroup.name}</span></p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {(permGroup.permissions || '').split(',').filter(Boolean).map((p: string) => (
                                    <span key={p} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                                        {p.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assigned Property Map */}
            {taggedProperty && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <MapPin size={18} color="var(--primary)" /> Assigned Property — {taggedProperty.name}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            {[
                                ['Address', taggedProperty.address || '—'],
                                ['City', taggedProperty.city || '—'],
                                ['Type', taggedProperty.propertyType || '—'],
                                ['Status', taggedProperty.active === false ? 'Inactive' : 'Active'],
                            ].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: 80 }}>{label}:</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{val}</span>
                                </div>
                            ))}
                            <button className="btn btn-primary" style={{ width: 'auto', marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => navigate(`/properties/${taggedProperty.id}`)}>
                                View Property Details →
                            </button>
                        </div>
                        <div style={{ height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                            {taggedProperty.locLat && taggedProperty.locLon ? (
                                <MapContainer center={[parseFloat(taggedProperty.locLat), parseFloat(taggedProperty.locLon)]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Marker position={[parseFloat(taggedProperty.locLat), parseFloat(taggedProperty.locLon)]}>
                                        <Popup>{taggedProperty.name}</Popup>
                                    </Marker>
                                </MapContainer>
                            ) : (
                                <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    <MapPin size={32} style={{ opacity: 0.5 }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tagged Assets */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Package size={18} color="var(--primary)" /> Assigned Assets
                    <span style={{ background: 'var(--primary)', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>{assets.length}</span>
                </h2>
                {assets.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No assets assigned to this personnel.</p>
                ) : (
                    <table>
                        <thead><tr><th>Asset Name</th><th>Type</th><th>Category</th><th>Property</th><th></th></tr></thead>
                        <tbody>
                            {assets.map(a => (
                                <tr key={a.id}>
                                    <td><strong>{a.name}</strong></td>
                                    <td>{a.type || '—'}</td>
                                    <td>{a.category || '—'}</td>
                                    <td>{a.property?.name || '—'}</td>
                                    <td><span style={{ color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => navigate(`/assets/${a.id}`)}>View →</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Tagged Projects (for Engineers) */}
            {(person.role === 'ENGINEER' || workOrders.length > 0) && (
                <div className="card">
                    <h2 style={{ fontSize: '1rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={18} color="var(--warning)" /> Projects / Work Orders
                        <span style={{ background: 'var(--warning)', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>{workOrders.length}</span>
                    </h2>
                    {workOrders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No projects assigned to this engineer.</p>
                    ) : (
                        <table>
                            <thead><tr><th>Job Title</th><th>Code</th><th>Property</th><th>Method</th><th>Status</th></tr></thead>
                            <tbody>
                                {workOrders.map(wo => (
                                    <tr key={wo.id}>
                                        <td><strong>{wo.jobTitle || wo.description || `WO #${wo.id}`}</strong></td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--primary)' }}>{wo.jobCode || '—'}</td>
                                        <td>{wo.property?.name || '—'}</td>
                                        <td>{wo.method || '—'}</td>
                                        <td>
                                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: wo.status === 'ASSIGNED' ? 'rgba(16,185,129,0.1)' : '#f5f5f5', color: wo.status === 'ASSIGNED' ? '#10b981' : '#666' }}>
                                                {wo.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default PersonnelDetail;
