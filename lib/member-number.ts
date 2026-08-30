export function formatMemberNumber(memberNumber: number): string {
  if (!Number.isSafeInteger(memberNumber) || memberNumber < 1) {
    throw new Error('Member number must be a positive integer.');
  }
  return `#${String(memberNumber).padStart(3, '0')}`;
}
