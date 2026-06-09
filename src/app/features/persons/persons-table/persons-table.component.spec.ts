import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { type PersonRow, PersonsTableComponent } from './persons-table.component';

const MOCK_PERSONS: PersonRow[] = [
  {
    id: 'p-1',
    fullName: 'Иванов Иван Иванович',
    type: 'CLIENT',
    dateOfBirth: '1990-05-15',
    documentExpiryStatus: 'OK',
    linkedClientId: 'c-1',
    linkedClientName: 'Иванов Иван',
  },
  {
    id: 'p-2',
    fullName: 'Петрова Мария',
    type: 'DEPENDANT',
    relation: 'Супруг(а)',
    dateOfBirth: '1992-03-22',
    documentExpiryStatus: 'EXPIRING',
    nearestExpiry: '2025-08-01',
  },
];

describe('PersonsTableComponent', () => {
  let component: PersonsTableComponent;
  let fixture: ComponentFixture<PersonsTableComponent>;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [PersonsTableComponent],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonsTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display all columns by default', () => {
    fixture.detectChanges();
    const cols = (component as unknown as { displayedColumns: () => string[] }).displayedColumns();
    expect(cols).toEqual([
      'name',
      'type',
      'relation',
      'linkedClient',
      'dateOfBirth',
      'documents',
      'actions',
    ]);
  });

  it('should omit specified columns', () => {
    fixture.componentRef.setInput('omitColumns', ['type', 'documents', 'actions']);
    fixture.detectChanges();
    const cols = (component as unknown as { displayedColumns: () => string[] }).displayedColumns();
    expect(cols).not.toContain('type');
    expect(cols).not.toContain('documents');
    expect(cols).not.toContain('actions');
    expect(cols).toContain('name');
    expect(cols).toContain('relation');
  });

  it('should navigate to person on row click', async () => {
    fixture.componentRef.setInput('persons', MOCK_PERSONS);
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('tr.table-row');
    (rows[0] as HTMLElement).click();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/app/persons', 'p-1']);
  });

  it('should render person rows', async () => {
    fixture.componentRef.setInput('persons', MOCK_PERSONS);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('.cell-primary');
    expect(cells[0].textContent.trim()).toBe('Иванов Иван Иванович');
    expect(cells[1].textContent.trim()).toBe('Петрова Мария');
  });
});
