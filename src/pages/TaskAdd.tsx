import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Briefcase, Plus, ArrowLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const TaskAdd = () => {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [existingTasks, setExistingTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    const [selectedProject, setSelectedProject] = useState(params.get('projectId') || '');
    const [parentTaskId, setParentTaskId] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSubtask, setIsSubtask] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [woRes, usersRes] = await Promise.all([
                    axios.get(`${API}/api/work-orders`),
                    axios.get(`${API}/api/users`),
                ]);
                const wos = Array.isArray(woRes.data) ? woRes.data : [];
                setWorkOrders(isAdmin ? wos : wos.filter((w: any) => w.fieldEngineer?.id === user?.id));
                const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
                setUsers(allUsers.filter((u: any) => ['ADMIN', 'ENGINEER', 'TECHNICIAN'].includes(u.role)));
            } catch { toast.error('Failed to load form data'); }
        };
        load();
    }, [isAdmin, user?.id]);

    useEffect(() => {
        if (!selectedProject) { setExistingTasks([]); return; }
        axios.get(`${API}/api/tasks?workOrderId=${selectedProject}`)
            .then(r => setExistingTasks((Array.isArray(r.data) ? r.data : []).filter((t: any) => !t.parentTaskId)))
            .catch(() => setExistingTasks([]));
    }, [selectedProject]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) { toast.error('Please select a project'); return; }
        if (!title.trim()) { toast.error('Task title is required'); return; }
        if (!startDate || !endDate) { toast.error('Start and end dates are required'); return; }
        if (endDate < startDate) { toast.error('End date must be after start date'); return; }
        if (isSubtask && !parentTaskId) { toast.error('Please select a parent task'); return; }

        const assignee = users.find(u => u.id === parseInt(assigneeId));
        setSaving(true);
        try {
            await axios.post(`${API}/api/tasks`, {
                workOrderId: parseInt(selectedProject),
                parentTaskId: isSubtask && parentTaskId ? parseInt(parentTaskId) : null,
                title: title.trim(),
                description: description.trim() || null,
                assigneeId: assigneeId ? parseInt(assigneeId) : null,
                assigneeName: assignee ? (assignee.fullName || assignee.username) : null,
                startDate,
                endDate,
                completionPct: 0,
            });
            toast.success('Task created successfully!');
            setTitle(''); setDescription(''); setAssigneeId('');
            setStartDate(''); setEndDate(''); setIsSubtask(false); setParentTaskId('');
            // Re-fetch parent tasks for this project
            const r = await axios.get(`${API}/api/tasks?workOrderId=${selectedProject}`);
            setExistingTasks((Array.isArray(r.data) ? r.data : []).filter((t: any) => !t.parentTaskId));
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to create task');
        } finally {
            setSaving(false);
        }
    };

    const selectedWo = workOrders.find(w => w.id === parseInt(selectedProject));

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn" onClick={() => navigate('/tasks/list')} style={{ width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={22} color="var(--primary)" /> Add Task
                    </h2>
                </div>
                {selectedProject && (
                    <button className="btn btn-primary" onClick={() => navigate(`/tasks/gantt?projectId=${selectedProject}`)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        View Gantt Chart →
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Step 1: Select Project */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Briefcase size={18} /> Step 1: Select Project
                    </h3>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Project / Work Order <span style={{ color: 'red' }}>*</span></label>
                        <select className="form-input" value={selectedProject} onChange={e => { setSelectedProject(e.target.value); setParentTaskId(''); setIsSubtask(false); }} required>
                            <option value="">-- Select a project --</option>
                            {workOrders.map(w => (
                                <option key={w.id} value={w.id}>{w.jobTitle || w.description || `WO #${w.id}`} {w.jobCode ? `(${w.jobCode})` : ''}</option>
                            ))}
                        </select>
                        {selectedWo && (
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16,185,129,0.05)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                {selectedWo.property && <span><strong>Property:</strong> {selectedWo.property.name}</span>}
                                {selectedWo.method && <span><strong>Method:</strong> {selectedWo.method}</span>}
                                {selectedWo.fieldEngineer && <span><strong>Engineer:</strong> {selectedWo.fieldEngineer.fullName || selectedWo.fieldEngineer.username}</span>}
                                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700, background: '#f5f5f5', color: '#666' }}>{selectedWo.status}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Task Details */}
                {selectedProject && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ChevronDown size={18} /> Step 2: Task Details
                        </h3>

                        {/* Subtask toggle */}
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                                <input type="checkbox" checked={isSubtask} onChange={e => { setIsSubtask(e.target.checked); setParentTaskId(''); }} style={{ width: 16, height: 16 }} />
                                This is a sub-task
                            </label>
                        </div>

                        {isSubtask && existingTasks.length > 0 && (
                            <div className="form-group">
                                <label className="form-label">Parent Task <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-input" value={parentTaskId} onChange={e => setParentTaskId(e.target.value)} required>
                                    <option value="">-- Select parent task --</option>
                                    {existingTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                            </div>
                        )}
                        {isSubtask && existingTasks.length === 0 && (
                            <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                ⚠️ No parent tasks exist yet for this project. Create a top-level task first.
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Task Title <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Site inspection, Foundation work..." required />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label className="form-label">Description</label>
                                <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Optional details..." style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Assignee</label>
                                <select className="form-input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.role})</option>)}
                                </select>
                            </div>
                            <div className="form-group" />
                            <div className="form-group">
                                <label className="form-label">Start Date <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date <span style={{ color: 'red' }}>*</span></label>
                                <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required min={startDate} />
                            </div>
                        </div>
                    </div>
                )}

                {selectedProject && (
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto', minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, padding: '0.75rem 2rem', fontSize: '1rem' }}>
                        <Plus size={18} /> {saving ? 'Saving...' : 'Add Task'}
                    </button>
                )}
            </form>
        </div>
    );
};

export default TaskAdd;
