import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Track } from '../track';
import { TrackService, inchesToScaleFeet, scaleFeetToInches, degreesToRadians, radiansToDegrees } from '../track.service';
import { angleBetweenPoints, distance } from '../geometry';

const MM_PER_IN = 25.400051;

@Component({
  selector: 'app-track-editor',
  templateUrl: './track-editor.component.html',
  styleUrls: ['./track-editor.component.css']
})
export class TrackEditorComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas : ElementRef<HTMLCanvasElement>;
  private canvasContext: CanvasRenderingContext2D;
  private subscriptions: Subscription[] = [];
  scale = 4.5;
  track: Track;
  trackForm = this.fb.group({
      description: [''],
      straight: this.fb.group({
          length: ['']
      }),
      curve: this.fb.group({
          radius: [''],
          sweep: ['']
      }),
      turnout: this.fb.group({
          direction: [''],
          tNumber: [''],
          length: [''],
          radius: [''],
          sweep: [''],
          lead: ['']
      }),
      crossing: this.fb.group({
          length: [''],
          angle: ['']
      }),
      curveTurnout: this.fb.group({
          direction: [''],
          mainRadius: [''],
          mainSweep: [''],
          branchRadius: [''],
          branchSweep: ['']
      }),
      wyeTurnout: this.fb.group({
          mainRadius: [''],
          mainSweep: [''],
          branchRadius: [''],
          branchSweep: ['']
      }),
  });

  constructor(
    private fb: FormBuilder,
    private trackService: TrackService) {}

  ngOnInit() {
    this.subscriptions.push(this.trackService.trackSelected$.subscribe(
      track => {
          this.track = track;
          this.drawTrack();
          this.updateForm();
      }
    ));
    this.track = this.trackService.selectedTrack;
    this.subscriptions.push(this.trackForm.get('description').valueChanges.subscribe(e => {
        this.updateTrackDescription(e);
    }));
    this.subscriptions.push(this.trackForm.get('straight').valueChanges.subscribe(e => {
        this.updateStraightTrack(e);
    }));
    this.subscriptions.push(this.trackForm.get('curve').valueChanges.subscribe(e => {
        this.updateCurveTrack(e);
    }));
    this.subscriptions.push(this.trackForm.get('crossing').valueChanges.subscribe(e => {
        this.updateCrossingTrack(e);
    }));
    this.subscriptions.push(this.trackForm.get('turnout').valueChanges.subscribe(e => {
        this.updateTurnoutTrack(e);
    }));
    this.subscriptions.push(this.trackService.menuSelected$
    .subscribe(mi => this.handleMenu(mi)));

    // this.track = this.crossing(5 * 25.400051, 30);
    // this.trackService.getTrackLibrary().push(this.track);
    // this.updateForm();
  }

  ngAfterViewInit() {
    //let rect = this.canvas.nativeElement.parentElement.getBoundingClientRect() as DOMRect;
    //this.canvas.nativeElement.height = window.innerHeight - rect.y + window.scrollY - 15;
    //this.canvas.nativeElement.width = rect.width;
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    this.canvasContext.translate(this.canvas.nativeElement.width / 2, this.canvas.nativeElement.height / 2);
    this.canvasContext.scale(this.scale, this.scale);
    this.drawTrack();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  drawTrack() {
    this.canvasContext.clearRect(-this.canvas.nativeElement.width / 2, -this.canvas.nativeElement.height / 2, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    if (this.track) {
        this.canvasContext.strokeStyle = 'blue';
        this.canvasContext.stroke(this.track.outline);
        // temporary markers
        // this.canvasContext.beginPath();
        // this.canvasContext.ellipse(0, 0, 2, 2, 0, 0, 2 * Math.PI);
        // this.canvasContext.fill();
        // this.track.paths.forEach(p => {
        //     this.canvasContext.beginPath();
        //     this.canvasContext.ellipse(p.x1, p.y1, 2, 2, 0, 0, 2 * Math.PI);
        //     this.canvasContext.fill();
        //     this.canvasContext.beginPath();
        //     this.canvasContext.ellipse(p.x2, p.y2, 2, 2, 0, 0, 2 * Math.PI);
        //     this.canvasContext.fill();
        // });
    }
  }

  saveLibrary() {
    this.trackService.saveTrackLibrary();
  }

  updateForm() {
    console.log('updateForm');
    this.trackForm.reset({
        description: this.track.label
    }, {emitEvent: false});
    const fg = this.trackForm.get(this.track.type) as FormGroup;
    const paths = this.track.paths;
    switch (this.track.type) {
    case 'straight':
        fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
            Math.abs(paths[0].x2 - paths[0].x1)), {emitEvent: false});
        break;
    case 'curve':
        fg.get('radius').setValue(scaleFeetToInches(this.trackService.selectedScale, paths[0].r), {emitEvent: false});
        fg.get('sweep').setValue(radiansToDegrees(paths[0].calcSweep()), {emitEvent: false});
        break;
    case 'turnout':
        fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
            Math.abs(paths[0].x2 - paths[0].x1)), {emitEvent: false});
        fg.get('radius').setValue(scaleFeetToInches(this.trackService.selectedScale, paths[1].r), {emitEvent: false});
        fg.get('sweep').setValue(radiansToDegrees(paths[1].calcSweep()), {emitEvent: false});
        if (this.track.paths[0].y1 === this.track.paths[1].y1) {
            fg.get('direction').setValue('right');
            fg.get('lead').setValue(scaleFeetToInches(this.trackService.selectedScale, this.track.paths[0].x2 - this.track.paths[1].x2));
        } else {
            fg.get('direction').setValue('left');
            fg.get('lead').setValue(scaleFeetToInches(this.trackService.selectedScale, this.track.paths[1].x1 - this.track.paths[0].x1));
        }
        break;
    case 'crossing':
        fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
            distance(paths[0].x1, paths[0].y1, paths[0].x2, paths[0].y2)), {emitEvent: false});
        fg.get('angle').setValue(radiansToDegrees(
            angleBetweenPoints(0, 0, paths[0].x2, paths[0].y2, paths[1].x2, paths[1].y2)), {emitEvent: false});
        break;
    }
  }

  updateTrack(newTrack: Track) {
    this.track.paths = newTrack.paths;
    this.track.outline = newTrack.outline;
    this.track.svg = newTrack.svg;
    this.drawTrack();
  }

  updateTrackDescription(e: any) {
    console.log('updateTrackDescription', e);
  }

  updateStraightTrack(e: any) {
    console.log('updateStraightTrack', e);
    if (e.length > 0) {
        const newTrack = Track.straightTrack(inchesToScaleFeet(this.trackService.selectedScale, e.length));
        this.track.paths = newTrack.paths;
        this.track.outline = newTrack.outline;
        this.track.svg = newTrack.svg;
        this.drawTrack();
    }
  }

  updateCurveTrack(e: any) {
    console.log('updateCurveTrack', e);
    if (e.radius > 0 && e.sweep > 0) {
        const newTrack = Track.curveTrack(inchesToScaleFeet(this.trackService.selectedScale, e.radius), degreesToRadians(e.sweep));
        this.updateTrack(newTrack);
    }
  }

  updateCrossingTrack(e: any) {
    console.log('updateCrossingTrack', e);
    if (e.length > 0 && e.angle > 0) {
        const newTrack = Track.crossing(inchesToScaleFeet(this.trackService.selectedScale, e.length), degreesToRadians(e.angle));
        this.updateTrack(newTrack);
    }
  }

  updateTurnoutTrack(e: any) {
    console.log('updateTurnoutTrack', e);
    if (e.length > 0 && e.radius > 0) {
        const newTrack = Track.turnout(
            inchesToScaleFeet(this.trackService.selectedScale, e.length),
            inchesToScaleFeet(this.trackService.selectedScale, e.radius),
            degreesToRadians(e.sweep),
            inchesToScaleFeet(this.trackService.selectedScale, e.lead || 0),
            e.direction === 'left');
        this.updateTrack(newTrack);
    }
  }

  handleMenu(mi: string) {
    console.log('handleMenu', mi);
    switch (mi) {
    case 'new-library':
        break;
    case 'open-library':
        break;
    case 'save-library':
        this.saveLibrary();
        break;
    }
  }

}
