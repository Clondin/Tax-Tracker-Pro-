import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    className?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, label, className, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (value === 0 && displayValue === '') return;
        setDisplayValue(value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) return;
        if (parts[1] && parts[1].length > 2) return;

        setDisplayValue(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            onChange(num);
        } else {
            onChange(0);
        }
    };

    const handleBlur = () => {
        const num = parseFloat(displayValue);
        if (!isNaN(num)) {
            setDisplayValue(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
            setDisplayValue('');
        }
    };

    return (
        <div className={className}>
            {label && <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">{label}</label>}
            <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium group-focus-within:text-primary transition-colors">$</span>
                <input
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={cn(
                        "w-full pl-7 pr-3 py-3 rounded-xl border-2 border-border-light dark:border-neutral-700 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm outline-none transition-all",
                        "focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/30",
                        "text-text-main dark:text-white font-medium placeholder:text-neutral-300"
                    )}
                    placeholder="0.00"
                    {...props}
                />
            </div>
        </div>
    );
};
