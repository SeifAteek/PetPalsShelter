import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, XCircle, Clock, Loader2, Star, User } from 'lucide-react';

const Applications = ({ shelterId }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApplications();
    }, [shelterId]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            if (!shelterId) return;

            // Fetch applications for pets that belong to this shelter
            // Correction: Joint path applications -> pets AND applications -> adopter_profiles -> profiles
            const { data, error } = await supabase
                .from('applications')
                .select(`
                    *,
                    pet:pets!inner(pet_id, shelter_id, name, avatar_url, breed),
                    adopter_profiles!inner(
                        user_id,
                        profiles(user_name)
                    )
                `)
                .eq('pets.shelter_id', shelterId)
                .order('submission_date', { ascending: false });

            if (error) throw error;

            // Flatten the data for easier UI consumption: adopter: { user_name: ... }
            const flattenedData = data.map(app => ({
                ...app,
                adopter: {
                    user_name: app.adopter_profiles?.profiles?.user_name || 'Unknown Adopter'
                }
            }));

            setApplications(flattenedData);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (applicationId, petId, newStatus) => {
        try {
            // Update application status
            const { error: updateAppError } = await supabase
                .from('applications')
                .update({ status: newStatus })
                .eq('application_id', applicationId);

            if (updateAppError) throw updateAppError;

            // If approved, update pet status to Adopted
            if (newStatus === 'Approved') {
                const { error: updatePetError } = await supabase
                    .from('pets')
                    .update({ status: 'Adopted' })
                    .eq('pet_id', petId);

                if (updatePetError) throw updatePetError;
            }

            // Refresh the list
            fetchApplications();
        } catch (error) {
            console.error('Error updating application status:', error);
            alert('Failed to update application status.');
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Approved') return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: '#16A34A', color: '#FFFFFF', border: '1.5px solid #15803D' }}>
                <CheckCircle2 style={{ width: 14, height: 14 }} /> Approved
            </span>
        );
        if (status === 'Rejected') return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: '#DC2626', color: '#FFFFFF', border: '1.5px solid #B91C1C' }}>
                <XCircle style={{ width: 14, height: 14 }} /> Rejected
            </span>
        );
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 700, background: '#D97706', color: '#FFFFFF', border: '1.5px solid #B45309' }}>
                <Clock style={{ width: 14, height: 14 }} /> Under Review
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h3 className="text-xl font-bold text-[var(--pp-text-primary)] flex items-center gap-2">
                        Adoption Applications
                    </h3>
                    <p className="text-sm text-[var(--pp-text-secondary)] mt-1">Review and manage incoming applications for your pets.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            ) : (
                <div className="pp-card overflow-hidden mt-6">
                    {applications.length === 0 ? (
                        <div className="p-12 text-center border-dashed border-2 border-[var(--pp-card-border)] m-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-[var(--pp-text-primary)]">No applications found</h3>
                            <p className="text-[var(--pp-text-secondary)] mt-2">Applications for your available pets will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--pp-card-border)]">
                            {applications.map((app) => (
                                <div key={app.application_id} className="p-6 hover:bg-[var(--pp-bg)] transition-colors flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-shrink-0 relative">
                                        {app.pet?.avatar_url ? (
                                            <img src={app.pet.avatar_url} alt={app.pet?.name} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-[var(--pp-bg)]" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-[var(--pp-bg)] flex items-center justify-center text-[var(--pp-text-muted)]">
                                                <Star className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                                            <h4 className="text-lg font-bold text-[var(--pp-text-primary)]">
                                                Application for {app.pet?.name || 'Unknown Pet'}
                                            </h4>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--pp-text-secondary)]">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-[var(--pp-text-muted)]" />
                                                <span className="font-medium">Applicant:</span> {app.adopter?.user_name || 'Unknown'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-tangerine-500" />
                                                <span className="font-medium">Match Score:</span>
                                                {app.match_score != null
                                                    ? <span className="font-bold text-[var(--pp-text-primary)]">{app.match_score}%</span>
                                                    : <span className="text-[var(--pp-text-muted)] italic text-sm">Not scored</span>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {app.status === 'Under Review' && (
                                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                            <button
                                                onClick={() => handleUpdateStatus(app.application_id, app.pet_id, 'Rejected')}
                                                className="flex-1 md:flex-none btn-secondary !border-red-200 !text-red-600 hover:!bg-red-50 hover:!border-red-300"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(app.application_id, app.pet_id, 'Approved')}
                                                className="flex-1 md:flex-none btn-primary"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Applications;
