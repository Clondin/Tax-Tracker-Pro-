import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface WizardPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export const WizardPanel: React.FC<WizardPanelProps> = ({ isOpen, onClose, title, children, width = "max-w-2xl" }) => {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed top-0 right-0 h-full bg-white dark:bg-card-dark shadow-2xl z-50 overflow-y-auto border-l border-white/20",
                            width
                        )}
                    >
                        <div className="p-6 lg:p-8 min-h-full flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-text-main dark:text-white">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="flex-1">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
