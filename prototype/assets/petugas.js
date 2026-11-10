/* Daftar pengajuan petugas — antrean pemeriksaan. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
  var session = window.IDBUI.guardStaff();
  if (!session) return;

  var queueEl = document.getElementById("queue");
  var searchEl = document.getElementById("cari");
  var tab = "pending";
  var q = "";
  var data = window.IDB.all();
  var esc = window.IDBUI.escape;

  function counts() {
    var c = { pending: 0, approved: 0, rejected: 0, all: data.length };
    data.forEach(function (s) {
      if (c[s.status] != null) c[s.status]++;
    });

    ["pending", "approved", "rejected", "all"].forEach(function (k) {
      var el = document.querySelector('[data-tab-count="' + k + '"]');
      if (el) el.textContent = c[k];
    });

    document.getElementById("stat-pending").textContent = c.pending;
    document.getElementById("stat-approved").textContent = c.approved;
    document.getElementById("stat-rejected").textContent = c.rejected;
    document.getElementById("stat-total").textContent = c.all;
    document.getElementById("rail-pending").textContent = c.pending;
  }

  function conflicts() {
    return data.filter(function (s) {
      if (s.status !== "pending") return false;
      return window.IDB.conflictsFor(s).approved.length > 0;
    });
  }

  function renderConflictBanner() {
    var list = conflicts();
    var box = document.getElementById("conflict-summary");
    if (!list.length) {
      box.hidden = true;
      return;
    }
    document.getElementById("conflict-text").textContent =
      list.length +
      " pengajuan menunggu bertabrakan dengan jadwal yang sudah disetujui. Periksa jadwal sebelum menyetujui.";
    box.hidden = false;
  }

  function filtered() {
    var items = data.filter(function (s) {
      if (tab !== "all" && s.status !== tab) return false;
      if (!q) return true;
      var hay = [s.id, s.nama, s.ormawa, s.roomName, s.purpose]
        .join(" ")
        .toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    items.sort(function (a, b) {
      if (tab === "pending") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      var ta = a.decidedAt || a.createdAt;
      var tb = b.decidedAt || b.createdAt;
      return new Date(tb) - new Date(ta);
    });

    return items;
  }

  function row(s) {
    var href = "petugas-detail.html?id=" + encodeURIComponent(s.id);
    var action = s.status === "pending" ? "Periksa" : "Lihat";
    var age =
      s.status === "pending"
        ? '<span class="age">' + esc(window.IDB.ageLabel(s.createdAt)) + "</span>"
        : "";

    return (
      '<tr data-href="' + href + '">' +
      '<td data-label="ID"><span class="id">' + esc(s.id) + "</span></td>" +
      '<td data-label="Peminjam"><span class="cell-strong">' + esc(s.nama) + "</span>" +
      '<span class="cell-sub">' + esc(s.ormawa) + "</span></td>" +
      '<td data-label="Ruangan">' + esc(s.roomName || "Belum terdaftar") + "</td>" +
      '<td data-label="Tanggal">' + esc(window.IDB.fmtLong(s.date)) + "</td>" +
      '<td data-label="Waktu"><span class="mono">' +
      esc(s.start + "–" + s.end) +
      "</span></td>" +
      '<td data-label="Peserta">' + esc(String(s.peserta)) + "</td>" +
      '<td data-label="Status"><span class="badge ' +
      window.IDB.statusClass(s.status) +
      '">' +
      window.IDB.statusLabel(s.status) +
      "</span>" +
      age +
      "</td>" +
      '<td class="table__action"><a class="row-link" href="' +
      href +
      '">' +
      action +
      ' <span aria-hidden="true">→</span></a></td>' +
      "</tr>"
    );
  }

  function empty() {
    return (
      '<div class="empty empty--staff">' +
      "<h2>Tidak ada pengajuan pada tampilan ini.</h2>" +
      "<p>Ubah filter status atau kata kunci pencarian.</p>" +
      '<button class="btn btn--outline btn--sm" type="button" data-reset>Tampilkan semua</button>' +
      "</div>"
    );
  }

  function render() {
    var items = filtered();

    queueEl.setAttribute("aria-busy", "false");
    document.getElementById("result-count").textContent =
      items.length + " pengajuan ditampilkan.";

    if (!items.length) {
      queueEl.innerHTML = empty();
      var reset = queueEl.querySelector("[data-reset]");
      if (reset) {
        reset.addEventListener("click", function () {
          tab = "pending";
          q = "";
          searchEl.value = "";
          syncTabs();
          render();
        });
      }
      return;
    }

    queueEl.innerHTML =
      '<div class="table-wrap"><table class="table">' +
      "<thead><tr>" +
      "<th scope=\"col\">ID</th>" +
      "<th scope=\"col\">Peminjam</th>" +
      "<th scope=\"col\">Ruangan</th>" +
      "<th scope=\"col\">Tanggal</th>" +
      "<th scope=\"col\">Waktu</th>" +
      "<th scope=\"col\">Peserta</th>" +
      "<th scope=\"col\">Status</th>" +
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

  queueEl.addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-href]");
    if (!tr) return;
    if (e.target.closest("a")) return;
    window.location.href = tr.getAttribute("data-href");
  });

  counts();
  renderConflictBanner();
  render();
  });
})();
