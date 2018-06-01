// @flow
import invariant from 'invariant';
import { REANode } from './REANode';
import { REAStyleNode } from './REAStyleNode';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

export class REAPropsNode extends REANode {
  connectedViewTag: ?number;
  connectedViewName: ?string;
  propsConfig: { [string]: number };

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.propsConfig = config['props'];
  }

  connectToView(viewTag: number, viewName: string) {
    this.connectedViewTag = viewTag;
    this.connectedViewName = viewName;
    this.dangerouslyRescheduleEvaluate();
  }

  disconnectFromView(viewTag: number) {
    this.connectedViewTag = null;
    this.connectedViewName = null;
  }

  evaluate() {
    const nativeProps = {};
    const jsProps = {};

    const nodesManager = getNodesManager(this);

    const addBlock = (key: string, obj: any) => {
      if (nodesManager.nativeProps && nodesManager.nativeProps.has(key)) {
        nativeProps[key] = obj;
      } else {
        jsProps[key] = obj;
      }
    };

    for (let prop of Object.keys(this.propsConfig)) {
      const propNode = nodesManager.findNodeById(this.propsConfig[prop]);

      if (propNode instanceof REAStyleNode) {
        const value = propNode.value();
        Object.entries(value).forEach(([key, obj]) => addBlock(key, obj));
      } else {
        addBlock(prop, propNode.value());
      }
    }

    let connectedViewTag;
    if ((connectedViewTag = this.connectedViewTag) != null) {
      if (Object.keys(nativeProps).length > 0) {
        nodesManager.uiManager &&
          nodesManager.uiManager.synchronouslyUpdateView(
            connectedViewTag,
            this.connectedViewName,
            nativeProps
          );
      }
      if (Object.keys(jsProps).length > 0) {
        nodesManager.reanimatedModule &&
          nodesManager.reanimatedModule.sendEventWithName(
            'onReanimatedPropsChange',
            {
              viewTag: connectedViewTag,
              props: jsProps,
            }
          );
      }
    }

    return 0;
  }

  update() {
    // Since we are updating nodes after detaching them from views there is a time where it's
    // possible that the view was disconnected and still receive an update, this is normal and we can
    // simply skip that update.
    if (this.connectedViewTag == null) {
      return;
    }

    // trigger for side effect
    this.value();
  }
}
