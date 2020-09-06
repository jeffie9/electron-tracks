import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Track, TrackType, HALF_SCALE_WIDTH, SCALE_WIDTH } from '../track';
import { TrackService, inchesToScaleFeet, scaleFeetToInches, degreesToRadians, radiansToDegrees } from '../track.service';
import { angleBetweenPoints, distance, intersection } from '../geometry';
import { MatTabGroup } from '@angular/material/tabs';
import { Matrix } from '../matrix';

const MM_PER_IN = 25.400051;

@Component({
    selector: 'app-track-editor',
    templateUrl: './track-editor.component.html',
    styleUrls: ['./track-editor.component.css']
})
export class TrackEditorComponent implements OnInit {
    @ViewChild('canvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;
    @ViewChild(MatTabGroup) tabGroup: MatTabGroup;
    private canvasContext: CanvasRenderingContext2D;
    private subscriptions: Subscription[] = [];
    scale = 4.5;
    track: Track;
    trackForm = this.fb.group({
        trackType: [0],
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
    trackType = this.trackForm.get('trackType');
    trackTypeFormGroupNames = new Map([
        [TrackType.Straight, ['straight']],
        [TrackType.Curve, ['curve']],
        [TrackType.LeftTurnout, ['turnout']],
        [TrackType.RightTurnout, ['turnout']],
        [TrackType.Crossing, ['crossing']],
    ]);

    constructor(
        private fb: FormBuilder,
        private trackService: TrackService) { }

    ngOnInit() {
        this.subscriptions.push(this.trackForm.valueChanges.subscribe(e => this.onChangeTrackForm(e)));
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

        // this.track = Track.straightTrack(50);
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

    onChangeTrackForm(event) {
        console.log(event);
        switch (this.trackType.value) {
            case 0: // straight
                // this.updateTrack(Track.straightTrack(inchesToScaleFeet(this.trackService.selectedScale, this.trackForm.get('straight').get('length').value)));
                break;
            case 1: // curve
            case 2: // turnout
            case 3: // crossing
            case 4: // wye
        }
    }

    drawTrack() {
        this.canvasContext.clearRect(-this.canvas.nativeElement.width / 2, -this.canvas.nativeElement.height / 2, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
        if (this.track) {
            this.canvasContext.strokeStyle = 'blue';
            this.canvasContext.stroke(this.track.outline);
            // temporary markers
            if (this.track.type === TrackType.WyeTurnout) {
                let R1 = this.track.paths[0].curveOutlinePoints();
                let R2 = this.track.paths[1].curveOutlinePoints();
                let a = this.track.paths[0].r;
                let b = this.track.paths[0].r + HALF_SCALE_WIDTH;
                let theta = ((Math.PI / 2)) - Math.asin(a / b);
                let mat = new Matrix()
                    .translate(this.track.paths[0].xc, this.track.paths[0].yc)
                    .rotate(theta)
                    .translate(-this.track.paths[0].xc, -this.track.paths[0].yc);
                let I1 = mat.applyToPoint(R1[0], R1[1]);
                console.log('I', a, b, theta, I1);

                this.canvasContext.fillStyle = 'green';
                this.canvasContext.beginPath();
                this.canvasContext.ellipse(I1[0], I1[1], 2, 2, 0, 0, 2 * Math.PI);
                this.canvasContext.fill();
                this.canvasContext.fillStyle = 'red';
                this.canvasContext.beginPath();
                this.canvasContext.ellipse(R1[6], R1[7], 2, 2, 0, 0, 2 * Math.PI);
                this.canvasContext.fill();
                this.canvasContext.fillStyle = 'magenta';
                this.canvasContext.beginPath();
                this.canvasContext.ellipse(R1[2], R1[3], 2, 2, 0, 0, 2 * Math.PI);
                this.canvasContext.fill();
                // this.canvasContext.fillStyle = 'black';
                // this.canvasContext.beginPath();
                // this.canvasContext.ellipse(0, 0, 2, 2, 0, 0, 2 * Math.PI);
                // this.canvasContext.fill();
            }

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
        }, { emitEvent: false });
        const fg = this.trackForm.get(this.trackTypeFormGroupNames.get(this.track.type)) as FormGroup;
        console.log(this.trackTypeFormGroupNames.get(this.track.type), fg);
        const paths = this.track.paths;
        switch (this.track.type) {
            case 'straight':
                this.tabGroup.selectedIndex = 0;
                fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
                    Math.abs(paths[0].x2 - paths[0].x1)), { emitEvent: false });
                break;
            case 'curve':
                this.tabGroup.selectedIndex = 1;
                fg.get('radius').setValue(scaleFeetToInches(this.trackService.selectedScale, paths[0].r), { emitEvent: false });
                fg.get('sweep').setValue(radiansToDegrees(paths[0].calcSweep()), { emitEvent: false });
                break;
            case 'left-turnout':
            case 'right-turnout':
                this.tabGroup.selectedIndex = 2;
                fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
                    Math.abs(paths[0].x2 - paths[0].x1)), { emitEvent: false });
                fg.get('radius').setValue(scaleFeetToInches(this.trackService.selectedScale, paths[1].r), { emitEvent: false });
                fg.get('sweep').setValue(radiansToDegrees(paths[1].calcSweep()), { emitEvent: false });
                if (this.track.paths[0].y1 === this.track.paths[1].y1) {
                    fg.get('direction').setValue('right');
                    fg.get('lead').setValue(scaleFeetToInches(this.trackService.selectedScale, this.track.paths[0].x2 - this.track.paths[1].x2));
                } else {
                    fg.get('direction').setValue('left');
                    fg.get('lead').setValue(scaleFeetToInches(this.trackService.selectedScale, this.track.paths[1].x1 - this.track.paths[0].x1));
                }
                break;
            case 'crossing':
                this.tabGroup.selectedIndex = 3;
                fg.get('length').setValue(scaleFeetToInches(this.trackService.selectedScale,
                    distance(paths[0].x1, paths[0].y1, paths[0].x2, paths[0].y2)), { emitEvent: false });
                fg.get('angle').setValue(radiansToDegrees(
                    angleBetweenPoints(0, 0, paths[0].x2, paths[0].y2, paths[1].x2, paths[1].y2)), { emitEvent: false });
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
