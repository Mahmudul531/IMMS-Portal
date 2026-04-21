import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Preference {
    id: number;
    prefType: string;
    prefValue: string;
    parentId?: number;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AssetSetup = () => {
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [newSubCategory, setNewSubCategory] = useState('');
    const [selectedParentId, setSelectedParentId] = useState<number | ''>('');
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await axios.get(`${API}/api/preferences/assets`);
            setPreferences(res.data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            toast.error('Failed to load asset setup data');
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        
        try {
            await axios.post(`${API}/api/preferences/assets`, {
                prefType: 'CATEGORY',
                prefValue: newCategory.trim()
            });
            toast.success('Category added');
            setNewCategory('');
            fetchPreferences();
        } catch (error) {
            toast.error('Failed to add category');
        }
    };

    const handleAddSubCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubCategory.trim() || !selectedParentId) return;
        
        try {
            await axios.post(`${API}/api/preferences/assets`, {
                prefType: 'SUBCATEGORY',
                prefValue: newSubCategory.trim(),
                parentId: selectedParentId
            });
            toast.success('Subcategory added');
            setNewSubCategory('');
            setSelectedParentId('');
            setExpandedCategories(prev => ({ ...prev, [Number(selectedParentId)]: true }));
            fetchPreferences();
        } catch (error) {
            toast.error('Failed to add subcategory');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            await axios.delete(`${API}/api/preferences/assets/${id}`);
            toast.success('Deleted successfully');
            fetchPreferences();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const toggleCategory = (id: number) => {
        setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const categories = preferences.filter(p => p.prefType === 'CATEGORY');
    const subCategories = preferences.filter(p => p.prefType === 'SUBCATEGORY');

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2><Settings size={24} style={{ marginRight: '10px' }} /> Asset Categories Setup</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Add New Category</h3>
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="form-label">Category Name</label>
                            <input 
                                className="form-input" 
                                type="text" 
                                value={newCategory} 
                                onChange={e => setNewCategory(e.target.value)} 
                                placeholder="e.g. IT Equipment, Furniture..."
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '40px', padding: '0 1.5rem' }}>
                            <Plus size={18} /> Add
                        </button>
                    </form>
                </div>

                <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Add New Subcategory</h3>
                    <form onSubmit={handleAddSubCategory} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Parent Category</label>
                            <select className="form-input" value={selectedParentId} onChange={e => setSelectedParentId(Number(e.target.value))} required>
                                <option value="">Select Category...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.prefValue}</option>)}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Subcategory Name</label>
                            <input 
                                className="form-input" 
                                type="text" 
                                value={newSubCategory} 
                                onChange={e => setNewSubCategory(e.target.value)} 
                                placeholder="e.g. Laptops, Chairs..."
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', height: '40px', padding: '0 1.5rem' }}>
                            <Plus size={18} /> Add
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <h3>Asset Category Hierarchy</h3>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categories.map(category => {
                        const subs = subCategories.filter(s => s.parentId === category.id);
                        const isExpanded = expandedCategories[category.id];
                        return (
                            <div key={category.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }} onClick={() => toggleCategory(category.id)}>
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                        {category.prefValue} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'white', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)' }}>{subs.length} subcategories</span>
                                    </div>
                                    <button className="btn" style={{ padding: '0.4rem', background: 'var(--danger)', color: 'white', width: 'auto', height: 'auto', minHeight: '0' }} onClick={() => handleDelete(category.id)} title="Delete Category">
                                        <Trash size={14} />
                                    </button>
                                </div>
                                {isExpanded && (
                                    <div style={{ padding: '0.5rem 1rem 1rem 2.5rem', background: 'white' }}>
                                        {subs.length === 0 ? (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No subcategories found.</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {subs.map(sub => (
                                                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                                        <span style={{ fontSize: '0.95rem' }}>{sub.prefValue}</span>
                                                        <button className="btn" style={{ padding: '0.3rem', background: 'var(--danger)', color: 'white', width: 'auto', height: 'auto', minHeight: '0' }} onClick={() => handleDelete(sub.id)} title="Delete Subcategory">
                                                            <Trash size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {categories.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                            No categories set up yet. Add a category above to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetSetup;
