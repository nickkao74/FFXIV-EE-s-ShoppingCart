/* 點單者頁面 */
(function () {
  'use strict';

  var D = FF.D;
  var cart = new FF.Cart('ffxiv_cart_order');
  var listEl = document.getElementById('list');
  var countEl = document.getElementById('count');

  var fb = new FF.FilterBar(document.getElementById('filters'), { onChange: function () { bulk.update(); draw(); } });
  var bulk = FF.mountBulkSetButton(document.querySelector('.result-bar'), fb, cart, { asSet: true });

  function draw() {
    var items = fb.apply(D.items);
    countEl.textContent = items.length;
    FF.renderList(listEl, items, cart, { showMats: false });
  }
  cart.on(draw);

  /* ------------------------------------------------------------------
   * 訂單開頭的敬語（複製時才會組出來，畫面上不會顯示）
   * ------------------------------------------------------------------ */
  var _p = [
    '5YGJ5aSn55qE56m25qW1',
    '6IO95bel5ben5YygRUXlpKfkurrvvIzo',
    'q4vmjqXlj5fpgJnku73ljZHlvq7nmoToqILllq4uLi4='
  ];
  function _greeting() {
    try {
      var bin = atob(_p.join(''));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      return '';
    }
  }

  function buildOrderText() {
    var det = cart.lineDetails();
    var sets = det.filter(function (d) { return d.kind === 'set'; });
    var singles = det.filter(function (d) { return d.kind === 'item'; });

    var groupOrder = ['防具', '飾品', '武器'];
    var buckets = {};
    singles.forEach(function (d) {
      var g = D.slotGroup[d.item.slot] || '其他';
      (buckets[g] = buckets[g] || []).push(d);
    });

    var order = groupOrder.concat(Object.keys(buckets).filter(function (k) {
      return groupOrder.indexOf(k) < 0;
    }));

    var lines = [];
    var head = _greeting();
    if (head) { lines.push(head); lines.push(''); }

    lines.push('**訂單內容**（合計 ' + cart.count() + ' 件）');
    lines.push('');

    if (sets.length) {
      lines.push('### 整套裝備');
      sets.forEach(function (d) {
        lines.push('- **' + d.job + ' 全套裝備** ×' + d.qty);
      });
      lines.push('');
    }

    order.forEach(function (g) {
      var arr = buckets[g];
      if (!arr || !arr.length) return;
      lines.push('### ' + g);
      arr.forEach(function (d) {
        lines.push('- **' + d.item.name + '** ×' + d.qty + '　`' + d.item.slot + '`');
      });
      lines.push('');
    });

    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }

  new FF.FloatingCart(cart, {
    buttons: [
      {
        label: '📋 一鍵複製訂單',
        cls: 'btn-primary',
        onClick: function () {
          if (cart.isEmpty()) { FF.toast('購物車是空的，先挑幾件裝備吧'); return; }
          FF.copyText(buildOrderText()).then(function () {
            FF.toast('訂單已複製，貼給 EE 吧！');
          }, function () {
            FF.toast('複製失敗，請檢查瀏覽器權限');
          });
        }
      }
    ]
  });

  draw();
})();
