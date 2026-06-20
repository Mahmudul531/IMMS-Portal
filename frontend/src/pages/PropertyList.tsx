import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit2, MapIcon, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Property {
    id: number;
    name: string;
    code: string;
    address: string;
    city: string;
    active: boolean;
    propertyType: { id: number, name: string } | null;
    locLat?: string;
    locLon?: string;
    createdAt?: string;
}

interface PropertyImage {
    id: number;
    imageData: string;
}

interface City {
    id: number;
    name: string;
    active: boolean;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PropertyList = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [propertyImages, setPropertyImages] = useState<Record<number, PropertyImage[]>>({});

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, INACTIVE
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Lightbox
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    useEffect(() => { 
        fetchProperties(); 
        fetchCities();
    }, []);

    const fetchProperties = async () => {
        try {
            const { data } = await axios.get(`${API}/api/properties`);
            const propData = Array.isArray(data) ? data : [];
            setProperties([...propData].reverse());
        } catch (error) { 
            toast.error('Failed to load properties');
        } finally { 
            setListLoading(false); 
        }
    };

    const fetchCities = async () => {
        try {
            const { data } = await axios.get(`${API}/api/cities`);
            setCities(data);
        } catch (_) {}
    };

    const fetchImagesForProperty = async (propId: number) => {
        try {
            const { data } = await axios.get(`${API}/api/properties/${propId}/images`);
            setPropertyImages(prev => ({ ...prev, [propId]: data }));
        } catch (_) { }
    };

    const handleEdit = (prop: Property) => {
        navigate(`/properties/add?id=${prop.id}`);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this property?')) return;
        try {
            await axios.delete(`${API}/api/properties/${id}`);
            toast.success('Property deleted');
            fetchProperties();
        } catch (error) { 
            toast.error('Failed to delete property');
        }
    };

    const filteredProps = properties.filter(prop => {
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            const nameMatch = prop.name?.toLowerCase().includes(t);
            const codeMatch = prop.code?.toLowerCase().includes(t);
            const addrMatch = prop.address?.toLowerCase().includes(t);
            if (!nameMatch && !codeMatch && !addrMatch) return false;
        }
        if (filterCity && filterCity !== '') {
            if (prop.city !== filterCity) return false;
        }
        if (filterStatus === 'ACTIVE' && prop.active === false) return false;
        if (filterStatus === 'INACTIVE' && prop.active !== false) return false;
        
        return true;
    });

    const totalPages = Math.ceil(filteredProps.length / ITEMS_PER_PAGE);
    const paginatedProps = filteredProps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        paginatedProps.forEach(p => { if (!propertyImages[p.id]) fetchImagesForProperty(p.id); });
    }, [paginatedProps.map(p => p.id).join(',')]);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Registered Infrastructures</h2>
                <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>Add New Infrastructure</button>
            </div>

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                {/* Filters — all fields side by side */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    flexWrap: 'wrap', marginBottom: '1.5rem',
                    background: '#f8fafc', padding: '0.85rem 1rem',
                    borderRadius: '8px', border: '1px solid var(--border)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Filter size={16} /> Filters:
                    </div>
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Search by name, code or address..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '1 1 200px', minWidth: 0 }}
                    />
                    <select
                        className="form-input"
                        value={filterCity}
                        onChange={e => { setFilterCity(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 160px', minWidth: 120 }}
                    >
                        <option value="">All Cities</option>
                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <select
                        className="form-input"
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 150px', minWidth: 120 }}
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                {listLoading ? (
                    <div className="page-loader">
                        <span className="page-spinner" />
                        <span>Loading properties...</span>
                    </div>
                ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name & Type</th>
                                <th>Photos</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProps.map(prop => (
                                <tr key={prop.id} style={{ background: prop.active ? 'transparent' : '#f8f9fa' }}>
                                    <td style={{ fontWeight: 600 }}>{prop.code || 'N/A'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span onClick={() => navigate(`/properties/${prop.id}`)}
                                                style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                title="View property detail">
                                                <ExternalLink size={14} />{prop.name}
                                            </span>
                                            <small style={{ color: 'var(--text-muted)' }}>{prop.propertyType?.name || 'No Type'}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {(propertyImages[prop.id] || []).slice(0, 3).map(img => (
                                                <img key={img.id} src={`${img.imageData}`} alt=""
                                                    onClick={() => setLightboxSrc(`${img.imageData}`)}
                                                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }} />
                                            ))}
                                            {(propertyImages[prop.id] || []).length > 3 && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                    +{(propertyImages[prop.id] || []).length - 3} more
                                                </span>
                                            )}
                                            {(propertyImages[prop.id] || []).length === 0 && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No photos</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>
                                                {prop.city ? `${prop.city}` : ''}
                                                {prop.locLat && prop.locLon && <MapIcon size={12} style={{ marginLeft: 4, color: 'var(--primary)' }} />}
                                            </span>
                                            <small style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                {prop.address}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{ 
                                            padding: '0.25rem 0.5rem', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600, 
                                            borderRadius: '4px',
                                            background: prop.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                            color: prop.active ? 'var(--success)' : 'var(--text-muted)'
                                        }}>
                                            {prop.active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                        <button className="action-btn" onClick={() => handleEdit(prop)}><Edit2 size={18} /></button>
                                        <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(prop.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProps.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No infrastructures found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                )}

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 'auto', padding: '0.3rem 0.8rem' }}>Prev</button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                        <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 'auto', padding: '0.3rem 0.8rem' }}>Next</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyList;
