import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IncomeItem, TaxResult, TaxPayer, Paystub } from '../types';
import PaystubIngestionModal from '../components/PaystubIngestionModal';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { WizardPanel } from '../components/ui/WizardPanel';
import { cn } from '../lib/utils';

interface IncomePageProps {
    incomes: IncomeItem[];
    setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
    taxResult: TaxResult | null;
    taxPayer?: TaxPayer;
}

type IncomeCategory = 'W-2' | 'Business' | 'Investment' | 'Rental';

const INCOME_CATEGORIES: { id: IncomeCategory; label: string; subtitle: string; icon: string; gradient: string }[] = [
    { id: 'W-2', label: 'W-2 Employment', subtitle: 'Wages, salaries, tips', icon: 'work', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'Business', label: 'Self-Employment', subtitle: '1099-NEC, freelance', icon: 'storefront', gradient: 'from-amber-500 to-orange-500' },
    { id: 'Investment', label: 'Investments', subtitle: 'Dividends, interest, gains', icon: 'trending_up', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'Rental', label: 'Rental Property', subtitle: 'Real estate income', icon: 'home_work', gradient: 'from-violet-500 to-purple-500' },
];

const IncomePage: React.FC<IncomePageProps> = ({ incomes, setIncomes, taxResult, taxPayer }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeCategory, setActiveCategory] = useState<IncomeCategory | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPaystubModal, setShowPaystubModal] = useState(false);
    const [selectedPaystub, setSelectedPaystub] = useState<Paystub | undefined>(undefined);
    const [showChart, setShowChart] = useState(false);

    const [form, setForm] = useState<Partial<IncomeItem> & { details: any }>({
        description: '',
        amount: 0,
        withholding: 0,
        type: 'w2',
        payFrequency: 'annual',
        owner: 'primary',
        details: {}
    });

    useEffect(() => {
        if (location.state && location.state.editId) {
            const item = incomes.find(i => i.id === location.state.editId);
            if (item) {
                handleEdit(item);
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, incomes]);

    const isMarriedJoint = taxPayer?.filingStatus === 'married_joint';

    const resetForm = () => {
        setEditingId(null);
        setActiveCategory(null);
        setForm({ description: '', amount: 0, withholding: 0, type: 'w2', payFrequency: 'annual', owner: 'primary', details: {} });
    };

    const selectCategory = (cat: IncomeCategory) => {
        setActiveCategory(cat);
        setEditingId(null);
        let type: IncomeItem['type'] = 'w2';
        if (cat === 'Business') type = '1099_nec';
        if (cat === 'Investment') type = '1099_div';
        if (cat === 'Rental') type = 'rental';
        setForm({ description: '', amount: 0, withholding: 0, type, payFrequency: 'annual', owner: 'primary', details: {} });
    };

    const handleEdit = (item: IncomeItem) => {
        if (item.originalPaystub) {
            setSelectedPaystub(item.originalPaystub);
            setShowPaystubModal(true);
            return;
        }
        setEditingId(item.id);
        setForm({ ...item, details: item.details || {} });
        if (item.type === 'w2') setActiveCategory('W-2');
        else if (item.type === '1099_nec' || item.type === 'ssa_1099') setActiveCategory('Business');
        else if (item.type === 'rental') setActiveCategory('Rental');
        else setActiveCategory('Investment');
    };

    const handleSaveIncome = () => {
        if (!form.amount && form.amount !== 0) return;
        const newItem: IncomeItem = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            description: form.description || `${activeCategory} Income`,
            type: form.type as IncomeItem['type'],
            amount: form.amount,
            withholding: form.withholding || 0,
            payFrequency: form.payFrequency as any,
            owner: form.owner,
            details: form.details
        };
        if (editingId) {
            setIncomes(incomes.map(i => i.id === editingId ? newItem : i));
        } else {
            setIncomes([...incomes, newItem]);
        }
        resetForm();
    };

    const handlePaystubImport = (item: IncomeItem) => {
        const exists = incomes.find(i => i.id === item.id);
        if (exists) {
            setIncomes(incomes.map(i => i.id === item.id ? item : i));
        } else {
            setIncomes([...incomes, item]);
        }
        setShowPaystubModal(false);
        setSelectedPaystub(undefined);
    };

    const handleDelete = (id: string) => {
        setIncomes(incomes.filter(i => i.id !== id));
        if (editingId === id) resetForm();
    };

    const totalIncome = incomes.reduce((a, b) => a + b.amount, 0);
    const totalWithholding = incomes.reduce((a, b) => a + (b.withholding || 0), 0);

    const getCategoryForItem = (item: IncomeItem): IncomeCategory => {
        if (item.type === 'w2') return 'W-2';
        if (item.type === '1099_nec' || item.type === 'ssa_1099') return 'Business';
        if (item.type === 'rental') return 'Rental';
        return 'Investment';
    };

    const getCategoryStyle = (cat: IncomeCategory) => INCOME_CATEGORIES.find(c => c.id === cat);

    const chartData = Array.from({ length: 52 }, (_, i) => i + 1).map(week => {
        let weeklyTotal = 0;
        incomes.forEach(inc => {
            const amt = inc.amount;
            let perPeriod = 0;
            let periods = 1;
            if (inc.payFrequency === 'weekly') { perPeriod = amt / 52; periods = week; }
            else if (inc.payFrequency === 'biweekly') { perPeriod = amt / 26; periods = Math.floor(week / 2); }
            else if (inc.payFrequency === 'semimonthly') { perPeriod = amt / 24; periods = Math.floor(week / 2.16); }
            else if (inc.payFrequency === 'monthly') { perPeriod = amt / 12; periods = Math.floor(week / 4.33); }
            else { if (inc.type === 'w2') perPeriod = amt / 52; periods = week; }
            weeklyTotal += (perPeriod * periods);
        });
        return { week, cumulative: weeklyTotal };
    });

    return (
        <div className="flex flex-col gap-8 h-full pb-20">
            {showPaystubModal && (
                <PaystubIngestionModal
                    onSave={handlePaystubImport}
                    onClose={() => setShowPaystubModal(false)}
                    initialData={selectedPaystub}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 mb-3"
                    >
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-glow-cyan">
                            <span className="material-symbols-outlined text-white text-2xl">payments</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            Income Sources
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl md:text-5xl font-display font-bold text-white mb-2"
                    >
                        Income & Wages
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-zinc-400"
                    >
                        Add all your income sources for the tax year
                    </motion.p>
                </div>

                {incomes.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4"
                    >
                        <div className="glass-card rounded-2xl px-6 py-4 border-l-4 border-l-emerald-500">
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total Income</div>
                            <div className="text-2xl font-display font-bold text-white tabular-nums">${totalIncome.toLocaleString()}</div>
                        </div>
                        <div className="glass-card rounded-2xl px-6 py-4 border-l-4 border-l-accent-cyan">
                            <div className="text-xs font-bold text-accent-cyan uppercase tracking-widest">Withheld</div>
                            <div className="text-2xl font-display font-bold text-white tabular-nums">${totalWithholding.toLocaleString()}</div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Income Type Cards */}
            <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">
                    Select Income Type
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {INCOME_CATEGORIES.map((cat, i) => (
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

            {/* Wizard Panel for Data Entry */}
            <WizardPanel
                isOpen={!!activeCategory}
                onClose={resetForm}
                title={editingId ? `Edit ${form.description}` : `Add ${getCategoryStyle(activeCategory as any)?.label}`}
            >
                <div className="space-y-8 pb-10">
                    {/* Auto-Scan Banner */}
                    {activeCategory === 'W-2' && (
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            onClick={() => { resetForm(); setShowPaystubModal(true); }}
                            className="relative bg-gradient-to-r from-primary via-accent-cyan to-accent-pink rounded-2xl p-6 text-white cursor-pointer overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan via-accent-pink to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                                    <span className="material-symbols-outlined text-2xl">document_scanner</span>
                                </div>
                                <div>
                                    <div className="font-display font-bold text-lg">Auto-Scan Paystub</div>
                                    <div className="text-white/70 text-sm">Upload a PDF or image to instantly fill this form</div>
                                </div>
                                <span className="material-symbols-outlined ml-auto">arrow_forward</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Owner Selector */}
                    {isMarriedJoint && (
                        <div className="p-1 bg-white/5 rounded-xl flex">
                            {['primary', 'spouse'].map(owner => (
                                <button
                                    key={owner}
                                    onClick={() => setForm({ ...form, owner })}
                                    className={cn(
                                        "flex-1 py-3 rounded-lg text-sm font-bold transition-all",
                                        form.owner === owner
                                            ? "bg-gradient-to-r from-primary to-accent-cyan text-white shadow-glow-sm"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    {owner === 'primary' ? (taxPayer?.firstName || 'Taxpayer') : (taxPayer?.spouseFirstName || 'Spouse')}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">
                            {activeCategory === 'W-2' ? 'Employer Name' : activeCategory === 'Business' ? 'Business Name' : activeCategory === 'Investment' ? 'Payer Name' : 'Property Name'}
                        </label>
                        <input
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                            placeholder="e.g. Acme Corp"
                            autoFocus
                        />
                    </div>

                    {/* Dynamic Form Fields */}
                    <div className="space-y-6">
                        {activeCategory === 'W-2' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <CurrencyInput label="Box 1 - Wages" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                                    <CurrencyInput label="Box 2 - Fed Tax" value={form.withholding || 0} onChange={v => setForm({ ...form, withholding: v })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <CurrencyInput label="Box 3 - SS Wages" value={form.details?.w2_box3_ss_wages || 0} onChange={v => setForm(f => ({ ...f, details: { ...f.details, w2_box3_ss_wages: v } }))} />
                                    <CurrencyInput label="Box 5 - Med Wages" value={form.details?.w2_box5_med_wages || 0} onChange={v => setForm(f => ({ ...f, details: { ...f.details, w2_box5_med_wages: v } }))} />
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-zinc-300">
                                        <span className="material-symbols-outlined text-primary">savings</span>
                                        Pre-Tax Benefits (Box 12)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <CurrencyInput label="Code D - 401(k)" value={form.details?.w2_box12_code_d_401k || 0} onChange={v => setForm(f => ({ ...f, details: { ...f.details, w2_box12_code_d_401k: v } }))} />
                                        <CurrencyInput label="Code W - HSA" value={form.details?.w2_box12_code_w_hsa || 0} onChange={v => setForm(f => ({ ...f, details: { ...f.details, w2_box12_code_w_hsa: v } }))} />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeCategory === 'Business' && (
                            <>
                                <CurrencyInput label="Gross Receipts" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                                <CurrencyInput label="Total Expenses" value={form.details?.business_expense_total || 0} onChange={v => setForm(f => ({ ...f, details: { ...f.details, business_expense_total: v } }))} />
                            </>
                        )}

                        {activeCategory === 'Investment' && (
                            <>
                                <div>
                                    <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Income Type</label>
                                    <select
                                        className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all"
                                        value={form.type}
                                        onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                    >
                                        <option value="1099_div">Dividends (1099-DIV)</option>
                                        <option value="1099_int">Interest (1099-INT)</option>
                                        <option value="stock">Stock Sale (1099-B)</option>
                                    </select>
                                </div>
                                <CurrencyInput label="Amount / Gain" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                            </>
                        )}

                        {activeCategory === 'Rental' && (
                            <>
                                <CurrencyInput label="Net Rental Income" value={form.amount || 0} onChange={v => setForm({ ...form, amount: v })} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Days Rented</label>
                                        <input type="number" value={form.details?.rental_days_rented || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_rented: parseFloat(e.target.value) } }))} className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">Days Personal</label>
                                        <input type="number" value={form.details?.rental_days_personal || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_personal: parseFloat(e.target.value) } }))} className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-primary text-white transition-all" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveIncome}
                        className="w-full bg-gradient-to-r from-primary via-accent-cyan to-accent-pink text-white font-bold py-4 rounded-xl shadow-glow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check</span>
                        {editingId ? 'Save Changes' : 'Add Income'}
                    </motion.button>
                </div>
            </WizardPanel>

            {/* Income List */}
            {incomes.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-display font-bold text-white">Your Income Sources</h3>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowChart(!showChart)}
                            className="text-xs font-bold text-zinc-400 hover:text-primary flex items-center gap-2 px-3 py-2 rounded-lg glass-light transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">{showChart ? 'visibility_off' : 'bar_chart'}</span>
                            {showChart ? 'Hide Chart' : 'Show Chart'}
                        </motion.button>
                    </div>

                    {/* Collapsible Chart */}
                    <AnimatePresence>
                        {showChart && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="glass-card rounded-2xl p-6 h-64 overflow-hidden"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                                        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#71717a' }} tickFormatter={(v) => `W${v}`} interval={10} />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Cumulative']}
                                            labelFormatter={(l) => `Week ${l}`}
                                        />
                                        <Area type="monotone" dataKey="cumulative" stroke="#22d3ee" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid gap-3">
                        <AnimatePresence>
                            {incomes.map((item, i) => {
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
                                                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500">edit</span>
                                                </div>
                                                <div className="text-xs text-zinc-500 flex flex-wrap gap-2 items-center mt-1">
                                                    {isMarriedJoint && (
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full font-bold",
                                                            item.owner === 'spouse' ? 'bg-accent-pink/20 text-accent-pink' : 'bg-accent-cyan/20 text-accent-cyan'
                                                        )}>
                                                            {item.owner === 'spouse' ? 'Spouse' : 'You'}
                                                        </span>
                                                    )}
                                                    <span className="uppercase">{item.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={cn(
                                                    "font-display font-bold text-xl tabular-nums",
                                                    item.amount < 0 ? 'text-danger' : 'text-white'
                                                )}>
                                                    ${Math.abs(item.amount).toLocaleString()}
                                                </div>
                                            </div>
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
                        <span className="material-symbols-outlined text-4xl text-zinc-500">account_balance_wallet</span>
                    </div>
                    <h3 className="text-xl font-display font-bold text-white mb-2">No income added yet</h3>
                    <p className="text-zinc-500 max-w-md mx-auto">Select an income type above to get started. You can add multiple sources including W-2 employment, self-employment, investments, and rental income.</p>
                </motion.div>
            )}
        </div>
    );
};

export default IncomePage;
