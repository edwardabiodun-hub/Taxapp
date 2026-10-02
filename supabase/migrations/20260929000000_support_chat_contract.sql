-- Approved public tax content is read by the service role only. No browser
-- role receives table access, and there are no user-facing RLS policies.
create table public.support_knowledge (
  id text primary key,
  term text not null,
  aliases jsonb not null default '[]'::jsonb check (jsonb_typeof(aliases) = 'array'),
  definition text not null,
  statutory_reference text not null,
  source_url text not null,
  jurisdiction text not null default 'NG',
  effective_from date not null,
  effective_to date,
  review_owner text not null,
  last_verified date not null,
  review_status text not null check (review_status in ('verified', 'needs_review')),
  search_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

alter table public.support_knowledge enable row level security;
revoke all on table public.support_knowledge from public, anon, authenticated;
grant select on table public.support_knowledge to service_role;

-- BEGIN GENERATED SUPPORT KNOWLEDGE
-- Generated from approved taxGlossary.json; review before applying.
insert into public.support_knowledge (id, term, aliases, definition, statutory_reference, source_url, jurisdiction, effective_from, effective_to, review_owner, last_verified, review_status, search_text)
values
  ('allowances', 'Allowances', '["Allowance","Leave allowance"]'::jsonb, 'Additional employment-related payments or benefits that may be included when determining taxable employment income.', 'Nigeria Tax Act, 2025, sections 13 and 14', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Allowances Allowance Leave allowance Additional employment-related payments or benefits that may be included when determining taxable employment income. Nigeria Tax Act, 2025, sections 13 and 14'),
  ('annual-salary', 'Annual salary', '["Salary"]'::jsonb, 'Employment earnings measured over a year before applicable deductions and reliefs are applied.', 'Nigeria Tax Act, 2025, section 13', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Annual salary Salary Employment earnings measured over a year before applicable deductions and reliefs are applied. Nigeria Tax Act, 2025, section 13'),
  ('annuity-income', 'Annuity income', '["Annuity Income","Annuity from Insurance"]'::jsonb, 'Payments received at intervals under an annuity arrangement, considered according to the applicable income and exemption rules.', 'Nigeria Tax Act, 2025, section 13', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Annuity income Annuity Income Annuity from Insurance Payments received at intervals under an annuity arrangement, considered according to the applicable income and exemption rules. Nigeria Tax Act, 2025, section 13'),
  ('assessable-profits', 'Assessable profits', '["Assessable profit"]'::jsonb, 'Profits for a trade, business, profession, or vocation determined for the relevant year of assessment under the Act''s basis-period rules.', 'Nigeria Tax Act, 2025, section 22(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Assessable profits Assessable profit Profits for a trade, business, profession, or vocation determined for the relevant year of assessment under the Act''s basis-period rules. Nigeria Tax Act, 2025, section 22(1)'),
  ('basis-period', 'Basis period', '["Basis periods"]'::jsonb, 'The accounting period used to determine assessable profits for a year of assessment, including the special rules that apply when accounting dates change.', 'Nigeria Tax Act, 2025, section 23(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Basis period Basis periods The accounting period used to determine assessable profits for a year of assessment, including the special rules that apply when accounting dates change. Nigeria Tax Act, 2025, section 23(1)'),
  ('benefits-in-kind', 'Benefits-in-kind', '["Benefit-in-kind","BIK","Benefits in kind"]'::jsonb, 'Non-cash benefits provided because of employment that are treated according to the valuation and tax rules in the Nigeria Tax Act.', 'Nigeria Tax Act, 2025, section 14', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Benefits-in-kind Benefit-in-kind BIK Benefits in kind Non-cash benefits provided because of employment that are treated according to the valuation and tax rules in the Nigeria Tax Act. Nigeria Tax Act, 2025, section 14'),
  ('business-income', 'Business income', '["Business Income","Net Business Income","Business Income (Net)"]'::jsonb, 'Income from a trade, business, profession, or vocation, with allowable expenses considered when arriving at the relevant profit.', 'Nigeria Tax Act, 2025, sections 22 and 27', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Business income Business Income Net Business Income Business Income (Net) Income from a trade, business, profession, or vocation, with allowable expenses considered when arriving at the relevant profit. Nigeria Tax Act, 2025, sections 22 and 27'),
  ('capital-allowance', 'Capital allowance', '["Capital allowances"]'::jsonb, 'An allowance for qualifying capital expenditure that may be deducted in determining taxable company profits under the Act''s schedules and conditions.', 'Nigeria Tax Act, 2025, section 27(1) and First Schedule, Part II', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Capital allowance Capital allowances An allowance for qualifying capital expenditure that may be deducted in determining taxable company profits under the Act''s schedules and conditions. Nigeria Tax Act, 2025, section 27(1) and First Schedule, Part II'),
  ('chargeable-income', 'Chargeable income', '["Chargeable incomes"]'::jsonb, 'An individual''s total income after eligible deductions are subtracted for the purpose of calculating personal income tax.', 'Nigeria Tax Act, 2025, section 30(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Chargeable income Chargeable incomes An individual''s total income after eligible deductions are subtracted for the purpose of calculating personal income tax. Nigeria Tax Act, 2025, section 30(1)'),
  ('commissions-and-bonuses', 'Commissions and bonuses', '["Commissions & Bonuses","Commissions","Bonuses"]'::jsonb, 'Variable payments connected with employment, such as sales commissions or performance bonuses, considered alongside other employment income.', 'Nigeria Tax Act, 2025, section 13', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Commissions and bonuses Commissions & Bonuses Commissions Bonuses Variable payments connected with employment, such as sales commissions or performance bonuses, considered alongside other employment income. Nigeria Tax Act, 2025, section 13'),
  ('company-income-tax', 'Company income tax', '["CIT","Corporate income tax"]'::jsonb, 'Tax imposed on company profits under the company-tax rules of the Nigeria Tax Act, subject to applicable company categories and rates.', 'Nigeria Tax Act, 2025, section 56', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Company income tax CIT Corporate income tax Tax imposed on company profits under the company-tax rules of the Nigeria Tax Act, subject to applicable company categories and rates. Nigeria Tax Act, 2025, section 56'),
  ('company-vehicle', 'Company vehicle benefit', '["Company Vehicle","Vehicle Cost","Vehicle Details"]'::jsonb, 'A vehicle provided through employment whose value may be treated as a benefit-in-kind under the applicable valuation rules.', 'Nigeria Tax Act, 2025, section 14', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Company vehicle benefit Company Vehicle Vehicle Cost Vehicle Details A vehicle provided through employment whose value may be treated as a benefit-in-kind under the applicable valuation rules. Nigeria Tax Act, 2025, section 14'),
  ('consolidated-relief-allowance', 'Consolidated Relief Allowance', '["CRA"]'::jsonb, 'A consolidated personal relief used in the estimate to reduce income before the applicable tax rate is applied.', 'Nigeria Tax Act, 2025, section 30(2) and Fourth Schedule', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Consolidated Relief Allowance CRA A consolidated personal relief used in the estimate to reduce income before the applicable tax rate is applied. Nigeria Tax Act, 2025, section 30(2) and Fourth Schedule'),
  ('deduction-at-source', 'Deduction at source', '["Deductions at source","Withholding tax","WHT"]'::jsonb, 'Tax withheld by the person making a payment at the time of payment or settlement, at the rate prescribed by the applicable regulations.', 'Nigeria Tax Administration Act, 2025, section 51(1)', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Deduction at source Deductions at source Withholding tax WHT Tax withheld by the person making a payment at the time of payment or settlement, at the rate prescribed by the applicable regulations. Nigeria Tax Administration Act, 2025, section 51(1)'),
  ('development-levy', 'Development levy', '["Development levies"]'::jsonb, 'A levy imposed on assessable profits of qualifying companies, excluding the categories specified by the Nigeria Tax Act.', 'Nigeria Tax Act, 2025, section 59(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Development levy Development levies A levy imposed on assessable profits of qualifying companies, excluding the categories specified by the Nigeria Tax Act. Nigeria Tax Act, 2025, section 59(1)'),
  ('dividend-income', 'Dividend income', '["Nigerian Company Dividends","Other Dividends"]'::jsonb, 'Income distributed to an investor from company profits, subject to the applicable deduction-at-source and franked-income rules.', 'Nigeria Tax Administration Act, 2025, section 51', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Dividend income Nigerian Company Dividends Other Dividends Income distributed to an investor from company profits, subject to the applicable deduction-at-source and franked-income rules. Nigeria Tax Administration Act, 2025, section 51'),
  ('domestic-staff', 'Domestic staff', '["Domestic Staff"]'::jsonb, 'Household workers whose remuneration or employment-related benefits may be relevant to the applicable tax calculation.', 'Nigeria Tax Act, 2025, section 14', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Domestic staff Domestic Staff Household workers whose remuneration or employment-related benefits may be relevant to the applicable tax calculation. Nigeria Tax Act, 2025, section 14'),
  ('effective-tax-rate', 'Effective tax rate', '["ETR","Minimum effective tax rate"]'::jsonb, 'The rate produced by dividing a company''s aggregate covered tax paid for a year by its profits, subject to the Act''s minimum-rate rules.', 'Nigeria Tax Act, 2025, section 57(1) and (4)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Effective tax rate ETR Minimum effective tax rate The rate produced by dividing a company''s aggregate covered tax paid for a year by its profits, subject to the Act''s minimum-rate rules. Nigeria Tax Act, 2025, section 57(1) and (4)'),
  ('eligible-deductions', 'Eligible deductions', '["Eligible deduction"]'::jsonb, 'Deductions allowed from an individual''s total income, including specified statutory contributions and other deductions listed in the Act.', 'Nigeria Tax Act, 2025, section 30(2)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Eligible deductions Eligible deduction Deductions allowed from an individual''s total income, including specified statutory contributions and other deductions listed in the Act. Nigeria Tax Act, 2025, section 30(2)'),
  ('employment-income', 'Employment income', '["Employment incomes","PAYE income"]'::jsonb, 'Income arising from employment, including amounts treated as employment income under the Nigeria Tax Act.', 'Nigeria Tax Act, 2025, section 13', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Employment income Employment incomes PAYE income Income arising from employment, including amounts treated as employment income under the Nigeria Tax Act. Nigeria Tax Act, 2025, section 13'),
  ('foreign-income', 'Foreign income', '["Foreign Income","Income from Outside Nigeria"]'::jsonb, 'Income arising outside Nigeria that may still be relevant to a person’s Nigerian tax position under applicable source and residence rules.', 'Nigeria Tax Act, 2025, section 4(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Foreign income Foreign Income Income from Outside Nigeria Income arising outside Nigeria that may still be relevant to a person’s Nigerian tax position under applicable source and residence rules. Nigeria Tax Act, 2025, section 4(1)'),
  ('franked-investment-income', 'Franked investment income', '["Franked investment incomes"]'::jsonb, 'Dividend income received after prescribed tax has been deducted and which is not charged to further tax under the relevant rule.', 'Nigeria Tax Administration Act, 2025, section 51(3)', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Franked investment income Franked investment incomes Dividend income received after prescribed tax has been deducted and which is not charged to further tax under the relevant rule. Nigeria Tax Administration Act, 2025, section 51(3)'),
  ('gratuity', 'Gratuity', '["Gratuities"]'::jsonb, 'A lump-sum payment connected with employment or the end of service, considered under the applicable employment-income rules.', 'Nigeria Tax Act, 2025, section 13', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Gratuity Gratuities A lump-sum payment connected with employment or the end of service, considered under the applicable employment-income rules. Nigeria Tax Act, 2025, section 13'),
  ('gross-income', 'Gross income', '["Gross Income","Gross value"]'::jsonb, 'Income before applicable deductions, reliefs, or expenses are subtracted.', 'Nigeria Tax Act, 2025, section 28', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Gross income Gross Income Gross value Income before applicable deductions, reliefs, or expenses are subtracted. Nigeria Tax Act, 2025, section 28'),
  ('income-profits-gains', 'Income, profits or gains', '["Income profits or gains","Profits or gains"]'::jsonb, 'Income, profits, or gains accruing in or derived from Nigeria that fall within the charge to tax under the Nigeria Tax Act.', 'Nigeria Tax Act, 2025, section 4(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Income, profits or gains Income profits or gains Profits or gains Income, profits, or gains accruing in or derived from Nigeria that fall within the charge to tax under the Nigeria Tax Act. Nigeria Tax Act, 2025, section 4(1)'),
  ('interest-income', 'Interest income', '["Interest Income"]'::jsonb, 'Income earned from lending, deposits, investments, or other arrangements that produce interest.', 'Nigeria Tax Act, 2025, section 4(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Interest income Interest Income Income earned from lending, deposits, investments, or other arrangements that produce interest. Nigeria Tax Act, 2025, section 4(1)'),
  ('minimum-tax', 'Minimum tax', '["Minimum Tax"]'::jsonb, 'A minimum amount of tax that may apply under the applicable personal income tax charging rules when the ordinary calculation produces a lower amount.', 'Nigeria Tax Act, 2025, section 58 and Fourth Schedule', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Minimum tax Minimum Tax A minimum amount of tax that may apply under the applicable personal income tax charging rules when the ordinary calculation produces a lower amount. Nigeria Tax Act, 2025, section 58 and Fourth Schedule'),
  ('net-income', 'Net income', '["Income after expenses"]'::jsonb, 'Income remaining after the expenses permitted for the relevant calculation have been deducted.', 'Nigeria Tax Act, 2025, sections 22 and 27', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Net income Income after expenses Income remaining after the expenses permitted for the relevant calculation have been deducted. Nigeria Tax Act, 2025, sections 22 and 27'),
  ('pension-contribution', 'Pension contribution', '["Pension Contribution","Employee Pension"]'::jsonb, 'A contribution to a qualifying pension arrangement that may be considered as an eligible deduction under applicable rules.', 'Nigeria Tax Act, 2025, section 30(2)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Pension contribution Pension Contribution Employee Pension A contribution to a qualifying pension arrangement that may be considered as an eligible deduction under applicable rules. Nigeria Tax Act, 2025, section 30(2)'),
  ('personal-income-tax', 'Personal income tax', '["PIT"]'::jsonb, 'Tax imposed on an individual''s chargeable income for each year of assessment under the personal-income-tax rules of the Nigeria Tax Act.', 'Nigeria Tax Act, 2025, section 58 and Fourth Schedule', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Personal income tax PIT Tax imposed on an individual''s chargeable income for each year of assessment under the personal-income-tax rules of the Nigeria Tax Act. Nigeria Tax Act, 2025, section 58 and Fourth Schedule'),
  ('rent-income', 'Rent income', '["Rent Income","Rent Income (Net)","Rental income"]'::jsonb, 'Income received from letting property, shown here after the applicable expenses used by the estimate have been considered.', 'Nigeria Tax Act, 2025, section 4(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Rent income Rent Income Rent Income (Net) Rental income Income received from letting property, shown here after the applicable expenses used by the estimate have been considered. Nigeria Tax Act, 2025, section 4(1)'),
  ('rent-relief', 'Rent relief', '["Rent Relief","Annual Rent Paid"]'::jsonb, 'A tax relief or deduction connected with qualifying rent paid, subject to the limits and conditions that apply to the relevant taxpayer.', 'Nigeria Tax Act, 2025, section 30(2)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Rent relief Rent Relief Annual Rent Paid A tax relief or deduction connected with qualifying rent paid, subject to the limits and conditions that apply to the relevant taxpayer. Nigeria Tax Act, 2025, section 30(2)'),
  ('supporting-documents', 'Supporting documents', '["Supporting Documents","Supporting documentation"]'::jsonb, 'Documents kept or supplied to support reported income, deductions, transactions, or other information in a tax declaration or return.', 'Nigeria Tax Administration Act, 2025, sections 11 to 15', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Supporting documents Supporting Documents Supporting documentation Documents kept or supplied to support reported income, deductions, transactions, or other information in a tax declaration or return. Nigeria Tax Administration Act, 2025, sections 11 to 15'),
  ('tax-authority', 'Tax authority', '["Tax authorities","Relevant tax authority"]'::jsonb, 'The government authority responsible for administering, assessing, collecting, or enforcing the relevant tax obligation.', 'Nigeria Tax Administration Act, 2025, sections 4 and 8', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax authority Tax authorities Relevant tax authority The government authority responsible for administering, assessing, collecting, or enforcing the relevant tax obligation. Nigeria Tax Administration Act, 2025, sections 4 and 8'),
  ('tax-declaration', 'Tax declaration', '["Tax Declaration","Tax declarations","Declaration"]'::jsonb, 'A submission reporting the taxpayer’s relevant income, deductions, documents, and other information required for a tax assessment.', 'Nigeria Tax Administration Act, 2025, sections 11 to 15', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax declaration Tax Declaration Tax declarations Declaration A submission reporting the taxpayer’s relevant income, deductions, documents, and other information required for a tax assessment. Nigeria Tax Administration Act, 2025, sections 11 to 15'),
  ('tax-estimate', 'Tax estimate', '["Tax Estimator","Tax Estimate","Estimated Tax Payable"]'::jsonb, 'An indicative calculation based on the information entered; the final liability remains subject to the relevant authority’s assessment and verification.', 'Nigeria Tax Act, 2025, section 58 and Fourth Schedule', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax estimate Tax Estimator Tax Estimate Estimated Tax Payable An indicative calculation based on the information entered; the final liability remains subject to the relevant authority’s assessment and verification. Nigeria Tax Act, 2025, section 58 and Fourth Schedule'),
  ('tax-id', 'Tax ID', '["Taxpayer Identification","Taxpayer Identification Number","TIN"]'::jsonb, 'A unique identifier issued by the relevant tax authority for tax compliance, returns, and other documents connected with a taxpayer.', 'Nigeria Tax Administration Act, 2025, sections 4, 7 and 8', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax ID Taxpayer Identification Taxpayer Identification Number TIN A unique identifier issued by the relevant tax authority for tax compliance, returns, and other documents connected with a taxpayer. Nigeria Tax Administration Act, 2025, sections 4, 7 and 8'),
  ('tax-paid', 'Tax paid', '["Tax Paid","Tax payment"]'::jsonb, 'An amount remitted to the relevant tax authority to settle an assessed, self-assessed, or otherwise payable tax obligation.', 'Nigeria Tax Administration Act, 2025, sections 4 and 11 to 15', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax paid Tax Paid Tax payment An amount remitted to the relevant tax authority to settle an assessed, self-assessed, or otherwise payable tax obligation. Nigeria Tax Administration Act, 2025, sections 4 and 11 to 15'),
  ('tax-records', 'Tax records', '["Tax record","Records retained for tax purposes"]'::jsonb, 'Documents and information kept to support tax returns, calculations, payments, assessments, or other compliance obligations.', 'Nigeria Tax Administration Act, 2025, section 31', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax records Tax record Records retained for tax purposes Documents and information kept to support tax returns, calculations, payments, assessments, or other compliance obligations. Nigeria Tax Administration Act, 2025, section 31'),
  ('tax-return', 'Tax return', '["Tax returns"]'::jsonb, 'A form or document filed with a relevant tax authority reporting income, expenses, transactions, and other prescribed information.', 'Nigeria Tax Administration Act, 2025, sections 11 to 15', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax return Tax returns A form or document filed with a relevant tax authority reporting income, expenses, transactions, and other prescribed information. Nigeria Tax Administration Act, 2025, sections 11 to 15'),
  ('tax-year', 'Tax year', '["Tax Year","Year of assessment"]'::jsonb, 'The year for which income, deductions, and tax obligations are measured and reported.', 'Nigeria Tax Act, 2025, section 30 and Fourth Schedule', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Tax year Tax Year Year of assessment The year for which income, deductions, and tax obligations are measured and reported. Nigeria Tax Act, 2025, section 30 and Fourth Schedule'),
  ('taxable', 'Taxable', '["Taxability"]'::jsonb, 'Subject to tax under the applicable charging, inclusion, and exemption rules.', 'Nigeria Tax Act, 2025, section 4(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Taxable Taxability Subject to tax under the applicable charging, inclusion, and exemption rules. Nigeria Tax Act, 2025, section 4(1)'),
  ('taxable-income', 'Taxable income', '["Taxable Income"]'::jsonb, 'Income remaining after the applicable deductions and reliefs used to determine the amount subject to tax.', 'Nigeria Tax Act, 2025, section 30', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Taxable income Taxable Income Income remaining after the applicable deductions and reliefs used to determine the amount subject to tax. Nigeria Tax Act, 2025, section 30'),
  ('taxable-person', 'Taxable person', '["Taxable persons"]'::jsonb, 'A person required to register with the relevant tax authority and comply with applicable Nigerian tax obligations.', 'Nigeria Tax Administration Act, 2025, section 4', 'https://nass.gov.ng/documents/download/11250', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Taxable person Taxable persons A person required to register with the relevant tax authority and comply with applicable Nigerian tax obligations. Nigeria Tax Administration Act, 2025, section 4'),
  ('taxable-supply', 'Taxable supply', '["Taxable supplies"]'::jsonb, 'A supply of goods, services, or an incorporeal that is treated as taking place in Nigeria and is subject to VAT under the Act.', 'Nigeria Tax Act, 2025, sections 145 and 146', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Taxable supply Taxable supplies A supply of goods, services, or an incorporeal that is treated as taking place in Nigeria and is subject to VAT under the Act. Nigeria Tax Act, 2025, sections 145 and 146'),
  ('total-deductions', 'Total deductions', '["Deductions (incl. CRA)","Allowable Deductions"]'::jsonb, 'The combined deductions included in the estimate before taxable or chargeable income is determined.', 'Nigeria Tax Act, 2025, section 30(2)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Total deductions Deductions (incl. CRA) Allowable Deductions The combined deductions included in the estimate before taxable or chargeable income is determined. Nigeria Tax Act, 2025, section 30(2)'),
  ('total-income', 'Total income', '["Total income of an individual"]'::jsonb, 'An individual''s income assembled under the Act before eligible deductions are subtracted to determine chargeable income.', 'Nigeria Tax Act, 2025, section 28', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Total income Total income of an individual An individual''s income assembled under the Act before eligible deductions are subtracted to determine chargeable income. Nigeria Tax Act, 2025, section 28'),
  ('total-profits', 'Total profits', '["Total profit"]'::jsonb, 'A company''s total assessable profits from all sources, reduced by allowable losses and capital allowance as provided by the Act.', 'Nigeria Tax Act, 2025, section 27(1)', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Total profits Total profit A company''s total assessable profits from all sources, reduced by allowable losses and capital allowance as provided by the Act. Nigeria Tax Act, 2025, section 27(1)'),
  ('value-added-tax', 'Value Added Tax', '["VAT"]'::jsonb, 'A tax imposed on taxable supplies in Nigeria under Chapter Six of the Nigeria Tax Act, subject to its charging and exemption rules.', 'Nigeria Tax Act, 2025, sections 143 and 144', 'https://nass.gov.ng/documents/download/11249', 'NG', '2026-01-01'::date, null, 'tax-content-review', '2026-09-28'::date, 'verified', 'Value Added Tax VAT A tax imposed on taxable supplies in Nigeria under Chapter Six of the Nigeria Tax Act, subject to its charging and exemption rules. Nigeria Tax Act, 2025, sections 143 and 144')
on conflict (id) do update set
  term = excluded.term, aliases = excluded.aliases, definition = excluded.definition,
  statutory_reference = excluded.statutory_reference, source_url = excluded.source_url,
  jurisdiction = excluded.jurisdiction, effective_from = excluded.effective_from,
  effective_to = excluded.effective_to, review_owner = excluded.review_owner,
  last_verified = excluded.last_verified, review_status = excluded.review_status,
  search_text = excluded.search_text, updated_at = now();
-- END GENERATED SUPPORT KNOWLEDGE

create index support_knowledge_search_idx
  on public.support_knowledge using gin (to_tsvector('english', search_text));

create trigger support_knowledge_set_updated_at
  before update on public.support_knowledge
  for each row execute function public.set_updated_at();

create or replace function public.search_support_knowledge(p_query text, p_as_of date, p_limit integer default 5)
returns table (
  id text,
  term text,
  aliases jsonb,
  definition text,
  statutory_reference text,
  source_url text,
  jurisdiction text,
  effective_from date,
  effective_to date,
  last_verified date
)
language sql stable security invoker
set search_path = ''
as $$
  select k.id, k.term, k.aliases, k.definition, k.statutory_reference,
         k.source_url, k.jurisdiction, k.effective_from, k.effective_to,
         k.last_verified
  from public.support_knowledge k
  where k.jurisdiction = 'NG'
    and k.review_status = 'verified'
    and k.effective_from <= p_as_of
    and (k.effective_to is null or k.effective_to >= p_as_of)
    and to_tsvector('english', k.search_text) @@ websearch_to_tsquery('english', p_query)
  order by ts_rank(to_tsvector('english', k.search_text), websearch_to_tsquery('english', p_query)) desc, k.id
  limit least(greatest(coalesce(p_limit, 5), 0), 5);
$$;

revoke all on function public.search_support_knowledge(text, date, integer) from public, anon, authenticated;
grant execute on function public.search_support_knowledge(text, date, integer) to service_role;

-- Private summaries run as the JWT caller. RLS on each source table remains
-- active and every query also states its ownership predicate explicitly.
create or replace function public.get_my_declaration_status()
returns table (
  declaration_id uuid,
  tax_year text,
  declaration_type text,
  status text,
  document_count integer,
  created_at timestamptz
)
language sql stable security invoker
set search_path = ''
as $$
  select d.id, d.tax_year, d.type, d.status,
         case when jsonb_typeof(d.documents) = 'array'
           then jsonb_array_length(d.documents) else 0 end,
         d.created_at
  from public.declarations d
  where d.user_id = auth.uid()
  order by d.created_at desc, d.id
  limit 20;
$$;

revoke all on function public.get_my_declaration_status() from public, anon, authenticated;
grant execute on function public.get_my_declaration_status() to authenticated;

create or replace function public.get_my_support_message_summary()
returns table (unread_count bigint, categories text[])
language sql stable security invoker
set search_path = ''
as $$
  select count(*) filter (where m.read_at is null) as unread_count,
         coalesce(array_agg(distinct m.category order by m.category), '{}'::text[]) as categories
  from public.messages m
  where m.recipient_user_id = auth.uid();
$$;

revoke all on function public.get_my_support_message_summary() from public, anon, authenticated;
grant execute on function public.get_my_support_message_summary() to authenticated;

create or replace function public.get_my_profile_completion()
returns table (is_complete boolean, missing_fields text[])
language sql stable security invoker
set search_path = ''
as $$
  select coalesce(cardinality(own_profile.missing_fields) = 0, false),
         coalesce(own_profile.missing_fields, array['profile']::text[])
  from (select auth.uid() as caller_id) caller
  left join lateral (
    select array_remove(array[
      case when nullif(btrim(p.name), '') is null then 'name' end,
      case when nullif(btrim(p.phone), '') is null then 'phone' end,
      case when nullif(btrim(p.tax_id), '') is null then 'tax_id' end,
      case when nullif(btrim(p.country), '') is null then 'country' end,
      case when p.date_of_birth is null then 'date_of_birth' end,
      case when nullif(btrim(p.country_of_birth), '') is null then 'country_of_birth' end,
      case when nullif(btrim(p.gender), '') is null then 'gender' end,
      case when nullif(btrim(p.nationality), '') is null then 'nationality' end
    ], null)::text[] as missing_fields
    from public.profiles p
    where p.id = auth.uid()
  ) own_profile on true;
$$;

revoke all on function public.get_my_profile_completion() from public, anon, authenticated;
grant execute on function public.get_my_profile_completion() to authenticated;
