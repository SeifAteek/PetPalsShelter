import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit2, Loader2, Upload, X, ShieldAlert, CheckCircle2, HeartPulse, Archive, RotateCcw } from 'lucide-react';

const PetInventory = ({ shelterId }) => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPet, setEditingPet] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        species: 'Dog',
        breed: '',
        age: '',
        status: 'Available',
        medical_history: '',
        avatar_url: ''
    });

    useEffect(() => {
        fetchPets();
    }, [shelterId, showArchived]);

    const handleArchivePet = async (petId) => {
        try {
            const { error } = await supabase
                .from('pets')
                .update({ status: 'Archived' })
                .eq('pet_id', petId);
            if (error) throw error;
            fetchPets();
        } catch (error) {
            console.error('Error archiving pet:', error);
            alert('Failed to archive pet.');
        }
    };

    const handleRestorePet = async (petId) => {
        try {
            const { error } = await supabase
                .from('pets')
                .update({ status: 'Available' })
                .eq('pet_id', petId);
            if (error) throw error;
            fetchPets();
        } catch (error) {
            console.error('Error restoring pet:', error);
            alert('Failed to restore pet.');
        }
    };

    const fetchPets = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('pets')
                .select('*')
                .eq('shelter_id', shelterId)
                .order('created_at', { ascending: false });

            if (!showArchived) {
                query = query.neq('status', 'Archived');
            }

            const { data, error } = await query;
            if (error) throw error;
            setPets(data || []);
        } catch (error) {
            console.error('Error fetching pets:', error);
            alert('Failed to load pets.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (event) => {
        try {
            setUploadingImage(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${shelterId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('pet_files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('pet_files')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const petPayload = {
                shelter_id: shelterId,
                name: formData.name,
                species: formData.species,
                breed: formData.breed,
                age: formData.age ? parseInt(formData.age, 10) : null,
                status: formData.status,
                medical_history: formData.medical_history,
                avatar_url: formData.avatar_url
            };

            if (editingPet) {
                const { error } = await supabase
                    .from('pets')
                    .update(petPayload)
                    .eq('pet_id', editingPet.pet_id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('pets')
                    .insert([petPayload]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            setEditingPet(null);
            fetchPets();
        } catch (error) {
            console.error('Error saving pet:', error);
            alert('Failed to save pet details.');
        }
    };

    const openEditModal = (pet) => {
        setEditingPet(pet);
        setFormData({
            name: pet.name || '',
            species: pet.species || 'Dog',
            breed: pet.breed || '',
            age: pet.age || '',
            status: pet.status || 'Available',
            medical_history: pet.medical_history || '',
            avatar_url: pet.avatar_url || ''
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingPet(null);
        setFormData({
            name: '', species: 'Dog', breed: '', age: '', status: 'Available', medical_history: '', avatar_url: ''
        });
        setIsModalOpen(true);
    };

    const getStatusIcon = (status) => {
        if (status === 'Available') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
        if (status === 'Sick') return <HeartPulse className="w-4 h-4 text-tangerine-500" />;
        if (status === 'Adopted') return <ShieldAlert className="w-4 h-4 text-brand-500" />;
        if (status === 'Archived') return <Archive className="w-4 h-4 text-slate-400" />;
        return null;
    };

    const getStatusColor = (status) => {
        if (status === 'Available') return 'available-badge';
        if (status === 'Sick') return 'sick-badge';
        if (status === 'Adopted') return 'adopted-badge';
        if (status === 'Archived') return 'archived-badge';
        return 'default-badge';
    };

    const getStatusStyle = (status) => {
        if (status === 'Available') return { background: '#16A34A', color: '#FFFFFF', border: '1.5px solid #15803D' };
        if (status === 'Sick') return { background: '#D97706', color: '#FFFFFF', border: '1.5px solid #B45309' };
        if (status === 'Adopted') return { background: '#FFB27D', color: '#1A110B', border: '1.5px solid #E07830' };
        if (status === 'Archived') return { background: '#6B7280', color: '#FFFFFF', border: '1.5px solid #4B5563' };
        return { background: '#6B7280', color: '#FFFFFF', border: '1.5px solid #4B5563' };
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[var(--pp-text-primary)] flex items-center gap-2">
                        Pet Inventory
                    </h3>
                    <p className="text-sm text-[var(--pp-text-secondary)] mt-1">Manage animals currently under your organization's care.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${showArchived ? 'bg-[var(--pp-text-primary)] text-[var(--pp-bg)] rounded-[var(--pp-radius-sm)]' : 'btn-secondary'}`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </button>
                    <button
                        onClick={openAddModal}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Pet
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pets.map((pet) => (
                        <div key={pet.pet_id} className="pp-card overflow-hidden group" style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(255,178,125,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
                        >
                            {/* Pet Image */}
                            <div className={`relative overflow-hidden ${pet.status === 'Archived' ? 'opacity-60 grayscale' : ''}`} style={{ aspectRatio: '4/3' }}>
                                {pet.avatar_url ? (
                                    <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'var(--pp-bg)' }}>
                                        <Upload style={{ width: 32, height: 32, color: 'var(--pp-text-muted)' }} />
                                        <span style={{ fontSize: 12, color: 'var(--pp-text-muted)', fontWeight: 500 }}>No photo</span>
                                    </div>
                                )}
                                {/* Gradient overlay for actions */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none' }} />
                                {/* Status badge on image */}
                                <div style={{ position: 'absolute', top: 10, left: 10 }}>
                                    <span
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: 5,
                                            padding: '4px 10px', borderRadius: 9999,
                                            fontSize: 11, fontWeight: 700,
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                            ...getStatusStyle(pet.status)
                                        }}
                                    >
                                        {getStatusIcon(pet.status)}
                                        {pet.status}
                                    </span>
                                </div>
                                {/* Action buttons — always visible, high-contrast */}
                                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
                                    {pet.status !== 'Archived' && (
                                        <button
                                            onClick={() => openEditModal(pet)}
                                            title="Edit pet"
                                            aria-label={`Edit ${pet.name}`}
                                            style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: '#FFFFFF', border: '2px solid rgba(255,178,125,0.6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                transition: 'background 0.15s, transform 0.15s', color: '#E07830'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#FFB27D'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.querySelector('svg').style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.querySelector('svg').style.color = '#E07830'; }}
                                        >
                                            <Edit2 style={{ width: 15, height: 15 }} />
                                        </button>
                                    )}
                                    {pet.status !== 'Archived' ? (
                                        <button
                                            onClick={() => { if (window.confirm(`Archive ${pet.name}? They won't appear in adoptions.`)) handleArchivePet(pet.pet_id); }}
                                            title="Archive pet"
                                            aria-label={`Archive ${pet.name}`}
                                            style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: '#FFFFFF', border: '2px solid rgba(239,68,68,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                transition: 'background 0.15s, transform 0.15s', color: '#DC2626'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.querySelector('svg').style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.querySelector('svg').style.color = '#DC2626'; }}
                                        >
                                            <Archive style={{ width: 15, height: 15 }} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRestorePet(pet.pet_id)}
                                            title="Restore pet"
                                            aria-label={`Restore ${pet.name}`}
                                            style={{
                                                width: 34, height: 34, borderRadius: '50%',
                                                background: '#FFFFFF', border: '2px solid rgba(16,185,129,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                                                transition: 'background 0.15s, transform 0.15s', color: '#059669'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.querySelector('svg').style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.querySelector('svg').style.color = '#059669'; }}
                                        >
                                            <RotateCcw style={{ width: 15, height: 15 }} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pet Details */}
                            <div style={{ padding: '16px 18px 18px' }}>
                                <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--pp-text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{pet.name}</h3>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pp-primary)', margin: '0 0 10px' }}>
                                    {pet.species} · {pet.breed}
                                    {pet.age ? <span style={{ color: 'var(--pp-text-secondary)', fontWeight: 500 }}> · {pet.age} yrs</span> : null}
                                </p>
                                <p style={{ fontSize: 12, color: 'var(--pp-text-secondary)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {pet.medical_history || 'No medical history recorded.'}
                                </p>
                            </div>
                        </div>
                    ))}
                    {pets.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                            <h3 className="text-lg font-semibold text-slate-800">No pets found</h3>
                            <p className="text-slate-500 mt-2">Start by adding a new pet to your inventory.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
                    <div className="pp-card max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-[var(--pp-card-border)] flex justify-between items-center bg-[var(--pp-bg)]">
                            <h3 className="text-xl font-bold text-[var(--pp-text-primary)]">
                                {editingPet ? 'Edit Pet Details' : 'Add New Pet'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Photo Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Pet Photo</label>
                                    <div className="flex items-center gap-4">
                                        {formData.avatar_url && (
                                            <img src={formData.avatar_url} alt="Preview" className="w-20 h-20 rounded-xl object-cover shadow-sm bg-[var(--pp-bg)]" />
                                        )}
                                        <label className="cursor-pointer border-2 border-dashed border-[var(--pp-card-border)] rounded-xl px-6 py-4 flex flex-col items-center justify-center hover:border-brand-500 hover:bg-[var(--pp-bg)] transition-colors w-full">
                                            {uploadingImage ? (
                                                <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                                            ) : (
                                                <>
                                                    <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                                    <span className="text-sm text-slate-600 font-medium">Click to upload photo</span>
                                                </>
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Name</label>
                                        <input
                                            type="text" required
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Species</label>
                                        <select
                                            value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                            className="w-full px-4 py-2 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                        >
                                            <option value="Dog">Dog</option>
                                            <option value="Cat">Cat</option>
                                            <option value="Bird">Bird</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Breed</label>
                                        <input
                                            type="text"
                                            value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                            className="w-full px-4 py-2 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Age (Years)</label>
                                        <input
                                            type="number" min="0" step="1"
                                            value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full px-4 py-2 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Status</label>
                                    <div className="flex gap-4">
                                        {['Available', 'Sick', 'Adopted', 'Recovery'].map((status) => (
                                            <label key={status} className="flex flex-1 items-center justify-center">
                                                <input
                                                    type="radio" name="status" value={status}
                                                    checked={formData.status === status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="peer hidden"
                                                />
                                                <div className="w-full text-center px-4 py-3 border border-slate-200 rounded-xl cursor-pointer font-medium text-slate-600 peer-checked:bg-brand-50 peer-checked:border-brand-500 peer-checked:text-brand-700 transition-colors">
                                                    {status}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Medical History & Notes</label>
                                    <textarea
                                        rows="3"
                                        value={formData.medical_history} onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                        className="w-full px-4 py-2 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--pp-card-border)]">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={uploadingImage}
                                        className="btn-primary disabled:opacity-50"
                                    >
                                        {editingPet ? 'Update Pet' : 'Save Pet'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PetInventory;
