import { NumParam, StringParam, OpParamVal, OpInput, Operation } from "../../model/datatypes";
import { getOpParamValById } from "../../model/operations";
import { Sequence } from "../../model/sequence";
import { initDraftFromDrawdown } from "../../model/drafts";


const name = "bitfield";
const old_names = [];

//PARAMS
const warps:NumParam =  
    {name: 'num warps',
    type: 'number',
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of warps"
};

const wefts:NumParam =  
    {name: 'num warps',
    type: 'number',
    min: 1,
    max: 128,
    value: 32,
    dx: "Number of wefts"
};

const f:StringParam =  
    {name: 'bitfield function',
    type: 'string',
    regex: /^[0-9!<>&^\|xy()+-\\ \\%]+$/,
    error: 'Invalid - can only contain 0-9, x, y, spaces and the following symbols: <>&^|xy()+-%',
    value: "(x ^ y) % 3",
    dx: "JavaScript expression that uses x/y values to return a boolean value for each cell"
};

const params = [warps, wefts, f];

const inlets = [];

const perform = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) => {
    const num_warps: number = getOpParamValById(0, param_vals);
    const num_wefts: number = getOpParamValById(1, param_vals);
    const script: string = getOpParamValById(2, param_vals);

    // This should already have been checked but probably best to check here again in case
    // a bad string could have been injected somewhere..
    if (script.match(f.regex)) {
        let func = eval('(x, y) => '.concat(script));
        let pattern = new Sequence.TwoD();
        for (let weft = 0; weft < num_wefts; ++weft) {
            const row = new Sequence.OneD();
            for (let warp = 0; warp < num_warps; ++warp) {
                row.push(!! func(warp, weft));
            }
            pattern.pushWeftSequence(row.val());
        }
        return Promise.resolve([initDraftFromDrawdown(pattern.export())]);
    }
}

const generateName = (param_vals: Array<OpParamVal>, op_inputs: Array<OpInput>) : string => {
    const num_up: number = getOpParamValById(0, param_vals);
    return num_up + '/bitfield';
}

export const bitfield: Operation = {name, old_names, params, inlets, perform, generateName};