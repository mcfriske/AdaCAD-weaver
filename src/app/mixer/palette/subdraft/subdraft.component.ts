import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { SystemsService } from '../../../core/provider/systems.service';
import { Bounds, Draft, DraftNode, Interlacement, LoomSettings, Point } from '../../../core/model/datatypes';
import { getDraftName, isSet, isUp, warps, wefts } from '../../../core/model/drafts';
import utilInstance from '../../../core/model/util';
import { FileService } from '../../../core/provider/file.service';
import { MaterialsService } from '../../../core/provider/materials.service';
import { TreeService } from '../../../core/provider/tree.service';
import { WorkspaceService } from '../../../core/provider/workspace.service';
import { InkService } from '../../provider/ink.service';
import { LayersService } from '../../provider/layers.service';
import { MultiselectService } from '../../provider/multiselect.service';
import { ViewportService } from '../../provider/viewport.service';
import { OperationComponent } from '../operation/operation.component';
import { SendpickService } from '../../../core/provider/sendpick.service';
import { Sequence } from '../../../core/model/sequence';




interface DesignActions{
  value: string;
  viewValue: string;
  icon: string;
}

@Component({
  selector: 'app-subdraft',
  templateUrl: './subdraft.component.html',
  styleUrls: ['./subdraft.component.scss']
})



export class SubdraftComponent implements OnInit {

  @Input()  id: number; //generated by the tree service
  @Input()  default_cell: number;


  @Input()
  get scale(): number { return this._scale; }
  set scale(value: number) {
    this._scale = value;
    this.rescale().catch(e => console.log(e))
  }
  private _scale:number = 5;

  @Input()
  get draft(): Draft { return this._draft; }
  set draft(value: Draft) {
    this._draft = value;
    this.drawDraft(value);
  }

  private _draft:Draft = null;

  @Input()
  get topleft(): Point { return this._topleft; }
  set topleft(value: Point) {
    this.updateViewport(value);
    this._topleft = value;
    ;
  }

  private _topleft:Point =  {x: 0, y: 0};

  

  @Output() onSubdraftMove = new EventEmitter <any>(); 
  @Output() onSubdraftDrop = new EventEmitter <any>(); 
  @Output() onSubdraftStart = new EventEmitter <any>(); 
  @Output() onDeleteCalled = new EventEmitter <any>(); 
  @Output() onDuplicateCalled = new EventEmitter <any>(); 
  @Output() onConnectionMade = new EventEmitter <any>(); 
  @Output() onConnectionRemoved = new EventEmitter <any>(); 
  @Output() onDesignAction = new  EventEmitter <any>();
  @Output() onConnectionStarted:any = new EventEmitter<any>();
  @Output() onSubdraftViewChange:any = new EventEmitter<any>();
  @Output() createNewSubdraftFromEdits:any = new EventEmitter<any>();
  @Output() onNameChange:any = new EventEmitter<any>();
  @Output() onShowDetails:any = new EventEmitter<any>();

  @ViewChild('bitmapImage') bitmap: any;



  draft_canvas: HTMLCanvasElement;
  draft_cx: any;

  warp_data_canvas: HTMLCanvasElement;
  warp_data_cx: any;

  parent_id: number = -1;

  pick_num: number = 0;
  show_pick: boolean = false;

  /**
  * flag to tell if this is in a mode where it is looking foor a connectino
  */
  selecting_connection: boolean = false;


  /**
   * hold the top left point as an interlacement, independent of scale
   */
  interlacement: Interlacement;

  // private _scale: number; 

  ink = 'neq'; //can be or, and, neq, not, splice

  counter:number  =  0; // keeps track of how frequently to call the move functions
 
  counter_limit: number = 50;  //this sets the threshold for move calls, lower number == more calls
 
  last_ndx:Interlacement = {i: -1, j:-1, si: -1}; //used to check if we should recalculate a move operation

  moving: boolean  = false;
 
  disable_drag: boolean = false;

  is_preview: boolean = false;
 
  zndx = 0;

  has_active_connection: boolean = false;

  set_connectable:boolean = false;


  draft_visible: boolean = true;

  loom_settings: LoomSettings;

  ud_name: string;

  use_colors: boolean = false;

  draft_zoom: number = 1;

  draft_cell_size: number = 8;

  send_pick_subscription: Subscription;


  constructor(private inks: InkService, 
    private layer: LayersService, 
    private ms: MaterialsService, 
    private ss: SystemsService, 
    public tree: TreeService,
    private fs: FileService,
    private viewport: ViewportService,
    private dialog: MatDialog,
    public ws: WorkspaceService,
    public comms:SendpickService,
    private multiselect: MultiselectService) { 

      this.zndx = layer.createLayer();

  }

  ngOnInit(){

    if(!this.is_preview) this.parent_id = this.tree.getSubdraftParent(this.id);
    const tl: Point = this.viewport.getTopRight();
    const tl_offset = {x: tl.x - 250, y: tl.y + 200};

    if(this.topleft.x === 0 && this.topleft.y === 0) this.setPosition(tl_offset);
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(this.topleft, this.scale);

    if(!this.is_preview) this.viewport.addObj(this.id, this.interlacement);

    const draft = this.tree.getDraft(this.id);
    this.loom_settings = this.tree.getLoomSettings(this.id);
    this.ud_name = draft.ud_name;

    const dn:DraftNode = <DraftNode> this.tree.getNode(this.id);
    this.use_colors = dn.render_colors;


    this.draft_cell_size = this.calculateDefaultCellSize(this.draft);

    if(this.tree.isSibling(this.id)) this.disableDrag();


  }



  ngAfterViewInit() {


    this.draft_canvas = <HTMLCanvasElement> document.getElementById(this.id.toString());
    this.draft_cx = this.draft_canvas.getContext("2d");

    this.warp_data_canvas = <HTMLCanvasElement> document.getElementById('warp-data-'+this.id.toString());
    this.warp_data_cx = this.draft_canvas.getContext("2d");


    /**
     * when loading a draft from a file, the connections won't match if the connection is drawn before this
     * function executes. For this reason, I made these sequential function and then they manually call updates
     */
    this.drawDraft(this.draft).then(out => {
      return this.rescale();

    }).then(after => {
      this.updateViewport(this.topleft);
  
      //this must be called to trigger redrawing on any outgoing connections
      this.onSubdraftMove.emit({id: this.id, point: this.topleft});

  
      
    });

  }


  nameFocusOut(){
    this.onNameChange.emit(this.id);
    const scale = document.getElementById('scale-'+this.id);
  }

  startSendingPicks() {
    console.log("starting");
    const draft = this.tree.getDraft(this.id);
    
    this.send_pick_subscription = this.comms.pick_request$.subscribe((val) => {
      if (val) {
        this.sendPick(this.pick_num);
        this.pick_num = (this.pick_num + 1) % wefts(draft.drawdown);
      } 
    })

    this.sendPick(0);
    console.log("sent first pick");
  }

  sendPick(ndx: number){
    console.log("SENDING PICK ", ndx)
    const draft = this.tree.getDraft(this.id);
    // if(ndx < 0) ndx = 0;
    // if(ndx > wefts(draft.drawdown)) ndx = ndx % wefts(draft.drawdown);

    let rowSeq = new Sequence.OneD().import( draft.drawdown[ndx]).resize(this.comms.pick_size);
   
    let seq_num: string = rowSeq.val().reduce((acc, el)=> {
      if(el == 0) acc = acc.concat('0')
      if(el == 1) acc = acc.concat('1')
      if(el == 2) acc = acc.concat('0')
      return acc;
    }, '');

    this.comms.sendPickData(seq_num).then(response => {
      if(response){
        this.redrawExistingDraft();
        this.show_pick = true;
      }else{
        this.show_pick = false;

      }
    })
  }

  stopSendingPicks() {
    // stop listening to pick requests
    this.send_pick_subscription.unsubscribe();
    // set start-stop to false
    this.comms.stopWeaving();
  }


/**
 * this is called when the global workspace is rescaled. 
 * @returns 
 */
  rescale() : Promise<boolean>{

    if(this.draft === null){
      return Promise.reject("draft is null on draft rescale");
    } 

    const zoom_factor:number = this.scale/this.default_cell;

    //redraw at scale
    const container: HTMLElement = document.getElementById('scale-'+this.id.toString());
   
    if(container === null) return Promise.reject("no container initialized on draft rescale");


    container.style.transformOrigin = 'top left';
    container.style.transform = 'scale(' + zoom_factor + ')';

   
    this.topleft = {
      x: this.interlacement.j * this.scale,
      y: this.interlacement.i * this.scale
    };

    return Promise.resolve(true)



  }

  /**called when bounds change, updates the global view port */
  updateViewport(topleft: Point){
    this.interlacement = utilInstance.resolvePointToAbsoluteNdx(topleft, this.scale);
    this.viewport.updatePoint(this.id, this.interlacement);

  }

  zoomChange(event: any){
    this.draft_cell_size = event;
    this.drawDraft(this.draft);
    this.onSubdraftMove.emit({id: this.id, point: this.topleft});
    // console.log(this.draft_zoom, event);
    // const zoom_container = document.getElementById('local-zoom-'+this.id);
    // zoom_container.style.transform = 'scale('+this.draft_zoom+')';
    // zoom_container.style.width = (warps(this.draft.drawdown) * cell_size * event)+"px";
    // zoom_container.style.height = (wefts(this.draft.drawdown) * cell_size * event)+"px";
    // console.log(wefts(this.draft.drawdown), cell_size, event, this.scale);
    

  }

  /**
   * updates this components position based on the input component's position
   * */
  updatePositionFromParent(parent: OperationComponent, ndx: number){


    if(this.parent_id !== parent.id){
      console.error("attempitng to update subdraft position from non-parent operation",  this.parent_id, parent.id);
      return;
    }

    let container = <HTMLElement> document.getElementById("scale-"+this.parent_id);
    let outs = this.tree.getNonCxnOutputs(this.parent_id);


    if(outs.length == 1 ){
      if(container !== null) this.setPosition({x: parent.topleft.x, y: parent.topleft.y + (container.offsetHeight * this.scale/this.default_cell) });
      else {console.error("no element named scale-"+this.parent_id+"found")}
    }else{

      let offlet_left = parent.topleft.x;
      let total_width = 0;
      outs.forEach((out, i) => {

        let child_container = <HTMLElement> document.getElementById("scale-"+out);
        if(i < ndx) offlet_left += (child_container.offsetWidth * this.scale/this.default_cell + 10);
        total_width += (child_container.offsetWidth  * this.scale/this.default_cell + 10);

      });

      let rel_size = total_width - (container.offsetWidth * this.scale/this.default_cell)
      let margin = rel_size/2;
      offlet_left -= margin;

      outs.forEach((out, i) => {

        if(i == ndx){
          if(container !== null) this.setPosition({x: offlet_left, y: parent.topleft.y +20 + (container.offsetHeight * this.scale/this.default_cell) });
          else {console.error("no element named scale-"+this.parent_id+"found")}
        } 
       });


    }

  }

  // updateVisibility(){


  //   const cxns = this.tree.getOutputs(this.id);

  //   if(cxns.length == 0){
  //     this.render_materials = true;
  //     this.render_drawdown = true;
  //   }

  //   /**this subdraft might have multiple outputs so you want to show the relevant information for each.  */
  //   cxns.forEach(cxn => {
  //     const op_id = this.tree.getOutputs(cxn);
  //     if(op_id.length > 0 && this.tree.getType(op_id[0]) == 'op'){
  //       const op_data = this.tree.getOpNode(op_id[0]);
  //       const inlet = this.tree.getInletOfCxn(op_data.id, cxn);
  //       const op = this.ops.getOp(op_data.name);
  //       if(op.inlets[inlet].uses == 'draft'){
  //         this.render_drawdown = true;
  //       }else{
  //         this.render_materials = true;
  //       }
  //     }
  //   })

  // }


  updateName(){
    const draft = this.tree.getDraft(this.id);
    draft.ud_name = this.ud_name;

  }


  updateSize(parent: OperationComponent){

    const draft = this.tree.getDraft(this.id);

    if(this.parent_id !== parent.id){
      console.error("attempitng to update subdraft position from non-parent operation", this.parent_id, parent.id);
      console.log("attempitng to update subdraft position from non-parent operation", this.parent_id, parent.id);
      return;
    }

  }

  toggleMultiSelection(e: any){
    if(e.shiftKey){
      this.multiselect.toggleSelection(this.id, this.topleft);
    }else{
      this.multiselect.clearSelections();
    }
  }
  



   rescaleForBitmap(){


    
    if(this.draft_canvas === undefined) return;
    
    
    const draft = this.tree.getDraft(this.id);


    this.draft_canvas.width = warps(draft.drawdown) ;
    this.draft_canvas.height = wefts(draft.drawdown) ;

    for (let i = 0; i < wefts(draft.drawdown); i++) {
      for (let j = 0; j < warps(draft.drawdown); j++) {
        this.drawCell(draft, 1, i, j, false, true);
      }
    }
  }

  connectionEnded(){
    this.selecting_connection = false;
    this.enableDrag();
  }

  connectionStarted(event: any){

    if(this.selecting_connection == true){
      this.selecting_connection = false;
      this.onConnectionStarted.emit({
        type: 'stop',
        event: event,
        id: this.id
      });
    }else{ 
      this.selecting_connection = true;
      
      this.disableDrag();

      this.onConnectionStarted.emit({
        type: 'start',
        event: event,
        id: this.id
      });
    }

  }



  /**
   * called on create to position the element on screen
   * @param pos 
   */
  setPosition(pos: Point){
    this.enableDrag();
    this.topleft = pos;
    this.updateViewport(this.topleft);
  }



  public inkActionChange(name: any){
    this.ink = name;
    this.inks.select(name);
    //this.drawDraft();
  }

  /**
   * gets the next z-ndx to place this in front
   */
  public setAsPreview(){
    this.is_preview = true;
     this.zndx = this.layer.createLayer();
  }

 

  /**
   * does this subdraft exist at this point?
   * @param p the absolute position of the coordinate (based on the screen)
   * @returns true/false for yes or no
   */
  public hasPoint(p:Point) : boolean{
    const size = document.getElementById('scale'+this.id)


      const endPosition = {
        x: this.topleft.x + size.offsetWidth,
        y: this.topleft.y + size.offsetHeight,
      };

      if(p.x < this.topleft.x || p.x > endPosition.x) return false;
      if(p.y < this.topleft.y || p.y > endPosition.y) return false;

    
    return true;

  }


/**
 * Takes row/column position in this subdraft and translates it to an absolution position  
 * @param ndx the index
 * @returns the absolute position as nxy
 */
 public resolveNdxToPoint(ndx:Interlacement) : Point{
  
  let y = this.topleft.y + ndx.i * this.scale;
  let x = this.topleft.x + ndx.j * this.scale;
  return {x: x, y:y};

}

/**
 * Takes an absolute coordinate and translates it to the row/column position Relative to this subdraft
 * @param p the screen coordinate
 * @returns the row and column within the draft (i = row, j=col), returns -1 if out of bounds
 */
  public resolvePointToNdx(p:Point) : Interlacement{
    const draft = this.tree.getDraft(this.id);

    let i = Math.floor((p.y -this.topleft.y) / this.scale);
    let j = Math.floor((p.x - this.topleft.x) / this.scale);

    if(i < 0 || i >= wefts(draft.drawdown)) i = -1;
    if(j < 0 || j >= warps(draft.drawdown)) j = -1;

    return {i: i, j:j, si: i};

  }



/**
 * takes an absolute reference and returns the value at that cell boolean or null if its unset
 * @param p a point of the absolute poistion of coordinate in question
 * @returns true/false/or null representing the eddle value at this point
 */
  public resolveToValue(p:Point) : boolean{

    const coords = this.resolvePointToNdx(p);

    if(coords.i < 0 || coords.j < 0) return null; //this out of range
    
    const draft = this.tree.getDraft(this.id);

    if(!draft.drawdown[coords.i][coords.j].is_set) return null;
    
    return isUp(draft.drawdown, coords.i, coords.j);
  
  }


  // /**
  //  * sets a new draft
  //  * @param temp the draft to set this component to
  //  */
  // setNewDraft(temp: Draft) {

  //   this.bounds.width = temp.warps * this.scale;
  //   this.bounds.height = temp.wefts * this.scale;
  //   this.draft.reload(temp);
  //   this.drawDraft();

  // }

  // setComponentPosition(point: Point){
  //   this.bounds.topleft = point;
  // }


  // setComponentBounds(bounds: Bounds){
  //   this.setPosition(bounds.topleft);
  //   this.bounds = bounds;
  // }
  /**
   * manually sets the component size. While such an operation should be handled on init but there is a bug where this value is checked before the 
   * component runds its init sequence. Manually adding the data makes it possible for check for intersections on selection and drawing end.
   * @param width 
   * @param height 
   */
  // setComponentSize(width: number, height: number){
  //   this.bounds.width = width;
  //   this.bounds.height = height;
  // }

  async drawCell(draft:Draft, cell_size:number, i:number, j:number, usecolor:boolean, forprint:boolean){

    let is_up = isUp(draft.drawdown, i,j);
    let is_set = isSet(draft.drawdown, i, j);
    let color = "#ffffff"
    if(is_set){
      if(this.ink === 'unset' && is_up){
        this.draft_cx.fillStyle = "#999999"; 
      }else{
        if(is_up){
          color = usecolor ? this.ms.getColor(draft.colShuttleMapping[j]) : '#000000';
        }else{
          color = usecolor ? this.ms.getColor(draft.rowShuttleMapping[i]) : '#ffffff';
        }
        this.draft_cx.fillStyle = color;
      }
    } else{
      if(forprint) this.draft_cx.fillStyle =  '#ffffff'
      else this.draft_cx.fillStyle =  '#ADD8E6';
    // this.cx.fillStyle =  '#ff0000';

    }

    this.draft_cx.strokeStyle = "#666666"
    this.draft_cx.lineWidth = 1;

    if(!forprint && cell_size > 1 && usecolor === false) this.draft_cx.strokeRect(j*cell_size, i*cell_size, cell_size, cell_size);
    this.draft_cx.fillRect(j*cell_size, i*cell_size, cell_size, cell_size);
  }

  async drawPickSent(cell_size:number, i:number, warps: number){

    let color = "#ff3860"
    this.draft_cx.strokeStyle = color;
    this.draft_cx.lineWidth = 1;
    this.draft_cx.strokeRect(0, i*cell_size, cell_size*warps, cell_size);
  }

  redrawExistingDraft(){
    this.drawDraft(this.draft);
  }


  drawWeftData(draft: Draft) : Promise<boolean>{
    let cell_size = this.calculateCellSize(draft);


    draft =  this.tree.getDraft(this.id);
    const weft_systems_canvas =  <HTMLCanvasElement> document.getElementById('weft-systems-'+this.id.toString());
    const weft_mats_canvas =  <HTMLCanvasElement> document.getElementById('weft-materials-'+this.id.toString());
    if(weft_systems_canvas === undefined) return;
    const weft_systems_cx = weft_systems_canvas.getContext("2d");
    const weft_mats_cx = weft_mats_canvas.getContext("2d");

    weft_systems_canvas.height = wefts(draft.drawdown) * cell_size;
    weft_systems_canvas.width = cell_size;
    weft_mats_canvas.height = wefts(draft.drawdown) * cell_size;
    weft_mats_canvas.width =  cell_size;


      for (let j = 0; j < draft.rowShuttleMapping.length; j++) {
        let color = this.ms.getColor(draft.rowShuttleMapping[j]);
        let system = this.ss.getWeftSystemCode(draft.rowSystemMapping[j]);
        weft_mats_cx.fillStyle = color;
        weft_mats_cx.fillRect(1, j* cell_size+1,  cell_size-2,  cell_size-2);
        
        weft_systems_cx.fillStyle = "#666666";
        weft_systems_cx.fillText(system, 0, (j+1)*cell_size - 1)


      }
    
    

  }

  drawWarpData(draft: Draft) : Promise<boolean>{
    draft =  this.tree.getDraft(this.id);
    let cell_size = this.calculateCellSize(draft);

    const warp_systems_canvas =  <HTMLCanvasElement> document.getElementById('warp-systems-'+this.id.toString());
    const warp_mats_canvas =  <HTMLCanvasElement> document.getElementById('warp-materials-'+this.id.toString());

    if(this.warp_data_canvas === undefined) return;
    const warp_mats_cx = warp_mats_canvas.getContext("2d");
    const warp_systems_cx = warp_systems_canvas.getContext("2d");

    warp_mats_canvas.width = warps(draft.drawdown) * cell_size;
    warp_mats_canvas.height =  cell_size;

    warp_systems_canvas.width = warps(draft.drawdown) * cell_size;
    warp_systems_canvas.height =  cell_size;


      for (let j = 0; j < draft.colShuttleMapping.length; j++) {
        let color = this.ms.getColor(draft.colShuttleMapping[j]);
        let system = this.ss.getWarpSystemCode(draft.colSystemMapping[j]);
      
        warp_mats_cx.fillStyle = color;
        warp_mats_cx.fillRect(j* cell_size+1, 1,  cell_size-2,  cell_size-2);
        
        warp_systems_cx.fillStyle = "#666666";
        warp_systems_cx.fillText(system, j*cell_size+2, cell_size)

      
      }
    

  }

  calculateDefaultCellSize(draft: Draft): number {
    const num_cells = wefts(draft.drawdown) * warps(draft.drawdown);
    if(num_cells < 1000) return 10;
    if(num_cells < 10000) return 8;
    if(num_cells < 100000)return  5;
    if(num_cells < 1000000) return  2;
    return 1;
  }


  /**
   * the canvas object is limited in how many pixels it can render. Adjust the draft cell size based on the number of cells in the draft
   * @param draft 
   */
  calculateCellSize(draft: Draft): number{
    return this.draft_cell_size;
  }

  /**
   * draw whetever is stored in the draft object to the screen
   * @returns 
   */
  async drawDraft(draft: Draft) : Promise<any> {


    let cell_size = this.calculateCellSize(draft);

    draft =  this.tree.getDraft(this.id);
    const use_colors =(<DraftNode>this.tree.getNode(this.id)).render_colors;

    if(this.parent_id !== -1){
      const container = document.getElementById('scale-'+this.parent_id);
      if(container === undefined || container === null) return;
      const w = (container !== undefined && container !== null) ? container.offsetWidth : 300;
      
      const thiscontainer = document.getElementById('scale-'+this.id);
      thiscontainer.style.minWidth = w+"px";
      
    }

    if(this.draft_canvas === undefined) return;
    this.draft_cx = this.draft_canvas.getContext("2d");
   
    if(draft === null){
      this.draft_canvas.width = 0;
      this.draft_canvas.height = 0;
      this.tree.setDraftClean(this.id);
      return Promise.resolve("complete");

    }else{

      const fns = [this.drawWarpData(draft), this.drawWeftData(draft)];

      return Promise.all(fns).then(el => {
        this.draft_canvas.width = warps(draft.drawdown) * cell_size;
        this.draft_canvas.height = wefts(draft.drawdown) * cell_size;
          for (let i = 0; i <  wefts(draft.drawdown); i++) {
            for (let j = 0; j < warps(draft.drawdown); j++) {
              this.drawCell(draft, cell_size, i, j, use_colors, false);
            }
          }
        
        this.tree.setDraftClean(this.id);

        if(this.comms.is_weaving && this.show_pick){
          console.log("DRAWING PICK SEND")
          this.drawPickSent(cell_size, this.pick_num, warps(draft.drawdown));
        }

        return Promise.resolve("complete");
      })

     
    }
    
  }


  /**
   * draw onto the supplied canvas, to be used when printing
   * @returns 
   */
   drawForPrint(canvas, cx, scale: number) {

    // if(canvas === undefined) return;
    // const draft = this.tree.getDraft(this.id);

    // for (let i = 0; i < draft.wefts; i++) {
    //   for (let j = 0; j < draft.warps; j++) {
    //     let is_up = draft.isUp(i,j);
    //     let is_set = draft.isSet(i, j);
    //     if(is_set){
    //       if(this.ink === 'unset' && is_up){
    //         cx.fillStyle = "#999999"; 
    //       }else{
    //         cx.fillStyle = (is_up) ?  '#000000' :  '#ffffff';
    //       }
    //     } else{
    //       cx.fillStyle =  '#0000000d';
    //     }
    //     cx.fillRect(j*scale+this.bounds.topleft.x, i*scale+this.bounds.topleft.y, scale, scale);
    //   }
    // }

    // //draw the supplemental info like size
    // cx.fillStyle = "#666666";
    // cx.font = "20px Verdana";

    // let datastring: string =  draft.warps + " x " + draft.wefts;
    // cx.fillText(datastring,this.bounds.topleft.x + 5, this.bounds.topleft.y+this.bounds.height + 20 );

  }





  /**
   * gets the position of this elment on the canvas. Dyanic top left might be bigger due to scolling intersection
   * previews. Use static for all calculating of intersections, etc. 
   * @returns 
   */
  getTopleft(): Point{
    return this.topleft;
  }

    /**
   * prevents hits on the operation to register as a palette click, thereby voiding the selection
   * @param e 
   */
     mousedown(e: any){
      e.stopPropagation();
  
  
    }


  
  // isSameBoundsAs(bounds: Bounds) : boolean {   
  //   if(bounds.topleft.x != this.bounds.topleft.x) return false;
  //   if(bounds.topleft.y != this.bounds.topleft.y) return false;
  //   if(bounds.width != this.bounds.width) return false;
  //   if(bounds.height != this.bounds.height) return false;
  //   return true;
  // }
  

  dragEnd($event: any) {
    this.moving = false;
    this.counter = 0;  
    this.last_ndx = {i: -1, j:-1, si: -1};
    this.multiselect.setRelativePosition(this.topleft);
    this.onSubdraftDrop.emit({id: this.id});
  }

  dragStart($event: any) {

    this.moving = true;
    this.counter = 0;  
      //set the relative position of this operation if its the one that's dragging
     if(this.multiselect.isSelected(this.id)){
      this.multiselect.setRelativePosition(this.topleft);
     }else{
      this.multiselect.clearSelections();
     }
    this.onSubdraftStart.emit({id: this.id});
 

  }

  dragMove($event: any) {

    //position of pointer of the page
    const pointer:Point = $event.pointerPosition;

    const relative:Point = utilInstance.getAdjustedPointerPosition(pointer, this.viewport.getBounds());
    const adj:Point = utilInstance.snapToGrid(relative, this.scale);


    this.topleft = adj;

    // this.bounds.topleft = adj;

     const ndx = utilInstance.resolvePointToAbsoluteNdx(adj, this.scale);
    this.interlacement = ndx;
    
    if(this.counter%this.counter_limit === 0 || !utilInstance.isSameNdx(this.last_ndx, ndx)){
      this.onSubdraftMove.emit({id: this.id, point: adj});
      this.counter = 0;
    } 

    this.counter++;
    this.last_ndx = ndx;

  }

  disableDrag(){
    this.disable_drag = true;
  }

  enableDrag(){
    this.disable_drag = false;
  }

  showhide(){
    this.draft_visible = !this.draft_visible;
    this.onSubdraftViewChange.emit(this.id);
  }

  connectionClicked(id:number){
    this.has_active_connection  = true;
    // if(this.active_connection_order === 0){
    //   this.onConnectionMade.emit(id);
    // }else{
    //   this.onConnectionRemoved.emit(id);
    // }


  }

  resetConnections(){
    this.has_active_connection = false;
  }

  toggleDraftRendering(){
    const dn = <DraftNode> this.tree.getNode(this.id);
    dn.render_colors = !dn.render_colors;
    this.use_colors = dn.render_colors;
    this.redrawExistingDraft();
  }



  async designActionChange(e){
    const draft = this.tree.getDraft(this.id);

    switch(e){
      case 'duplicate':   
      this.onDuplicateCalled.emit({id: this.id});
      break;

      case 'delete': 
        this.onDeleteCalled.emit({id: this.id});
      break;

      default: 
        this.onDesignAction.emit({id: this.id});
      break;

    }
  }


  /**
   * Draws to hidden bitmap canvas a file in which each draft cell is represented as a single pixel. 
   * @returns 
   */
  async saveAsBmp() : Promise<any> {

    this.rescaleForBitmap();

    let b = this.bitmap.nativeElement;
    let context = b.getContext('2d');
    const draft = this.tree.getDraft(this.id);

    b.width = (warps(draft.drawdown));
    b.height = (wefts(draft.drawdown));
    
    context.fillStyle = "white";
    context.fillRect(0,0,b.width,b.height);
    context.drawImage(this.draft_canvas, 0, 0);

    const a = document.createElement('a')
    return this.fs.saver.bmp(b)
    .then(href => {
      a.href =  href;
      a.download = getDraftName(draft) + "_bitmap.jpg";
      a.click();
      this.drawDraft(draft);

    });
    


      
  }
  
    async saveAsAda() : Promise<any>{
      const draft = this.tree.getDraft(this.id);

      const a = document.createElement('a');
      return this.fs.saver.ada('draft', false, this.scale).then(out => {
        a.href = "data:application/json;charset=UTF-8," + encodeURIComponent(out.json);
        a.download = getDraftName(draft) + ".ada";
        a.click();
      }); 
    }
  
    async saveAsWif() {

      // const draft = this.tree.getDraft(this.id);
      // const loom = this.tree.getLoom(this.id);

      
      

      // const a = document.createElement('a');
      // return this.fs.saver.wif(draft, loom)
      // .then(href => {
      //   a.href = href;
      //   a.download  = getDraftName(draft) +".wif";
      //   a.click();
      // });
    
    }
  
    async saveAsPrint() {
     
      // let dims = this.default_cell;
      // let b = this.bitmap.nativeElement;
      // let context = b.getContext('2d');

      // console.log(dims)
       const draft = this.tree.getDraft(this.id);


      // b.width = warps(draft.drawdown) * dims;
      // b.height = wefts(draft.drawdown) * dims;
      
      // context.fillStyle = "white";
      // context.fillRect(0,0,b.width,b.height);
      

      // context.drawImage(this.draft_canvas, 0, 0);

      const a = document.createElement('a')
      return this.fs.saver.jpg(this.draft_canvas)
        .then(href => {
          a.href =  href;
          a.download = getDraftName(draft) + ".jpg";
          a.click();
      
        });
    }

    warps(){
      return warps(this.draft.drawdown);
    }

    wefts(){
      return wefts(this.draft.drawdown);
    }


    /**
     * Open this when 
     * @returns 
     */
    finetune(){

      this.onShowDetails.emit(this.id);


      //if this is already open, don't reopen it
      // if(this.modal != undefined && this.modal.componentInstance != null) return;
     
      // const draft = this.tree.getDraft(this.id);
      // const loom = this.tree.getLoom(this.id);
      // const loom_settings = this.tree.getLoomSettings(this.id);
      // let use_id = this.id;

      // /** if this was a generated draft, create a temp node to hold a copy of this draft*/
      // if(this.tree.hasParent(this.id)){
      //   const new_id = this.tree.createNode('draft', null, null);
      //   draft.id = new_id;
      //   this.tree.loadDraftData( {prev_id: null, cur_id: new_id}, draft, loom, loom_settings,false);
      //   use_id = new_id;
      // }


      // this.modal = this.dialog.open(DraftdetailComponent,
      //   {disableClose: true,
      //     hasBackdrop: false,
      //     data: {
      //       id: use_id,
      //       ink: this.inks.getInk(this.ink).viewValue
      //     }
      //   });



      //   this.modal.afterClosed().subscribe(result => {
      //     console.log("FINE TUNE CLOSED", this.id, result)

      //     if(result === null) return;

      //       if(this.parent_id == -1){
      //         this.draft = this.tree.getDraft(this.id);
      //         this.onDesignAction.emit({id: this.id});
      //       }else{
      //         const cur_draft = this.tree.getDraft(this.id);
      //         const new_draft = this.tree.getDraft(result);

      //         const cur_loom = this.tree.getLoom(this.id);
      //         const new_loom = this.tree.getLoom(result);

      //         if(!utilInstance.areDraftsTheSame(cur_draft, new_draft)){
      //           this.createNewSubdraftFromEdits.emit({parent_id: this.parent_id, new_id: result});
      //           return;
      //         }

      //         if(!utilInstance.areLoomsTheSame(cur_loom, new_loom)){
      //           this.createNewSubdraftFromEdits.emit({parent_id: this.parent_id, new_id: result});
      //           return;
      //         }

      //         //if you get here, then we can remove the temp node
      //         console.log("NODE REMOVED", result)
      //         this.tree.removeNode(result);
      //       }
      //   })   
       }

 


}
