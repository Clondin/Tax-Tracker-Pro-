import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const COMMANDS = [
    { id: 'income', label: 'Go to Income & Wages', icon: 'payments', path: '/income', keywords: ['w2', 'wages', 'salary', '1099'] },
    { id: 'deductions', label: 'Go to Deductions & Credits', icon: 'receipt_long', path: '/deductions', keywords: ['deduct', 'credit', 'mortgage', 'charity'] },
    { id: 'summary', label: 'View Tax Summary', icon: 'assessment', path: '/summary', keywords: ['result', 'refund', 'owe', 'total'] },
    { id: 'documents', label: 'Document Portal', icon: 'folder_open', path: '/documents', keywords: ['files', 'upload', 'receipt'] },
    { id: 'setup', label: 'Edit Profile & Filing Status', icon: 'settings_account_box', path: '/', keywords: ['profile', 'name', 'married', 'single', 'dependents'] },
    { id: 'add-w2', label: 'Add W-2 Income', icon: 'add_circle', path: '/income', state: { action: 'add-w2' }, keywords: ['new', 'employer'] },
    { id: 'add-deduction', label: 'Add Deduction', icon: 'add_circle', path: '/deductions', state: { action: 'add' }, keywords: ['new', 'expense'] },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const navigate = useNavigate();

    const filteredCommands = COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.keywords.some(k => k.includes(query.toLowerCase()))
    );

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
            e.preventDefault();
            const cmd = filteredCommands[selectedIndex];
            navigate(cmd.path, cmd.state ? { state: cmd.state } : undefined);
            onClose();
        } else if (e.key === 'Escape') {
            onClose();
        }
    }, [isOpen, filteredCommands, selectedIndex, navigate, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-border-light dark:border-neutral-700 z-50 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light dark:border-neutral-700">
                            <span className="material-symbols-outlined text-text-muted">search</span>
                            <input
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                placeholder="Search commands..."
                                className="flex-1 bg-transparent outline-none text-lg text-text-main dark:text-white placeholder:text-text-muted"
                                autoFocus
                            />
                            <kbd className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded font-mono text-text-muted">ESC</kbd>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                            {filteredCommands.length === 0 ? (
                                <div className="text-center py-8 text-text-muted">No matching commands</div>
                            ) : (
                                filteredCommands.map((cmd, i) => (
                                    <button
                                        key={cmd.id}
                                        onClick={() => { navigate(cmd.path, cmd.state ? { state: cmd.state } : undefined); onClose(); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                                            i === selectedIndex ? "bg-primary/10 text-primary" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-main dark:text-white"
                                        )}
                                    >
                                        <span className={cn("material-symbols-outlined", i === selectedIndex ? "text-primary" : "text-text-muted")}>{cmd.icon}</span>
                                        <span className="font-medium">{cmd.label}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
