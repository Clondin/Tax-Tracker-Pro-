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
    PlusIcon
} from '@radix-ui/react-icons';

interface SetupPageProps {
    setTaxPayer: (data: TaxPayer) => void;
}

const STEPS = [
    { id: 'status', title: 'Filing Status', subtitle: "How are you filing?", icon: PersonIcon },
    { id: 'personal', title: 'Your Info', subtitle: 'Basic information', icon: IdCardIcon },
    { id: 'spouse', title: 'Spouse Info', subtitle: 'About your spouse', icon: HeartIcon },
    { id: 'life', title: 'Life Events', subtitle: 'Major changes this year', icon: StarIcon },
    { id: 'dependents', title: 'Dependents', subtitle: 'Who do you support?', icon: FaceIcon },
];

const LIFE_QUESTIONS = [
    { id: 'bought_home', icon: HomeIcon, label: 'Bought a home' },
    { id: 'had_baby', icon: FaceIcon, label: 'Had a baby' },
    { id: 'got_married', icon: HeartIcon, label: 'Got married' },
    { id: 'started_business', icon: LaptopIcon, label: 'Started a business' },
    { id: 'sold_stocks', icon: RocketIcon, label: 'Sold investments' },
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
        navigate('/income');
    };

    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Step {step + 1} of {STEPS.length}
                        </div>
                        <h1 className="text-2xl font-bold">{currentStep.title}</h1>
                        <p className="text-muted-foreground text-sm">{currentStep.subtitle}</p>
                    </div>
                    <div className="flex gap-1">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    i === step ? "bg-primary w-6" : i < step ? "bg-primary/50" : "bg-muted"
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
                    />
                </div>
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Filing Status */}
                    {currentStep.id === 'status' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'single', label: 'Single', desc: 'Unmarried or legally separated' },
                                { id: 'married_joint', label: 'Married Filing Jointly', desc: 'Combined with spouse' },
                                { id: 'head_household', label: 'Head of Household', desc: 'Unmarried with dependents' },
                                { id: 'married_separate', label: 'Married Filing Separately', desc: 'Separate from spouse' },
                            ].map((s) => (
                                <Card
                                    key={s.id}
                                    onClick={() => handleStatusChange(s.id as any)}
                                    className={cn(
                                        "cursor-pointer transition-all",
                                        formData.filingStatus === s.id
                                            ? "ring-2 ring-primary bg-primary/5"
                                            : "hover:border-primary/50"
                                    )}
                                >
                                    <CardContent className="p-4 flex items-start gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5",
                                            formData.filingStatus === s.id ? "border-primary bg-primary" : "border-muted-foreground"
                                        )}>
                                            {formData.filingStatus === s.id && <CheckIcon className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <div className="font-medium">{s.label}</div>
                                            <div className="text-xs text-muted-foreground">{s.desc}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Personal Info */}
                    {currentStep.id === 'personal' && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">First Name</label>
                                        <Input
                                            value={formData.firstName}
                                            onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
                                            placeholder="John"
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
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isOver65}
                                            onChange={e => setFormData(f => ({ ...f, isOver65: e.target.checked }))}
                                            className="rounded"
                                        />
                                        Age 65+
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isBlind}
                                            onChange={e => setFormData(f => ({ ...f, isBlind: e.target.checked }))}
                                            className="rounded"
                                        />
                                        Legally blind
                                    </label>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Spouse Info */}
                    {currentStep.id === 'spouse' && isMarried && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Spouse First Name</label>
                                        <Input
                                            value={formData.spouseFirstName}
                                            onChange={e => setFormData(f => ({ ...f, spouseFirstName: e.target.value }))}
                                            placeholder="Jane"
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

                    {/* Life Events */}
                    {currentStep.id === 'life' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {LIFE_QUESTIONS.map((q) => (
                                <Card
                                    key={q.id}
                                    onClick={() => setLifeEvents(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                                    className={cn(
                                        "cursor-pointer transition-all",
                                        lifeEvents[q.id] ? "ring-2 ring-primary bg-primary/5" : "hover:border-primary/50"
                                    )}
                                >
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-md",
                                            lifeEvents[q.id] ? "bg-primary text-white" : "bg-muted"
                                        )}>
                                            <q.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{q.label}</span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Dependents */}
                    {currentStep.id === 'dependents' && (
                        <div className="space-y-4">
                            {formData.dependents.length > 0 && (
                                <div className="space-y-2">
                                    {formData.dependents.map((d) => (
                                        <Card key={d.id} className="p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {d.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{d.firstName}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{d.relationship} • Age {d.age}</div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setFormData(f => ({ ...f, dependents: f.dependents.filter(x => x.id !== d.id) }))}
                                            >
                                                <TrashIcon className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <Card className="border-dashed">
                                <CardContent className="p-4 space-y-3">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase">Add Dependent</div>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Name"
                                            value={newDep.firstName}
                                            onChange={e => setNewDep({ ...newDep, firstName: e.target.value })}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Age"
                                            value={newDep.age || ''}
                                            onChange={e => setNewDep({ ...newDep, age: parseInt(e.target.value) })}
                                            className="w-20"
                                        />
                                        <Button onClick={addDependent} disabled={!newDep.firstName}>
                                            <PlusIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 0}
                    className={cn(step === 0 && "invisible")}
                >
                    <ArrowLeftIcon className="mr-2 w-4 h-4" />
                    Back
                </Button>

                <Button onClick={nextStep}>
                    {step === STEPS.length - 1 ? 'Start Tax Return' : 'Continue'}
                    <ArrowRightIcon className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};

export default SetupPage;
