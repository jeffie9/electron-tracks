import { TestBed } from '@angular/core/testing';

import { TrackService, turnoutNumberToCurve } from './track.service';

describe('TrackService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TrackService = TestBed.get(TrackService);
    expect(service).toBeTruthy();
  });

  describe('turnout numbers',  () => {
    it('gets radius for number 4', () => {
        console.log('4', turnoutNumberToCurve(4));
    });

    it('gets radius for number 5', () => {
        console.log('5', turnoutNumberToCurve(5));
    });

    it('gets radius for number 6', () => {
        console.log('6', turnoutNumberToCurve(6));
    });

    it('gets radius for number 7', () => {
        console.log('7', turnoutNumberToCurve(7));
    });

    it('gets radius for number 10', () => {
        console.log('10', turnoutNumberToCurve(10));
    });
  });

});
