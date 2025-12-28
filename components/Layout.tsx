import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { Theme, IncomeItem, TaxResult, TaxPayer } from '../types';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { Button } from './ui/button';
import { Chatbot } from './Chatbot';
import { CommandPalette } from './CommandPalette';

interface LayoutProps {
    children: React.ReactNode;
    theme: Theme;
    toggleTheme: () => void;
    incomes?: IncomeItem[];
    taxResult?: TaxResult | null;
    taxPayer?: TaxPayer;
}

const Layout: React.FC<LayoutProps> = ({ children, theme, toggleTheme, incomes = [], taxResult, taxPayer }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

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

    return (
        <div className="min-h-screen bg-background font-sans antialiased text-foreground flex">
            <Sidebar />

            <main className="flex-1 ml-64 min-h-screen flex flex-col transition-[margin] duration-200 ease-in-out">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-8 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4">
                        <h1 className="text-lg font-semibold tracking-tight">
                            {location.pathname === '/' ? 'Setup' :
                                location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.substring(1)}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="hidden md:flex gap-2 text-muted-foreground w-64 justify-start"
                            onClick={() => setIsCommandPaletteOpen(true)}
                        >
                            <span className="text-xs">Search...</span>
                            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>

                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                            {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                        </Button>
                    </div>
                </header>

                <div className="flex-1 p-8 animate-fade-in relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
            <Chatbot incomes={incomes} taxResult={taxResult} taxPayer={taxPayer} />
        </div>
    );
};

export default Layout;
