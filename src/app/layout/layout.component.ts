import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, TemplateRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Track, TrackRef } from '../track';
import { TrackService } from '../track.service';
import { Matrix } from '../matrix';
import { Layout } from '../layout';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit {
  @ViewChild('wrapper', { static: true }) wrapper !: ElementRef;
  @ViewChild('canvas', { static: true }) canvas !: ElementRef<HTMLCanvasElement>;
  @ViewChild('glass', { static: true }) glass !: ElementRef<HTMLCanvasElement>;
  @ViewChild('createLayoutModal', { static: true }) createLayoutModal: TemplateRef<any>;
  @ViewChild('openLayoutModal', { static: true }) openLayoutModal: TemplateRef<any>;
  @ViewChild(MatButtonToggleGroup) toolButtonGroup : MatButtonToggleGroup;
  private canvasContext: CanvasRenderingContext2D;
  private glassContext: CanvasRenderingContext2D;
  private trackLibrarySelected: Subscription;
  private menuItemSelected: Subscription;
  layoutLength = 1;
  layoutWidth = 1;
  startX: number;
  startY: number;
  dragging = false;
  corX: number;
  corY: number;
  startA: number;
  formOpen = false;
  tracks = new Array<TrackRef>();
  layout: Layout;
  layouts: Layout[];
  createForm = this.fb.group({
      name: [''],
      scale: [''],
      length: [''],
      width: ['']
  });
  openForm = this.fb.group({
      layoutId: ['']
  });

  constructor(
    private trackService: TrackService,
    private fb: FormBuilder) { }

  ngOnInit() {
    this.trackLibrarySelected = this.trackService.trackSelected$
      .subscribe(track => this.addNewTrack(track));
    this.menuItemSelected = this.trackService.menuSelected$
      .subscribe(mi => this.handleMenu(mi));
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit', this.wrapper, this.canvas, this.glass);
    this.canvasContext = this.canvas.nativeElement.getContext('2d');
    this.glassContext = this.glass.nativeElement.getContext('2d');
    
    // hack around ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      let rect = this.canvas.nativeElement.getBoundingClientRect() as DOMRect;
      let canvasY = rect.y + window.scrollY;
      this.layoutWidth = window.innerHeight - canvasY - 2;
      this.layoutLength = this.wrapper.nativeElement.offsetWidth;
    });
}

ngOnDestroy() {
  this.trackLibrarySelected.unsubscribe();
  this.menuItemSelected.unsubscribe();
}

drawCanvas() {
    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    this.canvasContext.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    this.tracks
        .filter(tr => !tr.selected || !this.dragging)
        .forEach(tr => {
            this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
            this.canvasContext.translate(tr.xc, tr.yc);
            this.canvasContext.rotate(tr.rot);
            if (tr.selected) {
                this.canvasContext.strokeStyle = 'blue';
                this.canvasContext.lineWidth = 2;
            } else {
              this.canvasContext.strokeStyle = 'black';
              this.canvasContext.lineWidth = 1;
            }
            this.canvasContext.stroke(tr.track.outline);
        });
}

drawGlass(offsetX: number, offsetY: number, angle: number) {
    this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
    this.glassContext.clearRect(0, 0, this.glass.nativeElement.width, this.glass.nativeElement.height);
    this.tracks.filter(tr => tr.selected)
    .forEach(tr => {
        this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
        if (angle !== 0) {
          this.glassContext.translate(this.corX, this.corY);
          this.glassContext.rotate(angle);
          this.glassContext.translate(-this.corX, -this.corY);
        }
        this.glassContext.translate(tr.xc + offsetX, tr.yc + offsetY);
        this.glassContext.rotate(tr.rot);
        this.glassContext.strokeStyle = 'blue';
        this.glassContext.lineWidth = 2;
        this.glassContext.stroke(tr.track.outline);
    });
}

  mouseDown(e: MouseEvent) {
    console.log('mouseDown', e);
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();
    
    const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

    // get the current mouse position
    let mx = e.clientX - rect.left;
    let my = e.clientY - rect.top;

    console.log('mouse down', mx, my);

    this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    let trackAtPoint = this.tracks.find(tr => {
        // translate the mouse point into Track coordinates
        let px = mx - tr.xc;
        let py = my - tr.yc;
        let c = Math.cos(-tr.rot);
        let s = Math.sin(-tr.rot);
        let nx = c * px - s * py;
        let ny = s * px + c * py;
        console.log('point in path', nx, ny, this.canvasContext.isPointInPath(tr.track.outline, nx, ny));
        return this.canvasContext.isPointInPath(tr.track.outline, nx, ny);
    });

    if (e.shiftKey) {
        if (!!trackAtPoint) {
            trackAtPoint.selected = !trackAtPoint.selected;
        } // else noop
    } else {
        if (trackAtPoint) {
            trackAtPoint.selected = true;

            // save the current mouse position
            this.startX = mx;
            this.startY = my;
            this.dragging = true;

            this.drawCanvas();
            this.drawGlass(0, 0, 0);
        } else if (this.toolButtonGroup.value === 'rotate') {
          this.startX = mx;
          this.startY = my;
          this.dragging = true;
          let count = 0;
          this.corX = 0;
          this.corY = 0;
          this.tracks.filter(tr => tr.selected)
              .forEach(t => {
                  this.corX += t.xc;
                  this.corY += t.yc;
                  count++;
              });
          this.corX /= count;
          this.corY /= count;
          this.startA = Math.atan2(my - this.corY, mx - this.corX);
        } else {
            // deselect everything
            this.tracks.filter(tr => tr.selected)
                .forEach(t => t.selected = false);
            // TODO start rectangle select
        }
    }
    this.drawCanvas();
}

  mouseMove(e: MouseEvent) {
      if (e.buttons === 1) {
        console.log('mouseMove', this.toolButtonGroup.value);
        // tell the browser we're handling this mouse event
          e.preventDefault();
          e.stopPropagation();

          const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

          // get the current mouse position
          let mx = e.clientX - rect.left;
          let my = e.clientY - rect.top;
          if (this.toolButtonGroup.value === 'move') {
              this.drawGlass(mx - this.startX, my - this.startY, 0);
          } else if (this.toolButtonGroup.value === 'rotate') {
              let a = Math.atan2(my - this.corY, mx - this.corX) - this.startA;
              if (a > 2 * Math.PI) {
                  a -= 2 * Math.PI;
              } else if (a < 0) {
                  a += 2 * Math.PI;
              }
              this.drawGlass(0, 0, a);
          }
      }
  }

mouseUp(e: MouseEvent) {
    console.log('mouseUp', this.toolButtonGroup.value, e);
    if (this.dragging) {
        // tell the browser we're handling this mouse event
        e.preventDefault();
        e.stopPropagation();

        const rect = this.glass.nativeElement.getBoundingClientRect() as DOMRect;

        // get the current mouse position
        let mx = e.clientX - rect.left;
        let my = e.clientY - rect.top;
        
        // move the tracks before finding the closest pair
        let selectedTracks = this.tracks.filter(tr => tr.selected);
        if (this.toolButtonGroup.value === 'move') {
          selectedTracks.forEach(tr => {
              tr.xc += mx - this.startX;
              tr.yc += my - this.startY;
          });
        } else if (this.toolButtonGroup.value === 'rotate') {
            let a = Math.atan2(my - this.corY, mx - this.corX) - this.startA;
            let mat = new Matrix()
                .translate(this.corX, this.corY)
                .rotate(a)
                .translate(-this.corX, -this.corY);
            selectedTracks.forEach(tr => {
                [tr.xc, tr.yc] = mat.applyToPoint(tr.xc, tr.yc);
                tr.rot += a;
            });
        }

        let unselectedTracks = this.tracks.filter(tr => !tr.selected);

        let pair = TrackRef.findClosestPair(selectedTracks, unselectedTracks);

        if (pair) {
          let diff = pair[0].snapTo(pair[1]);
          if (diff) {
              console.log('snap', diff, pair);
              
              let matF = new Matrix()
                  .translate(diff.dx, diff.dy)
                  .translate(diff.x, diff.y)
                  .rotate(diff.da)
                  .translate(-diff.x, -diff.y);

              selectedTracks.forEach(tr => {
                  [tr.xc, tr.yc] = matF.applyToPoint(tr.xc, tr.yc);
                  tr.rot += diff.da;
              });
          }
        }

        // clear all the dragging flags
        this.dragging = false;
        this.glassContext.setTransform(1, 0, 0, 1, 0, 0);
        this.glassContext.clearRect(0, 0, this.glass.nativeElement.width, this.glass.nativeElement.height);
        
        this.drawCanvas();

    }
}

  @HostListener('document:keydown', ['$event'])
  keyDown(e: KeyboardEvent) {
      if (!this.formOpen) {
          console.log('keyDown', e);
          e.preventDefault();
          e.stopPropagation();
          switch (e.code) {
          case 'Delete':
              this.tracks = this.tracks.filter(tr => !tr.selected);
              this.drawCanvas();
              break;
          case 'KeyM':
            this.toolButtonGroup.value = 'move';
              break;
          case 'KeyR':
            this.toolButtonGroup.value = 'rotate';
              break;
          case 'Space':
            this.toolButtonGroup.value = 'pointer';
              break;
          }
      }
  }

  addNewTrack(t: Track) {
      let tr = new TrackRef(t, 50, 50, 0);
      //tr.selected = true;
      this.tracks.push(tr);
      this.drawCanvas();
  }

  createLayout() {
      this.formOpen = true;
      // this.modalService.open(this.createLayoutModal).result.then(result => {
      //     console.log('createLayout', this.createForm.value);
      //     // using feet for now
      //     this.layoutLength = this.createForm.value.length * this.trackService.selectedScale.ratio;
      //     this.layoutWidth = this.createForm.value.width * this.trackService.selectedScale.ratio;
      //     this.tracks = new Array<TrackRef>();
      //     this.layout = new Layout();
      //     this.layout.name = this.createForm.value.name;
      //     this.layout.length = this.createForm.value.length * this.trackService.selectedScale.ratio;
      //     this.layout.width = this.createForm.value.width * this.trackService.selectedScale.ratio;
      //     this.layout.trackRefs = this.tracks;
      //     this.formOpen = false;
      // });
  }

  loadLayout() {
      this.trackService.getLayouts()
      .subscribe(list => {
          this.layouts = list;
          this.formOpen = true;
          // this.modalService.open(this.openLayoutModal).result.then(dlgRes => {
          //     this.formOpen = false;
          //     if (dlgRes === 'Open click') {
          //         this.trackService.loadLayoutFromDatabase(this.openForm.value.layoutId)
          //         .subscribe(res => {
          //             this.layout = res;
          //             this.tracks = res.trackRefs;
          //             this.layoutLength = res.length;
          //             this.layoutWidth = res.width;
          //             setTimeout(() => this.drawCanvas());
          //         });
          //     }
          // });
      });
  }

  saveLayout() {
      this.trackService.saveLayoutToDatabase(this.layout);
  }

  handleMenu(mi: string) {
      console.log('handleMenu', mi);
      switch (mi) {
      case 'new-layout':
          this.createLayout();
          break;
      case 'open-layout':
          this.loadLayout();
          break;
      case 'save-layout':
          this.saveLayout();
          break;
      }
  }

}
