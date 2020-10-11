import { TrackRef } from '../track';

export interface HasTools {
    tracks: TrackRef[];
    drawGlass(offsetX: number, offsetY: number, angle: number, corX: number, corY: number);
    getTrackAtPoint(x: number, y: number): TrackRef;
}

export interface LayoutTool {
    mouseDown(e: MouseEvent);
    mouseMove(e: MouseEvent);
    mouseUp(e: MouseEvent): number[];
}

abstract class BaseTool {
    protected startX: number;
    protected startY: number;
    protected dragging: boolean;
    constructor(
        protected tooled: HasTools) {}
}

export class PointerTool extends BaseTool implements LayoutTool {

    mouseDown(e: MouseEvent) {
        const trackAtPoint = this.tooled.getTrackAtPoint(e.offsetX, e.offsetY);
        console.log('trackAtPoint', trackAtPoint);

        if (e.shiftKey) {
            if (!!trackAtPoint) {
                trackAtPoint.selected = !trackAtPoint.selected;
            } // else noop
        } else {
            if (!!trackAtPoint) {
                trackAtPoint.selected = true;
    
                // save the current mouse position
                this.startX = e.offsetX;
                this.startY = e.offsetY;
    
                // this.tooled.drawGlass(0, 0, 0);
            } else {
                // deselect everything
                this.tooled.tracks.filter(tr => tr.selected)
                    .forEach(t => t.selected = false);
                // TODO start rectangle select
            }
        }    
    }

    mouseMove(e: MouseEvent) {
    }

    mouseUp(e: MouseEvent): number[] {
        return undefined;
    }

}

export class MoveTool extends BaseTool implements LayoutTool {
    mouseDown(e: MouseEvent) {
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.dragging = true;
        this.tooled.drawGlass(0, 0, 0, 0, 0);
    }

    mouseMove(e: MouseEvent) {
        if (e.buttons === 1) {
            this.tooled.drawGlass(e.offsetX - this.startX, e.offsetY - this.startY, 0, 0, 0);
        }
    }

    mouseUp(e: MouseEvent): number[] {
        if (this.dragging) {
            this.dragging = false;
            let dx = e.offsetX - this.startX;
            let dy = e.offsetY - this.startY;
            return [dx, dy];
        }
    }
}

export class RotateTool extends BaseTool implements LayoutTool {
    corX: number;
    corY: number;
    startA: number;

    mouseDown(e: MouseEvent) {
        this.startX = e.offsetX;
        this.startY = e.offsetY;
        this.dragging = true;
        let count = 0;
        this.corX = 0;
        this.corY = 0;
        this.tooled.tracks.filter(tr => tr.selected)
            .forEach(t => {
                this.corX += t.xc;
                this.corY += t.yc;
                count++;
            });
        this.corX /= count;
        this.corY /= count;
        this.startA = Math.atan2(e.offsetY - this.corY, e.offsetX - this.corX);
        console.log('COR', this.corX, this.corY, this.startA);
    }
    
    mouseMove(e: MouseEvent) {
        if (e.buttons === 1) {
            let a = Math.atan2(e.offsetY - this.corY, e.offsetX - this.corX) - this.startA;
            if (a > 2 * Math.PI) {
                a -= 2 * Math.PI;
            } else if (a < 0) {
                a += 2 * Math.PI;
            }
            this.tooled.drawGlass(0, 0, a, this.corX, this.corY);
        }
    }
    
    mouseUp(e: MouseEvent): number[] {
        if (this.dragging) {
            this.dragging = false;
            let a = Math.atan2(e.offsetY - this.corY, e.offsetX - this.corX) - this.startA;
            return [a, this.corX, this.corY];
        }
    }

}
