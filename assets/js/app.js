/* 共用邏輯：購物車、篩選、清單渲染 */
(function (global) {
  'use strict';

  var D = global.FFDATA;

  /* ---------- 小工具 ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function roleOf(job) {
    for (var i = 0; i < D.roles.length; i++) {
      if (D.roles[i].jobs.indexOf(job) >= 0) return D.roles[i];
    }
    return null;
  }

  function roleClass(job) {
    var r = roleOf(job);
    if (!r) return '';
    if (r.id === 'tank') return 'tank';
    if (r.id === 'healer') return 'healer';
    return 'dps';
  }

  function itemById(id) {
    for (var i = 0; i < D.items.length; i++) if (D.items[i].id === id) return D.items[i];
    return null;
  }

  /** 該職業的完整清單（戒指視為需要 2 件） */
  function fullSetOf(job) {
    return D.items
      .filter(function (it) { return it.jobs.indexOf(job) >= 0; })
      .map(function (it) { return { item: it, qty: it.slot === '戒' ? 2 : 1 }; });
  }

  /** 把某職業的整套裝備（含戒指×2）加入購物車 */
  function addFullSet(cart, job) {
    var set = fullSetOf(job);
    set.forEach(function (s) { cart.add(s.item.id, s.qty); });
    return set.reduce(function (n, s) { return n + s.qty; }, 0);
  }

  var SET_PREFIX = 'set:';
  function isSetId(id) { return typeof id === 'string' && id.indexOf(SET_PREFIX) === 0; }
  function setIdFor(job) { return SET_PREFIX + job; }
  function jobFromSetId(id) { return id.slice(SET_PREFIX.length); }

  var toastHost = null;
  function toast(msg) {
    if (!toastHost) {
      toastHost = el('div', 'toast-host');
      document.body.appendChild(toastHost);
    }
    var t = el('div', 'toast', msg);
    toastHost.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 320);
    }, 1600);
  }

  /* ---------- 購物車 ---------- */
  function Cart(key) {
    this.key = key;
    this.lines = [];
    this.listeners = [];
    this.load();
  }
  Cart.prototype.load = function () {
    try {
      var raw = localStorage.getItem(this.key);
      var arr = raw ? JSON.parse(raw) : [];
      this.lines = arr.filter(function (l) { return l && (isSetId(l.id) || itemById(l.id)); });
    } catch (e) { this.lines = []; }
  };
  Cart.prototype.save = function () {
    try { localStorage.setItem(this.key, JSON.stringify(this.lines)); } catch (e) {}
    this.emit();
  };
  Cart.prototype.on = function (fn) { this.listeners.push(fn); };
  Cart.prototype.emit = function () {
    var self = this;
    this.listeners.forEach(function (fn) { fn(self); });
  };
  Cart.prototype.find = function (id) {
    for (var i = 0; i < this.lines.length; i++) if (this.lines[i].id === id) return this.lines[i];
    return null;
  };
  Cart.prototype.qty = function (id) { var l = this.find(id); return l ? l.qty : 0; };
  Cart.prototype.add = function (id, n) {
    n = n || 1;
    var l = this.find(id);
    if (l) l.qty += n;
    else this.lines.push({ id: id, qty: n });
    this.save();
  };
  Cart.prototype.setQty = function (id, n) {
    if (n <= 0) return this.remove(id);
    var l = this.find(id);
    if (l) { l.qty = n; this.save(); }
  };
  Cart.prototype.remove = function (id) {
    this.lines = this.lines.filter(function (l) { return l.id !== id; });
    this.save();
  };
  Cart.prototype.clear = function () { this.lines = []; this.save(); };
  Cart.prototype.count = function () {
    return this.lines.reduce(function (s, l) { return s + l.qty; }, 0);
  };
  Cart.prototype.isEmpty = function () { return this.lines.length === 0; };
  /** 依裝備清單順序回傳 [{item, qty}]（只含個別裝備，不含整套組合） */
  Cart.prototype.detail = function () {
    var self = this;
    return D.items
      .filter(function (it) { return self.qty(it.id) > 0; })
      .map(function (it) { return { item: it, qty: self.qty(it.id) }; });
  };
  /** 加入某職業的「整套」組合（購物車內合併為單一行） */
  Cart.prototype.addSet = function (job, n) {
    this.add(setIdFor(job), n || 1);
  };
  /** 依購物車實際順序回傳每一行的完整描述，包含個別裝備與整套組合 */
  Cart.prototype.lineDetails = function () {
    return this.lines.map(function (l) {
      if (isSetId(l.id)) {
        var job = jobFromSetId(l.id);
        return { kind: 'set', id: l.id, job: job, qty: l.qty, items: fullSetOf(job) };
      }
      var it = itemById(l.id);
      return it ? { kind: 'item', id: l.id, item: it, qty: l.qty } : null;
    }).filter(function (d) { return d; });
  };
  /** 素材總計 → { 素材名: 數量 }，個別裝備與整套組合都會展開計入 */
  Cart.prototype.materials = function () {
    var map = {};
    function addMats(mats, factor) {
      mats.forEach(function (mt) {
        map[mt.name] = (map[mt.name] || 0) + mt.qty * factor;
      });
    }
    this.lineDetails().forEach(function (d) {
      if (d.kind === 'set') {
        d.items.forEach(function (s) { addMats(s.item.mats, s.qty * d.qty); });
      } else {
        addMats(d.item.mats, d.qty);
      }
    });
    return map;
  };

  /* ---------- 篩選 ---------- */
  function FilterBar(host, opts) {
    this.host = host;
    this.onChange = opts.onChange;
    this.slots = [];   // 選中的部位
    this.jobs = [];    // 選中的職業
    this.render();
  }
  FilterBar.prototype.render = function () {
    var self = this;
    this.host.innerHTML = '';

    // 部位
    var r1 = el('div', 'filter-row');
    r1.appendChild(el('div', 'filter-label', '部位'));
    var c1 = el('div', 'chips');
    ['防具', '飾品', '武器'].forEach(function (g) {
      var b = el('button', 'chip role-head', g);
      b.type = 'button';
      c1.appendChild(b);
      D.slots.filter(function (s) { return D.slotGroup[s] === g; }).forEach(function (s) {
        var chip = el('button', 'chip', s);
        chip.type = 'button';
        chip.dataset.slot = s;
        chip.addEventListener('click', function () { self.toggle('slots', s); });
        c1.appendChild(chip);
      });
      c1.appendChild(el('span', 'chip-sep'));
    });
    r1.appendChild(c1);
    this.host.appendChild(r1);

    // 職業
    var r2 = el('div', 'filter-row');
    r2.appendChild(el('div', 'filter-label', '職業'));
    var c2 = el('div', 'chips');
    D.roles.forEach(function (role) {
      var h = el('button', 'chip role-head', role.name);
      h.type = 'button';
      c2.appendChild(h);
      role.jobs.forEach(function (j) {
        var chip = el('button', 'chip', j);
        chip.type = 'button';
        chip.dataset.job = j;
        chip.addEventListener('click', function () { self.toggle('jobs', j); });
        c2.appendChild(chip);
      });
      c2.appendChild(el('span', 'chip-sep'));
    });
    r2.appendChild(c2);
    this.host.appendChild(r2);

    // 動作
    var r3 = el('div', 'filter-row');
    r3.appendChild(el('div', 'filter-label', ''));
    var acts = el('div', 'filter-actions');
    var reset = el('button', 'btn-mini', '清除篩選');
    reset.type = 'button';
    reset.addEventListener('click', function () {
      self.slots = []; self.jobs = []; self.sync(); self.onChange();
    });
    acts.appendChild(reset);
    r3.appendChild(acts);
    this.host.appendChild(r3);
  };
  FilterBar.prototype.toggle = function (kind, val) {
    var arr = this[kind];
    var i = arr.indexOf(val);
    if (i >= 0) arr.splice(i, 1); else arr.push(val);
    this.sync();
    this.onChange();
  };
  FilterBar.prototype.sync = function () {
    var self = this;
    this.host.querySelectorAll('[data-slot]').forEach(function (n) {
      n.classList.toggle('on', self.slots.indexOf(n.dataset.slot) >= 0);
    });
    this.host.querySelectorAll('[data-job]').forEach(function (n) {
      n.classList.toggle('on', self.jobs.indexOf(n.dataset.job) >= 0);
    });
  };
  FilterBar.prototype.apply = function (items) {
    var self = this;
    return items.filter(function (it) {
      if (self.slots.length && self.slots.indexOf(it.slot) < 0) return false;
      if (self.jobs.length) {
        var hit = it.jobs.some(function (j) { return self.jobs.indexOf(j) >= 0; });
        if (!hit) return false;
      }
      return true;
    });
  };

  /* ---------- 清單渲染 ---------- */
  function renderList(host, items, cart, opts) {
    opts = opts || {};
    host.innerHTML = '';
    if (!items.length) {
      host.appendChild(el('div', 'empty', '沒有符合條件的裝備，試著放寬篩選條件。'));
      return;
    }
    items.forEach(function (it) {
      var row = el('div', 'item');
      if (cart.qty(it.id) > 0) row.classList.add('in-cart');

      var main = el('div', 'item-main');

      var title = el('div', 'item-title');
      title.appendChild(el('span', 'name', it.name));
      if (it.note) title.appendChild(el('span', 'item-note', '（' + it.note + '）'));
      main.appendChild(title);

      var tags = el('div', 'tags');
      tags.appendChild(el('span', 'tag slot', it.slot));
      tags.appendChild(el('span', 'tag group', D.slotGroup[it.slot]));
      it.jobs.forEach(function (j) {
        tags.appendChild(el('span', 'tag job ' + roleClass(j), j));
      });
      main.appendChild(tags);

      if (opts.showMats) {
        var mats = el('div', 'mats');
        it.mats.forEach(function (mt) {
          var isIm = !!D.intermediate[mt.name];
          var n = el('span', 'mat' + (isIm ? ' im' : ''));
          n.appendChild(document.createTextNode(mt.name));
          var b = el('b', null, '×' + mt.qty);
          n.appendChild(b);
          mats.appendChild(n);
        });
        main.appendChild(mats);
      }

      row.appendChild(main);

      var actions = el('div', 'item-actions');
      var q = cart.qty(it.id);
      if (q > 0) {
        var ctrl = el('div', 'qty-ctrl');
        var minus = el('button', null, '−'); minus.type = 'button';
        var num = el('span', 'n', String(q));
        var plus = el('button', null, '+'); plus.type = 'button';
        minus.addEventListener('click', function () { cart.setQty(it.id, cart.qty(it.id) - 1); });
        plus.addEventListener('click', function () { cart.add(it.id, 1); });
        ctrl.appendChild(minus); ctrl.appendChild(num); ctrl.appendChild(plus);
        actions.appendChild(ctrl);
      } else {
        var add = el('button', 'btn-add', '加入購物車');
        add.type = 'button';
        add.addEventListener('click', function () {
          cart.add(it.id, 1);
          toast('已加入：' + it.name);
        });
        actions.appendChild(add);
      }
      row.appendChild(actions);
      host.appendChild(row);
    });
  }

  /* ---------- 懸浮購物車 ---------- */
  function FloatingCart(cart, opts) {
    opts = opts || {};
    this.cart = cart;
    this.opts = opts;

    var fab = el('button', 'cart-fab');
    fab.type = 'button';
    fab.innerHTML = '<span>🛒 購物車</span>';
    var n = el('span', 'n', '0');
    fab.appendChild(n);
    document.body.appendChild(fab);

    var overlay = el('div', 'overlay');
    document.body.appendChild(overlay);

    var panel = el('aside', 'cart-panel');
    var head = el('div', 'cart-head');
    head.appendChild(el('h3', null, '購物車'));
    var headN = el('span', 'n', '');
    head.appendChild(headN);
    var close = el('button', 'cart-close', '×');
    close.type = 'button';
    head.appendChild(close);
    panel.appendChild(head);

    var body = el('div', 'cart-body');
    panel.appendChild(body);

    var foot = el('div', 'cart-foot');
    panel.appendChild(foot);
    document.body.appendChild(panel);

    this.fab = fab; this.badge = n; this.overlay = overlay;
    this.panel = panel; this.body = body; this.foot = foot; this.headN = headN;

    var self = this;
    fab.addEventListener('click', function () { self.toggle(); });
    close.addEventListener('click', function () { self.close(); });
    overlay.addEventListener('click', function () { self.close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') self.close(); });

    this.buildFoot();
    cart.on(function () { self.render(); });
    this.render();
  }
  FloatingCart.prototype.buildFoot = function () {
    var self = this;
    this.foot.innerHTML = '';
    (this.opts.buttons || []).forEach(function (b) {
      var btn = el('button', 'btn ' + (b.cls || ''), b.label);
      btn.type = 'button';
      btn.addEventListener('click', function () { b.onClick(self); });
      self.foot.appendChild(btn);
      b.node = btn;
    });
    var clear = el('button', 'btn btn-ghost', '清空購物車');
    clear.type = 'button';
    clear.addEventListener('click', function () {
      if (self.cart.isEmpty()) return;
      if (confirm('確定要清空購物車嗎？')) { self.cart.clear(); toast('購物車已清空'); }
    });
    this.foot.appendChild(clear);
  };
  FloatingCart.prototype.render = function () {
    var self = this;
    var c = this.cart.count();
    this.badge.textContent = String(c);
    this.headN.textContent = c ? ('共 ' + c + ' 件') : '';
    this.body.innerHTML = '';

    var det = this.cart.lineDetails();
    if (!det.length) {
      this.body.appendChild(el('div', 'empty', '購物車還是空的'));
    } else {
      det.forEach(function (d) {
        var line = el('div', 'cart-line');
        var info = el('div', 'info');
        if (d.kind === 'set') {
          info.appendChild(el('div', 'nm', d.job + ' · 整套裝備'));
          info.appendChild(el('div', 'sub', '共 ' + d.items.length + ' 個部位（含戒指 ×2）'));
        } else {
          info.appendChild(el('div', 'nm', d.item.name));
          info.appendChild(el('div', 'sub', d.item.slot + ' · ' + d.item.jobs.join('、')));
        }
        line.appendChild(info);

        var ctrl = el('div', 'qty-ctrl');
        var minus = el('button', null, '−'); minus.type = 'button';
        var num = el('span', 'n', String(d.qty));
        var plus = el('button', null, '+'); plus.type = 'button';
        minus.addEventListener('click', function () { self.cart.setQty(d.id, self.cart.qty(d.id) - 1); });
        plus.addEventListener('click', function () { self.cart.add(d.id, 1); });
        ctrl.appendChild(minus); ctrl.appendChild(num); ctrl.appendChild(plus);
        line.appendChild(ctrl);

        var rm = el('button', 'rm', '×'); rm.type = 'button';
        rm.title = '移除';
        rm.addEventListener('click', function () { self.cart.remove(d.id); });
        line.appendChild(rm);

        self.body.appendChild(line);
      });
    }
    if (this.opts.onRender) this.opts.onRender(this);
  };
  FloatingCart.prototype.open = function () {
    this.panel.classList.add('open');
    this.overlay.classList.add('on');
  };
  FloatingCart.prototype.close = function () {
    this.panel.classList.remove('open');
    this.overlay.classList.remove('on');
  };
  FloatingCart.prototype.toggle = function () {
    if (this.panel.classList.contains('open')) this.close(); else this.open();
  };

  /* ---------- 一鍵加入整套 ---------- */
  /**
   * opts.asSet = true 時，購物車只會新增「職業全套」這一行合併的紀錄，
   * 不展開成個別裝備（給點單者頁面用，方便閱讀與溝通）。
   * 預設會展開成個別裝備（給 EE 頁面用，才能計算完整素材）。
   */
  function mountBulkSetButton(host, fb, cart, opts) {
    opts = opts || {};
    var btn = el('button', 'btn-add btn-bulk', '');
    btn.type = 'button';
    btn.style.display = 'none';
    host.appendChild(btn);

    function update() {
      if (fb.jobs.length !== 1) {
        btn.style.display = 'none';
        return;
      }
      var job = fb.jobs[0];
      btn.style.display = '';
      btn.textContent = '⚡ 一鍵加入整套（' + job + '）';
    }
    btn.addEventListener('click', function () {
      if (fb.jobs.length !== 1) return;
      var job = fb.jobs[0];
      if (opts.asSet) {
        cart.addSet(job, 1);
        toast('已將「' + job + '」整套裝備加入購物車');
      } else {
        var n = addFullSet(cart, job);
        toast('已加入「' + job + '」整套裝備，共 ' + n + ' 件');
      }
    });
    update();
    return { update: update, node: btn };
  }

  /* ---------- 可勾選的分類素材清單（EE 收集進度 / 點單者自備勾選共用） ---------- */
  /**
   * groups: [{ name, rows: [{ name, qty, ... }] }]
   * isChecked(name) -> bool
   * onToggle(name, checked) -> 由呼叫端負責寫入狀態（例如存 localStorage）
   * opts:
   *   emptyText   groups 為空時顯示的文字
   *   rowSub(row) -> 回傳字串或 null，附加在素材名稱下方的小字說明
   *   rowExtra(row) -> 回傳一個 DOM node，附加在該列最右側（例如複製按鈕）
   *   onRowToggle() -> 單一列勾選狀態改變後呼叫（不會整批重繪）
   *   onDone() -> 每次完整渲染完成後呼叫（初次渲染、或整個分類批次勾選後）
   */
  function renderMaterialChecklist(container, groups, isChecked, onToggle, opts) {
    opts = opts || {};
    container.innerHTML = '';

    if (!groups.length) {
      container.appendChild(el('div', 'empty', opts.emptyText || '目前沒有素材。'));
      if (opts.onDone) opts.onDone();
      return;
    }

    groups.forEach(function (g) {
      var allChecked = g.rows.every(function (r) { return isChecked(r.name); });
      var noneChecked = g.rows.every(function (r) { return !isChecked(r.name); });

      var titleRow = el('div', 'mat-group-title');
      var groupLabel = document.createElement('label');
      groupLabel.className = 'group-check-label';
      var groupCb = document.createElement('input');
      groupCb.type = 'checkbox';
      groupCb.className = 'chk-box';
      groupCb.checked = allChecked;
      groupCb.indeterminate = !allChecked && !noneChecked;
      groupCb.title = '整個分類一次勾選 / 取消';
      groupCb.addEventListener('change', function () {
        var target = groupCb.checked;
        g.rows.forEach(function (r) { onToggle(r.name, target); });
        renderMaterialChecklist(container, groups, isChecked, onToggle, opts);
      });
      groupLabel.appendChild(groupCb);
      groupLabel.appendChild(document.createTextNode(g.name));
      titleRow.appendChild(groupLabel);
      container.appendChild(titleRow);

      g.rows.forEach(function (r) {
        var isDone = isChecked(r.name);
        var row = el('div', 'mat-row' + (isDone ? ' done' : ''));
        var label = document.createElement('label');

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'chk-box';
        cb.checked = isDone;
        cb.addEventListener('change', function () {
          onToggle(r.name, cb.checked);
          row.classList.toggle('done', cb.checked);

          var all = g.rows.every(function (x) { return isChecked(x.name); });
          var none = g.rows.every(function (x) { return !isChecked(x.name); });
          groupCb.checked = all;
          groupCb.indeterminate = !all && !none;

          if (opts.onRowToggle) opts.onRowToggle();
        });
        label.appendChild(cb);

        var nameBox = el('div', 'mat-name');
        var nameLine = el('div');
        nameLine.appendChild(document.createTextNode(r.name));
        // row.scrip 可由呼叫端明確指定（例如展開後的原始素材）；未指定時退回預設判斷
        var isScrip = (typeof r.scrip === 'boolean') ? r.scrip : !!D.intermediate[r.name];
        if (isScrip) {
          nameLine.appendChild(el('span', 'tag-scrip', '神典石'));
        }
        nameBox.appendChild(nameLine);
        if (opts.rowSub) {
          var sub = opts.rowSub(r);
          if (sub) nameBox.appendChild(el('div', 'mat-sub', sub));
        }
        label.appendChild(nameBox);
        label.appendChild(el('div', 'mat-qty', '×' + r.qty));

        row.appendChild(label);
        if (opts.rowExtra) {
          var extra = opts.rowExtra(r);
          if (extra) row.appendChild(extra);
        }
        container.appendChild(row);
      });
    });

    if (opts.onDone) opts.onDone();
  }

  /* ---------- 剪貼簿 ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text); // 失焦或權限被擋時退回舊方法
      });
    }
    return legacyCopy(text);
  }

  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('copy failed'));
      } catch (e) {
        document.body.removeChild(ta);
        reject(e);
      }
    });
  }

  global.FF = {
    el: el,
    D: D,
    Cart: Cart,
    FilterBar: FilterBar,
    FloatingCart: FloatingCart,
    renderList: renderList,
    itemById: itemById,
    fullSetOf: fullSetOf,
    addFullSet: addFullSet,
    mountBulkSetButton: mountBulkSetButton,
    renderMaterialChecklist: renderMaterialChecklist,
    roleOf: roleOf,
    roleClass: roleClass,
    toast: toast,
    copyText: copyText
  };
})(window);
