// @flow

import { REANode } from './REANode';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REAStyleNode extends REANode {
  styleConfig: { [string]: number };

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.styleConfig = config.style;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);

    const styles = {};
    for (let prop of Object.keys(this.styleConfig)) {
      const propNode = nodesManager.findNodeById(this.styleConfig[prop]);
      styles[prop] = propNode.value();
    }
    if (styles.hasOwnProperty('transform')) {
      styles.animatedTransform = styles.transform;
      delete styles.transform;
    }
    return styles;
  }
}
