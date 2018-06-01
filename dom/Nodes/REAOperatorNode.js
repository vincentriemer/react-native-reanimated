// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';

type REAOperatorBlock = (inputNodes: REANode[]) => any;

type REA_MACRO = (...test: number[]) => any;

const REA_REDUCE = (OP: REA_MACRO) => (inputNodes: REANode[]) => {
  let acc = inputNodes[0].value();
  for (let i = 1; i < inputNodes.length; i++) {
    const a = acc;
    const b = inputNodes[i].value();
    acc = OP(a, b);
  }
  return acc;
};

const REA_SINGLE = (OP: REA_MACRO) => (inputNodes: REANode[]) => {
  const a = inputNodes[0].value();
  return OP(a);
};

const REA_INFIX = (OP: REA_MACRO) => (inputNodes: REANode[]) => {
  const a = inputNodes[0].value();
  const b = inputNodes[1].value();
  return OP(a, b);
};

const OPS = {
  // arithmetic
  add: REA_REDUCE((a, b) => a + b),
  sub: REA_REDUCE((a, b) => a - b),
  multiply: REA_REDUCE((a, b) => a * b),
  divide: REA_REDUCE((a, b) => a / b),
  pow: REA_REDUCE((a, b) => Math.pow(a, b)),
  modulo: REA_REDUCE((a, b) => a % b),
  sqrt: REA_SINGLE(a => Math.sqrt(a)),
  sin: REA_SINGLE(a => Math.sin(a)),
  cos: REA_SINGLE(a => Math.cos(a)),
  exp: REA_SINGLE(a => Math.exp(a)),

  // logical
  and: (inputNodes: REANode[]) => {
    let res: boolean = inputNodes[0].value();
    for (let i = 1; i < inputNodes.length && res; i++) {
      res = res && inputNodes[i].value();
    }
    return res ? 1 : 0;
  },
  or: (inputNodes: REANode[]) => {
    let res: boolean = inputNodes[0].value();
    for (let i = 1; i < inputNodes.length && res; i++) {
      res = res || inputNodes[i].value();
    }
    return res ? 1 : 0;
  },
  not: REA_SINGLE(a => !a),
  defined: (inputNodes: REANode[]) => {
    const val = inputNodes[0].value();
    const res = val != null && !isNaN(val);
    return res;
  },

  // comparing
  lessThan: REA_INFIX((a, b) => a < b),
  eq: REA_INFIX((a, b) => a === b),
  greaterThan: REA_INFIX((a, b) => a > b),
  lessOrEq: REA_INFIX((a, b) => a <= b),
  greaterOrEq: REA_INFIX((a, b) => a >= b),
  neq: REA_INFIX((a, b) => a !== b),
};

export class REAOperatorNode extends REANode {
  input: number[];
  inputNodes: REANode[];
  op: REAOperatorBlock;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.input = config.input;
    this.inputNodes = [];
    this.op = OPS[config.op];
    if (!this.op) {
      console.error(`Operator ${config.op} not found`);
    }
  }

  evaluate() {
    const nodesManager = getNodesManager(this);
    for (let i = 0; i < this.input.length; i++) {
      this.inputNodes[i] = nodesManager.findNodeById(this.input[i]);
    }
    return this.op(this.inputNodes);
  }
}
