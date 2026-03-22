/** Single item for activity timeline display. */
export type ActivityTimelineItem = {
  id?: string;
  label: string;
  date: string;
  /** Optional type for styling (e.g. 'created' | 'updated' | 'status') */
  type?: string;
};
