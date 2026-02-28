/** Single item for activity timeline display. */
export interface ActivityTimelineItem {
  id?: string;
  label: string;
  date: string;
  /** Optional type for styling (e.g. 'created' | 'updated' | 'status') */
  type?: string;
}
