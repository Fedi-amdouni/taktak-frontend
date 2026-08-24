export const countEnabledFeatures = <T extends string>(
  settings: Record<T, boolean>,
  featureKeys: readonly T[],
): number => featureKeys.filter((key) => settings[key]).length;
