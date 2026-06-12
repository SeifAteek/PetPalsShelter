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
        if (!shelterId) return;
        fetchCampaigns();

        const channel = supabase.channel('campaigns_rt')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `shelter_id=eq.${shelterId}` }, () => fetchCampaigns())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchCampaigns())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [shelterId]);

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const { data: camps, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('shelter_id', shelterId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            const campaignsData = camps || [];
            
            if (campaignsData.length > 0) {
                const campaignIds = campaignsData.map(c => c.campaign_id);
                const { data: donations } = await supabase
                    .from('donations')
                    .select('campaign_id, amount')
                    .in('campaign_id', campaignIds);
                
                const donMap = {};
                (donations || []).forEach(d => {
                    if (d.campaign_id) {
                        donMap[d.campaign_id] = (donMap[d.campaign_id] || 0) + Number(d.amount || 0);
                    }
                });
                
                campaignsData.forEach(c => {
                    const actualDonations = donMap[c.campaign_id] || 0;
                    // Use actual donations if available, fallback to current_amount if donMap is empty (legacy data)
                    c.current_amount = actualDonations > 0 ? actualDonations : (c.current_amount || 0);
                });
            }

            setCampaigns(campaignsData);
        } catch (error) {
            console.error('Error fetching campaigns:', error);
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
            const { error } = await supabase
                .from('campaigns')
                .update({ is_deleted: true })
                .eq('campaign_id', campaignId);
            if (error) throw error;
            fetchCampaigns();
        } catch (error) {
            console.error('Error deleting campaign:', error);
            alert('Failed to delete campaign.');
        }
    };

    const getCampaignStatus = (campaign) => {
        const progress = calculateProgress(campaign.current_amount, campaign.goal_amount);
        if (progress >= 100) return { label: 'Goal Reached', style: { background: '#16A34A', color: '#FFFFFF', border: '1.5px solid #15803D' }, icon: CheckCircle2 };
        if (campaign.end_date && new Date(campaign.end_date) < new Date()) return { label: 'Ended', style: { background: '#6B7280', color: '#FFFFFF', border: '1.5px solid #4B5563' }, icon: Clock };
        return { label: 'Active', style: { background: '#FFB27D', color: '#1A110B', border: '1.5px solid #E07830' }, icon: TrendingUp };
    };

    const calculateProgress = (current, goal) => {
        if (!goal || goal === 0) return 0;
        const percentage = (current / goal) * 100;
        return percentage > 100 ? 100 : percentage;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[var(--pp-text-primary)] flex items-center gap-2">
                        Fundraising & Campaigns
                    </h3>
                    <p className="text-sm text-[var(--pp-text-secondary)] mt-1">Manage donation goals to support your shelter.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
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
                        const { label: statusLabel, style: statusColor, icon: StatusIcon } = getCampaignStatus(campaign);

                        return (
                            <div key={campaign.campaign_id} className="pp-card p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--pp-primary)]/10 flex items-center justify-center text-[var(--pp-primary)]">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--pp-text-primary)]">{campaign.title}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, ...statusColor }}>
                                                    <StatusIcon style={{ width: 12, height: 12 }} />{statusLabel}
                                                </span>
                                                {campaign.end_date && (
                                                    <span className="text-xs text-[var(--pp-text-muted)]">
                                                        ends {new Date(campaign.end_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCampaign(campaign.campaign_id)}
                                        className="p-2 text-[var(--pp-text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete campaign"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--pp-text-secondary)] mb-1">Raised</p>
                                            <div className="flex items-baseline gap-1">
                                                <DollarSign className="w-5 h-5 text-[var(--pp-text-primary)]" />
                                                <span className="text-2xl font-bold text-[var(--pp-text-primary)]">
                                                    {(campaign.current_amount || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-[var(--pp-text-secondary)] mb-1">Goal</p>
                                            <div className="flex items-baseline gap-1 text-[var(--pp-text-secondary)] font-medium">
                                                <span>/</span>
                                                <Target className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                                <span>{(campaign.goal_amount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative pt-2">
                                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-[var(--pp-bg)] border border-[var(--pp-card-border)]">
                                            <div
                                                style={{ width: `${progress}%` }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[var(--pp-primary)] transition-all duration-1000 ease-out relative"
                                            >
                                                {progress >= 100 && (
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-xs font-semibold text-[var(--pp-text-secondary)] mt-2">
                                            <span>{progress.toFixed(1)}% Completed</span>
                                            {progress >= 100 && <span className="text-[var(--pp-primary)]">Goal Reached!</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {campaigns.length === 0 && (
                        <div className="col-span-full py-16 text-center pp-card border-dashed">
                            <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]">No active campaigns</h3>
                            <p className="text-[var(--pp-text-secondary)] mt-2">Create a fundraising goal to start receiving donations.</p>
                        </div>
                    )}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity">
                    <div className="pp-card max-w-md w-full shadow-2xl">
                        <div className="p-6 border-b border-[var(--pp-card-border)] flex justify-between items-center bg-[var(--pp-bg)]">
                            <h3 className="text-xl font-bold text-[var(--pp-text-primary)]">Create New Campaign</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--pp-text-muted)] hover:text-[var(--pp-text-primary)]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateCampaign} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Campaign Title</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g., Winter Medical Fund"
                                        value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-[var(--pp-primary)]/50 focus:border-[var(--pp-primary)] bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">Goal Amount (EGP)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                        </div>
                                        <input
                                            type="number" required min="1" step="0.01"
                                            placeholder="5000"
                                            value={formData.goal_amount} onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-[var(--pp-primary)]/50 focus:border-[var(--pp-primary)] bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[var(--pp-text-primary)] mb-2">End Date <span className="font-normal text-[var(--pp-text-muted)]">(optional)</span></label>
                                    <input
                                        type="date"
                                        value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-[var(--pp-input-border)] rounded-xl focus:ring-2 focus:ring-[var(--pp-primary)]/50 focus:border-[var(--pp-primary)] bg-[var(--pp-input-bg)] text-[var(--pp-text-primary)]"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--pp-card-border)]">
                                    <button
                                        type="button" onClick={() => setIsModalOpen(false)}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
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
