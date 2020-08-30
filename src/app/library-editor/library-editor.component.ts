import { Component, OnInit } from '@angular/core';
import { TrackService } from '../track.service';
import { Track } from '../track';

@Component({
    selector: 'app-library-editor',
    templateUrl: './library-editor.component.html',
    styleUrls: ['./library-editor.component.css']
})
export class LibraryEditorComponent implements OnInit {
    tracks: Track[];

    constructor(
        private trackService: TrackService) { }

    ngOnInit() {
        this.tracks = this.trackService.getTrackLibrary();
    }

}
