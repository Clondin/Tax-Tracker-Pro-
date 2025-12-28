import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeductionItem, TaxResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import {
    HomeIcon,
    HeartIcon,
    SunIcon,
    PlusIcon,
    TrashIcon,
    Pencil1Icon,
    CheckIcon,
    Cross2Icon,
    RocketIcon
} from '@radix-ui/react-icons';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

const DEDUCTION_CATEGORIES = [
    { id: 'health', label: 'Health & FSA', subtitle: 'Medical expenses, HSA', icon: HeartIcon },
    { id: 'home', label: 'Mortgage & Home', subtitle: 'Interest, property tax', icon: HomeIcon },
    { id: 'charity', label: 'Charitable Giving', subtitle: 'Donations', icon: RocketIcon },
    { id: 'credits', label: 'Energy & Credits', subtitle: 'Solar, EV, etc.', icon: SunIcon },
];

const STANDARD_DEDUCTION = 14600; // 2024 single

const DeductionsPage: React.FC<DeductionsPageProps> = ({ deductions, setDeductions, taxResult }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<DeductionItem>>({
        description: '',
        amount: 0,
        category: 'mortgage',
    });

    const resetForm = () => {
        setEditingId(null);
        setActiveCategory(null);
        setForm({ description: '', amount: 0, category: 'mortgage' });
    };

    const selectCategory = (catId: string) => {
        setActiveCategory(catId);
        setEditingId(null);
        let category: DeductionItem['category'] = 'mortgage';
        if (catId === 'health') category = 'medical';
        if (catId === 'charity') category = 'charity_cash';
        if (catId === 'credits') category = 'energy_credit';
        setForm({ description: '', amount: 0, category });
    };

    const handleEdit = (item: DeductionItem) => {
        setEditingId(item.id);
        const cat = DEDUCTION_CATEGORIES.find(c => {
            if (['medical', 'hsa_contrib'].includes(item.category)) return c.id === 'health';
            if (['mortgage', 'property_tax', 'salt'].includes(item.category)) return c.id === 'home';
            if (['charity_cash', 'charity_noncash'].includes(item.category)) return c.id === 'charity';
            return c.id === 'credits';
        });
        setActiveCategory(cat?.id || 'home');
        setForm(item);
    };

    const handleSave = () => {
        if (!form.description || !form.amount) return;

        const newItem: DeductionItem = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            description: form.description,
            amount: Number(form.amount),
            category: form.category as any,
            details: {}
        };

        if (editingId) {
            setDeductions(deductions.map(d => d.id === editingId ? newItem : d));
        } else {
            setDeductions([...deductions, newItem]);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        setDeductions(deductions.filter(d => d.id !== id));
    };

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const isStandardBetter = totalDeductions < STANDARD_DEDUCTION;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deductions</h1>
                    <p className="text-muted-foreground mt-2">Maximize your tax savings.</p>
                </div>
                <Card className={cn(
                    "border-none shadow-lg transition-colors",
                    isStandardBetter ? "bg-muted text-muted-foreground" : "bg-emerald-600 text-white"
                )}>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <RocketIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-medium opacity-90">Total Deductions</div>
                            <div className="text-2xl font-bold">${totalDeductions.toLocaleString()}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strategy Tip */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <SunIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-primary">Recommendation</h4>
                        <p className="text-sm text-muted-foreground">
                            {isStandardBetter
                                ? `Take the Standard Deduction of $${STANDARD_DEDUCTION.toLocaleString()}. You need $${(STANDARD_DEDUCTION - totalDeductions).toLocaleString()} more to itemize.`
                                : "You should Itemize! You have exceeded the standard deduction."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form/Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {activeCategory ? (
                        <Card className="border-primary/20 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {editingId ? 'Edit Deduction' : `Add ${DEDUCTION_CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                                    </CardTitle>
                                    <CardDescription>Enter the details below</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={resetForm}>
                                    <Cross2Icon className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <Input
                                        placeholder="e.g. Mortgage Interest, Charity Name"
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            value={form.amount || ''}
                                            onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                    <Button onClick={handleSave}>
                                        <CheckIcon className="mr-2 w-4 h-4" />
                                        Save Deduction
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {DEDUCTION_CATEGORIES.map((cat) => (
                                <Card
                                    key={cat.id}
                                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                                    onClick={() => selectCategory(cat.id)}
                                >
                                    <CardContent className="p-6 flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors text-muted-foreground group-hover:text-primary">
                                            <cat.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{cat.label}</h3>
                                            <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Deductions List */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight">Your Deductions</h3>
                        {deductions.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                No deductions added yet. Select a category above.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {deductions.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-md bg-muted">
                                                    <CheckIcon />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{item.description}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{item.category.replace('_', ' ')}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="font-bold tabular-nums">${item.amount.toLocaleString()}</div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                        <Pencil1Icon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <TrashIcon className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>

                {/* Summary Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Deduction Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Standard Deduction</span>
                                    <span className="font-medium">${STANDARD_DEDUCTION.toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-border" />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Your Itemized Total</span>
                                    <span className={cn("font-bold", isStandardBetter ? "text-muted-foreground" : "text-emerald-600")}>
                                        ${totalDeductions.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DeductionsPage;
