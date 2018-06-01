// @flow
import invariant from 'invariant';
import { type RCTUIManager } from 'react-native-dom';
import { REANode, REAUpdateContext } from './Nodes/REANode';
import type REAModule, { Config } from './REAModule';

import { REAPropsNode } from './Nodes/REAPropsNode';
import { REAEventNode } from './Nodes/REAEventNode';

export type RCTEvent = Object;
type REAOnAnimationCallback = () => void;

function getNode(nodeID: number, nodeMap: { [id: number]: REANode }): REANode {
  const node = nodeMap[nodeID];
  invariant(node, `No such AnimatedNode found with id: ${nodeID}`);
  return node;
}

function getEventKey(viewTag: number, eventName: string) {
  return `${viewTag}${eventName}`;
}

export class REANodesManager {
  uiManager: ?RCTUIManager;
  reanimatedModule: ?REAModule;
  currentAnimationTimestamp: number;
  nativeProps: ?Set<string>;

  nodes: { [id: number]: REANode };
  eventMapping: Map<string, REAEventNode>;
  eventQueue: RCTEvent[];
  updateContext: REAUpdateContext;
  wantRunUpdates: boolean;
  onAnimationCallbacks: REAOnAnimationCallback[];

  ticking: boolean;

  constructor(reanimatedModule: REAModule, uiManager: RCTUIManager) {
    this.reanimatedModule = reanimatedModule;
    this.uiManager = uiManager;
    this.nodes = {};
    this.eventMapping = new Map();
    this.eventQueue = [];
    this.updateContext = new REAUpdateContext();
    this.wantRunUpdates = false;
    this.onAnimationCallbacks = [];
    this.ticking = false;
  }

  findNodeById(nodeId: number) {
    return this.nodes[nodeId];
  }

  postOnAnimation(clb: REAOnAnimationCallback) {
    this.onAnimationCallbacks.push(clb);
    this.startUpdatingOnAnimationFrame();
  }

  postRunUpdatesAfterAnimation() {
    this.wantRunUpdates = true;
    this.startUpdatingOnAnimationFrame();
  }

  startUpdatingOnAnimationFrame() {
    if (!this.ticking) {
      this.ticking = true;
      window.requestAnimationFrame(this.onAnimationFrame);
    }
  }

  stopUpdatingOnAnimationFrame() {
    this.ticking = false;
  }

  onAnimationFrame = (timestamp: number) => {
    this.currentAnimationTimestamp = timestamp;

    // We process all enqueued events first
    for (let i = 0; i < this.eventQueue.length; i++) {
      const event = this.eventQueue[i];
      this.processEvent(event);
    }
    this.eventQueue = [];

    const callbacks = this.onAnimationCallbacks;
    this.onAnimationCallbacks = [];

    // When one of the callbacks would postOnAnimation callback we don't want
    // to process it until the next frame. This is why we cpy the array before
    // we iterate over it
    for (let block of callbacks) {
      block();
    }

    REANode.runPropUpdates(this.updateContext);
    this.wantRunUpdates = false;

    this.stopUpdatingOnAnimationFrame();
    if (this.onAnimationCallbacks.length !== 0) {
      this.startUpdatingOnAnimationFrame();
    }
  };

  // -- Graph

  _nodeTypeMap: ?{ [type: string]: Class<REANode> };
  get nodeTypeMap(): { [type: string]: Class<REANode> } {
    if (!this._nodeTypeMap) {
      this._nodeTypeMap = {};
    }
    return this._nodeTypeMap;
  }

  createNode(nodeID: number, config: Config) {
    const map = this.nodeTypeMap;
    const nodeType = config.type;

    const NodeClass = map[nodeType];
    if (!NodeClass) {
      console.error(`Animated node type ${nodeType} not supported natively`);
      return;
    }

    const node = new NodeClass(nodeID, config);
    node.nodesManager = this;
    node.updateContext = this.updateContext;
    this.nodes[nodeID] = node;
  }

  dropNode(nodeID: number) {
    const node = this.nodes[nodeID];
    if (node) {
      delete this.nodes[nodeID];
    }
  }

  connectNodes(parentID: number, childID: number) {
    const parentNode = getNode(parentID, this.nodes);
    const childNode = getNode(childID, this.nodes);

    parentNode.addChild(childNode);
  }

  disconnectNodes(parentID: number, childID: number) {
    const parentNode = getNode(parentID, this.nodes);
    const childNode = getNode(childID, this.nodes);

    parentNode.removeChild(childNode);
  }

  connectNodeToView(nodeID: number, viewTag: number, viewName: string) {
    const node = getNode(nodeID, this.nodes);
    if (node instanceof REAPropsNode) {
      node.connectToView(viewTag, viewName);
    }
  }

  disconnectNodeFromView(nodeID: number, viewTag: number) {
    const node = getNode(nodeID, this.nodes);
    if (node instanceof REAPropsNode) {
      node.disconnectFromView(viewTag);
    }
  }

  attachEvent(viewTag: number, eventName: string, eventNodeID: number) {
    const eventNode = getNode(eventNodeID, this.nodes);
    invariant(
      eventNode instanceof REAEventNode,
      'Event node is of an invalid type'
    );

    const key = getEventKey(viewTag, eventName);
    invariant(
      !this.eventMapping.has(key),
      'Event handler already set for the given view and event type'
    );
    this.eventMapping.set(key, eventNode);
  }

  detachEvent(viewTag: number, eventName: string, eventNodeID: number) {
    const key = getEventKey(viewTag, eventName);
    this.eventMapping.delete(key);
  }

  processEvent(event: RCTEvent) {
    const key = getEventKey(event.viewTag, event.eventName);
    const eventNode = this.eventMapping.get(key);
    if (eventNode != null) {
      eventNode.processEvent(event);
    }
  }

  dispatchEvent(event: RCTEvent) {
    const key = getEventKey(event.viewTag, event.eventName);
    const eventNode = this.eventMapping.get(key);
    if (eventNode != null) {
      this.eventQueue.push(event);
      this.startUpdatingOnAnimationFrame();
    }
  }

  configureNativeProps(nativeProps: Set<string>) {
    this.nativeProps = nativeProps;
  }
}
