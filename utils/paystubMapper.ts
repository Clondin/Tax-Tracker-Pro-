import { Paystub, IncomeItem, DeductionItem } from '../types';

/**
 * Maps the granular Paystub ingestion data to the Tax Engine's IncomeItem format.
 * This simulates the logic of reading a W-2 from raw payroll data.
 */
export function mapPaystubToIncomeItem(paystub: Paystub): IncomeItem {
    // 1. Calculate Gross Wages (Box 1)
    // Box 1 = Taxable Earnings - Pre-tax Deductions (Fed) + Imputed Income
    let box1 = paystub.grossPayYTD;
    
    // Subtract pre-tax fed deductions
    paystub.deductions.forEach(d => {
        if (d.type === 'pre_tax' && d.reducesFed) {
            box1 -= d.amountYTD;
        }
    });

    // 2. Calculate SS Wages (Box 3)
    let box3 = paystub.grossPayYTD;
    paystub.deductions.forEach(d => {
        if (d.type === 'pre_tax' && d.reducesSS) {
            box3 -= d.amountYTD;
        }
    });
    // Cap at 2025 limit (simple check, engine does strict check)
    box3 = Math.min(box3, 176100); 

    // 3. Calculate Med Wages (Box 5)
    let box5 = paystub.grossPayYTD;
    paystub.deductions.forEach(d => {
        if (d.type === 'pre_tax' && d.reducesMed) {
            box5 -= d.amountYTD;
        }
    });

    // 4. Box 2 Fed Withholding
    const fedTax = paystub.taxes.find(t => t.type === 'fed_withholding')?.amountYTD || 0;
    
    // 5. Box 4 & 6
    const ssTax = paystub.taxes.find(t => t.type === 'ss')?.amountYTD || 0;
    const medTax = paystub.taxes.find(t => t.type === 'med')?.amountYTD || 0;

    // 6. Box 12 Codes & Benefits
    let codeD = 0; // 401k
    let codeW = 0; // HSA
    let codeC = 0; // Life Ins
    let fsaHealth = 0;
    let fsaCare = 0;

    paystub.deductions.forEach(d => {
        if (d.category === '401k' || d.category === '403b') codeD += d.amountYTD;
        if (d.category === 'hsa') codeW += d.amountYTD; // Note: Employer contribs usually need to be added here too if they exist in benefits module
        if (d.category === 'life_ins') codeC += d.amountYTD; 
        if (d.category === 'fsa_health') fsaHealth += d.amountYTD;
        if (d.category === 'fsa_care') fsaCare += d.amountYTD;
    });

    return {
        id: paystub.id,
        description: paystub.metadata.employerName || 'Employer',
        type: 'w2',
        payFrequency: paystub.metadata.payFrequency as any,
        amount: box1,
        withholding: fedTax,
        originalPaystub: paystub, // Attach full source data for UI restoration
        details: {
            w2_box3_ss_wages: box3,
            w2_box4_ss_withheld: ssTax,
            w2_box5_med_wages: box5,
            w2_box6_med_withheld: medTax,
            w2_box10_dependent_care: fsaCare,
            w2_box12_code_d_401k: codeD,
            w2_box12_code_w_hsa: codeW,
            w2_box12_code_c_group_term_life: codeC,
            w2_fsa_health_amount: fsaHealth,
            w2_health_insurance_pretax: paystub.deductions
                .filter(d => d.category === 'health' && d.type === 'pre_tax')
                .reduce((sum, d) => sum + d.amountYTD, 0)
        }
    };
}