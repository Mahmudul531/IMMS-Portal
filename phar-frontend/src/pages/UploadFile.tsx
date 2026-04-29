import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Clock, Info } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function UploadFile() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [dragging, setDragging] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const loadLogs = async () => {
        try {
            const res = await axios.get(`${API}/phar/api/upload/logs`);
            setLogs(res.data || []);
        } catch {}
    };

    useState(() => { loadLogs(); });

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true); setResult(null);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await axios.post(`${API}/phar/api/upload/excel`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            setResult(res.data);
            loadLogs();
        } catch (e: any) {
            setResult({ status: 'FAILED', errorMessage: e.response?.data || 'Upload failed' });
        }
        setUploading(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
    };

    const statusColor = (s: string) => ({ SUCCESS: '#10b981', PARTIAL: '#f59e0b', FAILED: '#ef4444', PROCESSING: '#3b82f6' }[s] || '#94a3b8');
    const StatusIcon = ({ s }: any) => s === 'SUCCESS' ? <CheckCircle size={16} /> : s === 'FAILED' ? <XCircle size={16} /> : <Clock size={16} />;

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>Upload Sales Data</h1>
                <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Import monthly sales data from Excel</p>
            </div>

            {/* Excel Format Info */}
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem', color: '#93c5fd', fontWeight: 700 }}>
                    <Info size={16} /> Required Excel Column Format (Row 1 = Header)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.4rem' }}>
                    {['A: Date (YYYY-MM-DD)', 'B: Zone', 'C: Territory', 'D: Sales Manager', 'E: Sales Representative', 'F: Shop Name', 'G: Product Name', 'H: Product SKU', 'I: Tier (1/2/3)', 'J: Quantity', 'K: Unit Price (BDT)'].map(col => (
                        <div key={col} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.4rem 0.75rem', color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{col}</div>
                    ))}
                </div>
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                    border: `2px dashed ${dragging ? '#3b82f6' : file ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                    background: dragging ? 'rgba(59,130,246,0.06)' : file ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s', marginBottom: '1.5rem'
                }}
            >
                <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
                <FileSpreadsheet size={48} color={file ? '#10b981' : 'rgba(255,255,255,0.25)'} style={{ marginBottom: '1rem' }} />
                {file ? (
                    <div>
                        <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>{file.name}</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                    </div>
                ) : (
                    <div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '1rem', marginBottom: 4 }}>Drop Excel file here or click to browse</div>
                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Supported: .xlsx, .xls</div>
                    </div>
                )}
            </div>

            <button onClick={handleUpload} disabled={!file || uploading} style={{
                width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none',
                background: !file || uploading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                color: !file || uploading ? 'rgba(255,255,255,0.3)' : 'white',
                fontSize: '1rem', fontWeight: 700, cursor: !file || uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: '2rem',
                boxShadow: !file || uploading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)', transition: 'all 0.2s'
            }}>
                {uploading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : <><Upload size={18} /> Upload & Import</>}
            </button>

            {/* Result */}
            {result && (
                <div style={{
                    background: `rgba(${result.status === 'SUCCESS' ? '16,185,129' : result.status === 'FAILED' ? '239,68,68' : '245,158,11'},0.08)`,
                    border: `1px solid rgba(${result.status === 'SUCCESS' ? '16,185,129' : result.status === 'FAILED' ? '239,68,68' : '245,158,11'},0.25)`,
                    borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: statusColor(result.status), fontWeight: 700, marginBottom: '0.5rem' }}>
                        <StatusIcon s={result.status} /> Upload {result.status}
                    </div>
                    {result.recordsImported !== undefined && <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{result.recordsImported} records imported from {result.filename}</div>}
                    {result.errorMessage && <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠ {result.errorMessage}</div>}
                </div>
            )}

            {/* Upload History */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upload History</h3>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.25)' }}>No uploads yet</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {logs.map((log: any) => (
                            <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <FileSpreadsheet size={16} color="rgba(255,255,255,0.3)" />
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500 }}>{log.filename}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{log.recordsImported} records</span>
                                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `rgba(${statusColor(log.status)},0.1)`, color: statusColor(log.status) }}>{log.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
