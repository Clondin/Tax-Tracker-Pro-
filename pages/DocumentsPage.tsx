import React, { useMemo } from 'react';
import { IncomeItem, DeductionItem } from '../types';

interface DocumentsPageProps {
    incomes: IncomeItem[];
    deductions: DeductionItem[];
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ incomes, deductions }) => {
    
    // Dynamically generate the document list based on entered data
    const documents = useMemo(() => {
        const docs: any[] = [];

        // Map Incomes to Documents
        incomes.forEach(inc => {
            let docName = 'Unknown Form';
            let type = 'Income';
            let icon = 'description';
            let color = 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
            
            if (inc.type === 'w2') {
                docName = `Form W-2: ${inc.description}`;
                icon = 'badge';
                color = 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20';
            } else if (inc.type.includes('1099')) {
                docName = `Form ${inc.type.replace('_', '-').toUpperCase()}: ${inc.description}`;
                icon = 'receipt_long';
            } else if (inc.type === 'stock') {
                docName = `Form 1099-B: ${inc.description}`;
                icon = 'show_chart';
            } else if (inc.type === 'rental') {
                docName = `Schedule E Records: ${inc.description}`;
                icon = 'house';
            }

            const isAiVerified = !!inc.originalPaystub;
            const isComplete = inc.amount > 0;

            docs.push({
                id: inc.id,
                name: docName,
                category: type,
                date: new Date().toLocaleDateString(),
                status: isAiVerified ? 'AI Verified' : (isComplete ? 'Manual Entry' : 'Missing Info'),
                statusColor: isAiVerified 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                    : (isComplete ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'),
                size: isAiVerified ? '1.2 MB' : '-',
                icon,
                iconColor: color
            });
        });

        // Map Deductions to Documents
        deductions.forEach(ded => {
            let docName = 'Receipt';
            let icon = 'receipt';
            let color = 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';

            if (ded.category === 'mortgage') {
                docName = 'Form 1098: Mortgage Interest';
                icon = 'home';
            } else if (ded.category === 'charity_cash') {
                docName = `Charity Receipt: ${ded.amount > 250 ? '(Requires Substantiation)' : ''}`;
                icon = 'volunteer_activism';
            } else if (ded.category === 'student_loan') {
                docName = 'Form 1098-E';
                icon = 'school';
            } else {
                docName = `Proof of Exp: ${ded.description}`;
            }

            docs.push({
                id: ded.id,
                name: docName,
                category: 'Deduction',
                date: new Date().toLocaleDateString(),
                status: ded.amount > 0 ? 'Logged' : 'Pending',
                statusColor: ded.amount > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                size: '-',
                icon,
                iconColor: color
            });
        });

        return docs;
    }, [incomes, deductions]);

    const stats = {
        total: documents.length,
        verified: documents.filter(d => d.status.includes('Verified') || d.status === 'Logged').length,
        missing: documents.filter(d => d.status === 'Missing Info').length,
        storageUsed: (documents.filter(d => d.status === 'AI Verified').length * 1.2).toFixed(1)
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Document Portal</h1>
                    <p className="text-neutral-500 mt-1">Audit trail and substantiation records for your 2025 return.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-background-light dark:bg-neutral-800 rounded-lg">
                            <span className="material-symbols-outlined">folder_open</span>
                        </div>
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div>
                        <h4 className="text-2xl font-bold">{stats.total}</h4>
                        <p className="text-sm text-neutral-500">Required Documents</p>
                    </div>
                </div>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between h-32">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-background-light dark:bg-neutral-800 rounded-lg">
                            <span className="material-symbols-outlined">cloud_done</span>
                        </div>
                        <span className="text-xs font-medium text-neutral-500">{stats.storageUsed} MB Used</span>
                    </div>
                    <div className="w-full">
                        <div className="flex justify-between items-end mb-1">
                            <h4 className="text-lg font-bold">{stats.verified} Ready</h4>
                            <span className="text-xs text-neutral-500">{Math.round((stats.verified / (stats.total || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-background-light dark:bg-neutral-800 rounded-full h-2">
                             <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(stats.verified / (stats.total || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-card-light dark:bg-card-dark p-5 rounded-xl border border-border-light dark:border-border-dark shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                    <div className={`absolute right-0 top-0 h-full w-2 ${stats.missing > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg ${stats.missing > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                            <span className={`material-symbols-outlined ${stats.missing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {stats.missing > 0 ? 'warning' : 'check_circle'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-2xl font-bold">{stats.missing}</h4>
                        <p className="text-sm text-neutral-500">Items Missing Info</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                 <div className="border-2 border-dashed border-border-light dark:border-neutral-700 rounded-xl bg-background-light/50 dark:bg-background-dark/50 hover:bg-background-light dark:hover:bg-neutral-800/50 transition-colors cursor-pointer p-8 flex flex-col items-center justify-center text-center group">
                     <div className="size-12 rounded-full bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <span className="material-symbols-outlined">upload_file</span>
                     </div>
                     <h3 className="text-base font-bold">Upload Supplemental Files</h3>
                     <p className="text-sm text-neutral-500 mt-1">Drag & drop or <span className="text-primary dark:text-white underline font-medium">browse</span></p>
                 </div>

                 <div className="bg-card-light dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden min-h-[300px]">
                     {documents.length > 0 ? (
                         <div className="overflow-x-auto">
                             <table className="w-full text-left">
                                 <thead>
                                     <tr className="border-b border-border-light dark:border-border-dark bg-background-light/50 dark:bg-neutral-800/50 text-xs uppercase text-neutral-500">
                                         <th className="p-4 w-12"><input type="checkbox" className="rounded border-neutral-300 dark:border-neutral-600 text-primary bg-transparent focus:ring-0" /></th>
                                         <th className="p-4">Document / Source</th>
                                         <th className="p-4">Category</th>
                                         <th className="p-4">Date Added</th>
                                         <th className="p-4">Status</th>
                                         <th className="p-4">Size</th>
                                         <th className="p-4 text-right">Actions</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-border-light dark:divide-border-dark text-sm">
                                     {documents.map((row) => (
                                         <tr key={row.id} className="hover:bg-background-light dark:hover:bg-neutral-800/50">
                                             <td className="p-4"><input type="checkbox" className="rounded border-neutral-300 dark:border-neutral-600 text-primary bg-transparent focus:ring-0" /></td>
                                             <td className="p-4">
                                                 <div className="flex items-center gap-3">
                                                     <div className={`size-10 rounded-lg flex items-center justify-center ${row.iconColor}`}>
                                                         <span className="material-symbols-outlined text-[20px]">{row.icon}</span>
                                                     </div>
                                                     <div>
                                                         <p className="font-bold">{row.name}</p>
                                                         <p className="text-xs text-neutral-500">ID: ...{row.id.substr(-4)}</p>
                                                     </div>
                                                 </div>
                                             </td>
                                             <td className="p-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300">{row.category}</span></td>
                                             <td className="p-4 text-neutral-600 dark:text-neutral-400">{row.date}</td>
                                             <td className="p-4">
                                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.statusColor}`}>
                                                     <span className="size-1.5 rounded-full bg-current opacity-50"></span>
                                                     {row.status}
                                                 </span>
                                             </td>
                                             <td className="p-4 text-neutral-600 dark:text-neutral-400">{row.size}</td>
                                             <td className="p-4 text-right">
                                                 <button className="text-neutral-400 hover:text-primary dark:hover:text-white transition-colors">
                                                     <span className="material-symbols-outlined">more_vert</span>
                                                 </button>
                                             </td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     ) : (
                         <div className="flex flex-col items-center justify-center h-full py-12 text-neutral-500">
                             <span className="material-symbols-outlined text-4xl mb-2 opacity-30">folder_off</span>
                             <p>No documents required yet. Add Income or Deductions to generate audit trail.</p>
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default DocumentsPage;