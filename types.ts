export interface Dependent {
    id: string;
    firstName: string;
    lastName: string;
    ssn: string;
    relationship: 'child' | 'parent' | 'sibling' | 'other';
    age: number;
    monthsLivedWith: number;
    isStudent: boolean;
    isDisabled: boolean;
    hasItin: boolean; 
    isCtcQualifying?: boolean; 
    filedJointReturn?: boolean; 
    isClaimedByOther?: boolean; 
}

export interface TaxPayer {
    firstName: string;
    lastName: string;
    spouseFirstName?: string;
    spouseLastName?: string;
    ssn: string;
    filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_household';
    dependents: Dependent[];
    isOver65: boolean;
    isBlind: boolean;
    spouseIsOver65?: boolean;
    spouseIsBlind?: boolean;
    residencyStatus?: 'us_resident' | 'non_resident'; 
    identityProtectionPin?: string;
}

// --- PAYSTUB INGESTION SCHEMA ---

export interface PaystubEarning {
    id: string;
    description: string;
    type: 'regular' | 'salary' | 'overtime' | 'bonus' | 'commission' | 'pto' | 'holiday' | 'retro' | 'supplemental' | 'imputed_life' | 'other';
    rate?: number;
    hours?: number;
    amountCurrent: number;
    amountYTD: number;
    isTaxableFed: boolean;
    isTaxableSS: boolean;
    isTaxableMed: boolean;
    isTaxableState: boolean;
}

export interface PaystubTax {
    id: string;
    authority: 'federal' | 'state' | 'local';
    type: 'fed_withholding' | 'ss' | 'med' | 'state_withholding' | 'sdi' | 'sui' | 'local' | 'other';
    description: string;
    amountCurrent: number;
    amountYTD: number;
    taxableWageBaseCurrent?: number; // Optional validation field
}

export interface PaystubDeduction {
    id: string;
    description: string;
    type: 'pre_tax' | 'after_tax';
    category: 'health' | 'dental' | 'vision' | 'hsa' | 'fsa_health' | 'fsa_care' | '401k' | '403b' | '457' | 'roth_401k' | 'commuter' | 'life_ins' | 'union' | 'garnishment' | 'other';
    amountCurrent: number;
    amountYTD: number;
    // Tax Treatment Flags (Does this deduction reduce the base?)
    reducesFed: boolean;
    reducesSS: boolean;
    reducesMed: boolean;
    reducesState: boolean;
}

export interface PaystubReimbursement {
    id: string;
    description: string;
    amountCurrent: number;
    amountYTD: number;
    isTaxable: boolean; // Usually false for reimbursements
}

export interface PaystubDirectDeposit {
    id: string;
    bankName: string;
    routingMasked: string;
    accountMasked: string;
    amount: number;
    distributionType: 'fixed' | 'percent' | 'balance';
}

export interface PaystubMetadata {
    employerName: string;
    employerId?: string;
    employeeId?: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    payDate: string;
    checkNumber?: string;
    payFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
    isDirectDeposit: boolean;
    stateOfEmployment: string;
}

export interface W4Elections {
    filingStatus: string;
    dependentsAmount: number;
    otherIncome: number;
    deductions: number;
    extraWithholding: number;
    exempt: boolean;
}

export interface Paystub {
    id: string;
    metadata: PaystubMetadata;
    w4: W4Elections;
    earnings: PaystubEarning[];
    taxes: PaystubTax[];
    deductions: PaystubDeduction[];
    reimbursements: PaystubReimbursement[];
    directDeposits: PaystubDirectDeposit[];
    
    // Aggregates
    grossPayCurrent: number;
    grossPayYTD: number;
    netPayCurrent: number;
    netPayYTD: number;
}

// --- END PAYSTUB SCHEMA ---

export interface IncomeItem {
    id: string;
    description: string;
    owner?: 'primary' | 'spouse';
    type: 
        | 'w2' 
        | '1099_nec' 
        | '1099_int' 
        | '1099_div' 
        | 'stock' 
        | 'ssa_1099' 
        | 'rental'
        | 'retirement_dist'
        | 'iso_exercise'
        | 'other';
    amount: number; // For W-2 this is Box 1
    withholding: number;
    payFrequency?: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'annual';
    
    originalPaystub?: Paystub; // New: Store the full source data for UI restoration

    details?: {
        // --- W-2 & Benefits ---
        w2_box3_ss_wages?: number;
        w2_box4_ss_withheld?: number;
        w2_box5_med_wages?: number;
        w2_box6_med_withheld?: number;
        w2_box10_dependent_care?: number;
        w2_box11_nonqualified_plans?: number; // NQDC
        
        // Box 12 Codes
        w2_box12_code_c_group_term_life?: number; // Imputed income > 50k
        w2_box12_code_d_401k?: number;
        w2_box12_code_w_hsa?: number; // Employer + Employee pre-tax
        w2_box12_code_t_adoption?: number;
        
        // Benefits / Reconciliation
        w2_retirement_plan_active?: boolean; // Box 13 Checkbox
        w2_statutory_employee?: boolean; // Box 13 Checkbox
        w2_health_insurance_pretax?: number; // Reduces Box 1/3/5
        w2_fsa_health_amount?: number; // Reduces Box 1/3/5
        w2_fsa_dependent_care_amount?: number; // Reduces Box 1/3/5, matches Box 10
        w2_commuter_benefits?: number;
        
        // --- Investment ---
        tax_exempt_type?: 'none' | 'muni' | 'treasury';
        dividend_qualified?: boolean;
        foreign_tax_paid?: number; // Form 1116
        reit_dividend?: boolean; // Section 199A eligible
        
        // Stock Sales
        capital_gain_type?: 'short_term' | 'long_term' | 'collectibles_28' | 'unrecaptured_1250_25';
        cost_basis?: number;
        acquisition_date?: string;
        sale_date?: string;
        wash_sale_loss_disallowed?: number;
        iso_bargain_element?: number; // AMT
        qsbs_section_1202?: boolean;
        
        // --- Business (Sched C) ---
        business_expense_total?: number;
        home_office_deduction?: number;
        home_office_sqft?: number;
        home_total_sqft?: number;
        vehicle_business_miles?: number;
        vehicle_total_miles?: number;
        depreciation_section_179?: number;
        material_participation?: boolean; // Passive vs Non-passive
        accounting_method?: 'cash' | 'accrual';
        qbi_sstb?: boolean; 
        qbi_w2_wages_paid?: number;
        qbi_ubia?: number; 

        // --- Rental (Sched E) ---
        rental_property_id?: string; 
        rental_days_rented?: number;
        rental_days_personal?: number;
        rental_type?: 'residential' | 'commercial' | 'short_term';
        rental_active_participation?: boolean; // $25k allowance
        rental_real_estate_pro?: boolean; // Exception to PAL
        rental_depreciation?: number;
        
        // --- Retirement ---
        distribution_code?: string;
        ira_basis?: number;
        is_inherited_ira?: boolean;
    };
}

export interface DeductionItem {
    id: string;
    category: 
        | 'mortgage' | 'property_tax' | 'state_tax' | 'charity_cash' | 'charity_goods' 
        | 'medical' | 'student_loan' | 'hsa_contrib' | 'educator_expense' | 'tuition_fees'
        | 'fsa_health' | 'fsa_dependent_care' | 'adoption_credit' | 'energy_credit' | 'other';
    amount: number;
    description: string;
    details?: {
        // Mortgage
        mortgage_origination_date?: string;
        mortgage_balance?: number;
        mortgage_is_refinance?: boolean;
        mortgage_used_for_buy_build_improve?: boolean;
        
        // Charity
        charity_organization_type?: '501c3_50' | 'non_501c3_30';
        charity_appraisal_attached?: boolean;
        
        // Medical
        medical_insurance_premiums_after_tax?: number; // Sched A eligible
        medical_long_term_care_premiums?: number;
        
        // FSA / HSA
        hsa_coverage_type?: 'self' | 'family';
        hsa_family_coverage?: boolean;
        hsa_months_eligible?: number;
        fsa_employer_contrib?: number; // For Form 2441 reconciliation
        
        // Education
        student_id?: string;
        student_is_half_time?: boolean;
        student_first_4_years?: boolean; // AOTC vs LLC
        student_drug_conviction?: boolean;
        
        // Credits
        adoption_expenses?: number;
        adoption_employer_assistance?: number;
        energy_improvement_type?: 'solar' | 'windows' | 'hvac';
    };
}

export interface DocumentItem {
    id: string;
    name: string;
    category: 'Income' | 'Deductions' | 'Receipts' | 'Medical';
    date: string;
    status: 'Verified' | 'Pending' | 'Missing Info';
    size: string;
    type: 'pdf' | 'img' | 'csv';
}

export interface PaystubInput {
    frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
    grossPay: number;
    ytdGross: number;
    payPeriodEnding: string;
    fedWithholdingYtd: number;
    ssWithholdingYtd: number;
    medWithholdingYtd: number;
    box12Contribs: number;
}

export interface ComplianceAlert {
    code: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    formSource?: string;
}

export interface CarryoverState {
    year: number;
    capitalLoss: number;
    charitable: number;
    nol: number;
    amtCredit: number;
    passiveLosses: Record<string, number>; 
    qbiLosses: number;
}

export interface TaxResult {
    grossIncome: number;
    adjustments: number;
    agi: number;
    magi_niit: number; 
    magi_roth: number;
    magi_student_loan: number;
    
    standardDeduction: number;
    itemizedDeduction: number;
    deductionUsed: number;
    deductionType: 'standard' | 'itemized';
    
    taxableIncome: number;
    taxableOrdinary: number;
    taxableLTCG: number; 
    taxable1250: number; 
    taxableCollectibles: number; 
    
    regularTax: number;
    alternativeMinimumTax: number;
    totalIncomeTax: number; 
    
    credits: {
        ctc_nonrefundable: number;
        ctc_refundable: number;
        eic: number;
        aotc_refundable: number;
        aotc_nonrefundable: number;
        llc_nonrefundable: number;
        child_care_credit: number;
        saver_credit: number;
        foreign_tax_credit: number;
        adoption_credit: number;
        energy_credit: number;
        other: number;
        total_nonrefundable: number;
        total_refundable: number;
    };
    
    payrollTax: number; 
    selfEmploymentTax: number;
    niit: number;
    medicareSurtax: number;
    penalty_early_withdrawal: number;
    penalty_hsa: number;
    
    totalTaxLiability: number;
    totalPayments: number;
    refund: number;
    amountDue: number;
    
    effectiveRate: number;
    marginalRate: number;
    complianceAlerts: ComplianceAlert[];
    carryovers: CarryoverState;
}

export type Theme = 'light' | 'dark';

export interface AppState {
    taxPayer: TaxPayer;
    incomes: IncomeItem[];
    deductions: DeductionItem[];
    documents: DocumentItem[];
    taxResult: TaxResult | null;
    theme: Theme;
}