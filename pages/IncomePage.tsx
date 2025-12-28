import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IncomeItem, TaxPayer } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import {
    PersonIcon,
    HomeIcon,
    PieChartIcon,
    RocketIcon,
    TrashIcon,
    Pencil1Icon,
    CheckIcon,
    Cross2Icon,
    UploadIcon,
    ReloadIcon,
    MagicWandIcon,
    ChevronRightIcon,
    PlusIcon,
    MixIcon,
} from '@radix-ui/react-icons';
import PaystubIngestionModal from '../components/PaystubIngestionModal';

interface IncomePageProps {
    incomes: IncomeItem[];
    setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
    taxResult: any;
    taxPayer?: TaxPayer;
}

const INCOME_CATEGORIES = [
    { id: 'W-2', label: 'W-2 Wage', subtitle: 'Standard Employment', icon: PersonIcon, type: 'w2' },
    { id: 'Business', label: '1099-NEC', subtitle: 'Self-Employed / Freelance', icon: RocketIcon, type: '1099_nec' },
    { id: 'Investment', label: 'Investment', subtitle: 'Dividends & Interest', icon: MixIcon, type: '1099_div' },
    { id: 'Rental', label: 'Real Estate', subtitle: 'Rental & Royalty', icon: HomeIcon, type: 'rental' },
];

const IncomePage: React.FC<IncomePageProps> = ({ incomes, setIncomes, taxResult, taxPayer }) => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [showPaystubModal, setShowPaystubModal] = useState(false);
    const [form, setForm] = useState<Partial<IncomeItem>>({
        description: '',
        amount: 0,
        withholding: 0,
        type: 'w2',
    });

    const selectedItem = incomes.find(i => i.id === selectedItemId);

    const handleNew = (cat: typeof INCOME_CATEGORIES[0]) => {
        setIsCreating(true);
        setSelectedItemId(null);
        setActiveCategory(cat.id);
        setForm({
            description: '',
            amount: 0,
            withholding: 0,
            type: cat.type as any,
            payFrequency: 'annual',
            owner: 'primary'
        });
    };

    const handleSelect = (item: IncomeItem) => {
        setSelectedItemId(item.id);
        setIsCreating(false);
        setForm(item);
    };

    const handleSave = () => {
        if (!form.description || (form.amount === undefined)) return;

        const newItem: IncomeItem = {
            id: selectedItemId || Math.random().toString(36).substr(2, 9),
            description: form.description,
            amount: Number(form.amount),
            withholding: Number(form.withholding) || 0,
            type: form.type as any,
            payFrequency: 'annual',
            owner: 'primary',
            details: {}
        };

        if (selectedItemId) {
            setIncomes(incomes.map(i => i.id === selectedItemId ? newItem : i));
        } else {
            setIncomes([...incomes, newItem]);
        }
        setIsCreating(false);
        setSelectedItemId(newItem.id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setIncomes(incomes.filter(i => i.id !== id));
        if (selectedItemId === id) setSelectedItemId(null);
    };

    const handlePaystubImport = (item: IncomeItem) => {
        const exists = incomes.find(i => i.id === item.id);
        if (exists) {
            setIncomes(incomes.map(i => i.id === item.id ? item : i));
        } else {
            setIncomes([...incomes, item]);
        }
        setShowPaystubModal(false);
        setSelectedItemId(item.id);
    };

    return (
        <div className="flex flex-col gap-8">
            {showPaystubModal && (
                <PaystubIngestionModal
                    onSave={handlePaystubImport}
                    onClose={() => setShowPaystubModal(false)}
                />
            )}

            {/* AI Call-to-Action */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative group cursor-pointer"
                onClick={() => setShowPaystubModal(true)}
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <Card className="relative bg-card/50 backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all duration-500">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                            <MagicWandIcon className="h-7 w-7" />
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-1">
                            <h3 className="text-xl font-bold tracking-tight">AI Paystub Intelligence</h3>
                            <p className="text-sm text-muted-foreground">Upload your latest paystub. We'll extract all earnings, taxes, and extrapolate your 2025 totals instantly.</p>
                        </div>
                        <Button variant="premium" className="h-12 px-8 rounded-xl shadow-xl">
                            <UploadIcon className="mr-2 h-4 w-4" />
                            Scan Document
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Master-Detail Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Master: List of Items */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Income Sources</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {incomes.length} Entries
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                        {INCOME_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleNew(cat)}
                                className="flex flex-col items-start p-4 rounded-xl border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all group text-left"
                            >
                                <cat.icon className="h-4 w-4 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                                <span className="text-xs font-bold">{cat.label}</span>
                                <span className="text-[10px] text-muted-foreground/70">{cat.subtitle}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {incomes.map((item) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "group relative flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300",
                                        selectedItemId === item.id
                                            ? "bg-primary/5 border-primary ring-1 ring-primary/20 shadow-lg"
                                            : "hover:bg-secondary/50 hover:border-foreground/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-10 w-10 rounded-lg flex items-center justify-center transition-colors duration-300",
                                            selectedItemId === item.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                        )}>
                                            <RocketIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm tracking-tight">{item.description}</div>
                                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-2">
                                                {item.type.replace('_', ' ')}
                                                {item.originalPaystub && <span className="text-primary italic">• AI Scanned</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-black text-sm tabular-nums">${item.amount.toLocaleString()}</div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => handleDelete(e, item.id)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {incomes.length === 0 && (
                            <div className="text-center py-12 border border-dashed rounded-2xl bg-secondary/10">
                                <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 grayscale">
                                    <RocketIcon className="h-6 w-6" />
                                </div>
                                <h4 className="text-sm font-bold text-muted-foreground">No income streams logged</h4>
                                <p className="text-xs text-muted-foreground/60">Choose a category above or scan a paystub</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail: Editor / Viewer */}
                <div className="lg:col-span-7 sticky top-28">
                    <AnimatePresence mode="wait">
                        {(selectedItemId || isCreating) ? (
                            <motion.div
                                key={selectedItemId || 'new'}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <Card className="border-0 shadow-2xl overflow-hidden glass-card">
                                    <CardHeader className="bg-gradient-to-r from-secondary/50 to-transparent p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                                                {isCreating ? 'Provisioning Entry' : 'Entry Intelligence'}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setIsCreating(false); setSelectedItemId(null); }}>
                                                <Cross2Icon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <CardTitle className="text-2xl font-black">{isCreating ? 'New Revenue Stream' : form.description}</CardTitle>
                                        <CardDescription>Adjust fiscal parameters and tax withholdings</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description / Entity</label>
                                                <Input
                                                    className="h-12 rounded-xl bg-secondary/30 border-0 focus-visible:ring-primary focus-visible:bg-background transition-all"
                                                    placeholder="Stripe, Inc."
                                                    value={form.description}
                                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type Coverage</label>
                                                <select
                                                    className="w-full h-12 rounded-xl bg-secondary/30 border-0 focus-visible:ring-primary focus-visible:bg-background transition-all px-4 text-sm font-medium"
                                                    value={form.type}
                                                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                                                >
                                                    <option value="w2">W-2 Salary</option>
                                                    <option value="1099_nec">1099-NEC Self-Employment</option>
                                                    <option value="1099_div">Investment Dividend</option>
                                                    <option value="rental">Real Estate Revenue</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="group relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Annualized Gross Value</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg italic">$</span>
                                                    <Input
                                                        type="number"
                                                        className="h-20 rounded-2xl bg-secondary/30 border-0 text-3xl font-black pl-10 focus-visible:ring-primary focus-visible:bg-background transition-all"
                                                        value={form.amount || ''}
                                                        onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="group relative">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Total Federal Withholding</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg italic">$</span>
                                                    <Input
                                                        type="number"
                                                        className="h-20 rounded-2xl bg-secondary/30 border-0 text-3xl font-black pl-10 focus-visible:ring-primary focus-visible:bg-background transition-all"
                                                        value={form.withholding || ''}
                                                        onChange={e => setForm({ ...form, withholding: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-6">
                                            <Button variant="premium" className="flex-1 h-14 rounded-xl text-md font-bold" onClick={handleSave}>
                                                <CheckIcon className="mr-2 h-5 w-5" />
                                                Commit Changes
                                            </Button>
                                            <Button variant="outline" className="h-14 w-14 rounded-xl border-border/50" onClick={() => { setIsCreating(false); setSelectedItemId(null); }}>
                                                <Cross2Icon className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-3xl opacity-30 group hover:opacity-100 transition-opacity duration-500"
                            >
                                <div className="text-center space-y-4">
                                    <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto group-hover:rotate-12 transition-transform duration-500">
                                        <RocketIcon className="h-10 w-10 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black">Entry Intelligence</h4>
                                        <p className="max-w-[240px] text-sm text-muted-foreground font-medium">Select an income stream from the console to evaluate fiscal metrics.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default IncomePage;
