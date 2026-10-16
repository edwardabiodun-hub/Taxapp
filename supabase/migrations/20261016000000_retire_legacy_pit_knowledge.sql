-- Keep the historical migration immutable. Retire guidance that would
-- incorrectly describe the repealed CRA and minimum tax as 2026 rules.
-- search_support_knowledge returns only verified rows, so these records
-- cease to be answer sources without deleting audit history.
update public.support_knowledge
set review_status = 'needs_review', updated_at = now()
where id in ('consolidated-relief-allowance', 'minimum-tax');

update public.support_knowledge
set aliases = '["Allowable Deductions"]'::jsonb,
    search_text = 'Total deductions Allowable Deductions The combined deductions included in the estimate before taxable or chargeable income is determined. Nigeria Tax Act, 2025, section 30(2)',
    updated_at = now()
where id = 'total-deductions';
