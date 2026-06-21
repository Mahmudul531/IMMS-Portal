import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit2, MapIcon, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

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
    division?: string;
    district?: string;
    upazila?: string;
    union?: string;
}

interface PropertyImage {
    id: number;
    imageData: string;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Load BD Geo data from static folder
type GeoUnion = { id: string; name: string };
type GeoUpazila = { id: string; name: string; unions: GeoUnion[] };
type GeoDistrict = { id: string; name: string; upazilas: GeoUpazila[] };
type GeoDivision = { id: string; name: string; districts: GeoDistrict[] };

const PropertyList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [properties, setProperties] = useState<Property[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [propertyImages, setPropertyImages] = useState<Record<number, PropertyImage[]>>({});

    // Geo data
    const [geoData, setGeoData] = useState<GeoDivision[]>([]);
    const [filterDivision, setFilterDivision] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterUpazila, setFilterUpazila] = useState('');

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Lightbox
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    useEffect(() => {
        fetchProperties();
        // Load BD geo data from static endpoint served by Spring Boot
        fetch(`${API}/BD_Geo_Mapping_All.json`)
            .then(r => r.json())
            .then(setGeoData)
            .catch(() => {});
    }, []);

    const fetchProperties = async () => {
        try {
            const { data } = await axios.get(`${API}/api/properties`);
            const propData = Array.isArray(data) ? data : [];
            setProperties([...propData].reverse());
        } catch (error) {
            toast.error('Failed to load infrastructure list');
        } finally {
            setListLoading(false);
        }
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
        if (!window.confirm('Are you sure you want to delete this infrastructure?')) return;
        try {
            await axios.delete(`${API}/api/properties/${id}`);
            toast.success('Infrastructure deleted');
            fetchProperties();
        } catch (error: any) {
            const msg = error.response?.data || error.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to delete infrastructure — it may still have linked assets or work orders.');
        }
    };

    // Derived filter options
    const divisionOptions = geoData;
    const districtOptions = filterDivision
        ? (geoData.find(d => d.name === filterDivision)?.districts || [])
        : [];
    const upazilaOptions = filterDistrict
        ? (districtOptions.find(d => d.name === filterDistrict)?.upazilas || [])
        : [];

    const filteredProps = properties.filter(prop => {
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!prop.name?.toLowerCase().includes(t) && !prop.code?.toLowerCase().includes(t) && !prop.address?.toLowerCase().includes(t)) return false;
        }
        if (filterDivision && prop.division !== filterDivision) return false;
        if (filterDistrict && prop.district !== filterDistrict) return false;
        if (filterUpazila && prop.upazila !== filterUpazila) return false;
        if (filterStatus === 'ACTIVE' && prop.active === false) return false;
        if (filterStatus === 'INACTIVE' && prop.active !== false) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredProps.length / ITEMS_PER_PAGE);
    const paginatedProps = filteredProps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        paginatedProps.forEach(p => { if (!propertyImages[p.id]) fetchImagesForProperty(p.id); });
    }, [paginatedProps.map(p => p.id).join(',')]);

    const canEdit = hasPermission('EDIT_INFRASTRUCTURE');
    const canDelete = hasPermission('DELETE_INFRASTRUCTURE');
    const canCreate = hasPermission('CREATE_INFRASTRUCTURE');

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Registered Infrastructures</h2>
                {canCreate && (
                    <button className="btn btn-primary" onClick={() => navigate('/properties/add')}>Add New Infrastructure</button>
                )}
            </div>

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <Filter size={16} /> Filters:
                    </div>
                    <input
                        className="form-input" type="text" placeholder="Search by name, code or address..."
                        value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '1 1 180px', minWidth: 0 }}
                    />
                    {/* Division */}
                    <select className="form-input" value={filterDivision}
                        onChange={e => { setFilterDivision(e.target.value); setFilterDistrict(''); setFilterUpazila(''); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 150px', minWidth: 120 }}>
                        <option value="">All Divisions</option>
                        {divisionOptions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    {/* District */}
                    <select className="form-input" value={filterDistrict}
                        onChange={e => { setFilterDistrict(e.target.value); setFilterUpazila(''); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 150px', minWidth: 120 }}
                        disabled={!filterDivision}>
                        <option value="">All Districts</option>
                        {districtOptions.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                    </select>
                    {/* Upazila */}
                    <select className="form-input" value={filterUpazila}
                        onChange={e => { setFilterUpazila(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 150px', minWidth: 120 }}
                        disabled={!filterDistrict}>
                        <option value="">All Upazilas</option>
                        {upazilaOptions.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </select>
                    <select className="form-input" value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', flex: '0 1 140px', minWidth: 110 }}>
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                {listLoading ? (
                    <div className="page-loader"><span className="page-spinner" /><span>Loading properties...</span></div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Name & Type</th>
                                    <th>Photos</th>
                                    <th>Location</th>
                                    <th>Division / District</th>
                                    <th>Status</th>
                                    {(canEdit || canDelete) && <th style={{ textAlign: 'center' }}>Actions</th>}
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
                                                    title="View infrastructure detail">
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
                                        <td style={{ fontSize: '0.82rem' }}>
                                            {prop.division && <div style={{ fontWeight: 600 }}>{prop.division}</div>}
                                            {prop.district && <div style={{ color: 'var(--text-muted)' }}>{prop.district}{prop.upazila ? ` / ${prop.upazila}` : ''}</div>}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: '4px',
                                                background: prop.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                                color: prop.active ? 'var(--success)' : 'var(--text-muted)'
                                            }}>
                                                {prop.active ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        {(canEdit || canDelete) && (
                                            <td style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                {canEdit && (
                                                    <button className="action-btn" title="Edit" onClick={() => handleEdit(prop)}><Edit2 size={18} /></button>
                                                )}
                                                {canDelete && (
                                                    <button className="action-btn" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(prop.id)}><Trash2 size={18} /></button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {filteredProps.length === 0 && (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No infrastructures found.</td></tr>
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
