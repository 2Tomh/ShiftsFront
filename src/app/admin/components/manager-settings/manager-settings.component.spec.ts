import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerSettingsComponent } from './manager-settings.component';

describe('ManagerSettingsComponent', () => {
  let component: ManagerSettingsComponent;
  let fixture: ComponentFixture<ManagerSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManagerSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
