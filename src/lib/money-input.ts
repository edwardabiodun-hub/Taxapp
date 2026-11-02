export function formatMoneyInput(value: string): string {
  const sanitized = value.replace(/[^\d.]/g, "");
  if (!sanitized) return "";

  const decimalIndex = sanitized.indexOf(".");
  const integerPart = decimalIndex === -1 ? sanitized : sanitized.slice(0, decimalIndex);
  const decimalPart = decimalIndex === -1 ? undefined : sanitized.slice(decimalIndex + 1).replace(/\./g, "").slice(0, 2);
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || (decimalPart !== undefined ? "0" : "");
  const formattedInteger = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
}
