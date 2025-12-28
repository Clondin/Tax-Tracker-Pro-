import React, { useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme, IncomeItem, TaxResult, TaxPayer } from '../types';
import {
    SunIcon,
    MoonIcon,
    GearIcon,
    FileTextIcon,
    PieChartIcon,
    RocketIcon,
    DashboardIcon,
    MagnifyingGlassIcon,
} from '@radix-ui/react-icons';
import { Button } from './ui/button';
import { Chatbot } from './Chatbot';
import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
    theme: Theme;
    toggleTheme: () => void;
    incomes?: IncomeItem[];
    taxResult?: TaxResult | null;
    taxPayer?: TaxPayer;
}

const NAV_ITEMS = [
    { path: '/summary', label: 'Overview', icon: DashboardIcon },
    { path: '/income', label: 'Wages', icon: RocketIcon },
    { path: '/deductions', label: 'Savings', icon: PieChartIcon },
    { path: '/documents', label: 'Vault', icon: FileTextIcon },
    { path: '/', label: 'Account', icon: GearIcon },
];

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, incomes = [], taxResult, taxPayer }) => {
    const location = useLocation();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    const getPageTitle = () => {
        const item = NAV_ITEMS.find(n => n.path === location.pathname);
        return item?.label || 'Console';
    };

    return (
        <div className="min-h-screen bg-background font-sans antialiased text-foreground flex overflow-hidden">
            {/* Premium Sidebar */}
            <aside className="relative flex flex-col w-64 border-r bg-card/30 backdrop-blur-xl z-50">
                <div className="flex flex-col h-full px-4 py-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3 px-2 mb-10 group cursor-pointer">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform duration-300">
                            <RocketIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold tracking-tight">TaxPro Console</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Enterprise v2.0</span>
                        </div>
                    </div>

                    {/* Search Trigger */}
                    <div className="mb-6 px-1">
                        <button className="w-full flex items-center justify-between px-3 h-10 rounded-lg bg-secondary/50 border border-transparent hover:border-primary/20 hover:bg-secondary text-muted-foreground transition-all">
                            <div className="flex items-center gap-2">
                                <MagnifyingGlassIcon className="h-4 w-4" />
                                <span className="text-xs">Search...</span>
                            </div>
                            <span className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border">⌘K</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1.5">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">Main Menu</div>
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.2)]"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )
                                }
                            >
                                <item.icon className={cn(
                                    "h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110",
                                    location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                                )} />
                                <span>{item.label}</span>
                                {location.pathname === item.path && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),1)]"
                                    />
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Bottom Section */}
                    <div className="mt-auto space-y-4 pt-6 border-t border-border/50">
                        {/* Status Card */}
                        <div className="px-2">
                            <div className="p-3 rounded-xl bg-secondary/30 border border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Sync Status</span>
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                </div>
                                <div className="text-[11px] text-foreground/70 font-medium">Auto-calculating active...</div>
                            </div>
                        </div>

                        {/* User / Theme */}
                        <div className="flex items-center justify-between px-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="rounded-full hover:bg-secondary h-8 w-8"
                            >
                                {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
                            </Button>
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 shadow-sm cursor-pointer hover:scale-105 transition-transform" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Surface */}
            <main className="flex-1 flex flex-col min-h-screen relative overflow-y-auto bg-background">
                {/* Modern Header */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-8 bg-background/60 backdrop-blur-xl border-b">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>TaxPro</span>
                            <span className="text-border">/</span>
                            <span className="text-foreground font-medium">{getPageTitle()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                            <div className="h-7 w-7 rounded-full border-2 border-background bg-zinc-200 dark:bg-zinc-800" />
                            <div className="h-7 w-7 rounded-full border-2 border-background bg-zinc-300 dark:bg-zinc-700" />
                        </div>
                        <Button variant="premium" size="xs" className="h-8 rounded-full px-4 text-[10px] uppercase tracking-wider font-bold">
                            File Return
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-8 lg:p-12 max-w-7xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.99 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Background Decor */}
                <div className="fixed top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
                <div className="fixed bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-indigo-500/5 blur-[100px] rounded-full -z-10" />
            </main>

            {/* Chatbot integrated as a floating action */}
            <div className="fixed bottom-8 right-8 z-50">
                <Chatbot incomes={incomes} taxResult={taxResult} taxPayer={taxPayer} />
            </div>
        </div>
    );
};

export default Layout;
