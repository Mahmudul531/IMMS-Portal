import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, Map as MapIcon, X, Image, ExternalLink } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Fix leaflet icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property {
    id: number;
    name: string;
    address: string;
    locLat?: string;
    locLon?: string;
    createdAt?: string;
}

interface PropertyImage {
    id: number;
    imageData: string; // URL like /uploads/properties/prop_1_xxx.jpg
}

const MapSelector = ({ onSelectPosition }: { onSelectPosition: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) { onSelectPosition(e.latlng.lat, e.latlng.lng); },
    });
    return null;
};

// Compress image file using Canvas and return a Blob < 1MB
const compressFile = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX_DIM = 1400;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                    else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                let quality = 0.85;
                const tryBlob = (q: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return; }
                        if (blob.size > 900_000 && q > 0.2) {
                            tryBlob(q - 0.1);
                        } else {
                            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                        }
                    }, 'image/jpeg', q);
                };
                tryBlob(quality);
            };
            img.src = e.target!.result as string;
        };
        reader.readAsDataURL(file);
    });
};

const Properties = () => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [propertyImages, setPropertyImages] = useState<Record<number, PropertyImage[]>>({});

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
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    // Map Modals
    const [showPickerMap, setShowPickerMap] = useState(false);
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
    const [viewingProperty, setViewingProperty] = useState<Property | null>(null);

    // Lightbox
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const fetchProperties = async () => {
        try {
            const { data } = await axios.get(`${API}/api/properties`);
            const propData = Array.isArray(data) ? data : [];
            setProperties([...propData].reverse());
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchProperties(); }, []);

    const fetchImagesForProperty = async (propId: number) => {
        try {
            const { data } = await axios.get(`${API}/api/properties/${propId}/images`);
            setPropertyImages(prev => ({ ...prev, [propId]: data }));
        } catch (_) { /* ignore */ }
    };

    const resetForm = () => {
        setName(''); setAddress(''); setLatitude(''); setLongitude('');
        setEditingId(null); setMarkerPos(null);
        setPendingFiles([]); setPendingPreviews([]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const compressed = await Promise.all(files.map(compressFile));
        const previews = compressed.map(f => URL.createObjectURL(f));
        setPendingFiles(prev => [...prev, ...compressed]);
        setPendingPreviews(prev => [...prev, ...previews]);
        e.target.value = '';
    };

    const removePending = (idx: number) => {
        URL.revokeObjectURL(pendingPreviews[idx]);
        setPendingFiles(prev => prev.filter((_, i) => i !== idx));
        setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const uploadFiles = async (propId: number) => {
        for (const file of pendingFiles) {
            const form = new FormData();
            form.append('file', file);
            await axios.post(`${API}/api/properties/${propId}/images`, form, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        setPendingFiles([]); setPendingPreviews([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        const payload = { name, address, locLat: latitude, locLon: longitude };
        try {
            let savedId: number;
            if (editingId) {
                await axios.put(`${API}/api/properties/${editingId}`, payload);
                savedId = editingId;
            } else {
                const { data } = await axios.post(`${API}/api/properties`, payload);
                savedId = data.id;
            }
            if (pendingFiles.length > 0) await uploadFiles(savedId);
            await fetchProperties();
            await fetchImagesForProperty(savedId);
            resetForm();
        } catch (error) { console.error(error); }
        finally { setUploading(false); }
    };

    const handleEdit = (prop: Property) => {
        setEditingId(prop.id);
        setName(prop.name);
        setAddress(prop.address || '');
        setLatitude(prop.locLat || '');
        setLongitude(prop.locLon || '');
        if (prop.locLat && prop.locLon) setMarkerPos([parseFloat(prop.locLat), parseFloat(prop.locLon)]);
        else setMarkerPos(null);
        fetchImagesForProperty(prop.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this property?')) return;
        try {
            await axios.delete(`${API}/api/properties/${id}`);
            fetchProperties();
        } catch (error) { console.error(error); }
    };

    const handleDeleteImage = async (propId: number, imageId: number) => {
        await axios.delete(`${API}/api/properties/${propId}/images/${imageId}`);
        fetchImagesForProperty(propId);
    };

    const handleMapClick = (lat: number, lng: number) => {
        setMarkerPos([lat, lng]); setLatitude(lat.toString()); setLongitude(lng.toString());
    };

    const viewAddressMap = (prop: Property) => {
        if (!prop.locLat || !prop.locLon) { alert('This property does not have GPS coordinates!'); return; }
        setViewingProperty(prop);
    };

    const filteredProps = properties.filter(prop => {
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!prop.name?.toLowerCase().includes(t) && !prop.address?.toLowerCase().includes(t)) return false;
        }
        if (dateFrom && (!prop.createdAt || new Date(prop.createdAt) < new Date(dateFrom))) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredProps.length / ITEMS_PER_PAGE);
    const paginatedProps = filteredProps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        paginatedProps.forEach(p => { if (!propertyImages[p.id]) fetchImagesForProperty(p.id); });
    }, [paginatedProps.map(p => p.id).join(',')]);

    const existingImages = editingId ? (propertyImages[editingId] || []) : [];

    return (
        <div>
            <div className="page-header"><h2>Manage Properties</h2></div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />{editingId ? 'Edit Property' : 'Add Property'}
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
                    <div className="form-group">
                        <label className="form-label">Latitude</label>
                        <input className="form-input" type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Longitude</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input className="form-input" type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} />
                            <button type="button" className="action-btn" title="Pick on Map" onClick={() => setShowPickerMap(true)} style={{ color: 'var(--primary)', padding: '0 0.5rem' }}>
                                <MapIcon size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Image size={16} /> Photos (auto-compressed to &lt;1MB)
                        </label>
                        <input className="form-input" type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ padding: '0.4rem' }} />
                        {pendingPreviews.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                {pendingPreviews.map((src, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <img src={src} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--primary)' }} />
                                        <button type="button" onClick={() => removePending(idx)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {editingId && existingImages.length > 0 && (
                            <div style={{ marginTop: '10px' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Already uploaded:</small>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                                    {existingImages.map(img => (
                                        <div key={img.id} style={{ position: 'relative' }}>
                                            <img src={`${img.imageData}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => setLightboxSrc(`${img.imageData}`)} />
                                            <button type="button" onClick={() => handleDeleteImage(editingId, img.id)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={uploading}>
                            {uploading ? 'Saving...' : (editingId ? 'Update Property' : 'Save Property')}
                        </button>
                        {editingId && <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--border)' }}>Cancel</button>}
                        <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--danger)', color: 'white', marginLeft: 'auto' }}>Clear Form</button>
                    </div>
                </form>
            </div>

            {/* Map picker modal */}
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

            {/* View address map modal */}
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
                                    <MapContainer center={[lat, lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                        <Marker position={[lat, lon]} />
                                    </MapContainer>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Registered Properties</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input className="form-input" type="text" placeholder="Search properties..." value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '0.4rem 0.8rem', minWidth: '220px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date From:</span>
                            <input className="form-input" type="date" value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '0.4rem 0.8rem' }} />
                        </div>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Photos</th>
                                <th>Address & Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProps.map(prop => (
                                <tr key={prop.id}>
                                    <td>{prop.id}</td>
                                    <td>
                                        <span onClick={() => navigate(`/properties/${prop.id}`)}
                                            style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            title="View property detail">
                                            <ExternalLink size={14} />{prop.name}
                                        </span>
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
                                        {prop.locLat && prop.locLon ? (
                                            <span onClick={() => viewAddressMap(prop)} style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <MapIcon size={14} />{prop.address || 'View on Map'}
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
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No properties match searches.</td></tr>
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
