import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit2, Plus, History, ExternalLink, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property { id: number; name: string; }
interface Asset { 
    id: number; 
    name: string; 
    type: string; 
    category: string;
    property: Property; 
    createdAt?: string; 
    active?: boolean;
}
interface AssetImage { id: number; imageData: string; }

const AssetList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    
    const [assets, setAssets] = useState<Asset[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [assetImages, setAssetImages] = useState<Record<number, AssetImage[]>>({});

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [typeFilter, setTypeFilter] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const fetchData = async () => {
        setListLoading(true);
        try {
            const assetsRes = await axios.get(`${API}/api/assets`);
            setAssets([...((Array.isArray(assetsRes.data) ? assetsRes.data : []))].reverse());
        } catch (err) { 
            console.error(err); 
            toast.error("Failed to load assets");
        } finally { 
            setListLoading(false); 
        }
    };

    useEffect(() => { fetchData(); }, []);

    const fetchImagesForAsset = async (assetId: number) => {
        try {
            const { data } = await axios.get(`${API}/api/assets/${assetId}/images`);
            setAssetImages(prev => ({ ...prev, [assetId]: data }));
        } catch (_) { /* ignore */ }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try {
            await axios.delete(`${API}/api/assets/${id}`);
            toast.success('Deleted successfully');
            fetchData();
        } catch (err: any) {
            const msg = err.response?.data || err.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to delete asset — it may be linked to work orders.');
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (statusFilter === 'ACTIVE' && asset.active === false) return false;
        if (statusFilter === 'INACTIVE' && asset.active !== false) return false;
        
        if (typeFilter && asset.type !== typeFilter) return false;
        
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            if (!asset.name?.toLowerCase().includes(t) && 
                !asset.type?.toLowerCase().includes(t) && 
                !asset.category?.toLowerCase().includes(t) &&
                !asset.property?.name?.toLowerCase().includes(t)) {
                return false;
            }
        }
        return true;
    });

    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => {
        paginatedAssets.forEach(a => { if (!assetImages[a.id]) fetchImagesForAsset(a.id); });
    }, [paginatedAssets.map(a => a.id).join(',')]);

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Registered Assets</h2>
                {hasPermission('CREATE_ASSET') && (
                    <button className="btn btn-primary" onClick={() => navigate('/assets/add')} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Add New Asset
                    </button>
                )}
            </div>
            
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        <Filter size={18} /> Filters:
                    </div>
                    
                    <input 
                        className="form-input" 
                        type="text" 
                        placeholder="Search name, category, property..." 
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        style={{ padding: '0.4rem 0.8rem', minWidth: '250px', background: 'white' }} 
                    />
                    
                    <select 
                        className="form-input" 
                        value={typeFilter} 
                        onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', width: 'auto', background: 'white' }}
                    >
                        <option value="">All Types</option>
                        <option value="Physical">Physical</option>
                        <option value="Digital">Digital</option>
                        <option value="Rental">Rental</option>
                    </select>

                    <select 
                        className="form-input" 
                        value={statusFilter} 
                        onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
                        style={{ padding: '0.4rem 0.8rem', width: 'auto', background: 'white' }}
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                </div>

                {listLoading ? (
                    <div className="page-loader">
                        <span className="page-spinner" />
                        <span>Loading assets...</span>
                    </div>
                ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Property</th>
                                <th>Type / Category</th>
                                <th>Status</th>
                                <th>Photos</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedAssets.map(asset => (
                                <tr key={asset.id} style={{ opacity: asset.active === false ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                                    <td>
                                        <span
                                            onClick={() => navigate(`/assets/${asset.id}`)}
                                            style={{ color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                                            title="View asset details">
                                            {asset.name} <ExternalLink size={14} style={{ opacity: 0.5 }} />
                                        </span>
                                    </td>
                                    <td>{asset.property?.name || 'N/A'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{asset.type}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{asset.category || '-'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            backgroundColor: asset.active !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: asset.active !== false ? '#10b981' : '#ef4444'
                                        }}>
                                            {asset.active !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {(assetImages[asset.id] || []).slice(0, 3).map(img => (
                                                <img key={img.id} src={`${img.imageData}`} alt="" onClick={() => setLightboxSrc(`${img.imageData}`)}
                                                    style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }} />
                                            ))}
                                            {(assetImages[asset.id] || []).length > 3 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>+{(assetImages[asset.id] || []).length - 3}</span>}
                                            {(assetImages[asset.id] || []).length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No images</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-start' }}>
                                            {hasPermission('EDIT_ASSET') && (
                                                <button className="action-btn" title="Edit" onClick={() => navigate(`/assets/add?id=${asset.id}`)}><Edit2 size={18} /></button>
                                            )}
                                            <button className="action-btn" title="View History" onClick={() => navigate(`/assets/${asset.id}`)} style={{ color: 'var(--warning)' }}><History size={18} /></button>
                                            {hasPermission('DELETE_ASSET') && (
                                                <button className="action-btn" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(asset.id)}><Trash2 size={18} /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssets.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No assets found matching your criteria.</td></tr>}
                        </tbody>
                    </table>
                </div>
                )}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Previous</button>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
                        <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ width: 'auto', padding: '0.4rem 1rem' }}>Next</button>
                    </div>
                )}
            </div>

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}
        </div>
    );
};

export default AssetList;
