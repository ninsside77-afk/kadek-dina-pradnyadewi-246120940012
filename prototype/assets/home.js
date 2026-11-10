/* ==========================================================================
   BERANDA — ringkasan data
   Mengisi angka ringkasan, kartu gedung, jadwal hari ini, dan papan jadwal
   dari store yang sama dengan halaman lain. Tanpa data tambahan.
   ========================================================================== */

(function (global) {
  "use strict";

  var OPEN_HOUR = 7;
  var CLOSE_HOUR = 18;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pct(hour) {
    var range = CLOSE_HOUR - OPEN_HOUR;
    return Math.max(0, Math.min(100, ((hour - OPEN_HOUR) / range) * 100));
  }

  function setText(sel, value) {
    var el = $(sel);
    if (el) el.textContent = value;
  }

  function fillSummary() {
    var stats = global.IDB.stats();

    setText('[data-stat="rooms"]', global.IDB.ROOMS.length);
    setText('[data-stat="total"]', stats.total);
    setText('[data-stat="approved"]', stats.approved);
    setText('[data-stat="pending"]', stats.pending);
  }

  function fillBuildings() {
    $$("[data-building-card]").forEach(function (card) {
      var building = card.getAttribute("data-building-card");
      var rooms = global.IDB.ROOMS.filter(function (r) {
        return r.building === building;
      });

      var count = $("[data-building-count]", card);
      if (count) count.textContent = rooms.length;

      var names = $("[data-building-rooms]", card);
      if (names) {
        names.textContent = rooms
          .slice(0, 3)
          .map(function (r) {
            return r.name;
          })
          .join(" · ");
      }

      var more = $("[data-building-more]", card);
      if (more) {
        var rest = rooms.length - 3;
        more.textContent = rest > 0 ? "+" + rest + " ruangan lain" : rooms.length + " ruangan";
      }

      card.setAttribute("href", "ruangan.html?gedung=" + encodeURIComponent(building));
    });
  }

  function fillToday() {
    var today = global.IDB.toISO(new Date());
    var list = global.IDB.bookingsOn(today);

    var count = $("[data-today-count]");
    if (count) {
      count.textContent = list.length ? list.length + " peminjaman" : "Belum ada peminjaman";
    }

    var listEl = $("[data-today-list]");
    if (listEl) {
      if (!list.length) {
        listEl.innerHTML =
          '<li class="today__empty">Belum ada jadwal tercatat untuk hari ini.</li>';
      } else {
        listEl.innerHTML = list
          .slice(0, 4)
          .map(function (b) {
            var rec = global.IDB.get(b.id);
            var by = rec ? rec.ormawa : "";
            var purpose = rec ? rec.purpose : "";
            var badge =
              b.status === "approved"
                ? '<span class="badge badge--approved">Disetujui</span>'
                : '<span class="badge badge--pending">Menunggu</span>';

            return (
              '<li class="today__item">' +
              '<span class="today__time">' +
              esc(global.IDB.fmtTime(b.start)) +
              "–" +
              esc(global.IDB.fmtTime(b.end)) +
              "</span>" +
              "<span>" +
              '<span class="today__room">' +
              esc(global.IDB.roomName(b.room)) +
              "</span>" +
              '<span class="today__by">' +
              esc(by) +
              (purpose ? " · " + esc(purpose) : "") +
              "</span>" +
              "</span>" +
              badge +
              "</li>"
            );
          })
          .join("");
      }
    }

    var foot = $("[data-today-footnote]");
    if (foot) {
      foot.textContent =
        list.length > 4
          ? "Menampilkan 4 dari " + list.length + " jadwal"
          : "Menampilkan " + list.length + " jadwal";
    }

    renderMini(list);
  }

  function renderMini(list) {
    var rowsEl = $("[data-mini-rows]");
    if (!rowsEl) return;

    var groups = [];
    list.forEach(function (b) {
      var group = null;
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].room === b.room) group = groups[i];
      }
      if (!group) {
        group = { room: b.room, bars: [] };
        groups.push(group);
      }
      group.bars.push(b);
    });

    groups.sort(function (a, b) {
      return a.bars[0].start - b.bars[0].start || b.bars.length - a.bars.length;
    });

    var rows = groups.slice(0, 3);

    if (!rows.length) {
      rowsEl.innerHTML =
        '<p class="mini__empty">Belum ada jadwal tercatat yang bisa ditampilkan.</p>';
      return;
    }

    rowsEl.innerHTML = rows
      .map(function (group) {
        // Lajur terpisah bila dua peminjaman di ruangan yang sama bertumpuk.
        var laneEnds = [];
        var placed = group.bars
          .slice()
          .sort(function (a, b) {
            return a.start - b.start;
          })
          .map(function (b) {
            var lane = 0;
            while (laneEnds[lane] != null && laneEnds[lane] > b.start) lane++;
            laneEnds[lane] = b.end;

            var left = pct(b.start);
            var width = Math.max(pct(b.end) - left, 3);

            return {
              bar: b,
              lane: lane,
              left: left,
              width: width,
            };
          });

        var split = laneEnds.length > 1;

        var bars = placed
          .map(function (item) {
            var cls =
              item.bar.status === "approved" ? "mini__bar--ok" : "mini__bar--wait";
            var style =
              "left: " +
              item.left.toFixed(2) +
              "%; width: " +
              item.width.toFixed(2) +
              "%";

            if (split) {
              style += "; top: " + (5 + item.lane * 18) + "px";
              cls += " mini__bar--lane";
            }

            return '<span class="mini__bar ' + cls + '" style="' + style + '"></span>';
          })
          .join("");

        return (
          '<div class="mini__row' +
          (split ? " mini__row--split" : "") +
          '">' +
          '<span class="mini__room">' +
          esc(global.IDB.roomName(group.room)) +
          "</span>" +
          '<div class="mini__track">' +
          bars +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  function start() {
    if (!global.IDB) return;

    var long = global.IDB.fmtLong(new Date());
    $$("[data-today]").forEach(function (el) {
      el.textContent = long;
    });

    fillSummary();
    fillBuildings();
    fillToday();
  }

  if (global.IDB && global.IDB.ready) {
    global.IDB.ready.then(start);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})(window);
