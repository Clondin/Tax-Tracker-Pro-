import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DeductionItem, TaxResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
    ReloadIcon
} from '@radix-ui/react-icons';

interface DeductionsPageProps {
    deductions: DeductionItem[];
    setDeductions: React.Dispatch<React.SetStateAction<DeductionItem[]>>;
    taxResult: TaxResult | null;
}

const DEDUCTION_CATEGORIES = [
    { id: 'health', label: 'Health & FSA', subtitle: 'Medical, HSA', icon: HeartIcon },
    { id: 'home', label: 'Mortgage & Home', subtitle: 'Interest, property tax', icon: HomeIcon },
    { id: 'charity', label: 'Charitable Giving', subtitle: 'Donations', icon: RocketIcon },
    { id: 'credits', label: 'Energy & Credits', subtitle: 'Solar, EV', icon: SunIcon },
];

const STANDARD_DEDUCTION = 14600;

const DeductionsPage: React.FC<DeductionsPageProps> = ({ deductions, setDeductions, taxResult }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
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
        setActiveCategory('home');
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

    // AI Receipt Scanner
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
                if (data.total) {
                    const newItem: DeductionItem = {
                        id: Math.random().toString(36).substr(2, 9),
                        description: data.vendor || 'Receipt',
                        category: data.category === 'charity' ? 'charity_cash' : (data.category === 'medical' ? 'medical' : 'other') as any,
                        amount: data.total,
                        details: { ai_scanned: true, scan_date: data.date }
                    };
                    setDeductions([...deductions, newItem]);
                }
            }
        } catch (err) {
            console.error('Scan failed:', err);
        } finally {
            setIsScanning(false);
        }
    }, [deductions, setDeductions]);

    const handleFileClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Simulate drop event
            const dt = new DataTransfer();
            dt.items.add(file);
            const dropEvent = { preventDefault: () => { }, dataTransfer: dt } as unknown as React.DragEvent;
            await handleFileDrop(dropEvent);
        };
        input.click();
    };

    const totalDeductions = deductions.reduce((a, b) => a + b.amount, 0);
    const isStandardBetter = totalDeductions < STANDARD_DEDUCTION;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Deductions</h1>
                    <p className="text-muted-foreground text-sm">Track expenses to maximize your tax savings</p>
                </div>
                <Card className={cn(
                    "px-4 py-2 border-l-2",
                    isStandardBetter ? "border-l-muted-foreground" : "border-l-emerald-500"
                )}>
                    <div className="text-xs text-muted-foreground">Total Deductions</div>
                    <div className="text-lg font-bold">${totalDeductions.toLocaleString()}</div>
                </Card>
            </div>

            {/* Strategy Card */}
            <Card className={cn(
                "border-l-4",
                isStandardBetter ? "border-l-muted bg-muted/30" : "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
            )}>
                <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn(
                        "p-2 rounded-full",
                        isStandardBetter ? "bg-muted text-muted-foreground" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400"
                    )}>
                        <CheckIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">
                            {isStandardBetter ? 'Take Standard Deduction' : 'Itemize Your Deductions'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {isStandardBetter
                                ? `You need $${(STANDARD_DEDUCTION - totalDeductions).toLocaleString()} more to beat the $${STANDARD_DEDUCTION.toLocaleString()} standard deduction`
                                : 'You have exceeded the standard deduction threshold!'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* AI Receipt Scanner */}
            <Card
                className={cn(
                    "border-dashed border-2 cursor-pointer transition-all group",
                    isDragging ? "border-primary bg-primary/5" : "hover:border-primary/50",
                    isScanning && "animate-pulse-subtle"
                )}
                onClick={handleFileClick}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
            >
                <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                        "p-3 rounded-lg transition-colors",
                        isDragging ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                        {isScanning ? <ReloadIcon className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold">{isScanning ? 'Scanning Receipt...' : 'AI Receipt Scanner'}</h3>
                        <p className="text-sm text-muted-foreground">
                            {isDragging ? 'Drop to scan' : 'Drop or click to upload a receipt image for automatic extraction'}
                        </p>
                    </div>
                    <RocketIcon className="w-5 h-5 text-muted-foreground" />
                </CardContent>
            </Card>

            {/* Category Selection or Form */}
            {activeCategory ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base">
                            {editingId ? 'Edit Deduction' : `Add ${DEDUCTION_CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={resetForm}>
                            <Cross2Icon className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                placeholder="e.g. Mortgage Interest, Charity Name"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                <Input
                                    type="number"
                                    className="pl-7"
                                    value={form.amount || ''}
                                    onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button onClick={handleSave}>
                                <CheckIcon className="mr-2 w-4 h-4" />
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {DEDUCTION_CATEGORIES.map((cat) => (
                        <Card
                            key={cat.id}
                            className="cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
                            onClick={() => selectCategory(cat.id)}
                        >
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                                    <cat.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm">{cat.label}</h3>
                                    <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Deductions List */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Your Deductions ({deductions.length})</h3>
                {deductions.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg text-muted-foreground text-sm">
                        No deductions added yet. Use the AI scanner or select a category above.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {deductions.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-muted">
                                        <CheckIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{item.description}</div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {item.category.replace('_', ' ')}
                                            {item.details?.ai_scanned && <span className="ml-2 text-primary">• AI Scanned</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="font-semibold">${item.amount.toLocaleString()}</div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                            <Pencil1Icon className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                                            <TrashIcon className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeductionsPage;
