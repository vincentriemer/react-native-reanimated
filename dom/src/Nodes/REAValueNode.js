// @flow

import { REANode } from './REANode';
import { type Config } from '../REAModule';

export class REAValueNode extends REANode {
  _value: number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this._value = config['value'];
  }

  setValue(value: number) {
    this._value = value;
    this.forceUpdateMemoizedValue(value);
  }

  evaluate() {
    return this._value;
  }
}
