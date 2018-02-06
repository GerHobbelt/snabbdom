import {vnode, VNode, VNodeData} from './vnode';
export type VNodes = Array<VNode>;
export type VNodesSparse = VNode | Array<VNode | undefined | null>;
import {isArray, isPrimitive, isDef} from './snabbdom';

function addNS(data: any, children: VNodes | undefined, sel: string | undefined): void {
  data.ns = 'http://www.w3.org/2000/svg';
  if (sel !== 'foreignObject' && isDef(children)) {
    for (let i = 0; i < children.length; ++i) {
      let childData = children[i].data;
      if (isDef(childData)) {
        addNS(childData, (children[i] as VNode).children as VNodes, children[i].sel);
      }
    }
  }
}

export function h(sel: string): VNode;
export function h(sel: string, data: VNodeData): VNode;
export function h(sel: string, text: string): VNode;
export function h(sel: string, children: VNodesSparse): VNode;
export function h(sel: string, data: VNodeData, text: string): VNode;
export function h(sel: string, data: VNodeData, children: VNodesSparse): VNode;
export function h(sel: any, b?: any, c?: any): VNode {
  var data: VNodeData = {}, children: any, text: any, i: number;
  if (isDef(c)) {
    data = b;
    if (isArray(c)) { children = c; }
    else if (isPrimitive(c)) { text = c; }
    else if (c && c.sel) { children = [c]; }
    if (isArray(b)) { children = b; }
    else if (isPrimitive(b)) { text = b; }
    else if (b && b.sel) { children = [b]; }
    else { data = b; }
  } else if (isDef(b)) {
  }
  if (isArray(children)) {
    for (i = 0; i < children.length; ++i) {
      if (isPrimitive(children[i])) children[i] = vnode(undefined, undefined, undefined, children[i], undefined);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
      (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
    addNS(data, children, sel);
  }
  return vnode(sel, data, children, text, undefined);
};

export default h;
