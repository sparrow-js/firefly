
import ReactDOM from 'react-dom';
import {
    ILowCodePluginContext,
} from '@firefly/auto-designer';

export const MAX_ZINDEX = 2147483647;

export default function init(cxt: ILowCodePluginContext) {
    if (typeof window === 'undefined' || typeof document == 'undefined') {
        return;
    }
    if (document.getElementById('locatorjs-wrapper')) {
        return;
    }
    cxt.hotkey.bind('option', () => {

    });

    const style = document.createElement('style');
    style.id = 'locator';
    style.innerHTML = `
    #locatorjs-layer {
      all: initial;
      pointer-events: none;
    }
    #locatorjs-layer * {
      box-sizing: border-box;
    }
    #locatorjs-labels-wrapper {
      display: flex;
      gap: 8px;
    }
    .locatorjs-tree-node:hover {
      background-color: #eee;
    }
  `;

  const globalStyle = document.createElement('style');
  globalStyle.id = 'locatorjs-global-style';
  globalStyle.innerHTML = `
      #locatorjs-wrapper {
        z-index: ${MAX_ZINDEX};
        pointer-events: none;
        position: fixed;
      }
      .locatorjs-active-pointer * {
        cursor: pointer !important;
      }
    `;

  const wrapper = document.createElement('div');
  wrapper.setAttribute('id', 'locatorjs-wrapper');

  const shadow = wrapper.attachShadow({ mode: 'open' });
  const layer = document.createElement('div');
  layer.setAttribute('id', 'locatorjs-layer');

  // wrapper.appendChild(style);
  // wrapper.appendChild(layer);
  shadow.appendChild(style);
  shadow.appendChild(layer);

  document.body.appendChild(wrapper);
  document.head.appendChild(globalStyle);
}