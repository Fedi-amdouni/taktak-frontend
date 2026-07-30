export const formatTableNumber = (tableNumber: number) => String(tableNumber).padStart(2, '0');

export const formatTableCode = (value: string | undefined, tableNumber: number) => {
  const raw = (value || `T${tableNumber}`).trim().toUpperCase().replace(/\s+/g, '');
  const match = raw.match(/^([A-Z]+)[-_]?(\d+)$/);
  return match ? `${match[1]}${match[2].padStart(2, '0')}` : raw;
};
