import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestFilterBarComponent } from './request-filter-bar';

describe('RequestFilterBarComponent', () => {
  let component: RequestFilterBarComponent;
  let fixture: ComponentFixture<RequestFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestFilterBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestFilterBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('value', {
      status: [],
      managerId: '',
      departDateFrom: '',
      departDateTo: '',
    });
    fixture.componentRef.setInput('managerOptions', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
