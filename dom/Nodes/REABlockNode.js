// @flow

import { REANode } from './REANode';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REABlockNode extends REANode {
  block: number[];

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.block = config.block;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);

    let result;
    for (let inputID of this.block) {
      result = nodesManager.findNodeById(inputID).value();
    }
    return result;
  }
}
