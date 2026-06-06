import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appPageAction]',
})
export class PageHeadingAction {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly icon = input.required<string>();
  readonly label = input('');
  readonly disabled = input(false);
}
