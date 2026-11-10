/* Pengajuan Saya — daftar pengajuan milik pengguna. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
  var session = window.IDBUI.guardUser();
  if (!session) return;

  var listEl = document.getElementById("list");
  var searchEl = document.getElementById("cari-pengajuan");
  var filter = "all";
  var q = "";
  var data = [];

  if (session.role === "petugas") {
    document.getElementById("staff-hint").hidden = false;
  }

  function esc(s) {
    return window.IDBUI.escape(s);
  }

  function filtered() {
    return data.filter(function (s) {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      var hay = [s.id, s.roomName, s.purpose, s.ormawa, s.nama].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function counts() {
    var c = { all: data.length, pending: 0, approved: 0, rejected: 0 };
    data.forEach(function (s) {
      if (c[s.status] != null) c[s.status]++;
    });
    Object.keys(c).forEach(function (k) {
      var el = document.querySelector('[data-count="' + k + '"]');
      if (el) el.textContent = c[k];
    });
  }

  function card(s) {
    var href = "pengajuan-detail.html?id=" + encodeURIComponent(s.id);
    var reason =
      s.status === "rejected" && s.reason
        ? '<p class="sub-card__reason">Alasan: ' + esc(s.reason) + "</p>"
        : "";

    return (
      '<article class="sub-card">' +
      '<div class="sub-card__main">' +
      '<div class="sub-card__top">' +
      '<span class="id">' + esc(s.id) + "</span>" +
      '<span class="badge ' + window.IDB.statusClass(s.status) + '">' +
      window.IDB.statusLabel(s.status) +
      "</span>" +
      "</div>" +
      '<h2 class="sub-card__title"><a href="' + href + '">' + esc(s.purpose) + "</a></h2>" +
      '<p class="sub-card__meta">' +
      esc(s.roomName || "Ruangan belum terdaftar") +
      " · " + window.IDB.fmtLong(s.date) +
      " · " + s.start + "–" + s.end + " WITA" +
      "</p>" +
      '<p class="sub-card__sub">' +
      esc(s.ormawa) + " · " + s.peserta + " peserta · Dikirim " +
      window.IDB.fmtStamp(s.createdAt) +
      "</p>" +
      reason +
      "</div>" +
      '<div class="sub-card__side">' +
      '<a class="btn btn--outline btn--sm" href="' + href + '">Lihat detail</a>' +
      "</div>" +
      "</article>"
    );
  }

  function emptyState() {
    if (!data.length) {
      return (
        '<div class="empty empty--page">' +
        "<h2>Belum ada pengajuan.</h2>" +
        "<p>Pengajuan yang Anda kirim akan muncul di sini beserta status terbarunya.</p>" +
        '<a class="btn btn--accent" href="ajukan.html">Ajukan Peminjaman</a>' +
        "</div>"
      );
    }

    return (
      '<div class="empty empty--page">' +
      "<h2>Tidak ada pengajuan pada filter ini.</h2>" +
      "<p>Ubah filter status atau kata kunci pencarian.</p>" +
      '<button class="btn btn--outline" type="button" data-reset> Tampilkan semua</button>' +
      "</div>"
    );
  }

  function render() {
    counts();
    var items = filtered();

    listEl.setAttribute("aria-busy", "false");

    if (!items.length) {
      listEl.innerHTML = emptyState();
      var reset = listEl.querySelector("[data-reset]");
      if (reset) {
        reset.addEventListener("click", function () {
          filter = "all";
          q = "";
          searchEl.value = "";
          syncChips();
          render();
        });
      }
      return;
    }

    listEl.innerHTML =
      '<div class="sub-list">' + items.map(card).join("") + "</div>" +
      '<p class="sub-list__count">' + items.length + " pengajuan ditampilkan.</p>";
  }

  function syncChips() {
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      var active = btn.getAttribute("data-filter") === filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filter = btn.getAttribute("data-filter");
      syncChips();
      render();
    });
  });

  var timer = null;
  searchEl.addEventListener("input", function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      q = searchEl.value.trim().toLowerCase();
      render();
    }, 120);
  });

  data = window.IDB.mine();
  render();
  });
})();
