import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { IncomeItem, TaxResult, TaxPayer, Paystub } from '../types';
import PaystubIngestionModal from '../components/PaystubIngestionModal';

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
        if (activeCategory === cat && !editingId) {
            setActiveCategory(null);
            return;
        }
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="flex flex-col gap-8 h-full animate-in fade-in duration-500">
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
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-3">
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Income</div>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">${totalIncome.toLocaleString()}</div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-5 py-3">
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
                        <button
                            key={cat.id}
                            onClick={() => selectCategory(cat.id)}
                            className={`relative group p-5 rounded-2xl border-2 text-left transition-all duration-300 ${activeCategory === cat.id
                                    ? `${cat.bgColor} ${cat.borderColor} shadow-lg scale-[1.02]`
                                    : 'bg-white dark:bg-card-dark border-border-light dark:border-border-dark hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-md'
                                }`}
                        >
                            <div className={`p-3 rounded-xl inline-block mb-3 transition-colors ${activeCategory === cat.id ? cat.bgColor : 'bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700'}`}>
                                <span className={`material-symbols-outlined text-2xl ${activeCategory === cat.id ? cat.color : 'text-neutral-500'}`}>{cat.icon}</span>
                            </div>
                            <div className={`font-bold ${activeCategory === cat.id ? cat.color : 'text-text-main dark:text-white'}`}>{cat.label}</div>
                            <div className="text-xs text-text-muted mt-0.5">{cat.subtitle}</div>
                            {activeCategory === cat.id && (
                                <div className={`absolute top-3 right-3 ${cat.color}`}>
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form Panel */}
            {activeCategory && (
                <div className="bg-white dark:bg-card-dark rounded-2xl border border-border-light dark:border-border-dark shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    {editingId && (
                        <div className="bg-blue-500 text-white text-xs font-bold text-center py-2">
                            <span className="material-symbols-outlined text-sm align-middle mr-1">edit</span>
                            EDITING MODE
                        </div>
                    )}

                    <div className="p-6 lg:p-8">
                        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                                <span className={`material-symbols-outlined ${getCategoryStyle(activeCategory)?.color}`}>
                                    {getCategoryStyle(activeCategory)?.icon}
                                </span>
                                {editingId ? `Edit ${form.description}` : `Add ${getCategoryStyle(activeCategory)?.label}`}
                            </h2>

                            <div className="flex gap-2">
                                {activeCategory === 'W-2' && (
                                    <button
                                        onClick={() => { setSelectedPaystub(undefined); setShowPaystubModal(true); }}
                                        className="text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <span className="material-symbols-outlined text-lg">document_scanner</span>
                                        Auto-Scan Paystub
                                    </button>
                                )}
                                <button onClick={resetForm} className="text-sm font-medium text-text-muted px-4 py-2.5 border border-border-light dark:border-border-dark rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>

                        {/* Owner Selector for Joint Returns */}
                        {isMarriedJoint && (
                            <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-border-light dark:border-border-dark">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-3 block">Who earned this income?</label>
                                <div className="flex gap-3">
                                    {['primary', 'spouse'].map(owner => (
                                        <button
                                            key={owner}
                                            onClick={() => setForm({ ...form, owner })}
                                            className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${form.owner === owner
                                                    ? 'bg-primary text-white shadow-md'
                                                    : 'bg-white dark:bg-neutral-700 text-text-muted border border-border-light dark:border-border-dark hover:border-primary'
                                                }`}
                                        >
                                            {owner === 'primary' ? (taxPayer?.firstName || 'Taxpayer') : (taxPayer?.spouseFirstName || 'Spouse')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Common: Description */}
                            <div>
                                <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">
                                    {activeCategory === 'W-2' ? 'Employer Name' : activeCategory === 'Business' ? 'Business / Client Name' : activeCategory === 'Investment' ? 'Brokerage / Payer' : 'Property Description'}
                                </label>
                                <input
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full rounded-xl bg-background-light dark:bg-neutral-800 border-2 border-border-light dark:border-neutral-700 px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-text-main dark:text-white"
                                    placeholder={activeCategory === 'W-2' ? 'e.g. Acme Corporation' : activeCategory === 'Business' ? 'e.g. Freelance Web Development' : activeCategory === 'Investment' ? 'e.g. Fidelity Investments' : 'e.g. 123 Main St Rental'}
                                />
                            </div>

                            {/* W-2 Specific Fields */}
                            {activeCategory === 'W-2' && (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <div>
                                            <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1.5">Box 1 - Wages</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2.5 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 outline-none transition-colors" placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1.5">Box 2 - Fed Tax Withheld</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.withholding || ''} onChange={e => setForm({ ...form, withholding: parseFloat(e.target.value) || 0 })} className="w-full pl-7 pr-3 py-2.5 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-neutral-900 focus:border-indigo-500 outline-none transition-colors" placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-muted block mb-1.5">Box 3 - SS Wages</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.details?.w2_box3_ss_wages || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, w2_box3_ss_wages: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border-light dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-text-muted block mb-1.5">Box 5 - Medicare Wages</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.details?.w2_box5_med_wages || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, w2_box5_med_wages: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border-light dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-border-light dark:border-border-dark">
                                        <h4 className="text-sm font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg text-text-muted">savings</span>
                                            Pre-Tax Benefits (Box 12)
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-medium text-text-muted block mb-1.5">Code D - 401(k)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                    <input type="number" value={form.details?.w2_box12_code_d_401k || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, w2_box12_code_d_401k: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border-light dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-text-muted block mb-1.5">Code W - HSA</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                    <input type="number" value={form.details?.w2_box12_code_w_hsa || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, w2_box12_code_w_hsa: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border-light dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium text-text-muted block mb-1.5">Box 10 - Dep. Care</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                    <input type="number" value={form.details?.w2_box10_dependent_care || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, w2_box10_dependent_care: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-border-light dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-primary transition-colors" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Business Fields */}
                            {activeCategory === 'Business' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Gross Receipts / Income</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="0.00" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Total Expenses</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.details?.business_expense_total || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, business_expense_total: parseFloat(e.target.value) } }))} className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 mb-3">Home Office</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="number" placeholder="Office Sqft" value={form.details?.home_office_sqft || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, home_office_sqft: parseFloat(e.target.value) } }))} className="p-2.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 outline-none focus:border-amber-500" />
                                                <input type="number" placeholder="Total Sqft" value={form.details?.home_total_sqft || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, home_total_sqft: parseFloat(e.target.value) } }))} className="p-2.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 outline-none focus:border-amber-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 mb-3">Vehicle Mileage</h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="number" placeholder="Business Miles" value={form.details?.vehicle_business_miles || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, vehicle_business_miles: parseFloat(e.target.value) } }))} className="p-2.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 outline-none focus:border-amber-500" />
                                                <input type="number" placeholder="Total Miles" value={form.details?.vehicle_total_miles || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, vehicle_total_miles: parseFloat(e.target.value) } }))} className="p-2.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-neutral-900 outline-none focus:border-amber-500" />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Investment Fields */}
                            {activeCategory === 'Investment' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Income Type</label>
                                            <select
                                                className="w-full rounded-xl bg-background-light dark:bg-neutral-800 border-2 border-border-light dark:border-neutral-700 px-4 py-3.5 outline-none focus:border-primary transition-all"
                                                value={form.type}
                                                onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                                            >
                                                <option value="1099_div">Dividends (1099-DIV)</option>
                                                <option value="1099_int">Interest (1099-INT)</option>
                                                <option value="stock">Stock Sale (1099-B)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Amount / Gain</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="0.00" />
                                            </div>
                                        </div>
                                    </div>
                                    {form.type === 'stock' && (
                                        <div className="grid grid-cols-2 gap-4 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                            <div>
                                                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1.5">Cost Basis</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                                    <input type="number" value={form.details?.cost_basis || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, cost_basis: parseFloat(e.target.value) } }))} className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900 outline-none focus:border-emerald-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1.5">Acquisition Date</label>
                                                <input type="date" value={form.details?.acquisition_date || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, acquisition_date: e.target.value } }))} className="w-full px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-neutral-900 outline-none focus:border-emerald-500" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Rental Fields */}
                            {activeCategory === 'Rental' && (
                                <>
                                    <div>
                                        <label className="text-sm font-semibold text-text-main dark:text-white block mb-2">Net Rental Income / Loss</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">$</span>
                                            <input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="w-full pl-8 pr-4 py-3.5 rounded-xl border-2 border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Enter negative for loss" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                                        <div>
                                            <label className="text-xs font-bold text-purple-700 dark:text-purple-400 block mb-1.5">Days Rented</label>
                                            <input type="number" value={form.details?.rental_days_rented || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_rented: parseFloat(e.target.value) } }))} className="w-full px-3 py-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-neutral-900 outline-none focus:border-purple-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-purple-700 dark:text-purple-400 block mb-1.5">Days Personal Use</label>
                                            <input type="number" value={form.details?.rental_days_personal || ''} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_days_personal: parseFloat(e.target.value) } }))} className="w-full px-3 py-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-neutral-900 outline-none focus:border-purple-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-purple-700 dark:text-purple-400 block mb-1.5">Property Type</label>
                                            <select value={form.details?.rental_type || 'residential'} onChange={e => setForm(f => ({ ...f, details: { ...f.details, rental_type: e.target.value } }))} className="w-full px-3 py-2.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-neutral-900 outline-none focus:border-purple-500">
                                                <option value="residential">Residential</option>
                                                <option value="commercial">Commercial</option>
                                                <option value="short_term">Short Term</option>
                                            </select>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleSaveIncome}
                            className={`w-full mt-8 text-white px-8 py-4 rounded-xl font-bold text-base shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 ${editingId
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary'
                                }`}
                        >
                            {editingId ? 'Save Changes' : `Add ${getCategoryStyle(activeCategory)?.label}`}
                        </button>
                    </div>
                </div>
            )}

            {/* Income List */}
            {incomes.length > 0 ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Your Income Sources ({incomes.length})</h3>
                        {incomes.length > 0 && (
                            <button
                                onClick={() => setShowChart(!showChart)}
                                className="text-xs font-medium text-text-muted hover:text-primary flex items-center gap-1 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">{showChart ? 'visibility_off' : 'bar_chart'}</span>
                                {showChart ? 'Hide Chart' : 'Show Chart'}
                            </button>
                        )}
                    </div>

                    {/* Collapsible Chart */}
                    {showChart && (
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-5 h-56 animate-in slide-in-from-top-2 duration-300">
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
                        </div>
                    )}

                    <div className="grid gap-3">
                        {incomes.map(item => {
                            const catStyle = getCategoryStyle(getCategoryForItem(item));
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleEdit(item)}
                                    className={`flex justify-between items-center p-5 rounded-xl border-l-4 bg-white dark:bg-card-dark border border-border-light dark:border-border-dark transition-all cursor-pointer group hover:shadow-lg hover:-translate-y-0.5 ${catStyle?.borderColor} ${editingId === item.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
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
                                                {item.details?.w2_box12_code_d_401k ? <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">401k</span> : null}
                                                {item.originalPaystub && (
                                                    <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
                                                        <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                                        AI Paystub
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`font-bold text-xl ${item.amount < 0 ? 'text-red-500' : 'text-text-main dark:text-white'}`}>
                                                ${Math.abs(item.amount).toLocaleString()}
                                            </div>
                                            {item.withholding > 0 && (
                                                <div className="text-xs text-text-muted">-${item.withholding.toLocaleString()} withheld</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : !activeCategory && (
                <div className="text-center py-16 bg-white dark:bg-card-dark rounded-2xl border-2 border-dashed border-border-light dark:border-border-dark">
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