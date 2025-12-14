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

const INCOME_CATEGORIES: { id: IncomeCategory; label: string; subtitle: string; icon: string; color: string; bgColor: string; borderColor: string }[] = [
    { id: 'W-2', label: 'W-2 Employment', subtitle: 'Wages, salaries, tips', icon: 'work', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', borderColor: 'border-indigo-500' },
    { id: 'Business', label: 'Self-Employment', subtitle: '1099-NEC, freelance', icon: 'storefront', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-500' },
    { id: 'Investment', label: 'Investments', subtitle: 'Dividends, interest, gains', icon: 'trending_up', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-500' },
    { id: 'Rental', label: 'Rental Property', subtitle: 'Real estate income', icon: 'home_work', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500' },
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

    // Chart data
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
        <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500 pb-20">
            {showPaystubModal && (
                <PaystubIngestionModal
                    onSave={handlePaystubImport}
                    onClose={() => setShowPaystubModal(false)}
                    initialData={selectedPaystub}
                />
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <span className="material-symbols-outlined text-primary text-2xl">payments</span>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-white">Income & Wages</h1>
                    </div>
                    <p className="text-text-muted ml-1">Add all your income sources for the tax year</p>
                </div>

                {incomes.length > 0 && (
                    <div className="flex gap-4">
                        <div className="glass-card rounded-xl px-5 py-3 border-l-4 border-l-emerald-500">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Income</div>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">${totalIncome.toLocaleString()}</div>
                        </div>
                        <div className="glass-card rounded-xl px-5 py-3 border-l-4 border-l-blue-500">
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Withheld</div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${totalWithholding.toLocaleString()}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Income Type Cards */}
            <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 block ml-1">Select Income Type</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {INCOME_CATEGORIES.map(cat => (
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

            {/* Wizard Panel for Data Entry */}
            <WizardPanel
                isOpen={!!activeCategory}
                onClose={resetForm}
                title={editingId ? `Edit ${form.description}` : `Add ${getCategoryStyle(activeCategory as any)?.label}`}
            >
                <div className="space-y-8 pb-10">
                    {/* Auto-Scan Banner */}
                    {activeCategory === 'W-2' && (
                        <div
                            onClick={() => { setSelectedPaystub(undefined); setShowPaystubModal(true); }}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg hover:scale-[1.01] transition-all relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                                    <span className="material-symbols-outlined text-2xl">document_scanner</span>
                                </div>
                                <div>
                                    <div className="font-bold text-lg">Auto-Scan Paystub</div>
                                    <div className="text-indigo-100 text-sm">Upload a PDF or image to instantly fill this form</div>
                                </div>
                                <span className="material-symbols-outlined ml-auto">arrow_forward</span>
                            </div>
                        </div>
                    )}

                    {/* Owner Selector */}
                    {isMarriedJoint && (
                        <div className="p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex">
                            {['primary', 'spouse'].map(owner => (
                                <button
                                    key={owner}
                                    onClick={() => setForm({ ...form, owner })}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
                                        form.owner === owner
                                            ? "bg-white dark:bg-neutral-700 text-primary shadow-sm"
                                            : "text-text-muted hover:text-text-main"
                                    )}
                                >
                                    {owner === 'primary' ? (taxPayer?.firstName || 'Taxpayer') : (taxPayer?.spouseFirstName || 'Spouse')}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">
                            {activeCategory === 'W-2' ? 'Employer Name' : activeCategory === 'Business' ? 'Business Name' : activeCategory === 'Investment' ? 'Payer Name' : 'Property Name'}
                        </label>
                        <input
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-lg"
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

                                <div className="pt-4 border-t border-border-light dark:border-border-dark">
                                    <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
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
                                    <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Income Type</label>
                                    <select
                                        className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all"
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
                                        <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Days Rented</label>
                                        <input type="number" value={form.details?.rental_days_rented || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_rented: parseFloat(e.target.value) } }))} className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted block mb-1.5 uppercase tracking-wide">Days Personal</label>
                                        <input type="number" value={form.details?.rental_days_personal || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_personal: parseFloat(e.target.value) } }))} className="w-full rounded-xl bg-white dark:bg-neutral-900 border-2 border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:border-primary transition-all" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleSaveIncome}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">check</span>
                        {editingId ? 'Save Changes' : 'Add Income'}
                    </button>
                </div>
            </WizardPanel>

            {/* Income List */}
            {incomes.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Your Income Sources</h3>
                        <button
                            onClick={() => setShowChart(!showChart)}
                            className="text-xs font-medium text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">{showChart ? 'visibility_off' : 'bar_chart'}</span>
                            {showChart ? 'Hide Chart' : 'Show Chart'}
                        </button>
                    </div>

                    {/* Collapsible Chart */}
                    <AnimatePresence>
                        {showChart && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="glass-card rounded-xl p-5 h-64 overflow-hidden"
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                                        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `W${v}`} interval={10} />
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Cumulative']}
                                            labelFormatter={(l) => `Week ${l}`}
                                        />
                                        <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid gap-3">
                        <AnimatePresence>
                            {incomes.map(item => {
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
                                                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">edit</span>
                                                </div>
                                                <div className="text-xs text-text-muted flex flex-wrap gap-2 items-center mt-1">
                                                    {isMarriedJoint && (
                                                        <span className={`px-2 py-0.5 rounded-full font-bold ${item.owner === 'spouse' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                            {item.owner === 'spouse' ? 'Spouse' : 'You'}
                                                        </span>
                                                    )}
                                                    <span className="uppercase">{item.type.replace('_', ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className={`font-bold text-xl ${item.amount < 0 ? 'text-red-500' : 'text-text-main dark:text-white'}`}>
                                                    ${Math.abs(item.amount).toLocaleString()}
                                                </div>
                                            </div>
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
                        <span className="material-symbols-outlined text-4xl text-text-muted">account_balance_wallet</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">No income added yet</h3>
                    <p className="text-text-muted max-w-md mx-auto">Select an income type above to get started. You can add multiple sources including W-2 employment, self-employment, investments, and rental income.</p>
                </div>
            )}
        </div>
    );
};

export default IncomePage;