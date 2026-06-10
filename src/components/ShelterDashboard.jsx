import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PetPalsBrand } from '@petpals/theme/PetPalsLogo.jsx'
import MeshBackground from '@petpals/theme/MeshBackground.jsx';
import ThemeToggle from '@petpals/theme/ThemeToggle.jsx';
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
        className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 ${
            isActive ? 'pp-nav-active' : 'pp-nav-idle'
        }`}
    >
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-500' : 'opacity-60'}`} />
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
            <div className="relative flex min-h-screen flex-col items-center justify-center">
                <MeshBackground />
                <Loader2 className="relative z-10 mb-4 h-10 w-10 animate-spin text-brand-500" />
                <h2 className="relative z-10 animate-pulse text-lg font-medium text-[var(--pp-text-muted)]">Initializing workspace…</h2>
            </div>
        );
    }

    if (!session) {
        return <Login onLoginSuccess={(user) => fetchShelterProfile(user.id)} />;
    }

    if (session && !shelterData) {
        return (
            <div className="relative flex min-h-screen items-center justify-center p-8">
                <MeshBackground />
                <div className="pp-card relative z-10 max-w-md w-full p-8 text-center">
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
        <div className="pp-app-frame text-[var(--pp-text-primary)]">
            <MeshBackground />
            <aside className="pp-sidebar pp-sidebar--panel flex flex-col">
                <div className="border-b border-[var(--pp-card-border)] p-6">
                    <PetPalsBrand logoSize="md" badge="Shelter" />
                    <p className="mt-3 truncate text-sm font-medium text-[var(--pp-text-secondary)]">{shelterData.org_name || 'My Shelter'}</p>
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

                <div className="border-t border-[var(--pp-card-border)] p-4">
                    <button onClick={handleLogout} className="pp-nav-idle flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold hover:!bg-red-500/10 hover:!text-red-500">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="pp-main-area flex flex-1 flex-col">
                <header className="pp-header pp-header--float flex shrink-0 items-center">
                    <h2 className="text-lg font-semibold">{currentTabLabel}</h2>
                    <div className="ml-auto flex items-center gap-4">
                        <ThemeToggle />
                        <div className="pp-liquid-glass pp-liquid-glass--pill pp-liquid-glass--resting flex h-8 w-8 items-center justify-center text-sm font-bold">
                            {(shelterData.org_name || 'S').charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="pp-content-scroll flex-1 px-4 pb-6 md:px-6">
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
