import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Image, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Compression helper
const compressFile = (file: File): Promise<File> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const MAX_DIM = 1400;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
                    else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
                }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
                const tryBlob = (q: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) { resolve(file); return; }
                        if (blob.size > 900_000 && q > 0.2) tryBlob(q - 0.1);
                        else resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
                    }, 'image/jpeg', q);
                };
                tryBlob(0.85);
            };
            img.src = e.target!.result as string;
        };
        reader.readAsDataURL(file);
    });
};

const AssetAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Check if we're editing via URL query param
    const searchParams = new URLSearchParams(location.search);
    const editingIdFromUrl = searchParams.get('id');

    // Global Dependencies
    const [properties, setProperties] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    // Form Core
    const [name, setName] = useState('');
    const [type, setType] = useState('');
    const [propertyId, setPropertyId] = useState('');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [assetCode, setAssetCode] = useState('');
    const [longDescription, setLongDescription] = useState('');
    const [remarks, setRemarks] = useState('');
    const [active, setActive] = useState(true);

    // Financial
    const [purchaseDate, setPurchaseDate] = useState('');
    const [purchaseValue, setPurchaseValue] = useState('');
    const [depreciationPercentage, setDepreciationPercentage] = useState('');

    // Personnel
    const [assignedUserId, setAssignedUserId] = useState('');
    const [department, setDepartment] = useState('');

    // Physical
    const [assetCondition, setAssetCondition] = useState('');
    const [weight, setWeight] = useState('');
    const [dimensions, setDimensions] = useState('');
    const [installationDate, setInstallationDate] = useState('');

    // Digital
    const [softwareName, setSoftwareName] = useState('');
    const [license, setLicense] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [credentials, setCredentials] = useState('');

    // Rental
    const [rentalUnit, setRentalUnit] = useState('');
    const [availability, setAvailability] = useState(true);
    const [deposit, setDeposit] = useState('');

    // Files
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<any[]>([]);

    const [uploading, setUploading] = useState(false);
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [propsRes, prefRes, usersRes] = await Promise.all([
                axios.get(`${API}/api/properties`),
                axios.get(`${API}/api/preferences/assets`),
                axios.get(`${API}/api/users`)
            ]);
            setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);

            if (Array.isArray(prefRes.data)) {
                setCategories(prefRes.data.filter(p => p.prefType === 'CATEGORY'));
                setSubCategories(prefRes.data.filter(p => p.prefType === 'SUBCATEGORY'));
            }

            if (Array.isArray(usersRes.data)) {
                setUsers(usersRes.data.filter(user => ['ADMIN', 'ENGINEER'].includes(user.role)));
            }

            if (editingIdFromUrl) {
                const { data: asset } = await axios.get(`${API}/api/assets/${editingIdFromUrl}`);
                populateForm(asset);
                const { data: images } = await axios.get(`${API}/api/assets/${editingIdFromUrl}/images`);
                setExistingImages(images);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load dependency data.");
        }
    };

    useEffect(() => { Object.keys(localStorage).length; fetchData(); }, []);

    const populateForm = (asset: any) => {
        setName(asset.name || '');
        setType(asset.type || '');
        setPropertyId(asset.property?.id?.toString() || '');
        setCategory(asset.category || '');
        setSubCategory(asset.subCategory || '');
        setSupplierName(asset.supplierName || '');
        setAssetCode(asset.assetCode || '');
        setLongDescription(asset.longDescription || '');
        setRemarks(asset.remarks || '');
        setActive(asset.active !== false);

        setPurchaseDate(asset.purchaseDate || '');
        setPurchaseValue(asset.purchaseValue || '');
        setDepreciationPercentage(asset.depreciationPercentage || '');

        setAssignedUserId(asset.assignedUser?.id?.toString() || '');
        setDepartment(asset.department || '');

        setAssetCondition(asset.assetCondition || '');
        setWeight(asset.weight || '');
        setDimensions(asset.dimensions || '');
        setInstallationDate(asset.installationDate || '');

        setSoftwareName(asset.softwareName || '');
        setLicense(asset.license || '');
        setExpiryDate(asset.expiryDate || '');
        setCredentials(asset.credentials || '');

        setRentalUnit(asset.rentalUnit || '');
        setAvailability(asset.availability !== false);
        setDeposit(asset.deposit || '');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const compressed = await Promise.all(files.map(compressFile));
        setPendingFiles(prev => [...prev, ...compressed]);
        setPendingPreviews(prev => [...prev, ...compressed.map(f => URL.createObjectURL(f))]);
        e.target.value = '';
    };

    const removePending = (idx: number) => {
        URL.revokeObjectURL(pendingPreviews[idx]);
        setPendingFiles(prev => prev.filter((_, i) => i !== idx));
        setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDeleteImage = async (imageId: number) => {
        if (!editingIdFromUrl) return;
        await axios.delete(`${API}/api/assets/${editingIdFromUrl}/images/${imageId}`);
        const { data: images } = await axios.get(`${API}/api/assets/${editingIdFromUrl}/images`);
        setExistingImages(images);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            const payload: any = {
                name, type, propertyId: parseInt(propertyId), category, subCategory,
                supplierName, assetCode, purchaseDate, purchaseValue, depreciationPercentage,
                longDescription, remarks, active, department,
                assignedUserId: assignedUserId ? parseInt(assignedUserId) : null,
                assetCondition, weight, dimensions, installationDate,
                softwareName, license, expiryDate, credentials,
                rentalUnit, availability, deposit
            };

            let savedId: number;

            if (editingIdFromUrl) {
                await axios.put(`${API}/api/assets/${editingIdFromUrl}`, payload);
                savedId = Number(editingIdFromUrl);
                toast.success("Asset updated successfully");
            } else {
                const { data } = await axios.post(`${API}/api/assets`, payload);
                savedId = data.id;
                toast.success("Asset created successfully");
            }

            if (invoiceFile) {
                const invForm = new FormData();
                invForm.append('file', invoiceFile);
                await axios.post(`${API}/api/assets/${savedId}/invoice`, invForm, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            for (const file of pendingFiles) {
                const form = new FormData();
                form.append('file', file);
                await axios.post(`${API}/api/assets/${savedId}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
            }

            navigate('/assets/list');
        } catch (err) {
            console.error(err);
            toast.error("An error occurred while saving the asset.");
        } finally {
            setUploading(false);
        }
    };

    const filteredSubCategories = category ? subCategories.filter(s => {
        const cat = categories.find(c => c.prefValue === category);
        return cat && s.parentId === cat.id;
    }) : [];

    return (
        <div className="page-container fade-in" style={{ paddingBottom: '3rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={24} style={{ color: 'var(--primary)' }} />
                    {editingIdFromUrl ? 'Edit Asset' : 'Add New Asset'}
                </h2>
                <button className="btn" onClick={() => navigate('/assets/list')} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    Cancel
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Core Header Section */}
                <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 3', marginBottom: 0 }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--bg-main)', color: 'var(--primary)' }}>Core Information</h3>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Asset Name <span style={{ color: 'red' }}>*</span></label>
                        <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Dell XPS 15" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Asset Code</label>
                        <input className="form-input" value={assetCode} onChange={e => setAssetCode(e.target.value)} placeholder="Auto-generated if left blank" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Asset Type <span style={{ color: 'red' }}>*</span></label>
                        <select className="form-input" value={type} onChange={e => setType(e.target.value)} required style={{ border: '2px solid var(--primary)', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <option value="">Select Asset Workflow...</option>
                            <option value="Physical">Physical (Hardware/Machinery)</option>
                            <option value="Digital">Digital (Software/Licenses)</option>
                            <option value="Rental">Rental (Leased Items)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign to Property <span style={{ color: 'red' }}>*</span></label>
                        <select className="form-input" value={propertyId} onChange={e => setPropertyId(e.target.value)} required>
                            <option value="">Select an operating property...</option>
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category <span style={{ color: 'red' }}>*</span></label>
                        <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} required>
                            <option value="">Select a main category...</option>
                            {categories.map(c => <option key={c.id} value={c.prefValue}>{c.prefValue}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Subcategory</label>
                        <select className="form-input" value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!category}>
                            <option value="">{category ? 'Select subcategory...' : 'Select a category first'}</option>
                            {filteredSubCategories.map(s => <option key={s.id} value={s.prefValue}>{s.prefValue}</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Asset Status:</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }}>{active ? 'Active & Operational' : 'Inactive / Decommissioned'}</span>
                        </label>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 3' }}>
                        <label className="form-label">General Description</label>
                        <textarea className="form-input" value={longDescription} onChange={e => setLongDescription(e.target.value)} rows={3} placeholder="Detailed summary of the asset..." />
                    </div>
                </div>

                {/* Conditional Fields based on Asset Type */}
                {type && (
                    <div className="card fade-in" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} /> {type} Specific Properties
                            </h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {type === 'Physical' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Asset Condition</label>
                                        <select className="form-input" value={assetCondition} onChange={e => setAssetCondition(e.target.value)}>
                                            <option value="">Select condition...</option>
                                            <option value="New">New</option>
                                            <option value="Good">Good</option>
                                            <option value="Fair">Fair</option>
                                            <option value="Poor">Poor</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Installation Date</label>
                                        <input className="form-input" type="date" value={installationDate} onChange={e => setInstallationDate(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Weight (kg)</label>
                                        <input className="form-input" type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dimensions (L x W x H)</label>
                                        <input className="form-input" type="text" value={dimensions} onChange={e => setDimensions(e.target.value)} placeholder="e.g. 10x20x15 cm" />
                                    </div>
                                </>
                            )}

                            {type === 'Digital' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Software / Platform Name</label>
                                        <input className="form-input" type="text" value={softwareName} onChange={e => setSoftwareName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">License Key / ID</label>
                                        <input className="form-input" type="text" value={license} onChange={e => setLicense(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Expiry Date</label>
                                        <input className="form-input" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Access Credentials / URL</label>
                                        <input className="form-input" type="text" value={credentials} onChange={e => setCredentials(e.target.value)} placeholder="Store securely..." />
                                    </div>
                                </>
                            )}

                            {type === 'Rental' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Rental Pricing Unit</label>
                                        <select className="form-input" value={rentalUnit} onChange={e => setRentalUnit(e.target.value)}>
                                            <option value="">Select unit...</option>
                                            <option value="Per Hour">Per Hour</option>
                                            <option value="Per Day">Per Day</option>
                                            <option value="Per Month">Per Month</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Security Deposit</label>
                                        <input className="form-input" type="number" step="0.1" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="৳" />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 600 }}>Rental Availability:</span>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={availability} onChange={e => setAvailability(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
                                            <span style={{ color: availability ? 'var(--primary)' : 'var(--warning)' }}>{availability ? 'Available for Rent' : 'Currently Rented / Unavailable'}</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Financial & Support Section */}
                <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--bg-main)', color: 'var(--primary)' }}>Financial & Support details</h3>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Purchase Date</label>
                        <input className="form-input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cost / Purchase Value</label>
                        <input className="form-input" type="number" step="0.01" value={purchaseValue} onChange={e => setPurchaseValue(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Vendor / Supplier</label>
                        <input className="form-input" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Depreciation% / Year (Automatic calc reference)</label>
                        <input className="form-input" type="number" step="0.1" value={depreciationPercentage} onChange={e => setDepreciationPercentage(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Additional Remarks / Notes</label>
                        <textarea className="form-input" value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} />
                    </div>
                </div>

                {/* Key Personnel */}
                <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--bg-main)', color: 'var(--primary)' }}>Key Personnel</h3>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assigned To (Admin/Engineer)</label>
                        <select className="form-input" value={assignedUserId} onChange={e => setAssignedUserId(e.target.value)}>
                            <option value="">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department / Branch</label>
                        <input className="form-input" type="text" value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. IT Department" />
                    </div>
                </div>

                {/* Documents Section */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--bg-main)', color: 'var(--primary)' }}>Documents & Media</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="form-group">
                            <label className="form-label">Invoice Upload (PDF/IMG)</label>
                            <input className="form-input" type="file" onChange={e => setInvoiceFile(e.target.files?.[0] || null)} style={{ padding: '0.6rem' }} />
                            {invoiceFile && <small style={{ color: 'var(--primary)', marginTop: '4px', display: 'block' }}>Ready to upload: {invoiceFile.name}</small>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Image size={16} /> Asset Photos (auto-compressed to &lt;1MB)
                            </label>
                            <input className="form-input" type="file" accept="image/*" multiple onChange={handleFileSelect} style={{ padding: '0.6rem' }} />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        {pendingPreviews.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <small style={{ color: 'var(--text-muted)' }}>Pending Upload:</small>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                                    {pendingPreviews.map((src, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={src} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--primary)' }} />
                                            <button type="button" onClick={() => removePending(idx)} style={{ position: 'absolute', top: -8, right: -8, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {editingIdFromUrl && existingImages.length > 0 && (
                            <div>
                                <small style={{ color: 'var(--text-muted)' }}>Previously Uploaded:</small>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
                                    {existingImages.map(img => (
                                        <div key={img.id} style={{ position: 'relative' }}>
                                            <img src={`${img.imageData}`} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--border)', cursor: 'pointer' }} onClick={() => setLightboxSrc(`${img.imageData}`)} />
                                            <button type="button" onClick={() => handleDeleteImage(img.id)} style={{ position: 'absolute', top: -8, right: -8, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ position: 'sticky', bottom: '1rem', background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', gap: '1rem', border: '1px solid var(--border)', zIndex: 100 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, fontSize: '1.1rem', padding: '0.8rem' }} disabled={uploading || !type}>
                        {uploading ? 'Processing & Saving...' : (editingIdFromUrl ? 'Update Asset Core & Properties' : 'Create New Dynamic Asset')}
                    </button>
                </div>
            </form>

            {lightboxSrc && (
                <div onClick={() => setLightboxSrc(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxSrc} alt="Full view" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                </div>
            )}
        </div>
    );
};

export default AssetAdd;
