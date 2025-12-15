import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeductionItem, TaxResult } from '../types';
import { WizardPanel } from '../components/ui/WizardPanel';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { cn } from '../lib/utils';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

type DeductionCategory = 'health' | 'home' | 'charity' | 'credits';

const DEDUCTION_CATEGORIES: { id: DeductionCategory; label: string; subtitle: string; icon: string; gradient: string }[] = [
    { id: 'health', label: 'Health & FSA', subtitle: 'HSA, medical expenses', icon: 'medical_services', gradient: 'from-rose-500 to-pink-500' },
    { id: 'home', label: 'Mortgage & Home', subtitle: 'Interest, property tax', icon: 'home', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'charity', label: 'Charitable Giving', subtitle: 'Cash & non-cash donations', icon: 'volunteer_activism', gradient: 'from-violet-500 to-purple-500' },
    { id: 'credits', label: 'Energy & Credits', subtitle: 'Solar, EV, adoption', icon: 'bolt', gradient: 'from-amber-500 to-orange-500' },
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
        <div className="flex flex-col gap-8 h-full pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-3"
                    >
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-glow-sm">
                            <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Tax Deductions
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-display font-bold text-white mb-2"
                    >
                        Deductions & Credits
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-zinc-400"
                    >
                        Reduce your taxable income with eligible deductions
                    </motion.p>
                </div>

                {deductions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card rounded-2xl px-6 py-4 border-l-4 border-l-emerald-500"
                    >
                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total Deductions</div>
                        <div className="text-2xl font-display font-bold text-white tabular-nums">${totalDeductions.toLocaleString()}</div>
                    </motion.div>
                )}
            </div>

            {/* AI Receipt Drop Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group overflow-hidden",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-white/10 hover:border-primary/50",
                    isScanning && "animate-pulse"
                )}
            >
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br from-primary/10 via-accent-cyan/10 to-accent-pink/10 opacity-0 transition-opacity",
                    isDragging && "opacity-100"
                )} />
                <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className={cn(
                        "p-4 rounded-full transition-all",
                        isDragging ? "bg-gradient-to-br from-primary to-accent-cyan text-white scale-110" : "bg-white/5 group-hover:bg-primary/10"
                    )}>
                        <span className="material-symbols-outlined text-3xl">{isScanning ? 'hourglass_top' : 'document_scanner'}</span>
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-white">
                            {isScanning ? 'Scanning Receipt...' : 'AI Receipt Scanner'}
                        </h3>
                        <p className="text-zinc-500 text-sm">Drop a receipt image to auto-extract vendor, amount, and category</p>
                    </div>
                </div>
            </motion.div>

            {/* Deduction Category Cards */}
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">
                    Select Deduction Type
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {DEDUCTION_CATEGORIES.map((cat, i) => (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => selectCategory(cat.id)}
                            className="relative group p-6 rounded-2xl glass-card text-left transition-all duration-300 overflow-hidden"
                        >
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
                                cat.gradient
                            )} />
                            <div className="relative z-10">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                                    cat.gradient
                                )}>
                                    <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
                                </div>
                                <div className="font-display font-bold text-white mb-1">{cat.label}</div>
                                <div className="text-xs text-zinc-500">{cat.subtitle}</div>
                            </div>
                        </motion.button>
                    ))}
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
                        <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Description</label>
                        <input
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                            placeholder="e.g. ABC Hospital"
                            autoFocus
                        />
                    </div>

                    {/* Dynamic Fields by Category */}
                    {activeCategory === 'health' && (
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all"
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
                                <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all"
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
                                <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all"
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
                                <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Credit Type</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
                                    className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all"
                                >
                                    <option value="energy_credit">Residential Energy (Solar)</option>
                                    <option value="ev_credit">EV Credit</option>
                                    <option value="adoption_credit">Adoption Credit</option>
                                </select>
                            </div>
                            <CurrencyInput label="Qualified Cost" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSave}
                        className="w-full bg-gradient-to-r from-primary via-accent-cyan to-accent-pink text-white font-bold py-4 rounded-xl shadow-glow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check</span>
                        {editingId ? 'Save Changes' : 'Add Deduction'}
                    </motion.button>
                </div>
            </WizardPanel>

            {/* Deductions List */}
            {deductions.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-display font-bold text-white">Your Deductions</h3>
                    <div className="grid gap-3">
                        <AnimatePresence>
                            {deductions.map((item, i) => {
                                const catStyle = getCategoryStyle(getCategoryForItem(item));
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => handleEdit(item)}
                                        className="flex justify-between items-center p-5 rounded-2xl glass-card cursor-pointer group hover:ring-1 hover:ring-primary/30 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                                                catStyle?.gradient
                                            )}>
                                                <span className="material-symbols-outlined text-white">{catStyle?.icon}</span>
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {item.description}
                                                    {item.details?.ai_scanned && (
                                                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase">AI Scanned</span>
                                                    )}
                                                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">edit</span>
                                                </div>
                                                <div className="text-xs text-zinc-500 uppercase mt-1">{item.category.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-display font-bold text-xl text-white tabular-nums">${item.amount.toLocaleString()}</div>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="p-2 rounded-lg text-zinc-500 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 gradient-border rounded-2xl"
                >
                    <div className="p-4 bg-white/5 rounded-full inline-block mb-4">
                        <span className="material-symbols-outlined text-4xl text-zinc-500">receipt</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">No deductions added yet</h3>
                    <p className="text-zinc-500 max-w-md mx-auto">Select a deduction type above or drop a receipt to get started.</p>
                </motion.div>
            )}
        </div>
    );
};

export default DeductionsPage;
