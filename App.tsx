import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SetupPage from './pages/SetupPage';
import IncomePage from './pages/IncomePage';
import DeductionsPage from './pages/DeductionsPage';
import SummaryPage from './pages/SummaryPage';
import DocumentsPage from './pages/DocumentsPage';
import { TaxPayer, IncomeItem, DeductionItem, TaxResult, Theme } from './types';
import { calculateTaxReturn } from './utils/taxEngine';

const App: React.FC = () => {
    // Initial State with some defaults
    const [taxPayer, setTaxPayer] = useState<TaxPayer>({
        firstName: '',
        lastName: '',
        spouseFirstName: '',
        spouseLastName: '',
        ssn: '',
        filingStatus: 'single',
        dependents: [],
        isOver65: false,
        isBlind: false
    });

    const [incomes, setIncomes] = useState<IncomeItem[]>([]);
    const [deductions, setDeductions] = useState<DeductionItem[]>([]);
    const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
    const [theme, setTheme] = useState<Theme>('light');

    // Run Calculation whenever data changes
    useEffect(() => {
        const result = calculateTaxReturn(taxPayer, incomes, deductions);
        setTaxResult(result);
    }, [taxPayer, incomes, deductions]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <Router>
            <Layout theme={theme} toggleTheme={toggleTheme}>
                <Routes>
                    <Route 
                        path="/" 
                        element={<SetupPage setTaxPayer={setTaxPayer} />} 
                    />
                    <Route 
                        path="/income" 
                        element={<IncomePage taxPayer={taxPayer} incomes={incomes} setIncomes={setIncomes} taxResult={taxResult} />} 
                    />
                    <Route 
                        path="/deductions" 
                        element={<DeductionsPage deductions={deductions} setDeductions={setDeductions} taxResult={taxResult} />} 
                    />
                    <Route 
                        path="/summary" 
                        element={<SummaryPage taxResult={taxResult} />} 
                    />
                    <Route 
                        path="/documents" 
                        element={<DocumentsPage incomes={incomes} deductions={deductions} />} 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </Router>
    );
};

export default App;