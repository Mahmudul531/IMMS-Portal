import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UploadCloud, FileText, X, CheckCircle2, AlertCircle,
  FolderOpen, ChevronRight, Info
} from 'lucide-react';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

const CATEGORIES = [
  { value: 'ENGINEERING_DRAWING', label: 'Engineering Drawing' },
  { value: 'REPORT',              label: 'Report' },
  { value: 'CONTRACT',            label: 'Contract' },
  { value: 'SPECIFICATION',       label: 'Specification' },
  { value: 'OTHER',               label: 'Other' },
];

const ACCEPTED = '.pdf,.dwg,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.svg,.zip';

interface VersionCheck {
  documentGroup: string;
  existingVersions: number;
  nextVersion: number;
}

const DocumentAdd: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile]               = useState<File | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory]       = useState('');
  const [projectRef, setProjectRef]   = useState('');
  const [propertyRef, setPropertyRef] = useState('');

  const [versionCheck, setVersionCheck]   = useState<VersionCheck | null>(null);
  const [checkLoading, setCheckLoading]   = useState(false);

  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── File selection ──────────────────────────────────────────────────────

  const handleFileChange = (selected: File) => {
    setFile(selected);
    // Pre-fill title from filename if empty
    if (!title) {
      const name = selected.name.replace(/\.[^.]+$/, '');
      setTitle(name);
      triggerVersionCheck(name);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileChange(f);
  }, [title]);

  // ── Version check (debounced) ───────────────────────────────────────────

  const triggerVersionCheck = (t: string) => {
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    if (!t.trim()) { setVersionCheck(null); return; }
    titleDebounce.current = setTimeout(async () => {
      setCheckLoading(true);
      try {
        const res = await fetch(`${API}/documents/check?title=${encodeURIComponent(t.trim())}`);
        if (res.ok) setVersionCheck(await res.json());
      } finally {
        setCheckLoading(false);
      }
    }, 600);
  };

  const onTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    triggerVersionCheck(e.target.value);
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file)               { setError('Please select a file to upload.');  return; }
    if (!title.trim())       { setError('Title is required.');               return; }
    if (!category)           { setError('Please select a category.');        return; }

    setError('');
    setUploading(true);
    setProgress(10);

    const fd = new FormData();
    fd.append('file',           file);
    fd.append('title',          title.trim());
    fd.append('description',    description);
    fd.append('category',       category);
    fd.append('projectRef',     projectRef);
    fd.append('propertyRef',    propertyRef);
    if (user?.id)       fd.append('uploadedById',   String(user.id));
    if (user?.username) fd.append('uploadedByName', user.username);

    try {
      // Simulate progress ticks while fetching
      const ticker = setInterval(() => setProgress(p => Math.min(p + 8, 85)), 300);
      const res = await fetch(`${API}/documents`, { method: 'POST', body: fd });
      clearInterval(ticker);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => navigate('/documents/list'), 1800);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const formatBytes = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(2)} MB`;

  const fileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = { pdf: '#ef4444', dwg: '#3b82f6', docx: '#0ea5e9', doc: '#0ea5e9', xlsx: '#22c55e', xls: '#22c55e', png: '#a855f7', jpg: '#a855f7', jpeg: '#a855f7' };
    return map[ext] ?? '#94a3b8';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        <FolderOpen size={15} />
        <span>Document & Drawing</span>
        <ChevronRight size={14} />
        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Upload Document</span>
      </div>

      <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>
        Upload Document
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Files are stored securely in the cloud. PDFs are automatically indexed for full-text search.
      </p>

      {/* ── Success state ── */}
      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #34d399', borderRadius: 12, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
          <CheckCircle2 size={28} color="#059669" />
          <div>
            <div style={{ color: '#065f46', fontWeight: 700, fontSize: '1.05rem' }}>Upload Successful!</div>
            <div style={{ color: '#047857', fontSize: '0.85rem', marginTop: 2 }}>Redirecting to Document List…</div>
          </div>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.9rem' }}>
          <AlertCircle size={18} color="#ef4444" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Drop Zone ── */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? '#6366f1' : file ? '#22c55e' : '#cbd5e1'}`,
            borderRadius: 14,
            background: dragging ? '#eef2ff' : file ? '#f0fdf4' : '#f8fafc',
            padding: '2.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            marginBottom: '1.75rem',
          }}
        >
          {!file ? (
            <>
              <UploadCloud size={48} color={dragging ? '#6366f1' : '#94a3b8'} style={{ margin: '0 auto 1rem' }} />
              <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '1.05rem' }}>
                Drag & drop your file here, or <span style={{ color: '#6366f1' }}>browse</span>
              </div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 6 }}>
                PDF, DWG, DOCX, XLSX, PNG, JPG, ZIP and more
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
              <FileText size={36} color={fileIcon(file.name)} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>{formatBytes(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeFile(); }}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={onInputChange} />
        </div>

        {/* ── Metadata form ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Title */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Document Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              value={title}
              onChange={onTitleChange}
              placeholder="e.g. Site Survey Report 2024"
              style={inputStyle}
              required
            />
            {/* Version warning */}
            {versionCheck && versionCheck.existingVersions > 0 && !checkLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#fbbf24', fontSize: '0.82rem' }}>
                <Info size={14} />
                A document with this title already exists ({versionCheck.existingVersions} version{versionCheck.existingVersions > 1 ? 's' : ''}).
                Uploading will create <strong style={{ color: '#f59e0b' }}>Version {versionCheck.nextVersion}</strong>.
              </div>
            )}
            {versionCheck && versionCheck.existingVersions === 0 && !checkLoading && title.trim().length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: '#22c55e', fontSize: '0.82rem' }}>
                <CheckCircle2 size={14} />
                New document — will be created as Version 1.
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label style={labelStyle}>Category <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} required>
              <option value="">— Select category —</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Project Ref */}
          <div>
            <label style={labelStyle}>Project Reference</label>
            <input value={projectRef} onChange={e => setProjectRef(e.target.value)} placeholder="e.g. WO-2024-001" style={inputStyle} />
          </div>

          {/* Property Ref */}
          <div>
            <label style={labelStyle}>Property Reference</label>
            <input value={propertyRef} onChange={e => setPropertyRef(e.target.value)} placeholder="e.g. Bldg-A" style={inputStyle} />
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the document purpose or contents…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        {/* ── Progress bar ── */}
        {uploading && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', marginBottom: 6 }}>
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 99, transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: 12, marginTop: '2rem' }}>
          <button
            type="submit"
            disabled={uploading || success}
            style={{
              flex: 1,
              background: uploading || success ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: uploading || success ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <UploadCloud size={18} />
            {uploading ? 'Uploading…' : success ? 'Upload Complete' : 'Upload Document'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/documents/list')}
            style={{ padding: '0.85rem 1.5rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#475569',
  fontSize: '0.82rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  borderRadius: 9,
  padding: '0.65rem 0.85rem',
  color: '#1e293b',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
};

export default DocumentAdd;
