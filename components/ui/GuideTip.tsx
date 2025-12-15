import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface GuideTipProps {
    title: string;
    content: string;
    icon?: string;
    variant?: 'default' | 'highlight';
}

export const GuideTip: React.FC<GuideTipProps> = ({ title, content, icon = 'lightbulb', variant = 'default' }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "group relative overflow-hidden rounded-xl border transition-all duration-300",
                variant === 'default'
                    ? "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm"
                    : "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800",
                isCollapsed ? "p-3" : "p-5"
            )}
        >
            {/* Accent Border Line */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1",
                variant === 'default' ? "bg-neutral-300 dark:bg-neutral-700" : "bg-indigo-500"
            )} />

            <div className="flex items-start gap-4 pl-2">
                <div className={cn(
                    "flex-shrink-0 p-2 rounded-lg transition-colors",
                    variant === 'default' ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400" : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                )}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h4 className={cn(
                            "font-bold text-sm tracking-tight",
                            variant === 'default' ? "text-neutral-900 dark:text-neutral-100" : "text-indigo-900 dark:text-indigo-100"
                        )}>
                            {title}
                        </h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                            >
                                <span className="material-symbols-outlined text-[16px]">{isCollapsed ? 'expand_more' : 'expand_less'}</span>
                            </button>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={cn(
                                "text-xs leading-relaxed",
                                variant === 'default' ? "text-neutral-500 dark:text-neutral-400" : "text-indigo-700/80 dark:text-indigo-300/80"
                            )}
                        >
                            {content}
                        </motion.p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
