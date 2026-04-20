import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Preference {
    id: number;
    prefType: string;
    prefValue: string;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AssetPreferences = () => {
    const [preferences, setPreferences] = useState<Preference[]>([]);
    const [newType, setNewType] = useState('TYPE');
    const [newValue, setNewValue] = useState('');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await axios.get(`${API}/api/preferences/assets`);
            setPreferences(res.data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
            toast.error('Failed to load preferences');
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newValue.trim()) return;
        
        try {
            await axios.post(`${API}/api/preferences/assets`, {
                prefType: newType,
                prefValue: newValue.trim()
            });
            toast.success('Preference added');
            setNewValue('');
            fetchPreferences();
        } catch (error) {
            toast.error('Failed to add preference');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this preference?')) return;
        try {
            await axios.delete(`${API}/api/preferences/assets/${id}`);
            toast.success('Preference deleted');
            fetchPreferences();
        } catch (error) {
            toast.error('Failed to delete preference');
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2><Settings size={24} style={{ marginRight: '10px' }} /> Asset Preferences</h2>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Add New Preference</h3>
                <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(200px, 2fr) auto', gap: '1.5rem', alignItems: 'flex-end', marginTop: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Preference Type</label>
                        <select className="form-input" value={newType} onChange={e => setNewType(e.target.value)}>
                            <option value="TYPE">Asset Type</option>
                            <option value="CATEGORY">Asset Category</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Value (e.g. "AC", "Fixed")</label>
                        <input 
                            className="form-input" 
                            type="text" 
                            value={newValue} 
                            onChange={e => setNewValue(e.target.value)} 
                            placeholder="Enter value..."
                            required 
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '40px', padding: '0 1.5rem' }}>
                        <Plus size={18} /> Add
                    </button>
                </form>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
                <div className="card" style={{ flex: 1 }}>
                    <h3>Asset Types</h3>
                    <div className="table-container" style={{ marginTop: '1rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Value</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preferences.filter(p => p.prefType === 'TYPE').map(p => (
                                    <tr key={p.id}>
                                        <td>{p.prefValue}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn" style={{ padding: '0.4rem', background: '#e53935', color: '#fff' }} onClick={() => handleDelete(p.id)}>
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ flex: 1 }}>
                    <h3>Asset Categories</h3>
                    <div className="table-container" style={{ marginTop: '1rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Value</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preferences.filter(p => p.prefType === 'CATEGORY').map(p => (
                                    <tr key={p.id}>
                                        <td>{p.prefValue}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn" style={{ padding: '0.4rem', background: '#e53935', color: '#fff' }} onClick={() => handleDelete(p.id)}>
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetPreferences;
