export interface DeclarationIncomeFields {
  // Earned Income - Trade/Business
  businessIncome: string;
  /** Legacy catch-all for other wholly and exclusively incurred business costs. */
  businessExpenses: string;
  businessLoanInterest: string;
  businessPremisesRent: string;
  businessRepairsMaintenance: string;
  businessEmployeeRemuneration: string;
  businessBadDebts: string;
  businessProfessionalFees: string;

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
  digitalAssetGains: string;
  digitalAssetCharges: string;
  /** Disclosed for review; not included in the automated PIT estimate until a reviewed gains module exists. */
  chargeableGains: string;

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
  nationalHousingFund: string;
  nationalHealthInsurance: string;
  mortgageInterest: string;
  lifeInsurancePremium: string;
  /** Retained for disclosure; the 0% first band is applied without a separate exclusion. */
  minimumWageEmployment: string;
  /** PAYE already deducted by an employer; shown as a credit against the estimated liability. */
  payeAlreadySuffered: string;
  /** Optional facts captured for professional review; they do not change the baseline formula. */
  rentPeriodStart?: string;
  rentPeriodEnd?: string;
  rentSharedWithOthers?: string;
  lifeInsurancePremiumPaidYear?: string;
  lifeInsurancePremiumWithdrawn?: string;
  lifeInsuranceBeneficiary?: string;
  mortgagePrincipalResidence?: string;
  employmentPeriod?: string;
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
  state: string;
}

export const defaultNigeriaForm: NigeriaDeclarationForm = {
  taxYear: "",
  country: "ng",
  state: "",
  businessIncome: "",
  businessExpenses: "",
  businessLoanInterest: "",
  businessPremisesRent: "",
  businessRepairsMaintenance: "",
  businessEmployeeRemuneration: "",
  businessBadDebts: "",
  businessProfessionalFees: "",
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
  digitalAssetGains: "",
  digitalAssetCharges: "",
  chargeableGains: "",
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
  nationalHousingFund: "",
  nationalHealthInsurance: "",
  mortgageInterest: "",
  lifeInsurancePremium: "",
  minimumWageEmployment: "",
  payeAlreadySuffered: "",
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

export interface StateOption { code: string; name: string; active: boolean; }

const stateNames = [
  ["abia", "Abia"], ["adamawa", "Adamawa"], ["akwa-ibom", "Akwa Ibom"], ["anambra", "Anambra"],
  ["bauchi", "Bauchi"], ["bayelsa", "Bayelsa"], ["benue", "Benue"], ["borno", "Borno"],
  ["cross-river", "Cross River"], ["delta", "Delta"], ["ebonyi", "Ebonyi"], ["edo", "Edo"],
  ["ekiti", "Ekiti"], ["enugu", "Enugu"], ["gombe", "Gombe"], ["imo", "Imo"], ["jigawa", "Jigawa"],
  ["kaduna", "Kaduna"], ["kano", "Kano"], ["katsina", "Katsina"], ["kebbi", "Kebbi"], ["kogi", "Kogi"],
  ["kwara", "Kwara"], ["lagos", "Lagos"], ["nasarawa", "Nasarawa"], ["niger", "Niger"], ["ogun", "Ogun"],
  ["ondo", "Ondo"], ["osun", "Osun"], ["oyo", "Oyo"], ["plateau", "Plateau"], ["rivers", "Rivers"],
  ["sokoto", "Sokoto"], ["taraba", "Taraba"], ["yobe", "Yobe"], ["zamfara", "Zamfara"], ["fct", "Federal Capital Territory (Abuja)"],
] as const;

const phaseOneStates = new Set(["lagos", "ogun", "osun", "oyo"]);
export const nigerianStates: StateOption[] = stateNames.map(([code, name]) => ({ code, name, active: phaseOneStates.has(code) }));

export function stateName(code?: string): string {
  return nigerianStates.find((state) => state.code === code)?.name ?? "—";
}

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

export const availableDeclarationCountries = africanCountries.filter((country) => country.code === "ng");
