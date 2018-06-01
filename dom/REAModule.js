// @flow

import {
  RCT_EXPORT_MODULE,
  RCT_EXPORT_METHOD,
  RCTFunctionTypeNormal,
  RCTEventEmitter,
  type RCTBridge,
  type RCTUIManager,
} from 'react-native-dom';
import { REANodesManager } from './REANodesManager';

type AnimatedOperation = (nodesManager: REANodesManager) => void;

export type Config = { [string]: any };

@RCT_EXPORT_MODULE('ReanimatedModule')
class REAModule extends RCTEventEmitter {
  bridge: RCTBridge;
  nodesManager: REANodesManager;
  operations: AnimatedOperation[];

  constructor(bridge: RCTBridge) {
    super(bridge);

    this.nodesManager = new REANodesManager(this, bridge.uiManager);
    this.operations = [];

    bridge.eventDispatcher.addDispatchObserver(this);
    (bridge.uiManager: RCTUIManager).observerCoordinator.addObserver(this);
  }

  // -- API

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  createNode(nodeID: number, config: Config) {
    this.addOperationBlock(nodesManager => {
      nodesManager.createNode(nodeID, config);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  dropNode(nodeID: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.dropNode(nodeID);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  connectNodes(parentID: number, childID: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.connectNodes(parentID, childID);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  disconnectNodes(parentID: number, childID: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.disconnectNodes(parentID, childID);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  connectNodeToView(nodeID: number, viewTag: number) {
    const viewName = this.bridge.uiManager.viewNameForReactTag(viewTag);
    this.addOperationBlock(nodesManager => {
      nodesManager.connectNodeToView(nodeID, viewTag, viewName);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  disconnectNodeFromView(nodeID: number, viewTag: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.disconnectNodeFromView(nodeID, viewTag);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  attachEvent(viewTag: number, eventName: string, eventNodeID: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.attachEvent(viewTag, eventName, eventNodeID);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  detachEvent(viewTag: number, eventName: string, eventNodeID: number) {
    this.addOperationBlock(nodesManager => {
      nodesManager.detachEvent(viewTag, eventName, eventNodeID);
    });
  }

  @RCT_EXPORT_METHOD(RCTFunctionTypeNormal)
  configureNativeProps(nativeProps: string[]) {
    this.addOperationBlock(nodesManager => {
      nodesManager.configureNativeProps(new Set(nativeProps));
    });
  }

  // -- Batch Handling

  addOperationBlock(operation: AnimatedOperation) {
    this.operations.push(operation);
  }

  // -- RCTUIManagerObserver

  uiManagerWillPerformMounting(uiManager: RCTUIManager) {
    if (this.operations.length === 0) return;

    const operations = this.operations;
    this.operations = [];

    const nodesManager = this.nodesManager;
    uiManager.addUIBlock(() => {
      for (let operation of operations) {
        operation(nodesManager);
      }
    });
  }

  // -- Events

  supportedEvents() {
    return ['onReanimatedCall', 'onReanimatedPropsChange'];
  }

  eventDispatcherWillDispatchEvent(event: *) {
    this.nodesManager.dispatchEvent(event);
  }
}

export default REAModule;
