export const tryOr = async <T>(
  fn: () => T,
  orElse: (err: unknown) => T,
): Promise<T> => {
  try {
    const res = await fn();
    return res;
  } catch (e) {
    return orElse(e);
  }
};
