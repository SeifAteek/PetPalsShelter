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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                <CheckCircle2 className="w-4 h-4" /> Approved
            </span>
        );
        if (status === 'Rejected') return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                <XCircle className="w-4 h-4" /> Rejected
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-4 h-4" /> Under Review
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Adoption Applications</h2>
                <p className="text-slate-500 mt-1">Review and manage incoming applications for your pets.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden mt-6">
                    {applications.length === 0 ? (
                        <div className="p-12 text-center border-dashed border-2 border-slate-100 m-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-slate-800">No applications found</h3>
                            <p className="text-slate-500 mt-2">Applications for your available pets will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {applications.map((app) => (
                                <div key={app.application_id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-shrink-0 relative">
                                        {app.pet?.avatar_url ? (
                                            <img src={app.pet.avatar_url} alt={app.pet?.name} className="w-16 h-16 rounded-xl object-cover shadow-sm bg-slate-100" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Star className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                                            <h4 className="text-lg font-bold text-slate-900">
                                                Application for {app.pet?.name || 'Unknown Pet'}
                                            </h4>
                                            {getStatusBadge(app.status)}
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">Applicant:</span> {app.adopter?.user_name || 'Unknown'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 text-tangerine-500" />
                                                <span className="font-medium">Match Score:</span>
                                                {app.match_score != null
                                                    ? <span className="font-bold text-slate-800">{app.match_score}%</span>
                                                    : <span className="text-slate-400 italic text-sm">Not scored</span>
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {app.status === 'Under Review' && (
                                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                                            <button
                                                onClick={() => handleUpdateStatus(app.application_id, app.pet_id, 'Rejected')}
                                                className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold rounded-xl transition-colors shadow-sm"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(app.application_id, app.pet_id, 'Approved')}
                                                className="flex-1 md:flex-none px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 font-semibold rounded-xl transition-colors shadow-sm"
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
