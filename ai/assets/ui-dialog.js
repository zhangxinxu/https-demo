/**
 * ui-dialog.js（ESM）—— 把 <dialog is="ui-dialog"> 升级成 AntD 风格的弹框组件
 *
 * 引入：
 *   <link rel="stylesheet" href="./assets/ui-dialog.css">
 *   <script type="module">
 *     import Dialog from './assets/ui-dialog.js';
 *   </script>
 *
 * Safari 至今不支持 customized built-in elements，
 * 这里探测到不支持时才动态加载 ./safari-polyfill.min.js（顶层 await，保证先于 define 执行）。
 *
 * 声明式：
 *   <dialog is="ui-dialog" data-params="{ title: '标题', buttons: [{ type: 'primary', value: '好' }] }">
 *     内容
 *   </dialog>
 *
 * 命令式：
 *   Dialog.alert(content, options)            返回 Promise<void>
 *   Dialog.confirm(content, options)          返回 Promise<boolean>
 *
 * data-params 只认三个字段，可只写需要覆盖的：
 *   title    {String}  默认 ''，空字符串表示不显示标题
 *   closable {Boolean} 默认 true，是否显示右上角关闭按钮（同时决定点遮罩能否关闭）
 *   buttons  {Array}   默认 [{}, {}]，每一项 { type, value, events }
 *            type   'primary'（默认，蓝色）| 'danger'（红色）| 'normal'（白底灰边）
 *            value  按钮文案，缺省时第一个是「确定」，其余是「取消」
 *            events 点击回调 (btn, dialog, index)，返回 false 可以阻止自动关闭
 *
 * 按钮按数组顺序从左到右排列，整组靠右。
 */

const BUTTON_TYPES = ['primary', 'danger', 'normal'];

/* data-params 里可能有函数，JSON.parse 会直接崩，所以用 Function 兜一层 */
function parseParams(raw) {
  if (!raw) return {};

  try {
    return new Function('return (' + raw + ')')();
  } catch (err) {
    console.warn('[ui-dialog] data-params 解析失败：', err);
    return {};
  }
}

function normalize(params) {
  const p = params || {};

  return {
    title: typeof p.title === 'string' ? p.title : '',
    closable: p.closable !== false,
    buttons: Array.isArray(p.buttons) ? p.buttons : [{}, {}]
  };
}

function render(el, params) {
  if (el.__uiContent === undefined) el.__uiContent = el.innerHTML;

  el.innerHTML = '';
  el.classList.add('ui-dialog');

  const modal = document.createElement('div');
  modal.className = 'ui-modal';

  /* 有标题或者允许关闭，才渲染头部 */
  if (params.title || params.closable) {
    const head = document.createElement('div');
    head.className = 'ui-modal-head';

    if (params.title) {
      const title = document.createElement('h3');
      title.className = 'ui-modal-title';
      title.textContent = params.title;
      head.append(title);
    }

    if (params.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'ui-modal-close';
      closeBtn.setAttribute('aria-label', '关闭');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => el.close());
      head.append(closeBtn);
    }

    modal.append(head);
  }

  /* 内容区用的是升级前的原始 innerHTML */
  const body = document.createElement('div');
  body.className = 'ui-modal-body';
  body.innerHTML = el.__uiContent;
  modal.append(body);

  /* 按钮区：数组顺序即从左到右的顺序 */
  if (params.buttons.length) {
    const foot = document.createElement('div');
    foot.className = 'ui-modal-foot';

    params.buttons.forEach((raw, index) => {
      const item = raw || {};

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ui-btn ui-btn-' + (BUTTON_TYPES.includes(item.type) ? item.type : 'primary');
      btn.textContent = item.value || (index === 0 ? '确定' : '取消');

      btn.addEventListener('click', () => {
        const result = typeof item.events === 'function' ? item.events(btn, el, index) : undefined;
        /* 回调返回 false 可以拦下自动关闭 */
        if (result !== false) el.close();
      });

      foot.append(btn);
    });

    modal.append(foot);
  }

  el.append(modal);
}

function init(el, params) {
  /* 声明式升级和命令式创建都会进来，用标记保证只渲染一次 */
  if (el.__uiInited) return;
  el.__uiInited = true;

  el.__uiParams = normalize(params || parseParams(el.getAttribute('data-params')));
  render(el, el.__uiParams);

  /* 点遮罩关闭：target 是 dialog 自身才说明点在了 ::backdrop 上 */
  el.addEventListener('click', (e) => {
    if (e.target === el && el.__uiParams.closable) el.close();
  });
}

/* 探测原生是否支持 customized built-in elements（Safari 会抛错） */
function supportsBuiltInExtends() {
  const probe = 'ui-dialog-probe';

  try {
    customElements.define(probe, class extends HTMLBRElement {}, { extends: 'br' });

    /* 有的浏览器能 define，但 createElement 的 is 不生效，所以两边都要验 */
    return document.createElement('br', { is: probe }) instanceof customElements.get(probe);
  } catch (err) {
    return false;
  }
}

/* polyfill 是普通脚本（IIFE），用 script 标签动态插入，保证它在原来的执行环境里跑 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('加载失败：' + src));
    document.head.append(script);
  });
}

if (!supportsBuiltInExtends()) {
  try {
    await loadScript(new URL('./safari-polyfill.min.js', import.meta.url).href);
  } catch (err) {
    console.warn('[ui-dialog] Safari polyfill 加载失败：', err);
  }
}

class UIDialogElement extends HTMLDialogElement {
  connectedCallback() {
    init(this);
  }
}

try {
  customElements.define('ui-dialog', UIDialogElement, { extends: 'dialog' });
} catch (err) {
  console.warn('[ui-dialog] 自定义内置元素注册失败：', err);
}

/* ---------- 命令式创建 ---------- */
function createDialog(content, params) {
  const el = document.createElement('dialog', { is: 'ui-dialog' });
  el.setAttribute('is', 'ui-dialog');
  el.__uiContent = content;

  init(el, params);
  document.body.append(el);
  el.showModal();

  return el;
}

/* ---------- 对外 API ---------- */
class Dialog {
  static alert(content, options) {
    const opts = options || {};

    return new Promise((resolve) => {
      const el = createDialog(content, {
        title: opts.title === undefined ? '提示' : opts.title,
        closable: opts.closable !== false,
        buttons: opts.buttons || [{ type: 'primary', value: '确定' }]
      });

      el.addEventListener('close', () => {
        el.remove();
        resolve();
      }, { once: true });
    });
  }

  static confirm(content, options) {
    const opts = options || {};

    return new Promise((resolve) => {
      let confirmed = false;

      const el = createDialog(content, {
        title: opts.title === undefined ? '确认' : opts.title,
        closable: opts.closable !== false,
        buttons: opts.buttons || [
          { type: 'primary', value: '确定', events: () => { confirmed = true; } },
          { type: 'normal', value: '取消', events: () => { confirmed = false; } }
        ]
      });

      /* 点 ×、按 Esc、点遮罩都会走到这里，统一按「未确认」收尾 */
      el.addEventListener('close', () => {
        el.remove();
        resolve(confirmed);
      }, { once: true });
    });
  }
}

export { UIDialogElement, init as setupDialog };
export default Dialog;
