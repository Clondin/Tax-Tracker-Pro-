import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Theme, IncomeItem, TaxResult, TaxPayer } from '../types';
import { SunIcon, MoonIcon, GearIcon, HomeIcon, FileTextIcon, PieChartIcon, RocketIcon, DashboardIcon } from '@radix-ui/react-icons';
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
    { path: '/summary', label: 'Dashboard', icon: DashboardIcon },
    { path: '/income', label: 'Income', icon: RocketIcon },
    { path: '/deductions', label: 'Deductions', icon: PieChartIcon },
    { path: '/documents', label: 'Documents', icon: FileTextIcon },
    { path: '/', label: 'Setup', icon: GearIcon },
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
        return item?.label || 'Tax Tracker';
    };

    return (
        <div className="min-h-screen bg-background font-sans antialiased text-foreground flex">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r bg-card/50 backdrop-blur-sm">
                <div className="flex h-full flex-col px-3 py-4">
                    {/* Logo */}
                    <div className="mb-8 flex h-12 items-center px-3">
                        <div className="flex items-center gap-2 font-semibold text-lg">
                            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                                T
                            </div>
                            <span className="tracking-tight">TaxPro</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1">
                        {NAV_ITEMS.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )
                                }
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Theme Toggle */}
                    <div className="mt-auto pt-4 border-t">
                        <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start gap-2">
                            {theme === 'light' ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-56 min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background/95 px-6 backdrop-blur">
                    <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
                </header>

                {/* Page Content */}
                <div className="p-6 animate-fade-in">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.15 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Chatbot */}
            <Chatbot incomes={incomes} taxResult={taxResult} taxPayer={taxPayer} />
        </div>
    );
};

export default Layout;
