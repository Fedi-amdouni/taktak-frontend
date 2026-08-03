export const formatPrice = (price?: number | string | null): string => {
  if (price === null || price === undefined || price === '') return '0';
  const num = Number(price);
  if (isNaN(num)) return '0';
  return num.toString();
};
