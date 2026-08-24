export type TableSessionValidationDecision = 'ACCEPT' | 'REJECT' | 'PRESERVE';

export const decideTableSessionValidation = (
  sessionValid: boolean | undefined,
): TableSessionValidationDecision => {
  if (sessionValid === true) return 'ACCEPT';
  if (sessionValid === false) return 'REJECT';
  return 'PRESERVE';
};
