import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Clock, Info, Trash2, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const fmt = (n: number) => new Intl.NumberFormat('en-BD').format(n);

interface JobProgress {
    jobId: string;
    status: string;
    totalRows: number;
    processedRows: number;
    importedRows: number;
    errorRows: number;
    percent: number;
    currentStep: string;
    errorSummary: string | null;
    logId: number | null;
}

export default function UploadFile() {
    const { isDark } = useTheme();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [job, setJob] = useState<JobProgress | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const c = {
        text: isDark ? 'white' : '#0f172a',
        textSub: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)',
        textMuted: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
        cardBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.88)',
        cardBorder: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
        chipBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        chipText: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)',
        infoBg: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.07)',
        infoBorder: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.2)',
        infoText: isDark ? '#93c5fd' : '#1d4ed8',
        rowBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        iconColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
        dropBorder: (d: boolean, f: boolean) => d ? '#3b82f6' : f ? '#10b981' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'),
        dropBg: (d: boolean, f: boolean) => d ? 'rgba(59,130,246,0.06)' : f ? 'rgba(16,185,129,0.04)' : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
        dropText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
        dropSub: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
        fileSub: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        importedText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        noUpload: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
        recText: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)',
        fnText: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
        histTitle: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)',
        dateText: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
        trackBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    };

    const loadLogs = async () => {
        try {
            const res = await axios.get(`${API}/phar/api/upload/logs`);
            setLogs(res.data || []);
        } catch { }
    };

    useEffect(() => { loadLogs(); }, []);

    // ── Polling ────────────────────────────────────────────────────────────────
    const startPolling = (jobId: string) => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`${API}/phar/api/upload/progress/${jobId}`);
                const data: JobProgress = res.data;
                setJob(data);
                if (['SUCCESS', 'PARTIAL', 'FAILED'].includes(data.status)) {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                    setUploading(false);
                    setFile(null);
                    loadLogs();
                }
            } catch { clearInterval(pollRef.current!); pollRef.current = null; setUploading(false); }
        }, 800);
    };

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    // ── Upload ─────────────────────────────────────────────────────────────────
    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setJob(null);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await axios.post(`${API}/phar/api/upload/excel`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 0, // no timeout — large files can take minutes to transfer
            });
            const { jobId } = res.data;
            startPolling(jobId);
        } catch (e: any) {
            setJob({ jobId: '', status: 'FAILED', totalRows: 0, processedRows: 0, importedRows: 0,
                errorRows: 0, percent: 0, currentStep: 'Failed', errorSummary: e.response?.data || e.message, logId: null });
            setUploading(false);
        }
    };

    const handleDeleteLog = async (logId: number, filename: string) => {
        if (!window.confirm(`Delete "${filename}" and all its imported sales data from the database?`)) return;
        setDeletingId(logId);
        try {
            await axios.delete(`${API}/phar/api/upload/logs/${logId}`);
            setLogs(prev => prev.filter(l => l.id !== logId));
        } catch (e: any) { alert('Failed: ' + (e.response?.data || e.message)); }
        setDeletingId(null);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
    };

    const statusColor = (s: string) => ({ SUCCESS: '#10b981', PARTIAL: '#f59e0b', FAILED: '#ef4444', PROCESSING: '#3b82f6', QUEUED: '#8b5cf6' }[s] || '#94a3b8');

    const isActive = uploading || (job && !['SUCCESS', 'PARTIAL', 'FAILED'].includes(job.status));
    const isDone = job && ['SUCCESS', 'PARTIAL', 'FAILED'].includes(job.status);
    const btnDisabled = !file || !!isActive;
    const pct = job?.percent ?? 0;

    const progressColor = job?.status === 'FAILED' ? '#ef4444' : job?.status === 'PARTIAL' ? '#f59e0b' : '#3b82f6';

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: c.text }}>Upload Sales Data</h1>
                <p style={{ margin: '0.25rem 0 0', color: c.textSub, fontSize: '0.875rem' }}>Import any size Excel dataset — processing happens in the background</p>
            </div>

            {/* Column Info */}
            <div style={{ background: c.infoBg, border: `1px solid ${c.infoBorder}`, borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', color: c.infoText, fontWeight: 700 }}>
                    <Info size={16} /> Required Excel Column Format (Row 1 = Header)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.4rem' }}>
                    {['A: Date (YYYY-MM-DD)', 'B: Zone', 'C: Territory', 'D: Sales Manager', 'E: Sales Representative', 'F: Shop Name', 'G: Product Name', 'H: Product SKU', 'I: Tier (1/2/3)', 'J: Quantity', 'K: Unit Price (BDT)'].map(col => (
                        <div key={col} style={{ background: c.chipBg, borderRadius: 8, padding: '0.4rem 0.75rem', color: c.chipText, fontSize: '0.8rem', fontFamily: 'monospace' }}>{col}</div>
                    ))}
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !isActive && fileRef.current?.click()}
                style={{
                    border: `2px dashed ${c.dropBorder(dragging, !!file)}`,
                    borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center',
                    cursor: isActive ? 'default' : 'pointer',
                    background: c.dropBg(dragging, !!file),
                    transition: 'all 0.2s', marginBottom: '1.5rem',
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
                }}
            >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                <FileSpreadsheet size={44} color={file ? '#10b981' : c.iconColor} style={{ marginBottom: '0.75rem' }} />
                {file ? (
                    <div>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>{file.name}</div>
                        <div style={{ color: c.fileSub, fontSize: '0.8rem', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB · {isActive ? 'Processing...' : 'Click to change'}</div>
                    </div>
                ) : (
                    <div>
                        <div style={{ color: c.dropText, fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Drop Excel file here or click to browse</div>
                        <div style={{ color: c.dropSub, fontSize: '0.8rem' }}>Supported: .xlsx, .xls · Any size supported</div>
                    </div>
                )}
            </div>

            {/* Upload Button */}
            <button onClick={handleUpload} disabled={btnDisabled} style={{
                width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
                background: btnDisabled ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                color: btnDisabled ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : 'white',
                fontSize: '1rem', fontWeight: 700, cursor: btnDisabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '1.5rem',
                boxShadow: btnDisabled ? 'none' : '0 4px 20px rgba(59,130,246,0.35)', transition: 'all 0.2s',
            }}>
                {isActive ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing in background...</> : <><Upload size={18} /> Upload & Import</>}
            </button>

            {/* ── Progress Panel ── */}
            {job && (
                <div style={{
                    background: c.cardBg, border: `1px solid ${isDone && job.status === 'FAILED' ? 'rgba(239,68,68,0.3)' : isDone ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
                    borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem',
                    boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.05)',
                }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Activity size={16} color={progressColor} />
                            <span style={{ fontWeight: 700, color: c.text, fontSize: '0.95rem' }}>
                                {isDone ? `Import ${job.status}` : 'Importing...'}
                            </span>
                        </div>
                        <span style={{ padding: '2px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, background: `${statusColor(job.status)}20`, color: statusColor(job.status) }}>
                            {job.status}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: c.trackBg, borderRadius: 99, height: 10, marginBottom: '0.75rem', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${progressColor}, ${progressColor}cc)`,
                            transition: 'width 0.4s ease',
                            boxShadow: isActive ? `0 0 10px ${progressColor}80` : 'none',
                            position: 'relative', overflow: 'hidden',
                        }}>
                            {isActive && (
                                <div style={{
                                    position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmer 1.4s infinite',
                                }} />
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {[
                            { label: 'Progress', value: `${pct}%`, color: progressColor },
                            { label: 'Processed', value: fmt(job.processedRows), color: c.text },
                            { label: 'Imported', value: fmt(job.importedRows), color: '#10b981' },
                            { label: 'Total Rows', value: fmt(job.totalRows), color: c.textSub },
                            { label: 'Errors', value: fmt(job.errorRows), color: job.errorRows > 0 ? '#f87171' : c.textSub },
                        ].map(s => (
                            <div key={s.label} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                                <div style={{ fontSize: '0.68rem', color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color as string, marginTop: 2 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Current step */}
                    <div style={{ fontSize: '0.8rem', color: c.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isActive && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: progressColor }} />}
                        {job.currentStep}
                    </div>

                    {/* Error summary */}
                    {job.errorSummary && (
                        <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: '0.78rem', color: '#fca5a5' }}>
                            ⚠ {job.errorSummary}
                        </div>
                    )}
                </div>
            )}

            {/* Upload History */}
            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 14, padding: '1.25rem', boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: c.histTitle, fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload History</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: c.textMuted }}>Click "Clear Data" on any file to remove it and all its imported records from the database.</p>
                </div>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: c.noUpload }}>No uploads yet</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {logs.map((log: any) => {
                            const isDeleting = deletingId === log.id;
                            return (
                                <div key={log.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.75rem 1rem', background: c.rowBg, borderRadius: 10,
                                    flexWrap: 'wrap', gap: '0.5rem',
                                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}`,
                                    opacity: isDeleting ? 0.5 : 1, transition: 'opacity 0.2s',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                        <FileSpreadsheet size={18} color={c.iconColor} style={{ flexShrink: 0 }} />
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ color: c.fnText, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.filename}</div>
                                            {log.uploadedAt && <div style={{ color: c.dateText, fontSize: '0.72rem', marginTop: 2 }}>{new Date(log.uploadedAt).toLocaleString('en-BD')}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                        <span style={{ color: c.recText, fontSize: '0.75rem' }}>{fmt(log.recordsImported)} records</span>
                                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${statusColor(log.status)}18`, color: statusColor(log.status) }}>{log.status}</span>
                                        <button onClick={() => handleDeleteLog(log.id, log.filename)} disabled={isDeleting} title="Delete this file's data" style={{
                                            display: 'flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.65rem', borderRadius: 7,
                                            border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.07)', color: '#f87171',
                                            fontSize: '0.72rem', fontWeight: 600, cursor: isDeleting ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                                        }}>
                                            {isDeleting ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                                            {isDeleting ? 'Deleting...' : 'Clear Data'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes shimmer { 0% { left: -100%; } 100% { left: 200%; } }
            `}</style>
        </div>
    );
}
