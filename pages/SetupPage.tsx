import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxPayer, Dependent } from '../types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
    PersonIcon,
    IdCardIcon,
    HeartIcon,
    StarIcon,
    FaceIcon,
    CheckIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    HomeIcon,
    LaptopIcon,
    RocketIcon,
    TrashIcon,
    PlusIcon,
    ComponentInstanceIcon,
} from '@radix-ui/react-icons';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const STEPS = [
    { id: 'status', title: 'Tax Filing Status', subtitle: "Define your fiscal relationship", icon: PersonIcon },
    { id: 'personal', title: 'Personal Profile', subtitle: 'Identity verification info', icon: IdCardIcon },
    { id: 'spouse', title: 'Secondary Profile', subtitle: 'Spousal fiscal data', icon: HeartIcon },
    { id: 'life', title: 'Life Optimization', subtitle: 'Recent life event triggers', icon: StarIcon },
    { id: 'dependents', title: 'Unit Dependents', subtitle: 'Household support members', icon: FaceIcon },
];

const LIFE_QUESTIONS = [
    { id: 'bought_home', icon: HomeIcon, label: 'Real Estate Purchase' },
    { id: 'had_baby', icon: FaceIcon, label: 'New Household Member' },
    { id: 'got_married', icon: HeartIcon, label: 'Marital Optimization' },
    { id: 'started_business', icon: LaptopIcon, label: 'Business Inception' },
    { id: 'sold_stocks', icon: RocketIcon, label: 'Asset Liquidation' },
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
            lastName: formData.lastName,
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
        navigate('/summary');
    };

    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <div className="max-w-4xl mx-auto space-y-12 py-8 animate-premium-in">
            {/* Console Progress System */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Entity Configuration Phase</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight">{currentStep.title}</h1>
                        <p className="text-sm text-muted-foreground font-medium">{currentStep.subtitle}</p>
                    </div>

                    <div className="flex gap-2">
                        {STEPS.map((s, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 transition-all duration-500 rounded-full",
                                    i === step ? "w-12 bg-primary shadow-[0_0_12px_rgba(var(--primary),0.5)]" : i < step ? "w-6 bg-primary/40" : "w-6 bg-secondary"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Core Interaction Matrix */}
            <Card className="border-0 shadow-2xl glass-card overflow-hidden">
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, scale: 0.98, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.98, x: -20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="p-10 md:p-14"
                        >
                            {/* Filing Status Matrix */}
                            {currentStep.id === 'status' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { id: 'single', label: 'Individual', desc: 'Single or separate filing' },
                                        { id: 'married_joint', label: 'Joint Filing', desc: 'Standard married couple' },
                                        { id: 'head_household', label: 'Unit Head', desc: 'Supporting dependents' },
                                        { id: 'married_separate', label: 'Separate', desc: 'Decoupled married units' },
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => handleStatusChange(s.id as any)}
                                            className={cn(
                                                "group relative flex items-start gap-4 p-6 rounded-2xl border text-left transition-all duration-500",
                                                formData.filingStatus === s.id
                                                    ? "bg-primary/5 border-primary shadow-xl ring-1 ring-primary/20 scale-[1.02]"
                                                    : "hover:bg-secondary/40 hover:border-foreground/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
                                                formData.filingStatus === s.id ? "bg-primary text-white scale-110" : "bg-secondary text-muted-foreground group-hover:text-primary"
                                            )}>
                                                <ComponentInstanceIcon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <div className="font-black text-lg tracking-tight mb-1">{s.label}</div>
                                                <div className="text-xs text-muted-foreground/80 font-medium leading-relaxed">{s.desc}</div>
                                            </div>
                                            {formData.filingStatus === s.id && (
                                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Data Entry Matrix: Personal */}
                            {currentStep.id === 'personal' && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Legal Identifier</label>
                                            <Input
                                                className="h-14 rounded-xl bg-secondary/30 border-0 text-xl font-bold px-6 focus-visible:bg-background transition-all"
                                                value={formData.firstName}
                                                onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                                placeholder="Given Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Family Designation</label>
                                            <Input
                                                className="h-14 rounded-xl bg-secondary/30 border-0 text-xl font-bold px-6 focus-visible:bg-background transition-all"
                                                value={formData.lastName}
                                                onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                                placeholder="Surname"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-6 pt-4 border-t border-border/50">
                                        <label className="group flex items-center gap-4 cursor-pointer">
                                            <div className={cn(
                                                "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                formData.isOver65 ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                                            )}>
                                                {formData.isOver65 && <CheckIcon className="h-4 w-4 text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={formData.isOver65} onChange={e => setFormData(f => ({ ...f, isOver65: e.target.checked }))} />
                                            <span className="text-sm font-bold">Standard Senior Exemption (65+)</span>
                                        </label>
                                        <label className="group flex items-center gap-4 cursor-pointer">
                                            <div className={cn(
                                                "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                                                formData.isBlind ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                                            )}>
                                                {formData.isBlind && <CheckIcon className="h-4 w-4 text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={formData.isBlind} onChange={e => setFormData(f => ({ ...f, isBlind: e.target.checked }))} />
                                            <span className="text-sm font-bold">Vision Capability Exemption</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Spouse Matrix */}
                            {currentStep.id === 'spouse' && isMarried && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secondary Unit Identifier</label>
                                        <Input
                                            className="h-14 rounded-xl bg-secondary/30 border-0 text-xl font-bold px-6 focus-visible:bg-background transition-all"
                                            value={formData.spouseFirstName}
                                            onChange={e => setFormData(f => ({ ...f, spouseFirstName: e.target.value }))}
                                            placeholder="Given Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secondary Surname</label>
                                        <Input
                                            className="h-14 rounded-xl bg-secondary/30 border-0 text-xl font-bold px-6 focus-visible:bg-background transition-all"
                                            value={formData.spouseLastName}
                                            onChange={e => setFormData(f => ({ ...f, spouseLastName: e.target.value }))}
                                            placeholder="Surname"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Optimization Matrix: Life Events */}
                            {currentStep.id === 'life' && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {LIFE_QUESTIONS.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => setLifeEvents(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-500 text-center gap-3 group",
                                                lifeEvents[q.id]
                                                    ? "bg-primary text-white border-primary shadow-xl scale-105"
                                                    : "hover:bg-secondary/40 hover:border-foreground/20"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500",
                                                lifeEvents[q.id] ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground group-hover:scale-110 group-hover:text-primary"
                                            )}>
                                                <q.icon className="h-6 w-6" />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-tighter leading-tight">{q.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Dependent Matrix */}
                            {currentStep.id === 'dependents' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <AnimatePresence>
                                            {formData.dependents.map((d) => (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    key={d.id}
                                                    className="p-4 rounded-xl border bg-secondary/20 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs italic">
                                                            {d.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm tracking-tight">{d.firstName}</div>
                                                            <div className="text-[10px] uppercase font-bold text-muted-foreground/60">{d.relationship} • {d.age}Y</div>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive" onClick={() => setFormData(f => ({ ...f, dependents: f.dependents.filter(x => x.id !== d.id) }))}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    <div className="p-8 rounded-2xl border-2 border-dashed border-border/60 bg-secondary/10 flex flex-col md:flex-row items-center gap-4">
                                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                            <Input
                                                className="h-12 rounded-xl bg-background border-0 px-4 font-bold"
                                                placeholder="Dependent Full Name"
                                                value={newDep.firstName}
                                                onChange={e => setNewDep({ ...newDep, firstName: e.target.value })}
                                            />
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    className="h-12 rounded-xl bg-background border-0 px-4 font-bold w-full"
                                                    placeholder="Age"
                                                    value={newDep.age || ''}
                                                    onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })}
                                                />
                                                <Button className="h-12 w-12 rounded-xl shadow-lg" onClick={addDependent} disabled={!newDep.firstName}>
                                                    <PlusIcon className="h-6 w-6" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>

                {/* Console Controls */}
                <CardContent className="bg-secondary/40 p-8 flex justify-between items-center border-t border-white/5 backdrop-blur-md">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={prevStep}
                        disabled={step === 0}
                        className={cn("h-14 px-8 rounded-xl font-bold", step === 0 && "invisible")}
                    >
                        <ArrowLeftIcon className="mr-3 h-5 w-5" />
                        Previous Matrix
                    </Button>

                    <Button onClick={nextStep} variant="premium" className="h-14 px-10 rounded-xl font-black text-md shadow-2xl">
                        {step === STEPS.length - 1 ? 'Execute Returns' : 'Commit Data'}
                        <ArrowRightIcon className="ml-3 h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetupPage;
