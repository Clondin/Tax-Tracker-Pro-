import React from 'react';
import { TaxResult } from '../types';

interface SummaryPageProps {
    taxResult: TaxResult | null;
}

const SummaryPage: React.FC<SummaryPageProps> = ({ taxResult }) => {
    if (!taxResult) return <div>Loading...</div>;

    const hasErrors = taxResult.complianceAlerts.some(a => a.severity === 'error');
    const hasWarnings = taxResult.complianceAlerts.some(a => a.severity === 'warning');

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black leading-tight mb-1">2025 Tax Summary</h1>
                    <p className="text-neutral-500 font-medium">Draft Return • Based on 2025 IRS Projections</p>
                </div>
                <div className="flex gap-2">
                     <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-card-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 text-sm font-bold shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                        <span className="material-symbols-outlined">print</span> Print
                    </button>
                    <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white border border-transparent text-sm font-bold shadow-sm hover:bg-neutral-800 transition-colors">
                        <span className="material-symbols-outlined">download</span> Download PDF
                    </button>
                </div>
            </div>

            {/* Compliance Alerts */}
            {taxResult.complianceAlerts.length > 0 && (
                <div className={`${hasErrors ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`material-symbols-outlined ${hasErrors ? 'text-red-600' : 'text-orange-600'}`}>fact_check</span>
                        <h3 className={`font-bold ${hasErrors ? 'text-red-800 dark:text-red-200' : 'text-orange-800 dark:text-orange-200'}`}>Engine Compliance Audit</h3>
                    </div>
                    <div className="space-y-3">
                        {taxResult.complianceAlerts.map((alert, idx) => (
                            <div key={idx} className="flex gap-3 items-start text-sm">
                                <div className={`mt-0.5 size-2 rounded-full flex-shrink-0 ${
                                    alert.severity === 'error' ? 'bg-red-500' : (alert.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500')
                                }`}></div>
                                <div>
                                    <span className="font-bold uppercase text-xs opacity-75 mr-2">{alert.code}</span>
                                    <span className="text-neutral-800 dark:text-neutral-200">{alert.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Refund / (Due)', val: taxResult.refund > 0 ? `$${taxResult.refund.toLocaleString()}` : `($${taxResult.amountDue.toLocaleString()})`, icon: 'monetization_on', color: taxResult.refund > 0 ? 'text-green-600' : 'text-red-500', sub: taxResult.refund > 0 ? 'Refund' : 'Amount Due', subColor: taxResult.refund > 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                    { label: 'Effective Rate', val: `${(taxResult.effectiveRate * 100).toFixed(1)}%`, icon: 'pie_chart', color: 'text-blue-600', sub: `Marginal: ${(taxResult.marginalRate * 100).toFixed(0)}%`, subColor: 'text-neutral-500' },
                    { label: 'AGI', val: `$${taxResult.agi.toLocaleString()}`, icon: 'account_balance_wallet', color: 'text-neutral-400', sub: 'Adjusted Gross', subColor: 'text-green-600' },
                    { label: 'Taxable Income', val: `$${taxResult.taxableIncome.toLocaleString()}`, icon: 'analytics', color: 'text-neutral-400', sub: 'After Deductions', subColor: 'text-neutral-500' }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-xl p-6 border border-border-light dark:border-neutral-800 bg-card-light dark:bg-card-dark shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-neutral-600 dark:text-neutral-400 text-sm font-semibold">{stat.label}</p>
                            <span className={`material-symbols-outlined text-[20px] ${stat.color}`}>{stat.icon}</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{stat.val}</p>
                        <div className={`flex items-center gap-1 text-sm font-medium w-fit px-2 py-0.5 rounded-full ${stat.subColor}`}>
                            <span>{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-8">
                     {/* Detailed Liability Breakdown */}
                     <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-neutral-800 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border-light dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                            <h3 className="text-lg font-bold">Tax Liability Detail</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <tbody className="divide-y divide-border-light dark:divide-neutral-800">
                                    {[
                                        { name: 'Regular Income Tax', desc: 'Ordinary Income + Capital Gains', amt: taxResult.regularTax },
                                        { name: 'Alternative Minimum Tax', desc: 'AMT Adjustment (Form 6251)', amt: taxResult.alternativeMinimumTax },
                                        { name: 'Self-Employment Tax', desc: 'Schedule SE (SS + Medicare)', amt: taxResult.selfEmploymentTax },
                                        { name: 'Net Investment Income Tax', desc: '3.8% NIIT on Passive Income', amt: taxResult.niit },
                                        { name: 'Medicare Surtax', desc: '0.9% Additional Medicare', amt: taxResult.medicareSurtax },
                                        { name: 'Child Tax Credit (Non-Ref)', desc: 'Offsetting Tax Liability', amt: -taxResult.credits.ctc_nonrefundable, isCredit: true },
                                        { name: 'Education Credits (Non-Ref)', desc: 'AOTC / LLC Offset', amt: -taxResult.credits.aotc_nonrefundable, isCredit: true },
                                        { name: 'Refundable Credits', desc: 'EIC + ACTC + AOTC (Ref)', amt: -taxResult.credits.total_refundable, isCredit: true },
                                    ].filter(r => Math.abs(r.amt) > 0).map((row, i) => (
                                        <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold">{row.name}</div>
                                                <div className="text-xs text-neutral-500">{row.desc}</div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-medium tabular-nums ${row.isCredit ? 'text-green-600' : ''}`}>
                                                ${Math.abs(row.amt).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-neutral-100 dark:bg-neutral-900 font-bold">
                                        <td className="px-6 py-4">Total Tax Liability</td>
                                        <td className="px-6 py-4 text-right">${taxResult.totalTaxLiability.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                     </div>
                     
                     {/* Carryovers Section */}
                     {(Object.keys(taxResult.carryovers.passiveLosses).length > 0 || taxResult.carryovers.capitalLoss > 0) && (
                         <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-neutral-800 overflow-hidden shadow-sm p-6">
                             <h3 className="text-lg font-bold mb-4">Carryovers to 2026</h3>
                             <div className="grid grid-cols-2 gap-4">
                                 {Object.entries(taxResult.carryovers.passiveLosses).map(([prop, loss]) => (
                                     <div key={prop} className="p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                         <p className="text-xs text-neutral-500 uppercase">Suspended Passive Loss ({prop})</p>
                                         <p className="font-bold text-lg">${loss.toLocaleString()}</p>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     )}
                </div>

                {/* Calculation Flow */}
                <div className="lg:col-span-4">
                    <div className="sticky top-24 bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-neutral-800 p-6 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 border-b border-border-light dark:border-neutral-800 pb-4">Flow Analysis</h3>
                        <div className="space-y-4">
                            {[
                                { title: 'Gross Income', val: taxResult.grossIncome },
                                { title: 'Adjustments (Sched 1)', val: -taxResult.adjustments, color: 'text-neutral-500' },
                                { title: 'Deductions (Sched A)', val: -taxResult.deductionUsed, color: 'text-neutral-500' },
                                { title: 'Taxable Income', val: taxResult.taxableIncome, bold: true },
                                { title: 'Calculated Tax', val: taxResult.totalTaxLiability, bold: true },
                                { title: 'Payments & Ref. Credits', val: -(taxResult.totalPayments + taxResult.credits.total_refundable), color: 'text-green-600' },
                            ].map((step, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className={step.bold ? 'font-bold' : 'text-neutral-600 dark:text-neutral-400'}>{step.title}</span>
                                    <span className={`tabular-nums ${step.bold ? 'font-bold' : ''} ${step.color || ''}`}>
                                        {step.val < 0 ? '-' : ''}${Math.abs(step.val).toLocaleString(undefined, {maximumFractionDigits:0})}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-border-light dark:border-neutral-800 flex justify-between items-center">
                                <span className="font-black text-lg">{taxResult.refund > 0 ? 'REFUND' : 'OWED'}</span>
                                <span className={`font-black text-xl ${taxResult.refund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${(taxResult.refund || taxResult.amountDue).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <button disabled={hasErrors} className="w-full mt-6 h-12 flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 dark:text-primary text-white font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined">send</span> {hasErrors ? 'Fix Errors' : 'File Return'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;