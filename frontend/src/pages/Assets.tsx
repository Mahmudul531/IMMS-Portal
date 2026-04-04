import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Property {
    id: number;
    name: string;
}

interface Asset {
    id: number;
    name: string;
    type: string;
    property: Property;
    createdAt?: string;
}

const Assets = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [assetsRes, propsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets`),
                axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/properties`)
            ]);
            setAssets(assetsRes.data.reverse());
            setProperties(propsRes.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setName('');
        setType('');
        setPropertyId('');
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name,
            type,
            propertyId: parseInt(propertyId)
        };

        try {
            if (editingId) {
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets/${editingId}`, payload);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets`, payload);
            }
            fetchData();
            resetForm();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (asset: Asset) => {
        setEditingId(asset.id);
        setName(asset.name);
        setType(asset.type || '');
        setPropertyId(asset.property?.id?.toString() || '');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/assets/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const filteredAssets = assets.filter(asset => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (!asset.name.toLowerCase().includes(term) && 
                (!asset.type || !asset.type.toLowerCase().includes(term)) &&
                (!asset.property?.name || !asset.property.name.toLowerCase().includes(term))) {
                return false;
            }
        }
        if (dateFrom) {
            if (!asset.createdAt || new Date(asset.createdAt) < new Date(dateFrom)) {
                return false;
            }
        }
        return true;
    });

    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            <div className="page-header">
                <h2>Manage Assets</h2>
            </div>
            
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    {editingId ? 'Edit Asset' : 'Add Asset'}
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
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                            {editingId ? 'Update Asset' : 'Save Asset'}
                        </button>
                        {editingId && (
                            <button type="button" className="btn" onClick={resetForm} style={{ width: 'auto', background: 'var(--border)' }}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Registered Assets</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input 
                                className="form-input" 
                                type="text" 
                                placeholder="Search assets..." 
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
                            <th>Type</th>
                            <th>Property</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedAssets.map(asset => (
                            <tr key={asset.id}>
                                <td>{asset.id}</td>
                                <td>{asset.name}</td>
                                <td>{asset.type}</td>
                                <td>{asset.property?.name || 'N/A'}</td>
                                <td style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="action-btn" onClick={() => handleEdit(asset)}><Edit2 size={18}/></button>
                                    <button className="action-btn" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(asset.id)}><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                        {filteredAssets.length === 0 && (
                            <tr><td colSpan={5} style={{textAlign: 'center', color: 'var(--text-muted)'}}>No assets match searches.</td></tr>
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

export default Assets;
