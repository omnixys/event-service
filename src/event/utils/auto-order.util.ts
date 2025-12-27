/* eslint-disable @typescript-eslint/no-explicit-any */

export function withAutoOrder<T extends Record<string, any>>(
  items: T[],
): Array<T & { order: number }> {
  return items.map((item, index) => ({
    ...item,
    order: typeof item.order === 'number' ? item.order : index,
  }));
}
