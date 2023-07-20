import { NumParam, BoolParam, Operation, OperationInlet, OpInput, OpParamVal, Cell } from "../../model/datatypes";
import { getCol, initDraftFromDrawdown, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles, warps } from "../../model/drafts";
import { getAllDraftsAtInlet, getInputDraft, getOpParamValById, parseDraftNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";

/**
 * this will be the default function going forward, as the others will be removed. 
 */

const name = "sierpinski";
const old_names = [];

//PARAMS

const amt_size:NumParam =
      {name: 'size',
      type: 'number',
      min: 1,
      max: 1000,
      value: 10,
      dx: 'size of the square'
      }

const amt_recur:NumParam =
    {name: 'recursion depth',
    type: 'number',
    min: 1,
    max: 10,
    value: 2,
    dx: 'how many holes you punch (recursively)'
    }

const facing: BoolParam = 
    {name: 'facing',
    type: 'boolean',
    falsestate: "weft facing",
    truestate: "warp facing",
    value: 0,
    dx: ''
    }

const params = [amt_size, amt_recur, facing];

//INLETS
/*const draft_inlet: OperationInlet = {
    name: 'draft', 
      type: 'static',
      value: null,
      dx: 'the draft to shift',
      uses: "draft",
      num_drafts: 1
  }*/

  const inlets = [];


function punch_hole(draft: Array<Array<Cell>>, x:number, y:number, x_dim:number, y_dim:number, depth:number) {
	console.log("x: " + x + " y: "+y+" xdim: "+x_dim + " ydim: "+y_dim + " depth: "+depth);
	if (x_dim < 3 || y_dim < 3 || depth < 1) { //too small to punch hole
		return;
	}
	//Just going to assume everything in that region is one value for now
	const bg = draft[x][y].is_up;
	const hole = !bg;

	
	let out_x = (x_dim % 3 == 2) ? Math.ceil(x_dim/3) : Math.floor(x_dim/3);
	let mid_x = x_dim-2*out_x;
	let out_y = (y_dim % 3 == 2) ? Math.ceil(y_dim/3) : Math.floor(y_dim/3);
	let mid_y = y_dim-2*out_y;



	let x_corners = [x, x+out_x, x+out_x+mid_x];
	let y_corners = [y, y+out_y, y+out_y+mid_y];


	//punch out middle square
	for (let i=x_corners[1]; i<x_corners[2]; i++) {
		for (let j=y_corners[1]; j<y_corners[2]; j++) {
			draft[i][j].is_up=hole;
		}
	}
	//console.log("output");
	//console.log(draft);



	for (let i=0; i<3; i++) {
		for (let j=0; j<3; j++) {
			if (i==1 && j==1) { //skip middle square
				continue;
			} //recurse for surrounding squares 
			punch_hole(draft, x_corners[i], y_corners[j], i==1?mid_x:out_x, j==1?mid_y:out_y, depth-1);
		}
	}
}

// what's actually called
const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  //let input_draft = getInputDraft(op_inputs);
  let amt_size = getOpParamValById(0, op_params);
  let amt_recur = getOpParamValById(1, op_params);
  let facing = getOpParamValById(2, op_params);

   //if(input_draft == null) return Promise.resolve([]);

   /*let warp_systems = new Sequence.OneD(input_draft.colSystemMapping).shift(-amt_x);

   let warp_mats = new Sequence.OneD(input_draft.colShuttleMapping).shift(-amt_x);

   let weft_systems = new Sequence.OneD(input_draft.rowSystemMapping).shift(-amt_y);

   let weft_materials = new Sequence.OneD(input_draft.rowShuttleMapping).shift(-amt_y);*/

  let init = new Sequence.TwoD();
  init.setBlank(facing ? 1 : 0).fill(amt_size, amt_size);
  let pattern_data = init.export();

  punch_hole(pattern_data, 0, 0, amt_size, amt_size, amt_recur);

  console.log(pattern_data);

  let d = initDraftFromDrawdown(pattern_data);



  return Promise.resolve([d]);
}   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
  let amt_x = getOpParamValById(0, param_vals);
  let amt_y = getOpParamValById(1, param_vals);
  let drafts = getAllDraftsAtInlet(op_inputs, 0);
  return 'sierpinski'+amt_x+'/'+amt_y;
}


export const sierpinski: Operation = {name, old_names, params, inlets, perform, generateName};

