import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { ColorPickerModule } from 'ngx-color-picker';
import { LoginComponent } from './modal/login/login.component';
import { InitModal } from './modal/init/init.modal';
import { MaterialModal } from './modal/material/material.modal';
import { AuthService } from './provider/auth.service';
import { FileService } from './provider/file.service';
import { PatternfinderService } from './provider/patternfinder.service';
import { VaeService } from './provider/vae.service';
import { SignupComponent } from './ui/signup/signup.component';
import { UploadFormComponent } from './ui/uploads/upload-form/upload-form.component';
import { UploadService } from './provider/upload.service';
import { BlankdraftModal } from './modal/blankdraft/blankdraft.modal';
import { ExamplesComponent } from './modal/examples/examples.component';
import { LoadfileComponent } from './modal/loadfile/loadfile.component';
import { FilebrowserComponent } from './ui/filebrowser/filebrowser.component';
import { EventsDirective } from './events.directive';
import { WelcomeComponent } from './modal/welcome/welcome.component';
import { RenderService } from './provider/render.service';
import { DraftRenderingComponent } from './ui/draft-rendering/draft-rendering.component';
import { SelectionComponent } from './ui/draft-rendering/selection/selection.component';
import { ViewerService } from './provider/viewer.service';
import { ViewadjustService } from './provider/viewadjust.service';
import { ViewadjustComponent } from './viewadjust/viewadjust.component';
import { ImageeditorComponent } from './modal/imageeditor/imageeditor.component';
import { MediaService } from './provider/media.service';
import { OperationService } from './provider/operation.service';



@NgModule(
    { declarations: [
        UploadFormComponent,
        InitModal,
        MaterialModal,
        LoginComponent,
        SignupComponent,
        BlankdraftModal,
        ExamplesComponent,
        LoadfileComponent,
        FilebrowserComponent,
        ImageeditorComponent,
        EventsDirective,
        WelcomeComponent,
        SelectionComponent,
        DraftRenderingComponent
    ],
    exports: [
        CommonModule,
        FormsModule,
        BrowserModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatRadioModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        MatTreeModule,
        ColorPickerModule,
        MatProgressBarModule,
        MatChipsModule,
        MatSnackBarModule,
        ScrollingModule,
        MatBadgeModule,
        DragDropModule,
        UploadFormComponent,
        InitModal,
        MaterialModal,
        FilebrowserComponent,
        ExamplesComponent,
        EventsDirective,
        DraftRenderingComponent,
        SelectionComponent,
        ViewadjustComponent
    ], imports: [CommonModule,
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatSlideToggleModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatRadioModule,
        MatSelectModule,
        MatSidenavModule,
        MatSliderModule,
        MatTabsModule,
        MatToolbarModule,
        MatTooltipModule,
        MatTreeModule,
        ColorPickerModule,
        MatChipsModule,
        MatSnackBarModule,
        ScrollingModule,
        DragDropModule,
        MatProgressBarModule,
        MatBadgeModule,
        ViewadjustComponent], providers: [
        UploadService,
        FileService,
        VaeService,
        PatternfinderService,
        AuthService,
        RenderService,
        ViewerService,
        ViewadjustService,
        MediaService,
        OperationService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class CoreModule { }