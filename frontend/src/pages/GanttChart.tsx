import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { BarChart2, CheckCircle2, AlertTriangle, Clock, ArrowLeft, Plus, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const today = new Date().toISOString().split('T')[0];

const daysBetween = (a: string, b: string) => {
    const ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.max(1, Math.ceil(ms / 86400000));
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const GanttChart = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState(params.get('projectId') || '');
    const [wo, setWo] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [editPct, setEditPct] = useState<Record<number, string>>({});
    const [showUpdateId, setShowUpdateId] = useState<number | null>(null);

    useEffect(() => {
        axios.get(`${API}/api/work-orders`).then(r => {
            const all = Array.isArray(r.data) ? r.data : [];
            setWorkOrders(isAdmin ? all : all.filter((w: any) => w.fieldEngineer?.id === user?.id));
        }).catch(() => {});
    }, [isAdmin, user?.id]);

    const loadProject = useCallback(async (projectId: string) => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [woRes, tasksRes] = await Promise.all([
                axios.get(`${API}/api/work-orders/${projectId}`),
                axios.get(`${API}/api/tasks?workOrderId=${projectId}`),
            ]);
            setWo(woRes.data);
            setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
        } catch { toast.error('Failed to load project'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (selectedProject) loadProject(selectedProject);
    }, [selectedProject, loadProject]);

    const handleProgressUpdate = async (taskId: number) => {
        const pct = parseInt(editPct[taskId] ?? '0');
        if (isNaN(pct) || pct < 0 || pct > 100) { toast.error('Enter a value between 0 and 100'); return; }
        setUpdatingId(taskId);
        try {
            await axios.put(`${API}/api/tasks/${taskId}/progress?pct=${pct}`);
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completionPct: pct, completed: pct === 100 } : t));
            setShowUpdateId(null);
            toast.success('Progress updated');
        } catch { toast.error('Update failed'); }
        finally { setUpdatingId(null); }
    };

    // Calculate Gantt timeline
    const ganttStart = (() => {
        const dates = tasks.filter(t => t.startDate).map(t => t.startDate);
        if (wo?.publishDate) dates.push(wo.publishDate);
        return dates.sort()[0] || today;
    })();
    const ganttEnd = (() => {
        const dates = tasks.filter(t => t.endDate).map(t => t.endDate);
        if (wo?.closeDate) dates.push(wo.closeDate);
        const last = [...dates].sort().reverse()[0] || today;
        // Ensure at least 30 days span
        const min = new Date(ganttStart);
        min.setDate(min.getDate() + 30);
        return last < min.toISOString().split('T')[0] ? min.toISOString().split('T')[0] : last;
    })();
    const totalDays = daysBetween(ganttStart, ganttEnd);

    const getBarStyle = (task: any) => {
        if (!task.startDate || !task.endDate) return null;
        const left = clamp(daysBetween(ganttStart, task.startDate) / totalDays * 100, 0, 100);
        const width = clamp(daysBetween(task.startDate, task.endDate) / totalDays * 100, 1, 100 - left);
        const isOverdue = task.endDate < today && task.completionPct < 100;
        const bg = task.completed ? '#10b981' : isOverdue ? '#ef4444' : '#3b82f6';
        return { left: `${left}%`, width: `${width}%`, background: bg };
    };

    const todayPct = clamp(daysBetween(ganttStart, today) / totalDays * 100, 0, 100);

    const topLevelTasks = tasks.filter(t => !t.parentTaskId);
    const subtasksOf = (parentId: number) => tasks.filter(t => t.parentTaskId === parentId);

    const overallPct = tasks.length === 0 ? 0 :
        Math.round(tasks.reduce((s, t) => s + t.completionPct, 0) / tasks.length);
    const overdueTasks = tasks.filter(t => t.endDate && t.endDate < today && t.completionPct < 100);

    const canUpdateTask = (task: any) =>
        isAdmin || task.assigneeId === user?.id || wo?.fieldEngineer?.id === user?.id;

    // Generate month/week header marks
    const headerMarks = (() => {
        const marks: { label: string; pct: number }[] = [];
        const start = new Date(ganttStart);
        const end = new Date(ganttEnd);
        const cur = new Date(start);
        cur.setDate(1);
        while (cur <= end) {
            const pct = clamp(daysBetween(ganttStart, cur.toISOString().split('T')[0]) / totalDays * 100, 0, 100);
            marks.push({ label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), pct });
            cur.setMonth(cur.getMonth() + 1);
        }
        return marks;
    })();

    const renderTaskRow = (task: any, isSubtask = false) => {
        const bar = getBarStyle(task);
        const isOverdue = task.endDate && task.endDate < today && task.completionPct < 100;
        const isUpdateOpen = showUpdateId === task.id;
        const myEditPct = editPct[task.id] ?? String(task.completionPct);

        return (
            <div key={task.id}>
                {/* Label + bar row */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', minHeight: 44 }}>
                    {/* Left: task info */}
                    <div style={{
                        width: 220, flexShrink: 0, padding: '0.5rem 0.75rem',
                        background: isSubtask ? '#fafbfc' : 'white',
                        paddingLeft: isSubtask ? '2rem' : '0.75rem',
                        borderRight: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        {isSubtask && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>↳</span>}
                        {task.completed ? <CheckCircle2 size={14} color="var(--success)" /> :
                            isOverdue ? <AlertTriangle size={14} color="var(--danger)" /> :
                                <Clock size={14} color="var(--warning)" />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: isSubtask ? 400 : 600, fontSize: isSubtask ? '0.82rem' : '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                            {task.assigneeName && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👤 {task.assigneeName}</div>}
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: task.completed ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'var(--text-muted)', flexShrink: 0 }}>{task.completionPct}%</span>
                    </div>

                    {/* Right: gantt bar area */}
                    <div style={{ flex: 1, position: 'relative', background: isSubtask ? '#fafbfc' : 'white' }}>
                        {/* Today line */}
                        <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: 'rgba(239,68,68,0.5)', zIndex: 1 }} />

                        {bar && (
                            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: isSubtask ? 14 : 18, borderRadius: 4, ...bar, zIndex: 2, overflow: 'hidden', cursor: canUpdateTask(task) ? 'pointer' : 'default', transition: 'opacity 0.15s' }}
                                title={`${task.startDate} → ${task.endDate}`}
                                onClick={() => canUpdateTask(task) && setShowUpdateId(isUpdateOpen ? null : task.id)}
                            >
                                {/* completion fill */}
                                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${task.completionPct}%`, background: 'rgba(255,255,255,0.28)', transition: 'width 0.3s' }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Inline progress update panel */}
                {isUpdateOpen && canUpdateTask(task) && (
                    <div style={{ background: '#f0fdf4', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Update: <em>{task.title}</em></span>
                        <input
                            type="range" min={0} max={100} step={5}
                            value={myEditPct}
                            onChange={e => setEditPct(prev => ({ ...prev, [task.id]: e.target.value }))}
                            style={{ flex: 1, minWidth: 100, maxWidth: 200 }}
                        />
                        <span style={{ fontWeight: 700, minWidth: 36 }}>{myEditPct}%</span>
                        <button className="btn btn-primary" onClick={() => handleProgressUpdate(task.id)} disabled={updatingId === task.id} style={{ width: 'auto', padding: '0.3rem 1rem', fontSize: '0.82rem' }}>
                            {updatingId === task.id ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setShowUpdateId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                    </div>
                )}

                {/* Subtasks */}
                {!isSubtask && subtasksOf(task.id).map(sub => renderTaskRow(sub, true))}
            </div>
        );
    };

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => navigate('/tasks/list')} style={{ width: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChart2 size={24} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Gantt Chart</h2>
                </div>
                {isAdmin && selectedProject && (
                    <button className="btn btn-primary" onClick={() => navigate(`/tasks/add?projectId=${selectedProject}`)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                        <Plus size={16} /> Add Task
                    </button>
                )}
            </div>

            {/* Project selector */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <label className="form-label" style={{ margin: 0, flexShrink: 0 }}>Select Project:</label>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
                        <select
                            className="form-input"
                            style={{ paddingRight: '2rem' }}
                            value={selectedProject}
                            onChange={e => setSelectedProject(e.target.value)}
                        >
                            <option value="">-- Choose a project --</option>
                            {workOrders.map(w => (
                                <option key={w.id} value={w.id}>{w.jobTitle || `WO #${w.id}`} {w.jobCode ? `(${w.jobCode})` : ''}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                    </div>
                </div>
            </div>

            {!selectedProject && (
                <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <BarChart2 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>Select a project to view its Gantt chart.</p>
                </div>
            )}

            {selectedProject && loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            {selectedProject && !loading && wo && (
                <>
                    {/* Project summary */}
                    <div className="card" style={{ marginBottom: '1.5rem', borderLeft: overdueTasks.length > 0 ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{wo.jobTitle || `WO #${wo.id}`}</div>
                                {wo.jobCode && <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{wo.jobCode}</div>}
                                {wo.property && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {wo.property.name}</div>}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: overallPct === 100 ? 'var(--success)' : overdueTasks.length > 0 ? 'var(--danger)' : 'var(--primary)' }}>{overallPct}%</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overall Completion</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{tasks.length}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Tasks</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{tasks.filter(t => t.completed).length}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Completed</div>
                            </div>
                            {overdueTasks.length > 0 && (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>{overdueTasks.length}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>Overdue</div>
                                </div>
                            )}
                        </div>
                        {/* Overall progress bar */}
                        <div style={{ marginTop: '1rem', height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${overallPct}%`, height: '100%', background: overallPct === 100 ? 'var(--success)' : overdueTasks.length > 0 ? 'var(--danger)' : 'var(--primary)', borderRadius: 5, transition: 'width 0.5s' }} />
                        </div>
                    </div>

                    {/* Overdue warning */}
                    {overdueTasks.length > 0 && (
                        <div style={{ background: '#ffebee', border: '1px solid #f44336', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <AlertTriangle size={20} color="#c62828" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 4 }}>⚠️ {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}</div>
                                {overdueTasks.map(t => (
                                    <div key={t.id} style={{ fontSize: '0.85rem', color: '#c62828' }}>
                                        • <strong>{t.title}</strong> — due {t.endDate}, {t.completionPct}% complete
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap', fontSize: '0.8rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 16, height: 10, background: '#10b981', borderRadius: 2 }} /> Completed</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 16, height: 10, background: '#3b82f6', borderRadius: 2 }} /> In Progress</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 16, height: 10, background: '#ef4444', borderRadius: 2 }} /> Overdue</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 2, height: 14, background: 'rgba(239,68,68,0.5)' }} /> Today</div>
                        <span style={{ color: 'var(--text-muted)' }}>• Click a bar to update progress</span>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No tasks yet.{' '}
                            {isAdmin && <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/tasks/add?projectId=${selectedProject}`)}>Add tasks →</span>}
                        </div>
                    ) : (
                        /* Gantt chart — horizontally scrollable */
                        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border)', background: 'white' }}>
                            <div style={{ minWidth: 700 }}>
                                {/* Header: month marks */}
                                <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: '#f8fafc' }}>
                                    <div style={{ width: 220, flexShrink: 0, padding: '0.5rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>TASK</div>
                                    <div style={{ flex: 1, position: 'relative', height: 32 }}>
                                        {headerMarks.map((m, i) => (
                                            <div key={i} style={{ position: 'absolute', left: `${m.pct}%`, top: 0, height: '100%', borderLeft: '1px solid var(--border)', paddingLeft: 4, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', lineHeight: '32px' }}>
                                                {m.label}
                                            </div>
                                        ))}
                                        {/* Today marker label */}
                                        <div style={{ position: 'absolute', left: `${todayPct}%`, top: 0, fontSize: '0.65rem', color: '#ef4444', fontWeight: 700, whiteSpace: 'nowrap', transform: 'translateX(-50%)', lineHeight: '32px' }}>
                                            TODAY
                                        </div>
                                    </div>
                                </div>

                                {/* Task rows */}
                                {topLevelTasks.map(task => renderTaskRow(task, false))}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Timeline: {ganttStart} → {ganttEnd} ({totalDays} days)
                    </div>
                </>
            )}
        </div>
    );
};

export default GanttChart;
