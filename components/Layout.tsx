import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chatbot } from './Chatbot';
import { Taxometer } from './Taxometer';
import { CommandPalette } from './CommandPalette';
import { IncomeItem, TaxResult, TaxPayer } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    incomes?: IncomeItem[];
    taxResult?: TaxResult | null;
    taxPayer?: TaxPayer;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, incomes = [], taxResult = null, taxPayer }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const html = document.documentElement;
        html.classList.add('dark');
    }, [theme]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { path: '/', label: 'Setup', icon: 'settings_account_box', gradient: 'from-violet-500 to-purple-500' },
        { path: '/income', label: 'Income', icon: 'payments', gradient: 'from-cyan-500 to-blue-500' },
        { path: '/deductions', label: 'Deductions', icon: 'receipt_long', gradient: 'from-emerald-500 to-teal-500' },
        { path: '/summary', label: 'Summary', icon: 'analytics', gradient: 'from-pink-500 to-rose-500' },
        { path: '/documents', label: 'Documents', icon: 'folder_open', gradient: 'from-amber-500 to-orange-500' },
    ];

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="orb w-[600px] h-[600px] bg-primary/20 -top-48 -left-48 animate-float" />
                <div className="orb w-[500px] h-[500px] bg-accent-cyan/15 top-1/3 -right-32 animate-float-slow" />
                <div className="orb w-[400px] h-[400px] bg-accent-pink/15 -bottom-32 left-1/3 animate-float-slower" />
            </div>

            {/* Grid pattern overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                     linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Top Header */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'glass shadow-lg shadow-black/20'
                        : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="h-20 flex items-center justify-between">
                        {/* Logo */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/')}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent-cyan rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                                <div className="relative bg-gradient-to-br from-primary to-accent-cyan p-2.5 rounded-xl shadow-glow">
                                    <span className="material-symbols-outlined text-white text-2xl">monitoring</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-display font-bold text-xl tracking-tight text-white">
                                    TaxTracker
                                </span>
                                <span className="font-display font-bold text-xl tracking-tight text-gradient ml-1">
                                    Pro
                                </span>
                            </div>
                        </motion.div>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center">
                            <div className="flex items-center gap-1 p-1.5 rounded-2xl glass-light">
                                {navItems.map((item) => (
                                    <motion.button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                                            isActive(item.path)
                                                ? 'text-white'
                                                : 'text-zinc-400 hover:text-white'
                                        }`}
                                    >
                                        {isActive(item.path) && (
                                            <motion.div
                                                layoutId="nav-pill"
                                                className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl shadow-glow-sm`}
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        <span className={`material-symbols-outlined text-[18px] relative z-10 ${isActive(item.path) ? 'filled' : ''}`}>
                                            {item.icon}
                                        </span>
                                        <span className="relative z-10">{item.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {/* Taxometer */}
                            {taxResult && location.pathname !== '/' && (
                                <div className="hidden xl:block">
                                    <Taxometer refund={taxResult.refund || 0} amountDue={taxResult.amountDue || 0} />
                                </div>
                            )}

                            {/* Search Button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsCommandPaletteOpen(true)}
                                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl glass-light text-sm text-zinc-400 hover:text-white transition-colors group"
                            >
                                <span className="material-symbols-outlined text-[18px] group-hover:text-primary transition-colors">search</span>
                                <span className="text-zinc-500">Search...</span>
                                <kbd className="ml-2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-500">
                                    Ctrl K
                                </kbd>
                            </motion.button>

                            {/* Theme Toggle */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl glass-light text-zinc-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined">
                                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                                </span>
                            </motion.button>

                            {/* User Avatar */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative group cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent-cyan to-accent-pink rounded-full blur opacity-50 group-hover:opacity-80 transition-opacity" />
                                <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary via-accent-cyan to-accent-pink p-[2px]">
                                    <div className="h-full w-full rounded-full bg-surface-900 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">
                                            {taxPayer?.firstName?.[0] || 'J'}{taxPayer?.lastName?.[0] || 'D'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div className="lg:hidden border-t border-white/5">
                    <div className="flex overflow-x-auto p-2 gap-1 scrollbar-hide">
                        {navItems.map((item) => (
                            <motion.button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                whileTap={{ scale: 0.95 }}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                                    isActive(item.path)
                                        ? 'text-white'
                                        : 'text-zinc-400'
                                }`}
                            >
                                {isActive(item.path) && (
                                    <motion.div
                                        layoutId="mobile-nav-pill"
                                        className={`absolute inset-0 bg-gradient-to-r ${item.gradient} rounded-xl`}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`material-symbols-outlined text-[16px] relative z-10 ${isActive(item.path) ? 'filled' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="relative z-10">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-12 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <span className="material-symbols-outlined text-[16px]">security</span>
                            <span>Bank-level encryption</span>
                            <span className="mx-2">|</span>
                            <span className="material-symbols-outlined text-[16px]">verified_user</span>
                            <span>IRS Authorized</span>
                        </div>
                        <div className="text-sm text-zinc-600">
                            2025 TaxTracker Pro. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>

            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
            <Chatbot incomes={incomes} taxResult={taxResult} taxPayer={taxPayer} />
        </div>
    );
};

export default Layout;
