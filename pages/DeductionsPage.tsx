import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeductionItem, TaxResult } from '../types';
import { WizardPanel } from '../components/ui/WizardPanel';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { GuideTip } from '../components/ui/GuideTip';
import { cn } from '../lib/utils';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

type DeductionCategory = 'health' | 'home' | 'charity' | 'credits';

const DEDUCTION_CATEGORIES: { id: DeductionCategory; label: string; subtitle: string; icon: string; color: string; bgColor: string; borderColor: string }[] = [
    { id: 'health', label: 'Health & FSA', subtitle: 'HSA, medical expenses', icon: 'medical_services', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/20', borderColor: 'border-rose-500' },
    { id: 'home', label: 'Mortgage & Home', subtitle: 'Interest, property tax', icon: 'home', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-500' },
    { id: 'charity', label: 'Charitable Giving', subtitle: 'Cash & non-cash donations', icon: 'volunteer_activism', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500' },
    { id: 'credits', label: 'Energy & Credits', subtitle: 'Solar, EV, adoption', icon: 'bolt', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-500' },
];

const DeductionsPage: React.FC<DeductionsPageProps> = ({ deductions, setDeductions, taxResult }) => {
    const [activeCategory, setActiveCategory] = useState<DeductionCategory | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [form, setForm] = useState<Partial<DeductionItem> & { details: any }>({
        amount: 0,
        description: '',
        category: 'mortgage',
        details: {}
    });

    const selectCategory = (cat: DeductionCategory) => {
        setActiveCategory(cat);
        setEditingId(null);
        let category: DeductionItem['category'] = 'mortgage';
        if (cat === 'health') category = 'medical';
        if (cat === 'charity') category = 'charity_cash';
        if (cat === 'credits') category = 'energy_credit';
        setForm({ amount: 0, description: '', category, details: {} });
    };

    const resetForm = () => {
        setActiveCategory(null);
        setEditingId(null);
        setForm({ amount: 0, description: '', category: 'mortgage', details: {} });
    };

    const handleEdit = (item: DeductionItem) => {
        setEditingId(item.id);
        setForm({ ...item, details: item.details || {} });
        if (['hsa_contrib', 'medical', 'fsa'].includes(item.category)) setActiveCategory('health');
        else if (['mortgage', 'property_tax', 'salt'].includes(item.category)) setActiveCategory('home');
        else if (['charity_cash', 'charity_noncash'].includes(item.category)) setActiveCategory('charity');
        else setActiveCategory('credits');
    };

    const handleSave = () => {
        if (!form.amount && form.amount !== 0) return;
        const newItem: DeductionItem = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            description: form.description || `${form.category} Deduction`,
            category: form.category as DeductionItem['category'],
            amount: form.amount || 0,
            details: form.details
        };
        if (editingId) {
            setDeductions(deductions.map(d => d.id === editingId ? newItem : d));
        } else {
            setDeductions([...deductions, newItem]);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        setDeductions(deductions.filter(d => d.id !== id));
        if (editingId === id) resetForm();
    };

    // AI Receipt Scanner
    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        setIsScanning(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });

            const response = await fetch('/api/gemini/receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, mimeType: file.type })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.total) {
                    const newItem: DeductionItem = {
                        id: Math.random().toString(36).substr(2, 9),
                        description: data.vendor || 'Receipt',
                        category: data.category === 'charity' ? 'charity_cash' : (data.category === 'medical' ? 'medical' : 'business_expense') as any,
                        amount: data.total,
                        details: { ai_scanned: true, scan_date: data.date, confidence: data.confidence }
                    };
                    setDeductions([...deductions, newItem]);
                }
            }
        } catch (err) {
            console.error('Scan failed:', err);
        } finally {
            setIsScanning(false);
        }
    }, [deductions, setDeductions]);

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const getCategoryStyle = (cat: DeductionCategory) => DEDUCTION_CATEGORIES.find(c => c.id === cat);

    const getCategoryForItem = (item: DeductionItem): DeductionCategory => {
        if (['hsa_contrib', 'medical', 'fsa'].includes(item.category)) return 'health';
        if (['mortgage', 'property_tax', 'salt'].includes(item.category)) return 'home';
        if (['charity_cash', 'charity_noncash'].includes(item.category)) return 'charity';
        return 'credits';
    };

    return (
        <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500 pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-3xl">savings</span>
                            <h1 className="text-3xl font-bold">Deductions & Credits</h1>
                        </div>
                        <p className="text-purple-200 max-w-md">Track your deductions to maximize your refund. We'll tell you if itemizing beats the standard deduction.</p>
                    </div>

                    {/* Progress Visualization */}
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 min-w-[280px]">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-purple-200">Your Deductions</span>
                            <span className="font-bold">${totalDeductions.toLocaleString()}</span>
                        </div>
                        <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((totalDeductions / 15750) * 100, 100)}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className={totalDeductions >= 15750 ? "text-emerald-300 font-bold" : "text-purple-300"}>
                                {totalDeductions >= 15750 ? "✓ Itemize!" : `$${(15750 - totalDeductions).toLocaleString()} to beat standard`}
                            </span>
                            <span className="text-purple-300">$15,750</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State or Content */}
            {deductions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-purple-500">receipt_long</span>
                    </div>
                    <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">No deductions yet</h2>
                    <p className="text-text-muted text-center max-w-md mb-8">
                        Add your medical expenses, mortgage interest, charitable donations, and more to reduce your taxable income.
                    </p>

                    {/* Quick Start Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                        {DEDUCTION_CATEGORIES.map(cat => (
                            <motion.button
                                key={cat.id}
                                whileHover={{ scale: 1.03, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => selectCategory(cat.id)}
                                className={cn(
                                    "p-5 rounded-2xl border-2 text-left transition-all duration-300",
                                    "bg-white dark:bg-card-dark border-border-light dark:border-border-dark",
                                    "hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700"
                                )}
                            >
                                <div className={`p-3 rounded-xl inline-block mb-3 ${cat.bgColor}`}>
                                    <span className={`material-symbols-outlined text-2xl ${cat.color}`}>{cat.icon}</span>
                                </div>
                                <div className="font-bold text-text-main dark:text-white">{cat.label}</div>
                                <div className="text-xs text-text-muted mt-0.5">{cat.subtitle}</div>
                            </motion.button>
                        ))}
                    </div>

                    {/* AI Scanner Callout */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        className={cn(
                            "mt-8 w-full max-w-md border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                            isDragging ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-neutral-300 dark:border-neutral-700 hover:border-purple-400",
                            isScanning && "animate-pulse"
                        )}
                    >
                        <span className="material-symbols-outlined text-3xl text-purple-500 mb-2">{isScanning ? 'hourglass_top' : 'document_scanner'}</span>
                        <div className="font-semibold text-text-main dark:text-white">
                            {isScanning ? 'Scanning receipt...' : 'Drop a receipt to auto-add'}
                        </div>
                        <div className="text-xs text-text-muted mt-1">AI extracts vendor, amount & category</div>
                    </div>
                </div>
            ) : (
                <>
                    {/* AI Scanner - Compact */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        className={cn(
                            "border border-dashed rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all bg-neutral-50/50 dark:bg-neutral-900/50",
                            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800",
                            isScanning && "animate-pulse"
                        )}
                    >
                        <div className={cn("p-2 rounded-lg", isDragging ? "bg-blue-500 text-white" : "bg-white dark:bg-neutral-800 shadow-sm")}>
                            <span className="material-symbols-outlined text-xl text-neutral-600 dark:text-neutral-400">{isScanning ? 'hourglass_top' : 'document_scanner'}</span>
                        </div>
                        <div className="flex-1">
                            <span className="font-semibold text-sm text-text-main dark:text-white">{isScanning ? 'Scanning...' : 'AI Receipt Scanner'}</span>
                            <span className="text-xs text-text-muted ml-2">Drop image to auto-add</span>
                        </div>
                    </div>

                    {/* Category Cards */}
                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block pl-1">Add New Deduction</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {DEDUCTION_CATEGORIES.map(cat => (
                                <motion.button
                                    key={cat.id}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => selectCategory(cat.id)}
                                    className={cn(
                                        "p-4 rounded-xl border text-left transition-all bg-white dark:bg-card-dark border-border-light dark:border-border-dark",
                                        "hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                            <span className="material-symbols-outlined text-lg text-neutral-600 dark:text-neutral-400">{cat.icon}</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm text-text-main dark:text-white">{cat.label}</div>
                                            <div className="text-xs text-text-muted">{cat.subtitle}</div>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Existing Deductions List */}
                    <div>
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block pl-1">Your Deductions ({deductions.length})</label>
                        <div className="space-y-3">
                            {deductions.map((item, idx) => {
                                const style = getCategoryStyle(getCategoryForItem(item));
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group"
                                    >
                                        <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                            <span className="material-symbols-outlined text-neutral-600 dark:text-neutral-400">{style?.icon || 'receipt'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-text-main dark:text-white truncate">{item.description}</div>
                                            <div className="text-xs text-text-muted">{style?.label}</div>
                                        </div>
                                        <div className="text-lg font-bold text-text-main dark:text-white font-mono tracking-tight">${item.amount.toLocaleString()}</div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(item)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                                <span className="material-symbols-outlined text-lg text-text-muted">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors group/delete">
                                                <span className="material-symbols-outlined text-lg text-neutral-400 group-hover/delete:text-red-500 transition-colors">delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Wizard Panel */}
            <WizardPanel
                isOpen={!!activeCategory}
                onClose={resetForm}
                title={editingId ? `Edit Deduction` : `Add ${getCategoryStyle(activeCategory as any)?.label}`}
            >
                <div className="space-y-8 pb-10">
                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Description</label>
                        <input
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg"
                            placeholder="e.g. ABC Hospital"
                            autoFocus
                        />
                    </div>

                    {/* Dynamic Fields by Category */}
                    {activeCategory === 'health' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all"
                                >
                                    <option value="hsa_contrib">HSA Contribution</option>
                                    <option value="medical">Medical Expense</option>
                                    <option value="fsa">FSA Contribution</option>
                                </select>
                            </div>
                            <CurrencyInput label="Amount" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                        </div>
                    )}

                    {activeCategory === 'home' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all"
                                >
                                    <option value="mortgage">Mortgage Interest (1098)</option>
                                    <option value="property_tax">Property Tax</option>
                                    <option value="salt">SALT (State/Local Tax)</option>
                                </select>
                            </div>
                            <CurrencyInput label="Amount" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                        </div>
                    )}

                    {activeCategory === 'charity' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all"
                                >
                                    <option value="charity_cash">Cash Donation</option>
                                    <option value="charity_noncash">Non-Cash (Goods)</option>
                                </select>
                            </div>
                            <CurrencyInput label="Amount / Fair Market Value" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                        </div>
                    )}

                    {activeCategory === 'credits' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Credit Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all"
                                >
                                    <option value="energy_credit">Residential Energy (Solar)</option>
                                    <option value="ev_credit">EV Credit</option>
                                    <option value="adoption_credit">Adoption Credit</option>
                                </select>
                            </div>
                            <CurrencyInput label="Qualified Cost" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check</span>
                        {editingId ? 'Save Changes' : 'Add Deduction'}
                    </button>

                    {/* Contextual Tips */}
                    <div className="pt-6 border-t border-border-light dark:border-neutral-800">
                        {activeCategory === 'health' && (
                            <GuideTip
                                title="HSA is Triple Tax-Free"
                                content="Contributions reduce taxable income, grow tax-free, and withdrawals for medical expenses are tax-free. Max it out if you can!"
                                icon="medical_services"
                                variant="highlight"
                            />
                        )}
                        {activeCategory === 'home' && (
                            <GuideTip
                                title="SALT Cap ($10,000)"
                                content="You can only deduct up to $10,000 combined for State, Local, and Property taxes. Anything above that is lost."
                                icon="public"
                                variant="highlight"
                            />
                        )}
                        {activeCategory === 'charity' && (
                            <GuideTip
                                title="Paper Trail Required"
                                content="For donations >$250, bank records aren't enough. You need a letter/receipt from the charity to claim it."
                                icon="volunteer_activism"
                                variant="highlight"
                            />
                        )}
                    </div>
                </div>
            </WizardPanel>

            {/* Deductions List */}
            {deductions.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Your Deductions</h3>
                    <div className="grid gap-3">
                        <AnimatePresence>
                            {deductions.map(item => {
                                const catStyle = getCategoryStyle(getCategoryForItem(item));
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        onClick={() => handleEdit(item)}
                                        className={`flex justify-between items-center p-5 rounded-xl border-l-4 glass-card cursor-pointer group ${catStyle?.borderColor}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-xl ${catStyle?.bgColor}`}>
                                                <span className={`material-symbols-outlined ${catStyle?.color}`}>{catStyle?.icon}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-text-main dark:text-white flex items-center gap-2">
                                                    {item.description}
                                                    {item.details?.ai_scanned && (
                                                        <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">AI Scanned</span>
                                                    )}
                                                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">edit</span>
                                                </div>
                                                <div className="text-xs text-text-muted uppercase mt-1">{item.category.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-xl text-text-main dark:text-white">${item.amount.toLocaleString()}</div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 glass-card rounded-2xl border-2 border-dashed border-border-light dark:border-border-dark">
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full inline-block mb-4">
                        <span className="material-symbols-outlined text-4xl text-text-muted">receipt</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">No deductions added yet</h3>
                    <p className="text-text-muted max-w-md mx-auto">Select a deduction type above or drop a receipt to get started.</p>
                </div>
            )}
        </div>
    );
};

export default DeductionsPage;