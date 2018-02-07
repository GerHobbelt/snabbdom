import {VNode} from '../vnode';
import {Module} from './module';

export type On =
  {[N in keyof HTMLElementEventMap]?: (ev: HTMLElementEventMap[N]) => void}
  & {[event: string]: EventListener};

export interface VEventData {
  on?: On;
}

export interface EventAPI {
  addEvent(elm: Node, ev: string, fn: (event: Event) => void): void;
  removeEvent(elm: Node, ev: string, fn: (event: Event) => void): void;
}

function invokeHandler(handler: any, vnode?: VNode<VEventData>, event?: Event): void {
  if (typeof handler === "function") {
    // call function handler
    handler.call(vnode, event, vnode);
  } else if (typeof handler === "object") {
    // call handler with arguments
    if (typeof handler[0] === "function") {
      // special case for single argument for performance
      if (handler.length === 2) {
        handler[0].call(vnode, handler[1], event, vnode);
      } else {
        const args = handler.slice(1);
        args.push(event);
        args.push(vnode);
        handler[0].apply(vnode, args);
      }
    } else {
      // call multiple handlers
      for (let i = 0; i < handler.length; i++) {
        invokeHandler(handler[i]);
      }
    }
  }
}

function handleEvent(event: Event, vnode: VNode<VEventData>) {
  const name = event.type,
    {on} = vnode.data as VEventData;

  // call event handler(s) if exists
  if (on && on[name]) {
    invokeHandler(on[name], vnode, event);
  }
}

function createListener() {
  return function handler(event: Event) {
    handleEvent(event, (handler as any).vnode);
  }
}

export function eventListenersModule(api: EventAPI): Module<VEventData> {
  function updateEventListeners(oldVnode: VNode<VEventData>, vnode?: VNode<VEventData>): void {
    const {on: oldOn} = oldVnode.data as VEventData,
      oldListener = (oldVnode as any).listener,
      oldElm = oldVnode.elm as Node,
      on = vnode && (vnode.data as VEventData).on,
      elm = (vnode && vnode.elm) as Node;
    let name: string;

    // optimization for reused immutable handlers
    if (oldOn === on) {
      return;
    }

    // remove existing listeners which no longer used
    if (oldOn && oldListener) {
      // if element changed or deleted we remove all existing listeners unconditionally
      if (!on) {
        for (name in oldOn) {
          // remove listener if element was changed or existing listeners removed
          api.removeEvent(oldElm, name, oldListener);
        }
      } else {
        for (name in oldOn) {
          // remove listener if existing listener removed
          if (!on[name]) {
            api.removeEvent(oldElm, name, oldListener);
          }
        }
      }
    }

    // add new listeners which has not already attached
    if (on) {
      // reuse existing listener or create new
      const listener = (vnode as any).listener = (oldVnode as any).listener || createListener();
      // update vnode for listener
      listener.vnode = vnode;

      // if element changed or added we add all needed listeners unconditionally
      if (!oldOn) {
        for (name in on) {
          // add listener if element was changed or new listeners added
          api.addEvent(elm, name, listener);
        }
      } else {
        for (name in on) {
          // add listener if new listener added
          if (!oldOn[name]) {
            api.addEvent(elm, name, listener);
          }
        }
      }
    }
  }

  return {
    create: updateEventListeners,
    update: updateEventListeners,
    destroy: updateEventListeners
  };
}

export default eventListenersModule;
