// @flow

import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';

export class READebugNode extends REANode {
  valueNodeID: number;
  message: string;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.message = config.message;
    this.valueNodeID = config.value;
  }

  evaluate() {
    const value = getNodesManager(this)
      .findNodeById(this.valueNodeID)
      .value();
    console.log(`${this.message} ${value}`);
    return value;
  }
}
