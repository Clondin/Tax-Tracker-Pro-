import React, { useState, useRef } from 'react';
import { Paystub, IncomeItem } from '../types';
import { mapPaystubToIncomeItem } from '../utils/paystubMapper';

interface PaystubIngestionModalProps {
    onSave: (income: IncomeItem) => void;
    onClose: () => void;
    initialData?: Paystub; // Enable edit mode
}

const PaystubIngestionModal: React.FC<PaystubIngestionModalProps> = ({ onSave, onClose, initialData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeSection, setActiveSection] = useState<string>('metadata');
    const [aiState, setAiState] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Initial State - populate with initialData if available
    const [stub, setStub] = useState<Paystub>(() => {
        if (initialData) {
            return initialData;
        }
        return {
            id: Math.random().toString(36).substr(2, 9),
            metadata: {
                employerName: '',
                payPeriodStart: '',
                payPeriodEnd: '',
                payDate: new Date().toISOString().split('T')[0],
                payFrequency: 'biweekly',
                isDirectDeposit: true,
                stateOfEmployment: ''
            },
            w4: {
                filingStatus: 'single',
                dependentsAmount: 0,
                otherIncome: 0,
                deductions: 0,
                extraWithholding: 0,
                exempt: false
            },
            earnings: [],
            taxes: [],
            deductions: [],
            reimbursements: [],
            directDeposits: [],
            grossPayCurrent: 0,
            grossPayYTD: 0,
            netPayCurrent: 0,
            netPayYTD: 0
        };
    });

    // Dynamic Recalculation
    React.useEffect(() => {
        const grossCurr = stub.earnings.reduce((sum, e) => sum + (e.amountCurrent || 0), 0);
        const grossYTD = stub.earnings.reduce((sum, e) => sum + (e.amountYTD || 0), 0);
        const taxCurr = stub.taxes.reduce((sum, t) => sum + (t.amountCurrent || 0), 0);
        const taxYTD = stub.taxes.reduce((sum, t) => sum + (t.amountYTD || 0), 0);
        const dedCurr = stub.deductions.reduce((sum, d) => sum + (d.amountCurrent || 0), 0);
        const dedYTD = stub.deductions.reduce((sum, d) => sum + (d.amountYTD || 0), 0);

        setStub(prev => ({
            ...prev,
            grossPayCurrent: grossCurr,
            grossPayYTD: grossYTD,
            netPayCurrent: grossCurr - taxCurr - dedCurr,
            netPayYTD: grossYTD - taxYTD - dedYTD
        }));
    }, [stub.earnings, stub.taxes, stub.deductions]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processWithGemini(e.target.files[0]);
        }
    };

    const processWithGemini = async (file: File) => {
        try {
            setAiState('uploading');
            setErrorMsg('');

            // Convert file to base64
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
                reader.onerror = reject;
            });

            setAiState('processing');

            const response = await fetch('/api/gemini/paystub', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ base64Data, mimeType: file.type })
            });

            if (!response.ok) {
                let errorDetails = `Status: ${response.status} ${response.statusText}`;
                try {
                    const errorBody = await response.json();
                    if (errorBody.error) errorDetails = errorBody.error;
                    else if (errorBody.content) errorDetails = errorBody.content;
                } catch (e) {
                    const text = await response.text();
                    if (text) errorDetails += ` - ${text.substring(0, 100)}`;
                }
                throw new Error(errorDetails);
            }

            const { data } = await response.json();

            // Map AI response to internal state
            setStub(prev => ({
                ...prev,
                metadata: {
                    ...prev.metadata,
                    employerName: data.employerName || '',
                    payDate: data.payDate || new Date().toISOString().split('T')[0],
                    payFrequency: data.payFrequency || 'biweekly',
                    stateOfEmployment: data.stateOfEmployment || ''
                },
                earnings: (data.earnings || []).map((e: any) => ({
                    id: Math.random().toString(),
                    description: e.description,
                    type: e.type || 'regular',
                    amountCurrent: e.amountCurrent || 0,
                    amountYTD: e.amountYTD || 0,
                    isTaxableFed: true, isTaxableSS: true, isTaxableMed: true, isTaxableState: true
                })),
                taxes: (data.taxes || []).map((t: any) => ({
                    id: Math.random().toString(),
                    description: t.description,
                    authority: t.authority || 'federal',
                    type: t.type || 'other',
                    amountCurrent: t.amountCurrent || 0,
                    amountYTD: t.amountYTD || 0
                })),
                deductions: (data.deductions || []).map((d: any) => ({
                    id: Math.random().toString(),
                    description: d.description,
                    type: d.type || 'pre_tax',
                    category: d.category || 'other',
                    amountCurrent: d.amountCurrent || 0,
                    amountYTD: d.amountYTD || 0,
                    reducesFed: d.type === 'pre_tax',
                    reducesSS: false, reducesMed: false, reducesState: d.type === 'pre_tax'
                }))
            }));

            setAiState('complete');
        } catch (err) {
            console.error(err);
            setAiState('error');
            setErrorMsg("Failed to process paystub. This may be due to browser limitations or API key issues.");
        }
    };

    const handleSave = () => {
        const incomeItem = mapPaystubToIncomeItem(stub);
        onSave(incomeItem);
        onClose();
    };

    const isEditMode = !!initialData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card-light dark:bg-card-dark w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-border-light dark:border-neutral-800 flex justify-between items-center bg-background-light dark:bg-neutral-900">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-600">document_scanner</span>
                            {isEditMode ? 'Edit Paystub Details' : 'Paystub Intelligence'}
                        </h2>
                        <p className="text-sm text-neutral-500">
                            {isEditMode ? 'Review and adjust the extracted payroll data.' : 'Upload a paystub to automatically extract earnings, taxes, and deductions.'}
                        </p>
                    </div>
                    <button onClick={onClose} className="size-8 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Nav */}
                    <div className="w-64 border-r border-border-light dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 flex flex-col gap-2 overflow-y-auto">
                        <div className="mb-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={aiState === 'uploading' || aiState === 'processing'}
                                className={`w-full py-3 text-white rounded-xl font-bold flex flex-col items-center gap-1 shadow-lg transition-all ${aiState === 'processing' ? 'bg-neutral-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                    }`}
                            >
                                {aiState === 'uploading' || aiState === 'processing' ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">refresh</span>
                                        <span className="text-xs">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">cloud_upload</span>
                                        <span className="text-xs">{isEditMode ? 'Re-Upload / Scan' : 'Upload New Paystub'}</span>
                                    </>
                                )}
                            </button>
                            {aiState === 'error' && <p className="text-red-500 text-xs text-center mt-2 font-bold">{errorMsg}</p>}
                        </div>

                        <div className="flex-1 space-y-1">
                            {[
                                { id: 'metadata', label: 'Metadata', icon: 'badge' },
                                { id: 'earnings', label: 'Earnings', icon: 'attach_money' },
                                { id: 'taxes', label: 'Taxes', icon: 'account_balance' },
                                { id: 'deductions', label: 'Deductions', icon: 'remove_circle_outline' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeSection === item.id
                                            ? 'bg-white dark:bg-neutral-800 text-primary dark:text-white shadow-sm'
                                            : 'text-neutral-500 hover:bg-white/50 dark:hover:bg-neutral-800/50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 border-t border-border-light dark:border-neutral-800">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-neutral-500">Gross</span>
                                <span className="font-bold">${stub.grossPayCurrent.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1 text-red-500">
                                <span>Taxes</span>
                                <span>-${stub.taxes.reduce((s, t) => s + t.amountCurrent, 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700">
                                <span>Net Pay</span>
                                <span>${stub.netPayCurrent.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 p-8 overflow-y-auto bg-card-light dark:bg-card-dark">
                        {(aiState === 'idle' && !isEditMode && stub.earnings.length === 0) && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4">upload_file</span>
                                <h3 className="text-xl font-bold">Upload a Paystub to Begin</h3>
                                <p>We'll extract the data automatically.</p>
                            </div>
                        )}

                        {/* Force show sections if we have data (edit mode or after scan) */}
                        {((activeSection === 'metadata' && (aiState !== 'idle' || isEditMode || stub.metadata.employerName))) && (
                            <div className="space-y-6 animate-in fade-in">
                                <h3 className="text-xl font-bold mb-4">Payroll Metadata</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Employer</label>
                                        <input value={stub.metadata.employerName} onChange={e => setStub({ ...stub, metadata: { ...stub.metadata, employerName: e.target.value } })} className="w-full p-3 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Pay Date</label>
                                        <input type="date" value={stub.metadata.payDate} onChange={e => setStub({ ...stub, metadata: { ...stub.metadata, payDate: e.target.value } })} className="w-full p-3 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Frequency</label>
                                        <select value={stub.metadata.payFrequency} onChange={e => setStub({ ...stub, metadata: { ...stub.metadata, payFrequency: e.target.value as any } })} className="w-full p-3 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700">
                                            <option value="weekly">Weekly</option>
                                            <option value="biweekly">Bi-Weekly</option>
                                            <option value="semimonthly">Semi-Monthly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">State</label>
                                        <input value={stub.metadata.stateOfEmployment} onChange={e => setStub({ ...stub, metadata: { ...stub.metadata, stateOfEmployment: e.target.value } })} className="w-full p-3 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700" maxLength={2} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'earnings' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Earnings</h3>
                                    <button onClick={() => setStub(s => ({ ...s, earnings: [...s.earnings, { id: Math.random().toString(), description: '', type: 'regular', amountCurrent: 0, amountYTD: 0, isTaxableFed: true, isTaxableSS: true, isTaxableMed: true, isTaxableState: true }] }))} className="text-xs bg-primary text-white px-3 py-1 rounded">Add</button>
                                </div>
                                {stub.earnings.map((row, idx) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border-border-light dark:border-neutral-700">
                                        <div className="col-span-5"><input value={row.description} onChange={e => { const n = [...stub.earnings]; n[idx].description = e.target.value; setStub({ ...stub, earnings: n }); }} className="w-full bg-transparent font-medium" placeholder="Description" /></div>
                                        <div className="col-span-3"><input type="number" value={row.amountCurrent} onChange={e => { const n = [...stub.earnings]; n[idx].amountCurrent = parseFloat(e.target.value); setStub({ ...stub, earnings: n }); }} className="w-full bg-transparent font-bold text-green-600" placeholder="Curr" /></div>
                                        <div className="col-span-3"><input type="number" value={row.amountYTD} onChange={e => { const n = [...stub.earnings]; n[idx].amountYTD = parseFloat(e.target.value); setStub({ ...stub, earnings: n }); }} className="w-full bg-transparent text-neutral-500" placeholder="YTD" /></div>
                                        <div className="col-span-1 text-right"><button onClick={() => setStub({ ...stub, earnings: stub.earnings.filter(e => e.id !== row.id) })} className="text-red-500">×</button></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSection === 'taxes' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Taxes</h3>
                                    <button onClick={() => setStub(s => ({ ...s, taxes: [...s.taxes, { id: Math.random().toString(), authority: 'federal', type: 'other', description: '', amountCurrent: 0, amountYTD: 0 }] }))} className="text-xs bg-primary text-white px-3 py-1 rounded">Add</button>
                                </div>
                                {stub.taxes.map((row, idx) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border-border-light dark:border-neutral-700">
                                        <div className="col-span-5"><input value={row.description} onChange={e => { const n = [...stub.taxes]; n[idx].description = e.target.value; setStub({ ...stub, taxes: n }); }} className="w-full bg-transparent font-medium" placeholder="Tax Name" /></div>
                                        <div className="col-span-3"><input type="number" value={row.amountCurrent} onChange={e => { const n = [...stub.taxes]; n[idx].amountCurrent = parseFloat(e.target.value); setStub({ ...stub, taxes: n }); }} className="w-full bg-transparent font-bold text-red-600" placeholder="Curr" /></div>
                                        <div className="col-span-3"><input type="number" value={row.amountYTD} onChange={e => { const n = [...stub.taxes]; n[idx].amountYTD = parseFloat(e.target.value); setStub({ ...stub, taxes: n }); }} className="w-full bg-transparent text-neutral-500" placeholder="YTD" /></div>
                                        <div className="col-span-1 text-right"><button onClick={() => setStub({ ...stub, taxes: stub.taxes.filter(t => t.id !== row.id) })} className="text-red-500">×</button></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeSection === 'deductions' && (
                            <div className="space-y-4 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Deductions</h3>
                                    <button onClick={() => setStub(s => ({ ...s, deductions: [...s.deductions, { id: Math.random().toString(), description: '', type: 'pre_tax', category: 'other', amountCurrent: 0, amountYTD: 0, reducesFed: true, reducesSS: false, reducesMed: false, reducesState: true }] }))} className="text-xs bg-primary text-white px-3 py-1 rounded">Add</button>
                                </div>
                                {stub.deductions.map((row, idx) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800/30 border-border-light dark:border-neutral-700">
                                        <div className="col-span-4"><input value={row.description} onChange={e => { const n = [...stub.deductions]; n[idx].description = e.target.value; setStub({ ...stub, deductions: n }); }} className="w-full bg-transparent font-medium" placeholder="Deduction" /></div>
                                        <div className="col-span-2">
                                            <select value={row.category} onChange={e => { const n = [...stub.deductions]; n[idx].category = e.target.value as any; setStub({ ...stub, deductions: n }); }} className="w-full bg-transparent text-xs">
                                                <option value="health">Health</option>
                                                <option value="401k">401k</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2"><input type="number" value={row.amountCurrent} onChange={e => { const n = [...stub.deductions]; n[idx].amountCurrent = parseFloat(e.target.value); setStub({ ...stub, deductions: n }); }} className="w-full bg-transparent font-bold text-orange-600" placeholder="Curr" /></div>
                                        <div className="col-span-3"><input type="number" value={row.amountYTD} onChange={e => { const n = [...stub.deductions]; n[idx].amountYTD = parseFloat(e.target.value); setStub({ ...stub, deductions: n }); }} className="w-full bg-transparent text-neutral-500" placeholder="YTD" /></div>
                                        <div className="col-span-1 text-right"><button onClick={() => setStub({ ...stub, deductions: stub.deductions.filter(d => d.id !== row.id) })} className="text-red-500">×</button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border-light dark:border-neutral-800 bg-background-light dark:bg-neutral-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-primary hover:bg-neutral-800 dark:bg-white dark:text-primary dark:hover:bg-neutral-200 text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        {isEditMode ? 'Save Changes' : 'Import Paystub'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaystubIngestionModal;