import { Component, computed, input } from '@angular/core';
import type { OfferResponseDto } from '../../../shared/models';

export interface TimelineItem {
  label: string;
  date: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function buildOfferTimelineItems(offer: OfferResponseDto | null): TimelineItem[] {
  if (!offer) return [];
  const items: TimelineItem[] = [];
  if (offer.createdAt) {
    items.push({ label: 'Offer created', date: formatDate(offer.createdAt) });
  }
  if (offer.updatedAt && offer.updatedAt !== offer.createdAt) {
    items.push({ label: 'Status updated', date: formatDate(offer.updatedAt) });
  }
  return items;
}

@Component({
  selector: 'app-offer-timeline',
  template: `
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <h3 class="text-sm font-semibold text-gray-900">Timeline</h3>
      <ul class="mt-3 space-y-3" role="list">
        @for (item of timelineItems(); track item.date + item.label) {
          <li class="flex gap-3">
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-400"
              aria-hidden="true"
            ></span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ item.label }}</p>
              <p class="text-xs text-gray-500">{{ item.date }}</p>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class OfferTimelineComponent {
  offer = input.required<OfferResponseDto | null>();

  protected readonly timelineItems = computed(() =>
    buildOfferTimelineItems(this.offer())
  );
}
