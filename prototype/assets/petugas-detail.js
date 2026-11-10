/* Detail pengajuan petugas — pemeriksaan jadwal dan keputusan. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
  var session = window.IDBUI.guardStaff();
  if (!session) return;

  var id = window.IDBUI.param("id");
  var rec = id ? window.IDB.get(id) : null;
  var esc = window.IDBUI.escape;

  function $(sel) {
    return document.querySelector(sel);
  }

  function setText(sel, value) {
    var el = $(sel);
    if (el) el.textContent = value;
  }

  if (!rec) {
    $("#loading").hidden = true;
    $("#notfound").hidden = false;
    return;
  }

  var approveDialog = $("#approve-dialog");
  var rejectDialog = $("#reject-dialog");
  var approveForm = $("#approve-form");
  var rejectForm = $("#reject-form");
  var ack = $("#approve-ack");
  var approveError = $("#approve-err");
  var reason = $("#reject-reason");
  var reasonCount = $("#reject-count");

  function closeDialogs() {
    if (approveDialog.open) approveDialog.close();
    if (rejectDialog.open) rejectDialog.close();
  }

  function scheduleItem(s) {
    var isSelf = s.id === rec.id;
    var conflict =
      !isSelf &&
      window.IDB.overlaps(rec, s) &&
      (s.status === "approved" || s.status === "pending");

    var tag = "";
    if (isSelf) tag = '<span class="tag tag--self">Pengajuan ini</span>';
    else if (conflict) tag = '<span class="tag tag--conflict">Bentrok</span>';

    return (
      '<div class="schedule-item schedule-item--' + s.status + (isSelf ? " is-self" : "") + '">' +
      '<span class="schedule-item__time mono">' + esc(s.start + "–" + s.end) + "</span>" +
      '<span class="schedule-item__body">' +
      '<span class="schedule-item__title">' + esc(s.ormawa) + "</span>" +
      '<span class="schedule-item__sub">' +
      window.IDB.statusLabel(s.status) + " · " + esc(s.id) +
      "</span></span>" +
      tag +
      "</div>"
    );
  }

  function renderDecision(conf) {
    var body = $("#decision-body");
    var hasApprovedConflict = conf.approved.length > 0;
    var hasPendingConflict = conf.pending.length > 0;

    if (rec.status !== "pending") {
      var stateClass =
        rec.status === "approved" ? "decision__state--approved" : "decision__state--rejected";
      var html =
        '<p class="decision__state ' + stateClass + '">Sudah diputuskan</p>' +
        '<div class="decision__summary">' +
        '<span class="badge ' + window.IDB.statusClass(rec.status) + '">' +
        window.IDB.statusLabel(rec.status) +
        "</span>" +
        '<p class="decision__by">oleh ' + esc(rec.decidedBy) + "</p>" +
        '<p class="decision__time">' + esc(window.IDB.fmtStamp(rec.decidedAt)) + "</p>" +
        "</div>";

      if (rec.status === "rejected" && rec.reason) {
        html +=
          '<div class="decision__reason"><p class="decision__reason-label">Alasan</p><p>' +
          esc(rec.reason) +
          "</p></div>";
      }

      html +=
        '<p class="decision__note">Keputusan sudah tersimpan. Pengajuan yang sudah diputuskan tidak dapat diperiksa ulang dari halaman ini.</p>';

      body.innerHTML = html;
      return;
    }

    var info = "";
    if (hasApprovedConflict) {
      info +=
        '<div class="banner banner--danger">' +
        "<div>" +
        '<p class="banner__title">Belum dapat disetujui.</p>' +
        "<p>Waktu ini bertabrakan dengan jadwal yang sudah disetujui. Selesaikan bentrok terlebih dahulu, atau tolak pengajuan ini.</p>" +
        "</div></div>";
    } else if (hasPendingConflict) {
      info +=
        '<div class="banner banner--warn">' +
        "<div>" +
        '<p class="banner__title">Ada pengajuan lain pada waktu yang sama.</p>' +
        "<p>" +
        conf.pending.length +
        " pengajuan masih menunggu. Pastikan hanya satu yang disetujui untuk waktu ini.</p>" +
        "</div></div>";
    }

    body.innerHTML =
      '<p class="decision__lead">Pengajuan ini belum diputuskan.</p>' +
      info +
      '<div class="decision__actions">' +
      '<button class="btn btn--primary btn--block" type="button" id="btn-approve"' +
      (hasApprovedConflict ? " disabled" : "") +
      ">Setujui pengajuan</button>" +
      '<button class="btn btn--danger btn--block" type="button" id="btn-reject">Tolak pengajuan</button>' +
      "</div>" +
      '<p class="decision__note">Keputusan menyimpan waktu dan nama petugas yang sedang masuk.</p>';

    var approve = $("#btn-approve");
    if (approve) {
      approve.addEventListener("click", function () {
        if (hasApprovedConflict) return;
        $("#approve-summary").textContent =
          rec.nama +
          " · " +
          rec.ormawa +
          " · " +
          (rec.roomName || "ruangan belum terdaftar") +
          " · " +
          window.IDB.fmtLong(rec.date) +
          " · " +
          rec.start +
          "–" +
          rec.end +
          " WITA.";
        ack.checked = false;
        approveError.hidden = true;
        $("#approve-warn").hidden = !hasPendingConflict;
        if (hasPendingConflict) {
          $("#approve-warn-text").textContent =
            conf.pending.length +
            " pengajuan lain masih menunggu pada waktu yang sama. Pastikan hanya satu yang disetujui.";
        }
        approveDialog.showModal();
        ack.focus();
      });
    }

    var reject = $("#btn-reject");
    if (reject) {
      reject.addEventListener("click", function () {
        $("#reject-summary").textContent =
          rec.nama +
          " · " +
          rec.ormawa +
          " · " +
          (rec.roomName || "ruangan belum terdaftar") +
          " · " +
          window.IDB.fmtLong(rec.date) +
          " · " +
          rec.start +
          "–" +
          rec.end +
          " WITA.";
        reason.value = "";
        reasonCount.textContent = "0/300";
        rejectDialog.showModal();
        reason.focus();
      });
    }
  }

  function render() {
    setText("#crumb-id", rec.id);
    setText("#detail-id", rec.id);
    setText("#detail-purpose", rec.purpose);

    var badge = $("#detail-badge");
    badge.className = "badge " + window.IDB.statusClass(rec.status);
    badge.textContent = window.IDB.statusLabel(rec.status);

    setText(
      "#detail-meta",
      "Dikirim " +
        window.IDB.fmtStamp(rec.createdAt) +
        " · " +
        window.IDB.ageLabel(rec.createdAt) +
        " · " +
        rec.peserta +
        " peserta"
    );

    setText("#pd-ormawa", rec.ormawa);
    setText("#pd-nama", rec.nama);
    setText("#pd-hp", rec.hp);
    setText("#pd-ruangan", rec.roomName || "Ruangan belum terdaftar");
    setText("#pd-tanggal", window.IDB.fmtFull(rec.date));
    setText("#pd-waktu", rec.start + "–" + rec.end + " WITA");
    setText(
      "#pd-durasi",
      window.IDB.duration(window.IDB.parseTime(rec.start), window.IDB.parseTime(rec.end))
    );
    setText("#pd-peserta", rec.peserta + " orang");
    setText("#pd-keperluan", rec.purpose);
    setText("#pd-alat", rec.alat.length ? rec.alat.join(", ") : "-");

    var room = window.IDB.findRoom(rec.roomId);
    var conf = window.IDB.conflictsFor(rec);

    // Pemeriksaan jadwal
    if (room) {
      setText("#schedule-room", room.name + " · " + window.IDB.fmtLong(rec.date));
      var list = window.IDB.scheduleFor(rec.roomId, rec.date);
      $("#schedule-check").innerHTML = list.map(scheduleItem).join("");
      $("#schedule-note").textContent =
        "Jadwal di atas adalah peminjaman yang tercatat pada ruangan dan tanggal ini.";
      $("#board-link").href =
        "ruangan.html?tanggal=" +
        encodeURIComponent(rec.date) +
        "&gedung=" +
        encodeURIComponent(room.building);
    } else {
      setText("#schedule-room", "Ruangan belum terdaftar");
      $("#schedule-check").innerHTML =
        '<p class="schedule-check__empty">Ruangan ini belum ada di daftar ruangan, sehingga tidak muncul pada papan jadwal.</p>';
      $("#schedule-note").textContent =
        "Ketersediaan ruangan harus diperiksa manual sebelum keputusan diberikan.";
      $("#board-link").href = "ruangan.html";
    }

    renderDecision(conf);

    // Riwayat
    var timeline =
      '<li class="timeline__item is-done">' +
      '<span class="timeline__dot" aria-hidden="true"></span>' +
      '<div><p class="timeline__title">Pengajuan dikirim</p>' +
      '<p class="timeline__meta">' +
      esc(window.IDB.fmtStamp(rec.createdAt)) +
      "</p></div></li>";

    if (rec.status === "pending") {
      timeline +=
        '<li class="timeline__item is-current">' +
        '<span class="timeline__dot" aria-hidden="true"></span>' +
        '<div><p class="timeline__title">Menunggu pemeriksaan</p>' +
        '<p class="timeline__meta">Bagian Kemahasiswaan</p></div></li>';
    } else {
      timeline +=
        '<li class="timeline__item is-done">' +
        '<span class="timeline__dot" aria-hidden="true"></span>' +
        '<div><p class="timeline__title">' +
        esc(window.IDB.statusLabel(rec.status)) +
        "</p>" +
        '<p class="timeline__meta">' +
        esc(window.IDB.fmtStamp(rec.decidedAt) + " · " + rec.decidedBy) +
        "</p></div></li>";
    }
    $("#timeline").innerHTML = timeline;

    $("#rail-pending").textContent = window.IDB.stats().pending;
    document.title = rec.id + " — Periksa Pengajuan";
    $("#loading").hidden = true;
    $("#detail").hidden = false;
  }

  function finish(message) {
    closeDialogs();
    render();
    window.IDBUI.toast(message);
    $("#decision-title").setAttribute("tabindex", "-1");
    $("#decision-title").focus({ preventScroll: true });
    $("#decision-title").scrollIntoView({ block: "center", behavior: "smooth" });
  }

  ack.addEventListener("change", function () {
    approveError.hidden = true;
  });

  approveForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!ack.checked) {
      approveError.textContent = "Centang pernyataan pemeriksaan sebelum menyetujui.";
      approveError.hidden = false;
      ack.focus();
      return;
    }

    var confirmBtn = $("#approve-confirm");
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.setAttribute("aria-busy", "true");
      confirmBtn.textContent = "Menyimpan…";
    }

    window.IDB.decide(rec.id, "approve", "").then(function (result) {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.removeAttribute("aria-busy");
        confirmBtn.textContent = "Setujui pengajuan";
      }

      if (!result.ok) {
        if (result.code === "conflict") {
          approveError.textContent =
            "Jadwal bertabrakan dengan pengajuan yang sudah disetujui. Periksa jadwal terlebih dahulu.";
          approveError.hidden = false;
          closeDialogs();
          render();
        } else {
          approveError.textContent =
            result.message || "Keputusan belum berhasil disimpan. Silakan coba kembali.";
          approveError.hidden = false;
        }
        return;
      }

      rec = result.record;
      finish("Pengajuan disetujui dan keputusan tersimpan.");
    });
  });

  reason.addEventListener("input", function () {
    reasonCount.textContent = reason.value.length + "/300";
  });

  rejectForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var rejectBtn = $("#reject-confirm");
    if (rejectBtn) {
      rejectBtn.disabled = true;
      rejectBtn.setAttribute("aria-busy", "true");
      rejectBtn.textContent = "Menyimpan…";
    }

    window.IDB.decide(rec.id, "reject", reason.value).then(function (result) {
      if (rejectBtn) {
        rejectBtn.disabled = false;
        rejectBtn.removeAttribute("aria-busy");
        rejectBtn.textContent = "Tolak pengajuan";
      }
      if (!result.ok) {
        window.IDBUI.toast(
          result.message || "Keputusan belum berhasil disimpan. Silakan coba kembali.",
          "danger"
        );
        return;
      }
      rec = result.record;
      finish("Pengajuan ditolak dan keputusan tersimpan.");
    });
  });

  document.querySelectorAll("[data-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.closest("dialog").close();
    });
  });

  render();
  });
})();
