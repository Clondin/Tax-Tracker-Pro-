import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface TaxometerProps {
    refund: number;
    amountDue: number;
}

export const Taxometer: React.FC<TaxometerProps> = ({ refund, amountDue }) => {
    const value = refund > 0 ? refund : -amountDue;
    const maxValue = 10000;
    const percentage = Math.min(Math.max((value / maxValue + 1) / 2, 0), 1) * 100;

    const isRefund = value > 0;
    const displayValue = Math.abs(value);

    return (
        <div className="flex items-center gap-3">
            <div className="relative w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-neutral-400 to-emerald-500 opacity-30"></div>

                {/* Indicator */}
                <motion.div
                    initial={{ left: '50%' }}
                    animate={{ left: `${percentage}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg border-2 border-white dark:border-neutral-900"
                    style={{ backgroundColor: isRefund ? '#10b981' : value === 0 ? '#a3a3a3' : '#ef4444' }}
                />
            </div>

            <div className={cn(
                "text-xs font-bold px-2 py-1 rounded-md",
                isRefund ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : value === 0 ? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
                {isRefund ? '+' : value === 0 ? '' : '-'}${displayValue.toLocaleString()}
            </div>
        </div>
    );
};
