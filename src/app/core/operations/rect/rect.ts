import { createCell } from "../../model/cell";
import { Draft, NumParam, Operation, OperationInlet, OpInput, Cell, OpParamVal, Drawdown } from "../../model/datatypes";
import { initDraft, initDraftFromDrawdown, initDraftWithParams, updateWarpSystemsAndShuttles, updateWeftSystemsAndShuttles } from "../../model/drafts";
import { getInputDraft, getOpParamValById, parseOpInputNames } from "../../model/operations";
import { Sequence } from "../../model/sequence";


const name = "rectangle";
const old_names = [];

//PARAMS
const ends:NumParam =  
    {name: 'ends',
    type: 'number',
    min: 1,
    max: 500,
    value: 10,
    dx: ""
    };

const pics: NumParam = 
    {name: 'pics',
    type: 'number',
    min: 1,
    max: 500,
    value: 10,
    dx: ""
    }

const params = [ends, pics];

//INLETS
const draft_inlet: OperationInlet = {
    name: 'input draft', 
    type: 'static',
    value: null,
    uses: "draft",
    dx: 'the draft with which you would like to fill this rectangle',
    num_drafts: 1
  }

  const inlets = [draft_inlet];


const  perform = (op_params: Array<OpParamVal>, op_inputs: Array<OpInput>) => {

  let input_draft = getInputDraft(op_inputs);
  let w = getOpParamValById(0, op_params);
  let h = getOpParamValById(1, op_params);

  console.log("INPUT DRAFT", input_draft)

  let seq = new Sequence.TwoD();
  if(input_draft !== null) seq.import(input_draft.drawdown);
  else seq.setBlank();

  let dd: Drawdown = seq.fill(w,h).export();
  let d = initDraftFromDrawdown(dd);
  d = updateWeftSystemsAndShuttles(d, input_draft);
  d = updateWarpSystemsAndShuttles(d, input_draft);

    return Promise.resolve([d]);
  }   

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {

  return 'rect('+parseOpInputNames(op_inputs)+")";
}


export const rect: Operation = {name, old_names, params, inlets, perform, generateName};