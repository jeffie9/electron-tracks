import { Matrix } from './matrix';

describe('Matrix', () => {

    it('creates', () => {
        let m = new Matrix();
        expect(m.a).toBe(1);
        expect(m.b).toBe(0);
        expect(m.c).toBe(0);
        expect(m.d).toBe(1);
        expect(m.e).toBe(0);
        expect(m.f).toBe(0);
    });

    it('translates', () => {
        let m = new Matrix().translate(12, 13);
        let p = m.applyToPoint(0, 0);
        expect(p).toEqual([12, 13]);
    });

    it('scales', () => {
        let m = new Matrix().scale(2, 3);
        let p = m.applyToPoint(1, 1);
        expect(p).toEqual([2, 3]);
    });

    it('rotates', () => {
        let a = Math.atan2(4, 3) - Math.atan2(3, 4);
        let m = new Matrix().rotate(a);
        let p = m.applyToPoint(4, 3);
        expect(p).toEqual([3, 4]);
    });

    it('chains operations', () => {
        let a = Math.atan2(12, 5) - Math.atan2(5, 12);
        let m = new Matrix()
            .translate(2, 12)  // 7, 24
            .rotate(a)         // 5, 12
            .translate(3, 4);  // 12, 5
        let p = m.applyToPoint(9, 1);
        expect(p[0]).toBeCloseTo(7);
        expect(p[1]).toBeCloseTo(24);
    });

});