import { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Trash, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PropertyType {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
    active: boolean;
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const PropertySetup = () => {
    const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    
    const [newTypeName, setNewTypeName] = useState('');
    const [newCityName, setNewCityName] = useState('');

    useEffect(() => {
        fetchPropertyTypes();
        fetchCities();
    }, []);

    const fetchPropertyTypes = async () => {
        try {
            const res = await axios.get(`${API}/api/property-types`);
            setPropertyTypes(res.data);
        } catch (error) {
            toast.error('Failed to load property types');
        }
    };

    const fetchCities = async () => {
        try {
            const res = await axios.get(`${API}/api/cities`);
            setCities(res.data);
        } catch (error) {
            toast.error('Failed to load cities');
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeName.trim()) return;
        try {
            await axios.post(`${API}/api/property-types`, { name: newTypeName.trim() });
            toast.success('Property Type added');
            setNewTypeName('');
            fetchPropertyTypes();
        } catch (error) {
            toast.error('Failed to add property type');
        }
    };

    const handleDeleteType = async (id: number) => {
        if (!window.confirm('Delete this property type?')) return;
        try {
            await axios.delete(`${API}/api/property-types/${id}`);
            toast.success('Property Type deleted');
            fetchPropertyTypes();
        } catch (error) {
            toast.error('Failed to delete property type');
        }
    };

    const handleAddCity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCityName.trim()) return;
        try {
            await axios.post(`${API}/api/cities`, { name: newCityName.trim(), active: true });
            toast.success('City added');
            setNewCityName('');
            fetchCities();
        } catch (error) {
            toast.error('Failed to add city');
        }
    };

    const handleToggleCity = async (city: City) => {
        try {
            await axios.put(`${API}/api/cities/${city.id}`, { name: city.name, active: !city.active });
            toast.success(`City ${city.active ? 'deactivated' : 'activated'}`);
            fetchCities();
        } catch (error) {
            toast.error('Failed to toggle city status');
        }
    };

    const handleDeleteCity = async (id: number) => {
        if (!window.confirm('Delete this city?')) return;
        try {
            await axios.delete(`${API}/api/cities/${id}`);
            toast.success('City deleted');
            fetchCities();
        } catch (error) {
            toast.error('Failed to delete city');
        }
    };

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <h2><Settings size={24} style={{ marginRight: '10px' }} /> Property Setup</h2>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Property Types</h3>
                    </div>
                    <form onSubmit={handleAddType} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <input className="form-input" type="text" placeholder="Type (e.g. Office)" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} required style={{ flex: 1 }} />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1rem' }}><Plus size={18} /> Add</button>
                    </form>
                    
                    <div className="table-container" style={{ marginTop: '1.5rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Type Name</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {propertyTypes.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.name}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn" style={{ padding: '0.4rem', background: 'var(--danger)', color: '#fff' }} onClick={() => handleDeleteType(t.id)}>
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card" style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Cities</h3>
                    </div>
                    <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <input className="form-input" type="text" placeholder="City (e.g. Dhaka)" value={newCityName} onChange={e => setNewCityName(e.target.value)} required style={{ flex: 1 }} />
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1rem' }}><Plus size={18} /> Add</button>
                    </form>
                    
                    <div className="table-container" style={{ marginTop: '1.5rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>City Name</th>
                                    <th>Status</th>
                                    <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cities.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.name}</td>
                                        <td>
                                            <button 
                                                onClick={() => handleToggleCity(c)}
                                                style={{ border: 'none', background: c.active ? 'var(--success)' : 'var(--border)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                            >
                                                {c.active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="btn" style={{ padding: '0.4rem', background: 'var(--danger)', color: '#fff' }} onClick={() => handleDeleteCity(c.id)}>
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

export default PropertySetup;
