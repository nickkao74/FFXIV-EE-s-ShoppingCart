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
    return host;
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

  function simulateMember() {
    return request('POST', '/api/session/simulate-member', {}).then(function () {
      location.reload();
    });
  }

  function mountSessionControls(sess) {
    if (document.getElementById('session-controls')) return;

    var header = document.querySelector('.site-header .wrap');
    if (!header) return;

    var host = document.createElement('div');
    host.id = 'session-controls';
    host.className = 'session-controls';

    if (sess && sess.role === 'admin') {
      var simulateBtn = document.createElement('button');
      simulateBtn.type = 'button';
      simulateBtn.className = 'btn-mini';
      simulateBtn.textContent = '模擬一般會員';

      simulateBtn.addEventListener('click', function () {
        var ok = confirm(
          '確定要切換成一般會員權限嗎？' +
          '恢復管理員權限需要登出並重新使用 Discord 登入。'
        );

        if (!ok) return;

        simulateBtn.disabled = true;

        simulateMember().catch(function (err) {
          simulateBtn.disabled = false;
          alert(err.message || '切換權限失敗');
        });
      });

      host.appendChild(simulateBtn);
    }

    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn-mini';
    logoutBtn.textContent = '登出';

    logoutBtn.addEventListener('click', function () {
      logoutBtn.disabled = true;

      logout().catch(function () {
        location.href = '/index.html';
      });
    });

    host.appendChild(logoutBtn);

    var nav = header.querySelector('.header-nav');
    if (nav) {
      nav.appendChild(host);
    } else {
      header.appendChild(host);
    }
  }

  function ready(fn) {
    function start() {
      fetchSession().then(function (sess) {
        session = sess;
        API.session = sess;
        hideGate();
        mountSessionControls(sess);
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
    return fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(function () {
      return null;
    }).finally(function () {
      session = null;
      API.session = null;
      if (location.pathname !== '/index.html') {
        location.href = '/index.html';
      }
    });
  }

  var API = {
    get: function (u) { return request('GET', u); },
    post: function (u, b) { return request('POST', u, b === undefined ? {} : b); },
    patch: function (u, b) { return request('PATCH', u, b); },
    del: function (u) { return request('DELETE', u); },
    ready: ready,
    logout: logout,
    simulateMember: simulateMember,
    session: null
  };

  global.FFAPI = API;
})(window);
