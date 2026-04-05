import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Package, Inbox, ArrowLeft, Loader2, MapPin, Briefcase, Image, ChevronLeft, ChevronRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property {
  id: number;
  name: string;
  address: string;
  locLat: string;
  locLon: string;
}

interface Asset {
  id: number;
  name: string;
  type: string;
}

interface WorkOrder {
  id: number;
  description: string;
  status: string;
  amount: number;
  asset: Asset;
  vendor?: { username: string };
}

interface ImageRecord {
  id: number;
  imageData: string;
}

// Simple image gallery / carousel strip with lightbox
const ImageGallery = ({ images }: { images: ImageRecord[] }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (images.length === 0) return (
    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 8, border: '1px dashed var(--border)' }}>
      <Image size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
      <p style={{ margin: 0, fontSize: '0.9rem' }}>No photos uploaded yet.</p>
    </div>
  );

  const prev = () => setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % images.length : null);

  return (
    <>
      {/* Thumbnail strip */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <img
            key={img.id}
            src={img.imageData}
            alt={`photo-${idx + 1}`}
            onClick={() => setLightbox(idx)}
            style={{
              width: 100,
              height: 100,
              objectFit: 'cover',
              borderRadius: 8,
              cursor: 'pointer',
              border: '2px solid var(--border)',
              transition: 'transform 0.15s, border-color 0.15s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
            }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.04)'; (e.target as HTMLImageElement).style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; (e.target as HTMLImageElement).style.borderColor = 'var(--border)'; }}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          >
            <ChevronLeft size={28} />
          </button>
          <img
            src={images[lightbox].imageData}
            alt=""
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '85vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          >
            <ChevronRight size={28} />
          </button>
          <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            {lightbox + 1} / {images.length} · Click outside to close
          </div>
        </div>
      )}
    </>
  );
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [propertyImages, setPropertyImages] = useState<ImageRecord[]>([]);
  const [assetImages, setAssetImages] = useState<Record<number, ImageRecord[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, assetsRes, woRes] = await Promise.all([
          axios.get(`${API}/api/properties`),
          axios.get(`${API}/api/assets`),
          axios.get(`${API}/api/work-orders`)
        ]);

        const currentProp = propsRes.data.find((p: any) => p.id === parseInt(id!));
        if (!currentProp) {
          navigate('/dashboard');
          return;
        }
        setProperty(currentProp);

        const propAssets = (assetsRes.data || []).filter((a: any) => a.property?.id === currentProp.id);
        setAssets(propAssets);

        const assetIds = propAssets.map((a: any) => a.id);
        const propWOs = (woRes.data || []).filter((wo: any) => wo.asset && assetIds.includes(wo.asset.id));
        setWorkOrders(propWOs);

        // Load property images
        const imgRes = await axios.get(`${API}/api/properties/${currentProp.id}/images`);
        setPropertyImages(Array.isArray(imgRes.data) ? imgRes.data : []);

        // Load images for each asset in parallel
        const assetImgResults = await Promise.all(
          propAssets.map((a: any) => axios.get(`${API}/api/assets/${a.id}/images`).then(r => ({ id: a.id, images: r.data })))
        );
        const imgMap: Record<number, ImageRecord[]> = {};
        assetImgResults.forEach(r => { imgMap[r.id] = Array.isArray(r.images) ? r.images : []; });
        setAssetImages(imgMap);

      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={48} />
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* ── Property Header ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
          <Building2 size={30} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{property.name}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <MapPin size={16} />
          <span>{property.address}</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{assets.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assets</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{workOrders.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Work Orders</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{propertyImages.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Photos</div>
          </div>
        </div>
      </div>

      {/* ── Property Photos ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Image size={20} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Property Photos</h2>
          <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{propertyImages.length}</span>
        </div>
        <ImageGallery images={propertyImages} />
      </div>

      {/* ── Linked Assets ── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Inbox size={20} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Linked Infrastructure Assets</h2>
        </div>
        {assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No assets for this property.</div>
        ) : (
          assets.map(asset => (
            <div key={asset.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Package size={18} color="var(--success)" />
                <strong>#{asset.id} — {asset.name}</strong>
                <span className="badge badge-info" style={{ marginLeft: 4 }}>{asset.type}</span>
              </div>
              <ImageGallery images={assetImages[asset.id] || []} />
            </div>
          ))
        )}
      </div>

      {/* ── Work Orders ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Briefcase size={20} color="var(--warning)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Current Maintenance Work Orders</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Duty ID</th>
              <th>Asset</th>
              <th>Description</th>
              <th>Status</th>
              <th>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map(wo => (
              <tr key={wo.id}>
                <td>#{wo.id}</td>
                <td style={{ fontWeight: 600 }}>{wo.asset?.name || 'Unknown Asset'}</td>
                <td>{wo.description}</td>
                <td>
                  <span className={`badge ${wo.status === 'ASSIGNED' ? 'badge-success' : 'badge-warning'}`}>
                    {wo.status}
                  </span>
                </td>
                <td>{wo.vendor?.username ? <span style={{ color: 'var(--primary)' }}>@{wo.vendor.username}</span> : '--'}</td>
              </tr>
            ))}
            {workOrders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No active maintenance work orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyDetail;
