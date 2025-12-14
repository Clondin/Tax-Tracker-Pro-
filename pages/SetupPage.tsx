import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxPayer, Dependent } from '../types';
import { cn } from '../lib/utils';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const STEPS = [
    { id: 'status', title: 'Filing Status', subtitle: "Let's start with how you're filing" },
    { id: 'personal', title: 'Your Info', subtitle: 'Tell us about yourself' },
    { id: 'spouse', title: 'Spouse Info', subtitle: 'About your spouse' },
    { id: 'life', title: 'Life Events', subtitle: 'Any major changes this year?' },
    { id: 'dependents', title: 'Dependents', subtitle: 'Who do you support?' },
];

const LIFE_QUESTIONS = [
    { id: 'bought_home', icon: 'home', label: 'Bought a home', hint: 'Mortgage interest deductions' },
    { id: 'had_baby', icon: 'child_care', label: 'Had a baby', hint: 'Child Tax Credit' },
    { id: 'got_married', icon: 'favorite', label: 'Got married', hint: 'Filing status change' },
    { id: 'started_business', icon: 'storefront', label: 'Started a business', hint: 'Schedule C income' },
    { id: 'sold_stocks', icon: 'trending_up', label: 'Sold investments', hint: 'Capital gains/losses' },
    { id: 'went_to_college', icon: 'school', label: 'Paid for education', hint: 'Education credits' },
    { id: 'made_donations', icon: 'volunteer_activism', label: 'Made charitable donations', hint: 'Itemized deductions' },
    { id: 'installed_solar', icon: 'solar_power', label: 'Installed solar panels', hint: 'Energy credits' },
];

const SetupPage: React.FC<SetupPageProps> = ({ setTaxPayer }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
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
    const [lifeEvents, setLifeEvents] = useState<Record<string, boolean>>({});
    const [newDep, setNewDep] = useState<Partial<Dependent>>({ firstName: '', relationship: 'child', age: 0 });

    const isMarried = formData.filingStatus.includes('married');
    const currentStep = STEPS[step];

    const handleStatusChange = (status: TaxPayer['filingStatus']) => {
        setFormData(prev => ({ ...prev, filingStatus: status }));
    };

    const addDependent = () => {
        if (!newDep.firstName) return;
        const dep: Dependent = {
            id: Math.random().toString(36).substr(2, 9),
            firstName: newDep.firstName || '',
            lastName: newDep.lastName || formData.lastName,
            ssn: '',
            relationship: newDep.relationship as any,
            age: Number(newDep.age) || 0,
            monthsLivedWith: 12,
            isStudent: false,
            isDisabled: false,
            hasItin: false,
            isClaimedByOther: false
        };
        setFormData(prev => ({ ...prev, dependents: [...prev.dependents, dep] }));
        setNewDep({ firstName: '', relationship: 'child', age: 0 });
    };

    const nextStep = () => {
        if (step === 0 && !isMarried) {
            setStep(2); // Skip spouse step
        } else if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (step === 2 && !isMarried) {
            setStep(0);
        } else if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleSubmit = () => {
        setTaxPayer(formData);
        navigate('/income');
    };

    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <div className="max-w-4xl mx-auto min-h-[80vh] flex flex-col">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-white">{currentStep.title}</h1>
                        <p className="text-text-muted">{currentStep.subtitle}</p>
                    </div>
                    <div className="text-xs font-bold text-text-muted">STEP {step + 1} OF {STEPS.length}</div>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary to-primary-dark"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Filing Status Step */}
                        {currentStep.id === 'status' && (
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'single', label: 'Single', icon: 'person' },
                                    { id: 'married_joint', label: 'Married Filing Jointly', icon: 'group' },
                                    { id: 'head_household', label: 'Head of Household', icon: 'home' },
                                    { id: 'married_separate', label: 'Married Filing Separately', icon: 'group_off' },
                                ].map(s => (
                                    <motion.button
                                        key={s.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleStatusChange(s.id as any)}
                                        className={cn(
                                            "p-6 rounded-2xl border-2 text-left transition-all flex flex-col items-center gap-3",
                                            formData.filingStatus === s.id
                                                ? "border-primary bg-primary/5 shadow-xl"
                                                : "border-border-light dark:border-border-dark bg-white dark:bg-card-dark hover:border-primary/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-4 rounded-full",
                                            formData.filingStatus === s.id ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 text-text-muted"
                                        )}>
                                            <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                        </div>
                                        <span className={cn("font-bold", formData.filingStatus === s.id ? "text-primary" : "text-text-main dark:text-white")}>{s.label}</span>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Personal Info Step */}
                        {currentStep.id === 'personal' && (
                            <div className="space-y-6 max-w-md mx-auto">
                                <div>
                                    <label className="text-xs font-bold text-text-muted block mb-2 uppercase tracking-wide">First Name</label>
                                    <input
                                        value={formData.firstName}
                                        onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                        className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium"
                                        placeholder="John"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted block mb-2 uppercase tracking-wide">Last Name</label>
                                    <input
                                        value={formData.lastName}
                                        onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                        className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium"
                                        placeholder="Doe"
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={formData.isOver65} onChange={e => setFormData(f => ({ ...f, isOver65: e.target.checked }))} className="sr-only" />
                                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", formData.isOver65 ? "bg-primary border-primary" : "border-text-muted")}>
                                            {formData.isOver65 && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                        </div>
                                        <span className="text-sm font-medium">Age 65+</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={formData.isBlind} onChange={e => setFormData(f => ({ ...f, isBlind: e.target.checked }))} className="sr-only" />
                                        <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center", formData.isBlind ? "bg-primary border-primary" : "border-text-muted")}>
                                            {formData.isBlind && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                        </div>
                                        <span className="text-sm font-medium">Blind</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Spouse Info Step */}
                        {currentStep.id === 'spouse' && isMarried && (
                            <div className="space-y-6 max-w-md mx-auto">
                                <div>
                                    <label className="text-xs font-bold text-text-muted block mb-2 uppercase tracking-wide">Spouse First Name</label>
                                    <input
                                        value={formData.spouseFirstName}
                                        onChange={e => setFormData(f => ({ ...f, spouseFirstName: e.target.value }))}
                                        className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium"
                                        placeholder="Jane"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-muted block mb-2 uppercase tracking-wide">Spouse Last Name</label>
                                    <input
                                        value={formData.spouseLastName}
                                        onChange={e => setFormData(f => ({ ...f, spouseLastName: e.target.value }))}
                                        className="w-full rounded-xl border-2 border-border-light dark:border-border-dark bg-white dark:bg-card-dark px-4 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-lg font-medium"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Life Events Step */}
                        {currentStep.id === 'life' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {LIFE_QUESTIONS.map(q => (
                                    <motion.button
                                        key={q.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setLifeEvents(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-left transition-all",
                                            lifeEvents[q.id]
                                                ? "border-primary bg-primary/5"
                                                : "border-border-light dark:border-border-dark bg-white dark:bg-card-dark hover:border-primary/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg w-fit mb-2",
                                            lifeEvents[q.id] ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 text-text-muted"
                                        )}>
                                            <span className="material-symbols-outlined">{q.icon}</span>
                                        </div>
                                        <div className="font-bold text-sm text-text-main dark:text-white">{q.label}</div>
                                        <div className="text-xs text-text-muted mt-0.5">{q.hint}</div>
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Dependents Step */}
                        {currentStep.id === 'dependents' && (
                            <div className="max-w-lg mx-auto space-y-6">
                                {formData.dependents.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.dependents.map(d => (
                                            <div key={d.id} className="flex justify-between items-center p-4 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{d.firstName[0]}</div>
                                                    <div>
                                                        <div className="font-bold text-text-main dark:text-white">{d.firstName}</div>
                                                        <div className="text-xs text-text-muted capitalize">{d.relationship} • Age {d.age}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setFormData(f => ({ ...f, dependents: f.dependents.filter(x => x.id !== d.id) }))} className="text-text-muted hover:text-red-500">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="p-5 rounded-xl border-2 border-dashed border-border-light dark:border-border-dark space-y-4">
                                    <h3 className="text-sm font-bold text-text-muted">Add a Dependent</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <input placeholder="Name" value={newDep.firstName} onChange={e => setNewDep({ ...newDep, firstName: e.target.value })} className="col-span-2 p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-neutral-900" />
                                        <input type="number" placeholder="Age" value={newDep.age || ''} onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })} className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-neutral-900" />
                                    </div>
                                    <select value={newDep.relationship} onChange={e => setNewDep({ ...newDep, relationship: e.target.value as any })} className="w-full p-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-neutral-900">
                                        <option value="child">Child</option>
                                        <option value="parent">Parent</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="relative">Other Relative</option>
                                    </select>
                                    <button onClick={addDependent} className="w-full py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-bold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                        + Add Dependent
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-border-light dark:border-border-dark">
                <button
                    onClick={prevStep}
                    className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors", step === 0 ? "opacity-0 pointer-events-none" : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-muted")}
                >
                    <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                >
                    {step === STEPS.length - 1 ? 'Start Tax Return' : 'Continue'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
};

export default SetupPage;