import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Map as MapIcon, X, Image, Search, Save, ArrowLeft, Link2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Fix leaflet icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const MapSelector = ({ onSelectPosition }: { onSelectPosition: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) { onSelectPosition(e.latlng.lat, e.latlng.lng); },
    });
    return null;
};

const FlyToLocation = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16, { duration: 1.5 });
    }, [position, map]);
    return null;
};

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

type GeoUnion = { id: string; name: string };
type GeoUpazila = { id: string; name: string; unions: GeoUnion[] };
type GeoDistrict = { id: string; name: string; upazilas: GeoUpazila[] };
type GeoDivision = { id: string; name: string; districts: GeoDistrict[] };

const PropertyAdd = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editingId = searchParams.get('id');
    const { hasPermission } = useAuth();

    // DB References for dropdowns
    const [propertyTypes, setPropertyTypes] = useState<{id: number, name: string}[]>([]);
    const [cities, setCities] = useState<{id: number, name: string}[]>([]);
    const [allInfrastructures, setAllInfrastructures] = useState<{id: number, name: string, code: string}[]>([]);

    // BD Geo data
    const [geoData, setGeoData] = useState<GeoDivision[]>([]);
    const [division, setDivision] = useState('');
    const [district, setDistrict] = useState('');
    const [upazila, setUpazila] = useState('');
    const [unionName, setUnionName] = useState('');

    // Form States
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [propertyTypeId, setPropertyTypeId] = useState('');
    const [parentPropertyId, setParentPropertyId] = useState('');
    const [managerName, setManagerName] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [country] = useState('Bangladesh');
    const [active, setActive] = useState(true);
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [existingImages, setExistingImages] = useState<{id: number, imageData: string}[]>([]);

    // Map Modals
    const [showPickerMap, setShowPickerMap] = useState(false);
    const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

    // Map search
    const [mapSearchQuery, setMapSearchQuery] = useState('');
    const [mapSearching, setMapSearching] = useState(false);
    const [mapSearchResults, setMapSearchResults] = useState<{display_name: string; lat: string; lon: string}[]>([]);

    useEffect(() => {
        fetchDropdowns();
        // Load BD geo JSON
        fetch(`${API}/BD_Geo_Mapping_All.json`).then(r => r.json()).then(setGeoData).catch(() => {});
        if (editingId) {
            fetchPropertyData(editingId);
        }
    }, [editingId]);

    const fetchDropdowns = async () => {
        try {
            const [typeRes, cityRes, propRes] = await Promise.all([
                axios.get(`${API}/api/property-types`),
                axios.get(`${API}/api/cities`),
                axios.get(`${API}/api/properties`)
            ]);
            setPropertyTypes(typeRes.data);
            setCities(cityRes.data.filter((c: any) => c.active));
            setAllInfrastructures(Array.isArray(propRes.data) ? propRes.data : []);
        } catch (_) {}
    };

    const fetchPropertyData = async (id: string) => {
        try {
            const { data } = await axios.get(`${API}/api/properties`);
            const prop = (Array.isArray(data) ? data : []).find((p: any) => p.id === parseInt(id));
            if (prop) {
                setName(prop.name || '');
                setCode(prop.code || '');
                setPropertyTypeId(prop.propertyType?.id?.toString() || '');
                setParentPropertyId(prop.parentProperty?.id?.toString() || '');
                setManagerName(prop.managerName || '');
                setContactPhone(prop.contactPhone || '');
                setContactEmail(prop.contactEmail || '');
                setDescription(prop.description || '');
                setAddress(prop.address || '');
                setCity(prop.city || '');
                setActive(prop.active !== false);
                setLatitude(prop.locLat || '');
                setLongitude(prop.locLon || '');
                setDivision(prop.division || '');
                setDistrict(prop.district || '');
                setUpazila(prop.upazila || '');
                setUnionName(prop.unionName || '');
                if (prop.locLat && prop.locLon) setMarkerPos([parseFloat(prop.locLat), parseFloat(prop.locLon)]);
            }

            const imgRes = await axios.get(`${API}/api/properties/${id}/images`);
            setExistingImages(imgRes.data);
        } catch (error) {
            toast.error('Failed to load infrastructure data');
        }
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
        // Validate mandatory geo fields
        if (!division || !district || !upazila) {
            toast.error('Division, District and Upazila are required.');
            return;
        }
        setUploading(true);
        const payload = {
            name, code, propertyTypeId: propertyTypeId ? parseInt(propertyTypeId) : null,
            parentPropertyId: parentPropertyId ? parseInt(parentPropertyId) : null,
            managerName, contactPhone, contactEmail, description,
            address, city, country, active,
            division, district, upazila, unionName,
            locLat: latitude, locLon: longitude
        };
        try {
            let savedId: number;
            if (editingId) {
                await axios.put(`${API}/api/properties/${editingId}`, payload);
                savedId = parseInt(editingId);
                toast.success('Infrastructure updated successfully');
            } else {
                const { data } = await axios.post(`${API}/api/properties`, payload);
                savedId = data.id;
                toast.success('Infrastructure created successfully');
            }
            if (pendingFiles.length > 0) await uploadFiles(savedId);
            
            navigate('/properties/list');
        } catch (error: any) { 
            if (error.response?.data) {
                toast.error(error.response.data);
            } else {
                toast.error('Failed to save infrastructure. Please check required fields including unique code.');
            }
        } finally { 
            setUploading(false); 
        }
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!editingId) return;
        await axios.delete(`${API}/api/properties/${editingId}/images/${imageId}`);
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
    };

    const handleMapClick = (lat: number, lng: number) => {
        setMarkerPos([lat, lng]); setLatitude(lat.toString()); setLongitude(lng.toString());
    };

    const handleMapSearch = async () => {
        if (!mapSearchQuery.trim()) return;
        setMapSearching(true);
        setMapSearchResults([]);
        try {
            const res = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: { q: mapSearchQuery, format: 'json', limit: 5, countrycodes: 'bd' }
            });
            if (res.data.length > 0) {
                setMapSearchResults(res.data);
                const first = res.data[0];
                const lat = parseFloat(first.lat);
                const lon = parseFloat(first.lon);
                setFlyTarget([lat, lon]);
                setMarkerPos([lat, lon]);
                setLatitude(lat.toString());
                setLongitude(lon.toString());
            } else {
                setMapSearchResults([]);
                toast.error('No places found.');
            }
        } catch { toast.error('Search failed.'); }
        finally { setMapSearching(false); }
    };

    // Exclude the current infrastructure from parent dropdown to avoid self-referencing
    const parentOptions = allInfrastructures.filter(p => !editingId || p.id !== parseInt(editingId));

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button className="action-btn" onClick={() => navigate('/properties/list')} title="Back to List">
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ margin: 0 }}>{editingId ? 'Edit Infrastructure' : 'Add Infrastructure'}</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '2rem', alignItems: 'start' }}>
                    {/* Basic Info Section */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Basic Info</h3>
                        
                        <div className="form-group">
                            <label className="form-label">Infrastructure Name <span style={{color: 'red'}}>*</span></label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Code (Unique Identifier) <span style={{color: 'red'}}>*</span></label>
                            <input className="form-input" value={code} onChange={e => setCode(e.target.value)} required placeholder="e.g. WH-001" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Infrastructure Type</label>
                            <select className="form-input" value={propertyTypeId} onChange={e => setPropertyTypeId(e.target.value)}>
                                <option value="">-- Select Type --</option>
                                {propertyTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        {/* Parent Infrastructure */}
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Link2 size={14} /> Parent Infrastructure <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <select className="form-input" value={parentPropertyId} onChange={e => setParentPropertyId(e.target.value)}>
                                <option value="">-- None (Top-level) --</option>
                                {parentOptions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ''}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Manager Name</label>
                            <input className="form-input" value={managerName} onChange={e => setManagerName(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Contact Phone <span style={{color: 'red'}}>*</span></label>
                                <input className="form-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Contact Email</label>
                                <input className="form-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                        </div>
                    </div>

                    {/* Location & Status Section */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>Location Details</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Status:</span>
                                <div 
                                    onClick={() => setActive(!active)}
                                    style={{ 
                                        width: '40px', height: '22px', background: active ? 'var(--success)' : 'var(--border)', 
                                        borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    <div style={{ 
                                        width: '18px', height: '18px', background: 'white', borderRadius: '50%', 
                                        position: 'absolute', top: '2px', left: active ? '20px' : '2px', transition: '0.2s' 
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', color: active ? 'var(--success)' : 'var(--text-muted)' }}>{active ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <textarea className="form-input" value={address} onChange={e => setAddress(e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                        </div>

                        {/* BD Geo — Division / District / Upazila / Union */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Division <span style={{color:'red'}}>*</span></label>
                                <select className="form-input" value={division} required
                                    onChange={e => { setDivision(e.target.value); setDistrict(''); setUpazila(''); setUnionName(''); }}>
                                    <option value="">-- Select Division --</option>
                                    {geoData.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">District / City<span style={{color:'red'}}>*</span></label>
                                <select className="form-input" value={district} required disabled={!division}
                                    onChange={e => { setDistrict(e.target.value); setUpazila(''); setUnionName(''); }}>
                                    <option value="">-- Select District --</option>
                                    {(geoData.find(d => d.name === division)?.districts || []).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Upazila / Thana<span style={{color:'red'}}>*</span></label>
                                <select className="form-input" value={upazila} required disabled={!district}
                                    onChange={e => { setUpazila(e.target.value); setUnionName(''); }}>
                                    <option value="">-- Select Upazila --</option>
                                    {(geoData.find(d => d.name === division)?.districts.find(d => d.name === district)?.upazilas || []).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Union / Ward <span style={{color:'var(--text-muted)', fontWeight:400}}>(optional)</span></label>
                                <select className="form-input" value={unionName} disabled={!upazila}
                                    onChange={e => setUnionName(e.target.value)}>
                                    <option value="">-- Select Union --</option>
                                    {(geoData.find(d => d.name === division)?.districts.find(d => d.name === district)?.upazilas.find(u => u.name === upazila)?.unions || []).map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">City</label>
                                <select className="form-input" value={city} onChange={e => setCity(e.target.value)}>
                                    <option value="">-- Select City --</option>
                                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Country</label>
                                <input className="form-input" value={country} disabled />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Latitude</label>
                                <input className="form-input" type="number" step="any" value={latitude} readOnly style={{ background: '#f8f9fa' }} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Longitude</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input className="form-input" type="number" step="any" value={longitude} readOnly style={{ background: '#f8f9fa' }} />
                                    <button type="button" className="action-btn" title="Pick on Map" onClick={() => setShowPickerMap(true)} style={{ color: 'white', background: 'var(--primary)', padding: '0 0.5rem', borderRadius: '8px' }}>
                                        <MapIcon size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Image size={16} /> Photos (auto-compressed to &lt;1MB)
                            </label>
                            <input className="form-input" type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ padding: '0.4rem' }} />
                            {pendingPreviews.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {pendingPreviews.map((src, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={src} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--primary)' }} />
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
                                                <img src={`${img.imageData}`} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                                                <button type="button" onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn" onClick={() => navigate('/properties/list')} style={{ background: 'var(--border)' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={uploading}>
                        <Save size={18} /> {uploading ? 'Saving...' : (editingId ? 'Update Infrastructure' : 'Save Infrastructure')}
                    </button>
                </div>
            </form>

            {/* Map picker modal */}
            {showPickerMap && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', width: '80%', maxWidth: '800px', height: '650px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0 }}>Click to Select Location</h3>
                            <button onClick={() => { setShowPickerMap(false); setMapSearchQuery(''); setMapSearchResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ position: 'relative', marginBottom: '0.75rem', zIndex: 2000 }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    className="form-input" type="text" placeholder="Search a place (e.g. Dhaka, Gulshan 2)..."
                                    value={mapSearchQuery} onChange={e => setMapSearchQuery(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleMapSearch(); } }}
                                    style={{ flex: 1 }}
                                />
                                <button type="button" className="btn btn-primary" onClick={handleMapSearch} disabled={mapSearching} style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {mapSearching ? <span className="btn-spinner" /> : <Search size={16} />}
                                    {mapSearching ? 'Searching...' : 'Search'}
                                </button>
                            </div>
                            {mapSearchResults.length > 0 && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', zIndex: 10, maxHeight: '180px', overflowY: 'auto', boxShadow: 'var(--shadow)' }}>
                                    {mapSearchResults.map((r, i) => (
                                        <div key={i} onClick={() => {
                                            const pLat = parseFloat(r.lat);
                                            const pLon = parseFloat(r.lon);
                                            setFlyTarget([pLat, pLon]);
                                            setMarkerPos([pLat, pLon]);
                                            setLatitude(pLat.toString());
                                            setLongitude(pLon.toString());
                                            setMapSearchResults([]);
                                        }} style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                                            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                                            📍 {r.display_name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden' }}>
                            <MapContainer center={markerPos || [23.8103, 90.4125]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                                <MapSelector onSelectPosition={handleMapClick} />
                                <FlyToLocation position={flyTarget} />
                                {markerPos && <Marker position={markerPos} />}
                            </MapContainer>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                            <button type="button" className="btn btn-primary" onClick={() => { setShowPickerMap(false); setMapSearchQuery(''); setMapSearchResults([]); }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyAdd;
