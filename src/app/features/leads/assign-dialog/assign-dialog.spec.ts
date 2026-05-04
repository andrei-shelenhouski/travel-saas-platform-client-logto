import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AssignDialogComponent, AssignDialogData } from './assign-dialog';

import type { OrganizationMemberResponseDto } from '@app/shared/models';

describe('AssignDialogComponent', () => {
  let component: AssignDialogComponent;
  let fixture: ComponentFixture<AssignDialogComponent>;
  let dialogRef: MatDialogRef<AssignDialogComponent>;

  const mockAgents: OrganizationMemberResponseDto[] = [
    {
      id: '1',
      userId: 'user-1',
      role: 'AGENT',
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
    },
    {
      id: '2',
      userId: 'user-2',
      role: 'AGENT',
      name: 'Jane Smith',
      email: 'jane@example.com',
      active: true,
    },
  ];

  const mockDialogData: AssignDialogData = {
    agents: mockAgents,
    initialSelectedAgentId: null,
  };

  beforeEach(async () => {
    const dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AssignDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignDialogComponent);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter agents by name', () => {
    component['assignSearch'].set('john');
    fixture.detectChanges();

    const filtered = component['filteredAgents']();

    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('John Doe');
  });

  it('should filter agents by email', () => {
    component['assignSearch'].set('jane@example.com');
    fixture.detectChanges();

    const filtered = component['filteredAgents']();

    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe('jane@example.com');
  });

  it('should close dialog with selected agent ID on confirm', () => {
    component['selectedAgentId'].set('user-1');
    component['onConfirm']();

    expect(dialogRef.close).toHaveBeenCalledWith('user-1');
  });

  it('should close dialog without data on cancel', () => {
    component['onCancel']();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('should set initial selected agent ID from dialog data', () => {
    const dataWithInitial: AssignDialogData = {
      agents: mockAgents,
      initialSelectedAgentId: 'user-2',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AssignDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dataWithInitial },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });

    const newFixture = TestBed.createComponent(AssignDialogComponent);

    newFixture.detectChanges();

    expect(newFixture.componentInstance['selectedAgentId']()).toBe('user-2');
  });

  it('should get agent initials correctly', () => {
    expect(component['getAgentInitials']('John Doe')).toBe('JD');
    expect(component['getAgentInitials']('Jane')).toBe('J');
    expect(component['getAgentInitials'](null)).toBe('NA');
    expect(component['getAgentInitials']('')).toBe('NA');
  });
});
