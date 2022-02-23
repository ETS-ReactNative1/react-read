/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */


// 本文件在模块内定义了flag
// 有多个方法会修改该flag

import {
  getInstanceFromNode,
  getFiberCurrentPropsFromNode,
} from '../client/ReactDOMComponentTree';

// Use to restore controlled state after a change event has fired.

let restoreImpl = null;
let restoreTarget = null;
let restoreQueue = null;

function restoreStateOfTarget(target: Node) {
  // We perform this translation at the end of the event loop so that we
  // always receive the correct fiber here
  const internalInstance = getInstanceFromNode(target);
  if (!internalInstance) {
    // Unmounted
    return;
  }

  if (typeof restoreImpl !== 'function') {
    throw new Error(
      'setRestoreImplementation() needs to be called to handle a target for controlled ' +
        'events. This error is likely caused by a bug in React. Please file an issue.',
    );
  }

  const stateNode = internalInstance.stateNode;
  // Guard against Fiber being unmounted.
  if (stateNode) {
    const props = getFiberCurrentPropsFromNode(stateNode);
    restoreImpl(internalInstance.stateNode, internalInstance.type, props); // 好像是执行一个什么
  }
}

export function setRestoreImplementation(
  impl: (domElement: Element, tag: string, props: Object) => void,
): void {
  restoreImpl = impl;
}

export function enqueueStateRestore(target: Node): void {
  if (restoreTarget) {
    if (restoreQueue) {
      restoreQueue.push(target);
    } else {
      restoreQueue = [target];
    }
  } else {
    restoreTarget = target;
  }
}

// 返回 bool
export function needsStateRestore(): boolean {
  return restoreTarget !== null || restoreQueue !== null;
}

// 
export function restoreStateIfNeeded() {
  if (!restoreTarget) {
    return;
  }
  const target = restoreTarget;
  const queuedTargets = restoreQueue;
  restoreTarget = null;
  restoreQueue = null;

  restoreStateOfTarget(target);
  if (queuedTargets) {
    for (let i = 0; i < queuedTargets.length; i++) {
      restoreStateOfTarget(queuedTargets[i]);
    }
  }
}
