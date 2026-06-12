import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Send, UserCircle2, Info, Search, MessageSquare } from 'lucide-react';

const ClientChat = ({ shelterId }) => {
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [clients, setClients] = useState([]);
    const [filteredClients, setFilteredClients] = useState([]);
    const [activeClient, setActiveClient] = useState(null);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Function to fetch clients
    const fetchClients = async () => {
        if (!shelterId) return;
        
        // 1. Get clients from applications (joined via pets)
        const { data: appsData, error: appsError } = await supabase
            .from('applications')
            .select(`
                adopter_profiles (
                    user_id,
                    profiles (
                        user_name
                    )
                ),
                pets!inner (
                    shelter_id
                )
            `)
            .eq('pets.shelter_id', shelterId);

        // 2. Get clients from messages AND their most recent message time
        const { data: msgsData, error: msgsError } = await supabase
            .from('messages')
            .select('client_id, created_at')
            .eq('shelter_id', shelterId)
            .order('created_at', { ascending: false });

        const uniqueClientsMap = new Map();

        // Track the latest message time for each client
        const latestMessageTimeMap = new Map();
        if (!msgsError && msgsData) {
            msgsData.forEach(msg => {
                if (!latestMessageTimeMap.has(msg.client_id)) {
                    latestMessageTimeMap.set(msg.client_id, msg.created_at);
                }
            });
        }

        // Process applications first (default sorting)
        if (!appsError && appsData) {
            appsData.forEach(app => {
                const profile = app.adopter_profiles?.profiles;
                const userId = app.adopter_profiles?.user_id;
                if (userId && profile) {
                    uniqueClientsMap.set(userId, {
                        user_id: userId,
                        user_name: profile.user_name,
                        last_message_at: latestMessageTimeMap.get(userId) || '1970-01-01'
                    });
                }
            });
        }

        // Process messages (to catch people who haven't applied yet, or get their names)
        if (!msgsError && msgsData) {
            // We need to fetch names for these message-only clients
            const uniqueMsgUserIds = [...new Set(msgsData.map(m => m.client_id))].filter(id => !uniqueClientsMap.has(id));
            if (uniqueMsgUserIds.length > 0) {
                const { data: profData } = await supabase
                    .from('profiles')
                    .select('user_id, user_name')
                    .in('user_id', uniqueMsgUserIds);
                
                if (profData) {
                    profData.forEach(p => {
                        uniqueClientsMap.set(p.user_id, {
                            user_id: p.user_id,
                            user_name: p.user_name,
                            last_message_at: latestMessageTimeMap.get(p.user_id)
                        });
                    });
                }
            }
        }
        
        // Sort by most recent message first, then alphabetically
        const sortedProfiles = Array.from(uniqueClientsMap.values());
        sortedProfiles.sort((a, b) => {
            const timeA = new Date(a.last_message_at).getTime();
            const timeB = new Date(b.last_message_at).getTime();
            if (timeB !== timeA) return timeB - timeA;
            return (a.user_name || '').localeCompare(b.user_name || '');
        });
        
        setClients(sortedProfiles);
        setFilteredClients(sortedProfiles);
        
        // Only auto-select if we don't already have an active client selected
        if (sortedProfiles.length > 0 && !activeClient) {
            setActiveClient(sortedProfiles[0]);
        }
    };

    useEffect(() => {
        fetchClients();

        // Global listener: If ANY new message arrives for this shelter, refresh the SIDEBAR
        // This ensures new users pop up instantly without refresh
        const sidebarChannel = supabase
            .channel('sidebar-refresh')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `shelter_id=eq.${shelterId}` 
            }, () => {
                fetchClients(); // Refresh client list
            })
            .subscribe();

        return () => {
            supabase.removeChannel(sidebarChannel);
        };
    }, [shelterId]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredClients(clients);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        setFilteredClients(clients.filter(c => c.user_name && c.user_name.toLowerCase().includes(lowerQ)));
    }, [searchQuery, clients]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!activeClient || !shelterId) return;
            setIsLoadingMessages(true);
            
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('shelter_id', shelterId) 
                .eq('client_id', activeClient.user_id)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data || []);
            }
            setIsLoadingMessages(false);
        };

        fetchMessages();

        // Chat listener: If a message is for the ACTIVE client, update the CHAT WINDOW
        const chatChannel = supabase
            .channel(`chat-window-${activeClient?.user_id}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `shelter_id=eq.${shelterId}` 
            }, (payload) => {
                const newMessage = payload.new;
                if (newMessage.client_id === activeClient?.user_id) {
                    setMessages(prev => {
                        if (prev.some(m => m.message_id === newMessage.message_id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
        };
    }, [activeClient, shelterId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !activeClient || !shelterId) return;

        const newMessageText = chatInput;
        setChatInput('');

        // Send using the dedicated shelter_id column
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                shelter_id: shelterId,
                client_id: activeClient.user_id,
                text: newMessageText,
                sender: 'Shelter'
            }])
            .select();

        if (!error && data) {
            setMessages(prev => [...prev, data[0]]);
        }
    };

    return (
        <div className="flex w-full pp-card overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
            {/* Sidebar: Client List */}
            <div className="w-1/3 max-w-sm border-r border-[var(--pp-card-border)] bg-[var(--pp-bg)] flex flex-col">
                <div className="p-5 border-b border-[var(--pp-card-border)]">
                    <h3 className="text-lg font-bold text-[var(--pp-text-primary)] mb-4">Messages</h3>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[var(--pp-text-muted)]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search applicants..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-[var(--pp-input-bg)] border border-[var(--pp-input-border)] rounded-lg text-sm text-[var(--pp-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--pp-primary)]/20 focus:border-[var(--pp-primary)]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredClients.length === 0 ? (
                        <div className="p-4 text-center text-sm text-[var(--pp-text-muted)]">
                            {searchQuery ? 'No matching applicants found.' : 'No applicants found.'}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredClients.map(client => (
                                <div
                                    key={client.user_id}
                                    onClick={() => setActiveClient(client)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                        activeClient?.user_id === client.user_id
                                            ? 'bg-[var(--pp-primary)]/10 border border-[var(--pp-primary)]/20 shadow-sm'
                                            : 'hover:bg-[var(--pp-card-bg)] border border-transparent'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeClient?.user_id === client.user_id ? 'bg-[var(--pp-primary)]/20 text-[var(--pp-primary)]' : 'bg-[var(--pp-card-bg)] text-[var(--pp-text-secondary)]'}`}>
                                        <UserCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className={`font-semibold truncate text-sm ${activeClient?.user_id === client.user_id ? 'text-[var(--pp-primary)]' : 'text-[var(--pp-text-primary)]'}`}>
                                            {client.user_name}
                                        </p>
                                        <p className="text-xs text-[var(--pp-text-muted)] truncate">Tap to open chat</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Chat Window */}
            <div className="flex-1 flex flex-col bg-[var(--pp-card-bg)]">
                {activeClient ? (
                    <>
                        <div className="p-5 border-b border-[var(--pp-card-border)] flex justify-between items-center bg-[var(--pp-card-bg)] z-10 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[var(--pp-bg)] text-[var(--pp-text-secondary)] rounded-full flex items-center justify-center">
                                    <UserCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[var(--pp-text-primary)] leading-tight">{activeClient.user_name}</h3>
                                    <p className="text-xs font-medium text-[var(--pp-primary)] flex items-center gap-1"><Info className="w-3 h-3"/> Active Applicant</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[var(--pp-bg)] relative">
                            {isLoadingMessages ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-[var(--pp-bg)]/50 backdrop-blur-[1px]">
                                    <div className="animate-spin w-6 h-6 border-2 border-[var(--pp-primary)]/30 border-t-[var(--pp-primary)] rounded-full"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--pp-text-muted)] space-y-3">
                                    <MessageSquare className="w-12 h-12 text-[var(--pp-text-muted)] opacity-50" />
                                    <p className="text-sm font-medium">No messages yet. Message {activeClient.user_name}!</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isShelter = msg.sender === 'Shelter';
                                    const showTime = true;
                                    return (
                                        <div key={msg.message_id || i} className={`flex ${isShelter ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] sm:max-w-md flex flex-col ${isShelter ? 'items-end' : 'items-start'}`}>
                                                <div className={`px-5 py-3 shadow-sm text-sm ${
                                                    isShelter
                                                        ? 'bg-[var(--pp-primary)] text-white rounded-2xl rounded-tr-sm'
                                                        : 'bg-[var(--pp-card-bg)] border border-[var(--pp-card-border)] text-[var(--pp-text-primary)] rounded-2xl rounded-tl-sm'
                                                }`}>
                                                    <p className="leading-relaxed">{msg.text}</p>
                                                </div>
                                                {showTime && (
                                                    <p className="text-[10px] font-medium text-[var(--pp-text-muted)] mt-1.5 px-1">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} className="h-1" />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--pp-card-border)] bg-[var(--pp-card-bg)]">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={`Message ${activeClient.user_name}...`}
                                    className="w-full pl-5 pr-14 py-3.5 bg-[var(--pp-input-bg)] border border-[var(--pp-input-border)] rounded-full text-sm text-[var(--pp-text-primary)] outline-none focus:ring-2 focus:ring-[var(--pp-primary)]/20 focus:border-[var(--pp-primary)] focus:bg-[var(--pp-card-bg)] transition-all shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--pp-primary)] hover:opacity-90 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4 -mr-0.5" />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[var(--pp-bg)] text-[var(--pp-text-muted)]">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-semibold">Select an applicant conversation to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientChat;
