import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    active?: boolean;
    createdAt?: string;
}

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    
    // Search & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    
    // Form fields
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('VENDOR');

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users`);
            setUsers(data.reverse());
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users/register`, {
                username,
                email,
                password,
                role
            });
            setUsername('');
            setEmail('');
            setPassword('');
            setRole('VENDOR');
            fetchUsers();
            alert('User registered successfully');
        } catch (error) {
            console.error('Registration failed', error);
            alert('Failed to register user. Try a different username/email.');
        }
    };



    const handleToggleStatus = async (id: number, status: boolean) => {
        let note = '';
        if (!status) {
            const result = prompt('Enter a reason for deactivating this user (Required):');
            if (result === null || result.trim() === '') return;
            note = result.trim();
        }

        try {
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/users/${id}/status?active=${status}&note=${encodeURIComponent(note)}`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to toggle active status', error);
        }
    };

    const filteredUsers = users.filter(usr => {
        if (currentUser && usr.id === currentUser.id) return false;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (!usr.username.toLowerCase().includes(term) && !usr.email.toLowerCase().includes(term)) {
                return false;
            }
        }
        if (dateFrom) {
            if (!usr.createdAt || new Date(usr.createdAt) < new Date(dateFrom)) {
                return false;
            }
        }
        return true;
    });

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div>
            <div className="page-header">
                <h2>User Management Hub</h2>
            </div>
            
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    Register New Application Profile
                </h3>
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Username (ID)</label>
                        <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">System Role / Privilege</label>
                        <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
                            <option value="ADMIN">ADMIN</option>
                            <option value="ENGINEER">ENGINEER</option>
                            <option value="VENDOR">VENDOR</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
                            Save Profile Permissions
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Active System Users</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input 
                                className="form-input" 
                                type="text" 
                                placeholder="Search users by name or email..." 
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '0.4rem 0.8rem', minWidth: '250px' }}
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
                            <th>User ID</th>
                            <th>Username</th>
                            <th>Email Address</th>
                            <th>System Role</th>
                            <th>Access Switch</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.id}</td>
                                <td><strong>{u.username}</strong></td>
                                <td>{u.email}</td>
                                <td><span style={{ padding: '0.2rem 0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.85rem' }}>{u.role}</span></td>
                                <td>
                                    <span style={{ padding: '0.2rem 0.5rem', background: u.active === false ? '#ffebee' : '#e8f5e9', color: u.active === false ? '#c62828' : '#2e7d32', borderRadius: '4px', fontSize: '0.85rem', fontWeight:'bold' }}>
                                        {u.active === false ? 'INACTIVE' : 'ACTIVE'}
                                    </span>
                                </td>
                                <td>
                                    {u.active !== false ? (
                                        <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#f57c00', color: 'white', width: 'auto' }} onClick={() => handleToggleStatus(u.id, false)}>Deactivate</button>
                                    ) : (
                                        <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#2e7d32', color: 'white', width: 'auto' }} onClick={() => handleToggleStatus(u.id, true)}>Activate</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={6} style={{textAlign: 'center', color: 'var(--text-muted)'}}>No users match searches.</td></tr>
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

export default Users;
