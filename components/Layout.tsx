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
            <header className="sticky top-0 z-50 glass shadow-[var(--shadow-sm)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                            <span className="material-symbols-outlined text-white dark:text-neutral-900 text-[18px]">grid_view</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
                            TaxTracker<span className="text-neutral-400 dark:text-neutral-500 font-medium text-sm ml-1">Pro</span>
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isActive(item.path) ? 'filled' : ''}`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        {/* Command Palette Button */}
                        <button
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[16px]">search</span>
                            <kbd className="text-xs font-mono">⌘K</kbd>
                        </button>

                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-background-light dark:hover:bg-neutral-800 transition-colors text-text-muted hover:text-primary">
                            <span className="material-symbols-outlined">
                                {theme === 'light' ? 'dark_mode' : 'light_mode'}
                            </span>
                        </button>
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {taxPayer?.firstName?.[0] || 'J'}{taxPayer?.lastName?.[0] || 'D'}
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
            </header>

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
