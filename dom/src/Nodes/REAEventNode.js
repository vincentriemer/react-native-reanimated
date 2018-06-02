// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import { REAValueNode } from './REAValueNode';
import { type RCTEvent } from '../REANodesManager';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REAEventNode extends REANode {
  argMapping: any[];

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.argMapping = config['argMapping'];
  }

  processEvent(event: RCTEvent) {
    const nodesManager = getNodesManager(this);
    const args = event.arguments;
    // argMapping is an array of eventPaths, each even path ends with a target node ID
    for (let eventPath of this.argMapping) {
      // Supported events args are in the following order: viewTag, eventName, eventData.
      let value = args[2];
      for (let i = 0; i < eventPath.length; i++) {
        if (i < eventPath.length - 1) {
          value = value[eventPath[i]];
        } else {
          const node = nodesManager.findNodeById(eventPath[i]);
          invariant(
            node instanceof REAValueNode,
            `Event cannot be mapped to a node other than an REAValueNode`
          );
          node.setValue(value);
        }
      }
    }
  }
}
