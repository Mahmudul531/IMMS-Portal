import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search, Calendar, Download, Trash2, ChevronDown, ChevronRight,
  FileText, FolderOpen, Clock, User, X, Filter
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

interface DocumentRecord {
  id: number;
  documentGroup: string;
  title: string;
  description?: string;
  category?: string;
  projectRef?: string;
  propertyRef?: string;
  originalFileName?: string;
  fileType?: string;
  fileSizeBytes?: number;
  cloudinaryUrl: string;
  version: number;
  uploadedByUserId?: number;
  uploadedByName?: string;
  uploadedAt: string;
}

const FILE_COLORS: Record<string, string> = {
  pdf: '#ef4444', dwg: '#3b82f6', docx: '#0ea5e9', doc: '#0ea5e9',
  xlsx: '#22c55e', xls: '#22c55e', pptx: '#f97316', ppt: '#f97316',
  png: '#a855f7', jpg: '#a855f7', jpeg: '#a855f7', zip: '#f59e0b',
};

const CAT_LABELS: Record<string, string> = {
  ENGINEERING_DRAWING: 'Eng. Drawing', REPORT: 'Report',
  CONTRACT: 'Contract', SPECIFICATION: 'Specification', OTHER: 'Other',
};

const CAT_COLORS: Record<string, string> = {
  ENGINEERING_DRAWING: '#3b82f6', REPORT: '#10b981',
  CONTRACT: '#f59e0b', SPECIFICATION: '#8b5cf6', OTHER: '#64748b',
};

const fmt = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const DocumentList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // version history: group → records[]
  const [versionMap, setVersionMap] = useState<Record<string, DocumentRecord[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [versionLoading, setVersionLoading] = useState<Set<string>>(new Set());

  const isAdmin = user?.role === 'ADMIN';

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${API}/documents?${params}`);
      if (res.ok) setDocs(await res.json());
    } finally {
      setLoading(false);
    }
  }, [q, from, to]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // search on Enter / debounce
  useEffect(() => {
    const t = setTimeout(() => fetchDocs(), 500);
    return () => clearTimeout(t);
  }, [q]);

  const toggleVersions = async (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) { next.delete(group); setExpandedGroups(next); return; }
    next.add(group);
    setExpandedGroups(next);
    if (versionMap[group]) return; // already loaded
    setVersionLoading(prev => new Set(prev).add(group));
    try {
      const res = await fetch(`${API}/documents/${encodeURIComponent(group)}/versions`);
      if (res.ok) {
        const versions: DocumentRecord[] = await res.json();
        setVersionMap(prev => ({ ...prev, [group]: versions }));
      }
    } finally {
      setVersionLoading(prev => { const s = new Set(prev); s.delete(group); return s; });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this version? This cannot be undone.')) return;
    const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== id));
      // refresh version maps
      setVersionMap({});
      setExpandedGroups(new Set());
      fetchDocs();
    }
  };

  const clearFilters = () => {
    setQ('');
    setFrom('');
    setTo('');
  };

  const handleDownload = async (url: string, fileName: string) => {
    if (!url) return;
    try {
      // Fetch the file as a Blob to force a local download with the correct filename,
      // bypassing the cross-origin 'download' attribute limitation.
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed, opening in new tab instead:', err);
      window.open(url, '_blank'); // Fallback to opening in a new tab
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', color: '#1e293b' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: '0.82rem', marginBottom: 6 }}>
            <FolderOpen size={14} /><span>Document & Drawing</span><ChevronRight size={13} />
            <span style={{ color: '#1e293b', fontWeight: 600 }}>Document List</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Document Library</h1>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: 4 }}>
            {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <button
          onClick={() => navigate('/documents/add')}
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.3rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
        >
          + Upload Document
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 14, padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Keyword search */}
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search title, description, category, or inside PDFs…"
              style={{ ...inputStyle, paddingLeft: 38, width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showFilters ? '#f1f5f9' : 'transparent', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.55rem 1rem', color: '#475569', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            <Filter size={15} /> {showFilters ? 'Hide' : 'Date Filter'}
          </button>
          {(q || from || to) && (
            <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.55rem 0.9rem', color: '#dc2626', cursor: 'pointer', fontSize: '0.82rem' }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div style={{ display: 'flex', gap: 12, marginTop: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}><Calendar size={12} style={{ marginRight: 4 }} />From Date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={labelStyle}><Calendar size={12} style={{ marginRight: 4 }} />To Date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
            </div>
            <button
              onClick={fetchDocs}
              style={{ alignSelf: 'flex-end', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#475569' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>⏳</div>
          Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#475569' }}>
          <FolderOpen size={52} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>No documents found</div>
          <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Try adjusting your search or upload a new document.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {docs.map(doc => {
            const ext = doc.fileType ?? 'file';
            const color = FILE_COLORS[ext] ?? '#94a3b8';
            const isExpanded = expandedGroups.has(doc.documentGroup);
            const versions = versionMap[doc.documentGroup] ?? [];
            const isLoadingVersions = versionLoading.has(doc.documentGroup);

            return (
              <div key={doc.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                {/* Main row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 1.25rem', flexWrap: 'wrap' }}>
                  {/* File icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={22} color={color} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.97rem' }}>{doc.title}</span>
                      {/* File type badge */}
                      <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {ext}
                      </span>
                      {/* Category badge */}
                      {doc.category && (
                        <span style={{ background: `${CAT_COLORS[doc.category] ?? '#475569'}20`, color: CAT_COLORS[doc.category] ?? '#94a3b8', border: `1px solid ${CAT_COLORS[doc.category] ?? '#475569'}40`, borderRadius: 6, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {CAT_LABELS[doc.category] ?? doc.category}
                        </span>
                      )}
                      {/* Version badge */}
                      {doc.version > 1 && (
                        <span style={{ background: '#7c3aed20', color: '#a78bfa', border: '1px solid #7c3aed40', borderRadius: 6, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700 }}>
                          v{doc.version}
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {doc.description && <span>{doc.description.length > 80 ? doc.description.slice(0, 80) + '…' : doc.description}</span>}
                      {doc.projectRef && <span>📁 {doc.projectRef}</span>}
                      {doc.propertyRef && <span>🏢 {doc.propertyRef}</span>}
                      <span><Clock size={11} style={{ verticalAlign: 'middle' }} /> {fmtDate(doc.uploadedAt)}</span>
                      {doc.uploadedByName && <span><User size={11} style={{ verticalAlign: 'middle' }} /> {doc.uploadedByName}</span>}
                      {doc.fileSizeBytes && <span>{fmt(doc.fileSizeBytes)}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Download latest */}
                    <button
                      onClick={() => handleDownload(doc.cloudinaryUrl, doc.originalFileName || `document_v${doc.version}`)}
                      title="Download latest version"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                    >
                      <Download size={14} /> Download
                    </button>
                    {/* Version history toggle */}
                    <button
                      onClick={() => toggleVersions(doc.documentGroup)}
                      title="Version history"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: isExpanded ? '#f3f4f6' : 'transparent', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 8, padding: '0.45rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      <Clock size={14} /> v{doc.version} {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                    {/* Delete (admin only) */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        title="Delete this version"
                        style={{ background: 'transparent', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.45rem 0.6rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Version history drawer */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {isLoadingVersions ? (
                      <div style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.85rem' }}>Loading version history…</div>
                    ) : (
                      <>
                        <div style={{ padding: '0.75rem 1.5rem 0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Version History — {versions.length} version{versions.length !== 1 ? 's' : ''}
                        </div>
                        {versions.map((v, idx) => (
                          <div
                            key={v.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 1.5rem', borderTop: idx > 0 ? '1px solid #e2e8f0' : 'none', flexWrap: 'wrap' }}
                          >
                            {/* Version badge */}
                            <span style={{ background: idx === 0 ? '#e0e7ff' : '#f1f5f9', color: idx === 0 ? '#4f46e5' : '#475569', border: `1px solid ${idx === 0 ? '#c7d2fe' : '#cbd5e1'}`, borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              v{v.version} {idx === 0 && <span style={{ color: '#059669', fontSize: '0.65rem', marginLeft: 4 }}>● LATEST</span>}
                            </span>

                            {/* Date */}
                            <span style={{ color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                              <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              {fmtDate(v.uploadedAt)}
                            </span>

                            {/* File name */}
                            {v.originalFileName && (
                              <span style={{ color: '#475569', fontSize: '0.8rem' }}>{v.originalFileName}</span>
                            )}
                            {v.fileSizeBytes && (
                              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{fmt(v.fileSizeBytes)}</span>
                            )}

                            {/* Uploader — clickable */}
                            {v.uploadedByName && (
                              <button
                                onClick={() => v.uploadedByUserId && navigate(`/personnel/${v.uploadedByUserId}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: '#818cf8', cursor: v.uploadedByUserId ? 'pointer' : 'default', fontSize: '0.82rem', padding: 0, textDecoration: v.uploadedByUserId ? 'underline' : 'none', textUnderlineOffset: 2 }}
                                title={v.uploadedByUserId ? `View ${v.uploadedByName}'s profile` : ''}
                              >
                                <User size={13} /> {v.uploadedByName}
                              </button>
                            )}

                            {/* Spacer */}
                            <div style={{ flex: 1 }} />

                            {/* Download button for each version */}
                            <button
                              onClick={() => handleDownload(v.cloudinaryUrl, v.originalFileName || `document_v${v.version}`)}
                              title={`Download version ${v.version}`}
                              style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 7, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              <Download size={13} /> v{v.version}
                            </button>

                            {/* Delete version (admin) */}
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(v.id)}
                                title="Delete this version"
                                style={{ background: 'transparent', border: '1px solid #fca5a5', borderRadius: 7, padding: '0.35rem 0.5rem', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </>
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

const inputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: '0.6rem 0.85rem',
  color: '#1e293b',
  fontSize: '0.88rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: 5,
  color: '#64748b',
  fontSize: '0.78rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default DocumentList;
