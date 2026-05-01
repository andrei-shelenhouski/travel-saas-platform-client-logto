import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentRowComponent } from './document-row';

describe('DocumentRowComponent', () => {
  let component: DocumentRowComponent;
  let fixture: ComponentFixture<DocumentRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('document', {
      id: 'doc-1',
      filename: 'ticket.pdf',
      uploadedAt: '2026-05-01T00:00:00Z',
      uploadedByName: 'Agent',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
