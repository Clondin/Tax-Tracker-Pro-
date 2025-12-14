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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                            <span className="material-symbols-outlined text-purple-500 text-2xl">receipt_long</span>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-white">Deductions & Credits</h1>
                    </div>
                    <p className="text-text-muted ml-1">Reduce your taxable income with eligible deductions</p>
                </div>

                <div className="flex gap-4">
                    <div className="glass-card rounded-xl px-5 py-3 border-l-4 border-l-purple-500">
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Total Deductions</div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">${totalDeductions.toLocaleString()}</div>
                    </div>
                    <div className="glass-card rounded-xl px-5 py-3 border-l-4 border-l-neutral-400 hidden sm:block">
                        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Standard Ded. (Target)</div>
                        <div className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">$15,750</div>
                    </div>
                </div>
            </div>

            {/* AI Receipt Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border-light dark:border-neutral-700 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/50",
                    isScanning && "animate-pulse"
                )}
            >
                <div className="flex flex-col items-center gap-3">
                    <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 group-hover:bg-primary/10")}>
                        <span className="material-symbols-outlined text-3xl">{isScanning ? 'hourglass_top' : 'document_scanner'}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-text-main dark:text-white">
                            {isScanning ? 'Scanning Receipt...' : 'AI Receipt Scanner'}
                        </h3>
                        <p className="text-text-muted text-sm">Drop a receipt image to auto-extract vendor, amount, and category</p>
                    </div>
                </div>
            </div>

            {/* Deduction Category Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block ml-1">Select Deduction Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        {DEDUCTION_CATEGORIES.map(cat => (
                            <motion.button
                                key={cat.id}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => selectCategory(cat.id)}
                                className={cn(
                                    "relative group p-5 rounded-2xl border-2 text-left transition-all duration-300",
                                    "bg-white dark:bg-card-dark border-border-light dark:border-border-dark hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-xl"
                                )}
                            >
                                <div className={`p-3 rounded-xl inline-block mb-3 transition-colors ${cat.bgColor}`}>
                                    <span className={`material-symbols-outlined text-2xl ${cat.color}`}>{cat.icon}</span>
                                </div>
                                <div className="font-bold text-text-main dark:text-white">{cat.label}</div>
                                <div className="text-xs text-text-muted mt-0.5">{cat.subtitle}</div>
                            </motion.button>
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block ml-1">Smart Tips</label>
                    <div className="space-y-4">
                        {/* Tips moved to WizardContext */}
                    </div>
                </div>
            </div>

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