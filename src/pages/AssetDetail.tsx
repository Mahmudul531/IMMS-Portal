import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Package, Building2, Image, ChevronLeft, ChevronRight,
  Loader2, ArrowRightLeft, Hammer, Clock, CheckCircle, User, MapPin
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property { id: number; name: string; address?: string; }
interface Asset { id: number; name: string; type: string; property: Property; createdAt?: string; }
interface AssetImage { id: number; imageData: string; }
interface TransferLog {
  id: number; assetId: number; assetName: string;
  fromPropertyId: number; fromPropertyName: string;
  toPropertyId: number; toPropertyName: string;
  transferredBy: string; transferNote?: string;
  transferDate: string;
}
interface WorkOrder {
  id: number; description: string; status: string; amount?: number;
  asset: { id: number; name: string };
  vendor?: { username: string };
  createdAt?: string;
}

// Lightbox gallery component
const ImageGallery = ({ images }: { images: AssetImage[] }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const prev = () => setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % images.length : null);

  if (images.length === 0) return (
    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 8, border: '1px dashed var(--border)' }}>
      <Image size={28} style={{ opacity: 0.4, display: 'block', margin: '0 auto 6px' }} />
      <p style={{ margin: 0, fontSize: '0.85rem' }}>No photos yet.</p>
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <img key={img.id} src={img.imageData} alt="" onClick={() => setLightbox(idx)}
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid var(--border)', transition: 'transform 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; (e.target as HTMLImageElement).style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; (e.target as HTMLImageElement).style.borderColor = 'var(--border)'; }}
          />
        ))}
      </div>
      {lightbox !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={28} /></button>
          <img src={images[lightbox].imageData} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
          <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={28} /></button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{lightbox + 1} / {images.length} · Click outside to close</div>
        </div>
      )}
    </>
  );
};

const statusColor: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#f5f5f5',             color: '#666' },
  APPLIED:   { bg: '#fff4cc',             color: '#997a00' },
  ASSIGNED:  { bg: 'rgba(0,180,100,0.1)', color: 'var(--success)' },
  CANCELLED: { bg: '#ffebee',             color: '#c62828' },
};

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [images, setImages] = useState<AssetImage[]>([]);
  const [history, setHistory] = useState<TransferLog[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [assetRes, imgRes, histRes, woRes] = await Promise.all([
          axios.get(`${API}/api/assets/${id}`),
          axios.get(`${API}/api/assets/${id}/images`),
          axios.get(`${API}/api/assets/${id}/history`),
          axios.get(`${API}/api/work-orders`),
        ]);
        const a: Asset = assetRes.data;
        setAsset(a);
        setImages(Array.isArray(imgRes.data) ? imgRes.data : []);
        setHistory(Array.isArray(histRes.data) ? histRes.data : []);
        const allWo: WorkOrder[] = Array.isArray(woRes.data) ? woRes.data : [];
        setWorkOrders(allWo.filter(wo => wo.asset?.id === parseInt(id!)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!asset) return null;

  // Build a timeline: creation event + all transfers (oldest first for display)
  const timelineEntries: { date: string; icon: React.ReactNode; title: string; subtitle: string; color: string }[] = [];

  // Initial creation row — We derive the "original property" from the last transfer's fromProperty
  // (transfers are newest-first from API, so last entry = earliest). If no transfers, use current property.
  const sortedHistory = [...history].reverse(); // oldest first
  const originProperty = sortedHistory.length > 0 ? sortedHistory[0].fromPropertyName : asset.property?.name;
  timelineEntries.push({
    date: asset.createdAt ? new Date(asset.createdAt).toLocaleString() : 'Unknown',
    icon: <Package size={16} />, color: 'var(--primary)',
    title: 'Asset Created',
    subtitle: `Registered at property: ${originProperty}`,
  });

  sortedHistory.forEach(log => {
    timelineEntries.push({
      date: new Date(log.transferDate).toLocaleString(),
      icon: <ArrowRightLeft size={16} />, color: 'var(--warning)',
      title: `Transferred by ${log.transferredBy}`,
      subtitle: `${log.fromPropertyName} → ${log.toPropertyName}${log.transferNote ? ` · Note: ${log.transferNote}` : ''}`,
    });
  });

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* ── Header ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Package size={30} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{asset.name}</h1>
            <span style={{ background: 'rgba(0,120,255,0.1)', color: 'var(--primary)', borderRadius: 6, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>{asset.type}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 12 }}>
          <Building2 size={16} />
          <span>Current Property: </span>
          <strong
            style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate(`/properties/${asset.property?.id}`)}
          >{asset.property?.name || 'N/A'}</strong>
          <MapPin size={14} color="var(--text-muted)" />
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{images.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--warning)' }}>{history.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transfers</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{workOrders.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Work Orders</div>
          </div>
        </div>
      </div>

      {/* ── Photos ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Image size={18} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Asset Photos</h2>
          <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem' }}>{images.length}</span>
        </div>
        <ImageGallery images={images} />
      </div>

      {/* ── Activity Timeline ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Clock size={18} color="var(--warning)" />
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Activity & Transfer History</h2>
        </div>
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {timelineEntries.map((entry, idx) => (
            <div key={idx} style={{ position: 'relative', marginBottom: 20, paddingLeft: 12 }}>
              {/* Circle dot */}
              <div style={{ position: 'absolute', left: -21, top: 2, width: 22, height: 22, borderRadius: '50%', background: entry.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 1 }}>
                {entry.icon}
              </div>
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{entry.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 4 }}>{entry.subtitle}</div>
                <div style={{ fontSize: '0.75rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> {entry.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Work Orders ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Hammer size={18} color="var(--success)" />
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>All Work Orders for this Asset</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>WO ID</th><th>Description</th><th>Date</th><th>Status</th><th>Vendor</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map(wo => (
              <tr key={wo.id}>
                <td>#{wo.id}</td>
                <td>{wo.description}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{wo.createdAt || '—'}</td>
                <td>
                  <span style={{ borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 600, ...(statusColor[wo.status] || {}) }}>
                    {wo.status}
                  </span>
                </td>
                <td>
                  {wo.vendor?.username
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} />@{wo.vendor.username}</span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Unassigned</span>}
                </td>
                <td>{wo.amount != null ? `৳${Number(wo.amount).toFixed(2)}` : '—'}</td>
              </tr>
            ))}
            {workOrders.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                <CheckCircle size={20} style={{ opacity: 0.3 }} /> No work orders for this asset.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetDetail;
