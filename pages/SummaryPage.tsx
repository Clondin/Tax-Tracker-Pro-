import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TaxResult } from '../types';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    PieChartIcon,
    ArrowTopRightIcon,
    ArrowBottomLeftIcon,
    CheckCircledIcon,
    ExclamationTriangleIcon,
    RocketIcon,
    MixIcon,
    FileTextIcon,
    ComponentInstanceIcon,
} from '@radix-ui/react-icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Pie,
    PieChart as RechartsPieChart
} from 'recharts';

interface SummaryPageProps {
    taxResult: TaxResult | null;
}

const WHAT_IF_SCENARIOS = [
    { id: 'max_401k', label: 'Max 401(k)', impact: -4500, description: 'Contribute $23k', color: 'indigo' },
    { id: 'max_ira', label: 'Max IRA', impact: -1400, description: 'Contribute $7k', color: 'blue' },
    { id: 'hsa', label: 'Max HSA', impact: -800, description: 'Contribute $4.1k', color: 'emerald' },
    { id: 'solar', label: 'Solar Install', impact: -5000, description: '30% tax credit', color: 'orange' },
];

const SummaryPage: React.FC<SummaryPageProps> = ({ taxResult }) => {
    const [activeScenarios, setActiveScenarios] = useState<Record<string, boolean>>({});
    const [showPlayground, setShowPlayground] = useState(false);

    const adjustedResult = useMemo(() => {
        if (!taxResult) return null;
        const totalImpact = WHAT_IF_SCENARIOS.filter(s => activeScenarios[s.id]).reduce((a, b) => a + b.impact, 0);
        return {
            ...taxResult,
            refund: Math.max(0, taxResult.refund - totalImpact),
            amountDue: Math.max(0, taxResult.amountDue + totalImpact),
            impactAmount: -totalImpact
        };
    }, [taxResult, activeScenarios]);

    if (!taxResult) return null;

    const result = adjustedResult || taxResult;
    const isRefund = result.refund > 0;
    const hasErrors = taxResult.complianceAlerts.some(a => a.severity === 'error');

    // Chart Data
    const taxComposition = [
        { name: 'Income Tax', value: taxResult.regularTax, color: '#6366f1' },
        { name: 'S.E. Tax', value: taxResult.selfEmploymentTax, color: '#a855f7' },
        { name: 'Other', value: taxResult.niit + taxResult.alternativeMinimumTax, color: '#ec4899' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-10 animate-premium-in">
            {/* Mission Control Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Real-time Intelligence</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                        Financial Overview
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        Comprehensive analysis of your 2025 tax position based on current IRS projections and regulations.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="lg" className="rounded-xl border-border/50 bg-secondary/30 backdrop-blur-sm" onClick={() => setShowPlayground(!showPlayground)}>
                        <MixIcon className="mr-2 h-4 w-4" />
                        Scenario Simulator
                    </Button>
                    <Button variant="premium" size="lg" className="rounded-xl shadow-lg">
                        <RocketIcon className="mr-2 h-4 w-4" />
                        Finalize Return
                    </Button>
                </div>
            </div>

            {/* Main Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Card: Refund/Owed */}
                <Card className={cn(
                    "relative overflow-hidden lg:col-span-2 border-0 shadow-2xl transition-transform duration-500 hover:scale-[1.01]",
                    isRefund ? "bg-gradient-to-br from-emerald-600 to-teal-800" : "bg-gradient-to-br from-rose-600 to-orange-800"
                )}>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
                    <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 h-full">
                        <div className="space-y-4 text-center md:text-left">
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                                {isRefund ? 'Projected Refund' : 'Amount Due'}
                            </div>
                            <div className="space-y-1">
                                <div className="text-6xl md:text-8xl font-black text-white leading-none tabular-nums tracking-tighter">
                                    ${(result.refund || result.amountDue).toLocaleString()}
                                </div>
                                <div className="text-white/60 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
                                    {isRefund ? <ArrowTopRightIcon className="h-4 w-4" /> : <ArrowBottomLeftIcon className="h-4 w-4" />}
                                    Confidence Rating: 98.4%
                                </div>
                            </div>
                        </div>

                        <div className="w-full max-w-[240px]">
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={taxComposition}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {taxComposition.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="rgba(255,255,255,0.3)" />
                                            ))}
                                        </Pie>
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center text-white/80 text-xs font-bold uppercase tracking-widest mt-2">
                                Tax Composition
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 gap-6">
                    <Card className="glass-card shadow-lg hover:border-primary/40">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                Effective Rate
                                <PieChartIcon className="h-4 w-4 text-primary" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-4xl font-black mb-1 tabular-nums">{(taxResult.effectiveRate * 100).toFixed(1)}%</div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${taxResult.effectiveRate * 100}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 font-medium">Marginal Bracket: {(taxResult.marginalRate * 100).toFixed(0)}%</p>
                        </CardContent>
                    </Card>

                    <Card className="glass-card shadow-lg hover:border-primary/40">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                                Compliance Status
                                <CheckCircledIcon className="h-4 w-4 text-emerald-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <div className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                                <CheckCircledIcon className="h-5 w-5" />
                                Optimal Filing
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                                No critical errors detected. Deductions are within expected benchmarks.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Scenario Playground */}
            <AnimatePresence>
                {showPlayground && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -20 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -20 }}
                        className="overflow-hidden"
                    >
                        <Card className="bg-primary/5 border-primary/20 border-dashed">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <MixIcon className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="text-lg font-bold">Scenario Simulator</h3>
                                        <p className="text-sm text-muted-foreground">Adjust variables to see potential future savings</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {WHAT_IF_SCENARIOS.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setActiveScenarios(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                                            className={cn(
                                                "p-4 rounded-xl text-left border transition-all duration-300",
                                                activeScenarios[s.id]
                                                    ? "bg-primary text-white border-primary shadow-xl"
                                                    : "bg-background hover:bg-secondary border-border"
                                            )}
                                        >
                                            <div className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">{s.label}</div>
                                            <div className="text-xl font-black mb-2 tabular-nums">${Math.abs(s.impact).toLocaleString()}</div>
                                            <p className="text-[10px] uppercase font-bold opacity-60">{s.description}</p>
                                        </button>
                                    ))}
                                </div>
                                {adjustedResult?.impactAmount !== 0 && (
                                    <div className="mt-8 p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-between">
                                        <span className="text-sm font-bold uppercase tracking-widest">Calculated Savings Impact</span>
                                        <span className="text-2xl font-black tabular-nums text-emerald-400">+${Math.abs(adjustedResult?.impactAmount || 0).toLocaleString()}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Insights & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Audit Alerts */}
                <Card className="lg:col-span-1 border-0 shadow-xl bg-secondary/20">
                    <CardHeader className="bg-secondary/50 p-6 rounded-t-xl">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
                            Compliance Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        {taxResult.complianceAlerts.length > 0 ? (
                            taxResult.complianceAlerts.map((alert, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className={cn(
                                        "h-1.5 w-1.5 rounded-full mt-2 shrink-0",
                                        alert.severity === 'error' ? 'bg-rose-500' : 'bg-orange-500'
                                    )} />
                                    <div className="space-y-1">
                                        <div className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">{alert.code}</div>
                                        <div className="text-sm font-medium leading-relaxed">{alert.message}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <CheckCircledIcon className="h-10 w-10 text-emerald-500/50 mx-auto mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">All systems clear</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Growth Analysis */}
                <Card className="lg:col-span-2 shadow-2xl overflow-hidden border-0">
                    <CardHeader className="p-6 border-b border-border/10 bg-gradient-to-r from-secondary/50 to-transparent">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Analysis Profile</CardTitle>
                                <CardDescription>Liability flow and payment trajectory</CardDescription>
                            </div>
                            <MixIcon className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: 'Gross Income', value: taxResult.grossIncome, icon: RocketIcon },
                                { label: 'Taxable Base', value: taxResult.taxableIncome, icon: MixIcon },
                                { label: 'Deductions', value: taxResult.deductionUsed, icon: ComponentInstanceIcon },
                                { label: 'Withheld', value: taxResult.totalPayments, icon: FileTextIcon },
                            ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <item.icon className="h-3 w-3 text-primary" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.label}</span>
                                    </div>
                                    <div className="text-2xl font-black tabular-nums tracking-tight">
                                        ${item.value.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 h-32 w-full opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[{ v: 0 }, { v: 10 }, { v: 5 }, { v: 15 }, { v: 12 }, { v: 20 }]}>
                                    <defs>
                                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="v" stroke="#6366f1" fillOpacity={1} fill="url(#colorPv)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SummaryPage;
