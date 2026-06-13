import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Upload, Building2, MapPin, Phone, Settings as SettingsIcon, Save, HeartHandshake, ShieldCheck } from 'lucide-react';

const Settings = ({ shelterData, setShelterData }) => {
    const [formData, setFormData] = useState({ org_name: '', license_number: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Logo Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (shelterData) {
            setFormData({
                org_name: shelterData.org_name || '',
                license_number: shelterData.license_number || ''
            });
            // Assume shelter_profiles can also store a logo_url just like clinic_profiles
            setPreviewUrl(shelterData.logo_url || null);
        }
    }, [shelterData]);

    const handleLogoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsSaving(true);
        setMessage('');

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${shelterData.shelter_id}.${fileExt}`;
            const filePath = `shelter_assets/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('pet_files')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from('pet_files')
                .getPublicUrl(filePath);

            const finalLogoUrl = urlData.publicUrl;

            const { data, error } = await supabase
                .from('shelter_profiles')
                .update({
                    logo_url: finalLogoUrl
                })
                .eq('shelter_id', shelterData.shelter_id)
                .select();

            if (error) throw error;

            setMessage('Logo updated successfully!');
            setPreviewUrl(finalLogoUrl);
            setSelectedFile(null);
            setShelterData(data[0] || { ...shelterData, logo_url: finalLogoUrl });

            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            let finalLogoUrl = previewUrl;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `logo-${shelterData.shelter_id}.${fileExt}`;
                const filePath = `shelter_assets/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('pet_files')
                    .upload(filePath, selectedFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('pet_files')
                    .getPublicUrl(filePath);

                finalLogoUrl = urlData.publicUrl;
            }

            const { data, error } = await supabase
                .from('shelter_profiles')
                .update({
                    ...formData,
                    logo_url: finalLogoUrl
                })
                .eq('shelter_id', shelterData.shelter_id)
                .select();

            if (error) throw error;

            setMessage('Settings updated successfully!');
            setShelterData(data[0] || { ...shelterData, ...formData, logo_url: finalLogoUrl });
            
            // Auto hide message and reload page after a short delay
            setTimeout(() => {
                setMessage('');
                window.location.reload();
            }, 500);
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative w-full">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[var(--pp-text-primary)] flex items-center gap-2">
                        Shelter Profile
                    </h3>
                    <p className="text-sm text-[var(--pp-text-secondary)] mt-1">Manage your organization's identity and certification details.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-4 mb-6 rounded-xl font-semibold text-sm animate-in fade-in flex items-center shadow-sm border ${message.includes('Error') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {message}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 pb-8">
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Logo Branding */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="pp-card p-6">
                            <label className="block text-sm font-bold text-[var(--pp-text-primary)] mb-4 flex items-center gap-2">
                                <HeartHandshake className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                Shelter Logo
                            </label>

                            <label
                                htmlFor="logo-upload"
                                className="relative group w-full aspect-square bg-[var(--pp-bg)] rounded-2xl border-2 border-dashed border-[var(--pp-card-border)] flex flex-col items-center justify-center overflow-hidden hover:border-[var(--pp-primary)] transition-all cursor-pointer shadow-sm"
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain p-6 bg-[var(--pp-bg)]" />
                                ) : (
                                    <div className="text-center p-6 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-[var(--pp-card-bg)] rounded-full shadow-sm flex items-center justify-center mb-4 border border-[var(--pp-card-border)]">
                                            <Upload className="w-6 h-6 text-[var(--pp-text-muted)] group-hover:text-[var(--pp-primary)] transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-[var(--pp-text-secondary)] mb-1 group-hover:text-[var(--pp-primary)] transition-colors">Click to Upload</p>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <span className="text-white font-bold text-sm bg-[var(--pp-primary)] px-5 py-2.5 rounded-full shadow-sm">Change Image</span>
                                </div>

                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs font-medium text-[var(--pp-text-muted)] text-center mt-4 bg-[var(--pp-bg)] p-3 rounded-lg border border-[var(--pp-card-border)]">
                                Supported formats: PNG, JPG, SVG.<br/> Recommended size: 512x512px.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="pp-card p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--pp-text-secondary)] mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.org_name}
                                    onChange={(e) => setFormData({...formData, org_name: e.target.value})}
                                    className="w-full px-4 py-3.5 rounded-xl bg-[var(--pp-input-bg)] border border-[var(--pp-input-border)] focus:ring-2 focus:ring-[var(--pp-primary)]/20 focus:border-[var(--pp-primary)] outline-none font-medium text-[var(--pp-text-primary)] text-base transition-all"
                                    placeholder="Enter your shelter's official name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--pp-text-secondary)] mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                    License Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                                    className="w-full px-4 py-3.5 rounded-xl bg-[var(--pp-input-bg)] border border-[var(--pp-input-border)] focus:ring-2 focus:ring-[var(--pp-primary)]/20 focus:border-[var(--pp-primary)] outline-none font-medium text-[var(--pp-text-primary)] text-base transition-all"
                                    placeholder="e.g. SHELTER-12345"
                                />
                            </div>
                        </div>

                        <div className="bg-[var(--pp-bg)] border border-[var(--pp-card-border)] rounded-2xl p-6 shadow-sm opacity-60">
                             <h4 className="text-sm font-bold text-[var(--pp-text-primary)] mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                Preferences
                            </h4>
                            <p className="text-sm text-[var(--pp-text-secondary)] font-medium">Notification and display preferences will be available in the next update.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
