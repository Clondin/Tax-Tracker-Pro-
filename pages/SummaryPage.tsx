import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxResult } from '../types';
import { cn } from '../lib/utils';

interface SummaryPageProps {
    taxResult: TaxResult | null;
}

const WHAT_IF_SCENARIOS = [
    { id: 'max_401k', label: 'Max out 401(k)', impact: -4500, icon: 'savings', description: 'Contribute $23,000', gradient: 'from-violet-500 to-purple-500' },
    { id: 'max_ira', label: 'Max out IRA', impact: -1400, icon: 'account_balance', description: 'Contribute $7,000', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'hsa', label: 'Max out HSA', impact: -800, icon: 'medical_services', description: 'Contribute $4,150', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'solar', label: 'Install Solar', impact: -5000, icon: 'solar_power', description: '30% credit', gradient: 'from-amber-500 to-orange-500' },
    { id: 'ev', label: 'Buy an EV', impact: -3750, icon: 'electric_car', description: 'Federal credit', gradient: 'from-lime-500 to-green-500' },
    { id: 'charity', label: 'Donate $5K', impact: -1100, icon: 'volunteer_activism', description: 'Itemized deduction', gradient: 'from-pink-500 to-rose-500' },
];

const SummaryPage: React.FC<SummaryPageProps> = ({ taxResult }) => {
    const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>({});
    const [showWhatIf, setShowWhatIf] = useState(false);

    const adjustedResult = useMemo(() => {
        if (!taxResult) return null;
        const totalImpact = WHAT_IF_SCENARIOS.filter(s => activeScenarios[s.id]).reduce((a, b) => a + b.impact, 0);
        const newRefund = taxResult.refund - totalImpact;
        const newAmountDue = taxResult.amountDue + totalImpact;
        return {
            ...taxResult,
            refund: Math.max(0, newRefund),
            amountDue: Math.max(0, newAmountDue > 0 ? newAmountDue : 0),
            impactAmount: -totalImpact
        };
    }, [taxResult, activeScenarios]);

    if (!taxResult) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="glass-card rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-5xl text-zinc-500 mb-4">hourglass_empty</span>
                    <p className="text-zinc-400">Loading your tax summary...</p>
                </div>
            </div>
        );
    }

    const hasErrors = taxResult.complianceAlerts.some(a => a.severity === 'error');
    const result = adjustedResult || taxResult;
    const isRefund = result.refund > 0;

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 mb-3"
                    >
                        <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                            Draft Return
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 text-zinc-400 text-xs font-mono">
                            Tax Year 2025
                        </div>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-display font-bold text-white mb-2"
                    >
                        Tax Summary
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-zinc-400"
                    >
                        Based on 2025 IRS projections
                    </motion.p>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3"
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowWhatIf(!showWhatIf)}
                        className={cn(
                            "flex items-center gap-2 h-12 px-5 rounded-xl text-sm font-bold transition-all",
                            showWhatIf
                                ? "bg-gradient-to-r from-primary to-accent-cyan text-white shadow-glow"
                                : "glass-card text-zinc-300 hover:text-white"
                        )}
                    >
                        <span className="material-symbols-outlined">science</span>
                        What If?
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 h-12 px-5 rounded-xl bg-gradient-to-r from-primary via-accent-cyan to-accent-pink text-white text-sm font-bold shadow-glow-sm"
                    >
                        <span className="material-symbols-outlined">download</span>
                        Export PDF
                    </motion.button>
                </motion.div>
            </div>

            {/* Compliance Alerts */}
            <AnimatePresence>
                {taxResult.complianceAlerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                            "rounded-2xl p-6 border overflow-hidden",
                            hasErrors
                                ? "bg-red-500/10 border-red-500/30"
                                : "bg-amber-500/10 border-amber-500/30"
                        )}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={cn(
                                "p-2 rounded-xl",
                                hasErrors ? "bg-red-500/20" : "bg-amber-500/20"
                            )}>
                                <span className={cn(
                                    "material-symbols-outlined",
                                    hasErrors ? "text-red-400" : "text-amber-400"
                                )}>
                                    {hasErrors ? 'error' : 'warning'}
                                </span>
                            </div>
                            <h3 className={cn(
                                "font-display font-bold",
                                hasErrors ? "text-red-300" : "text-amber-300"
                            )}>
                                Compliance Audit
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {taxResult.complianceAlerts.map((alert, idx) => (
                                <div key={idx} className="flex gap-3 items-start text-sm">
                                    <div className={cn(
                                        "mt-1.5 w-2 h-2 rounded-full",
                                        alert.severity === 'error' ? 'bg-red-400' : 'bg-amber-400'
                                    )} />
                                    <div>
                                        <span className="font-mono text-xs text-zinc-500 mr-2">{alert.code}</span>
                                        <span className="text-zinc-300">{alert.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* What-If Playground */}
            <AnimatePresence>
                {showWhatIf && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="gradient-border rounded-2xl p-6 overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent-cyan">
                                    <span className="material-symbols-outlined text-white">science</span>
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-white">What-If Playground</h3>
                                    <p className="text-sm text-zinc-500">See how changes affect your refund</p>
                                </div>
                            </div>
                            {(adjustedResult?.impactAmount || 0) !== 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-4 py-2 rounded-full bg-success/20 text-success font-bold text-sm"
                                >
                                    +${Math.abs(adjustedResult?.impactAmount || 0).toLocaleString()} savings
                                </motion.div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {WHAT_IF_SCENARIOS.map((scenario, i) => (
                                <motion.button
                                    key={scenario.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setActiveScenarios(prev => ({ ...prev, [scenario.id]: !prev[scenario.id] }))}
                                    className={cn(
                                        "relative p-4 rounded-xl text-left transition-all duration-300 overflow-hidden group",
                                        activeScenarios[scenario.id]
                                            ? "glass-card ring-2 ring-primary"
                                            : "glass-light"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 transition-opacity duration-300 bg-gradient-to-br",
                                        scenario.gradient,
                                        activeScenarios[scenario.id] ? "opacity-10" : "group-hover:opacity-5"
                                    )} />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={cn(
                                                "material-symbols-outlined text-lg",
                                                activeScenarios[scenario.id] ? "text-white" : "text-zinc-400"
                                            )}>
                                                {scenario.icon}
                                            </span>
                                            <span className="text-xs font-bold text-success">
                                                -${Math.abs(scenario.impact).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="font-bold text-xs text-white truncate">{scenario.label}</div>
                                        <div className="text-[10px] text-zinc-500 truncate">{scenario.description}</div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Refund/Amount Due Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "relative p-6 rounded-2xl overflow-hidden",
                        isRefund
                            ? "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30"
                            : "bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent border border-red-500/30"
                    )}
                >
                    <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl",
                        isRefund ? "bg-emerald-500/20" : "bg-red-500/20"
                    )} />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-zinc-400">{isRefund ? 'Refund' : 'Amount Due'}</p>
                            <span className={cn(
                                "material-symbols-outlined text-2xl",
                                isRefund ? "text-emerald-400" : "text-red-400"
                            )}>
                                {isRefund ? 'trending_up' : 'trending_down'}
                            </span>
                        </div>
                        <p className={cn(
                            "text-4xl font-display font-bold tabular-nums",
                            isRefund ? "text-emerald-400" : "text-red-400"
                        )}>
                            ${(result.refund || result.amountDue).toLocaleString()}
                        </p>
                        {(adjustedResult?.impactAmount || 0) !== 0 && (
                            <p className="text-xs text-success mt-2 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                +${Math.abs(adjustedResult?.impactAmount || 0).toLocaleString()} with What-If
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Effective Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-zinc-400">Effective Rate</p>
                        <span className="material-symbols-outlined text-2xl text-accent-cyan">donut_large</span>
                    </div>
                    <p className="text-4xl font-display font-bold text-white tabular-nums">
                        {(taxResult.effectiveRate * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                        Marginal: <span className="text-zinc-300">{(taxResult.marginalRate * 100).toFixed(0)}%</span>
                    </p>
                </motion.div>

                {/* AGI */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-zinc-400">AGI</p>
                        <span className="material-symbols-outlined text-2xl text-primary">account_balance_wallet</span>
                    </div>
                    <p className="text-4xl font-display font-bold text-white tabular-nums">
                        ${taxResult.agi.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">Adjusted Gross Income</p>
                </motion.div>

                {/* Taxable Income */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-card p-6 rounded-2xl"
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-zinc-400">Taxable Income</p>
                        <span className="material-symbols-outlined text-2xl text-accent-pink">analytics</span>
                    </div>
                    <p className="text-4xl font-display font-bold text-white tabular-nums">
                        ${taxResult.taxableIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">After Deductions</p>
                </motion.div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tax Liability Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-8 glass-card rounded-2xl overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent-cyan">
                            <span className="material-symbols-outlined text-white">receipt_long</span>
                        </div>
                        <h3 className="font-display font-bold text-white">Tax Liability Detail</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <tbody className="divide-y divide-white/5">
                                {[
                                    { name: 'Regular Income Tax', amt: taxResult.regularTax, icon: 'calculate' },
                                    { name: 'Self-Employment Tax', amt: taxResult.selfEmploymentTax, icon: 'work' },
                                    { name: 'Alternative Minimum Tax', amt: taxResult.alternativeMinimumTax, icon: 'trending_up' },
                                    { name: 'Net Investment Income Tax', amt: taxResult.niit, icon: 'show_chart' },
                                    { name: 'Child Tax Credit', amt: -taxResult.credits.ctc_nonrefundable, isCredit: true, icon: 'child_care' },
                                    { name: 'Refundable Credits', amt: -taxResult.credits.total_refundable, isCredit: true, icon: 'redeem' },
                                ].filter(r => Math.abs(r.amt) > 0).map((row, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + i * 0.05 }}
                                        className="hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-zinc-500 text-lg">{row.icon}</span>
                                                <span className="font-medium text-zinc-200">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-right font-mono font-bold tabular-nums",
                                            row.isCredit ? "text-success" : "text-white"
                                        )}>
                                            {row.isCredit && '-'}${Math.abs(row.amt).toLocaleString()}
                                        </td>
                                    </motion.tr>
                                ))}
                                <tr className="bg-white/[0.03]">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary text-lg">summarize</span>
                                            <span className="font-display font-bold text-white">Total Tax Liability</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-white tabular-nums text-lg">
                                        ${taxResult.totalTaxLiability.toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Flow Analysis Sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-4"
                >
                    <div className="sticky top-28 glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-pink to-accent-orange">
                                <span className="material-symbols-outlined text-white">waterfall_chart</span>
                            </div>
                            <h3 className="font-display font-bold text-white">Flow Analysis</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { title: 'Gross Income', val: taxResult.grossIncome, icon: 'payments' },
                                { title: 'Adjustments', val: -taxResult.adjustments, color: 'text-zinc-400', icon: 'remove' },
                                { title: 'Deductions', val: -taxResult.deductionUsed, color: 'text-zinc-400', icon: 'remove' },
                                { title: 'Taxable Income', val: taxResult.taxableIncome, bold: true, icon: 'functions' },
                                { title: 'Calculated Tax', val: taxResult.totalTaxLiability, bold: true, icon: 'calculate' },
                                { title: 'Payments & Credits', val: -(taxResult.totalPayments + taxResult.credits.total_refundable), color: 'text-success', icon: 'add' },
                            ].map((step, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "material-symbols-outlined text-sm",
                                            step.color || (step.bold ? 'text-primary' : 'text-zinc-500')
                                        )}>
                                            {step.icon}
                                        </span>
                                        <span className={step.bold ? 'font-bold text-white' : 'text-zinc-400'}>
                                            {step.title}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "tabular-nums font-mono",
                                        step.bold ? 'font-bold text-white' : '',
                                        step.color || ''
                                    )}>
                                        {step.val < 0 ? '-' : ''}${Math.abs(step.val).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-center">
                                <span className="font-display font-bold text-lg text-white">
                                    {isRefund ? 'REFUND' : 'OWED'}
                                </span>
                                <span className={cn(
                                    "font-display font-bold text-2xl tabular-nums",
                                    isRefund ? 'text-success' : 'text-danger'
                                )}>
                                    ${(result.refund || result.amountDue).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={hasErrors}
                            className={cn(
                                "w-full mt-6 h-14 flex items-center justify-center gap-2 rounded-xl font-bold transition-all",
                                hasErrors
                                    ? "bg-white/5 text-zinc-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-primary via-accent-cyan to-accent-pink text-white shadow-glow-sm hover:shadow-glow"
                            )}
                        >
                            <span className="material-symbols-outlined">
                                {hasErrors ? 'error' : 'send'}
                            </span>
                            {hasErrors ? 'Fix Errors First' : 'File Return'}
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default SummaryPage;
