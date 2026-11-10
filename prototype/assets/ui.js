/* ==========================================================================
   KERANGKA ANTARMUKA — navigasi, sesi, toast
   Dipakai semua halaman. Tidak menyimpan data pengajuan.
   ========================================================================== */

(function (global) {
  "use strict";

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function toast(message, tone) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      el.id = "toast";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.hidden = true;
      el.innerHTML =
        '<span id="toast-message"></span>' +
        '<button class="toast__close" type="button" aria-label="Tutup pemberitahuan" data-toast-close>×</button>';
      document.body.appendChild(el);

      var closeBtn = $("[data-toast-close]", el);
      if (closeBtn) closeBtn.addEventListener("click", hideToast);
    }

    var msg = $("#toast-message");
    if (!msg) return;

    msg.textContent = message;
    el.className =
      "toast" + (tone === "danger" ? " toast--danger" : tone === "warn" ? " toast--warn" : "");
    el.hidden = false;

    global.clearTimeout(toast._timer);
    toast._timer = global.setTimeout(hideToast, tone === "danger" ? 7000 : 5000);
  }

  function hideToast() {
    var el = $("#toast");
    if (el) el.hidden = true;
  }

  function currentFile() {
    var parts = global.location.pathname.split("/");
    return parts[parts.length - 1] || "index.html";
  }

  function param(name) {
    return new URLSearchParams(global.location.search).get(name);
  }

  function loginUrl(next, reason) {
    var params = new URLSearchParams();
    if (next) params.set("next", next);
    if (reason) params.set("alasan", reason);
    var q = params.toString();
    return "masuk.html" + (q ? "?" + q : "");
  }

  function logout() {
    global.IDB.logout().then(function () {
      toast("Anda telah keluar dari sesi ini.");
      global.setTimeout(function () {
        global.location.href = "masuk.html";
      }, 350);
    });
  }

  function showLoadError(message) {
    if (document.body.classList.contains("authv2-body")) return;
    if (document.querySelector("[data-load-error]")) return;
    var main = document.getElementById("main");
    if (!main) {
      toast(message, "danger");
      return;
    }
    var wrap = document.createElement("div");
    wrap.className = "shell";
    wrap.setAttribute("data-load-error", "");
    wrap.innerHTML =
      '<div class="banner banner--danger" role="alert">' +
      "<div>" +
      '<p class="banner__title">Data belum dapat dimuat.</p>' +
      "<p>" +
      escapeHtml(message) +
      "</p>" +
      "</div>" +
      "</div>";
    main.insertBefore(wrap, main.firstChild);
  }

  function initChrome() {
    var toggle = $("[data-nav-toggle]");
    var header = $(".site-header");

    if (toggle && header) {
      var closeNav = function (refocus) {
        if (!header.classList.contains("is-open")) return;
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        if (refocus) toggle.focus();
      };

      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.textContent = open ? "Tutup" : "Menu";
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeNav(true);
      });

      document.addEventListener("pointerdown", function (e) {
        if (!header.classList.contains("is-open")) return;
        if (header.contains(e.target)) return;
        closeNav(false);
      });
    }

    // Tandai navigasi aktif berdasarkan nama berkas.
    var file = currentFile();
    $$(".nav__link, .rail__link").forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href) return;
      var target = href.split("?")[0];
      var match =
        (target === "index.html" && (file === "index.html" || file === "")) ||
        target === file;
      if (match) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    // Tanggal pada bilah merek, mengikuti tanggal perangkat.
    var today = global.IDB && global.IDB.fmtLong ? global.IDB.fmtLong(new Date()) : "";
    $$("[data-today]").forEach(function (el) {
      if (today) el.textContent = today;
    });

    // Sesi: tautan Masuk berubah menjadi Keluar.
    var auth = $("[data-auth-link]");
    var session = global.IDB.session();

    if (auth && session) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "link-muted link-muted--button";
      btn.textContent = "Keluar";
      btn.setAttribute("data-logout", "");
      auth.replaceWith(btn);

      if (session.role === "petugas") {
        var staffLink = document.createElement("a");
        staffLink.className = "link-muted header__staff-link";
        staffLink.href = "petugas.html";
        staffLink.textContent = "Area petugas";
        btn.parentNode.insertBefore(staffLink, btn);
      }
    }

    $$("[data-officer-name]").forEach(function (el) {
      if (session) el.textContent = session.name;
    });

    $$("[data-logout]").forEach(function (el) {
      el.addEventListener("click", logout);
    });

    $$("[data-pending]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        toast("Bagian ini belum tersedia.", "warn");
      });
    });

    var close = $("[data-toast-close]");
    if (close) close.addEventListener("click", hideToast);
  }

  // Halaman petugas: wajib sesi petugas.
  function guardStaff() {
    var session = global.IDB.session();
    var file = currentFile();
    var here = file + (global.location.search || "");

    if (!session) {
      global.location.replace(loginUrl(here, "masuk"));
      return null;
    }

    if (session.role !== "petugas") {
      global.location.replace("tidak-berizin.html");
      return null;
    }

    return session;
  }

  // Halaman pribadi: wajib sesi (peminjam atau petugas).
  function guardUser() {
    var session = global.IDB.session();
    var file = currentFile();
    var here = file + (global.location.search || "");

    if (!session) {
      global.location.replace(loginUrl(here, "masuk"));
      return null;
    }

    return session;
  }

  function bindDialogs() {
    $$("dialog").forEach(function (dialog) {
      dialog.addEventListener("click", function (e) {
        if (e.target === dialog) dialog.close();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var started = false;

  function start() {
    if (started) return;
    started = true;
    var boot = global.IDB && global.IDB.ready ? global.IDB.ready : Promise.resolve();
    boot.then(function () {
      if (global.IDB && global.IDB.loadError && global.IDB.loadError()) {
        showLoadError(global.IDB.loadError());
      }
      initChrome();
      bindDialogs();
    });
  }

  global.IDBUI = {
    toast: toast,
    hideToast: hideToast,
    loginUrl: loginUrl,
    param: param,
    currentFile: currentFile,
    guardStaff: guardStaff,
    guardUser: guardUser,
    escape: escapeHtml,
    init: start,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
