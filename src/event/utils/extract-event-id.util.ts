/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function extractEventId(req: any): string | null {
  const vars = req.body?.variables ?? {};

  // 1) Direct eventId argument
  if (typeof vars.eventId === 'string') {
    return vars.eventId;
  }

  // 2) Inside input object
  if (vars.input && typeof vars.input.eventId === 'string') {
    return vars.input.eventId;
  }

  return null;
}
