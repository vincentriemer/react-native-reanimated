// @flow

import invariant from 'invariant';
import type { REANode } from './REANode';

export function getNodesManager(node: REANode) {
  const nodesManager = node.nodesManager;
  invariant(nodesManager, `nodesManager not bound to REANode`);
  return nodesManager;
}
