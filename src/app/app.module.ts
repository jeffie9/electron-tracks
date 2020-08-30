import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

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
    MatSidenavModule,
    MatListModule,
    MatButtonToggleModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
