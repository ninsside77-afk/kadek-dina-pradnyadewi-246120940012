/* Riwayat keputusan petugas. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
  var session = window.IDBUI.guardStaff();
  if (!session) return;

  var historyEl = document.getElementById("history");
  var searchEl = document.getElementById("cari-riwayat");
  var tab = "all";
  var q = "";
  var esc = window.IDBUI.escape;

  var data = window.IDB
    .all()
    .filter(function (s) {
      return s.status === "approved" || s.status === "rejected";
    })
    .sort(function (a, b) {
      return new Date(b.decidedAt || b.createdAt) - new Date(a.decidedAt || a.createdAt);
    });

  function counts() {
    var c = {
      all: data.length,
      approved: data.filter(function (s) { return s.status === "approved"; }).length,
      rejected: data.filter(function (s) { return s.status === "rejected"; }).length,
    };
    Object.keys(c).forEach(function (k) {
      var el = document.querySelector('[data-tab-count="' + k + '"]');
      if (el) el.textContent = c[k];
    });
    document.getElementById("rail-pending").textContent = window.IDB.stats().pending;
  }

  function filtered() {
    return data.filter(function (s) {
      if (tab !== "all" && s.status !== tab) return false;
      if (!q) return true;
      var hay = [s.id, s.nama, s.ormawa, s.roomName].join(" ").toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function shortReason(s) {
    if (s.status !== "rejected") return "—";
    if (!s.reason) return "Tanpa alasan";
    var text = s.reason.length > 64 ? s.reason.slice(0, 64) + "…" : s.reason;
    return '<span title="' + esc(s.reason) + '">' + esc(text) + "</span>";
  }

  function row(s) {
    var href = "petugas-detail.html?id=" + encodeURIComponent(s.id);
    return (
      '<tr data-href="' + href + '">' +
      '<td data-label="ID"><span class="id">' + esc(s.id) + "</span></td>" +
      '<td data-label="Peminjam"><span class="cell-strong">' + esc(s.nama) + "</span>" +
      '<span class="cell-sub">' + esc(s.ormawa) + "</span></td>" +
      '<td data-label="Ruangan">' + esc(s.roomName || "Belum terdaftar") + "</td>" +
      '<td data-label="Tanggal">' + esc(window.IDB.fmtLong(s.date)) + "</td>" +
      '<td data-label="Keputusan"><span class="badge ' + window.IDB.statusClass(s.status) + '">' +
      window.IDB.statusLabel(s.status) + "</span></td>" +
      '<td data-label="Diputuskan"><span class="cell-strong">' +
      esc(window.IDB.fmtStamp(s.decidedAt)) + "</span>" +
      '<span class="cell-sub">oleh ' + esc(s.decidedBy) + "</span></td>" +
      '<td data-label="Alasan" class="cell-reason">' + shortReason(s) + "</td>" +
      '<td class="table__action"><a class="row-link" href="' + href +
      '">Lihat <span aria-hidden="true">→</span></a></td>' +
      "</tr>"
    );
  }

  function render() {
    var items = filtered();
    historyEl.setAttribute("aria-busy", "false");
    document.getElementById("result-count").textContent =
      items.length + " keputusan ditampilkan.";

    if (!items.length) {
      historyEl.innerHTML =
        '<div class="empty empty--staff">' +
        "<h2>Tidak ada keputusan pada tampilan ini.</h2>" +
        "<p>Ubah filter atau kata kunci pencarian.</p>" +
        '<button class="btn btn--outline btn--sm" type="button" data-reset>Tampilkan semua</button>' +
        "</div>";
      var reset = historyEl.querySelector("[data-reset]");
      if (reset) {
        reset.addEventListener("click", function () {
          tab = "all";
          q = "";
          searchEl.value = "";
          syncTabs();
          render();
        });
      }
      return;
    }

    historyEl.innerHTML =
      '<div class="table-wrap"><table class="table">' +
      "<thead><tr>" +
      '<th scope="col">ID</th>' +
      '<th scope="col">Peminjam</th>' +
      '<th scope="col">Ruangan</th>' +
      '<th scope="col">Tanggal</th>' +
      '<th scope="col">Keputusan</th>' +
      '<th scope="col">Diputuskan</th>' +
      '<th scope="col">Alasan</th>' +
      '<th scope="col"><span class="sr-only">Aksi</span></th>' +
      "</tr></thead><tbody>" +
      items.map(row).join("") +
      "</tbody></table></div>";
  }

  function syncTabs() {
    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  document.querySelectorAll("[data-tab]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tab = btn.getAttribute("data-tab");
      syncTabs();
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

  historyEl.addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-href]");
    if (!tr) return;
    if (e.target.closest("a")) return;
    window.location.href = tr.getAttribute("data-href");
  });

  counts();
  render();
  });
})();
