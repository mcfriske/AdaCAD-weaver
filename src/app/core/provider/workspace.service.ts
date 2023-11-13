import { Injectable } from '@angular/core';
import { LoomSettings } from '../model/datatypes';
import { defaults } from '../model/defaults';
import utilInstance from '../model/util';

@Injectable({
  providedIn: 'root'
})

/**
 * store any global workspace settings here:
 * Sync these with firebase so they are remembered across user sessions
 */
export class WorkspaceService {


  file_favorites: Array<number> = [];
  min_frames: number = defaults.min_frames; 
  min_treadles: number = defaults.min_treadles;
  type: string = defaults.loom_type; //'rigid', 'direct', 'frame', 'jacquard'
  epi: number = defaults.epi;
  units: 'in' | 'cm' = <'in' | 'cm'>defaults.units;

  show_materials: boolean = defaults.show_materials;
  black_cell_up: boolean = defaults.black_cell_up;
  number_threading: boolean = defaults.number_threading;


  /**
   * when looking at the draft viewer, where should the (0, 0) point of the drawdown sit. 
   * 0 top right, 1 bottom right, 2 bottom left, 3 top left
   */
  selected_origin_option: number = defaults.selected_origin_option;

  private origin_option_list: Array<{value: number, view: string}> = 
  [
    {value: 0, view: 'top right'},
    {value: 1, view: 'bottom right'},
    {value: 2, view: 'bottom left'},
    {value: 3, view: 'top left'},
  ];



  constructor() { }

  initDefaultWorkspace(){
    this.min_frames = defaults.min_frames; 
    this.min_treadles = defaults.min_treadles;
    this.type = defaults.loom_type; //'rigid', 'direct', 'frame', 'jacquard'
    this.epi = defaults.epi;
    this.units = <'in'|'cm'>defaults.units;
    this.show_materials = defaults.show_materials;
    this.black_cell_up = defaults.black_cell_up;
    this.number_threading = defaults.number_threading;
    this.selected_origin_option = defaults.selected_origin_option;

  }

  loadWorkspace(data){
    this.min_frames = data.min_frames; 
    this.min_treadles = data.min_treadles;
    this.type = data.type;
    this.epi = data.epi;
    this.units = data.units;
    this.show_materials = data.show_materials;
    this.black_cell_up = data.black_cell_up;
    this.number_threading = data.number_threading;
    this.selected_origin_option = data.selected_origin_option;
    this.file_favorites = (data.file_favorites === undefined) ? [] : data.file_favorites;
  }

  getOriginOptions(){
    return this.origin_option_list;
  }

  isFrame() : boolean{
    if(this.type === 'frame') return true;
    return false;
  }


  /**
   * given an array of looms, infers the data from what is most commonly used
   * this assumes that most exports will have common loom data
   * @param looms 
   */
  async inferData(loom_settings: Array<LoomSettings>) : Promise<any> {
    if(loom_settings.length === 0) return Promise.resolve("no looms");

    //filter out null or undefined looms
    loom_settings = loom_settings.filter(el => !(el === undefined || el === null)); 


    this.min_frames = utilInstance.getMostCommon(
      loom_settings.map(el => el.frames)
    );
    this.min_treadles = utilInstance.getMostCommon(
      loom_settings.map(el => el.treadles)
    );
    this.type = utilInstance.getMostCommon(
      loom_settings.map(el => el.type)
    );
    this.units = utilInstance.getMostCommon(
      loom_settings.map(el => el.units)
    );

    this.epi = utilInstance.getMostCommon(
      loom_settings.map(el => el.epi)
    );

    return "done";
  }

  exportWorkspace() : any{
    return {
      min_frames: this.min_frames, 
      min_treadles: this.min_treadles,
      type: this.type,
      epi: this.epi,
      units: this.units,
      show_materials: this.show_materials,
      black_cell_up: this.black_cell_up,
      number_threading: this.number_threading,
      selected_origin_option: this.selected_origin_option,
      file_favorites: this.file_favorites.slice()
    }
  }

  toggleFavorite(id: number){
    const found = this.file_favorites.find(el => el === id);
    if(found){
      this.file_favorites = this.file_favorites.filter(el => el !== id)
    }else{
      this.file_favorites.push(id);
    }
  }

  isFavorite(id: number):boolean{
    const found = this.file_favorites.find(el => el === id);
    if(found === undefined) return false;
    else return true;
  }

}
