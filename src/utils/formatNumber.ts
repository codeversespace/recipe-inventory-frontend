export const formatMoney = (value: number | null | undefined): string => {
  const num = Number(value) || 0;
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const [intPart, decPart] = abs.toFixed(2).split(".");
  // Indian numbering: last 3 digits, then groups of 2
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (rest ? "," : "") + lastThree;
  const result = decPart === "00" ? formatted : `${formatted}.${decPart}`;
  return isNegative ? `-₹${result}` : `₹${result}`;
};

export const formatNumber = (value: number | null | undefined): string => {
  const num = Number(value) || 0;
  const isNegative = num < 0;
  const abs = Math.abs(num);
  const intPart = Math.round(abs).toString();
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (rest ? "," : "") + lastThree;
  return isNegative ? `-${formatted}` : formatted;
};
