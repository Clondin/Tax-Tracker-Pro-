import React, { useState } from 'react';
import { DeductionItem, TaxResult } from '../types';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

const DeductionsPage: React.FC<DeductionsPageProps> = ({ deductions, setDeductions, taxResult }) => {
    const [openCategory, setOpenCategory] = useState<string | null>('mortgage');
    const [form, setForm] = useState<Partial<DeductionItem> & { details: any }>({ amount: 0, details: {} });

    const toggle = (id: string) => setOpenCategory(openCategory === id ? null : id);

    const addDeduction = (category: DeductionItem['category']) => {
        if (!form.amount) return;
        const newItem: DeductionItem = {
            id: Math.random().toString(36).substr(2, 9),
            category,
            description: category,
            amount: form.amount,
            details: form.details
        };
        setDeductions([...deductions, newItem]);
        setForm({ amount: 0, details: {} });
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <h1 className="text-3xl font-bold">Deductions & Credits</h1>
            
            {/* FSA / HSA / Medical */}
            <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-neutral-700 rounded-xl overflow-hidden">
                <div onClick={() => toggle('hsa_fsa')} className="p-5 cursor-pointer flex justify-between items-center font-bold bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined">medical_services</span> Health & FSA</span>
                    <span className="material-symbols-outlined">{openCategory === 'hsa_fsa' ? 'expand_less' : 'expand_more'}</span>
                </div>
                {openCategory === 'hsa_fsa' && (
                    <div className="p-6 space-y-6">
                        {/* HSA */}
                        <div className="border-b border-border-light dark:border-neutral-700 pb-4">
                            <h4 className="font-bold text-sm uppercase mb-3 text-neutral-500">HSA Contributions (Form 8889)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Your Contributions (Post-Tax)</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" placeholder="Not via Payroll" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Months Eligible</label>
                                    <input type="number" max="12" min="0" onChange={e => setForm(f => ({...f, details: {...f.details, hsa_months_eligible: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => setForm(f => ({...f, details: {...f.details, hsa_family_coverage: e.target.checked}}))} /> Family Coverage (HDHP)</label>
                                </div>
                            </div>
                            <button onClick={() => addDeduction('hsa_contrib')} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs">Add HSA Entry</button>
                        </div>

                        {/* Medical Expenses */}
                        <div>
                             <h4 className="font-bold text-sm uppercase mb-3 text-neutral-500">Medical Expenses (Sched A)</h4>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Total Out-of-Pocket</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500">Premiums Paid After-Tax</label>
                                    <input type="number" onChange={e => setForm(f => ({...f, details: {...f.details, medical_insurance_premiums_after_tax: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                </div>
                             </div>
                             <button onClick={() => addDeduction('medical')} className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-xs">Add Medical</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mortgage Interest */}
            <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-neutral-700 rounded-xl overflow-hidden">
                <div onClick={() => toggle('mortgage')} className="p-5 cursor-pointer flex justify-between items-center font-bold bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined">home</span> Mortgage & Home</span>
                    <span className="material-symbols-outlined">{openCategory === 'mortgage' ? 'expand_less' : 'expand_more'}</span>
                </div>
                {openCategory === 'mortgage' && (
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Interest Paid (1098)</label>
                                <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Loan Balance (Year End)</label>
                                <input type="number" onChange={e => setForm(f => ({...f, details: {...f.details, mortgage_balance: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500">Origination Date</label>
                                <input type="date" onChange={e => setForm(f => ({...f, details: {...f.details, mortgage_origination_date: e.target.value}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                            </div>
                            <div className="flex items-center pt-5">
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" onChange={e => setForm(f => ({...f, details: {...f.details, mortgage_used_for_buy_build_improve: e.target.checked}}))} /> Used to Buy/Build/Improve?</label>
                            </div>
                        </div>
                        <button onClick={() => addDeduction('mortgage')} className="w-full bg-primary text-white py-2 rounded-lg font-bold text-sm">Add Mortgage</button>
                    </div>
                )}
            </div>

            {/* Credits Section */}
            <div className="bg-card-light dark:bg-card-dark border border-border-light dark:border-neutral-700 rounded-xl overflow-hidden">
                <div onClick={() => toggle('credits')} className="p-5 cursor-pointer flex justify-between items-center font-bold bg-neutral-50 dark:bg-neutral-800/50">
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined">bolt</span> Energy & Other Credits</span>
                    <span className="material-symbols-outlined">{openCategory === 'credits' ? 'expand_less' : 'expand_more'}</span>
                </div>
                {openCategory === 'credits' && (
                    <div className="p-6 space-y-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-sm uppercase mb-2">Residential Energy (Solar/Wind)</h4>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Cost" className="flex-1 p-2 rounded border text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                                        onChange={e => setForm({...form, amount: parseFloat(e.target.value)})}
                                    />
                                    <select className="flex-1 p-2 rounded border text-sm dark:bg-neutral-900 dark:border-neutral-700" onChange={e => setForm(f => ({...f, details: {...f.details, energy_improvement_type: e.target.value}}))}>
                                        <option value="solar">Solar Electric</option>
                                        <option value="windows">Exterior Windows</option>
                                        <option value="hvac">Heat Pump/HVAC</option>
                                    </select>
                                    <button onClick={() => addDeduction('energy_credit')} className="bg-green-600 text-white px-4 rounded font-bold text-xs">Add</button>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-sm uppercase mb-2">Adoption Credit</h4>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Qualified Expenses" className="flex-1 p-2 rounded border text-sm dark:bg-neutral-900 dark:border-neutral-700" 
                                        onChange={e => setForm(f => ({...f, amount: parseFloat(e.target.value)}))}
                                    />
                                     <button onClick={() => addDeduction('adoption_credit')} className="bg-purple-600 text-white px-4 rounded font-bold text-xs">Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="space-y-2 pt-4 border-t border-border-light dark:border-neutral-700">
                <h3 className="font-bold">Your Items</h3>
                {deductions.map(d => (
                    <div key={d.id} className="flex justify-between p-3 bg-white dark:bg-neutral-800 border rounded-lg items-center">
                        <div>
                             <div className="font-bold">{d.description}</div>
                             <div className="text-xs text-neutral-500 uppercase">{d.category.replace('_', ' ')}</div>
                        </div>
                        <div className="font-bold">${d.amount.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeductionsPage;