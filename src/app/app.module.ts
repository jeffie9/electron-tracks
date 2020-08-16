import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LibraryComponent } from './library/library.component';
import { LibraryEditorComponent } from './library-editor/library-editor.component';
import { LayoutComponent } from './layout/layout.component';
import { TrackEditorComponent } from './track-editor/track-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    LibraryComponent,
    LibraryEditorComponent,
    LayoutComponent,
    TrackEditorComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
