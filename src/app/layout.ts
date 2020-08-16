import { Track, TrackRef } from './track';

export class Layout {
    public id: string;
    public name: string;
    public length: number;
    public width: number;
    public tracks: Track[];
    public trackRefs: TrackRef[];
}