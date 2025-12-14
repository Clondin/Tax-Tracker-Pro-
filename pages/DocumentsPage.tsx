import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { IncomeItem, DeductionItem } from '../types';
import { cn } from '../lib/utils';

interface DocumentsPageProps {
    incomes: IncomeItem[];
    deductions: DeductionItem[];
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ incomes, deductions }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Dynamically generate the document list based on entered data
    const documents = useMemo(() => {
        const docs: any[] = [];

        incomes.forEach(inc => {
            let docName = 'Unknown Form';
            let type = 'Income';
            let icon = 'description';
            let color = 'from-blue-500 to-blue-600';
            let tags: string[] = ['income'];

            if (inc.type === 'w2') {
                docName = `W-2: ${inc.description}`;
                icon = 'badge';
                color = 'from-purple-500 to-purple-600';
                tags.push('w2', 'employment');
            } else if (inc.type.includes('1099')) {
                docName = `1099-${inc.type.toUpperCase()}: ${inc.description}`;
                icon = 'receipt_long';
                tags.push('1099');
            } else if (inc.type === 'stock') {
                docName = `1099-B: ${inc.description}`;
                icon = 'show_chart';
                tags.push('investment');
            } else if (inc.type === 'rental') {
                docName = `Schedule E: ${inc.description}`;
                icon = 'house';
                tags.push('rental');
            }

            docs.push({
                id: inc.id,
                name: docName,
                category: type,
                date: new Date().toLocaleDateString(),
                isAiVerified: !!inc.originalPaystub,
                amount: inc.amount,
                icon,
                color,
                tags,
                targetPath: '/income'
            });
        });

        deductions.forEach(ded => {
            let docName = 'Receipt';
            let icon = 'receipt';
            let color = 'from-orange-500 to-orange-600';
            let tags: string[] = ['deduction'];

            if (ded.category === 'mortgage') {
                docName = '1098: Mortgage Interest';
                icon = 'home';
                color = 'from-blue-500 to-cyan-500';
                tags.push('mortgage', '1098');
            } else if (ded.category.includes('charity')) {
                docName = `Charity: ${ded.description}`;
                icon = 'volunteer_activism';
                color = 'from-pink-500 to-rose-500';
                tags.push('charity');
            } else if (ded.category === 'medical') {
                docName = `Medical: ${ded.description}`;
                icon = 'medical_services';
                color = 'from-rose-500 to-red-500';
                tags.push('medical');
            } else {
                docName = ded.description || 'Expense Receipt';
            }

            docs.push({
                id: ded.id,
                name: docName,
                category: 'Deduction',
                date: new Date().toLocaleDateString(),
                isAiVerified: ded.details?.ai_scanned,
                amount: ded.amount,
                icon,
                color,
                tags,
                targetPath: '/deductions'
            });
        });

        return docs;
    }, [incomes, deductions]);

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        documents.forEach(d => d.tags.forEach((t: string) => tagSet.add(t)));
        return Array.from(tagSet);
    }, [documents]);

    const filteredDocs = documents.filter(d => {
        const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || selectedTags.some(t => d.tags.includes(t));
        return matchesSearch && matchesTags;
    });

    const stats = {
        total: documents.length,
        aiVerified: documents.filter(d => d.isAiVerified).length,
        totalValue: documents.reduce((a, b) => a + (b.amount || 0), 0)
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-amber-500/10 rounded-xl">
                            <span className="material-symbols-outlined text-amber-500 text-2xl">folder_open</span>
                        </div>
                        <h1 className="text-3xl font-bold text-text-main dark:text-white">Document Vault</h1>
                    </div>
                    <p className="text-text-muted">Your tax documents, organized and AI-tagged</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-5">
                    <div className="text-sm text-text-muted">Total Documents</div>
                    <div className="text-3xl font-bold text-text-main dark:text-white">{stats.total}</div>
                </div>
                <div className="glass-card rounded-xl p-5">
                    <div className="text-sm text-text-muted flex items-center gap-1">
                        <span className="material-symbols-outlined text-purple-500 text-sm">auto_awesome</span> AI Verified
                    </div>
                    <div className="text-3xl font-bold text-purple-600">{stats.aiVerified}</div>
                </div>
                <div className="glass-card rounded-xl p-5">
                    <div className="text-sm text-text-muted">Total Value</div>
                    <div className="text-3xl font-bold text-emerald-600">${stats.totalValue.toLocaleString()}</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">search</span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search documents..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-card-dark border border-border-light dark:border-border-dark outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn("p-3 rounded-xl transition-colors", viewMode === 'grid' ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700")}
                    >
                        <span className="material-symbols-outlined">grid_view</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn("p-3 rounded-xl transition-colors", viewMode === 'list' ? "bg-primary text-white" : "bg-neutral-100 dark:bg-neutral-800 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700")}
                    >
                        <span className="material-symbols-outlined">view_list</span>
                    </button>
                </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors",
                            selectedTags.includes(tag)
                                ? "bg-primary text-white"
                                : "bg-neutral-100 dark:bg-neutral-800 text-text-muted hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        )}
                    >
                        {tag}
                    </button>
                ))}
            </div>

            {/* Documents Grid/List */}
            {filteredDocs.length > 0 ? (
                <motion.div layout className={cn(viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-3")}>
                    <AnimatePresence>
                        {filteredDocs.map(doc => (
                            viewMode === 'grid' ? (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    onClick={() => navigate(doc.targetPath)}
                                    className="glass-card rounded-xl p-5 cursor-pointer group"
                                >
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${doc.color} flex items-center justify-center mb-4 shadow-lg`}>
                                        <span className="material-symbols-outlined text-white">{doc.icon}</span>
                                    </div>
                                    <h3 className="font-bold text-text-main dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{doc.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-text-muted">{doc.date}</span>
                                        {doc.isAiVerified && (
                                            <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                                                <span className="material-symbols-outlined text-xs">auto_awesome</span> AI
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={doc.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    onClick={() => navigate(doc.targetPath)}
                                    className="glass-card rounded-xl p-4 cursor-pointer group flex items-center gap-4 hover:shadow-lg transition-all"
                                >
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${doc.color} flex items-center justify-center shadow`}>
                                        <span className="material-symbols-outlined text-white text-lg">{doc.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{doc.name}</h3>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-text-muted">{doc.date}</span>
                                            {doc.tags.map((t: string) => (
                                                <span key={t} className="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-text-muted">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-lg text-text-main dark:text-white">${doc.amount?.toLocaleString()}</div>
                                        {doc.isAiVerified && (
                                            <span className="text-xs text-purple-600">AI Verified</span>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="text-center py-16 glass-card rounded-2xl border-2 border-dashed border-border-light dark:border-border-dark">
                    <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-full inline-block mb-4">
                        <span className="material-symbols-outlined text-4xl text-text-muted">folder_off</span>
                    </div>
                    <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">No documents yet</h3>
                    <p className="text-text-muted max-w-md mx-auto">Add income or deductions to see your documents here.</p>
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;