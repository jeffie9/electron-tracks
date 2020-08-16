import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { LibraryEditorComponent } from './library-editor/library-editor.component';
import { TrackEditorComponent } from './track-editor/track-editor.component';


const routes: Routes = [
  { path: '', redirectTo: '/layout', pathMatch: 'full' },
  { path: 'layout', component: LayoutComponent },
  { path: 'library', component: LibraryEditorComponent },
  { path: 'track', component: TrackEditorComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
