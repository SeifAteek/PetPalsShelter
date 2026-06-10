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
        if (status === 'Available') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (status === 'Sick') return 'bg-tangerine-50 text-tangerine-700 border-tangerine-200';
        if (status === 'Adopted') return 'bg-brand-50 text-brand-700 border-brand-200';
        if (status === 'Archived') return 'bg-slate-100 text-slate-500 border-slate-200';
        return 'bg-slate-50 text-slate-700 border-slate-200';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Pet Inventory</h2>
                    <p className="text-slate-500 mt-1">Manage animals currently under your organization's care.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowArchived(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium text-sm border ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Archive className="w-4 h-4" />
                        {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
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
                        <div key={pet.pet_id} className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden group">
                            <div className={`aspect-[4/3] bg-slate-100 relative overflow-hidden ${pet.status === 'Archived' ? 'opacity-60 grayscale' : ''}`}>
                                {pet.avatar_url ? (
                                    <img src={pet.avatar_url} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Upload className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 flex gap-1.5">
                                    {pet.status !== 'Archived' && (
                                        <button onClick={() => openEditModal(pet)} className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-brand-600 shadow-sm" title="Edit">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {pet.status !== 'Archived' ? (
                                        <button onClick={() => { if (window.confirm(`Archive ${pet.name}? They won't appear in adoptions.`)) handleArchivePet(pet.pet_id); }} className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-red-600 shadow-sm" title="Archive">
                                            <Archive className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => handleRestorePet(pet.pet_id)} className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-600 hover:text-emerald-600 shadow-sm" title="Restore">
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 truncate pr-2">{pet.name}</h3>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(pet.status)}`}>
                                        {getStatusIcon(pet.status)}
                                        {pet.status}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 font-medium mb-3">
                                    {pet.breed} • {pet.age} yrs
                                </p>
                                <div className="text-sm text-slate-600 line-clamp-2">
                                    {pet.medical_history || 'No medical history recorded.'}
                                </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingPet ? 'Edit Pet Details' : 'Add New Pet'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Photo Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pet Photo</label>
                                    <div className="flex items-center gap-4">
                                        {formData.avatar_url && (
                                            <img src={formData.avatar_url} alt="Preview" className="w-20 h-20 rounded-xl object-cover shadow-sm bg-slate-100" />
                                        )}
                                        <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl px-6 py-4 flex flex-col items-center justify-center hover:border-brand-500 hover:bg-brand-50 transition-colors w-full">
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
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                                        <input
                                            type="text" required
                                            value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Species</label>
                                        <select
                                            value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                        >
                                            <option value="Dog">Dog</option>
                                            <option value="Cat">Cat</option>
                                            <option value="Bird">Bird</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Breed</label>
                                        <input
                                            type="text"
                                            value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Age (Years)</label>
                                        <input
                                            type="number" min="0" step="1"
                                            value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
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
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Medical History & Notes</label>
                                    <textarea
                                        rows="3"
                                        value={formData.medical_history} onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={uploadingImage}
                                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
