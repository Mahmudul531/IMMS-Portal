import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Hammer, CheckCircle, Clock, Users, MapPin, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix generic map marker icon issue securely
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Property {
    id: number;
    name: string;
    locLat: string;
    locLon: string;
}

interface Asset {
    id: number;
    name: string;
    property?: Property;
}

interface Vendor {
    id: number;
    username: string;
}

interface WorkOrder {
    id: number;
    description: string;
    status: string;
    amount?: number;
    asset: Asset;
    vendor?: Vendor;
    createdAt?: string;
}

interface WorkOrderApplication {
    id: number;
    amount: number;
    status: string;
    vendor: Vendor;
}

const WorkOrders = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    
    const [description, setDescription] = useState('');
    const [assetId, setAssetId] = useState('');

    const [showMapModal, setShowMapModal] = useState(false);
    const [mapParams, setMapParams] = useState<{lat:number, lon:number, title:string} | null>(null);

    const [showAppsModal, setShowAppsModal] = useState(false);
    const [activeApps, setActiveApps] = useState<WorkOrderApplication[]>([]);
    const [activeWoId, setActiveWoId] = useState<number | null>(null);

    const [appliedWoIds, setAppliedWoIds] = useState<Set<number>>(new Set());

    const fetchData = async () => {
        try {
            const woRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders`);
            const woData = Array.isArray(woRes.data) ? woRes.data : [];
            setWorkOrders([...woData].reverse()); // LIFO order
            
            if (isAdmin) {
                const [assetRes, propRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets`),
                    axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties`)
                ]);
                const assetData = Array.isArray(assetRes.data) ? assetRes.data : [];
                const propData = Array.isArray(propRes.data) ? propRes.data : [];
                setAssets(assetData);
                setProperties(propData);
            } else if (user?.id) {
                const appsRes = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders/my-applications?vendorId=${user.id}`);
                const appliedIds = new Set<number>((appsRes.data || []).map((app: any) => app.workOrder?.id).filter(Boolean));
                setAppliedWoIds(appliedIds);
            }
        } catch (error) {
            console.error('Error fetching data', error);
        }
    };

    useEffect(() => {
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAdmin]);

    const handleCreateWorkOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders`, {
                description,
                assetId: parseInt(assetId)
            });
            setDescription('');
            fetchData();
            alert('Work Order Broadcasted Successfully!');
        } catch (error) {
            console.error(error);
        }
    };

    const handleApply = async (id: number) => {
        const amountStr = prompt('Enter your strict bidding BDT amount (৳) for this operational task:');
        if (!amountStr) return;
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert('A realistic numerical bid must be placed to qualify.');
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders/${id}/applications?vendorId=${user?.id}&amount=${amount}`);
            fetchData();
            alert('Competitive Application securely logged!');
        } catch (error) {
            console.error(error);
            alert('There was an error communicating your bid.');
        }
    };

    const viewApplications = async (woId: number) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders/${woId}/applications`);
            setActiveApps(res.data);
            setActiveWoId(woId);
            setShowAppsModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const handleApproveApplication = async (appId: number) => {
        if (!activeWoId) return;
        if (!confirm('Are you definitively assigning this Vendor permanently?')) return;
        
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders/${activeWoId}/assign?applicationId=${appId}`);
            setShowAppsModal(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Failed validation sequence on assignment.');
        }
    };

    const handleCancelOrder = async (id: number) => {
        if (!confirm('Strictly CANCEL this broadcasted Work Order?')) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/work-orders/${id}/cancel`);
            fetchData();
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.response?.data || error.message}`);
        }
    };

    const openMap = (lat: string, lon: string, name: string) => {
        const pLat = parseFloat(lat);
        const pLon = parseFloat(lon);
        if (isNaN(pLat) || isNaN(pLon)) {
            alert('This property does not have valid geographical coordinates mapped.');
            return;
        }
        setMapParams({ lat: pLat, lon: pLon, title: name });
        setShowMapModal(true);
    };

    const displayOrders = workOrders.filter(wo => {
        let isVisible = false;
        if (isAdmin) {
            isVisible = true; 
        } else if (wo.status === 'PENDING') {
            isVisible = true;
        } else if (wo.status === 'APPLIED' || wo.status === 'ASSIGNED') {
            isVisible = wo.vendor?.id === user?.id;
        }

        if (!isVisible) return false;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const descMatch = wo.description?.toLowerCase().includes(term);
            const assetMatch = wo.asset?.name?.toLowerCase().includes(term);
            if (!descMatch && !assetMatch) {
                return false;
            }
        }
        
        if (dateFrom) {
            // wo.createdAt is formatted YYYY-MM-DD from backend Java LocalDate
            if (!wo.createdAt || new Date(wo.createdAt) < new Date(dateFrom)) {
                return false;
            }
        }

        return true; 
    });

    const totalPages = Math.ceil(displayOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = displayOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'PENDING': return { background: '#f5f5f5', color: '#666' };
            case 'APPLIED': return { background: '#fff4cc', color: '#997a00' };
            case 'ASSIGNED': return { background: 'var(--success)', color: 'white' };
            case 'CANCELLED': return { background: '#ffebee', color: '#c62828' };
            default: return {};
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>{isAdmin ? 'Administrative Work Orders' : 'Vendor Service Bidding'}</h2>
            </div>

            {isAdmin && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hammer size={20} /> Deploy Technical Duty
                    </h3>
                    <form onSubmit={handleCreateWorkOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">Describe Operational Scope</label>
                            <input className="form-input" value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>

                        {/* Step 1: Select Property */}
                        <div className="form-group">
                            <label className="form-label">1. Select Property</label>
                            <select
                                className="form-input"
                                value={selectedPropertyId}
                                onChange={e => {
                                    setSelectedPropertyId(e.target.value);
                                    setAssetId(''); // reset asset when property changes
                                }}
                                required
                            >
                                <option value="">-- Choose a property --</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Step 2: Select Asset filtered by property */}
                        <div className="form-group">
                            <label className="form-label">2. Link Sub-Asset</label>
                            <select
                                className="form-input"
                                value={assetId}
                                onChange={e => setAssetId(e.target.value)}
                                required
                                disabled={!selectedPropertyId}
                            >
                                <option value="">
                                    {selectedPropertyId ? '-- Choose an asset --' : '-- Select a property first --'}
                                </option>
                                {assets
                                    .filter(a => String(a.property?.id) === selectedPropertyId)
                                    .map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))
                                }
                            </select>
                            {selectedPropertyId && assets.filter(a => String(a.property?.id) === selectedPropertyId).length === 0 && (
                                <small style={{ color: 'var(--danger)', marginTop: '4px', display: 'block' }}>No assets registered for this property.</small>
                            )}
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={!assetId}>
                                Broadcast Work Order Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Task Directives Timeline</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input 
                                className="form-input" 
                                type="text" 
                                placeholder="Search tasks or assets..." 
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '0.4rem 0.8rem', minWidth: '220px' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date From:</span>
                            <input 
                                className="form-input" 
                                type="date" 
                                value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '0.4rem 0.8rem' }}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="table-container">
                    <table>
                        <thead>
                        <tr>
                            <th>Duty ID</th>
                            <th>Description</th>
                            <th>Date Issued</th>
                            <th>Status Badge</th>
                            <th>Associated Asset Link</th>
                            {isAdmin && <th>Contract Awarded To</th>}
                            <th>Amount Matrix</th>
                            <th>Actions Interface</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedOrders.map(wo => (
                            <tr key={wo.id}>
                                <td>#{wo.id}</td>
                                <td><strong>{wo.description}</strong></td>
                                <td>{wo.createdAt || 'N/A'}</td>
                                <td>
                                    <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, ...getStatusStyle(wo.status) }}>
                                        {wo.status}
                                    </span>
                                </td>
                                <td>
                                    {isAdmin && wo.asset?.property?.locLat ? (
                                        <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize:'0.8rem', display:'inline-flex', alignItems:'center', background:'transparent', color:'var(--primary)' }} 
                                            onClick={() => openMap(wo.asset.property?.locLat || '', wo.asset.property?.locLon || '', wo.asset?.name || 'Asset')}>
                                            <MapPin size={14} style={{ marginRight:'4px' }} /> {wo.asset?.name || 'Asset'}
                                        </button>
                                    ) : (
                                        wo.asset?.name || 'Unknown'
                                    )}
                                </td>
                                {isAdmin && (
                                    <td>
                                        {wo.vendor ? (
                                            <span style={{ color: 'var(--primary)', fontWeight:'bold' }}>@{wo.vendor.username}</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>Pending Signature</span>
                                        )}
                                    </td>
                                )}
                                <td>{wo.amount != null ? `৳${Number(wo.amount).toFixed(2)}` : '--'}</td>
                                <td>
                                    {!isAdmin && ['PENDING', 'APPLIED'].includes(wo.status) && (
                                        appliedWoIds.has(wo.id) ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}><Clock size={14} style={{ marginRight:'4px' }}/> Application Under Review</span>
                                        ) : (
                                            <button className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', width: 'auto' }} onClick={() => handleApply(wo.id)}>
                                                <CheckCircle size={14} style={{ marginRight:'4px' }}/> Compete/Apply
                                            </button>
                                        )
                                    )}
                                    {!isAdmin && wo.status === 'ASSIGNED' && wo.vendor?.id === user?.id && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 'bold' }}>Job Contract Yours!</span>
                                    )}
                                    
                                    {isAdmin && ['PENDING', 'APPLIED'].includes(wo.status) && (
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center' }} onClick={() => viewApplications(wo.id)}>
                                                <Users size={14} style={{ marginRight:'4px' }}/> View Applications
                                            </span>
                                            <span style={{ fontSize: '0.8rem', cursor: 'pointer', color: 'var(--danger)', textDecoration: 'underline', display: 'flex', alignItems: 'center' }} onClick={() => handleCancelOrder(wo.id)}>
                                                <X size={14} style={{ marginRight:'4px' }}/> Cancel Order
                                            </span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {paginatedOrders.length === 0 && (
                            <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)'}}>{displayOrders.length === 0 ? "No active directives." : "No directives match search filters."}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 'auto', padding: '0.3rem 0.8rem' }}>Prev</button>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                    <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 'auto', padding: '0.3rem 0.8rem' }}>Next</button>
                </div>
            )}

            </div>

            {/* Applications Modal */}
            {showAppsModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, display:'flex', alignItems:'center', gap:'0.5rem' }}><Users size={20} /> Vendor Competitive Bids</h3>
                            <button onClick={() => setShowAppsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'auto' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Vendor Signature</th>
                                        <th>Bid Threshold</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeApps.map(app => (
                                        <tr key={app.id}>
                                            <td><strong>@{app.vendor.username}</strong></td>
                                            <td>৳{app.amount.toFixed(2)}</td>
                                            <td>
                                                {app.status === 'APPLIED' ? (
                                                    <button className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize:'0.8rem', width:'auto' }} onClick={() => handleApproveApplication(app.id)}>Assign Vendor</button>
                                                ) : (
                                                    <span style={{ color:'var(--success)', fontSize:'0.8rem', fontWeight:'bold' }}>{app.status}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {activeApps.length === 0 && (
                                        <tr><td colSpan={3} style={{textAlign:'center', color:'var(--text-muted)'}}>No vendors have secured bids yet.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && mapParams && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Viewing: {mapParams.title}</h3>
                            <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
                            <MapContainer center={[mapParams.lat, mapParams.lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <Marker position={[mapParams.lat, mapParams.lon]}>
                                    <Popup>{mapParams.title}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkOrders;
