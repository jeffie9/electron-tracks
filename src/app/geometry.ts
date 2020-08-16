export function dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

export function closestPoints(a: number[], b: number[]): number[] {
    let ai: number, bi: number, minDist = Number.MAX_VALUE;

    for (let i = 0; i < a.length; i += 2) {
        for (let j = 0; j < b.length; j += 2) {
            let d = dist(a[i], a[i+1], b[j], b[j+1]);
            if (d < minDist) {
                minDist = d;
                ai = i;
                bi = j;
            }
        }
    }

    return [ai, bi, minDist];
}

export function angleBetweenPoints(
        xc: number, yc: number,
        x1: number, y1: number,
        x2: number, y2: number,
        normalize = false): number {
    let a = Math.abs(Math.atan2(y1 - yc, x1 - xc) - Math.atan2(y2 - yc, x2 - xc));
    if (normalize) {
        console.log('normalizing a', a);
        while (a > Math.PI) {
            a -= Math.PI;
        }
        while (a < 0) {
           a += Math.PI;
        }
    }
    return a;
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}
