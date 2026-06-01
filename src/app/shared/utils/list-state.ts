import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

export const PAGE_SIZE = 20;

export type ListState = {
  readonly currentPage: ReturnType<typeof signal<number>>;
  readonly pageSize: number;
  onPageChange(event: PageEvent): void;
  resetPage(): void;
};

/**
 * Factory that creates the shared pagination state used by every list-page
 * component. Returns signals and handlers so they can be destructured directly
 * into the component class.
 */
export function createListState(): ListState {
  const currentPage = signal(0);

  function resetPage(): void {
    currentPage.set(0);
  }

  function onPageChange(event: PageEvent): void {
    currentPage.set(event.pageIndex);
  }

  return { currentPage, pageSize: PAGE_SIZE, onPageChange, resetPage };
}
