// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REATransformNode extends REANode {
  transformConfigs: {
    property: string,
    nodeID: ?number,
    value: any,
  }[];

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.transformConfigs = config.transform;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);

    const transform: { [string]: number }[] = [];
    for (let transformConfig of this.transformConfigs) {
      const property = transformConfig.property;
      const nodeID = transformConfig.nodeID;
      let value;
      if (nodeID) {
        const node = nodesManager.findNodeById(nodeID);
        value = node.value();
      } else {
        value = transformConfig.value;
      }
      transform.push({ [property]: value });
    }

    return transform;
  }
}
