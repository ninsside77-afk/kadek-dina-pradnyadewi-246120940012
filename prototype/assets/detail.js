/* Detail pengajuan (peminjam) — status, riwayat, surat. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
  var session = window.IDBUI.guardUser();
  if (!session) return;

  var id = window.IDBUI.param("id");
  var rec = id ? window.IDB.get(id) : null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function showNotFound() {
    $("#loading").hidden = true;
    $("#notfound").hidden = false;
  }

  if (!rec || (!rec.mine && session.role !== "petugas")) {
    showNotFound();
    return;
  }

  var esc = window.IDBUI.escape;

  function setText(sel, value) {
    var el = $(sel);
    if (el) el.textContent = value;
  }

  setText("#crumb-id", rec.id);
  setText("#detail-id", rec.id);
  setText("#detail-purpose", rec.purpose);

  var badge = $("#detail-badge");
  badge.className = "badge " + window.IDB.statusClass(rec.status);
  badge.textContent = window.IDB.statusLabel(rec.status);

  // Panel status
  var panel = $("#status-panel");
  panel.className = "status-panel status-panel--" + rec.status;
  setText("#status-title", window.IDB.statusLabel(rec.status));
  setText("#status-message", window.IDB.statusMessage(rec.status));

  if (rec.status === "rejected" && rec.reason) {
    $("#status-reason").hidden = false;
    setText("#status-reason-text", rec.reason);
  }

  var meta = "Dikirim " + window.IDB.fmtStamp(rec.createdAt);
  if (rec.decidedAt) {
    meta +=
      " · Diputuskan " + window.IDB.fmtStamp(rec.decidedAt) + " oleh " + rec.decidedBy;
  }
  setText("#status-meta", meta);

  // Rincian
  setText("#d-ormawa", rec.ormawa);
  setText("#d-nama", rec.nama);
  setText("#d-hp", rec.hp);
  setText("#d-ruangan", rec.roomName || "Ruangan belum terdaftar");
  setText("#d-tanggal", window.IDB.fmtFull(rec.date));
  setText("#d-waktu", rec.start + "–" + rec.end + " WITA");
  setText(
    "#d-durasi",
    window.IDB.duration(window.IDB.parseTime(rec.start), window.IDB.parseTime(rec.end))
  );
  setText("#d-peserta", rec.peserta + " orang");
  setText("#d-keperluan", rec.purpose);
  setText("#d-alat", rec.alat.length ? rec.alat.join(", ") : "-");
  $("#alat-note").hidden = !rec.alat.length;

  // Riwayat
  var timeline =
    '<li class="timeline__item is-done">' +
    '<span class="timeline__dot" aria-hidden="true"></span>' +
    "<div><p class=\"timeline__title\">Pengajuan dikirim</p>" +
    '<p class="timeline__meta">' + esc(window.IDB.fmtStamp(rec.createdAt)) + "</p></div></li>";

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

  // Surat
  var letterState = window.IDB.letterState(rec);
  var letterStateEl = $("#letter-state");
  var letterNote = $("#letter-note");
  var letter = $("#letter");
  var letterDownload = $("#letter-download");

  if (letterState === "ready") {
    letter.classList.remove("letter--muted", "letter--processing");
    letter.classList.add("letter--ready");
    letterStateEl.innerHTML =
      '<span class="letter__chip letter__chip--ready">Siap</span> Surat peminjaman siap diunduh.';
    letterNote.textContent =
      "Dokumen dibuat dari data pengajuan yang telah disetujui. Format resmi dan pengesahan mengikuti ketentuan kampus.";
    if (letterDownload) {
      letterDownload.hidden = false;
      letterDownload.href = window.IDB.letterUrl(rec.id);
      letterDownload.setAttribute(
        "download",
        "Surat-Peminjaman-" + rec.id + ".pdf"
      );
    }
  } else if (letterState === "rejected") {
    letter.classList.add("letter--muted");
    letterStateEl.textContent = "Pengajuan ditolak, surat tidak tersedia.";
    letterNote.textContent = "Surat hanya diproses untuk pengajuan yang disetujui.";
    if (letterDownload) letterDownload.hidden = true;
  } else if (letterState === "processing") {
    letter.classList.add("letter--processing");
    letterStateEl.innerHTML =
      '<span class="letter__chip">Belum tersedia</span> Surat peminjaman belum tersedia.';
    letterNote.textContent =
      "Hubungi Bagian Kemahasiswaan untuk informasi lebih lanjut.";
    if (letterDownload) letterDownload.hidden = true;
  } else {
    letter.classList.add("letter--muted");
    letterStateEl.textContent = "Surat belum tersedia untuk pengajuan ini.";
    letterNote.textContent = "Surat diproses setelah pengajuan disetujui.";
    if (letterDownload) letterDownload.hidden = true;
  }

  // Langkah berikutnya
  var steps = [];
  if (rec.status === "pending") {
    steps = [
      "Bagian Kemahasiswaan memeriksa data dan jadwal ruangan.",
      "Status berubah setelah keputusan tersimpan; halaman ini menampilkan hasilnya.",
      "Status surat ditampilkan setelah pengajuan disetujui.",
    ];
  } else if (rec.status === "approved") {
    steps = [
      "Surat peminjaman dapat diunduh dari panel surat setelah persetujuan tersimpan.",
      "Format resmi dan pengesahan mengikuti ketentuan kampus.",
      "Gunakan ruangan sesuai tanggal dan waktu yang disetujui.",
    ];
  } else {
    steps = [
      "Periksa alasan penolakan pada panel status di atas.",
      "Ajukan kembali dengan waktu atau ruangan lain bila memungkinkan.",
      "Hubungi Bagian Kemahasiswaan bila memerlukan penjelasan keputusan.",
    ];
  }
  $("#next-steps").innerHTML = steps
    .map(function (s, i) {
      return (
        '<div class="next-steps__item"><span class="next-steps__num">0' +
        (i + 1) +
        "</span><p>" +
        esc(s) +
        "</p></div>"
      );
    })
    .join("");

  // Aksi
  var actions = "";
  var boardHref = "ruangan.html?tanggal=" + encodeURIComponent(rec.date);

  if (rec.status === "rejected") {
    var params = new URLSearchParams();
    if (window.IDB.findRoom(rec.roomId)) params.set("ruang", rec.roomId);
    params.set("tanggal", rec.date);
    params.set("mulai", rec.start);
    params.set("selesai", rec.end);
    actions +=
      '<a class="btn btn--accent btn--block" href="ajukan.html?' +
      params.toString() +
      '">Ajukan lagi</a>';
  }

  actions +=
    '<a class="btn btn--outline btn--block" href="' +
    boardHref +
    '">Lihat jadwal ruangan</a>';

  if (session.role === "petugas" && rec.status === "pending") {
    actions +=
      '<a class="btn btn--primary btn--block" href="petugas-detail.html?id=' +
      encodeURIComponent(rec.id) +
      '">Periksa sebagai petugas</a>';
  }

  $("#detail-actions").innerHTML = actions;

  document.title = rec.id + " — Detail Pengajuan";
  $("#loading").hidden = true;
  $("#detail").hidden = false;
  });
})();
