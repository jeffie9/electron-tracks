import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { TrackService } from '../track.service';
import { TrackEditorComponent } from './track-editor.component';

describe('TrackEditorComponent', () => {
  let component: TrackEditorComponent;
  let fixture: ComponentFixture<TrackEditorComponent>;
  let trackService = jasmine.createSpyObj('TrackService', ['']);
  trackService.trackSelected$ = of({});
  trackService.menuSelected$ = of({});

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
      ],
      declarations: [ TrackEditorComponent ],
      providers: [
        { provide: TrackService, useValue: trackService },
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TrackEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
