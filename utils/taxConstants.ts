// 2025 Tax Configuration
// Source: IRS Revenue Procedure 2024-40, Rev Proc 2025-32 (OBBBA updates)

export const STANDARD_DEDUCTION_2025 = {
    single: 15750,
    married_joint: 31500,
    married_separate: 15750,
    head_household: 23625,
};

export const STD_DED_ADD_ON_2025 = {
    unmarried: 2000, // Single or head of household, 65+/blind
    married: 1600,   // Married filing jointly, 65+/blind per spouse
};

// [Limit, Rate]
export const BRACKETS_2025 = {
    single: [
        { limit: 11925, rate: 0.10 },
        { limit: 48475, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 197300, rate: 0.24 },
        { limit: 250525, rate: 0.32 },
        { limit: 626350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    married_joint: [
        { limit: 23850, rate: 0.10 },
        { limit: 96950, rate: 0.12 },
        { limit: 206700, rate: 0.22 },
        { limit: 394600, rate: 0.24 },
        { limit: 501050, rate: 0.32 },
        { limit: 751600, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    married_separate: [
        { limit: 11925, rate: 0.10 },
        { limit: 48475, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 197300, rate: 0.24 },
        { limit: 250525, rate: 0.32 },
        { limit: 375800, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
    head_household: [
        { limit: 17000, rate: 0.10 },
        { limit: 64850, rate: 0.12 },
        { limit: 103350, rate: 0.22 },
        { limit: 197300, rate: 0.24 },
        { limit: 250500, rate: 0.32 },
        { limit: 626350, rate: 0.35 },
        { limit: Infinity, rate: 0.37 },
    ],
};

export const LTCG_BRACKETS_2025 = {
    single: [
        { limit: 48350, rate: 0.00 },
        { limit: 533400, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    married_joint: [
        { limit: 96700, rate: 0.00 },
        { limit: 600050, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    married_separate: [
        { limit: 48350, rate: 0.00 },
        { limit: 300025, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
    head_household: [
        { limit: 64750, rate: 0.00 },
        { limit: 566700, rate: 0.15 },
        { limit: Infinity, rate: 0.20 },
    ],
};

export const AMT_CONSTANTS_2025 = {
    exemption: {
        single: 88100,
        married_joint: 137000,
        married_separate: 68500,
        head_household: 88100,
    },
    phaseoutStart: {
        single: 626350,
        married_joint: 1252700,
        married_separate: 626350,
        head_household: 626350,
    },
    phaseoutRate: 0.25,
    bracketBoundary: 232600,
    rateLow: 0.26,
    rateHigh: 0.28
};

export const SE_CONSTANTS = {
    wageBase: 176100, // 2025 Social Security wage base
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
    investmentIncomeLimit: 11950,
    // 0 Kids
    c0: { rate: 0.0765, maxEarned: 8490, phaseStartSingle: 10620, phaseStartJoint: 18120, phaseRate: 0.0765 },
    // 1 Kid
    c1: { rate: 0.34, maxEarned: 12870, phaseStartSingle: 23450, phaseStartJoint: 30940, phaseRate: 0.1598 },
    // 2 Kids
    c2: { rate: 0.40, maxEarned: 18060, phaseStartSingle: 23450, phaseStartJoint: 30940, phaseRate: 0.2106 },
    // 3+ Kids
    c3: { rate: 0.45, maxEarned: 18060, phaseStartSingle: 23450, phaseStartJoint: 30940, phaseRate: 0.2106 }
};

export const CTC_2025 = {
    perChild: 2000,          // Per qualifying child under 17
    perOtherDependent: 500,  // Other dependents credit
    refundableCap: 1700,     // Maximum ACTC per child
    refundableRate: 0.15,
    earnedIncomeFloor: 2500,
    phaseoutThreshold: { single: 200000, married_joint: 400000 },
    phaseoutRate: 0.05       // $50 per $1000 over threshold
};

export const QBI_THRESHOLDS_2025 = {
    single: { lower: 197300, upper: 247300 },
    married_joint: { lower: 394600, upper: 494600 }
};

export const IRA_LIMITS_2025 = {
    contributionLimit: 7000,
    catchup: 1000,          // If 50+
    phaseout: {
        single: { lower: 79000, upper: 89000 },
        married_joint: { lower: 126000, upper: 146000 }
    }
};

export const ROTH_IRA_PHASEOUT_2025 = {
    single: { lower: 150000, upper: 165000 },
    married_joint: { lower: 236000, upper: 246000 }
};

export const STUDENT_LOAN_PHASEOUT = {
    single: { lower: 80000, upper: 95000 },
    married_joint: { lower: 165000, upper: 195000 }
};

export const AOTC_CONSTANTS = {
    maxCredit: 2500,
    refundableCap: 1000,
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

export const RETIREMENT_LIMITS_2025 = {
    '401k': 23500,
    '401k_catchup': 7500,     // If 50+
    '401k_catchup_60_63': 11250, // Super catch-up for ages 60-63
    ira: 7000,
    ira_catchup: 1000
};

export const GIFT_TAX_2025 = {
    annualExclusion: 19000,
    lifetimeExclusion: 13990000
};

export const ADOPTION_CREDIT_LIMIT = 17530;