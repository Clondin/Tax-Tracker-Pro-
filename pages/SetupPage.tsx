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
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 bg-white dark:bg-card-dark rounded-3xl overflow-hidden shadow-2xl border border-border-light dark:border-border-dark min-h-[700px]">
            {/* Left Side - Hero */}
            <div className="relative w-full lg:w-5/12 bg-gradient-to-br from-primary to-primary-dark text-white p-12 flex flex-col justify-between overflow-hidden">
                {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-blob"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-black/20 to-transparent"></div>

                <div className="relative z-10">
                    <h2 className="text-xl font-bold tracking-tight mb-8 flex items-center gap-3 opacity-90">
                        <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-white/10">
                            <span className="material-symbols-outlined text-white">bar_chart</span>
                        </div>
                        TaxTracker Pro
                    </h2>
                    <h1 className="text-5xl font-black leading-tight mb-6 tracking-tight drop-shadow-sm">
                        Smart Tax <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">Filing 2025.</span>
                    </h1>
                    <p className="text-indigo-100 text-lg mb-8 font-medium leading-relaxed max-w-sm">
                        Maximize your refund with our advanced AI-powered tax engine. Updated for the latest 2025 IRS brackets.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                        <span className="material-symbols-outlined text-secondary mb-2 text-3xl">verified_user</span>
                        <div className="font-bold text-sm">Bank-Level Security</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-colors">
                        <span className="material-symbols-outlined text-accent-rose mb-2 text-3xl">rocket_launch</span>
                        <div className="font-bold text-sm">Instant Calculations</div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center overflow-y-auto bg-background-light dark:bg-background-dark">
                <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto w-full">

                    {/* Filing Status */}
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Select Filing Status</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['single', 'married_joint', 'head_household', 'married_separate'].map(s => (
                                <div key={s} onClick={() => handleStatusChange(s as any)}
                                    className={`group cursor-pointer relative overflow-hidden border-2 rounded-2xl p-5 text-center transition-all duration-300 flex flex-col items-center gap-3 ${formData.filingStatus === s ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-[1.02]' : 'border-border-light dark:border-border-dark bg-white dark:bg-card-dark hover:border-primary/50 hover:shadow-md'}`}>
                                    <div className={`p-3 rounded-full transition-colors ${formData.filingStatus === s ? 'bg-primary text-white' : 'bg-background-light dark:bg-neutral-800 text-text-muted group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                        <span className="material-symbols-outlined text-2xl">
                                            {s === 'single' ? 'person' : (s.includes('married') ? 'group' : 'home')}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-bold capitalize ${formData.filingStatus === s ? 'text-primary' : 'text-text-main dark:text-white'}`}>
                                        {s.replace('_', ' ')}
                                    </span>
                                    {formData.filingStatus === s && (
                                        <div className="absolute top-3 right-3 text-primary">
                                            <span className="material-symbols-outlined text-lg">check_circle</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <div className="flex justify-between items-end border-b border-border-light dark:border-border-dark pb-2">
                            <h2 className="text-2xl font-bold text-text-main dark:text-white">Personal Details</h2>
                            {isMarriedJoint && <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">Joint Return Active</span>}
                        </div>

                        {/* Primary Taxpayer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group">
                                <label className="text-xs font-bold text-text-muted ml-1 mb-1.5 block group-focus-within:text-primary transition-colors">First Name</label>
                                <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-text-main dark:text-white placeholder-text-muted/50" placeholder="e.g. John" />
                            </div>
                            <div className="group">
                                <label className="text-xs font-bold text-text-muted ml-1 mb-1.5 block group-focus-within:text-primary transition-colors">Last Name</label>
                                <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-text-main dark:text-white placeholder-text-muted/50" placeholder="e.g. Doe" />
                            </div>
                        </div>

                        <div className="flex gap-6 px-1">
                            <label className="flex items-center gap-3 text-sm font-medium text-text-main dark:text-gray-300 cursor-pointer group select-none">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.isOver65 ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-primary'}`}>
                                    {formData.isOver65 && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                </div>
                                <input type="checkbox" name="isOver65" checked={formData.isOver65} onChange={handleChange} className="hidden" />
                                Age 65+
                            </label>
                            <label className="flex items-center gap-3 text-sm font-medium text-text-main dark:text-gray-300 cursor-pointer group select-none">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.isBlind ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-primary'}`}>
                                    {formData.isBlind && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                </div>
                                <input type="checkbox" name="isBlind" checked={formData.isBlind} onChange={handleChange} className="hidden" />
                                Blind
                            </label>
                        </div>

                        {/* Spouse Info - Conditionally Rendered */}
                        {isMarriedJoint && (
                            <div className="pt-6 border-t border-dashed border-border-light dark:border-border-dark animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 ml-1">Spouse Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                    <div className="group">
                                        <label className="text-xs font-bold text-text-muted ml-1 mb-1.5 block group-focus-within:text-primary transition-colors">Spouse First Name</label>
                                        <input required name="spouseFirstName" value={formData.spouseFirstName} onChange={handleChange} className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-text-main dark:text-white" />
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-bold text-text-muted ml-1 mb-1.5 block group-focus-within:text-primary transition-colors">Spouse Last Name</label>
                                        <input required name="spouseLastName" value={formData.spouseLastName} onChange={handleChange} className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-3.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-text-main dark:text-white" />
                                    </div>
                                </div>
                                <div className="flex gap-6 px-1">
                                    <label className="flex items-center gap-3 text-sm font-medium text-text-main dark:text-gray-300 cursor-pointer group select-none">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.spouseIsOver65 ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-primary'}`}>
                                            {formData.spouseIsOver65 && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                        </div>
                                        <input type="checkbox" name="spouseIsOver65" checked={formData.spouseIsOver65} onChange={handleChange} className="hidden" />
                                        Spouse 65+
                                    </label>
                                    <label className="flex items-center gap-3 text-sm font-medium text-text-main dark:text-gray-300 cursor-pointer group select-none">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.spouseIsBlind ? 'bg-primary border-primary' : 'border-text-muted group-hover:border-primary'}`}>
                                            {formData.spouseIsBlind && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                        </div>
                                        <input type="checkbox" name="spouseIsBlind" checked={formData.spouseIsBlind} onChange={handleChange} className="hidden" />
                                        Spouse Blind
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dependents Section */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-text-main dark:text-white">
                                <span className="material-symbols-outlined text-primary">family_restroom</span>
                                Dependents
                            </h3>
                            <button type="button" onClick={() => setIsAddingDep(true)} className="text-xs font-bold bg-primary/10 hover:bg-primary hover:text-white text-primary px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
                                <span className="material-symbols-outlined text-[16px]">add</span> Add New
                            </button>
                        </div>

                        {formData.dependents.length === 0 && !isAddingDep && (
                            <div className="text-center py-8 text-text-muted border-2 border-dashed border-border-light dark:border-border-dark rounded-xl bg-background-light dark:bg-background-dark/50">
                                <p className="text-sm font-medium">No dependents added yet.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {formData.dependents.map(d => (
                                <div key={d.id} className="flex justify-between items-center bg-background-light dark:bg-background-dark p-4 rounded-xl border border-border-light dark:border-border-dark group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                            {d.firstName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-text-main dark:text-white">{d.firstName} {d.lastName}</div>
                                            <div className="text-xs text-text-muted flex gap-2 items-center mt-1">
                                                <span className="capitalize bg-white dark:bg-card-dark px-2 py-0.5 rounded border border-border-light dark:border-border-dark">{d.relationship}</span>
                                                <span>• {d.age} yo</span>
                                                {d.isDisabled && <span className="text-accent-rose bg-accent-rose/10 px-1.5 py-0.5 rounded font-medium">Disabled</span>}
                                                {d.isStudent && <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium">Student</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeDependent(d.id)} className="text-text-muted hover:text-accent-rose hover:bg-accent-rose/10 rounded-lg p-2 transition-colors"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            ))}
                        </div>

                        {isAddingDep && (
                            <div className="mt-6 p-5 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-border-dark space-y-4 animate-in zoom-in-95 duration-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="First Name" value={newDep.firstName} onChange={e => setNewDep({ ...newDep, firstName: e.target.value })} className="border border-border-light dark:border-border-dark p-3 rounded-lg text-sm bg-white dark:bg-card-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                                    <select value={newDep.relationship} onChange={e => setNewDep({ ...newDep, relationship: e.target.value as any })} className="border border-border-light dark:border-border-dark p-3 rounded-lg text-sm bg-white dark:bg-card-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all">
                                        <option value="child">Child</option>
                                        <option value="parent">Parent</option>
                                        <option value="relative">Relative</option>
                                        <option value="sibling">Sibling</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input type="number" placeholder="Age" value={newDep.age} onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })} className="border border-border-light dark:border-border-dark p-3 rounded-lg text-sm bg-white dark:bg-card-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                                    <input type="number" placeholder="Months with you" value={newDep.monthsLivedWith} onChange={e => setNewDep({ ...newDep, monthsLivedWith: parseInt(e.target.value) })} className="border border-border-light dark:border-border-dark p-3 rounded-lg text-sm bg-white dark:bg-card-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                                    <input placeholder="SSN/ITIN" value={newDep.ssn} onChange={e => setNewDep({ ...newDep, ssn: e.target.value })} className="border border-border-light dark:border-border-dark p-3 rounded-lg text-sm bg-white dark:bg-card-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-white dark:hover:bg-card-dark rounded transition-colors text-text-muted"><input type="checkbox" checked={newDep.isStudent} onChange={e => setNewDep({ ...newDep, isStudent: e.target.checked })} className="rounded text-primary focus:ring-primary" /> Student (Under 24)</label>
                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-white dark:hover:bg-card-dark rounded transition-colors text-text-muted"><input type="checkbox" checked={newDep.isDisabled} onChange={e => setNewDep({ ...newDep, isDisabled: e.target.checked })} className="rounded text-primary focus:ring-primary" /> Perm. Disabled</label>
                                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer p-2 hover:bg-white dark:hover:bg-card-dark rounded transition-colors text-text-muted"><input type="checkbox" checked={newDep.hasItin} onChange={e => setNewDep({ ...newDep, hasItin: e.target.checked })} className="rounded text-primary focus:ring-primary" /> Has ITIN (Not SSN)</label>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={addDependent} className="flex-1 bg-secondary hover:bg-emerald-600 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-secondary/20">Save Dependent</button>
                                    <button type="button" onClick={() => setIsAddingDep(false)} className="px-6 bg-white hover:bg-neutral-50 dark:bg-card-dark dark:hover:bg-neutral-800 border border-border-light dark:border-border-dark text-text-muted text-sm font-bold py-2.5 rounded-lg transition-colors">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-dark hover:to-primary text-white font-bold py-4 px-4 rounded-xl shadow-xl shadow-primary/25 flex items-center justify-center gap-3 mt-4 text-lg transition-all hover:-translate-y-1 hover:shadow-2xl">
                        Start Tax Return <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupPage;