import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { IncomeItem, TaxResult, TaxPayer, Paystub } from '../types';
import PaystubIngestionModal from '../components/PaystubIngestionModal';

interface IncomePageProps {
    incomes: IncomeItem[];
    setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
    taxResult: TaxResult | null;
    taxPayer?: TaxPayer; 
}

const HelpTooltip: React.FC<{text: string}> = ({text}) => (
    <div className="group relative inline-block ml-1 align-middle">
        <span className="material-symbols-outlined text-[16px] text-neutral-400 hover:text-primary dark:hover:text-white cursor-help">help</span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
        </div>
    </div>
);

const IncomePage: React.FC<IncomePageProps> = ({ incomes, setIncomes, taxResult, taxPayer }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'W-2' | 'Business' | 'Investment' | 'Rental'>('W-2');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showReconciliation, setShowReconciliation] = useState(false);
    const [showPaystubModal, setShowPaystubModal] = useState(false);
    const [selectedPaystub, setSelectedPaystub] = useState<Paystub | undefined>(undefined);
    
    // Detailed Form State
    const [form, setForm] = useState<Partial<IncomeItem> & { details: any }>({
        description: '',
        amount: 0,
        withholding: 0,
        type: 'w2',
        payFrequency: 'annual',
        owner: 'primary',
        details: {}
    });

    const isMarriedJoint = taxPayer?.filingStatus === 'married_joint';

    const resetForm = () => {
        setEditingId(null);
        let type: IncomeItem['type'] = 'w2';
        if (activeTab === 'Business') type = '1099_nec';
        if (activeTab === 'Investment') type = '1099_div';
        if (activeTab === 'Rental') type = 'rental';

        setForm({ description: '', amount: 0, withholding: 0, type, payFrequency: 'annual', owner: 'primary', details: {} });
    };

    const handleEdit = (item: IncomeItem) => {
        if (item.originalPaystub) {
            setSelectedPaystub(item.originalPaystub);
            setShowPaystubModal(true);
            return;
        }

        setEditingId(item.id);
        setForm({
            ...item,
            details: item.details || {}
        });
        
        if (item.type === 'w2') setActiveTab('W-2');
        else if (item.type === '1099_nec' || item.type === 'ssa_1099') setActiveTab('Business');
        else if (item.type === 'rental') setActiveTab('Rental');
        else setActiveTab('Investment');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSaveIncome = () => {
        if (!form.amount && form.amount !== 0) return;
        
        const newItem: IncomeItem = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            description: form.description || `${activeTab} Income`,
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
        // Check if updating existing
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

    const openIngestionModal = () => {
        setSelectedPaystub(undefined);
        setShowPaystubModal(true);
    };

    // Calculate inferred Box 3/5 for UI
    const inferredBox3 = (form.amount || 0) + (form.details?.w2_box12_code_d_401k || 0) + (form.details?.w2_fsa_health_amount || 0) * -1; // Basic logic for display only

    // --- 52 Week Chart ---
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
        <div className="flex flex-col xl:flex-row gap-8 h-full relative">
            {showPaystubModal && (
                <PaystubIngestionModal 
                    onSave={handlePaystubImport}
                    onClose={() => setShowPaystubModal(false)}
                    initialData={selectedPaystub}
                />
            )}

            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">Income & Wages</h1>
                    <p className="text-neutral-500">Enter your income sources. Click any entry below to edit details.</p>
                </div>

                {incomes.length > 0 && (
                    <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-6 h-64 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold uppercase text-neutral-500">52-Week Accumulation</h3>
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full font-bold shadow-sm">
                                Est. Total: ${incomes.reduce((a, b) => a + b.amount, 0).toLocaleString()}
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
                                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `W${v}`} interval={10} />
                                <YAxis hide domain={['auto', 'auto']} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    formatter={(value: number) => [`$${value.toLocaleString(undefined, {maximumFractionDigits:0})}`, 'Cumulative']}
                                    labelFormatter={(l) => `Week ${l}`}
                                />
                                <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <div className="flex border-b border-border-light dark:border-border-dark gap-8 overflow-x-auto no-scrollbar">
                    {['W-2', 'Business', 'Investment', 'Rental'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setActiveTab(tab as any); setTimeout(resetForm, 0); }}
                            className={`pb-3 border-b-[3px] font-bold text-sm whitespace-nowrap px-1 transition-all ${
                                activeTab === tab 
                                ? 'border-primary dark:border-white text-primary dark:text-white' 
                                : 'border-transparent text-neutral-500 hover:text-primary hover:border-neutral-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark p-6 lg:p-8 relative overflow-hidden transition-all">
                    {editingId && (
                        <div className="absolute top-0 left-0 w-full bg-blue-500 text-white text-xs font-bold text-center py-1.5 shadow-md z-10">
                            EDITING MODE
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mb-6 mt-2">
                        <div className="flex items-center gap-3 flex-wrap">
                             <h2 className="text-xl font-bold">{editingId ? `Edit ${form.description}` : `Add ${activeTab} Income`}</h2>
                             {activeTab === 'W-2' && (
                                 <button 
                                    onClick={openIngestionModal}
                                    className="text-xs font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                 >
                                     <span className="material-symbols-outlined text-[14px]">receipt_long</span> Ingest Paystub (AI)
                                 </button>
                             )}
                        </div>
                        {editingId && (
                            <button onClick={resetForm} className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline">Cancel Edit</button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Owner Selection for Married Joint */}
                        {isMarriedJoint && (
                            <div className="col-span-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-border-light dark:border-neutral-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <span className="text-sm font-bold text-neutral-500 uppercase tracking-wide">Income Earner:</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setForm({...form, owner: 'primary'})}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${form.owner === 'primary' ? 'bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 text-primary dark:text-white' : 'text-neutral-500 hover:bg-white/50'}`}
                                    >
                                        {taxPayer?.firstName || 'Taxpayer'} (You)
                                    </button>
                                    <button 
                                        onClick={() => setForm({...form, owner: 'spouse'})}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${form.owner === 'spouse' ? 'bg-white dark:bg-neutral-700 shadow-sm border border-neutral-200 dark:border-neutral-600 text-primary dark:text-white' : 'text-neutral-500 hover:bg-white/50'}`}
                                    >
                                        {taxPayer?.spouseFirstName || 'Spouse'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-semibold flex items-center">
                                Payer / Description
                            </label>
                            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="e.g. Employer Name" />
                        </div>

                        {activeTab === 'W-2' && (
                            <>
                                {/* Main Boxes */}
                                <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-border-light dark:border-neutral-700">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Box 1 Wages</label>
                                        <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Box 2 Fed Tax</label>
                                        <input type="number" value={form.withholding || ''} onChange={e => setForm({...form, withholding: parseFloat(e.target.value)})} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Box 3 SS Wages</label>
                                        <input type="number" value={form.details?.w2_box3_ss_wages || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box3_ss_wages: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Box 5 Med Wages</label>
                                        <input type="number" value={form.details?.w2_box5_med_wages || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box5_med_wages: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                </div>

                                {/* Box 12 & Benefits */}
                                <div className="col-span-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg border border-border-light dark:border-neutral-700">
                                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2 select-none" onClick={() => setShowReconciliation(!showReconciliation)}>
                                        <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                                        Benefits & Deductions (Box 12) 
                                        <span className="text-xs text-neutral-500 font-normal cursor-pointer hover:underline">(Show Reconciliation)</span>
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-neutral-500">D - 401(k)</label>
                                            <input type="number" value={form.details?.w2_box12_code_d_401k || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box12_code_d_401k: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" placeholder="Reduces Box 1" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-neutral-500">W - HSA (Employer+Emp)</label>
                                            <input type="number" value={form.details?.w2_box12_code_w_hsa || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box12_code_w_hsa: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" placeholder="Reduces 1, 3, 5" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-neutral-500">Box 10 Dep. Care</label>
                                            <input type="number" value={form.details?.w2_box10_dependent_care || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box10_dependent_care: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-neutral-500">C - Group Term Life</label>
                                            <input type="number" value={form.details?.w2_box12_code_c_group_term_life || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_box12_code_c_group_term_life: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" placeholder="Imputed Income" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-neutral-500">Health Ins (Pre-Tax)</label>
                                            <input type="number" value={form.details?.w2_health_insurance_pretax || ''} onChange={e => setForm(f => ({...f, details: {...f.details, w2_health_insurance_pretax: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" placeholder="Not on W-2" />
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <label className="flex items-center gap-2 text-xs mb-2">
                                                <input type="checkbox" checked={form.details?.w2_retirement_plan_active || false} onChange={e => setForm(f => ({...f, details: {...f.details, w2_retirement_plan_active: e.target.checked}}))} /> 
                                                Box 13 Ret. Plan Active
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {showReconciliation && (
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
                                            <p className="font-bold mb-1">Wage Reconciliation Helper</p>
                                            <div className="flex justify-between">
                                                <span>Box 1 + 401k + Health:</span>
                                                <span>${((form.amount || 0) + (form.details?.w2_box12_code_d_401k || 0) + (form.details?.w2_health_insurance_pretax || 0)).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Should approx Box 3/5 (if no cap):</span>
                                                <span className="font-bold">${inferredBox3.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'Business' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold flex items-center">Gross Receipts</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Total Expenses</label>
                                    <input type="number" value={form.details?.business_expense_total || ''} onChange={e => setForm(f => ({...f, details: {...f.details, business_expense_total: parseFloat(e.target.value)}}))} className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none" />
                                </div>
                                
                                {/* Home Office & Vehicle */}
                                <div className="col-span-2 grid grid-cols-2 gap-6 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-lg">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase mb-2">Home Office</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" placeholder="Office Sqft" value={form.details?.home_office_sqft || ''} onChange={e => setForm(f => ({...f, details: {...f.details, home_office_sqft: parseFloat(e.target.value)}}))} className="p-2 text-xs rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                            <input type="number" placeholder="Total Sqft" value={form.details?.home_total_sqft || ''} onChange={e => setForm(f => ({...f, details: {...f.details, home_total_sqft: parseFloat(e.target.value)}}))} className="p-2 text-xs rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase mb-2">Vehicle</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="number" placeholder="Biz Miles" value={form.details?.vehicle_business_miles || ''} onChange={e => setForm(f => ({...f, details: {...f.details, vehicle_business_miles: parseFloat(e.target.value)}}))} className="p-2 text-xs rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                            <input type="number" placeholder="Total Miles" value={form.details?.vehicle_total_miles || ''} onChange={e => setForm(f => ({...f, details: {...f.details, vehicle_total_miles: parseFloat(e.target.value)}}))} className="p-2 text-xs rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 grid grid-cols-2 gap-4 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={form.details?.qbi_sstb || false} onChange={e => setForm(f => ({...f, details: {...f.details, qbi_sstb: e.target.checked}}))} /> 
                                        SSTB (Service Business)
                                    </label>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold">W-2 Wages Paid <HelpTooltip text="Wages YOU paid to employees." /></label>
                                        <input type="number" value={form.details?.qbi_w2_wages_paid || ''} placeholder="For QBI Limit" onChange={e => setForm(f => ({...f, details: {...f.details, qbi_w2_wages_paid: parseFloat(e.target.value)}}))} className="w-full p-1 rounded text-sm" />
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'Investment' && (
                             <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Income Type</label>
                                    <select 
                                        className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none"
                                        value={form.type}
                                        onChange={e => {
                                            const val = e.target.value;
                                            // Mapping logic simplified for UI
                                            if (val.includes('1099')) setForm(f => ({...f, type: val as any}));
                                            if (val === 'stock') setForm(f => ({...f, type: 'stock'}));
                                        }}
                                    >
                                        <option value="1099_div">Dividends (1099-DIV)</option>
                                        <option value="1099_int">Interest (1099-INT)</option>
                                        <option value="stock">Stock Sale (1099-B)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Amount / Gain</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none" placeholder="0.00" />
                                </div>
                                {form.type === 'stock' && (
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold">Cost Basis</label>
                                            <input type="number" value={form.details?.cost_basis || ''} onChange={e => setForm(f => ({...f, details: {...f.details, cost_basis: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold">Acquisition Date</label>
                                            <input type="date" value={form.details?.acquisition_date || ''} onChange={e => setForm(f => ({...f, details: {...f.details, acquisition_date: e.target.value}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                        </div>
                                    </div>
                                )}
                                {form.type === '1099_div' && (
                                    <div className="col-span-2 flex gap-4">
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.details?.dividend_qualified || false} onChange={e => setForm(f => ({...f, details: {...f.details, dividend_qualified: e.target.checked}}))} /> Qualified Div</label>
                                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.details?.reit_dividend || false} onChange={e => setForm(f => ({...f, details: {...f.details, reit_dividend: e.target.checked}}))} /> REIT (Sec 199A)</label>
                                    </div>
                                )}
                             </>
                        )}

                        {activeTab === 'Rental' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold">Net Rental Income/Loss</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="w-full rounded-lg bg-background-light dark:bg-neutral-800 border border-border-light dark:border-neutral-700 px-4 py-3 outline-none" />
                                </div>
                                <div className="col-span-2 grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Days Rented</label>
                                        <input type="number" value={form.details?.rental_days_rented || ''} onChange={e => setForm(f => ({...f, details: {...f.details, rental_days_rented: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Days Personal</label>
                                        <input type="number" value={form.details?.rental_days_personal || ''} onChange={e => setForm(f => ({...f, details: {...f.details, rental_days_personal: parseFloat(e.target.value)}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500">Type</label>
                                        <select value={form.details?.rental_type || 'residential'} onChange={e => setForm(f => ({...f, details: {...f.details, rental_type: e.target.value}}))} className="w-full p-2 rounded border dark:bg-neutral-900 dark:border-neutral-700">
                                            <option value="residential">Residential</option>
                                            <option value="commercial">Commercial</option>
                                            <option value="short_term">Short Term</option>
                                        </select>
                                    </div>
                                    <div className="col-span-3 flex gap-4 pt-2">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={form.details?.rental_active_participation || false} onChange={e => setForm(f => ({...f, details: {...f.details, rental_active_participation: e.target.checked}}))} /> 
                                            Active Part.
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={form.details?.rental_real_estate_pro || false} onChange={e => setForm(f => ({...f, details: {...f.details, rental_real_estate_pro: e.target.checked}}))} /> 
                                            Real Estate Pro
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleSaveIncome}
                        className={`w-full text-white px-8 py-4 rounded-xl font-bold text-sm shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-primary hover:bg-neutral-800'}`}
                    >
                        {editingId ? 'Save Changes' : `Add ${activeTab} Entry`}
                    </button>
                    
                    {/* List */}
                    <div className="mt-8 space-y-3">
                         {incomes.map(item => (
                             <div 
                                key={item.id} 
                                onClick={() => handleEdit(item)}
                                className={`flex justify-between items-center p-4 rounded-xl border transition-all cursor-pointer group ${editingId === item.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-inner' : 'bg-white dark:bg-neutral-800 border-border-light dark:border-neutral-700 hover:border-primary/30 hover:shadow-md'}`}
                             >
                                 <div className="flex items-center gap-4">
                                     <div className={`size-3 rounded-full ${editingId === item.id ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-600 group-hover:bg-primary transition-colors'}`}></div>
                                     <div>
                                         <div className="font-bold flex items-center gap-2 text-lg">
                                            {item.description}
                                            <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400">edit</span>
                                         </div>
                                         <div className="text-xs text-neutral-500 uppercase flex gap-2 items-center">
                                             {/* Owner Badge */}
                                             {isMarriedJoint && (
                                                <span className={`px-1.5 py-0.5 rounded font-bold ${item.owner === 'spouse' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                    {item.owner === 'spouse' ? 'Spouse' : 'You'}
                                                </span>
                                             )}
                                             <span>{item.type.replace('_', ' ')}</span>
                                             {item.details?.dividend_qualified && <span className="text-green-600 bg-green-100 dark:bg-green-900/30 px-1 rounded">QUALIFIED</span>}
                                             {item.details?.w2_box12_code_d_401k ? <span className="text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-1 rounded">401k</span> : null}
                                             {item.originalPaystub && (
                                                 <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded font-bold text-[10px]">
                                                     <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                                                     AI PAYSTUB
                                                 </span>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-5">
                                     <div className={`font-bold text-lg ${item.amount < 0 ? 'text-red-500' : ''}`}>${item.amount.toLocaleString()}</div>
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                        className="text-neutral-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                     >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                     </button>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomePage;