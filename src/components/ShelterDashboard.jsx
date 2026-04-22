import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
    LayoutDashboard, ClipboardList, TrendingUp, Settings as SettingsIcon, 
    LogOut, Loader2, Heart, PawPrint, MessageSquare
} from 'lucide-react';

import Login from './Login';
import PetInventory from './PetInventory';
import Applications from './Applications';
import Campaigns from './Campaigns';
import Settings from './Settings';
import ClientChat from './ClientChat';

const SidebarItem = ({ icon: Icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            isActive 
                ? 'bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
        <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
        <span className="text-sm">{label}</span>
    </button>
);

const ShelterDashboard = () => {
    const [session, setSession] = useState(null);
    const [shelterData, setShelterData] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchShelterProfile(session.user.id);
            else setIsInitializing(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchShelterProfile(session.user.id);
            else setShelterData(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchShelterProfile = async (userId) => {
        const { data } = await supabase
            .from('shelter_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (data) setShelterData(data);
        setIsInitializing(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    if (isInitializing) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                <h2 className="text-lg font-medium text-slate-600 animate-pulse">Initializing Workspace...</h2>
            </div>
        );
    }

    if (!session) {
        return <Login onLoginSuccess={(user) => fetchShelterProfile(user.id)} />;
    }

    if (session && !shelterData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-soft border border-slate-100 text-center">
                    <Heart className="w-16 h-16 text-brand-200 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to PetPals!</h2>
                    <p className="text-slate-500 mb-8">Your account is active, but we need to set up your Shelter profile in the database.</p>
                    <button onClick={handleLogout} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors">
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    const navigation = [
        { id: 'inventory', label: 'Pet Management', icon: PawPrint },
        { id: 'applications', label: 'Adoption Applications', icon: ClipboardList },
        { id: 'campaigns', label: 'Fundraising & Campaigns', icon: TrendingUp },
        { id: 'chat', label: 'Client Chat', icon: MessageSquare },
        { id: 'settings', label: 'Shelter Settings', icon: SettingsIcon },
    ];

    const currentTabLabel = navigation.find(n => n.id === activeTab)?.label || 'Dashboard';

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Overview */}
            <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-20">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex flex-col items-center justify-center shadow-soft">
                            <span className="text-white font-bold text-lg leading-none">P</span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                            PetPals <span className="text-brand-500 font-semibold text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-brand-50 ml-1">OS</span>
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-slate-500 pl-11 truncate">{shelterData.org_name || 'My Shelter'}</p>
                </div>

                <div className="px-4 py-2 flex-1 overflow-y-auto space-y-1">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-4 px-2">Core Workflow</div>
                    {navigation.slice(0, 4).map(item => (
                        <SidebarItem key={item.id} icon={item.icon} label={item.label} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
                    ))}
                    
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 mt-8 px-2">Management</div>
                    {navigation.slice(4).map(item => (
                        <SidebarItem key={item.id} icon={item.icon} label={item.label} isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} />
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-[280px] flex flex-col h-screen">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 sticky top-0 z-10 shrink-0 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800">{currentTabLabel}</h2>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200">
                            {(shelterData.org_name || 'S').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        {activeTab === 'inventory' && <PetInventory shelterId={shelterData.shelter_id} />}
                        {activeTab === 'applications' && <Applications shelterId={shelterData.shelter_id} />}
                        {activeTab === 'campaigns' && <Campaigns shelterId={shelterData.shelter_id} />}
                        {activeTab === 'chat' && <ClientChat shelterId={shelterData.shelter_id} />}
                        {activeTab === 'settings' && <Settings shelterData={shelterData} setShelterData={setShelterData} />}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ShelterDashboard;
