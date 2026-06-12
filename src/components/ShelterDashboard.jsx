import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { PetPalsBrand } from '@petpals/theme/PetPalsLogo.jsx'
import MeshBackground from '@petpals/theme/MeshBackground.jsx';
import ThemeToggle from '@petpals/theme/ThemeToggle.jsx';
import { 
    LayoutDashboard, ClipboardList, TrendingUp, Settings as SettingsIcon, 
    LogOut, Loader2, Heart, PawPrint, MessageSquare, ChevronLeft, ChevronRight as ChevronRightIcon, Cat
} from 'lucide-react';

const BRAND  = 'var(--pp-primary)';
const NAVY = 'var(--pp-text-primary)';
const BG   = 'var(--pp-bg)';

const sidebarBase = {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 40,
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--pp-sidebar-bg)',
    borderRight: '1px solid var(--pp-card-border)',
    boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'width 0.2s ease',
};

const SIDEBAR_W_EXPANDED = 240;
const SIDEBAR_W_COLLAPSED = 72;

import Login from './Login';
import PetInventory from './PetInventory';
import Applications from './Applications';
import Campaigns from './Campaigns';
import Settings from './Settings';
import ClientChat from './ClientChat';

const SidebarItem = ({ icon: Icon, label, isActive, collapsed, onClick }) => (
    <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '10px 0' : '10px 12px',
            margin: '0 8px 2px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.12s, color 0.12s',
            fontWeight: isActive ? 700 : 500,
            fontSize: 13,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            background: isActive ? BRAND : 'transparent',
            color: isActive ? '#FFFFFF' : 'var(--pp-text-secondary)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: 'calc(100% - 16px)'
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--pp-bg)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
        <Icon style={{ width: 18, height: 18, color: isActive ? '#FFFFFF' : BRAND, flexShrink: 0 }} />
        {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
    </button>
);

const ShelterDashboard = () => {
    const [session, setSession] = useState(null);
    const [shelterData, setShelterData] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const [isInitializing, setIsInitializing] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const sidebarW = sidebarCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

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
            <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: 40, height: 40, color: BRAND, animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <p style={{ color: 'var(--pp-text-muted)', fontWeight: 500 }}>Initializing workspace…</p>
            </div>
        );
    }

    if (!session) {
        return <Login onLoginSuccess={(user) => fetchShelterProfile(user.id)} />;
    }

    if (session && !shelterData) {
        return (
            <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <div style={{ background: 'var(--pp-card-bg)', borderRadius: 24, border: '1px solid var(--pp-card-border)', boxShadow: 'var(--pp-shadow-floating)', padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--pp-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Heart style={{ width: 32, height: 32, color: BRAND }} />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Welcome to PetPals</h2>
                    <p style={{ color: 'var(--pp-text-muted)', marginBottom: 24 }}>Your account is active, but we need to set up your Shelter profile in the database.</p>
                    <button onClick={handleLogout} style={{ background: 'var(--pp-bg)', border: '1px solid var(--pp-card-border)', borderRadius: 12, padding: '10px 20px', fontWeight: 600, color: NAVY, cursor: 'pointer', width: '100%' }}>
                        Sign out
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
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: BG }}>
            {/* Sidebar */}
            <aside
                style={{ ...sidebarBase, width: sidebarW }}
                aria-label="Main navigation"
            >
                <div style={{ padding: sidebarCollapsed ? '20px 0' : '20px 16px', display: 'flex', flexDirection: sidebarCollapsed ? 'column' : 'row', gap: sidebarCollapsed ? 12 : 0, alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--pp-card-border)', flexShrink: 0 }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                            <PetPalsBrand logoSize="lg" />
                            <span style={{ fontSize: 16, fontWeight: 800, color: BRAND, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>Shelter App</span>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Heart style={{ width: 18, height: 18, color: '#fff' }} />
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(c => !c)}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--pp-input-border)', background: 'var(--pp-input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: sidebarCollapsed ? 0 : 'auto', color: 'var(--pp-text-muted)' }}
                    >
                        {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
                    {!sidebarCollapsed && <div style={{ padding: '0 24px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--pp-text-muted)', marginBottom: 8 }}>Core Workflow</div>}
                    {navigation.slice(0, 4).map(item => (
                        <SidebarItem key={item.id} {...item} isActive={activeTab === item.id} collapsed={sidebarCollapsed} onClick={() => setActiveTab(item.id)} />
                    ))}
                    {!sidebarCollapsed && <div style={{ padding: '0 24px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--pp-text-muted)', marginTop: 24, marginBottom: 8 }}>Management</div>}
                    {navigation.slice(4).map(item => (
                        <SidebarItem key={item.id} {...item} isActive={activeTab === item.id} collapsed={sidebarCollapsed} onClick={() => setActiveTab(item.id)} />
                    ))}
                </div>

                <div style={{ padding: '8px', borderTop: '1px solid var(--pp-card-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
                            <span style={{ fontSize: 12, color: 'var(--pp-text-muted)', fontWeight: 500, flex: 1 }}>Theme</span>
                            <ThemeToggle />
                        </div>
                    )}

                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', gap: 12, padding: '10px 12px', background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', borderRadius: 8 }}>
                        <LogOut style={{ width: 18, height: 18 }} />
                        {!sidebarCollapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Log out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, marginLeft: sidebarW, transition: 'margin-left 0.2s ease', height: '100vh', overflowY: 'auto' }}>
                {/* Top bar */}
                <header
                    role="banner"
                    style={{
                        position: 'sticky', top: 0, zIndex: 30,
                        height: 60, minHeight: 60,
                        background: 'var(--pp-header-bg)',
                        borderBottom: '1px solid var(--pp-card-border)',
                        display: 'flex', alignItems: 'center',
                        padding: '0 24px', gap: 14,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                >
                    {navigation.find(n => n.id === activeTab)?.icon && React.createElement(navigation.find(n => n.id === activeTab).icon, { style: { width: 18, height: 18, color: BRAND, flexShrink: 0 }, "aria-hidden": "true" })}
                    <h1
                        style={{ fontSize: 15, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', margin: 0 }}
                        id="page-title"
                    >
                        {currentTabLabel}
                    </h1>
                    <div style={{ flex: 1 }} />
                    <span
                        style={{ fontSize: 11, fontWeight: 700, background: 'var(--pp-primary-light)', color: 'var(--pp-primary)', padding: '3px 10px', borderRadius: 99, letterSpacing: '0.03em', opacity: 0.8 }}
                        aria-label="Shelter is live"
                    >
                        LIVE
                    </span>
                    {/* Shelter avatar */}
                    <div
                        title={shelterData.org_name}
                        aria-label={`Shelter: ${shelterData.org_name}`}
                        style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: BRAND,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
                        }}
                    >
                        {(shelterData.org_name || 'S').charAt(0).toUpperCase()}
                    </div>
                </header>

                {/* Hero bar */}
                <div
                    role="region"
                    aria-label="Shelter hero"
                    style={{
                        background: BRAND,
                        padding: '20px 28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexShrink: 0
                    }}
                >
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', margin: 0 }}>
                            PetPals Shelter
                        </p>
                        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: '4px 0 2px' }}>
                            {shelterData.org_name || 'My Shelter'}
                        </h2>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                            {currentTabLabel}
                        </p>
                    </div>
                    <Cat style={{ width: 56, height: 56, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} aria-hidden="true" />
                </div>

                <div style={{ flex: 1, padding: '24px 32px' }}>
                    <div style={{ width: '100%', height: '100%' }}>
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
