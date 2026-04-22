import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Briefcase, ChevronDown, ChevronRight, Plus, BarChart2, Trash2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const today = new Date().toISOString().split('T')[0];

const TaskList = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});
    const [tasksByProject, setTasksByProject] = useState<Record<number, any[]>>({});
    const [loadingTasks, setLoadingTasks] = useState<Record<number, boolean>>({});
    const [completions, setCompletions] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API}/api/work-orders`);
                const wos = Array.isArray(data) ? data : [];
                const filtered = isAdmin ? wos : wos.filter((w: any) => w.fieldEngineer?.id === user?.id);
                setWorkOrders([...filtered].reverse());

                // fetch completion summaries for all projects
                const compMap: Record<number, any> = {};
                await Promise.all(filtered.map(async (w: any) => {
                    try {
                        const r = await axios.get(`${API}/api/tasks/completion/${w.id}`);
                        compMap[w.id] = r.data;
                    } catch { compMap[w.id] = { completionPct: 0, totalTasks: 0 }; }
                }));
                setCompletions(compMap);
            } catch { toast.error('Failed to load projects'); }
            finally { setLoading(false); }
        };
        load();
    }, [isAdmin, user?.id]);

    const toggleProject = async (woId: number) => {
        const isOpen = expanded[woId];
        setExpanded(prev => ({ ...prev, [woId]: !isOpen }));
        if (!isOpen && !tasksByProject[woId]) {
            setLoadingTasks(prev => ({ ...prev, [woId]: true }));
            try {
                const { data } = await axios.get(`${API}/api/tasks?workOrderId=${woId}`);
                setTasksByProject(prev => ({ ...prev, [woId]: Array.isArray(data) ? data : [] }));
            } catch { toast.error('Failed to load tasks'); }
            finally { setLoadingTasks(prev => ({ ...prev, [woId]: false })); }
        }
    };

    const handleDeleteTask = async (taskId: number, woId: number) => {
        if (!confirm('Delete this task and its subtasks?')) return;
        try {
            await axios.delete(`${API}/api/tasks/${taskId}`);
            const updated = (tasksByProject[woId] || []).filter(t => t.id !== taskId && t.parentTaskId !== taskId);
            setTasksByProject(prev => ({ ...prev, [woId]: updated }));
            toast.success('Task deleted');
        } catch { toast.error('Delete failed'); }
    };

    const getTaskIcon = (task: any) => {
        if (task.completed) return <CheckCircle2 size={16} color="var(--success)" />;
        if (task.endDate && task.endDate < today && task.completionPct < 100) return <AlertTriangle size={16} color="var(--danger)" />;
        return <Clock size={16} color="var(--warning)" />;
    };

    const renderTasks = (tasks: any[], woId: number) => {
        const topLevel = tasks.filter(t => !t.parentTaskId);
        const subtasksOf = (parentId: number) => tasks.filter(t => t.parentTaskId === parentId);

        return topLevel.map(task => (
            <div key={task.id}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.75rem', background: 'white',
                    borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
                    borderLeft: task.completed ? '3px solid var(--success)' :
                        (task.endDate && task.endDate < today && task.completionPct < 100) ? '3px solid var(--danger)' :
                            '3px solid var(--warning)'
                }}>
                    {getTaskIcon(task)}
                    <span style={{ fontWeight: 600, flex: 1, minWidth: 100 }}>{task.title}</span>
                    {task.assigneeName && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👤 {task.assigneeName}</span>}
                    {task.startDate && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{task.startDate} → {task.endDate}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${task.completionPct}%`, height: '100%', background: task.completed ? 'var(--success)' : 'var(--primary)', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: task.completed ? 'var(--success)' : 'var(--text-muted)' }}>{task.completionPct}%</span>
                    </div>
                    {isAdmin && (
                        <button onClick={() => handleDeleteTask(task.id, woId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
                {/* Subtasks */}
                {subtasksOf(task.id).map(sub => (
                    <div key={sub.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.55rem 0.75rem 0.55rem 2.5rem',
                        background: '#fafbfc', borderBottom: '1px dashed var(--border)', flexWrap: 'wrap',
                        borderLeft: sub.completed ? '3px solid rgba(16,185,129,0.4)' :
                            (sub.endDate && sub.endDate < today && sub.completionPct < 100) ? '3px solid rgba(239,68,68,0.4)' :
                                '3px solid rgba(245,158,11,0.4)'
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>↳</span>
                        {getTaskIcon(sub)}
                        <span style={{ fontSize: '0.88rem', flex: 1, minWidth: 100 }}>{sub.title}</span>
                        {sub.assigneeName && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>👤 {sub.assigneeName}</span>}
                        {sub.startDate && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.startDate} → {sub.endDate}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 60, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${sub.completionPct}%`, height: '100%', background: sub.completed ? 'var(--success)' : 'var(--primary)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{sub.completionPct}%</span>
                        </div>
                        {isAdmin && (
                            <button onClick={() => handleDeleteTask(sub.id, woId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        ));
    };

    return (
        <div className="page-container fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Task List</h2>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => navigate('/tasks/add')} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Plus size={18} /> Add Task
                    </button>
                )}
            </div>

            {loading ? (
                <div className="page-loader"><span className="page-spinner" /><span>Loading projects...</span></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {workOrders.length === 0 && (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No projects found. {isAdmin ? 'Create a project first.' : 'You have no assigned projects.'}
                        </div>
                    )}
                    {workOrders.map(wo => {
                        const comp = completions[wo.id] || {};
                        const pct = comp.completionPct || 0;
                        const hasOverdue = (comp.overdueTasks || 0) > 0;
                        const isOpen = expanded[wo.id];

                        return (
                            <div key={wo.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: hasOverdue ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
                                {/* Project Header */}
                                <div
                                    onClick={() => toggleProject(wo.id)}
                                    style={{ padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', background: isOpen ? 'rgba(16,185,129,0.03)' : 'white', transition: 'background 0.15s' }}
                                >
                                    <Briefcase size={20} color={hasOverdue ? 'var(--danger)' : 'var(--primary)'} style={{ flexShrink: 0 }} />
                                    <div style={{ flex: 1, minWidth: 100 }}>
                                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{wo.jobTitle || wo.description || `WO #${wo.id}`}</div>
                                        {wo.jobCode && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{wo.jobCode}</div>}
                                    </div>
                                    {/* Completion badge */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 100, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? 'var(--success)' : hasOverdue ? 'var(--danger)' : 'var(--primary)', borderRadius: 4, transition: 'width 0.3s' }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{pct}%</span>
                                    </div>
                                    {hasOverdue && (
                                        <span style={{ fontSize: '0.75rem', background: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                                            {comp.overdueTasks} overdue
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{comp.totalTasks || 0} tasks</span>
                                    <button
                                        onClick={e => { e.stopPropagation(); navigate(`/tasks/gantt?projectId=${wo.id}`); }}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        <BarChart2 size={14} /> Gantt
                                    </button>
                                    {isOpen ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                                </div>

                                {/* Task list */}
                                {isOpen && (
                                    <div>
                                        {loadingTasks[wo.id] ? (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tasks...</div>
                                        ) : (tasksByProject[wo.id] || []).length === 0 ? (
                                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                                                No tasks yet.{' '}
                                                {isAdmin && <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/tasks/add?projectId=${wo.id}`)}>Add one →</span>}
                                            </div>
                                        ) : (
                                            <div style={{ borderTop: '1px solid var(--border)' }}>
                                                {renderTasks(tasksByProject[wo.id], wo.id)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TaskList;
