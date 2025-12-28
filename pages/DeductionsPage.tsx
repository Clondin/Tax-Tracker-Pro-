import React, { useState, useCallback } from 'react';
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
    TrashIcon,
    Pencil1Icon,
    CheckIcon,
    Cross2Icon,
    RocketIcon,
    UploadIcon,
    ReloadIcon,
    MagicWandIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon,
    ComponentInstanceIcon,
} from '@radix-ui/react-icons';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

const DEDUCTION_CATEGORIES = [
    { id: 'health', label: 'Medical & HSA', subtitle: 'Healthcare expenses', icon: HeartIcon, category: 'medical' },
    { id: 'home', label: 'Home & Interest', subtitle: 'Mortgage & Taxes', icon: HomeIcon, category: 'mortgage' },
    { id: 'charity', label: 'Charitable', subtitle: 'Cash & Goods', icon: RocketIcon, category: 'charity_cash' },
    { id: 'credits', label: 'Green Energy', subtitle: 'Solar & EV Credits', icon: SunIcon, category: 'energy_credit' },
];

const STANDARD_DEDUCTION = 14600;

const DeductionsPage: React.FC<DeductionsPageProps> = ({ deductions, setDeductions, taxResult }) => {
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [form, setForm] = useState<Partial<DeductionItem>>({
        description: '',
        amount: 0,
        category: 'mortgage',
    });

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const isStandardBetter = totalDeductions < STANDARD_DEDUCTION;

    const handleNew = (cat: typeof DEDUCTION_CATEGORIES[0]) => {
        setIsCreating(true);
        setSelectedItemId(null);
        setForm({
            description: '',
            amount: 0,
            category: cat.category as any,
            details: {}
        });
    };

    const handleSelect = (item: DeductionItem) => {
        setSelectedItemId(item.id);
        setIsCreating(false);
        setForm(item);
    };

    const handleSave = () => {
        if (!form.description || (form.amount === undefined)) return;

        const newItem: DeductionItem = {
            id: selectedItemId || Math.random().toString(36).substr(2, 9),
            description: form.description,
            amount: Number(form.amount),
            category: form.category as any,
            details: form.details || {}
        };

        if (selectedItemId) {
            setDeductions(deductions.map(d => d.id === selectedItemId ? newItem : d));
        } else {
            setDeductions([...deductions, newItem]);
        }
        setIsCreating(false);
        setSelectedItemId(newItem.id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeductions(deductions.filter(d => d.id !== id));
        if (selectedItemId === id) setSelectedItemId(null);
    };

    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        setIsScanning(true);
        try {
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });

            const response = await fetch('/api/gemini/receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, mimeType: file.type })
            });

            if (response.ok) {
                const data = await response.json();
                const newItem: DeductionItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    description: data.vendor || 'AI Receipt Entry',
                    category: data.category === 'charity' ? 'charity_cash' : (data.category === 'medical' ? 'medical' : 'other') as any,
                    amount: data.total || 0,
                    details: { ai_scanned: true, scan_date: data.date }
                };
                setDeductions(prev => [...prev, newItem]);
                setSelectedItemId(newItem.id);
            }
        } catch (err) {
            console.error('AI Scan Error:', err);
        } finally {
            setIsScanning(false);
        }
    }, [deductions, setDeductions]);

    return (
        <div className="flex flex-col gap-10">
            {/* Strategy Overview Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={cn(
                    "md:col-span-2 border-0 shadow-xl relative overflow-hidden",
                    isStandardBetter ? "bg-secondary/30" : "bg-emerald-500/10 border border-emerald-500/20"
                )}>
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <RocketIcon className={cn("h-5 w-5", isStandardBetter ? "text-muted-foreground" : "text-emerald-500")} />
                                <h3 className="text-xl font-bold tracking-tight">Strategy Portfolio</h3>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {isStandardBetter
                                    ? `You are currently utilizing the $${STANDARD_DEDUCTION.toLocaleString()} Standard Deduction. You need $${(STANDARD_DEDUCTION - totalDeductions).toLocaleString()} more in itemized expenses to exceed this baseline.`
                                    : 'Excellent. Your itemized deductions have exceeded the standard threshold, lowering your taxable income further.'}
                            </p>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Verified Value</div>
                            <div className={cn("text-5xl font-black tabular-nums", isStandardBetter ? "text-foreground" : "text-emerald-500")}>
                                ${totalDeductions.toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="glass-card shadow-lg flex flex-col justify-center items-center p-8 border-dashed border-2">
                    <div className="text-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                            <MagnifyingGlassIcon className="h-6 w-6" />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-widest">Savings Potential</h4>
                        <div className="text-2xl font-black tabular-nums text-primary">
                            72%
                        </div>
                    </div>
                </Card>
            </div>

            {/* AI Receipt Scanner Dropzone */}
            <Card
                className={cn(
                    "relative border-2 border-dashed transition-all duration-500 group overflow-hidden h-40",
                    isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/40 bg-secondary/10",
                    isScanning && "animate-pulse"
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            handleFileDrop({ preventDefault: () => { }, dataTransfer: dt } as any);
                        }
                    };
                    input.click();
                }}
            >
                <CardContent className="h-full flex flex-col items-center justify-center gap-4 cursor-pointer p-0">
                    <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                        isDragging ? "bg-primary text-white scale-110" : "bg-primary/20 text-primary group-hover:scale-110"
                    )}>
                        {isScanning ? <ReloadIcon className="h-7 w-7 animate-spin" /> : <MagicWandIcon className="h-7 w-7" />}
                    </div>
                    <div className="text-center">
                        <h4 className="text-lg font-black tracking-tight">{isScanning ? 'Decrypting Receipt Architecture...' : 'Universal Receipt Ingestion'}</h4>
                        <p className="text-xs text-muted-foreground font-medium">Drop receipt imagery or click to initiate AI biometric extraction</p>
                    </div>
                </CardContent>
                {isScanning && (
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        />
                    </div>
                )}
            </Card>

            {/* Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Master: Deduction Categories & Items */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expense Inventory</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {deductions.length} Classified
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {DEDUCTION_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleNew(cat)}
                                className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/20 hover:bg-secondary/40 hover:border-primary/30 transition-all group text-left"
                            >
                                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                    <cat.icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold leading-none mb-1">{cat.label}</span>
                                    <span className="text-[9px] text-muted-foreground/70 uppercase tracking-tighter">{cat.subtitle}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2 pt-4">
                        <AnimatePresence mode="popLayout">
                            {deductions.map((item) => (
                                <motion.div
                                    layout
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => handleSelect(item)}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300",
                                        selectedItemId === item.id
                                            ? "bg-primary/5 border-primary shadow-md"
                                            : "hover:bg-secondary/40 hover:border-foreground/20"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-300",
                                            selectedItemId === item.id ? "bg-primary text-white" : "bg-background text-muted-foreground"
                                        )}>
                                            <CheckIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm tracking-tight">{item.description}</div>
                                            <div className="text-[10px] uppercase font-medium text-muted-foreground/60 flex items-center gap-2">
                                                {item.category.replace('_', ' ')}
                                                {item.details?.ai_scanned && <span className="text-primary font-bold italic">• Scanned</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div className="font-bold text-sm tabular-nums">${item.amount.toLocaleString()}</div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100"
                                            onClick={(e) => handleDelete(e, item.id)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {deductions.length === 0 && (
                            <div className="text-center py-10 opacity-30 grayscale italic text-xs">
                                No verified expenses detected in vault.
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail: Inspector */}
                <div className="lg:col-span-7 sticky top-28">
                    <AnimatePresence mode="wait">
                        {(selectedItemId || isCreating) ? (
                            <motion.div
                                key={selectedItemId || 'new'}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card rounded-3xl overflow-hidden"
                            >
                                <CardHeader className="p-8 border-b border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Fiscal Inspector</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setIsCreating(false); setSelectedItemId(null); }}>
                                            <Cross2Icon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-2xl font-black">{isCreating ? 'Classify Expense' : form.description}</CardTitle>
                                    <CardDescription>Verified tax-advantageous expenditure details</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entity Name</label>
                                            <Input
                                                className="h-12 rounded-xl bg-secondary/30 border-0 focus-visible:bg-background"
                                                value={form.description}
                                                onChange={e => setForm({ ...form, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Classification</label>
                                            <select
                                                className="w-full h-12 rounded-xl bg-secondary/30 border-0 px-4 text-sm font-bold"
                                                value={form.category}
                                                onChange={e => setForm({ ...form, category: e.target.value as any })}
                                            >
                                                <option value="medical">Medical / HSA</option>
                                                <option value="mortgage">Mortgage Interest</option>
                                                <option value="charity_cash">Cash Donation</option>
                                                <option value="energy_credit">Energy Credit</option>
                                                <option value="other">General Expense</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verified Expenditure Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl text-muted-foreground/30 font-black">$</span>
                                            <Input
                                                type="number"
                                                className="h-24 rounded-2xl bg-secondary/30 border-0 text-5xl font-black pl-14 tabular-nums focus-visible:bg-background"
                                                value={form.amount || ''}
                                                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <Button variant="premium" className="flex-1 h-14 rounded-2xl text-md font-bold" onClick={handleSave}>
                                            <CheckIcon className="mr-2 h-5 w-5" />
                                            Archive Verified Entry
                                        </Button>
                                    </div>
                                </CardContent>
                            </motion.div>
                        ) : (
                            <div className="h-[400px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
                                <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center">
                                    <ComponentInstanceIcon className="h-10 w-10 text-primary" />
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tight">Voucher Console</h4>
                                <p className="text-xs text-muted-foreground max-w-[200px]">Select a classified expenditure to inspect verified data points.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default DeductionsPage;
