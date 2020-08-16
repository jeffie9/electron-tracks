// good parts copied from https://github.com/deoxxa/transformation-matrix-js/blob/master/src/matrix.js

export class Matrix {
    constructor(
        public a = 1,
        public b = 0,
        public c = 0,
        public d = 1,
        public e = 0,
        public f = 0
    ) {}

    transform(a2: number, b2: number, c2: number, d2: number, e2: number, f2: number): Matrix {
        let a1 = this.a,
            b1 = this.b,
            c1 = this.c,
            d1 = this.d,
            e1 = this.e,
            f1 = this.f;
        this.a = a1 * a2 + c1 * b2;
	    this.b = b1 * a2 + d1 * b2;
		this.c = a1 * c2 + c1 * d2;
		this.d = b1 * c2 + d1 * d2;
		this.e = a1 * e2 + c1 * f2 + e1;
        this.f = b1 * e2 + d1 * f2 + f1;
        return this;
    }

    translate(tx: number, ty: number): Matrix {
		return this.transform(1, 0, 0, 1, tx, ty);
    }
    
    scale(sx: number, sy: number): Matrix {
		return this.transform(sx, 0, 0, sy, 0, 0);
    }

    rotate(angle: number): Matrix {
		var cos = Math.cos(angle),
			sin = Math.sin(angle);
		return this.transform(cos, sin, -sin, cos, 0, 0);
    }

    rotateFromVector(x: number, y: number): Matrix {
		return this.rotate(Math.atan2(y, x));
    }

    rotateDeg(angle: number): Matrix {
		return this.rotate(angle * Math.PI / 180);
    }

    applyToPoint(x: number, y: number): number[] {
		return [
			x * this.a + y * this.c + this.e,
			x * this.b + y * this.d + this.f
        ];
    }
    
    applyToArray(points: number[]): number[] {
        let i = 0,
            p: number[],
			mxPoints = [];

        while(i < points.length) {
            p = this.applyToPoint(points[i++], points[i++]);
            mxPoints.push(p[0], p[1]);
        }

		return mxPoints;
    }
    
    applyToContext(context: CanvasRenderingContext2D) {
		context.setTransform(this.a, this.b, this.c, this.d, this.e, this.f);
	}
}