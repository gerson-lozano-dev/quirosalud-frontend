import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tratamientos } from './tratamientos';

describe('Tratamientos', () => {
  let component: Tratamientos;
  let fixture: ComponentFixture<Tratamientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tratamientos],
    }).compileComponents();

    fixture = TestBed.createComponent(Tratamientos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
