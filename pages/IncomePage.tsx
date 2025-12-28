import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { IncomeItem, TaxResult, TaxPayer } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import {
    PersonIcon,
    HomeIcon,
    PieChartIcon,
    RocketIcon,
    PlusIcon,
    TrashIcon,
    Pencil1Icon,
    CheckIcon,
    Cross2Icon
} from '@radix-ui/react-icons';

interface IncomePageProps {
    incomes: IncomeItem[];
    setIncomes: React.Dispatch<React.SetStateAction<IncomeItem[]>>;
    taxResult: TaxResult | null;
    taxPayer?: TaxPayer;
}

const INCOME_CATEGORIES = [
    { id: 'W-2', label: 'W-2 Employment', subtitle: 'Wages, salaries, tips', icon: PersonIcon },
    { id: 'Business', label: 'Self-Employment', subtitle: 'Freelance, 1099-NEC', icon: HomeIcon },
    { id: 'Investment', label: 'Investments', subtitle: 'Dividends, interest', icon: RocketIcon },
    { id: 'Rental', label: 'Rental Property', subtitle: 'Real estate income', icon: PieChartIcon },
];

const IncomePage: React.FC<IncomePageProps> = ({ incomes, setIncomes, taxResult, taxPayer }) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
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
        setEditingId(item.id);
        const cat = INCOME_CATEGORIES.find(c => {
            if (item.type === 'w2' && c.id === 'W-2') return true;
            if ((item.type === '1099_nec' || item.type === 'ssa_1099') && c.id === 'Business') return true;
            if (item.type === 'rental' && c.id === 'Rental') return true;
            if ((item.type === '1099_div' || item.type === '1099_int' || item.type === 'stock') && c.id === 'Investment') return true;
            return false;
        });
        setActiveCategory(cat?.id || 'W-2');
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

    const totalIncome = incomes.reduce((a, b) => a + b.amount, 0);

    const chartData = incomes.length > 0 ? Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        amount: totalIncome / 12 * (i + 1) // Simplified linear projection
    })) : [];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Income & Wages</h1>
                    <p className="text-muted-foreground mt-2">Manage your income sources for accurate tax calculation.</p>
                </div>
                <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <RocketIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-sm font-medium opacity-90">Total Annual Income</div>
                            <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form/Selection */}
                <div className="lg:col-span-2 space-y-6">
                    {activeCategory ? (
                        <Card className="border-primary/20 shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {editingId ? 'Edit Income' : `Add ${INCOME_CATEGORIES.find(c => c.id === activeCategory)?.label}`}
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
                                        placeholder="e.g. Employer Name, Client, etc."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Annual Amount</label>
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
                                    {activeCategory === 'W-2' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Withholding</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
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
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button variant="outline" onClick={resetForm}>Cancel</Button>
                                    <Button onClick={handleSave}>
                                        <CheckIcon className="mr-2 w-4 h-4" />
                                        Save Income
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {INCOME_CATEGORIES.map((cat) => (
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

                    {/* Income List */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold tracking-tight">Income Sources</h3>
                        {incomes.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                No income sources added yet. Select a category above.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {incomes.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-md bg-muted">
                                                    {item.type === 'w2' ? <PersonIcon /> :
                                                        item.type === 'rental' ? <PieChartIcon /> :
                                                            item.type.includes('1099') ? <HomeIcon /> : <RocketIcon />}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{item.description}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</div>
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

                {/* Right Column: Chart/Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Income Projection</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" hide />
                                        <YAxis hide />
                                        <RechartsTooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="amount"
                                            stroke="hsl(var(--primary))"
                                            fillOpacity={1}
                                            fill="url(#colorIncome)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Estimated Tax (22%)</span>
                                    <span className="font-medium text-destructive">${(totalIncome * 0.22).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Effective Rate</span>
                                    <span className="font-medium">18.4%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default IncomePage;
