/**
 * constants/edit-chips.ts
 *
 * Quick-fill verb/preset chips shown above the edit-chat textarea
 * (EditChat/EditChipsRow.tsx). Clicking a chip only fills the textarea —
 * it never auto-sends, so the user can tweak wording before submitting.
 */

export interface EditChip {
  label: string
  /** Text inserted into (or appended to) the textarea. */
  fill: string
  /** Whether the underlying instruction needs a mask to make sense. Informational only — not enforced. */
  needsMask?: boolean
}

export const EDIT_CHIPS: EditChip[] = [
  { label: 'Remove', fill: 'Remove ', needsMask: true },
  { label: 'Replace with…', fill: 'Replace this with ', needsMask: true },
  { label: 'Add…', fill: 'Add ' },
  { label: 'Change color…', fill: 'Change the color of this to ' },
  {
    label: 'Golden hour',
    fill: 'Relight the scene as warm golden-hour sunlight, keep everything else identical',
  },
  {
    label: 'Blur background',
    fill: 'Blur the background softly like a portrait photo; keep the subject sharp',
  },
]
