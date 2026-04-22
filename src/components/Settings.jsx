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

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
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
            
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative max-w-5xl">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        Shelter Profile
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Manage your organization's identity and certification details.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 shrink-0 outline-none focus:ring-2 focus:ring-brand-500/50"
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
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                            <label className="block text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <HeartHandshake className="w-4 h-4 text-slate-400" />
                                Shelter Logo
                            </label>

                            <label
                                htmlFor="logo-upload"
                                className="relative group w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer shadow-sm"
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain p-6 bg-white" />
                                ) : (
                                    <div className="text-center p-6 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                                            <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 mb-1 group-hover:text-brand-700 transition-colors">Click to Upload</p>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <span className="text-white font-bold text-sm bg-brand-600 px-5 py-2.5 rounded-full shadow-sm">Change Image</span>
                                </div>

                                <input
                                    id="logo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs font-medium text-slate-500 text-center mt-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                Supported formats: PNG, JPG, SVG.<br/> Recommended size: 512x512px.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.org_name}
                                    onChange={(e) => setFormData({...formData, org_name: e.target.value})}
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium text-slate-900 text-base transition-all"
                                    placeholder="Enter your shelter's official name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                    License Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.license_number}
                                    onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                                    className="w-full px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium text-slate-900 text-base transition-all"
                                    placeholder="e.g. SHELTER-12345"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm opacity-60">
                             <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <SettingsIcon className="w-4 h-4 text-slate-400" />
                                Preferences
                            </h4>
                            <p className="text-sm text-slate-500 font-medium">Notification and display preferences will be available in the next update.</p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
