import { Component, OnInit } from '@angular/core';

import { TrackService } from '../track.service';
import { Track } from '../track';

@Component({
  selector: 'app-library',
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  tracks: Track[];

  constructor(
      private trackService: TrackService) { }

  ngOnInit() {
      this.tracks = this.trackService.getTrackLibrary();
  }

  select(t: Track) {
      console.log('select', t);
      this.trackService.selectTrack(t);
  }

}
