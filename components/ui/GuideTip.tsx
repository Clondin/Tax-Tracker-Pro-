import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideTipProps {
    title: string;
    content: string;
    icon?: string;
}

export const GuideTip: React.FC<GuideTipProps> = ({ title, content, icon = 'lightbulb' }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/10 dark:to-indigo-800/5 border border-indigo-200 dark:border-indigo-800 rounded-xl relative group"
        >
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 opacity-0 group-hover:opacity-100 transition-all"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <div className="flex gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg h-fit">
                    <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-xl">{icon}</span>
                </div>
                <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm mb-1">{title}</h4>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200/80 leading-relaxed">
                        {content}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
