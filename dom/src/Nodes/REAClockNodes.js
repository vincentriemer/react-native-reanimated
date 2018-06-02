// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REAClockNode extends REANode {
  isRunning: boolean;
  lastTimestampMs: ?number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    const nodesManager = getNodesManager(this);

    const animationClb = () => {
      if (!this.isRunning) return;
      this.markUpdated();
      nodesManager.postOnAnimation(animationClb);
    };

    nodesManager.postOnAnimation(animationClb);
  }

  stop() {
    this.isRunning = false;
  }

  evaluate() {
    return getNodesManager(this).currentAnimationTimestamp * 1000;
  }
}

export class REAClockOpNode extends REANode {
  clockNodeID: number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.clockNodeID = config.clock;
  }

  clockNode() {
    const node = getNodesManager(this).findNodeById(this.clockNodeID);
    invariant(node instanceof REAClockNode, `Node is not a REAClockNode`);
    return node;
  }
}

export class REAClockStartNode extends REAClockOpNode {
  evaluate() {
    this.clockNode().start();
    return 0;
  }
}

export class REAClockStopNode extends REAClockOpNode {
  evaluate() {
    this.clockNode().stop();
    return 0;
  }
}

export class REAClockTestNode extends REAClockOpNode {
  evaluate() {
    return this.clockNode().isRunning ? 1 : 0;
  }
}
