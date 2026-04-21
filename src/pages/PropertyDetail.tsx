import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Building2, Package, Inbox, ArrowLeft, Loader2, MapPin, Briefcase, Image, ChevronLeft, ChevronRight, Map as MapIcon, Phone, Mail, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Property {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  managerName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  active: boolean;
  propertyType: { id: number, name: string } | null;
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
  imageData: string; // URL like /uploads/properties/prop_1_xxx.jpg
}

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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {images.map((img, idx) => (
          <img
            key={img.id}
            src={`${img.imageData}`}
            alt={`photo-${idx + 1}`}
            onClick={() => setLightbox(idx)}
            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid var(--border)', transition: 'transform 0.15s, border-color 0.15s', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
            onMouseEnter={e => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; (e.target as HTMLImageElement).style.borderColor = 'var(--primary)'; }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; (e.target as HTMLImageElement).style.borderColor = 'var(--border)'; }}
          />
        ))}
      </div>

      {lightbox !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setLightbox(null)}>
          <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <ChevronLeft size={28} />
          </button>
          <img src={`${images[lightbox].imageData}`} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }} />
          <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
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
        if (!currentProp) { navigate('/dashboard'); return; }
        setProperty(currentProp);

        const propAssets = (assetsRes.data || []).filter((a: any) => a.property?.id === currentProp.id);
        setAssets(propAssets);

        const assetIds = propAssets.map((a: any) => a.id);
        setWorkOrders((woRes.data || []).filter((wo: any) => wo.asset && assetIds.includes(wo.asset.id)));

        // Load property images
        const imgRes = await axios.get(`${API}/api/properties/${currentProp.id}/images`);
        setPropertyImages(Array.isArray(imgRes.data) ? imgRes.data : []);

        // Load images for each asset in parallel
        const assetImgResults = await Promise.all(
          propAssets.map((a: any) =>
            axios.get(`${API}/api/assets/${a.id}/images`)
              .then(r => ({ id: a.id, images: Array.isArray(r.data) ? r.data : [] }))
              .catch(() => ({ id: a.id, images: [] }))
          )
        );
        const imgMap: Record<number, ImageRecord[]> = {};
        assetImgResults.forEach(r => { imgMap[r.id] = r.images; });
        setAssetImages(imgMap);

      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const toggleStatus = async () => {
    if (!property) return;
    try {
        const payload = { ...property, active: !property.active, propertyTypeId: property.propertyType?.id };
        await axios.put(`${API}/api/properties/${property.id}`, payload);
        setProperty({ ...property, active: !property.active });
        toast.success(`Property marked as ${!property.active ? 'Active' : 'Inactive'}`);
    } catch (error) {
        toast.error('Failed to change status');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
      <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={48} />
    </div>
  );

  if (!property) return null;

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      {/* Property Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: property.active ? 'white' : '#f8f9fa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.5rem' }}>
              <Building2 size={30} color={property.active ? "var(--primary)" : "var(--text-muted)"} />
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: property.active ? 'inherit' : 'var(--text-muted)' }}>{property.name}</h1>
              {property.code && <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{property.code}</span>}
              {!property.active && <span style={{ background: '#f8d7da', color: '#842029', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>Inactive</span>}
            </div>
            {property.propertyType && <div style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 500 }}>Type: {property.propertyType.name}</div>}
          </div>
          <button 
            onClick={toggleStatus}
            style={{ 
                border: 'none', 
                background: property.active ? '#f8d7da' : '#d1e7dd', 
                color: property.active ? '#842029' : '#0f5132', 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: '0.2s'
            }}
          >
            Mark as {property.active ? 'Inactive' : 'Active'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Basic Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {property.managerName && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><User size={16} color="var(--text-muted)"/> <strong>Manager:</strong> {property.managerName}</div>}
                    {property.contactPhone && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Phone size={16} color="var(--text-muted)"/> <strong>Phone:</strong> {property.contactPhone}</div>}
                    {property.contactEmail && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><Mail size={16} color="var(--text-muted)"/> <strong>Email:</strong> {property.contactEmail}</div>}
                    {property.description && (
                         <div style={{ marginTop: '0.5rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
                            {property.description}
                         </div>
                    )}
                </div>
            </div>
            
            <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Location Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}><MapPin size={16} color="var(--text-muted)" style={{ marginTop: 2 }}/> <strong>Address:</strong> <span>{property.address}</span></div>
                    {property.city && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: 24 }}><strong>City:</strong> {property.city}</div>}
                    {property.country && <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingLeft: 24 }}><strong>Country:</strong> {property.country}</div>}
                    
                    {property.locLat && property.locLon && (
                        <div style={{ height: '200px', width: '100%', marginTop: '1rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <MapContainer center={[parseFloat(property.locLat), parseFloat(property.locLon)]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[parseFloat(property.locLat), parseFloat(property.locLon)]}>
                                    <Popup>{property.name}</Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Property Photos Gallery */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Image size={20} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Property Photos</h2>
          <span style={{ background: 'var(--primary)', color: 'white', borderRadius: 12, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 }}>{propertyImages.length}</span>
        </div>
        <ImageGallery images={propertyImages} />
      </div>

      {/* Linked Assets with per-asset images */}
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
                <span style={{ background: 'rgba(0,180,100,0.1)', color: 'var(--success)', borderRadius: 6, padding: '1px 8px', fontSize: '0.8rem' }}>{asset.type}</span>
              </div>
              <ImageGallery images={assetImages[asset.id] || []} />
            </div>
          ))
        )}
      </div>

      {/* Work Orders */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Briefcase size={20} color="var(--warning)" />
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Current Maintenance Work Orders</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Duty ID</th><th>Asset</th><th>Description</th><th>Status</th><th>Vendor</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map(wo => (
              <tr key={wo.id}>
                <td>#{wo.id}</td>
                <td style={{ fontWeight: 600 }}>{wo.asset?.name || 'Unknown Asset'}</td>
                <td>{wo.description}</td>
                <td>
                  <span style={{ background: wo.status === 'ASSIGNED' ? 'rgba(0,180,100,0.1)' : 'rgba(255,180,0,0.1)', color: wo.status === 'ASSIGNED' ? 'var(--success)' : 'var(--warning)', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem' }}>
                    {wo.status}
                  </span>
                </td>
                <td>{wo.vendor?.username ? <span style={{ color: 'var(--primary)' }}>@{wo.vendor.username}</span> : '--'}</td>
              </tr>
            ))}
            {workOrders.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No active maintenance work orders.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropertyDetail;
