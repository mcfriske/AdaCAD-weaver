import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { LoginComponent } from '../login/login.component';
import { AboutModal } from '../modal/about/about.modal';
import { AuthService } from '../provider/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})



export class TopbarComponent implements OnInit {
  
  // @Output() onSave: any = new EventEmitter();
  // @Output() onUndo: any = new EventEmitter();
  // @Output() onRedo: any = new EventEmitter();
  // @Output() onAboutCreate: any = new EventEmitter();
  

  @Input() drawer;
  // @Input() version;
  // @Input() filename;
  // @Input() timeline;
  // @Input() undoItem;
  // @Input() redoItem;
  // @Input() draftelement;
  // @Input() loomtypes;
  // @Input() density_units;
  // @Input() source; 

  collapsed: boolean = false;

  constructor(private dialog: MatDialog, public auth: AuthService) { }

  ngOnInit(){
  }

  ngAfterViewInit() {

  }




  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutModal);

  }
  openLoginDialog() {
      const dialogRef = this.dialog.open(LoginComponent, {
        width: '600px',
      });
  }

  //need to handle this and load the file somehow
  // openNewFileDialog() {


  //   const dialogRef = this.dialog.open(InitModal, {
  //     data: {loomtypes: this.loomtypes, density_units: this.density_units, source: this.source}
  //   });

  //   dialogRef.afterClosed().subscribe(loadResponse => {
  //     if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);

  //  });



  // }

  logout(){
    this.auth.logout();
  }

  // clear(){
  // 	this.onClearScreen.emit();
  // }

}
