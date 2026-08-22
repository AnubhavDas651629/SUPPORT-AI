/**
 * Chart colour roles.
 *
 * Slot 1 is the product accent; slot 2 is the validated orange companion.
 * The pair clears the CVD, normal-vision, contrast, lightness and chroma gates
 * on both the light (#ffffff) and dark (#0e0e12) chart surfaces.
 *
 * Every chart in the app uses at most two categorical series. Breakdowns by
 * status or priority use the ordinal ramp below *and* always carry a text
 * label, so colour is never the only carrier of meaning.
 */
export const SERIES = {
  primary: "var(--accent)",
  secondary: "var(--chart-secondary)",
} as const;

/** Ordinal ramp (low → high). Rendered light→dark on light, dark→light on dark. */
export const ORDINAL_STEPS = 4;
export function ordinalVar(step: number) {
  return `var(--chart-ordinal-${Math.min(Math.max(step, 1), ORDINAL_STEPS)})`;
}
