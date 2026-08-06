/* Discord OAuth2 登入閘門 + 後端 API 用戶端
 * 這支要放在所有頁面的 <head>（或其他 script 之前），它會：
 *   1. 呼叫 /api/session 判斷是否已登入
 *   2. 未登入時顯示 Discord 登入按鈕
 *   3. 提供 FFAPI.get / post / patch / del / logout
 */
(function (global) {
  'use strict';

  var gateOpen = false;
  var overlay = null;
  var session = null;

  function safeJsonParse(text) {
    if (!text) return {};
    try { return JSON.parse(text); } catch (e) { return {}; }
  }

  function createOverlay(title, message, buttonText) {
    var host = document.createElement('div');
    host.className = 'gate';
    host.innerHTML =
      '<div class="gate-box">' +
      '<div class="gate-mark">EE</div>' +
      '<h1></h1>' +
      '<p></p>' +
      '<div class="gate-err"></div>' +
      '<button type="button" class="btn btn-primary"></button>' +
      '</div>';
    host.querySelector('h1').textContent = title;
    host.querySelector('p').textContent = message;
    var btn = host.querySelector('button');
    btn.textContent = buttonText;
    btn.addEventListener('click', function () {
      location.href = '/api/auth/discord';
    });

    // 本機測試用：直接以假身分登入。伺服器端另外用 DEV_LOGIN 把關，
    // 正式環境按了也只會拿到 404，所以這裡只做畫面上的顯示判斷。
    if (isLocalhost()) {
      var box = host.querySelector('.gate-box');
      var dev = document.createElement('div');
      dev.style.cssText = 'margin-top:14px;display:flex;gap:8px;justify-content:center;';
      [['以「點單者」測試', 'member'], ['以「EE」測試', 'admin']].forEach(function (pair) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn';
        b.textContent = pair[0];
        b.addEventListener('click', function () {
          location.href = '/api/auth/dev?role=' + pair[1];
        });
        dev.appendChild(b);
      });
      box.appendChild(dev);
    }

    return host;
  }

  function isLocalhost() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
  }

  function showGate(message) {
    if (gateOpen) return;
    gateOpen = true;
    document.documentElement.classList.add('locked');
    overlay = createOverlay('請使用 Discord 登入', message || '請先登入後再使用本系統。', '使用 Discord 登入');
    document.body.appendChild(overlay);
  }

  function hideGate() {
    if (!gateOpen) return;
    gateOpen = false;
    document.documentElement.classList.remove('locked');
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function request(method, url, body) {
    var opts = { method: method, headers: {}, credentials: 'same-origin' };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (res) {
      return res.text().then(function (text) {
        var data = safeJsonParse(text);
        if (res.status === 401) {
          showGate(data.error || '請重新登入');
          throw new Error(data.error || '請重新登入');
        }
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || ('請求失敗（' + res.status + '）'));
        }
        return data;
      });
    });
  }

  function fetchSession() {
    return fetch('/api/session', { credentials: 'same-origin' }).then(function (res) {
      return res.text().then(function (text) {
        var data = safeJsonParse(text);
        if (res.status !== 200 || !data.ok) {
          throw new Error(data.error || '未登入');
        }
        return data.session;
      });
    });
  }

  function ready(fn) {
    function start() {
      fetchSession().then(function (sess) {
        session = sess;
        hideGate();
        fn(sess);
      }, function (err) {
        showGate(err.message || '請先登入');
      });
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  }

  function logout() {
    return fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).finally(function () {
      session = null;
      location.reload();
    });
  }

  var API = {
    get: function (u) { return request('GET', u); },
    post: function (u, b) { return request('POST', u, b === undefined ? {} : b); },
    patch: function (u, b) { return request('PATCH', u, b); },
    del: function (u) { return request('DELETE', u); },
    ready: ready,
    logout: logout,
    session: null
  };

  global.FFAPI = API;
})(window);
