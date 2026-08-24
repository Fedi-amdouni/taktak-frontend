export type TableSessionValidationDecision = 'ACCEPT' | 'REJECT' | 'PRESERVE';

export const decideTableSessionValidation = (
  sessionValid: boolean | undefined,
  hasPreviouslyValidatedToken: boolean,
): TableSessionValidationDecision => {
  if (sessionValid === true) return 'ACCEPT';
  if (sessionValid === false) return 'REJECT';
  return hasPreviouslyValidatedToken ? 'PRESERVE' : 'REJECT';
};
