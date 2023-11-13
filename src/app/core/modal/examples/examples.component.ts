import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { getAnalytics, logEvent } from "@angular/fire/analytics";
import { AuthService } from '../../provider/auth.service';
import { FileService } from '../../provider/file.service';
import { ExampleserviceService } from '../../provider/exampleservice.service';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss']
})
export class ExamplesComponent {
  @Output() onLoadExample = new EventEmitter <any>(); 
  local_examples: any;

  constructor(
    private fls: FileService,
    private auth: AuthService,
    private http: HttpClient,
    public examples: ExampleserviceService) {
      
      this.local_examples = examples.getExamples();
  }

  loadExample(filename: string){
    
    this.onLoadExample.emit(filename);

  }

}

