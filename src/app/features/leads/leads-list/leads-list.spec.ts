import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { LeadsListComponent } from './leads-list';
import { LeadsService } from '../../../services/leads.service';

describe('LeadsListComponent', () => {
  let component: LeadsListComponent;
  let fixture: ComponentFixture<LeadsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadsListComponent],
      providers: [
        provideRouter([]),
        {
          provide: LeadsService,
          useValue: { findAll: () => of({ data: [], total: 0, page: 1, limit: 20 }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
