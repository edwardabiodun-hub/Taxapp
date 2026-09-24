export interface NigeriaDeclarationForm {
  // Personal Info
  taxYear: string;
  country: string;
  state: string;

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

export const defaultNigeriaForm: NigeriaDeclarationForm = {
  taxYear: "",
  country: "ng",
  state: "",
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

export interface StateOption {
  code: string;
  name: string;
  active: boolean;
}

// Phase 1 launches with Lagos/Ogun/Oyo/Osun active; the remaining 32
// states + FCT are listed inactive so activating one later is a data-only
// change (flip `active: true`), same mechanism as africanCountries above.
export const nigerianStates: StateOption[] = [
  { code: "lagos", name: "Lagos", active: true },
  { code: "ogun", name: "Ogun", active: true },
  { code: "oyo", name: "Oyo", active: true },
  { code: "osun", name: "Osun", active: true },
  { code: "abia", name: "Abia", active: false },
  { code: "adamawa", name: "Adamawa", active: false },
  { code: "akwa-ibom", name: "Akwa Ibom", active: false },
  { code: "anambra", name: "Anambra", active: false },
  { code: "bauchi", name: "Bauchi", active: false },
  { code: "bayelsa", name: "Bayelsa", active: false },
  { code: "benue", name: "Benue", active: false },
  { code: "borno", name: "Borno", active: false },
  { code: "cross-river", name: "Cross River", active: false },
  { code: "delta", name: "Delta", active: false },
  { code: "ebonyi", name: "Ebonyi", active: false },
  { code: "edo", name: "Edo", active: false },
  { code: "ekiti", name: "Ekiti", active: false },
  { code: "enugu", name: "Enugu", active: false },
  { code: "fct", name: "Federal Capital Territory (Abuja)", active: false },
  { code: "gombe", name: "Gombe", active: false },
  { code: "imo", name: "Imo", active: false },
  { code: "jigawa", name: "Jigawa", active: false },
  { code: "kaduna", name: "Kaduna", active: false },
  { code: "kano", name: "Kano", active: false },
  { code: "katsina", name: "Katsina", active: false },
  { code: "kebbi", name: "Kebbi", active: false },
  { code: "kogi", name: "Kogi", active: false },
  { code: "kwara", name: "Kwara", active: false },
  { code: "nasarawa", name: "Nasarawa", active: false },
  { code: "niger", name: "Niger", active: false },
  { code: "ondo", name: "Ondo", active: false },
  { code: "plateau", name: "Plateau", active: false },
  { code: "rivers", name: "Rivers", active: false },
  { code: "sokoto", name: "Sokoto", active: false },
  { code: "taraba", name: "Taraba", active: false },
  { code: "yobe", name: "Yobe", active: false },
  { code: "zamfara", name: "Zamfara", active: false },
];

export function stateName(code?: string): string {
  return nigerianStates.find((s) => s.code === code)?.name ?? "—";
}
