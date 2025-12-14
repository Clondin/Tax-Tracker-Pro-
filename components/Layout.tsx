import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

    // Ensure dark mode class is applied to html element
    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    }, [theme]);

    // Cmd+K listener
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
        { path: '/', label: 'Setup', icon: 'settings_account_box' },
        { path: '/income', label: 'Income', icon: 'attach_money' },
        { path: '/deductions', label: 'Deductions', icon: 'receipt_long' },
        { path: '/summary', label: 'Summary', icon: 'assessment' },
        { path: '/documents', label: 'Documents', icon: 'folder_open' },
    ];

    return (
        <div className="min-h-screen flex flex-col font-display bg-background-light dark:bg-background-dark text-text-main dark:text-white transition-colors duration-200">
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
                                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Taxometer */}
                        {taxResult && location.pathname !== '/' && (
                            <div className="hidden lg:block">
                                <Taxometer refund={taxResult.refund || 0} amountDue={taxResult.amountDue || 0} />
                            </div>
                        )}

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
                <div className="md:hidden overflow-x-auto border-t border-border-light dark:border-border-dark bg-background-light dark:bg-neutral-900 scrollbar-hide">
                    <div className="flex p-2 gap-2 min-w-max">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive(item.path)
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                    : 'text-text-muted hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
            <Chatbot incomes={incomes} taxResult={taxResult} taxPayer={taxPayer} />
        </div>
    );
};

export default Layout;