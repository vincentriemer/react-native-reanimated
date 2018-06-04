// @flow

import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REACondNode extends REANode {
  condNodeID: number;
  ifBlockID: number;
  elseBlockID: number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.condNodeID = config.cond;
    this.ifBlockID = config.ifBlock;
    this.elseBlockID = config.elseBlock;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);

    const cond = nodesManager.findNodeById(this.condNodeID).value();

    if (cond) {
      return nodesManager.findNodeById(this.ifBlockID).value();
    }

    return this.elseBlockID != null
      ? nodesManager.findNodeById(this.elseBlockID).value()
      : 0;
  }
}
