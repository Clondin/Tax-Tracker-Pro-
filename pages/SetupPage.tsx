import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaxPayer, Dependent } from '../types';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const SetupPage: React.FC<SetupPageProps> = ({ setTaxPayer }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<TaxPayer>({
        firstName: '',
        lastName: '',
        spouseFirstName: '',
        spouseLastName: '',
        ssn: '',
        filingStatus: 'single',
        dependents: [],
        isOver65: false,
        isBlind: false,
        spouseIsOver65: false,
        spouseIsBlind: false,
        residencyStatus: 'us_resident'
    });

    const [newDep, setNewDep] = useState<Partial<Dependent>>({
        firstName: '', relationship: 'child', age: 0, monthsLivedWith: 12, isStudent: false, isDisabled: false, hasItin: false
    });
    const [isAddingDep, setIsAddingDep] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ 
            ...prev, 
            [name]: val 
        }));
    };

    const handleStatusChange = (status: TaxPayer['filingStatus']) => {
        setFormData(prev => ({ ...prev, filingStatus: status }));
    };

    const addDependent = () => {
        if (!newDep.firstName) return;
        const dep: Dependent = {
            id: Math.random().toString(36).substr(2, 9),
            firstName: newDep.firstName || '',
            lastName: newDep.lastName || formData.lastName, 
            ssn: newDep.ssn || '',
            relationship: newDep.relationship as any,
            age: Number(newDep.age),
            monthsLivedWith: Number(newDep.monthsLivedWith),
            isStudent: !!newDep.isStudent,
            isDisabled: !!newDep.isDisabled,
            hasItin: !!newDep.hasItin,
            isClaimedByOther: false
        };
        setFormData(prev => ({ ...prev, dependents: [...prev.dependents, dep] }));
        setNewDep({ firstName: '', relationship: 'child', age: 0, monthsLivedWith: 12, isStudent: false, isDisabled: false, hasItin: false });
        setIsAddingDep(false);
    };

    const removeDependent = (id: string) => {
        setFormData(prev => ({ ...prev, dependents: prev.dependents.filter(d => d.id !== id) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTaxPayer(formData);
        navigate('/income');
    };
    
    const isMarriedJoint = formData.filingStatus === 'married_joint';

    return (
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 bg-card-light dark:bg-card-dark rounded-3xl overflow-hidden shadow-2xl border border-border-light dark:border-border-dark min-h-[650px]">
            {/* Left Side */}
            <div className="relative w-full lg:w-5/12 bg-primary text-white p-10 flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-accent-green/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                    <h2 className="text-xl font-bold tracking-tight mb-12 flex items-center gap-3 opacity-90">
                         <div className="bg-white/10 p-2 rounded-lg"><span className="material-symbols-outlined text-white">bar_chart</span></div>
                         TaxTracker Pro
                    </h2>
                    <h1 className="text-4xl font-black leading-tight mb-6 tracking-tight">2025 Tax Year Ready.</h1>
                    <p className="text-white/70 text-lg mb-8 font-light leading-relaxed">Experience a smarter way to file. Fully updated with 2025 brackets, EIC tables, and QBI phaseouts.</p>
                </div>
                
                <div className="relative z-10 flex gap-4 text-xs font-medium text-white/50">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">verified</span> Secure</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">update</span> Updated</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">bolt</span> Fast</span>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* Filing Status */}
                    <div>
                         <label className="block text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Filing Status</label>
                         <div className="grid grid-cols-2 gap-3">
                            {['single', 'married_joint', 'head_household', 'married_separate'].map(s => (
                                <div key={s} onClick={() => handleStatusChange(s as any)} 
                                     className={`cursor-pointer border-2 rounded-xl p-4 text-center text-sm font-bold capitalize transition-all duration-200 flex flex-col items-center gap-2 ${formData.filingStatus === s ? 'bg-primary border-primary text-white shadow-lg scale-[1.02]' : 'border-border-light dark:border-neutral-700 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
                                    <span className="material-symbols-outlined">
                                        {s === 'single' ? 'person' : (s.includes('married') ? 'group' : 'home')}
                                    </span>
                                    {s.replace('_', ' ')}
                                </div>
                            ))}
                         </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-primary dark:text-white">Taxpayer Profile</h2>
                            {isMarriedJoint && <span className="text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full">Joint Return</span>}
                        </div>
                        
                        {/* Primary Taxpayer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <label className="text-xs font-bold text-neutral-500 ml-1 mb-1 block">First Name</label>
                                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-xl border border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                            <div className="relative">
                                <label className="text-xs font-bold text-neutral-500 ml-1 mb-1 block">Last Name</label>
                                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-xl border border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                            </div>
                        </div>
                        
                        <div className="flex gap-6 px-1">
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                <input type="checkbox" name="isOver65" checked={formData.isOver65} onChange={handleChange} className="rounded text-primary size-4" />
                                Age 65+
                            </label>
                            <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                <input type="checkbox" name="isBlind" checked={formData.isBlind} onChange={handleChange} className="rounded text-primary size-4" />
                                Blind
                            </label>
                        </div>

                        {/* Spouse Info - Conditionally Rendered */}
                        {isMarriedJoint && (
                            <div className="pt-4 border-t border-dashed border-border-light dark:border-neutral-700 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">Spouse Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div className="relative">
                                        <label className="text-xs font-bold text-neutral-500 ml-1 mb-1 block">Spouse First Name</label>
                                        <input required name="spouseFirstName" value={formData.spouseFirstName} onChange={handleChange} className="w-full rounded-xl border border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                    <div className="relative">
                                        <label className="text-xs font-bold text-neutral-500 ml-1 mb-1 block">Spouse Last Name</label>
                                        <input required name="spouseLastName" value={formData.spouseLastName} onChange={handleChange} className="w-full rounded-xl border border-border-light dark:border-neutral-700 bg-background-light dark:bg-neutral-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                                    </div>
                                </div>
                                <div className="flex gap-6 px-1">
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                        <input type="checkbox" name="spouseIsOver65" checked={formData.spouseIsOver65} onChange={handleChange} className="rounded text-primary size-4" />
                                        Spouse 65+
                                    </label>
                                    <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                        <input type="checkbox" name="spouseIsBlind" checked={formData.spouseIsBlind} onChange={handleChange} className="rounded text-primary size-4" />
                                        Spouse Blind
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dependents Section */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-2xl border border-border-light dark:border-neutral-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-neutral-500">family_restroom</span>
                                Dependents
                            </h3>
                            <button type="button" onClick={() => setIsAddingDep(true)} className="text-xs font-bold bg-primary hover:bg-neutral-800 dark:bg-white dark:text-primary dark:hover:bg-neutral-200 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-[16px]">add</span> Add Dependent
                            </button>
                        </div>
                        
                        {formData.dependents.length === 0 && !isAddingDep && (
                            <div className="text-center py-8 text-neutral-400 border-2 border-dashed border-border-light dark:border-neutral-700 rounded-xl">
                                <p className="text-sm">No dependents added.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {formData.dependents.map(d => (
                                <div key={d.id} className="flex justify-between items-center bg-white dark:bg-neutral-800 p-4 rounded-xl border border-border-light dark:border-neutral-700 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex items-center justify-center font-bold">
                                            {d.firstName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{d.firstName} {d.lastName}</div>
                                            <div className="text-xs text-neutral-500 flex gap-2 items-center mt-0.5">
                                                <span className="capitalize bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">{d.relationship}</span>
                                                <span>• {d.age} yo</span>
                                                {d.isDisabled && <span className="text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded font-medium">Disabled</span>}
                                                {d.isStudent && <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded font-medium">Student</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeDependent(d.id)} className="text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            ))}
                        </div>

                        {isAddingDep && (
                            <div className="mt-6 p-5 bg-white dark:bg-neutral-800 rounded-xl border border-border-light dark:border-neutral-700 space-y-4 shadow-lg animate-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="First Name" value={newDep.firstName} onChange={e => setNewDep({...newDep, firstName: e.target.value})} className="border border-border-light dark:border-neutral-600 p-2.5 rounded-lg text-sm bg-transparent outline-none focus:border-primary" />
                                    <select value={newDep.relationship} onChange={e => setNewDep({...newDep, relationship: e.target.value as any})} className="border border-border-light dark:border-neutral-600 p-2.5 rounded-lg text-sm bg-transparent outline-none focus:border-primary">
                                        <option value="child">Child</option>
                                        <option value="parent">Parent</option>
                                        <option value="relative">Relative</option>
                                        <option value="sibling">Sibling</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input type="number" placeholder="Age" value={newDep.age} onChange={e => setNewDep({...newDep, age: parseInt(e.target.value)})} className="border border-border-light dark:border-neutral-600 p-2.5 rounded-lg text-sm bg-transparent outline-none focus:border-primary" />
                                    <input type="number" placeholder="Months with you" value={newDep.monthsLivedWith} onChange={e => setNewDep({...newDep, monthsLivedWith: parseInt(e.target.value)})} className="border border-border-light dark:border-neutral-600 p-2.5 rounded-lg text-sm bg-transparent outline-none focus:border-primary" />
                                    <input placeholder="SSN/ITIN" value={newDep.ssn} onChange={e => setNewDep({...newDep, ssn: e.target.value})} className="border border-border-light dark:border-neutral-600 p-2.5 rounded-lg text-sm bg-transparent outline-none focus:border-primary" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded"><input type="checkbox" checked={newDep.isStudent} onChange={e => setNewDep({...newDep, isStudent: e.target.checked})} className="rounded text-primary" /> Student (Under 24)</label>
                                     <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded"><input type="checkbox" checked={newDep.isDisabled} onChange={e => setNewDep({...newDep, isDisabled: e.target.checked})} className="rounded text-primary" /> Perm. Disabled</label>
                                     <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded"><input type="checkbox" checked={newDep.hasItin} onChange={e => setNewDep({...newDep, hasItin: e.target.checked})} className="rounded text-primary" /> Has ITIN (Not SSN)</label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={addDependent} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors">Save Dependent</button>
                                    <button type="button" onClick={() => setIsAddingDep(false)} className="px-6 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-600 dark:text-neutral-200 text-sm font-bold py-2.5 rounded-lg transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-primary hover:bg-neutral-800 dark:bg-white dark:text-primary dark:hover:bg-neutral-200 text-white font-bold py-4 px-4 rounded-xl shadow-xl flex items-center justify-center gap-3 mt-4 text-lg transition-all hover:-translate-y-1">
                        Start Return <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupPage;