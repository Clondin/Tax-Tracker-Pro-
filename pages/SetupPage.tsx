import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxPayer, Dependent } from '../types';
import { cn } from '../lib/utils';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const STEPS = [
    { id: 'status', title: 'Filing Status', subtitle: "Let's start with how you're filing", icon: 'person' },
    { id: 'personal', title: 'Your Info', subtitle: 'Tell us about yourself', icon: 'badge' },
    { id: 'spouse', title: 'Spouse Info', subtitle: 'About your spouse', icon: 'favorite' },
    { id: 'life', title: 'Life Events', subtitle: 'Any major changes this year?', icon: 'celebration' },
    { id: 'dependents', title: 'Dependents', subtitle: 'Who do you support?', icon: 'family_restroom' },
];

const LIFE_QUESTIONS = [
    { id: 'bought_home', icon: 'home', label: 'Bought a home', hint: 'Mortgage interest deductions', gradient: 'from-blue-500 to-cyan-500' },
    { id: 'had_baby', icon: 'child_care', label: 'Had a baby', hint: 'Child Tax Credit', gradient: 'from-pink-500 to-rose-500' },
    { id: 'got_married', icon: 'favorite', label: 'Got married', hint: 'Filing status change', gradient: 'from-red-500 to-pink-500' },
    { id: 'started_business', icon: 'storefront', label: 'Started a business', hint: 'Schedule C income', gradient: 'from-violet-500 to-purple-500' },
    { id: 'sold_stocks', icon: 'trending_up', label: 'Sold investments', hint: 'Capital gains/losses', gradient: 'from-emerald-500 to-teal-500' },
    { id: 'went_to_college', icon: 'school', label: 'Paid for education', hint: 'Education credits', gradient: 'from-amber-500 to-orange-500' },
    { id: 'made_donations', icon: 'volunteer_activism', label: 'Made charitable donations', hint: 'Itemized deductions', gradient: 'from-cyan-500 to-blue-500' },
    { id: 'installed_solar', icon: 'solar_power', label: 'Installed solar panels', hint: 'Energy credits', gradient: 'from-lime-500 to-green-500' },
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
            setStep(2);
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
        <div className="max-w-5xl mx-auto min-h-[80vh] flex flex-col">
            {/* Header with Progress */}
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-3"
                        >
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent-cyan">
                                <span className="material-symbols-outlined text-white">{currentStep.icon}</span>
                            </div>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                Step {step + 1} of {STEPS.length}
                            </span>
                        </motion.div>
                        <motion.h1
                            key={currentStep.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-4xl md:text-5xl font-display font-bold text-white mb-2"
                        >
                            {currentStep.title}
                        </motion.h1>
                        <motion.p
                            key={currentStep.subtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-zinc-400"
                        >
                            {currentStep.subtitle}
                        </motion.p>
                    </div>

                    {/* Step Indicators */}
                    <div className="hidden md:flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                                    i === step
                                        ? "bg-gradient-to-br from-primary to-accent-cyan shadow-glow"
                                        : i < step
                                        ? "bg-primary/20 text-primary"
                                        : "glass-light text-zinc-500"
                                )}
                            >
                                {i < step ? (
                                    <span className="material-symbols-outlined text-lg filled">check</span>
                                ) : (
                                    <span className="font-bold">{i + 1}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-primary via-accent-cyan to-accent-pink"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Filing Status Step */}
                        {currentStep.id === 'status' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'single', label: 'Single', icon: 'person', desc: 'Unmarried, divorced, or legally separated', gradient: 'from-violet-500 to-purple-600' },
                                    { id: 'married_joint', label: 'Married Filing Jointly', icon: 'group', desc: 'Combined income with spouse', gradient: 'from-pink-500 to-rose-600' },
                                    { id: 'head_household', label: 'Head of Household', icon: 'home', desc: 'Unmarried with qualifying dependent', gradient: 'from-cyan-500 to-blue-600' },
                                    { id: 'married_separate', label: 'Married Filing Separately', icon: 'group_off', desc: 'Separate returns from spouse', gradient: 'from-amber-500 to-orange-600' },
                                ].map((s, i) => (
                                    <motion.button
                                        key={s.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleStatusChange(s.id as any)}
                                        className={cn(
                                            "relative p-6 rounded-2xl text-left transition-all duration-300 overflow-hidden group",
                                            formData.filingStatus === s.id
                                                ? "glass-card ring-2 ring-primary shadow-glow"
                                                : "glass-card hover:ring-1 hover:ring-white/20"
                                        )}
                                    >
                                        {/* Background gradient on hover/select */}
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 transition-opacity duration-300 bg-gradient-to-br",
                                            s.gradient,
                                            formData.filingStatus === s.id ? "opacity-10" : "group-hover:opacity-5"
                                        )} />

                                        <div className="relative z-10">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300",
                                                formData.filingStatus === s.id
                                                    ? `bg-gradient-to-br ${s.gradient} shadow-lg`
                                                    : "bg-white/5"
                                            )}>
                                                <span className={cn(
                                                    "material-symbols-outlined text-2xl transition-colors",
                                                    formData.filingStatus === s.id ? "text-white filled" : "text-zinc-400"
                                                )}>
                                                    {s.icon}
                                                </span>
                                            </div>
                                            <h3 className={cn(
                                                "font-display font-bold text-lg mb-1 transition-colors",
                                                formData.filingStatus === s.id ? "text-white" : "text-zinc-200"
                                            )}>
                                                {s.label}
                                            </h3>
                                            <p className="text-sm text-zinc-500">{s.desc}</p>
                                        </div>

                                        {/* Checkmark */}
                                        {formData.filingStatus === s.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-white text-lg filled">check</span>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Personal Info Step */}
                        {currentStep.id === 'personal' && (
                            <div className="max-w-lg mx-auto space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card rounded-2xl p-8"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">
                                                First Name
                                            </label>
                                            <input
                                                value={formData.firstName}
                                                onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                                className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                                                placeholder="John"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">
                                                Last Name
                                            </label>
                                            <input
                                                value={formData.lastName}
                                                onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                                className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                        <div className="flex gap-6 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    formData.isOver65
                                                        ? "bg-primary border-primary"
                                                        : "border-zinc-600 group-hover:border-zinc-400"
                                                )}>
                                                    {formData.isOver65 && <span className="material-symbols-outlined text-white text-sm filled">check</span>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isOver65}
                                                    onChange={e => setFormData(f => ({ ...f, isOver65: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <span className="text-sm font-medium text-zinc-300">Age 65+</span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    formData.isBlind
                                                        ? "bg-primary border-primary"
                                                        : "border-zinc-600 group-hover:border-zinc-400"
                                                )}>
                                                    {formData.isBlind && <span className="material-symbols-outlined text-white text-sm filled">check</span>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isBlind}
                                                    onChange={e => setFormData(f => ({ ...f, isBlind: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <span className="text-sm font-medium text-zinc-300">Blind</span>
                                            </label>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Spouse Info Step */}
                        {currentStep.id === 'spouse' && isMarried && (
                            <div className="max-w-lg mx-auto space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="glass-card rounded-2xl p-8"
                                >
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                                            <span className="material-symbols-outlined text-white">favorite</span>
                                        </div>
                                        <span className="font-display font-bold text-white">Spouse Details</span>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">
                                                Spouse First Name
                                            </label>
                                            <input
                                                value={formData.spouseFirstName}
                                                onChange={e => setFormData(f => ({ ...f, spouseFirstName: e.target.value }))}
                                                className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                                                placeholder="Jane"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-widest">
                                                Spouse Last Name
                                            </label>
                                            <input
                                                value={formData.spouseLastName}
                                                onChange={e => setFormData(f => ({ ...f, spouseLastName: e.target.value }))}
                                                className="w-full rounded-xl border-2 border-white/10 bg-white/5 px-5 py-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-lg font-medium text-white placeholder-zinc-600 transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Life Events Step */}
                        {currentStep.id === 'life' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {LIFE_QUESTIONS.map((q, i) => (
                                    <motion.button
                                        key={q.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setLifeEvents(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                        className={cn(
                                            "relative p-4 rounded-xl text-left transition-all duration-300 overflow-hidden group",
                                            lifeEvents[q.id]
                                                ? "glass-card ring-2 ring-primary"
                                                : "glass-card"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute inset-0 opacity-0 transition-opacity duration-300 bg-gradient-to-br",
                                            q.gradient,
                                            lifeEvents[q.id] ? "opacity-10" : "group-hover:opacity-5"
                                        )} />

                                        <div className="relative z-10">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-300",
                                                lifeEvents[q.id]
                                                    ? `bg-gradient-to-br ${q.gradient}`
                                                    : "bg-white/5"
                                            )}>
                                                <span className={cn(
                                                    "material-symbols-outlined transition-colors",
                                                    lifeEvents[q.id] ? "text-white filled" : "text-zinc-400"
                                                )}>
                                                    {q.icon}
                                                </span>
                                            </div>
                                            <div className="font-bold text-sm text-white mb-1">{q.label}</div>
                                            <div className="text-xs text-zinc-500">{q.hint}</div>
                                        </div>

                                        {lifeEvents[q.id] && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                            >
                                                <span className="material-symbols-outlined text-white text-xs filled">check</span>
                                            </motion.div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        )}

                        {/* Dependents Step */}
                        {currentStep.id === 'dependents' && (
                            <div className="max-w-xl mx-auto space-y-6">
                                {formData.dependents.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-3"
                                    >
                                        {formData.dependents.map((d, i) => (
                                            <motion.div
                                                key={d.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="glass-card rounded-xl p-4 flex justify-between items-center"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
                                                        <span className="text-white font-bold text-lg">{d.firstName[0]}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{d.firstName}</div>
                                                        <div className="text-xs text-zinc-500 capitalize">{d.relationship} &bull; Age {d.age}</div>
                                                    </div>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setFormData(f => ({ ...f, dependents: f.dependents.filter(x => x.id !== d.id) }))}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="gradient-border p-6 rounded-2xl"
                                >
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
                                        Add a Dependent
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <input
                                            placeholder="Name"
                                            value={newDep.firstName}
                                            onChange={e => setNewDep({ ...newDep, firstName: e.target.value })}
                                            className="col-span-2 p-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Age"
                                            value={newDep.age || ''}
                                            onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })}
                                            className="p-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-zinc-600 outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <select
                                        value={newDep.relationship}
                                        onChange={e => setNewDep({ ...newDep, relationship: e.target.value as any })}
                                        className="w-full p-3 rounded-xl border border-white/10 bg-white/5 text-white outline-none focus:border-primary mb-4 transition-colors"
                                    >
                                        <option value="child">Child</option>
                                        <option value="parent">Parent</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="relative">Other Relative</option>
                                    </select>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={addDependent}
                                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                        Add Dependent
                                    </motion.button>
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center pt-10 mt-10 border-t border-white/5"
            >
                <motion.button
                    whileHover={{ scale: 1.02, x: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={prevStep}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                        step === 0
                            ? "opacity-0 pointer-events-none"
                            : "glass-light text-zinc-400 hover:text-white"
                    )}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    className="relative group flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent-cyan to-accent-pink opacity-100 group-hover:opacity-90 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent-pink to-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">
                        {step === STEPS.length - 1 ? 'Start Tax Return' : 'Continue'}
                    </span>
                    <span className="material-symbols-outlined relative z-10">arrow_forward</span>
                </motion.button>
            </motion.div>
        </div>
    );
};

export default SetupPage;
