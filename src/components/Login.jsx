import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Heart, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else if (data.user) {
            onLoginSuccess(data.user);
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        setError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
        if (error) {
            setError(error.message);
        } else {
            setResetSent(true);
        }
        setResetLoading(false);
    };

    return (
        <div className="min-h-screen bg-white flex mt-0 text-slate-800">
            {/* Left Side: Brand Story */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-900/40 mix-blend-multiply z-0"></div>
                {/* Abstract Pattern / Deco */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl z-0"></div>
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl z-0"></div>

                <div className="relative z-10 p-16 flex flex-col h-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-2xl leading-none">P</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            PetPals <span className="text-brand-300">Shelter OS</span>
                        </h1>
                    </div>

                    <div className="max-w-lg mt-20">
                        <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                            The intelligent operating system for modern animal shelters.
                        </h2>
                        <ul className="space-y-6 text-slate-300">
                            <li className="flex items-start gap-4">
                                <Heart className="w-6 h-6 text-brand-400 shrink-0" />
                                <span><strong className="text-white">Pet Adoptions.</strong> Seamless applications, status tracking and match insights.</span>
                            </li>
                            <li className="flex items-start gap-4">
                                <ShieldCheck className="w-6 h-6 text-brand-400 shrink-0" />
                                <span><strong className="text-white">Secure Records.</strong> Bank-level encryption for all medical and organizational data.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16">
                <div className="w-full max-w-md">
                    {!showReset ? (
                        <>
                            <div className="mb-10 text-center lg:text-left">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
                                <p className="text-slate-500">Sign in to your shelter portal to continue.</p>
                            </div>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100 flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Work Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors" placeholder="contact@shelter.org" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors" placeholder="••••••••" />
                                </div>
                                <div className="flex items-center justify-end">
                                    <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setError(null); }} className="text-sm font-medium text-brand-600 hover:text-brand-500">
                                        Forgot password?
                                    </button>
                                </div>
                                <button type="submit" disabled={loading} className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? 'Authenticating...' : 'Sign In'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <button onClick={() => { setShowReset(false); setResetSent(false); setError(null); }} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-8 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Back to sign in
                            </button>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset password</h2>
                                <p className="text-slate-500">Enter your email and we'll send a reset link.</p>
                            </div>
                            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}
                            {resetSent ? (
                                <div className="bg-emerald-50 text-emerald-700 p-5 rounded-xl border border-emerald-200 font-semibold text-sm">
                                    ✓ Reset link sent to <strong>{resetEmail}</strong>. Check your inbox.
                                </div>
                            ) : (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                                            <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors" placeholder="contact@shelter.org" />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={resetLoading} className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all disabled:opacity-50">
                                        {resetLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
