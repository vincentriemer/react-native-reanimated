// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';
import { REAValueNode } from './REAValueNode';

export class REASetNode extends REANode {
  whatNodeID: number;
  valueNodeID: number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.whatNodeID = config.what;
    this.valueNodeID = config.value;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);
    const newValue = nodesManager.findNodeById(this.valueNodeID).value();
    const what = nodesManager.findNodeById(this.whatNodeID);
    invariant(
      what instanceof REAValueNode,
      `REASetNode must target an REAValueNode`
    );
    what.setValue(newValue);
    return newValue;
  }
}
