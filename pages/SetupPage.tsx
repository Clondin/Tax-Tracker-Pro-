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
    BackpackIcon,
    LaptopIcon,
    RocketIcon,
    TrashIcon,
    PlusIcon
} from '@radix-ui/react-icons';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const STEPS = [
    { id: 'status', title: 'Filing Status', subtitle: "Let's start with how you're filing", icon: PersonIcon },
    { id: 'personal', title: 'Your Info', subtitle: 'Tell us about yourself', icon: IdCardIcon },
    { id: 'spouse', title: 'Spouse Info', subtitle: 'About your spouse', icon: HeartIcon },
    { id: 'life', title: 'Life Events', subtitle: 'Any major changes this year?', icon: StarIcon },
    { id: 'dependents', title: 'Dependents', subtitle: 'Who do you support?', icon: FaceIcon },
];

const LIFE_QUESTIONS = [
    { id: 'bought_home', icon: HomeIcon, label: 'Bought a home', hint: 'Mortgage interest deductions' },
    { id: 'had_baby', icon: FaceIcon, label: 'Had a baby', hint: 'Child Tax Credit' },
    { id: 'got_married', icon: HeartIcon, label: 'Got married', hint: 'Filing status change' },
    { id: 'started_business', icon: LaptopIcon, label: 'Started a business', hint: 'Schedule C income' },
    { id: 'sold_stocks', icon: RocketIcon, label: 'Sold investments', hint: 'Capital gains/losses' },
    { id: 'went_to_college', icon: BackpackIcon, label: 'Paid for education', hint: 'Education credits' },
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
        <div className="max-w-4xl mx-auto min-h-[80vh] flex flex-col pt-8">
            {/* Header with Progress */}
            <div className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 mb-3 text-muted-foreground"
                        >
                            <span className="text-xs font-bold uppercase tracking-widest">
                                Step {step + 1} of {STEPS.length}
                            </span>
                        </motion.div>
                        <motion.h1
                            key={currentStep.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
                        >
                            {currentStep.title}
                        </motion.h1>
                        <motion.p
                            key={currentStep.subtitle}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-muted-foreground"
                        >
                            {currentStep.subtitle}
                        </motion.p>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {STEPS.map((s, i) => (
                            <div
                                key={s.id}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    i === step ? "bg-primary w-8" : i < step ? "bg-primary/50" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
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
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Filing Status Step */}
                        {currentStep.id === 'status' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'single', label: 'Single', icon: PersonIcon, desc: 'Unmarried, divorced, or legally separated' },
                                    { id: 'married_joint', label: 'Married Filing Jointly', icon: HeartIcon, desc: 'Combined income with spouse' },
                                    { id: 'head_household', label: 'Head of Household', icon: HomeIcon, desc: 'Unmarried with qualifying dependent' },
                                    { id: 'married_separate', label: 'Married Filing Separately', icon: PersonIcon, desc: 'Separate returns from spouse' },
                                ].map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => handleStatusChange(s.id as any)}
                                        className={cn(
                                            "relative p-6 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                                            formData.filingStatus === s.id
                                                ? "border-primary bg-primary/5 shadow-md"
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={cn(
                                                "p-3 rounded-lg",
                                                formData.filingStatus === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                <s.icon className="w-6 h-6" />
                                            </div>
                                            {formData.filingStatus === s.id && (
                                                <CheckIcon className="w-6 h-6 text-primary" />
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-lg mb-1">{s.label}</h3>
                                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Personal Info Step */}
                        {currentStep.id === 'personal' && (
                            <Card>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">First Name</label>
                                            <Input
                                                value={formData.firstName}
                                                onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                                placeholder="John"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Last Name</label>
                                            <Input
                                                value={formData.lastName}
                                                onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 pt-4 border-t">
                                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.isOver65}
                                                onChange={e => setFormData(f => ({ ...f, isOver65: e.target.checked }))}
                                                className="w-4 h-4 rounded border-primary text-primary focus:ring-offset-background"
                                            />
                                            <span className="text-sm font-medium">I was born before Jan 2, 1959 (Age 65+)</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.isBlind}
                                                onChange={e => setFormData(f => ({ ...f, isBlind: e.target.checked }))}
                                                className="w-4 h-4 rounded border-primary text-primary focus:ring-offset-background"
                                            />
                                            <span className="text-sm font-medium">I am legally blind</span>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Spouse Info Step */}
                        {currentStep.id === 'spouse' && isMarried && (
                            <Card>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Spouse First Name</label>
                                            <Input
                                                value={formData.spouseFirstName}
                                                onChange={e => setFormData(f => ({ ...f, spouseFirstName: e.target.value }))}
                                                placeholder="Jane"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Spouse Last Name</label>
                                            <Input
                                                value={formData.spouseLastName}
                                                onChange={e => setFormData(f => ({ ...f, spouseLastName: e.target.value }))}
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Life Events Step */}
                        {currentStep.id === 'life' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {LIFE_QUESTIONS.map((q) => (
                                    <div
                                        key={q.id}
                                        onClick={() => setLifeEvents(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                        className={cn(
                                            "relative p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md",
                                            lifeEvents[q.id]
                                                ? "border-primary bg-primary/5"
                                                : "border-border bg-card hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "p-2 rounded-md",
                                                lifeEvents[q.id] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                <q.icon className="w-5 h-5" />
                                            </div>
                                            <div className="font-medium text-sm">{q.label}</div>
                                        </div>
                                        <div className="text-xs text-muted-foreground ml-12">{q.hint}</div>
                                        {lifeEvents[q.id] && (
                                            <div className="absolute top-2 right-2 text-primary">
                                                <CheckIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Dependents Step */}
                        {currentStep.id === 'dependents' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                {formData.dependents.length > 0 && (
                                    <div className="space-y-3">
                                        {formData.dependents.map((d) => (
                                            <Card key={d.id} className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {d.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">{d.firstName}</div>
                                                        <div className="text-xs text-muted-foreground capitalize">{d.relationship} • Age {d.age}</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setFormData(f => ({ ...f, dependents: f.dependents.filter(x => x.id !== d.id) }))}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </Button>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                <Card className="border-dashed">
                                    <CardContent className="p-6">
                                        <h3 className="text-sm font-semibold mb-4 text-muted-foreground">ADD DEPENDENT</h3>
                                        <div className="grid grid-cols-12 gap-3 mb-4">
                                            <div className="col-span-12 md:col-span-5">
                                                <Input
                                                    placeholder="Name"
                                                    value={newDep.firstName}
                                                    onChange={e => setNewDep({ ...newDep, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-3">
                                                <Input
                                                    type="number"
                                                    placeholder="Age"
                                                    value={newDep.age || ''}
                                                    onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })}
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-4">
                                                <select
                                                    value={newDep.relationship}
                                                    onChange={e => setNewDep({ ...newDep, relationship: e.target.value as any })}
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="child">Child</option>
                                                    <option value="parent">Parent</option>
                                                    <option value="sibling">Sibling</option>
                                                    <option value="relative">Other Relative</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button onClick={addDependent} className="w-full" disabled={!newDep.firstName}>
                                            <PlusIcon className="mr-2 h-4 w-4" />
                                            Add Dependent
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center py-6 border-t mt-12 bg-background/50 backdrop-blur-sm sticky bottom-0 z-10">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 0}
                    className={cn(step === 0 && "opacity-0")}
                >
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <Button onClick={nextStep} size="lg" className="px-8 shadow-lg shadow-primary/20">
                    {step === STEPS.length - 1 ? 'Start Tax Return' : 'Continue'}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default SetupPage;
