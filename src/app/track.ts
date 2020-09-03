import { closestPoints, angleBetweenPoints, intersection } from './geometry';
import { Matrix } from './matrix';

// prototype tie spacing ~ 19-21 inches
// prototype tie length ~ 8-8.5 feet
// standard rail width
export const SCALE_WIDTH = 4.708333;
export const HALF_SCALE_WIDTH = 2.354166;

export enum TrackType {
    Straight = 'straight',
    Curve = 'curve',
    Crossing = 'crossing',
    LeftTurnout = 'left-turnout',
    RightTurnout = 'right-turnout',
    WyeTurnout = 'wye-turnout',
    LeftCurvedTurnout = 'left-curved-turnout',
    RightCurvedTurnout = 'right-curved-turnout',
}

export class TrackPath {
    constructor(
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public xc?: number,
        public yc?: number,
        public r?: number,
        public len?: number,
        public sweep?: number) {}

    static straightPath(length: number): TrackPath {
        let halfLength = length / 2;
        return new TrackPath(-halfLength, 0, halfLength, 0, undefined, undefined, undefined, length);
    }

    static curvePath(radius: number, sweep: number): TrackPath {
        // half the angle rotated to human north
        let a = (sweep + Math.PI) / 2;
        let xc = 0;
        let yc = radius;
        let dx = Math.cos(a);
        let dy = Math.sin(a);
        let x1 = xc - dx * radius;
        let y1 = yc - dy * radius;
        return new TrackPath(-x1, y1, x1, y1, xc, yc, radius, undefined, sweep);
    }

    calcAngleAtPoint(x: number, y: number): number {
        let a: number;
        if (this.r && this.r > 0) {
            // a curved path
            a = Math.atan2(y - this.yc, x - this.xc);
            if (x === this.x1 && y === this.y1) {
                a += Math.PI / 2;
            } else {
                a -= Math.PI / 2;
            }
        } else {
            // a straight path
            if (x === this.x1 && y === this.y1) {
                a = Math.atan2(this.y2 - this.y1, this.x2 - this.x1);
            } else {
                a = Math.atan2(this.y1 - this.y2, this.x1 - this.x2);
            }
        }
        return a;
    }

    /**
     * Return a new TrackPath with given (abbreviated) transformation
     * @param cos 
     * @param sin 
     * @param x 
     * @param y 
     */
    transform(mat: Matrix): TrackPath {
        let trx = mat.applyToArray([this.x1, this.y1, this.x2, this.y2, this.xc, this.yc]);
        return new TrackPath(trx[0], trx[1], trx[2], trx[3], trx[4], trx[5], this.r, this.len, this.sweep);
    }

    rotate(a: number) {
        [this.x1, this.y1, this.x2, this.y2, this.xc, this.yc] = 
            new Matrix()
                .rotate(a)
                .applyToArray([this.x1, this.y1, this.x2, this.y2, this.xc, this.yc]);
    }

    translate(x: number, y: number) {
        [this.x1, this.y1, this.x2, this.y2, this.xc, this.yc] = 
            new Matrix()
                .translate(x, y)
                .applyToArray([this.x1, this.y1, this.x2, this.y2, this.xc, this.yc]);
    }

    calcSweep(): number {
        if (this.r && this.r > 0) {
            // a curved path
            return angleBetweenPoints(this.xc, this.yc, this.x1, this.y1, this.x2, this.y2);
        } else {
            // a straight path
            return 0;
        }
    }

    outline(): string {
        if (this.r > 0) {
            return this.curveOutline();
        } else {
            return this.straightOutline();
        }
    }

    straightOutline(): string {
        let pts = this.straightOutlinePoints();
        return `M ${pts[0]} ${pts[1]} L ${pts[2]} ${pts[3]} L ${pts[4]} ${pts[5]} L ${pts[6]} ${pts[7]} Z `;
    }

    straightOutlinePoints(): number[] {
        let x = this.x2 - this.x1;
        let y = this.y2 - this.y1;
        let length = Math.sqrt(x * x + y * y);
        let halfLength = length / 2;

        let mat = new Matrix()
            .rotateFromVector(this.x2 - this.x1, this.y2 - this.y1)
            .translate((this.x2 + this.x1) / 2, (this.y2 + this.y1) / 2);
        return mat.applyToArray([-halfLength, -HALF_SCALE_WIDTH, halfLength, -HALF_SCALE_WIDTH, halfLength, HALF_SCALE_WIDTH, -halfLength, HALF_SCALE_WIDTH]);
    }

    curveOutline(): string {
        let pts = this.curveOutlinePoints();
        return `M ${pts[0]} ${pts[1]} ` +
            `A ${this.r + HALF_SCALE_WIDTH} ${this.r + HALF_SCALE_WIDTH} 0 0 1 ${pts[2]} ${pts[3]} ` +
            `L ${pts[4]} ${pts[5]} ` +
            `A ${this.r - HALF_SCALE_WIDTH} ${this.r - HALF_SCALE_WIDTH} 0 0 0 ${pts[6]} ${pts[7]} Z `;
    }

    curveOutlinePoints(): number[] {
        let a = (angleBetweenPoints(this.xc, this.yc, this.x1, this.y1, this.x2, this.y2) + Math.PI) / 2;
        let xc = 0;
        let yc = this.r;
        let dx = Math.cos(a);
        let dy = Math.sin(a);
        let tx = xc - dx * (this.r + HALF_SCALE_WIDTH);
        let ty = yc - dy * (this.r + HALF_SCALE_WIDTH);
        let bx = xc - dx * (this.r - HALF_SCALE_WIDTH);
        let by = yc - dy * (this.r - HALF_SCALE_WIDTH);

        // points are centered on 0,0 - rotation is found by the tilt in the endpoints
        let pts = new Matrix()
            .rotateFromVector(this.x2 - this.x1, this.y2 - this.y1)
            .applyToArray([xc, yc, -tx, ty, tx, ty, bx, by, -bx, by]);
        // translate by the difference between 0,0 and the new path center
        return new Matrix()
            .translate(this.xc - pts[0], this.yc - pts[1])
            .applyToArray(pts.slice(2));
    }

}

export class Track {
    public id: number;
    public paths: TrackPath[];
    private _outline: Path2D;
    private _svg: string;
    public type: TrackType;
    public label: string;

    static fromData(data: any): Track {
        let t = new Track();
        t.id = data.id;
        t.paths = data.paths.map(e => {
            return new TrackPath(
                e.x1,
                e.y1,
                e.x2,
                e.y2,
                e.xc,
                e.yc,
                e.r,
                e.len,
                e.sweep);
        });
        // t._svg = data.outline;
        // t._outline = new Path2D(data.outline);
        t.type = data.type;
        t.label = data.label;
        return t;
    }

    static fromParts(id: number, paths: TrackPath[], outline: string, type: TrackType, label: string): Track {
        let track = new Track();
        track.id = id;
        track.paths = paths;
        // track._svg = outline;
        // track._outline = new Path2D(outline);
        track.type = type;
        track.label = label;
        return track;
    }

    public static straightTrack(length: number, label: string = ''): Track {
        let tp = TrackPath.straightPath(length);
        return Track.fromParts(0,
            [tp],
            tp.outline(),
            TrackType.Straight,
            label);
    }

    public static curveTrack(radius: number, sweep: number, label: string = ''): Track {
        let tp = TrackPath.curvePath(radius, sweep);
        return Track.fromParts(0,
            [tp],
            tp.outline(),
            TrackType.Curve,
            label);
    }

    public static crossing(length: number, angle: number, label: string = ''): Track {
        let tp1 = TrackPath.straightPath(length);
        let tp2 = TrackPath.straightPath(length);
        tp1.rotate(angle / 2);
        tp2.rotate(-angle / 2);
        return Track.fromParts(0,
            [ tp1, tp2 ],
            tp1.outline() + tp2.outline(),
            TrackType.Crossing,
            label);
    }

    public static turnout(length: number, radius: number, sweep: number, lead: number, left: boolean, label: string = ''): Track {
        let tpMain = TrackPath.straightPath(length);
        let tpCurveBranch = TrackPath.curvePath(radius, sweep);
        tpCurveBranch.rotate(sweep * (left ? -1 : 1) / 2);

        if (left) {
            tpCurveBranch.translate(tpMain.x2 - tpCurveBranch.x2 - lead, tpMain.y2 - tpCurveBranch.y2);
        } else {
            tpCurveBranch.translate(tpMain.x1 - tpCurveBranch.x1 + lead, tpMain.y1 - tpCurveBranch.y1);
        }

        return Track.fromParts(0,
            [ tpMain, tpCurveBranch ],
            tpMain.outline() + tpCurveBranch.outline(),
            left ? TrackType.LeftTurnout : TrackType.RightTurnout,
            label);
    }

    public static curveTurnout(mRadius: number, bRadius: number, sweep: number, left: boolean, label: string = ''): Track {
        let tpMain = TrackPath.curvePath(mRadius, sweep);
        let a = (Math.PI - sweep) / 2;
        let xc = Math.cos(a) * (mRadius - bRadius) + tpMain.xc;
        let yc = Math.sin(a) * (mRadius - bRadius) - tpMain.yc;
        // TODO not exact, but close enough - need to find intersection of inscribed circle circumfrence and outer circle radial
        let bSweep = angleBetweenPoints(xc, yc, tpMain.x2, tpMain.y2, tpMain.x1, tpMain.y1);
        let tpBranch = TrackPath.curvePath(bRadius, bSweep);
        let rads = (bSweep - sweep) / 2 * (left ? -1 : 1);
        tpBranch.rotate(rads);
        if (left) {
            tpBranch.translate(tpMain.x2 - tpBranch.x2, tpMain.y2 - tpBranch.y2);
        } else {
            tpBranch.translate(tpMain.x1 - tpBranch.x1, tpMain.y1 - tpBranch.y1);
        }

        return Track.fromParts(0,
            [ tpMain, tpBranch ],
            tpMain.outline() + tpBranch.outline(),
            left ? TrackType.LeftCurvedTurnout : TrackType.RightCurvedTurnout,
            label);
    }

    public static wyeTurnout(length: number, tNumber: number, label: string = ''): Track {
        let rads = Math.atan2(1, tNumber) / 2;
        let a = Math.PI / 2 - rads;
        let r = Math.abs(length / (2 * Math.cos(a)));
        let s = Math.abs(Math.PI - 2 * a);
        let tpMain = TrackPath.curvePath(r, s);
        let tpBranch = TrackPath.curvePath(r, s);
        tpMain.rotate(rads);
        tpBranch.rotate(Math.PI - rads);
        let d = (tpMain.y2 - tpBranch.y2) / 2;

        tpMain.translate(0, d);
        tpBranch.translate(0, -d);

        return Track.fromParts(0,
            [ tpMain, tpBranch ],
            tpMain.outline() + tpBranch.outline(),
            TrackType.WyeTurnout,
            label);
    }

    public toData(): any {
        return {
            id: this.id,
            paths: this.paths.map(e => {
                let t = {
                    x1: e.x1,
                    y1: e.y1,
                    x2: e.x2,
                    y2: e.y2
                };
                if (e.xc != null) t['xc'] = e.xc;
                if (e.yc != null) t['yc'] = e.yc;
                if (e.r != null) t['r'] = e.r;
                return t;
            }),
            // outline: this._svg,
            type: this.type,
            label: this.label
        };
    }

    
    public get outline() : Path2D {
        if (!this._outline) {
            this._outline = new Path2D(this.svg);
        }
        return this._outline;
    }
    
    
    public set outline(v : Path2D) {
        this._outline = v;
    }
    
    
    public get svg() : string {
        if (!this._svg) {
            switch (this.type) {
                case TrackType.Straight:
                    this._svg = this.straightOutline();
                    break;
                case TrackType.Curve:
                    this._svg = this.curveOutline();
                    break;
                case TrackType.Crossing:
                    this._svg = this.crossingOutline();
                    break;
                case TrackType.LeftTurnout:
                case TrackType.RightTurnout:
                    this._svg = this.turnoutOutline();
                    break;
                case TrackType.LeftCurvedTurnout:
                case TrackType.RightCurvedTurnout:
                    this._svg = this.curveTurnoutOutline();
                    break;
                default:
                    this._svg = this.paths[0].outline() + this.paths[1].outline();
                    break;
            }
        }
        return this._svg;
    }
    
    public set svg(v : string) {
        this._svg = v;
    }
    
    straightOutline(): string {
        let pts = this.paths[0].straightOutlinePoints();
        return `
            M ${pts[0]} ${pts[1]}
            L ${pts[2]} ${pts[3]}
            L ${pts[4]} ${pts[5]}
            L ${pts[6]} ${pts[7]}
            Z `;
    }

    curveOutline(): string {
        let pts = this.paths[0].curveOutlinePoints();
        return `
            M ${pts[0]} ${pts[1]}
            A ${this.paths[0].r + HALF_SCALE_WIDTH} ${this.paths[0].r + HALF_SCALE_WIDTH} 0 0 1 ${pts[2]} ${pts[3]}
            L ${pts[4]} ${pts[5]}
            A ${this.paths[0].r - HALF_SCALE_WIDTH} ${this.paths[0].r - HALF_SCALE_WIDTH} 0 0 0 ${pts[6]} ${pts[7]}
            Z `;
    }

    crossingOutline(): string {
        let R1 = this.paths[0].straightOutlinePoints();
        let R2 = this.paths[1].straightOutlinePoints();
        let I1 = intersection(R1[0], R1[1], R1[2], R1[3], R2[0], R2[1], R2[2], R2[3]);
        let I2 = intersection(R1[0], R1[1], R1[2], R1[3], R2[4], R2[5], R2[6], R2[7]);
        let I3 = intersection(R1[4], R1[5], R1[6], R1[7], R2[4], R2[5], R2[6], R2[7]);
        let I4 = intersection(R1[4], R1[5], R1[6], R1[7], R2[0], R2[1], R2[2], R2[3]);

        return `
            M ${R1[0]} ${R1[1]}
            L ${I1[0]} ${I1[1]}
            L ${R2[2]} ${R2[3]}
            L ${R2[4]} ${R2[5]}
            L ${I2[0]} ${I2[1]}
            L ${R1[2]} ${R1[3]}
            L ${R1[4]} ${R1[5]}
            L ${I3[0]} ${I3[1]}
            L ${R2[6]} ${R2[7]}
            L ${R2[0]} ${R2[1]}
            L ${I4[0]} ${I4[1]}
            L ${R1[6]} ${R1[7]}
            Z`;
    }

    turnoutOutline(): string {
        let R1 = this.paths[0].straightOutlinePoints();
        let R2 = this.paths[1].curveOutlinePoints();
        let R = this.paths[1].r + HALF_SCALE_WIDTH;
        let theta = (Math.PI / 2) - Math.asin((R - SCALE_WIDTH) / R);
        let dx = Math.sin(theta) * R;
        let I1: number[];

        if (this.type === TrackType.LeftTurnout) {
            I1 = [R2[4] - dx, R2[5]];
            return `
                M ${R1[0]} ${R1[1]}
                L ${R1[2]} ${R1[3]}
                L ${R1[4]} ${R1[5]}
                L ${R2[4]} ${R2[5]}
                A ${R - SCALE_WIDTH} ${R - SCALE_WIDTH} 0 0 0 ${R2[6]} ${R2[7]}
                L ${R2[0]} ${R2[1]}
                A ${R} ${R} 0 0 1 ${I1[0]} ${I1[1]}
                L ${R1[6]} ${R1[7]}
                Z`;
        } else if (this.type === TrackType.RightTurnout) {
            I1 = [R2[6] + dx, R2[7]];
            return `
                M ${R1[0]} ${R1[1]}
                L ${R1[2]} ${R1[3]}
                L ${R1[4]} ${R1[5]}
                L ${I1[0]} ${I1[1]}
                A ${R - SCALE_WIDTH} ${R - SCALE_WIDTH} 0 0 1 ${R2[2]} ${R2[3]}
                L ${R2[4]} ${R2[5]}
                A ${R} ${R} 0 0 0 ${R2[6]} ${R2[7]}
                L ${R1[6]} ${R1[7]}
                Z`;
        }
        
    }

    curveTurnoutOutline():string {
        let B1 = this.paths[0].curveOutlinePoints();
        let B2 = this.paths[1].curveOutlinePoints();
        let R1 = this.paths[0].r;
        let R2 = this.paths[1].r;
        let a = R2 + HALF_SCALE_WIDTH;
        let b = R1 - HALF_SCALE_WIDTH;
        let c = R1 - R2;
        let theta = Math.acos((b*b + c*c - a*a) / (2 * b * c));
        if (this.type === TrackType.LeftCurvedTurnout) {
            theta = -theta;
        }
        let mat = new Matrix()
            .translate(this.paths[0].xc, this.paths[0].yc)
            .rotate(theta)
            .translate(-this.paths[0].xc, -this.paths[0].yc);
        if (this.type === TrackType.LeftCurvedTurnout) {
            let I1 = mat.applyToPoint(B1[4], B1[5]);
            return `
                M ${B1[0]} ${B1[1]}
                A ${R1 + HALF_SCALE_WIDTH} ${R1 + HALF_SCALE_WIDTH} 0 0 1 ${B1[2]} ${B1[3]}
                L ${B1[4]} ${B1[5]}
                A ${R2 - HALF_SCALE_WIDTH} ${R2 - HALF_SCALE_WIDTH} 0 0 0 ${B2[6]} ${B2[7]}
                L ${B2[0]} ${B2[1]}
                A ${R2 + HALF_SCALE_WIDTH} ${R2 + HALF_SCALE_WIDTH} 0 0 1 ${I1[0]} ${I1[1]}
                A ${R1 - HALF_SCALE_WIDTH} ${R1 - HALF_SCALE_WIDTH} 0 0 0 ${B1[6]} ${B1[7]}
                Z`;
        } else if (this.type === TrackType.RightCurvedTurnout) {
            let I1 = mat.applyToPoint(B1[6], B1[7]);
            return `
                M ${B1[0]} ${B1[1]}
                A ${R1 + HALF_SCALE_WIDTH} ${R1 + HALF_SCALE_WIDTH} 0 0 1 ${B1[2]} ${B1[3]}
                L ${B1[4]} ${B1[5]}
                A ${R1 - HALF_SCALE_WIDTH} ${R1 - HALF_SCALE_WIDTH} 0 0 0 ${I1[0]} ${I1[1]}
                A ${R2 + HALF_SCALE_WIDTH} ${R2 + HALF_SCALE_WIDTH} 0 0 1 ${B2[2]} ${B2[3]}
                L ${B2[4]} ${B2[5]}
                A ${R2 - HALF_SCALE_WIDTH} ${R2 - HALF_SCALE_WIDTH} 0 0 0 ${B2[6]} ${B2[7]}
                Z`;
        }
    }
}

export class TrackRef {
    constructor (
        public track: Track,
        public xc: number,
        public yc: number,
        public rot: number) {}
    public selected = false;

    static findClosestPair(a: TrackRef[], b: TrackRef[]): TrackRef[] {
        let pairs = new Array<any>();
        a.forEach(at => {
            let matA = new Matrix().translate(at.xc,  at.yc).rotate(at.rot);
            let ptsA = at.track.paths
                .map(p => p.transform(matA))
                .map(p => [p.x1, p.y1, p.x2, p.y2])
                .reduce((acc, cur) => acc.concat(cur));

            b.forEach(bt => {
                let matB = new Matrix().translate(bt.xc,  bt.yc).rotate(bt.rot);
                let ptsB = bt.track.paths
                    .map(p => p.transform(matB))
                    .map(p => [p.x1, p.y1, p.x2, p.y2])
                    .reduce((acc, cur) => acc.concat(cur));

                let cp = closestPoints(ptsA, ptsB);
                pairs.push({
                    st: at,
                    ut: bt,
                    dist: cp[2]
                });
            });
        });

        if (pairs.length > 0) {
            // TODO need more tracks to see if this sorts correctly
            pairs.sort((a, b) => a.dist - b.dist);
            return [pairs[0].st, pairs[0].ut];
        }
    }

    public snapTo(that: TrackRef): {x: number, y: number, dx: number, dy: number, da: number} {
        let matThis = new Matrix().translate(this.xc,  this.yc).rotate(this.rot);
        let pathsThis = this.track.paths.map(p => p.transform(matThis));
        let ptsThis = pathsThis
            .map(p => [p.x1, p.y1, p.x2, p.y2])
            .reduce((acc, cur) => acc.concat(cur));

        let matThat = new Matrix().translate(that.xc,  that.yc).rotate(that.rot);
        let pathsThat = that.track.paths.map(p => p.transform(matThat));
        let ptsThat = pathsThat
            .map(p => [p.x1, p.y1, p.x2, p.y2])
            .reduce((acc, cur) => acc.concat(cur));

        let cp = closestPoints(ptsThis, ptsThat);
        if (cp[2] < 2 * SCALE_WIDTH) {
            let targetX = ptsThat[cp[1]];
            let targetY = ptsThat[cp[1]+1];
            let myX = ptsThis[cp[0]];
            let myY = ptsThis[cp[0]+1];
            let tpThis = pathsThis[Math.floor(cp[0] / 4)];
            let tpThat = pathsThat[Math.floor(cp[1] / 4)];
            let angThis = tpThis.calcAngleAtPoint(ptsThis[cp[0]], ptsThis[cp[0]+1]);
            let angThat = tpThat.calcAngleAtPoint(ptsThat[cp[1]], ptsThat[cp[1]+1]);
            return {
                x: targetX,
                y: targetY,
                dx: targetX - myX,
                dy: targetY - myY,
                da: angThat - angThis + Math.PI
            };
        }
    }

}