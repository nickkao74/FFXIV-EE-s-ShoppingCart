/* 點單者頁面：裝備清單 */
FFAPI.ready(function (session) {
  'use strict';

  var D = FF.D;
  var cart = new FF.Cart('ffxiv_cart_order');
  var listEl = document.getElementById('list');
  var countEl = document.getElementById('count');
  var whoEl = document.getElementById('who');
  var roleEl = document.getElementById('role');
  var logoutEl = document.getElementById('btn-logout');

  whoEl.textContent = session.displayName;
  roleEl.textContent = session.role === 'admin' ? '管理員' : '一般會員';
  logoutEl.addEventListener('click', function () {
    FFAPI.logout();
  });

  var fb = new FF.FilterBar(document.getElementById('filters'), { onChange: function () { bulk.update(); draw(); } });
  var bulk = FF.mountBulkSetButton(document.querySelector('.result-bar'), fb, cart, { asSet: true });

  function draw() {
    var items = fb.apply(D.items);
    countEl.textContent = items.length;
    FF.renderList(listEl, items, cart, { showMats: false });
  }
  cart.on(draw);

  new FF.FloatingCart(cart, {
    buttons: [
      {
        label: '🛒 前往購物車 / 送出訂單',
        cls: 'btn-primary',
        onClick: function () { location.href = 'order-cart.html'; }
      }
    ]
  });

  draw();
});
