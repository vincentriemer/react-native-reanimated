// @flow

import invariant from 'invariant';
import { REANode } from './REANode';
import { type Config } from '../REAModule';
import { getNodesManager } from './utils';

const EPS = 1e-5;

class REABezierNode extends REANode {
  inputNodeID: number;

  ax: number;
  bx: number;
  cx: number;
  ay: number;
  by: number;
  cy: number;

  constructor(nodeID: number, config: Config) {
    super(nodeID, config);
    this.inputNodeID = config.input;

    const mX1 = config.mX1;
    const mY1 = config.mY1;
    const mX2 = config.mX2;
    const mY2 = config.mY2;

    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1)
    this.cx = 3.0 * mX1;
    this.bx = 3.0 * (mX2 - mX1) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * mY1;
    this.by = 3.0 * (mY2 - mY1) - this.cy;
    this.ay = 1.0 - this.cy - this.by;
  }

  sampleCurveX(t: number) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((this.ax * t + this.bx) * t + this.cx) * t;
  }

  sampleCurveY(t: number) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
  }

  sampleCurveDerivativeX(t: number) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
  }

  solveCurveXWithEpsilon(x: number, epsilon: number) {
    let t0: number, t1: number, t2: number, x2: number, d2: number;
    let i: number;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {
      x2 = this.sampleCurveX(t2) - x;
      if (Math.abs(x2) < epsilon) return t2;
      d2 = this.sampleCurveDerivativeX(t2);
      if (Math.abs(d2) < 1e-6) break;
      t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {
      x2 = this.sampleCurveX(t2);
      if (Math.abs(x2 - x) < epsilon) return t2;
      if (x > x2) t0 = t2;
      else t1 = t2;
      t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure
    return t2;
  }

  evaluate() {
    const nodesManager = getNodesManager(this);
    const x = nodesManager.findNodeById(this.inputNodeID).value();
    const y = this.sampleCurveY(this.solveCurveXWithEpsilon(x, EPS));
    return y;
  }
}
