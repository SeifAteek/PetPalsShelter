import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Loader2, TrendingUp, DollarSign, Target, X, Trash2, CheckCircle2, Clock } from 'lucide-react';

const Campaigns = ({ shelterId }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        goal_amount: '',
        end_date: ''
    });

    useEffect(() => {
        fetchCampaigns();
    }, [shelterId]);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('shelter_id', shelterId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            alert('Failed to load campaigns.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCampaign = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                shelter_id: shelterId,
                title: formData.title,
                goal_amount: parseFloat(formData.goal_amount),
                current_amount: 0,
            };
            if (formData.end_date) payload.end_date = new Date(formData.end_date).toISOString();

            const { error } = await supabase.from('campaigns').insert([payload]);
            if (error) throw error;

            setIsModalOpen(false);
            setFormData({ title: '', goal_amount: '', end_date: '' });
            fetchCampaigns();
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Failed to create campaign.');
        }
    };

    const handleDeleteCampaign = async (campaignId) => {
        if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
        try {
            const { error } = await supabase.from('campaigns').delete().eq('campaign_id', campaignId);
            if (error) throw error;
            fetchCampaigns();
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Failed to delete campaign.');
        }
    };

    const getCampaignStatus = (campaign) => {
        const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
        if (progress >= 100) return { label: 'Goal Reached', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
        if (campaign.end_date && new Date(campaign.end_date) < new Date()) return { label: 'Ended', color: 'text-slate-600 bg-slate-100 border-slate-200', icon: Clock };
        return { label: 'Active', color: 'text-brand-700 bg-brand-50 border-brand-200', icon: TrendingUp };
    };

    const calculateProgress = (current, goal) => {
        if (!goal || goal === 0) return 0;
        const percentage = (current / goal) * 100;
        return percentage > 100 ? 100 : percentage;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Fundraising & Campaigns</h2>
                    <p className="text-slate-500 mt-1">Manage donation goals to support your shelter.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    New Campaign
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {campaigns.map((campaign) => {
                        const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
                        const { label: statusLabel, color: statusColor, icon: StatusIcon } = getCampaignStatus(campaign);

                        return (
                            <div key={campaign.campaign_id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-tangerine-50 flex items-center justify-center text-tangerine-500">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{campaign.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${statusColor}`}>
                                                    <StatusIcon className="w-3 h-3" />{statusLabel}
                                                </span>
                                                {campaign.end_date && (
                                                    <span className="text-xs text-slate-400">
                                                        ends {new Date(campaign.end_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCampaign(campaign.campaign_id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete campaign"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500 mb-1">Raised</p>
                                            <div className="flex items-baseline gap-1">
                                                <DollarSign className="w-5 h-5 text-slate-800" />
                                                <span className="text-2xl font-bold text-slate-800">
                                                    {(campaign.current_amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-500 mb-1">Goal</p>
                                            <div className="flex items-baseline gap-1 text-slate-600 font-medium">
                                                <span>/</span>
                                                <Target className="w-4 h-4 text-slate-400" />
                                                <span>{(campaign.goal_amount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative pt-2">
                                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100">
                                            <div
                                                style={{ width: `${progress}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-1000 ease-out relative"
                                            >
                                                {progress >= 100 && (
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs font-semibold text-slate-500 mt-2">
                                            <span>{progress.toFixed(1)}% Completed</span>
                                            {progress >= 100 && <span className="text-brand-600">Goal Reached!</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {campaigns.length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100 border-dashed">
                            <h3 className="text-lg font-semibold text-slate-800">No active campaigns</h3>
                            <p className="text-slate-500 mt-2">Create a fundraising goal to start receiving donations.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">Create New Campaign</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateCampaign} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Campaign Title</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g., Winter Medical Fund"
                                        value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Goal Amount (EGP)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="number" required min="1" step="0.01"
                                            placeholder="5000"
                                            value={formData.goal_amount} onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Date <span className="font-normal text-slate-400">(optional)</span></label>
                                    <input
                                        type="date"
                                        value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors shadow-sm"
                                    >
                                        Create Goal
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

export default Campaigns;
