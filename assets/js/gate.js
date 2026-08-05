/* 密碼閘門 + 後端 API 用戶端
 *
 * 這支要放在所有頁面的 <head>（或其他 script 之前），它會：
 *   1. 檢查 localStorage 裡的 token 是否還有效
 *   2. 無效就蓋一層全螢幕密碼輸入，通過後才把頁面顯示出來
 *   3. 提供 FFAPI.get / post / del 給各頁呼叫
 */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'ffxiv_auth_token';
  var NICK_KEY = 'ffxiv_nickname';

  function token() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function setToken(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  function request(method, url, body) {
    var opts = { method: method, headers: { 'x-auth': token() } };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    return fetch(url, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.status === 401) {
          setToken('');
          showGate();
          throw new Error(data.error || '請重新輸入密碼');
        }
        if (!r.ok || data.ok === false) throw new Error(data.error || ('請求失敗（' + r.status + '）'));
        return data;
      });
    });
  }

  var API = {
    get: function (u) { return request('GET', u); },
    post: function (u, b) { return request('POST', u, b === undefined ? {} : b); },
    patch: function (u, b) { return request('PATCH', u, b); },
    del: function (u) { return request('DELETE', u); },
    token: token,
    logout: function () { setToken(''); location.reload(); },

    /* ---- 暱稱（點單者用） ---- */
    nickname: function () {
      try { return localStorage.getItem(NICK_KEY) || ''; } catch (e) { return ''; }
    },
    setNickname: function (n) {
      try { n ? localStorage.setItem(NICK_KEY, n) : localStorage.removeItem(NICK_KEY); } catch (e) {}
    },
    /** 確保有暱稱，沒有就跳出輸入框；回傳 Promise<string> */
    ensureNickname: function (force) {
      var self = this;
      var cur = self.nickname();
      if (cur && !force) return Promise.resolve(cur);
      return askOverlay({
        title: '你的暱稱',
        desc: '讓 EE 知道這張訂單是誰下的。之後會記在這台裝置上。',
        placeholder: '例如：小明',
        value: cur,
        type: 'text',
        confirm: '開始點單',
        validate: function (v) {
          if (!v.trim()) return '請輸入暱稱';
          if (v.trim().length > 24) return '暱稱請控制在 24 字以內';
          return null;
        }
      }).then(function (v) {
        self.setNickname(v.trim());
        return v.trim();
      });
    }
  };

  /* ------------------------------------------------------------------ *
   * 全螢幕輸入框
   * ------------------------------------------------------------------ */
  function askOverlay(opts) {
    return new Promise(function (resolve) {
      var host = document.createElement('div');
      host.className = 'gate';
      host.innerHTML =
        '<div class="gate-box">' +
        '<div class="gate-mark">EE</div>' +
        '<h1></h1><p></p>' +
        '<form><input autocomplete="off"><div class="gate-err"></div>' +
        '<button type="submit" class="btn btn-primary"></button></form>' +
        '</div>';

      host.querySelector('h1').textContent = opts.title;
      host.querySelector('p').textContent = opts.desc;
      var input = host.querySelector('input');
      input.type = opts.type || 'text';
      input.placeholder = opts.placeholder || '';
      input.value = opts.value || '';
      if (opts.inputmode) input.inputMode = opts.inputmode;
      var err = host.querySelector('.gate-err');
      var btn = host.querySelector('button');
      btn.textContent = opts.confirm || '確定';

      host.querySelector('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value;
        var msg = opts.validate ? opts.validate(v) : null;
        if (msg) { err.textContent = msg; return; }
        err.textContent = '';
        btn.disabled = true;

        Promise.resolve(opts.submit ? opts.submit(v) : v).then(function (result) {
          host.remove();
          resolve(result === undefined ? v : result);
        }, function (e2) {
          btn.disabled = false;
          err.textContent = e2 && e2.message ? e2.message : '發生錯誤';
          input.select();
        });
      });

      (document.body || document.documentElement).appendChild(host);
      setTimeout(function () { input.focus(); }, 30);
    });
  }

  var gateOpen = false;
  function showGate() {
    if (gateOpen) return;
    gateOpen = true;
    document.documentElement.classList.add('locked');
    askOverlay({
      title: 'EE的FFXIV購物車',
      desc: '請輸入通行密碼。通過後會記在這台裝置上，之後不用再輸入。',
      placeholder: '密碼',
      type: 'password',
      inputmode: 'numeric',
      confirm: '進入',
      validate: function (v) { return v ? null : '請輸入密碼'; },
      submit: function (v) {
        return fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: v })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (d) {
            if (!r.ok || !d.ok) throw new Error(d.error || '密碼錯誤');
            setToken(d.token);
            return d.token;
          });
        });
      }
    }).then(function () {
      gateOpen = false;
      document.documentElement.classList.remove('locked');
      if (typeof global.onGatePassed === 'function') global.onGatePassed();
      else location.reload();
    });
  }

  /** 各頁進入點：驗證通過才執行 fn */
  API.ready = function (fn) {
    global.onGatePassed = function () { document.documentElement.classList.remove('locked'); fn(); };
    document.documentElement.classList.add('locked');

    function start() {
      if (!token()) { showGate(); return; }
      fetch('/api/session', { headers: { 'x-auth': token() } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { document.documentElement.classList.remove('locked'); fn(); }
          else { setToken(''); showGate(); }
        })
        .catch(function () {
          // 後端連不上時不要把畫面鎖死，讓使用者至少看得到靜態內容
          document.documentElement.classList.remove('locked');
          fn();
        });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  };

  API.ask = askOverlay;
  global.FFAPI = API;
})(window);
