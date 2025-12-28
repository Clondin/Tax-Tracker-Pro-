import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IncomeItem, TaxPayer } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
    ReloadIcon
} from '@radix-ui/react-icons';
import PaystubIngestionModal from '../components/PaystubIngestionModal';

interface IncomePageProps {
    incomes: IncomeItem[];
    setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
    taxResult: any;
    taxPayer?: TaxPayer;
}

const INCOME_CATEGORIES = [
    { id: 'W-2', label: 'W-2 Employment', subtitle: 'Wages & salaries', icon: PersonIcon },
    { id: 'Business', label: 'Self-Employment', subtitle: '1099-NEC, Freelance', icon: HomeIcon },
    { id: 'Investment', label: 'Investments', subtitle: 'Dividends, interest', icon: RocketIcon },
    { id: 'Rental', label: 'Rental Property', subtitle: 'Real estate', icon: PieChartIcon },
];

const IncomePage: React.FC<IncomePageProps> = ({ incomes, setIncomes, taxResult, taxPayer }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showPaystubModal, setShowPaystubModal] = useState(false);
    const [form, setForm] = useState<Partial<IncomeItem>>({
        description: '',
        amount: 0,
        withholding: 0,
        type: 'w2',
    });

    const resetForm = () => {
        setEditingId(null);
        setActiveCategory(null);
        setForm({ description: '', amount: 0, withholding: 0, type: 'w2' });
    };

    const selectCategory = (catId: string) => {
        setActiveCategory(catId);
        setEditingId(null);
        let type: IncomeItem['type'] = 'w2';
        if (catId === 'Business') type = '1099_nec';
        if (catId === 'Investment') type = '1099_div';
        if (catId === 'Rental') type = 'rental';
        setForm({ description: '', amount: 0, withholding: 0, type });
    };

    const handleEdit = (item: IncomeItem) => {
        if (item.originalPaystub) {
            setShowPaystubModal(true);
            return;
        }
        setEditingId(item.id);
        setActiveCategory('W-2');
        setForm(item);
    };

    const handleSave = () => {
        if (!form.description || !form.amount) return;

        const newItem: IncomeItem = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            description: form.description,
            amount: Number(form.amount),
            withholding: Number(form.withholding) || 0,
            type: form.type as any,
            payFrequency: 'annual',
            owner: 'primary',
            details: {}
        };

        if (editingId) {
            setIncomes(incomes.map(i => i.id === editingId ? newItem : i));
        } else {
            setIncomes([...incomes, newItem]);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        setIncomes(incomes.filter(i => i.id !== id));
    };

    const handlePaystubImport = (item: IncomeItem) => {
        const exists = incomes.find(i => i.id === item.id);
        if (exists) {
            setIncomes(incomes.map(i => i.id === item.id ? item : i));
        } else {
            setIncomes([...incomes, item]);
        }
        setShowPaystubModal(false);
    };

    const totalIncome = incomes.reduce((a, b) => a + b.amount, 0);
    const totalWithholding = incomes.reduce((a, b) => a + (b.withholding || 0), 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {showPaystubModal && (
                <PaystubIngestionModal
                    onSave={handlePaystubImport}
                    onClose={() => setShowPaystubModal(false)}
                />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Income & Wages</h1>
                    <p className="text-muted-foreground text-sm">Add your income sources for accurate tax calculation</p>
                </div>
                <div className="flex gap-3">
                    <Card className="px-4 py-2 border-l-2 border-l-primary">
                        <div className="text-xs text-muted-foreground">Total Income</div>
                        <div className="text-lg font-bold">${totalIncome.toLocaleString()}</div>
                    </Card>
                    <Card className="px-4 py-2 border-l-2 border-l-emerald-500">
                        <div className="text-xs text-muted-foreground">Withheld</div>
                        <div className="text-lg font-bold">${totalWithholding.toLocaleString()}</div>
                    </Card>
                </div>
            </div>

            {/* AI Paystub Scanner */}
            <Card
                className="border-dashed border-2 hover:border-primary/50 cursor-pointer transition-colors group"
                onClick={() => setShowPaystubModal(true)}
            >
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <UploadIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold">AI Paystub Scanner</h3>
                        <p className="text-sm text-muted-foreground">Upload a paystub to automatically extract income data and extrapolate yearly totals</p>
                    </div>
                    <RocketIcon className="w-5 h-5 text-muted-foreground" />
                </CardContent>
            </Card>

            {/* Category Selection or Form */}
            {activeCategory ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-base">
                            {editingId ? 'Edit Income' : `Add ${INCOME_CATEGORIES.find(c => c.id === activeCategory)?.label}`}
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={resetForm}>
                            <Cross2Icon className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Input
                                placeholder="e.g. Employer Name"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Annual Amount</label>
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
                            {activeCategory === 'W-2' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tax Withheld</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            value={form.withholding || ''}
                                            onChange={e => setForm({ ...form, withholding: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            )}
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
                    {INCOME_CATEGORIES.map((cat) => (
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

            {/* Income List */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Income Sources ({incomes.length})</h3>
                {incomes.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg text-muted-foreground text-sm">
                        No income added yet. Use the AI scanner or select a category above.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {incomes.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-muted">
                                        {item.type === 'w2' ? <PersonIcon className="w-4 h-4" /> :
                                            item.type === 'rental' ? <PieChartIcon className="w-4 h-4" /> :
                                                <RocketIcon className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{item.description}</div>
                                        <div className="text-xs text-muted-foreground capitalize">
                                            {item.type.replace('_', ' ')}
                                            {item.originalPaystub && <span className="ml-2 text-primary">• AI Scanned</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <div className="font-semibold">${item.amount.toLocaleString()}</div>
                                        {item.withholding > 0 && (
                                            <div className="text-xs text-muted-foreground">-${item.withholding.toLocaleString()} tax</div>
                                        )}
                                    </div>
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

export default IncomePage;
