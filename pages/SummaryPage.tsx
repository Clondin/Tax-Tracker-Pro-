import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TaxResult } from '../types';
import { cn } from '../lib/utils';

interface SummaryPageProps {
    taxResult: TaxResult | null;
}

const WHAT_IF_SCENARIOS = [
    { id: 'max_401k', label: 'Max out 401(k)', impact: -4500, icon: 'savings', description: 'Contribute $23,000 to your 401(k)' },
    { id: 'max_ira', label: 'Max out IRA', impact: -1400, icon: 'account_balance', description: 'Contribute $7,000 to a Traditional IRA' },
    { id: 'hsa', label: 'Max out HSA', impact: -800, icon: 'medical_services', description: 'Contribute $4,150 to HSA' },
    { id: 'solar', label: 'Install Solar Panels', impact: -5000, icon: 'solar_power', description: '30% credit on $16,667 investment' },
    { id: 'ev', label: 'Buy an EV', impact: -3750, icon: 'electric_car', description: 'Federal EV tax credit' },
    { id: 'charity', label: 'Donate $5,000 to Charity', impact: -1100, icon: 'volunteer_activism', description: 'Itemized deduction at 22% bracket' },
];

const SummaryPage: React.FC<SummaryPageProps> = ({ taxResult }) => {
    const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>({});
    const [showWhatIf, setShowWhatIf] = useState(false);

    // Calculate adjusted refund based on active scenarios
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

    if (!taxResult) return <div className="text-center py-12">Loading...</div>;

    const hasErrors = taxResult.complianceAlerts.some(a => a.severity === 'error');
    const result = adjustedResult || taxResult;
    const isRefund = result.refund > 0;

    return (
        <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black leading-tight mb-1 text-text-main dark:text-white">2025 Tax Summary</h1>
                    <p className="text-text-muted font-medium">Draft Return • Based on 2025 IRS Projections</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowWhatIf(!showWhatIf)}
                        className={cn(
                            "flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold transition-all",
                            showWhatIf
                                ? "bg-primary text-white border-primary"
                                : "bg-white dark:bg-neutral-800 border-border-light dark:border-neutral-700 hover:border-primary"
                        )}
                    >
                        <span className="material-symbols-outlined text-lg">science</span> What If?
                    </button>
                    <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:opacity-90 transition-colors">
                        <span className="material-symbols-outlined">download</span> Export PDF
                    </button>
                </div>
            </div>

            {/* Compliance Alerts */}
            {taxResult.complianceAlerts.length > 0 && (
                <div className={cn("rounded-xl p-6 border", hasErrors ? "bg-red-50 dark:bg-red-900/20 border-red-200" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200")}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={cn("material-symbols-outlined", hasErrors ? "text-red-600" : "text-amber-600")}>fact_check</span>
                        <h3 className={cn("font-bold", hasErrors ? "text-red-800 dark:text-red-200" : "text-amber-800 dark:text-amber-200")}>Compliance Audit</h3>
                    </div>
                    <div className="space-y-2">
                        {taxResult.complianceAlerts.map((alert, idx) => (
                            <div key={idx} className="flex gap-3 items-start text-sm">
                                <div className={cn("mt-1 size-2 rounded-full", alert.severity === 'error' ? 'bg-red-500' : 'bg-amber-500')} />
                                <div>
                                    <span className="font-bold uppercase text-xs opacity-75 mr-2">{alert.code}</span>
                                    <span className="text-neutral-700 dark:text-neutral-300">{alert.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* What-If Playground */}
            {showWhatIf && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card rounded-2xl p-6 border-2 border-primary/30"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary">science</span>
                        <h3 className="font-bold text-lg text-text-main dark:text-white">What-If Playground</h3>
                        {(adjustedResult?.impactAmount || 0) !== 0 && (
                            <span className="ml-auto text-sm font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                                Potential Savings: ${Math.abs(adjustedResult?.impactAmount || 0).toLocaleString()}
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {WHAT_IF_SCENARIOS.map(scenario => (
                            <motion.button
                                key={scenario.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveScenarios(prev => ({ ...prev, [scenario.id]: !prev[scenario.id] }))}
                                className={cn(
                                    "p-4 rounded-xl border-2 text-left transition-all",
                                    activeScenarios[scenario.id]
                                        ? "border-primary bg-primary/5 shadow-lg"
                                        : "border-border-light dark:border-border-dark hover:border-primary/50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className={cn("material-symbols-outlined", activeScenarios[scenario.id] ? "text-primary" : "text-text-muted")}>{scenario.icon}</span>
                                    <span className="text-xs font-bold text-emerald-600">-${Math.abs(scenario.impact).toLocaleString()}</span>
                                </div>
                                <div className="font-bold text-sm text-text-main dark:text-white">{scenario.label}</div>
                                <div className="text-xs text-text-muted mt-0.5">{scenario.description}</div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Main Result Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    layout
                    className={cn(
                        "p-6 rounded-xl border-2 shadow-lg",
                        isRefund ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-emerald-200 dark:border-emerald-800"
                            : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border-red-200 dark:border-red-800"
                    )}
                >
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-muted">{isRefund ? 'Refund' : 'Amount Due'}</p>
                        <span className={cn("material-symbols-outlined text-xl", isRefund ? "text-emerald-600" : "text-red-600")}>monetization_on</span>
                    </div>
                    <p className={cn("text-4xl font-black", isRefund ? "text-emerald-600" : "text-red-600")}>
                        ${(result.refund || result.amountDue).toLocaleString()}
                    </p>
                    {(adjustedResult?.impactAmount || 0) !== 0 && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium">+${Math.abs(adjustedResult?.impactAmount || 0).toLocaleString()} with What-If</p>
                    )}
                </motion.div>

                <div className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-muted">Effective Rate</p>
                        <span className="material-symbols-outlined text-xl text-blue-600">pie_chart</span>
                    </div>
                    <p className="text-3xl font-bold text-text-main dark:text-white">{(taxResult.effectiveRate * 100).toFixed(1)}%</p>
                    <p className="text-xs text-text-muted mt-1">Marginal: {(taxResult.marginalRate * 100).toFixed(0)}%</p>
                </div>

                <div className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-muted">AGI</p>
                        <span className="material-symbols-outlined text-xl text-text-muted">account_balance_wallet</span>
                    </div>
                    <p className="text-3xl font-bold text-text-main dark:text-white">${taxResult.agi.toLocaleString()}</p>
                    <p className="text-xs text-text-muted mt-1">Adjusted Gross Income</p>
                </div>

                <div className="glass-card p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-text-muted">Taxable Income</p>
                        <span className="material-symbols-outlined text-xl text-text-muted">analytics</span>
                    </div>
                    <p className="text-3xl font-bold text-text-main dark:text-white">${taxResult.taxableIncome.toLocaleString()}</p>
                    <p className="text-xs text-text-muted mt-1">After Deductions</p>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                    <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-light dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                            <h3 className="text-lg font-bold text-text-main dark:text-white">Tax Liability Detail</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-border-light dark:divide-neutral-800">
                                    {[
                                        { name: 'Regular Income Tax', amt: taxResult.regularTax },
                                        { name: 'Self-Employment Tax', amt: taxResult.selfEmploymentTax },
                                        { name: 'Alternative Minimum Tax', amt: taxResult.alternativeMinimumTax },
                                        { name: 'Net Investment Income Tax', amt: taxResult.niit },
                                        { name: 'Child Tax Credit', amt: -taxResult.credits.ctc_nonrefundable, isCredit: true },
                                        { name: 'Refundable Credits', amt: -taxResult.credits.total_refundable, isCredit: true },
                                    ].filter(r => Math.abs(r.amt) > 0).map((row, i) => (
                                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <td className="px-6 py-4 font-medium text-text-main dark:text-white">{row.name}</td>
                                            <td className={cn("px-6 py-4 text-right font-bold tabular-nums", row.isCredit ? "text-emerald-600" : "")}>
                                                {row.isCredit && '-'}${Math.abs(row.amt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold">
                                        <td className="px-6 py-4 text-text-main dark:text-white">Total Tax Liability</td>
                                        <td className="px-6 py-4 text-right text-text-main dark:text-white">${taxResult.totalTaxLiability.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Flow Analysis */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 glass-card rounded-xl p-6">
                        <h3 className="text-lg font-bold mb-6 border-b border-border-light dark:border-neutral-800 pb-4 text-text-main dark:text-white">Flow Analysis</h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Gross Income', val: taxResult.grossIncome },
                                { title: 'Adjustments', val: -taxResult.adjustments, color: 'text-text-muted' },
                                { title: 'Deductions', val: -taxResult.deductionUsed, color: 'text-text-muted' },
                                { title: 'Taxable Income', val: taxResult.taxableIncome, bold: true },
                                { title: 'Calculated Tax', val: taxResult.totalTaxLiability, bold: true },
                                { title: 'Payments & Credits', val: -(taxResult.totalPayments + taxResult.credits.total_refundable), color: 'text-emerald-600' },
                            ].map((step, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className={step.bold ? 'font-bold text-text-main dark:text-white' : 'text-text-muted'}>{step.title}</span>
                                    <span className={cn("tabular-nums", step.bold ? 'font-bold text-text-main dark:text-white' : '', step.color || '')}>
                                        {step.val < 0 ? '-' : ''}${Math.abs(step.val).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-border-light dark:border-neutral-800 flex justify-between items-center">
                                <span className="font-black text-lg text-text-main dark:text-white">{isRefund ? 'REFUND' : 'OWED'}</span>
                                <span className={cn("font-black text-xl", isRefund ? 'text-emerald-600' : 'text-red-600')}>
                                    ${(result.refund || result.amountDue).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button disabled={hasErrors} className="w-full mt-6 h-12 flex items-center justify-center gap-2 rounded-lg bg-primary hover:opacity-90 text-white font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined">send</span> {hasErrors ? 'Fix Errors' : 'File Return'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;