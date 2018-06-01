// @flow
import invariant from 'invariant';
import { REANodesManager } from '../REANodesManager';
import { type Config } from '../REAModule';

export class REAUpdateContext {
  updatedNodes: REANode[];
  loopID: number;

  constructor() {
    this.loopID = 1;
    this.updatedNodes = [];
  }
}

export class REANode {
  nodesManager: ?REANodesManager;
  updateContext: ?REAUpdateContext;
  nodeID: number;

  lastLoopID: number;
  memoizedValue: any;
  childNodes: ?Set<REANode>;

  constructor(nodeID: number, config: Config) {
    this.nodeID = nodeID;
    this.lastLoopID = 0;
  }

  dangerouslyRescheduleEvaluate() {
    this.lastLoopID = 0;
    this.markUpdated();
  }

  forceUpdateMemoizedValue(value: any) {
    this.memoizedValue = value;
    this.markUpdated();
  }

  evaluate(): any {
    return 0;
  }

  value() {
    const { updateContext } = this;
    invariant(
      updateContext,
      `REANode with id ${this.nodeID} has no updateContext`
    );
    if (this.lastLoopID < updateContext.loopID) {
      this.lastLoopID = updateContext.loopID;
      this.memoizedValue = this.evaluate();
    }
    return this.memoizedValue;
  }

  addChild(child: ?REANode) {
    if (!this.childNodes) {
      this.childNodes = new Set();
    }
    if (child) {
      this.childNodes.add(child);
      this.dangerouslyRescheduleEvaluate();
    }
  }

  removeChild(child: ?REANode) {
    if (child && this.childNodes) {
      this.childNodes.delete(child);
    }
  }

  markUpdated() {
    const { updateContext, nodesManager } = this;
    invariant(
      updateContext && nodesManager,
      `REANode with id ${this.nodeID} has no updateContext or nodesManager`
    );
    updateContext.updatedNodes.push(this);
    // TODO: nodesManager.postRunUpdatesAfterAnimation();
  }

  static findAndUpdateNodes(node: REANode, visitedNodes: Set<REANode>) {
    if (visitedNodes.has(node)) {
      return;
    } else {
      visitedNodes.add(node);
    }

    if (typeof node.update === 'function') {
      (node: any).update();
    } else if (node.childNodes) {
      for (let child of node.childNodes) {
        this.findAndUpdateNodes(child, visitedNodes);
      }
    }
  }

  static runPropUpdates(context: REAUpdateContext) {
    const visitedNodes: Set<REANode> = new Set();
    for (let i = 0; i < context.updatedNodes.length; i++) {
      this.findAndUpdateNodes(context.updatedNodes[i], visitedNodes);
    }
    context.updatedNodes = [];
    context.loopID++;
  }
}
