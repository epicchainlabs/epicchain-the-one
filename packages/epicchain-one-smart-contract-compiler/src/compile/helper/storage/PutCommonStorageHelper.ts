import ts from 'typescript';
import { ScriptBuilder } from '../../sb';
import { VisitOptions } from '../../types';
import { Helper } from '../Helper';

// Input: [keyBuffer, valBuffer]
// Output: []
export class PutCommonStorageHelper extends Helper {
  public emit(sb: ScriptBuilder, node: ts.Node, optionsIn: VisitOptions): void {
    const options = sb.pushValueOptions(optionsIn);
    // [valBuffer, keyBuffer]
    sb.emitOp(node, 'SWAP');
    // [map, valBuffer, keyBuffer]
    sb.emitHelper(node, options, sb.helpers.commonStorage);
    // [keyBuffer, map, valBuffer]
    sb.emitOp(node, 'ROT');
    // [valBuffer, keyBuffer, map]
    sb.emitOp(node, 'ROT');
    // []
    sb.emitOp(node, 'SETITEM');
  }
}
