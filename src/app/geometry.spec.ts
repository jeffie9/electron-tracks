import { dist, closestPoints } from './geometry';

describe('geometry', () => {
    it('finds distance', () => {
        let d = dist(3, 0, 0, 4);
        expect(d).toBe(5);
    });

    it('finds closest point', () => {
        let a = [15, 10, 25, 3];
        let b = [24, 4, 1, 2];
        let cp = closestPoints(a, b);

        expect(cp).toEqual([2, 0, 1.4142135623730951]);
    });
});