// 2025 Tax Configuration
// Source: IRS Revenue Procedures (Projected/Preliminary)

export const STANDARD_DEDUCTION_2025 = {
    single: 15600,
    married_joint: 31200,
    married_separate: 15600,
    head_household: 22800,
};

export const STD_DED_ADD_ON_2025 = {
    unmarried: 1950, 
    married: 1550,   
};

// [Limit, Rate]
export const BRACKETS_2025 = {
    single: [
        { limit: 12750, rate: 0.10 },
        { limit: 51525, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 185350, rate: 0.24 },
        { limit: 243700, rate: 0.32 },
        { limit: 609350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    married_joint: [
        { limit: 25500, rate: 0.10 },
        { limit: 103050, rate: 0.12 },
        { limit: 206700, rate: 0.22 },
        { limit: 370700, rate: 0.24 },
        { limit: 487400, rate: 0.32 },
        { limit: 731200, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    married_separate: [
        { limit: 12750, rate: 0.10 },
        { limit: 51525, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 185350, rate: 0.24 },
        { limit: 243700, rate: 0.32 },
        { limit: 365600, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    head_household: [
        { limit: 19150, rate: 0.10 },
        { limit: 73300, rate: 0.12 },
        { limit: 112900, rate: 0.22 },
        { limit: 198750, rate: 0.24 },
        { limit: 247100, rate: 0.32 },
        { limit: 641850, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
};

export const LTCG_BRACKETS_2025 = {
    single: [
        { limit: 47025, rate: 0.00 },
        { limit: 518900, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    married_joint: [
        { limit: 94050, rate: 0.00 },
        { limit: 583750, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    married_separate: [
        { limit: 47025, rate: 0.00 },
        { limit: 291850, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    head_household: [
        { limit: 63950, rate: 0.00 },
        { limit: 551350, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
};

export const AMT_CONSTANTS_2025 = {
    exemption: {
        single: 87700,
        married_joint: 175400,
        married_separate: 87700,
        head_household: 87700,
    },
    phaseoutStart: {
        single: 609350,
        married_joint: 1218700,
        married_separate: 609350,
        head_household: 609350,
    },
    phaseoutRate: 0.25,
    bracketBoundary: 220700,
    rateLow: 0.26,
    rateHigh: 0.28
};

export const SE_CONSTANTS = {
    wageBase: 172200,
    ssRate: 0.124,
    medRate: 0.029,
};

export const NIIT_THRESHOLDS = {
    single: 200000,
    married_joint: 250000,
    married_separate: 125000,
    head_household: 200000,
};

export const ADDL_MEDICARE_THRESHOLDS = {
    single: 200000,
    married_joint: 250000,
    married_separate: 125000,
    head_household: 200000,
};

export const SS_TAX_THRESHOLDS = {
    base1: { single: 25000, married_joint: 32000, married_separate: 0, head_household: 25000 },
    base2: { single: 34000, married_joint: 44000, married_separate: 0, head_household: 34000 }
};

export const EIC_CONFIG_2025 = {
    investmentIncomeLimit: 12150, // Approx 2025
    // [Credit Rate, Earned Income Limit, Phaseout Start (Single), Phaseout Start (Joint), Phaseout Rate]
    // 0 Kids
    c0: { rate: 0.0765, maxEarned: 8260, phaseStartSingle: 10330, phaseStartJoint: 17630, phaseRate: 0.0765 },
    // 1 Kid
    c1: { rate: 0.34, maxEarned: 12720, phaseStartSingle: 22700, phaseStartJoint: 30000, phaseRate: 0.1598 },
    // 2 Kids
    c2: { rate: 0.40, maxEarned: 17870, phaseStartSingle: 22700, phaseStartJoint: 30000, phaseRate: 0.2106 },
    // 3+ Kids
    c3: { rate: 0.45, maxEarned: 17870, phaseStartSingle: 22700, phaseStartJoint: 30000, phaseRate: 0.2106 }
};

export const QBI_THRESHOLDS_2025 = {
    single: { lower: 191950, upper: 241950 },
    married_joint: { lower: 383900, upper: 483900 }
};

export const IRA_DEDUCTION_PHASEOUT = {
    single: { lower: 77000, upper: 87000 },
    married_joint: { lower: 123000, upper: 143000 }
};

export const STUDENT_LOAN_PHASEOUT = {
    single: { lower: 80000, upper: 95000 },
    married_joint: { lower: 165000, upper: 195000 }
};

export const AOTC_CONSTANTS = {
    maxCredit: 2500,
    refundableCap: 1000, // 40% of 2500
    phaseout: {
        single: { lower: 80000, upper: 90000 },
        married_joint: { lower: 160000, upper: 180000 }
    }
};

export const HSA_LIMITS_2025 = {
    single: 4300,
    family: 8550,
    catchup: 1000
};

export const ADOPTION_CREDIT_LIMIT = 17290; // Approx 2025