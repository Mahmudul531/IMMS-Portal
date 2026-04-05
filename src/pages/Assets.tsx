import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus, X, Image } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property { id: number; name: string; }
interface Asset { id: number; name: string; type: string; property: Property; createdAt?: string; }
interface AssetImage { id: number; imageData: string; }

// Compress image file using Canvas
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
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                const tryBlob = (q: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return; }
                        if (blob.size > 900_000 && q > 0.2) tryBlob(q - 0.1);
                        else resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    }, 'image/jpeg', q);
                };
                tryBlob(0.85);
            };
            img.src = e.target!.result as string;
        };
        reader.readAsDataURL(file);
    });
};

const Assets = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [assetImages, setAssetImages] = useState<Record<number, AssetImage[]>>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [assetsRes, propsRes] = await Promise.all([
                axios.get(`${API}/api/assets`),
                axios.get(`${API}/api/properties`)
            ]);
            setAssets([...((Array.isArray(assetsRes.data) ? assetsRes.data : []))].reverse());
            setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, []);

    const fetchImagesForAsset = async (assetId: number) => {
        try {
            const { data } = await axios.get(`${API}/api/assets/${assetId}/images`);
            setAssetImages(prev => ({ ...prev, [assetId]: data }));
        } catch (_) { /* ignore */ }
    };

    const resetForm = () => {
        setName(''); setType(''); setPropertyId(''); setEditingId(null);
        setPendingFiles([]); setPendingPreviews([]);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const compressed = await Promise.all(files.map(compressFile));
        setPendingFiles(prev => [...prev, ...compressed]);
        setPendingPreviews(prev => [...prev, ...compressed.map(f => URL.createObjectURL(f))]);
        e.target.value = '';
    };

    const removePending = (idx: number) => {
        URL.revokeObjectURL(pendingPreviews[idx]);
        setPendingFiles(prev => prev.filter((_, i) => i !== idx));
        setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let savedId: number;
            const payload = { name, type, propertyId: parseInt(propertyId) };
            if (editingId) {
                await axios.put(`${API}/api/assets/${editingId}`, payload);
                savedId = editingId;
            } else {
                const { data } = await axios.post(`${API}/api/assets`, payload);
                savedId = data.id;
            }
            for (const file of pendingFiles) {
                const form = new FormData();
                form.append('file', file);
                await axios.post(`${API}/api/assets/${savedId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            await fetchData();
            await fetchImagesForAsset(savedId);
            resetForm();
        } catch (err) { console.error(err); }
        finally { setUploading(false); }
    };

    const handleEdit = (asset: Asset) => {
        setEditingId(asset.id);
        setName(asset.name); setType(asset.type || '');
        setPropertyId(asset.property?.id?.toString() || '');
        fetchImagesForAsset(asset.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try { await axios.delete(`${API}/api/assets/${id}`); fetchData(); }
        catch (err) { console.error(err); }
    };

    const handleDeleteImage = async (assetId: number, imageId: number) => {
        await axios.delete(`${API}/api/assets/${assetId}/images/${imageId}`);
        fetchImagesForAsset(assetId);
    };

    const filteredAssets = assets.filter(asset => {
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!asset.name?.toLowerCase().includes(t) && !asset.type?.toLowerCase().includes(t) && !asset.property?.name?.toLowerCase().includes(t)) return false;
        }
        if (dateFrom && (!asset.createdAt || new Date(asset.createdAt) < new Date(dateFrom))) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        paginatedAssets.forEach(a => { if (!assetImages[a.id]) fetchImagesForAsset(a.id); });
    }, [paginatedAssets.map(a => a.id).join(',')]);

    const existingImages = editingId ? (assetImages[editingId] || []) : [];

    return (
        <div>
            <div className="page-header"><h2>Manage Assets</h2></div>
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />{editingId ? 'Edit Asset' : 'Add Asset'}
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Asset Name</label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <input className="form-input" value={type} onChange={e => setType(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Assign to Property</label>
                        <select className="form-input" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
                            <option value="">Select a property...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Image Upload */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Image size={16} /> Asset Photos (auto-compressed to &lt;1MB)
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
                                            <img src={`${API}${img.imageData}`} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => setLightboxSrc(`${API}${img.imageData}`)} />
                                            <button type="button" onClick={() => handleDeleteImage(editingId, img.id)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={uploading}>
                            {uploading ? 'Saving...' : (editingId ? 'Update Asset' : 'Save Asset')}
                        </button>
                        {editingId && <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--border)' }}>Cancel</button>}
                    </div>
                </form>
            </div>

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Registered Assets</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input className="form-input" type="text" placeholder="Search assets..." value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ padding: '0.4rem 0.8rem', minWidth: '220px' }} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date From:</span>
                            <input className="form-input" type="date" value={dateFrom}
                                onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }} style={{ padding: '0.4rem 0.8rem' }} />
                        </div>
                    </div>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th><th>Name</th><th>Type</th><th>Property</th><th>Photos</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAssets.map(asset => (
                                <tr key={asset.id}>
                                    <td>{asset.id}</td>
                                    <td>{asset.name}</td>
                                    <td>{asset.type}</td>
                                    <td>{asset.property?.name || 'N/A'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {(assetImages[asset.id] || []).slice(0, 3).map(img => (
                                                <img key={img.id} src={`${API}${img.imageData}`} alt="" onClick={() => setLightboxSrc(`${API}${img.imageData}`)}
                                                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }} />
                                            ))}
                                            {(assetImages[asset.id] || []).length > 3 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>+{(assetImages[asset.id] || []).length - 3}</span>}
                                            {(assetImages[asset.id] || []).length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>}
                                        </div>
                                    </td>
                                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="action-btn" onClick={() => handleEdit(asset)}><Edit2 size={18} /></button>
                                        <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(asset.id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssets.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No assets match searches.</td></tr>}
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

export default Assets;
