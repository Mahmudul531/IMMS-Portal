import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, Map as MapIcon, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
    createdAt?: string;
}

// Click listener component for picking map
const MapSelector = ({ onSelectPosition }: { onSelectPosition: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onSelectPosition(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const Properties = () => {
    const [properties, setProperties] = useState<Property[]>([]);

    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Form States
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    // Map Modals
    const [showPickerMap, setShowPickerMap] = useState(false);
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

    const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

    const fetchProperties = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties`);
            const propData = Array.isArray(data) ? data : [];
            setProperties([...propData].reverse());
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const resetForm = () => {
        setName('');
        setAddress('');
        setLatitude('');
        setLongitude('');
        setEditingId(null);
        setMarkerPos(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            address,
            locLat: latitude,
            locLon: longitude
        };

        try {
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties/${editingId}`, payload);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties`, payload);
            }
            fetchProperties();
            resetForm();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (prop: Property) => {
        setEditingId(prop.id);
        setName(prop.name);
        setAddress(prop.address || '');
        setLatitude(prop.locLat || '');
        setLongitude(prop.locLon || '');
        if (prop.locLat && prop.locLon) {
            setMarkerPos([parseFloat(prop.locLat), parseFloat(prop.locLon)]);
        } else {
            setMarkerPos(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this property?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties/${id}`);
            fetchProperties();
        } catch (error) {
            console.error(error);
        }
    };

    const handleMapClick = (lat: number, lng: number) => {
        setMarkerPos([lat, lng]);
        setLatitude(lat.toString());
        setLongitude(lng.toString());
    };

    const viewAddressMap = (prop: Property) => {
        if (!prop.locLat || !prop.locLon) {
            alert('This property does not have GPS coordinates mapped!');
            return;
        }
        setViewingProperty(prop);
    };

    const filteredProps = properties.filter(prop => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const nameMatch = prop.name?.toLowerCase().includes(term);
            const addressMatch = prop.address?.toLowerCase().includes(term);
            if (!nameMatch && !addressMatch) {
                return false;
            }
        }
        if (dateFrom) {
            if (!prop.createdAt || new Date(prop.createdAt) < new Date(dateFrom)) {
                return false;
            }
        }
        return true;
    });

    const totalPages = Math.ceil(filteredProps.length / ITEMS_PER_PAGE);
    const paginatedProps = filteredProps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            <div className="page-header">
                <h2>Manage Properties</h2>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    {editingId ? 'Edit Property' : 'Add Property'}
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Property Name</label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Latitude</label>
                        <input className="form-input" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Longitude</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input className="form-input" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
                            <button type="button" className="action-btn" title="Pick on Map" onClick={() => setShowPickerMap(true)} style={{ color: 'var(--primary)', padding: '0 0.5rem' }}>
                                <MapIcon size={24} />
                            </button>
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                            {editingId ? 'Update Property' : 'Save Property'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--border)' }}>
                                Cancel
                            </button>
                        )}
                        <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--danger)', color: 'white', marginLeft: 'auto' }}>
                            Clear Form
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal for Picking location */}
            {showPickerMap && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Click to Select Location</h3>
                            <button onClick={() => setShowPickerMap(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
                            <MapContainer center={markerPos || [23.8103, 90.4125]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <MapSelector onSelectPosition={handleMapClick} />
                                {markerPos && <Marker position={markerPos} />}
                            </MapContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="btn btn-primary" onClick={() => setShowPickerMap(false)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Viewing existing property Address logic */}
            {viewingProperty && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', height: '600px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Viewing: {viewingProperty.name}</h3>
                            <button onClick={() => setViewingProperty(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
                            {(() => {
                                const lat = parseFloat(viewingProperty.locLat || 'NaN');
                                const lon = parseFloat(viewingProperty.locLon || 'NaN');
                                if (isNaN(lat) || isNaN(lon)) return <div style={{ padding: '2rem', textAlign: 'center' }}>Invalid Coordinates</div>;
                                return (
                                    <MapContainer
                                        center={[lat, lon]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                        <Marker position={[lat, lon]} />
                                    </MapContainer>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Registered Properties</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Search properties..."
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
                                <th>ID</th>
                                <th>Name</th>
                                <th>Address & Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProps.map(prop => (
                                <tr key={prop.id}>
                                    <td>{prop.id}</td>
                                    <td><strong>{prop.name}</strong></td>
                                    <td>
                                        {prop.locLat && prop.locLon ? (
                                            <span
                                                onClick={() => viewAddressMap(prop)}
                                                style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <MapIcon size={14} />
                                                {prop.address || 'View on Map'}
                                            </span>
                                        ) : (
                                            <span>{prop.address} <small style={{ color: 'var(--danger)' }}>(No GPS Map)</small></span>
                                        )}
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="action-btn" onClick={() => handleEdit(prop)}><Edit2 size={18} /></button>
                                        <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(prop.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProps.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No properties match searches.</td></tr>
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
        </div>
    );
};

export default Properties;
