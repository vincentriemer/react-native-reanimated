// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import type { Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REAJSCallNode extends REANode {
  input: number[];

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.input = config.input;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);
    const args = [];
    for (let i = 0; i < this.input.length; i++) {
      args.push(nodesManager.findNodeById(this.input[i]).value());
    }

    const reanimatedModule = nodesManager.reanimatedModule;
    invariant(reanimatedModule, `reanimatedModule not bound to nodesManager`);

    reanimatedModule.sendEventWithName('onReanimatedCall', {
      id: this.nodeID,
      args,
    });

    return 0;
  }
}
