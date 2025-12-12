import { TaxPayer, IncomeItem, DeductionItem, TaxResult, ComplianceAlert, CarryoverState } from '../types';
import * as C from './taxConstants';

const safeFloat = (n: number | undefined) => (n && !isNaN(n) ? n : 0);
const interpolate = (val: number, lower: number, upper: number) => {
    if (val <= lower) return 1;
    if (val >= upper) return 0;
    return 1 - ((val - lower) / (upper - lower));
};

function calculateProgressiveTax(taxableIncome: number, brackets: {limit: number, rate: number}[]) {
    let tax = 0;
    let previousLimit = 0;
    let marginalRate = 0;
    for (const bracket of brackets) {
        if (taxableIncome > previousLimit) {
            const incomeInBracket = Math.min(taxableIncome, bracket.limit) - previousLimit;
            tax += incomeInBracket * bracket.rate;
            marginalRate = bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }
    return { tax, marginalRate };
}

function calculateTaxableSSB(ssb: number, otherIncome: number, taxExemptInterest: number, status: string): number {
    if (ssb === 0) return 0;
    const base1 = C.SS_TAX_THRESHOLDS.base1[status as keyof typeof C.SS_TAX_THRESHOLDS.base1] || 25000;
    const base2 = C.SS_TAX_THRESHOLDS.base2[status as keyof typeof C.SS_TAX_THRESHOLDS.base2] || 34000;
    const provisionalIncome = otherIncome + taxExemptInterest + (0.5 * ssb);
    if (provisionalIncome <= base1) return 0;
    if (provisionalIncome <= base2) return Math.min(0.5 * ssb, 0.5 * (provisionalIncome - base1));
    return Math.min(0.85 * ssb, 0.85 * (provisionalIncome - base2) + Math.min(0.5 * ssb, 0.5 * (base2 - base1)));
}

export function calculateTaxReturn(payer: TaxPayer, incomes: IncomeItem[], deductions: DeductionItem[]): TaxResult {
    const alerts: ComplianceAlert[] = [];
    const status = payer.filingStatus;
    
    // --- 1. INCOME AGGREGATION ---
    let w2Wages = 0;
    let w2Box5 = 0;
    let investmentIncome = 0; 
    let passiveIncome = 0; 
    let passiveLossesRaw: {id: string, loss: number}[] = [];
    let businessNetIncome = 0; 
    let qbiEligibleIncome = 0;
    let qbiW2Wages = 0;
    let qbiUbia = 0;
    let ltcg = 0;
    let stcg = 0;
    let dividendsQual = 0;
    let dividendsOrd = 0;
    let interestExempt = 0;
    let interestTaxable = 0;
    let ssb = 0;
    let isoBargainElement = 0; 
    let unrecaptured1250 = 0;
    let collectibles = 0;

    incomes.forEach(inc => {
        const amt = safeFloat(inc.amount);
        const d = inc.details || {};
        
        switch(inc.type) {
            case 'w2':
                w2Wages += amt;
                w2Box5 += safeFloat(d.w2_box5_med_wages) || amt;
                break;
            case '1099_int':
                if (d.tax_exempt_type === 'muni') interestExempt += amt;
                else {
                    interestTaxable += amt;
                    investmentIncome += amt;
                }
                break;
            case '1099_div':
                if (d.dividend_qualified) dividendsQual += amt;
                else dividendsOrd += amt;
                investmentIncome += amt;
                break;
            case 'stock':
                const gain = amt - safeFloat(d.cost_basis);
                if (d.wash_sale_loss_disallowed && gain < 0) {
                     alerts.push({ code: 'WASH_SALE', severity: 'info', message: 'Wash sale detected. Loss disallowed.' });
                }
                if (d.capital_gain_type === 'long_term') ltcg += gain;
                else if (d.capital_gain_type === 'collectibles_28') collectibles += gain;
                else if (d.capital_gain_type === 'unrecaptured_1250_25') unrecaptured1250 += gain;
                else stcg += gain;
                if (gain > 0) investmentIncome += gain;
                break;
            case '1099_nec': 
                const exp = safeFloat(d.business_expense_total);
                const net = amt - exp;
                businessNetIncome += net;
                qbiEligibleIncome += net; 
                qbiW2Wages += safeFloat(d.qbi_w2_wages_paid);
                qbiUbia += safeFloat(d.qbi_ubia);
                if (d.qbi_sstb) alerts.push({code: 'SSTB_FLAG', severity: 'info', message: 'SSTB Limitations may apply to QBI.'});
                break;
            case 'rental':
                if (amt >= 0) {
                    passiveIncome += amt;
                    investmentIncome += amt; 
                } else {
                    passiveLossesRaw.push({ id: d.rental_property_id || 'unknown', loss: Math.abs(amt) });
                }
                break;
            case 'ssa_1099':
                ssb += amt;
                break;
            case 'iso_exercise':
                isoBargainElement += safeFloat(d.iso_bargain_element);
                break;
        }
    });

    // --- 2. ADJUSTMENTS ---
    const netEarningsSE = businessNetIncome * 0.9235;
    let selfEmploymentTax = 0;
    if (netEarningsSE > 400) {
        const wageBaseRemaining = Math.max(0, C.SE_CONSTANTS.wageBase - w2Wages); 
        const ssTaxableSE = Math.min(netEarningsSE, wageBaseRemaining);
        selfEmploymentTax = (ssTaxableSE * C.SE_CONSTANTS.ssRate) + (netEarningsSE * C.SE_CONSTANTS.medRate);
    }
    const deductibleSETax = selfEmploymentTax * 0.5;
    const qbiAdjustedIncome = qbiEligibleIncome - deductibleSETax; 

    // HSA
    let hsaDeduction = 0;
    deductions.filter(d => d.category === 'hsa_contrib').forEach(d => {
        const limit = d.details?.hsa_family_coverage ? C.HSA_LIMITS_2025.family : C.HSA_LIMITS_2025.single;
        const months = d.details?.hsa_months_eligible || 12; 
        if (months < 12) alerts.push({code: 'HSA_PRORATION', severity: 'info', message: 'HSA limit prorated by eligible months.'});
        let allowed = (limit / 12) * months;
        if (payer.isOver65) allowed += 1000; 
        hsaDeduction += Math.min(d.amount, allowed);
        if (d.amount > allowed) alerts.push({code: 'HSA_EXCESS', severity: 'warning', message: 'HSA Excess contribution detected.'});
    });

    // Student Loan
    const incomeForStudentLoanMagi = w2Wages + interestTaxable + dividendsOrd + dividendsQual + businessNetIncome + passiveIncome + stcg + ltcg + deductibleSETax + hsaDeduction; 
    let studentLoanDed = 0;
    deductions.filter(d => d.category === 'student_loan').forEach(d => {
        const limits = status === 'married_joint' ? C.STUDENT_LOAN_PHASEOUT.married_joint : C.STUDENT_LOAN_PHASEOUT.single;
        const factor = interpolate(incomeForStudentLoanMagi, limits.lower, limits.upper);
        studentLoanDed += (Math.min(d.amount, 2500) * factor);
    });

    const adjustments = deductibleSETax + hsaDeduction + studentLoanDed;
    
    // --- 3. PASSIVE LOSS LIMITATIONS ---
    const tentativeAGI = (w2Wages + interestTaxable + dividendsOrd + dividendsQual + businessNetIncome + stcg + ltcg + adjustments); 
    const magiPassive = tentativeAGI; 
    let allowedPassiveLoss = 0;
    let suspendedPassiveLoss = 0;
    const totalPassiveLoss = passiveLossesRaw.reduce((acc, p) => acc + p.loss, 0);
    
    if (totalPassiveLoss > 0) {
        const netPassive = passiveIncome - totalPassiveLoss;
        if (netPassive >= 0) {
            allowedPassiveLoss = totalPassiveLoss;
        } else {
            let allowance = 25000;
            if (magiPassive > 100000) {
                allowance = Math.max(0, 25000 - ((magiPassive - 100000) * 0.5));
            }
            if (status === 'married_separate') allowance = 0; 
            const lossAgainstIncome = passiveIncome; 
            const specialAllowanceUsed = Math.min(allowance, totalPassiveLoss - lossAgainstIncome);
            allowedPassiveLoss = lossAgainstIncome + specialAllowanceUsed;
            suspendedPassiveLoss = totalPassiveLoss - allowedPassiveLoss;
            if (suspendedPassiveLoss > 0) alerts.push({code: 'PASSIVE_SUSPEND', severity: 'warning', message: `Passive loss of $${suspendedPassiveLoss.toFixed(0)} suspended.`});
        }
    }

    // --- 4. AGI & ITEMIZED ---
    const incomeBeforeSSB = w2Wages + interestTaxable + dividendsOrd + dividendsQual + businessNetIncome + stcg + ltcg + (passiveIncome - allowedPassiveLoss);
    const taxableSSB = calculateTaxableSSB(ssb, incomeBeforeSSB, interestExempt, status);
    const grossIncome = incomeBeforeSSB + taxableSSB;
    const agi = Math.max(0, grossIncome - adjustments);
    
    let itemizedDeduction = 0;
    let saltIncome = 0; 
    let saltProp = 0;
    let mortgageInt = 0;
    let charity = 0;
    
    deductions.forEach(d => {
        if (d.category === 'state_tax') saltIncome += d.amount;
        if (d.category === 'property_tax') saltProp += d.amount;
        if (d.category === 'charity_cash') charity += d.amount;
        if (d.category === 'mortgage') {
            let deductibleAmt = d.amount;
            const balance = d.details?.mortgage_balance || 0;
            const limit = d.details?.mortgage_origination_date && new Date(d.details.mortgage_origination_date) < new Date('2017-12-16') ? 1000000 : 750000;
            if (balance > limit) {
                deductibleAmt = d.amount * (limit / balance);
                alerts.push({code: 'MORTGAGE_LIMIT', severity: 'info', message: `Mortgage interest limited by debt cap. Ratio: ${(limit/balance).toFixed(2)}`});
            }
            mortgageInt += deductibleAmt;
        }
    });

    const saltCap = status === 'married_separate' ? 5000 : 10000;
    const totalSalt = saltIncome + saltProp; 
    itemizedDeduction = mortgageInt + charity + Math.min(totalSalt, saltCap);

    let baseStdDed = C.STANDARD_DEDUCTION_2025[status as keyof typeof C.STANDARD_DEDUCTION_2025];
    const addOnAmount = (status === 'single' || status === 'head_household') ? C.STD_DED_ADD_ON_2025.unmarried : C.STD_DED_ADD_ON_2025.married;
    let addOnCount = 0;
    if (payer.isOver65) addOnCount++;
    if (payer.isBlind) addOnCount++;
    if ((status === 'married_joint' || status === 'married_separate')) {
        if (payer.spouseIsOver65) addOnCount++;
        if (payer.spouseIsBlind) addOnCount++;
    }
    const standardDeduction = baseStdDed + (addOnCount * addOnAmount);
    
    const deductionUsed = Math.max(standardDeduction, itemizedDeduction);
    const deductionType = itemizedDeduction > standardDeduction ? 'itemized' : 'standard';

    // --- 5. QBI & TAXABLE ---
    const tentativeTaxable = Math.max(0, agi - deductionUsed);
    let qbiDeduction = 0;
    
    if (qbiAdjustedIncome > 0) {
        const threshold = C.QBI_THRESHOLDS_2025[status === 'married_joint' ? 'married_joint' : 'single'];
        const phaseoutRange = threshold.upper - threshold.lower;
        const overThreshold = Math.max(0, tentativeTaxable - threshold.lower);
        const phaseoutFraction = Math.min(1, overThreshold / phaseoutRange);
        
        let qbiAmount = qbiAdjustedIncome * 0.20;
        const isSSTB = incomes.some(i => i.type === '1099_nec' && i.details?.qbi_sstb);
        if (isSSTB) {
            if (tentativeTaxable > threshold.upper) qbiAmount = 0; 
            else if (tentativeTaxable > threshold.lower) qbiAmount = qbiAmount * (1 - phaseoutFraction);
        }
        
        if (tentativeTaxable > threshold.lower && !isSSTB) {
            const wageLimit = (qbiW2Wages * 0.5);
            const ubiaLimit = (qbiW2Wages * 0.25) + (qbiUbia * 0.025);
            const greaterLimit = Math.max(wageLimit, ubiaLimit);
            if (tentativeTaxable > threshold.upper) {
                qbiAmount = Math.min(qbiAmount, greaterLimit);
            } else {
                const excessQBI = Math.max(0, qbiAmount - greaterLimit);
                const reduction = excessQBI * phaseoutFraction;
                qbiAmount -= reduction;
            }
        }
        const netCapGain = ltcg + dividendsQual;
        const overallLimit = Math.max(0, (tentativeTaxable - netCapGain) * 0.20);
        qbiDeduction = Math.min(qbiAmount, overallLimit);
    }
    
    const taxableIncome = Math.max(0, tentativeTaxable - qbiDeduction);

    // --- 6. REGULAR TAX ---
    const preferentialIncome = ltcg + dividendsQual;
    const ordinaryTaxable = Math.max(0, taxableIncome - preferentialIncome);
    const ordResult = calculateProgressiveTax(ordinaryTaxable, C.BRACKETS_2025[status as keyof typeof C.BRACKETS_2025]);
    let regularTax = ordResult.tax;
    
    const ltcgBrackets = C.LTCG_BRACKETS_2025[status as keyof typeof C.LTCG_BRACKETS_2025];
    let remainingPref = preferentialIncome;
    let currentBracketStart = ordinaryTaxable; 
    for (const bracket of ltcgBrackets) {
        if (remainingPref <= 0) break;
        const spaceInBracket = Math.max(0, bracket.limit - currentBracketStart);
        const taxableInBracket = Math.min(remainingPref, spaceInBracket);
        regularTax += taxableInBracket * bracket.rate;
        remainingPref -= taxableInBracket;
        currentBracketStart += taxableInBracket;
    }

    // --- 7. AMT ---
    let amti = taxableIncome;
    if (deductionType === 'standard') amti += standardDeduction;
    else amti += Math.min(totalSalt, saltCap);
    amti += isoBargainElement;
    
    const amtConst = C.AMT_CONSTANTS_2025;
    const exemptionBase = amtConst.exemption[status as keyof typeof amtConst.exemption];
    const amtPhaseoutStart = amtConst.phaseoutStart[status as keyof typeof amtConst.phaseoutStart];
    let amtExemption = Math.max(0, exemptionBase - ((Math.max(0, amti - amtPhaseoutStart)) * amtConst.phaseoutRate));
    const amtBase = Math.max(0, amti - amtExemption);
    
    const amtOrdinary = Math.max(0, amtBase - preferentialIncome);
    let tentativeAMT = 0;
    if (amtOrdinary <= amtConst.bracketBoundary) tentativeAMT += amtOrdinary * amtConst.rateLow;
    else tentativeAMT += (amtConst.bracketBoundary * amtConst.rateLow) + ((amtOrdinary - amtConst.bracketBoundary) * amtConst.rateHigh);
    const amtCapGainTax = regularTax - ordResult.tax; 
    tentativeAMT += amtCapGainTax;
    const alternativeMinimumTax = Math.max(0, tentativeAMT - regularTax);
    const totalIncomeTax = regularTax + alternativeMinimumTax;

    // --- 8. CREDITS ---
    let ctcNonRef = 0;
    let ctcRef = 0;
    let eic = 0;
    let aotcNonRef = 0;
    let aotcRef = 0;
    
    // AOTC
    deductions.filter(d => d.category === 'tuition_fees' && d.details?.student_is_half_time && !d.details.student_drug_conviction).forEach(d => {
        const limits = status === 'married_joint' ? C.AOTC_CONSTANTS.phaseout.married_joint : C.AOTC_CONSTANTS.phaseout.single;
        const factor = interpolate(agi, limits.lower, limits.upper);
        if (factor > 0) {
            const expenses = Math.min(d.amount, 4000);
            const baseCredit = (Math.min(expenses, 2000) * 1.0) + (Math.max(0, expenses - 2000) * 0.25);
            const credit = baseCredit * factor;
            const refPortion = Math.min(credit * 0.4, C.AOTC_CONSTANTS.refundableCap);
            aotcRef += refPortion;
            aotcNonRef += (credit - refPortion);
        }
    });

    // EIC
    if (status !== 'married_separate' && investmentIncome <= C.EIC_CONFIG_2025.investmentIncomeLimit) {
        // Count qualifying children based on detailed dependent records
        const qualifyingChildren = payer.dependents.filter(d => d.age < 19 || (d.isStudent && d.age < 24) || d.isDisabled).length;
        const config = qualifyingChildren >= 3 ? C.EIC_CONFIG_2025.c3 : (qualifyingChildren === 2 ? C.EIC_CONFIG_2025.c2 : (qualifyingChildren === 1 ? C.EIC_CONFIG_2025.c1 : C.EIC_CONFIG_2025.c0));
        const earned = w2Wages + businessNetIncome;
        let credit = Math.min(earned, config.maxEarned) * config.rate;
        const phaseStart = status === 'married_joint' ? config.phaseStartJoint : config.phaseStartSingle;
        const phaseoutBase = Math.max(earned, agi); 
        if (phaseoutBase > phaseStart) {
            const reduction = (phaseoutBase - phaseStart) * config.phaseRate;
            credit = Math.max(0, credit - reduction);
        }
        eic = credit;
    } else if (investmentIncome > C.EIC_CONFIG_2025.investmentIncomeLimit) {
        alerts.push({code: 'EIC_INV_LIMIT', severity: 'warning', message: 'EIC disallowed: Investment income too high.'});
    }

    // CTC
    const ctcThreshold = status === 'married_joint' ? 400000 : 200000;
    const qualifyingCtcKids = payer.dependents.filter(d => d.age < 17).length;
    if (qualifyingCtcKids > 0) {
        let potentialCtc = qualifyingCtcKids * 2000;
        if (agi > ctcThreshold) {
            const reduction = Math.ceil((agi - ctcThreshold) / 1000) * 50;
            potentialCtc = Math.max(0, potentialCtc - reduction);
        }
        const earnedIncome = w2Wages + businessNetIncome;
        const actcCap = 1700 * qualifyingCtcKids; 
        const potentialRef = Math.max(0, (earnedIncome - 2500) * 0.15);
        ctcRef = Math.min(potentialRef, actcCap, potentialCtc);
        ctcNonRef = Math.max(0, potentialCtc - ctcRef);
        ctcNonRef = Math.min(ctcNonRef, totalIncomeTax - aotcNonRef); 
    }

    // NIIT
    let niit = 0;
    const magiNiit = agi + interestExempt; 
    const niitThreshold = C.NIIT_THRESHOLDS[status as keyof typeof C.NIIT_THRESHOLDS];
    if (magiNiit > niitThreshold) {
        const nii = (passiveIncome - allowedPassiveLoss) + interestTaxable + dividendsOrd + dividendsQual + ltcg + stcg;
        niit = Math.min(nii, magiNiit - niitThreshold) * 0.038;
    }
    
    let medicareSurtax = 0;
    const medThreshold = C.ADDL_MEDICARE_THRESHOLDS[status as keyof typeof C.ADDL_MEDICARE_THRESHOLDS];
    const medBase = w2Box5 + netEarningsSE; 
    if (medBase > medThreshold) medicareSurtax = (medBase - medThreshold) * 0.009;

    const totalTaxLiability = totalIncomeTax + selfEmploymentTax + niit + medicareSurtax - ctcNonRef - aotcNonRef;
    const totalRefundable = ctcRef + eic + aotcRef;
    const totalPayments = incomes.reduce((acc, i) => acc + safeFloat(i.withholding), 0);
    const finalBalance = (totalPayments + totalRefundable) - totalTaxLiability;

    return {
        grossIncome,
        adjustments,
        agi,
        magi_niit: magiNiit,
        magi_roth: agi,
        magi_student_loan: incomeForStudentLoanMagi,
        standardDeduction,
        itemizedDeduction,
        deductionUsed,
        deductionType,
        taxableIncome,
        taxableOrdinary: ordinaryTaxable,
        taxableLTCG: preferentialIncome,
        taxable1250: unrecaptured1250,
        taxableCollectibles: collectibles,
        regularTax,
        alternativeMinimumTax,
        totalIncomeTax,
        credits: {
            ctc_nonrefundable: ctcNonRef,
            ctc_refundable: ctcRef,
            eic,
            aotc_nonrefundable: aotcNonRef,
            aotc_refundable: aotcRef,
            llc_nonrefundable: 0,
            child_care_credit: 0,
            saver_credit: 0,
            foreign_tax_credit: 0,
            adoption_credit: 0,
            energy_credit: 0,
            other: 0,
            total_nonrefundable: ctcNonRef + aotcNonRef,
            total_refundable: totalRefundable
        },
        payrollTax: w2Wages * 0.062 + w2Box5 * 0.0145, 
        selfEmploymentTax,
        niit,
        medicareSurtax,
        penalty_early_withdrawal: 0,
        penalty_hsa: 0,
        totalTaxLiability: Math.max(0, totalTaxLiability),
        totalPayments,
        refund: finalBalance > 0 ? finalBalance : 0,
        amountDue: finalBalance < 0 ? Math.abs(finalBalance) : 0,
        effectiveRate: grossIncome > 0 ? (Math.max(0, totalTaxLiability) / grossIncome) : 0,
        marginalRate: ordResult.marginalRate,
        complianceAlerts: alerts,
        carryovers: {
            year: 2025,
            capitalLoss: 0,
            charitable: 0,
            nol: 0,
            amtCredit: 0,
            passiveLosses: passiveLossesRaw.length > 0 && suspendedPassiveLoss > 0 ? { 'aggregated': suspendedPassiveLoss } : {},
            qbiLosses: 0
        }
    };
}