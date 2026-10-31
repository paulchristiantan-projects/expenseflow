// Philippine statutory payroll deductions — historical rate tables.
//
// Given a monthly gross and an effective date, estimate the employee-share
// deductions (SSS, PhilHealth, Pag-IBIG) and BIR withholding tax using the
// rates that applied in that year. Rates have changed almost every year since
// 2021, so each entry is computed against its own effective-date schedule.
//
// These are ESTIMATES for personal tracking. Actual payslip figures use exact
// MSC brackets and employer rules; always trust your payslip over this.
//
// Sources (verified): SSS RA 11199 schedule, PhilHealth premium schedule,
// Pag-IBIG/HDMF Circular 460, BIR TRAIN withholding tax tables.

// Return the 4-digit year from a "YYYY-MM-DD" (or "YYYY-MM") string.
function yearOf(dateISO) {
  const y = Number((dateISO || "").slice(0, 4));
  return Number.isFinite(y) && y > 1900 ? y : new Date().getFullYear();
}

// Months elapsed since start of year, 0-indexed (Jan = 1 .. Dec = 12).
function monthOf(dateISO) {
  const m = Number((dateISO || "").slice(5, 7));
  return Number.isFinite(m) && m >= 1 && m <= 12 ? m : 1;
}

// ── SSS (employee share) ───────────────────────────────────────────────────
// RA 11199 phase-in: EE rate + max Monthly Salary Credit ceiling by year.
function sssEmployee(grossMonthly, year) {
  let rate, mscCeiling, mscFloor = 3000;
  if (year <= 2020)      { rate = 0.04;  mscCeiling = 20000; }
  else if (year <= 2022) { rate = 0.045; mscCeiling = 25000; } // 2021–2022
  else if (year <= 2024) { rate = 0.045; mscCeiling = 30000; } // 2023–2024
  else                   { rate = 0.05;  mscCeiling = 35000; } // 2025 onwards
  const msc = Math.min(Math.max(grossMonthly, mscFloor), mscCeiling);
  return Math.round(msc * rate * 100) / 100;
}

// ── PhilHealth (employee share = half of premium) ───────────────────────────
function philhealthEmployee(grossMonthly, year) {
  let premium, floor = 10000, ceiling;
  if (year <= 2020)      { premium = 0.03;  ceiling = 60000; }
  else if (year === 2021){ premium = 0.035; ceiling = 70000; }
  else if (year === 2022){ premium = 0.04;  ceiling = 80000; }
  else if (year === 2023){ premium = 0.04;  ceiling = 90000; } // 4.5% hike suspended → stayed 4%
  else                   { premium = 0.05;  ceiling = 100000; } // 2024 onwards
  const base = Math.min(Math.max(grossMonthly, floor), ceiling);
  return Math.round(base * (premium / 2) * 100) / 100;
}

// ── Pag-IBIG / HDMF (employee share) ────────────────────────────────────────
function pagibigEmployee(grossMonthly, year, month) {
  // Rate: 1% if monthly comp ≤ 1,500, else 2%.
  const rate = grossMonthly <= 1500 ? 0.01 : 0.02;
  // Max Monthly Fund Salary: ₱5,000 before Feb 2024, ₱10,000 from Feb 2024.
  const newCap = year > 2024 || (year === 2024 && month >= 2);
  const mfsCap = newCap ? 10000 : 5000;
  const base = Math.min(grossMonthly, mfsCap);
  return Math.round(base * rate * 100) / 100;
}

// ── BIR withholding tax (monthly, graduated) ────────────────────────────────
// Applied on taxable compensation = gross − mandatory contributions.
function withholdingTax(taxableMonthly, year) {
  // Bracket: [lowerBound, baseTax, rateOnExcess]
  const table2023 = [
    [666667, 183541.80, 0.35],
    [166667, 33541.80,  0.30],
    [66667,  8541.80,   0.25],
    [33333,  1875.00,   0.20],
    [20833,  0,         0.15],
    [0,      0,         0],
  ];
  const table2018 = [
    [666667, 200833.33, 0.35],
    [166667, 40833.33,  0.32],
    [66667,  10833.33,  0.30],
    [33333,  2500.00,   0.25],
    [20833,  0,         0.20],
    [0,      0,         0],
  ];
  const table = year <= 2022 ? table2018 : table2023;
  for (const [lb, base, rate] of table) {
    if (taxableMonthly > lb) {
      return Math.round((base + (taxableMonthly - lb) * rate) * 100) / 100;
    }
  }
  return 0;
}

// Estimate all four deductions (monthly PHP) for an effective date.
//
// baseMonthly  — basic salary; the base for SSS/PhilHealth/Pag-IBIG.
// allowanceMonthly — allowance; added to the TAX base only when taxable.
// allowanceTaxable — whether the allowance is subject to withholding tax
//   (true for ordinary taxable allowances; false for de-minimis / non-taxable).
//
// Statutory contributions are computed on basic pay (not allowances), which is
// how PH payroll works. Withholding tax is on (basic + taxable allowance) less
// the mandatory contributions.
export function estimatePHDeductions(baseMonthly, dateISO, allowanceMonthly = 0, allowanceTaxable = true) {
  const base = Number(baseMonthly) || 0;
  const allow = Number(allowanceMonthly) || 0;
  const year = yearOf(dateISO);
  const month = monthOf(dateISO);
  if (base <= 0 && allow <= 0) {
    return { sss: 0, philhealth: 0, pagibig: 0, tax: 0, taxable: 0, year };
  }

  // Contributions are based on basic salary only.
  const sss        = sssEmployee(base, year);
  const philhealth = philhealthEmployee(base, year);
  const pagibig    = pagibigEmployee(base, year, month);

  // Tax base includes the allowance when it's taxable.
  const taxableGross = base + (allowanceTaxable ? allow : 0);
  const taxable      = Math.max(0, taxableGross - sss - philhealth - pagibig);
  const tax          = withholdingTax(taxable, year);

  return { sss, philhealth, pagibig, tax, taxable, year };
}
