interface DeclarationIncomeFields {
  // Earned Income - Trade/Business
  businessIncome: string;
  businessExpenses: string;

  // Earned Income - Employment
  annualSalary: string;
  commissions: string;
  bonuses: string;
  allowances: string;

  // Earned Income - Annuity
  pensionReceived: string;
  pensionPayerName: string;
  pensionPayerAddress: string;
  annuityInsurance: string;
  annuityPayerName: string;
  annuityPayerAddress: string;
  gratuities: string;
  gratuityPayerName: string;
  gratuityPayerAddress: string;

  // Earned Income - Foreign
  foreignIncome: string;

  // Investment Income
  nigerianDividends: string;
  otherDividends: string;
  interestIncome: string;
  interestSources: string;
  rentIncome: string;
  rentExpenses: string;
  otherInvestmentIncome: string;
  otherInvestmentDetails: string;

  // Benefits in Kind
  rentPaidBySelf: string;
  rentPaidBySelfAddress: string;
  rentPaidByEmployer: string;
  rentPaidByEmployerName: string;
  domesticStaffBySelf: string;
  domesticStaffByEmployer: string;
  companyVehicleCost: string;
  companyVehicleDetails: string;

  // Allowable Deductions
  employeePension: string;
  annualRentPaid: string;
}

/** Canonical declaration shape for the jurisdiction-aware flow. */
export interface DeclarationFormData extends DeclarationIncomeFields {
  taxYear: string;
  jurisdictionCode: string;
}

/**
 * Compatibility shape for the existing country-based screens and saved
 * drafts. New domain records should use DeclarationFormData instead.
 */
export interface NigeriaDeclarationForm extends DeclarationIncomeFields {
  // Personal Info
  taxYear: string;
  country: string;
}

export const defaultNigeriaForm: NigeriaDeclarationForm = {
  taxYear: "",
  country: "ng",
  businessIncome: "",
  businessExpenses: "",
  annualSalary: "",
  commissions: "",
  bonuses: "",
  allowances: "",
  pensionReceived: "",
  pensionPayerName: "",
  pensionPayerAddress: "",
  annuityInsurance: "",
  annuityPayerName: "",
  annuityPayerAddress: "",
  gratuities: "",
  gratuityPayerName: "",
  gratuityPayerAddress: "",
  foreignIncome: "",
  nigerianDividends: "",
  otherDividends: "",
  interestIncome: "",
  interestSources: "",
  rentIncome: "",
  rentExpenses: "",
  otherInvestmentIncome: "",
  otherInvestmentDetails: "",
  rentPaidBySelf: "",
  rentPaidBySelfAddress: "",
  rentPaidByEmployer: "",
  rentPaidByEmployerName: "",
  domesticStaffBySelf: "",
  domesticStaffByEmployer: "",
  companyVehicleCost: "",
  companyVehicleDetails: "",
  employeePension: "",
  annualRentPaid: "",
};

/**
 * Maps a legacy country-based draft without guessing a state. An empty
 * jurisdiction code deliberately requires the user to confirm a jurisdiction
 * before the draft is treated as a complete preparation.
 */
export function mapLegacyDeclaration(
  draft: NigeriaDeclarationForm | Record<string, unknown>,
): DeclarationFormData {
  const { country: _country, jurisdictionCode, ...formData } = draft as Record<
    string,
    unknown
  >;

  return {
    ...(formData as Omit<DeclarationFormData, "jurisdictionCode">),
    jurisdictionCode:
      typeof jurisdictionCode === "string" ? jurisdictionCode : "",
  };
}

export const mapLegacyDraft = mapLegacyDeclaration;

export const declarationSteps = [
  "Country",
  "Earned Income",
  "Investment",
  "Benefits",
  "Deductions",
  "Documents",
  "Review",
];

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  active: boolean;
}

export const africanCountries: CountryOption[] = [
  { code: "ng", name: "Nigeria", flag: "🇳🇬", active: true },
  { code: "ke", name: "Kenya", flag: "🇰🇪", active: false },
  { code: "gh", name: "Ghana", flag: "🇬🇭", active: false },
  { code: "za", name: "South Africa", flag: "🇿🇦", active: false },
  { code: "tz", name: "Tanzania", flag: "🇹🇿", active: false },
  { code: "ug", name: "Uganda", flag: "🇺🇬", active: false },
  { code: "rw", name: "Rwanda", flag: "🇷🇼", active: false },
  { code: "et", name: "Ethiopia", flag: "🇪🇹", active: false },
];
