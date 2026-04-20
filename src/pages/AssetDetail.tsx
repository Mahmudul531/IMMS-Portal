import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Package, Building2, Image, ChevronLeft, ChevronRight,
  Loader2, ArrowRightLeft, Hammer, Clock, CheckCircle, User, MapPin, 
  Download, FileText, FileSpreadsheet, DollarSign, Calendar
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const createLabelIcon = (name: string) => L.divIcon({
    className: 'property-label-marker',
    html: `<div class="property-label-pin" style="cursor: pointer;" title="Click to view property">
              <div class="property-label-tag">${name}</div>
           </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 50], // Push label high enough to sit exactly above the default blue marker
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property { id: number; name: string; address?: string; locLat?: string; locLon?: string; }
interface Asset { 
  id: number; name: string; type: string; category?: string; property: Property; createdAt?: string;
  supplierName?: string; assetCode?: string; purchaseDate?: string; 
  purchaseValue?: number; depreciationPercentage?: number; invoiceUrl?: string;
  longDescription?: string; remarks?: string;
}
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

  const getExportData = () => {
    const data: any[] = [];
    const sorted = [...history].reverse();
    const originProp = sorted.length > 0 ? sorted[0].fromPropertyName : asset.property?.name;
    
    data.push({
      Date: asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : 'Unknown',
      Activity: 'Asset Created',
      'Action By': 'System',
      'From': '—',
      'To': originProp || '—',
      Note: 'Initial registration'
    });

    sorted.forEach(h => {
      data.push({
        Date: new Date(h.transferDate).toLocaleDateString(),
        Activity: 'Transferred',
        'Action By': h.transferredBy,
        'From': h.fromPropertyName,
        'To': h.toPropertyName,
        Note: h.transferNote || '-'
      });
    });
    return data;
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text(`Asset Activity History - ${asset.name}`, 14, 15);
    const data = getExportData();
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Activity', 'Action By', 'From Property', 'To Property', 'Note']],
      body: data.map(d => [d.Date, d.Activity, d['Action By'], d.From, d.To, d.Note])
    });
    doc.save(`${asset.name.replace(/\s+/g, '_')}_History.pdf`);
  };

  const exportXls = () => {
    const data = getExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Activity_Log");
    XLSX.writeFile(wb, `${asset.name.replace(/\s+/g, '_')}_History.xlsx`);
  };

  const handleDownloadInvoice = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!asset.invoiceUrl) return;
    try {
      const response = await fetch(asset.invoiceUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${asset.name.replace(/\s+/g, '_')}_invoice.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      window.open(asset.invoiceUrl, '_blank');
    }
  };

  const calcDepreciation = () => {
    if (!asset.purchaseValue || !asset.purchaseDate || !asset.depreciationPercentage) return null;
    const years = (new Date().getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Depreciation only starts after 1 year
    const effectiveYears = years >= 1 ? years : 0;
    const drop = asset.purchaseValue * (asset.depreciationPercentage / 100) * effectiveYears;
    const actual = Math.max(0, asset.purchaseValue - drop);
    
    return { actual, drop, years, effectiveYears };
  };

  const depCalc = calcDepreciation();

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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Finances & Details */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Financial & Description</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px' }}>Supplier</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{asset.supplierName || '—'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px' }}>Asset Code</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{asset.assetCode || '—'}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 8 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14}/> Purchase Date</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{asset.purchaseDate || '—'}</p>
            </div>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 8 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={14}/> Purchase Value</p>
              <p style={{ margin: 0, fontWeight: 600 }}>{asset.purchaseValue ? `৳${asset.purchaseValue.toLocaleString()}` : '—'}</p>
            </div>
          </div>
          
          {depCalc && (
            <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: 8, marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', margin: '0 0 8px', fontWeight: 600 }}>Current Value Estimate (Depreciation: {asset.depreciationPercentage}%/yr)</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>৳{depCalc.actual.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Age: {depCalc.years.toFixed(1)} yrs</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                    {depCalc.effectiveYears >= 1 
                      ? `Value dropped: ৳${depCalc.drop.toLocaleString(undefined, {maximumFractionDigits: 0})}` 
                      : 'No depreciation applied yet'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {asset.invoiceUrl && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleDownloadInvoice} style={{ display: 'inline-flex', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <Download size={16} style={{ marginRight: 6 }}/> View / Download Invoice
              </button>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem 0' }}>Property Location</h2>
          {asset.property?.locLat && asset.property?.locLon ? (
            <div style={{ height: '240px', borderRadius: 8, overflow: 'hidden' }}>
              <MapContainer center={[parseFloat(asset.property.locLat), parseFloat(asset.property.locLon)]} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {/* Default Map marker */}
                <Marker position={[parseFloat(asset.property.locLat), parseFloat(asset.property.locLon)]} />
                {/* Floating label marker above the default pin */}
                <Marker 
                  position={[parseFloat(asset.property.locLat), parseFloat(asset.property.locLon)]}
                  icon={createLabelIcon(asset.property.name)}
                  eventHandlers={{ click: () => navigate(`/properties/${asset.property.id}`) }}
                />
              </MapContainer>
            </div>
          ) : (
            <div style={{ height: '240px', background: '#f1f5f9', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <MapPin size={40} style={{ marginBottom: 10, opacity: 0.5 }} />
              <span>Location Not Available</span>
            </div>
          )}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} color="var(--warning)" />
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Activity & Transfer History</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={exportPdf} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={14}/> PDF</button>
            <button className="btn btn-secondary" onClick={exportXls} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}><FileSpreadsheet size={14}/> XLS</button>
          </div>
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
