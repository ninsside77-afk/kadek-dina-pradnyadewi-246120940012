/* ==========================================================================
   LOGIKA TAMPILAN
   Data jadwal di bawah adalah data awal untuk keperluan tampilan, bukan jadwal resmi kampus.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- Konfigurasi tampilan ---------- */

  // Rentang jam layanan yang dipakai antarmuka.
  var OPEN_HOUR = 7;
  var CLOSE_HOUR = 18;

  /* ---------- Utilitas ---------- */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $$(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toISO(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function fromISO(s) {
    var p = String(s).split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fmtLong(d) {
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function fmtTime(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    return pad(hh) + "." + pad(mm);
  }

  function fmtRange(a, b) {
    return fmtTime(a) + "–" + fmtTime(b);
  }

  // "08.30" -> 8.5
  function parseTime(value) {
    var parts = String(value).split(/[.:]/);
    return Number(parts[0]) + Number(parts[1] || 0) / 60;
  }

  function duration(a, b) {
    var mins = Math.round((b - a) * 60);
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    if (h && m) return h + " jam " + m + " menit";
    if (h) return h + " jam";
    return m + " menit";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function findRoom(id) {
    return ROOMS.filter(function (r) {
      return r.id === id;
    })[0];
  }

  /* ---------- Data awal ---------- */

  var BUILDINGS = ["Gedung A", "Gedung B / Rektorat", "Gedung C / NMC", "Area tambahan"];

  var ROOMS = [
    { id: "studio-pola", name: "Studio Pola", building: "Gedung A" },
    { id: "lecture-1a", name: "Lecture 1A", building: "Gedung A" },
    { id: "lab-1c", name: "Lab 1C", building: "Gedung A" },
    { id: "studio-foto", name: "Studio Fotografi & Videografi", building: "Gedung A" },
    { id: "lab-2b", name: "Lab 2B", building: "Gedung A" },
    { id: "lab-2c", name: "Lab 2C", building: "Gedung A" },
    { id: "lecture-2d", name: "Lecture 2D", building: "Gedung A" },
    { id: "uks", name: "UKS", building: "Gedung A" },
    { id: "aula", name: "Aula", building: "Gedung A" },

    { id: "lab-imac", name: "Lab iMac", building: "Gedung B / Rektorat" },
    { id: "ruang-inbis", name: "Ruang Inbis", building: "Gedung B / Rektorat" },
    { id: "studio-3", name: "Studio 3", building: "Gedung B / Rektorat" },
    { id: "lab-fashion", name: "Lab Fashion", building: "Gedung B / Rektorat" },
    { id: "inter-1", name: "Inter 1", building: "Gedung B / Rektorat" },
    { id: "ruang-magister", name: "Ruang Magister", building: "Gedung B / Rektorat" },
    { id: "perpustakaan", name: "Perpustakaan", building: "Gedung B / Rektorat" },
    { id: "ruang-asistensi", name: "Ruang Asistensi", building: "Gedung B / Rektorat" },

    { id: "lab-1a-c", name: "Lab 1A", building: "Gedung C / NMC" },
    { id: "lab-sti", name: "Lab STI", building: "Gedung C / NMC" },
    { id: "ruang-1b", name: "1B", building: "Gedung C / NMC" },
    { id: "lecture-2a", name: "Lecture 2A", building: "Gedung C / NMC" },
    { id: "lecture-2b", name: "Lecture 2B", building: "Gedung C / NMC" },
    { id: "studio-2c", name: "Studio 2C", building: "Gedung C / NMC" },
    { id: "studio-3a", name: "Studio 3A", building: "Gedung C / NMC" },
    { id: "studio-3b", name: "Studio 3B", building: "Gedung C / NMC" },
    { id: "studio-3c", name: "Studio 3C", building: "Gedung C / NMC" },

    { id: "rooftop", name: "Rooftop", building: "Area tambahan" },
    { id: "halaman", name: "Halaman gedung", building: "Area tambahan" },
    { id: "gsg", name: "Gedung serba guna", building: "Area tambahan" },
  ];

  var TODAY = startOfToday();

  function statusLabel(s) {
    return IDB.statusLabel(s);
  }

  function overlaps(a, b) {
    return a.room === b.room && a.date === b.date && a.start < b.end && b.start < a.end;
  }

  function bookingsOn(date) {
    return IDB.bookingsOn(date);
  }

  function withClash(list) {
    return list.map(function (b) {
      var clash = false;
      if (b.status === "pending") {
        clash = list.some(function (o) {
          return o !== b && overlaps(o, b);
        });
      }
      return Object.assign({}, b, { clash: clash });
    });
  }

  /* ---------- Toast ---------- */

  function toast(message, tone) {
    IDBUI.toast(message, tone);
  }

  /* ---------- Navigasi ---------- */

  /* ---------- Pemilih tanggal ---------- */

  function initDatePicker(root, options) {
    var opts = options || {};
    var trigger = $("[data-trigger]", root);
    var display = $("[data-display]", root);
    var picker = $("[data-picker]", root);
    var input = $("[data-input]", root);
    var selected = opts.value || "";
    var view = selected ? fromISO(selected) : new Date();
    var today = startOfToday();

    view = new Date(view.getFullYear(), view.getMonth(), 1);

    function render() {
      var year = view.getFullYear();
      var month = view.getMonth();
      var first = new Date(year, month, 1);
      var days = new Date(year, month + 1, 0).getDate();
      var lead = (first.getDay() + 6) % 7;

      var title = first.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      var cells = "";

      for (var i = 0; i < lead; i++) {
        cells += '<span class="day--outside" aria-hidden="true"></span>';
      }

      for (var d = 1; d <= days; d++) {
        var date = new Date(year, month, d);
        var iso = toISO(date);
        var isSunday = date.getDay() === 0;
        var disabled = isSunday && opts.allowSunday === false;
        var cls = "day";
        if (iso === toISO(today)) cls += " day--today";
        if (iso === selected) cls += " day--selected";
        cells +=
          '<button type="button" class="' +
          cls +
          '" data-day="' +
          iso +
          '" tabindex="-1" ' +
          (disabled ? "disabled" : "") +
          ' aria-pressed="' +
          (iso === selected ? "true" : "false") +
          '" aria-label="' +
          esc(date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })) +
          '">' +
          d +
          "</button>";
      }

      picker.innerHTML =
        '<div class="picker__head">' +
        '<button type="button" class="picker__nav" data-prev aria-label="Bulan sebelumnya">‹</button>' +
        '<span class="picker__title" aria-live="polite">' +
        esc(title) +
        "</span>" +
        '<button type="button" class="picker__nav" data-next aria-label="Bulan berikutnya">›</button>' +
        "</div>" +
        '<div class="picker__dow" aria-hidden="true"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>' +
        '<div class="picker__grid">' +
        cells +
        "</div>";
    }

    function syncDisplay() {
      if (selected) {
        display.textContent = fmtLong(fromISO(selected));
        trigger.setAttribute("data-empty", "false");
      } else {
        display.textContent = opts.placeholder || "Pilih tanggal";
        trigger.setAttribute("data-empty", "true");
      }
      input.value = selected;
    }

    function focusDay(iso) {
      if (!iso) return;
      var target = picker.querySelector('[data-day="' + iso + '"]');
      if (!target) {
        var d = fromISO(iso);
        view = new Date(d.getFullYear(), d.getMonth(), 1);
        render();
        target = picker.querySelector('[data-day="' + iso + '"]');
      }
      if (!target || target.disabled) return;
      $$(".day", picker).forEach(function (btn) {
        btn.tabIndex = -1;
      });
      target.tabIndex = 0;
      target.focus();
    }

    function open() {
      render();
      picker.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      var focusTarget =
        picker.querySelector(".day--selected:not(:disabled)") ||
        picker.querySelector(".day--today:not(:disabled)") ||
        picker.querySelector(".day:not(:disabled)");
      if (focusTarget) {
        $$(".day", picker).forEach(function (btn) {
          btn.tabIndex = -1;
        });
        focusTarget.tabIndex = 0;
        focusTarget.focus();
      }
    }

    function close() {
      picker.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }

    function setValue(iso, silent) {
      selected = iso || "";
      if (selected) {
        view = new Date(fromISO(selected).getFullYear(), fromISO(selected).getMonth(), 1);
      }
      syncDisplay();
      if (!silent && opts.onChange) opts.onChange(selected);
    }

    trigger.addEventListener("click", function () {
      if (picker.hidden) open();
      else close();
    });

    picker.addEventListener("click", function (e) {
      var day = e.target.closest("[data-day]");
      if (day) {
        setValue(day.getAttribute("data-day"));
        close();
        trigger.focus();
        return;
      }

      if (e.target.closest("[data-prev]")) {
        view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
        render();
        var p = picker.querySelector(".day:not(:disabled)");
        if (p) focusDay(p.getAttribute("data-day"));
      }

      if (e.target.closest("[data-next]")) {
        view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
        render();
        var n = picker.querySelector(".day:not(:disabled)");
        if (n) focusDay(n.getAttribute("data-day"));
      }
    });

    picker.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        close();
        trigger.focus();
        return;
      }

      var day = e.target.closest("[data-day]");
      if (!day) return;

      var d = fromISO(day.getAttribute("data-day"));
      var next = null;

      switch (e.key) {
        case "ArrowLeft":
          d.setDate(d.getDate() - 1);
          next = toISO(d);
          break;
        case "ArrowRight":
          d.setDate(d.getDate() + 1);
          next = toISO(d);
          break;
        case "ArrowUp":
          d.setDate(d.getDate() - 7);
          next = toISO(d);
          break;
        case "ArrowDown":
          d.setDate(d.getDate() + 7);
          next = toISO(d);
          break;
        case "Home":
          d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
          next = toISO(d);
          break;
        case "End":
          d.setDate(d.getDate() + (6 - ((d.getDay() + 6) % 7)));
          next = toISO(d);
          break;
        case "PageUp":
          d.setMonth(d.getMonth() - 1);
          next = toISO(d);
          break;
        case "PageDown":
          d.setMonth(d.getMonth() + 1);
          next = toISO(d);
          break;
        default:
          return;
      }

      e.preventDefault();

      // Lewati hari Minggu yang dinonaktifkan agar panah tetap bergerak.
      var dir = ["ArrowLeft", "ArrowUp", "Home", "PageUp"].indexOf(e.key) !== -1 ? -1 : 1;
      var nd = fromISO(next);
      var guard = 0;
      while (opts.allowSunday === false && nd.getDay() === 0 && guard++ < 14) {
        nd.setDate(nd.getDate() + dir);
      }
      focusDay(toISO(nd));
    });

    document.addEventListener("click", function (e) {
      if (!picker.hidden && !root.contains(e.target)) close();
    });

    syncDisplay();

    return {
      getValue: function () {
        return selected;
      },
      setValue: setValue,
      clear: function () {
        setValue("", true);
      },
    };
  }

  /* ---------- Halaman ruangan ---------- */

  function formUrl(room, date, start, end) {
    var params = new URLSearchParams();
    if (room) params.set("ruang", room);
    if (date) params.set("tanggal", date);
    if (start != null) params.set("mulai", fmtTime(start));
    if (end != null) params.set("selesai", fmtTime(end));
    return "ajukan.html?" + params.toString();
  }

  function initRoomsPage() {
    var boardEl = $("#board");
    if (!boardEl) return;

    var range = CLOSE_HOUR - OPEN_HOUR;
    var urlParams = new URLSearchParams(window.location.search);
    var qDate = urlParams.get("tanggal");
    var qBuilding = urlParams.get("gedung");

    var state = {
      date: qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate) ? qDate : toISO(TODAY),
      building: BUILDINGS.indexOf(qBuilding) >= 0 ? qBuilding : "",
      q: "",
      view: "board",
    };

    var datePicker = initDatePicker($("[data-datepicker]"), {
      value: state.date,
      allowSunday: true,
      onChange: function (iso) {
        if (!iso) return;
        state.date = iso;
        render();
      },
    });
    if (!datePicker.getValue()) datePicker.setValue(state.date, true);

    var buildingSelect = $("#filter-gedung");
    BUILDINGS.forEach(function (b) {
      var o = document.createElement("option");
      o.value = b;
      o.textContent = b;
      buildingSelect.appendChild(o);
    });

    buildingSelect.value = state.building;

    buildingSelect.addEventListener("change", function () {
      state.building = buildingSelect.value;
      render();
    });

    var search = $("#filter-cari");
    var searchTimer = null;
    search.addEventListener("input", function () {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(function () {
        state.q = search.value.trim().toLowerCase();
        render();
      }, 120);
    });

    $$("[data-view-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.view = btn.getAttribute("data-view-btn");
        $$("[data-view-btn]").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        $$(".view[data-view]").forEach(function (v) {
          v.hidden = v.getAttribute("data-view") !== state.view;
        });
      });
    });

    function filteredRooms() {
      return ROOMS.filter(function (r) {
        if (state.building && r.building !== state.building) return false;
        if (state.q && r.name.toLowerCase().indexOf(state.q) === -1) return false;
        return true;
      });
    }

    function renderBoard(rooms, bookings) {
      var html = "";
      html +=
        '<div class="board__axis"><div class="board__axis-label">Ruangan</div><div class="board__ticks">';

      for (var h = OPEN_HOUR; h <= CLOSE_HOUR; h += 2) {
        html +=
          '<span class="board__tick" style="left:' +
          ((h - OPEN_HOUR) / range) * 100 +
          '%">' +
          pad(h) +
          "</span>";
      }

      html += "</div></div>";

      BUILDINGS.forEach(function (building) {
        var groupRooms = rooms.filter(function (r) {
          return r.building === building;
        });
        if (!groupRooms.length) return;

        html += '<div class="board__group"><span>' + esc(building) + "</span></div>";

        groupRooms.forEach(function (room) {
          html += '<div class="board__row"><div class="board__room">' + esc(room.name) + "</div>";

          var items = withClash(
            bookings.filter(function (b) {
              return b.room === room.id;
            })
          );

          // Susun bentrok ke lajur terpisah agar tidak saling menutup.
          items.sort(function (a, b) {
            return a.start - b.start || a.end - b.end;
          });
          var laneEnds = [];
          items.forEach(function (b) {
            var lane = 0;
            while (laneEnds[lane] != null && laneEnds[lane] > b.start) lane++;
            laneEnds[lane] = b.end;
            b._lane = lane;
          });
          var laneCount = laneEnds.length;

          html +=
            '<div class="track' +
            (laneCount > 1 ? " track--multi" : "") +
            '"' +
            (laneCount > 2 ? ' style="min-height:' + (10 + laneCount * 28) + 'px"' : "") +
            ' data-room="' +
            room.id +
            '" data-date="' +
            state.date +
            '">';

          for (var g = OPEN_HOUR; g <= CLOSE_HOUR; g++) {
            html +=
              '<span class="track__gl" style="left:' + ((g - OPEN_HOUR) / range) * 100 + '%"></span>';
          }

          items.forEach(function (b) {
            var cls = b.clash ? "bar--clash" : b.status === "approved" ? "bar--approved" : "bar--pending";
            html +=
              '<button type="button" class="bar ' +
              cls +
              '" style="' +
              (laneCount > 1 ? "top:" + (6 + b._lane * 28) + "px;" : "") +
              "left:" +
              ((b.start - OPEN_HOUR) / range) * 100 +
              "%;width:" +
              ((b.end - b.start) / range) * 100 +
              '%" data-bar data-room="' +
              room.id +
              '" data-start="' +
              b.start +
              '" data-end="' +
              b.end +
              '" aria-label="' +
              esc(room.name + ", " + fmtRange(b.start, b.end) + ", " + (b.clash ? "bentrok" : statusLabel(b.status)) + ", " + b.by) +
              '">' +
              (b.end - b.start >= 1.5 ? fmtRange(b.start, b.end) : fmtTime(b.start)) +
              "</button>";
          });

          html += "</div></div>";
        });
      });

      boardEl.innerHTML = html;

      // Garis waktu sekarang
      var now = new Date();
      if (state.date === toISO(now)) {
        var hour = now.getHours() + now.getMinutes() / 60;
        if (hour >= OPEN_HOUR && hour <= CLOSE_HOUR) {
          $$(".track", boardEl).forEach(function (track) {
            var line = document.createElement("span");
            line.className = "track__now";
            line.style.left = ((hour - OPEN_HOUR) / range) * 100 + "%";
            track.appendChild(line);
          });
        }
      }
    }

    function renderAgenda(rooms, bookings) {
      var html = "";

      if (!bookings.length) {
        html +=
          '<p class="agenda__notice">Belum ada jadwal tercatat pada tanggal ini. Pengajuan tetap dapat dikirim untuk diperiksa petugas.</p>';
      }
      BUILDINGS.forEach(function (building) {
        var groupRooms = rooms.filter(function (r) {
          return r.building === building;
        });
        if (!groupRooms.length) return;

        html += '<section class="agenda__group"><h3 class="agenda__building">' + esc(building) + "</h3>";

        groupRooms.forEach(function (room) {
          var items = withClash(
            bookings.filter(function (b) {
              return b.room === room.id;
            })
          );

          html += '<article class="agenda__room"><div class="agenda__head">';
          html += '<h4><a href="' + formUrl(room.id, state.date) + '">' + esc(room.name) + "</a></h4>";
          html +=
            '<a class="btn btn--ghost btn--sm" href="' +
            formUrl(room.id, state.date) +
            '">Ajukan</a>';
          html += "</div>";

          if (items.length) {
            html += '<ul class="agenda__slots">';
            items.forEach(function (b) {
              var badge = b.clash
                ? '<span class="badge badge--rejected">Bentrok</span>'
                : b.status === "approved"
                ? '<span class="badge badge--approved">Disetujui</span>'
                : '<span class="badge badge--pending">Menunggu</span>';
              html +=
                '<li class="agenda__slot"><span class="agenda__time">' +
                fmtRange(b.start, b.end) +
                "</span>" +
                badge +
                '<span class="agenda__by">' +
                esc(b.by) +
                "</span></li>";
            });
            html += "</ul>";
          } else if (bookings.length) {
            html += '<p class="agenda__empty">Belum ada jadwal tercatat.</p>';
          }

          html += "</article>";
        });

        html += "</section>";
      });

      $("#agenda").innerHTML = html;
    }

    function renderList(rooms, bookings) {
      var html = "";

      if (!bookings.length) {
        html +=
          '<p class="agenda__notice">Belum ada jadwal tercatat pada tanggal ini. Pengajuan tetap dapat dikirim untuk diperiksa petugas.</p>';
      }
      BUILDINGS.forEach(function (building) {
        var groupRooms = rooms.filter(function (r) {
          return r.building === building;
        });
        if (!groupRooms.length) return;

        html += '<div class="room-group">' + esc(building) + "</div>";

        groupRooms.forEach(function (room) {
          var items = withClash(
            bookings.filter(function (b) {
              return b.room === room.id;
            })
          );

          html += '<article class="room"><div class="room__head"><h3 class="room__name">' + esc(room.name) + "</h3>";
          html += '<span class="room__building">' + esc(room.building) + "</span></div>";

          if (items.length) {
            html += '<div class="room__slots">';
            items.forEach(function (b) {
              var badge = b.clash
                ? '<span class="badge badge--rejected">Bentrok</span>'
                : b.status === "approved"
                ? '<span class="badge badge--approved">Disetujui</span>'
                : '<span class="badge badge--pending">Menunggu</span>';
              html +=
                '<div class="slot"><span class="slot__time">' +
                fmtRange(b.start, b.end) +
                "</span>" +
                badge +
                '<span class="agenda__by">' +
                esc(b.by) +
                "</span></div>";
            });
            html += "</div>";
          } else if (bookings.length) {
            html += '<p class="room__empty">Belum ada jadwal tercatat.</p>';
          }

          html +=
            '<div class="room__foot"><a class="btn btn--ghost btn--sm" href="' +
            formUrl(room.id, state.date) +
            '">Ajukan di ruangan ini <span aria-hidden="true">→</span></a></div></article>';
        });
      });

      $("#room-list").innerHTML = html;
    }

    function render() {
      var rooms = filteredRooms();
      var all = bookingsOn(state.date);
      var bookings = all.filter(function (b) {
        return rooms.some(function (r) {
          return r.id === b.room;
        });
      });

      $("#board-date").textContent = fmtLong(fromISO(state.date));

      var status = $("#board-status");
      if (!rooms.length) {
        status.textContent = "Tidak ada ruangan yang cocok dengan filter.";
      } else if (!bookings.length) {
        status.textContent = "Belum ada jadwal tercatat pada tanggal ini.";
      } else {
        status.textContent =
          rooms.length + " ruangan · " + bookings.length + " peminjaman tercatat";
      }

      if (!rooms.length) {
        var empty =
          '<div class="empty"><h3>Tidak ada ruangan yang cocok</h3><p>Ubah kata kunci atau pilih gedung lain.</p></div>';
        boardEl.innerHTML = empty;
        $("#agenda").innerHTML = empty;
        $("#room-list").innerHTML = empty;
        return;
      }

      renderBoard(rooms, bookings);
      renderAgenda(rooms, bookings);
      renderList(rooms, bookings);
    }

    boardEl.addEventListener("click", function (e) {
      var bar = e.target.closest("[data-bar]");

      if (bar) {
        var room = findRoom(bar.getAttribute("data-room"));
        var start = Number(bar.getAttribute("data-start"));
        var end = Number(bar.getAttribute("data-end"));
        var booking = bookingsOn(state.date).filter(function (b) {
          return b.room === room.id && b.start === start;
        })[0];
        toast(
          room.name +
            " · " +
            fmtRange(start, end) +
            " · " +
            (booking ? statusLabel(booking.status) : "Terjadwal") +
            (booking ? " (" + booking.by + ")" : ""),
          booking && booking.status === "pending" ? "warn" : "success"
        );
        return;
      }

      var track = e.target.closest(".track");
      if (!track) return;

      var rect = track.getBoundingClientRect();
      var ratio = (e.clientX - rect.left) / rect.width;
      var hour = OPEN_HOUR + ratio * range;
      var startHour = clamp(Math.floor(hour * 2) / 2, OPEN_HOUR, CLOSE_HOUR - 0.5);
      var endHour = Math.min(startHour + 2, CLOSE_HOUR);
      window.location.href = formUrl(
        track.getAttribute("data-room"),
        track.getAttribute("data-date"),
        startHour,
        endHour
      );
    });

    render();
  }

  /* ---------- Halaman formulir ---------- */

  function initFormPage() {
    var form = $("#form-pengajuan");
    if (!form) return;

    var session = window.IDB.session();
    if (!session) {
      window.location.replace(window.IDBUI.loginUrl("ajukan.html", "masuk"));
      return;
    }
    if (session.role !== "peminjam") {
      window.location.replace("petugas.html");
      return;
    }

    var roomSelect = $("#ruangan");
    var otherField = $('[data-field="ruangan-lain"]');
    var otherInput = $("#ruangan-lain");
    var startSelect = $("#mulai");
    var endSelect = $("#selesai");
    var dateRoot = $('[data-datepicker][data-allow-sunday="false"]');
    var clashBanner = $("#clash-banner");
    var ack = $("#ack-jadwal");
    var summaryEls = [$("#summary-desktop"), $("#summary-mobile")];
    var successEl = $("#success");
    var layoutEl = $(".form-layout");
    var errorSummary = $("#error-summary");
    var errorList = $("#error-list");
    var submitBtn = $("#btn-submit");
    var datePicker;

    // Ruangan
    BUILDINGS.forEach(function (building) {
      var group = document.createElement("optgroup");
      group.label = building;
      ROOMS.filter(function (r) {
        return r.building === building;
      }).forEach(function (room) {
        var option = document.createElement("option");
        option.value = room.id;
        option.textContent = room.name;
        group.appendChild(option);
      });
      roomSelect.appendChild(group);
    });

    var other = document.createElement("option");
    other.value = "lain";
    other.textContent = "Ruangan belum ada di daftar";
    roomSelect.appendChild(other);

    // Waktu
    for (var t = OPEN_HOUR; t <= CLOSE_HOUR; t += 0.5) {
      var label = fmtTime(t);
      var o1 = document.createElement("option");
      o1.value = label;
      o1.textContent = label;
      startSelect.appendChild(o1);

      var o2 = document.createElement("option");
      o2.value = label;
      o2.textContent = label;
      endSelect.appendChild(o2);
    }

    // Pemilih tanggal
    datePicker = initDatePicker(dateRoot, {
      value: "",
      allowSunday: false,
      onChange: function () {
        clearFieldError("tanggal");
        updateSummary();
        updateClash();
      },
    });

    // Nilai awal dari tautan papan jadwal
    var params = new URLSearchParams(window.location.search);
    var qRoom = params.get("ruang");
    var qDate = params.get("tanggal");
    var qStart = params.get("mulai");
    var qEnd = params.get("selesai");

    if (qRoom) {
      var known = ROOMS.some(function (r) {
        return r.id === qRoom;
      });
      roomSelect.value = known ? qRoom : "lain";
      if (!known) otherField.hidden = false;
    }
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      datePicker.setValue(qDate, true);
      if (fromISO(qDate).getDay() === 0) {
        setError("tanggal", "Peminjaman ruangan tidak dapat dilakukan pada hari Minggu.");
      }
    }
    if (qStart && startSelect.querySelector('option[value="' + qStart + '"]')) startSelect.value = qStart;
    if (qEnd && endSelect.querySelector('option[value="' + qEnd + '"]')) endSelect.value = qEnd;

    function currentData() {
      var roomId = roomSelect.value;
      var room = findRoom(roomId);
      var alat = $$('input[name="alat"]:checked').map(function (i) {
        return i.value;
      });
      var alatLain = $("#alat-lain").value.trim();
      if (alatLain) alat.push(alatLain);

      return {
        roomId: roomId,
        roomName: room ? room.name : otherInput.value.trim(),
        date: datePicker.getValue(),
        start: startSelect.value,
        end: endSelect.value,
        peserta: $("#peserta").value,
        alat: alat,
      };
    }

    function updateSummary() {
      var d = currentData();
      var rows = [
        ["Ruangan", d.roomName || ""],
        ["Tanggal", d.date ? fmtLong(fromISO(d.date)) : ""],
        ["Waktu", d.start && d.end ? d.start + "–" + d.end : ""],
      ];

      if (d.start && d.end) {
        var a = parseTime(d.start);
        var b = parseTime(d.end);
        if (b > a) rows.push(["Durasi", duration(a, b)]);
      }

      rows.push(["Peserta", d.peserta ? d.peserta + " orang" : ""]);
      rows.push(["Alat", d.alat.length ? d.alat.join(", ") : ""]);

      summaryEls.forEach(function (host) {
        if (!host) return;
        host.innerHTML = rows
          .map(function (row) {
            return (
              '<div class="summary__row"><span class="summary__label">' +
              row[0] +
              '</span><span class="summary__value' +
              (row[1] ? "" : " summary__empty") +
              '">' +
              (row[1] ? esc(row[1]) : "Belum diisi") +
              "</span></div>"
            );
          })
          .join("");
      });
    }

    function clashNow() {
      var d = currentData();
      if (!d.date || !d.start || !d.end || !findRoom(d.roomId)) return null;
      var a = parseTime(d.start);
      var b = parseTime(d.end);
      if (!(b > a)) return null;

      var hit = bookingsOn(d.date).filter(function (x) {
        return x.room === d.roomId && x.start < b && a < x.end;
      })[0];
      return hit || null;
    }

    function updateClash() {
      var hit = clashNow();
      if (hit) {
        clashBanner.hidden = false;
      } else {
        clashBanner.hidden = true;
        ack.checked = false;
      }
    }

    function fieldWrap(name) {
      return form.querySelector('[data-field="' + name + '"]');
    }

    function setError(name, message) {
      var wrap = fieldWrap(name);
      if (!wrap) return;
      wrap.classList.add("is-invalid");

      var control = wrap.querySelector("input:not([type=hidden]), select, textarea, .date-trigger");
      if (control) control.setAttribute("aria-invalid", "true");

      var err = wrap.querySelector(".err");
      if (err) {
        err.textContent = message;
        err.hidden = false;
      }
    }

    function clearFieldError(name) {
      var wrap = fieldWrap(name);
      if (!wrap) return;
      wrap.classList.remove("is-invalid");

      var control = wrap.querySelector("input:not([type=hidden]), select, textarea, .date-trigger");
      if (control) control.removeAttribute("aria-invalid");

      var err = wrap.querySelector(".err");
      if (err) {
        err.hidden = true;
        err.textContent = "";
      }

      if (errorList) {
        var item = errorList.querySelector('li[data-field="' + name + '"]');
        if (item) item.remove();
        if (!errorList.children.length) errorSummary.hidden = true;
      }
    }

    function clearAllErrors() {
      ["ormawa", "nama", "hp", "tanggal", "ruangan", "ruangan-lain", "mulai", "selesai", "peserta", "keperluan"].forEach(
        clearFieldError
      );
      var errAck = $("#err-ack");
      if (errAck) {
        errAck.hidden = true;
        errAck.textContent = "";
      }
      if (errorSummary) errorSummary.hidden = true;
    }

    function validate() {
      var errors = [];
      var ormawa = $("#ormawa").value.trim();
      var nama = $("#nama").value.trim();
      var hp = $("#hp").value.trim();
      var d = currentData();

      if (!ormawa) errors.push(["ormawa", "Nama ORMAWA/Prodi wajib diisi.", "ormawa"]);
      if (!nama) errors.push(["nama", "Nama mahasiswa wajib diisi.", "nama"]);

      var digits = hp.replace(/\D/g, "");
      if (!hp) errors.push(["hp", "Nomor HP wajib diisi.", "hp"]);
      else if (digits.length < 9 || digits.length > 15)
        errors.push(["hp", "Masukkan nomor HP yang dapat dihubungi.", "hp"]);

      if (!d.date) errors.push(["tanggal", "Hari/tanggal peminjaman wajib diisi.", "tanggal-trigger"]);
      else if (fromISO(d.date).getDay() === 0)
        errors.push([
          "tanggal",
          "Peminjaman ruangan tidak dapat dilakukan pada hari Minggu.",
          "tanggal-trigger",
        ]);

      if (!d.roomId) errors.push(["ruangan", "Nama ruangan wajib dipilih.", "ruangan"]);
      if (d.roomId === "lain" && !otherInput.value.trim())
        errors.push(["ruangan-lain", "Sebutkan nama ruangan yang belum terdaftar.", "ruangan-lain"]);

      if (!d.start) errors.push(["mulai", "Waktu mulai wajib diisi.", "mulai"]);
      if (!d.end) errors.push(["selesai", "Waktu selesai wajib diisi.", "selesai"]);

      if (d.start && d.end) {
        var a = parseTime(d.start);
        var b = parseTime(d.end);
        if (!(b > a))
          errors.push([
            "selesai",
            "Waktu selesai harus lebih akhir daripada waktu mulai. Silakan periksa kembali.",
            "selesai",
          ]);
      }

      var peserta = Number(d.peserta);
      if (!d.peserta) errors.push(["peserta", "Jumlah peserta wajib diisi.", "peserta"]);
      else if (!isFinite(peserta) || peserta < 1 || Math.floor(peserta) !== peserta)
        errors.push(["peserta", "Jumlah peserta minimal 1 orang.", "peserta"]);

      var keperluan = $("#keperluan").value.trim();
      if (keperluan.length < 10)
        errors.push([
          "keperluan",
          "Tuliskan keperluan peminjaman minimal 10 karakter.",
          "keperluan",
        ]);

      var hit = clashNow();
      if (hit && !ack.checked) {
        errors.push([
          "ack",
          "Konfirmasi pemeriksaan jadwal diperlukan sebelum mengirim.",
          "ack-jadwal",
        ]);
      }

      return errors;
    }

    function showErrors(errors) {
      clearAllErrors();

      errors.forEach(function (e) {
        if (e[0] === "ack") {
          var errAck = $("#err-ack");
          if (errAck) {
            errAck.textContent = e[1];
            errAck.hidden = false;
          }
          return;
        }
        setError(e[0], e[1]);
      });

      var onlyAck =
        errors.length === 1 &&
        errors[0][0] === "ack";

      errorList.innerHTML = errors
        .map(function (e) {
          return '<li data-field="' + e[0] + '"><a href="#' + e[2] + '">' + esc(e[1]) + "</a></li>";
        })
        .join("");

      if (onlyAck) {
        errorSummary.hidden = true;
        ack.focus();
        clashBanner.scrollIntoView({ block: "center" });
        return;
      }

      errorSummary.hidden = false;
      errorSummary.focus();
      errorSummary.scrollIntoView({ block: "center" });
    }

    if (errorList) {
      errorList.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (!link) return;
        var target = document.getElementById(link.getAttribute("href").slice(1));
        if (!target) return;
        e.preventDefault();
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: "center" });
      });
    }

    // Interaksi dasar
    roomSelect.addEventListener("change", function () {
      otherField.hidden = roomSelect.value !== "lain";
      clearFieldError("ruangan");
      clearFieldError("ruangan-lain");
      updateSummary();
      updateClash();
    });

    [startSelect, endSelect].forEach(function (select) {
      select.addEventListener("change", function () {
        clearFieldError(select === startSelect ? "mulai" : "selesai");
        updateSummary();
        updateClash();
      });
    });

    ["ormawa", "nama", "hp", "peserta", "keperluan", "ruangan-lain"].forEach(function (name) {
      var input = $("#" + name);
      input.addEventListener("input", function () {
        clearFieldError(name);
        updateSummary();
      });
    });

    $$('input[name="alat"]').forEach(function (i) {
      i.addEventListener("change", updateSummary);
    });
    $("#alat-lain").addEventListener("input", updateSummary);

    var keperluan = $("#keperluan");
    var charCount = $("#char-keperluan");    keperluan.addEventListener("input", function () {
      charCount.textContent = keperluan.value.length + "/500";
    });

    ack.addEventListener("change", function () {
      if (ack.checked) {
        var errAck = $("#err-ack");
        if (errAck) errAck.hidden = true;
        if (errorList) {
          var item = errorList.querySelector('li[data-field="ack"]');
          if (item) item.remove();
          if (!errorList.children.length) errorSummary.hidden = true;
        }
      }
    });

    var retrySave = $("#btn-retry-save");
    if (retrySave) {
      retrySave.addEventListener("click", function () {
        var saveError = $("#save-error");
        if (saveError) saveError.hidden = true;
        form.requestSubmit();
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errors = validate();

      if (errors.length) {
        showErrors(errors);
        toast("Pengajuan belum dikirim. Periksa kolom yang ditandai.", "danger");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.textContent = "Mengirim…";

      var d = currentData();
      IDB.create({
        ormawa: $("#ormawa").value.trim(),
        nama: $("#nama").value.trim(),
        hp: $("#hp").value.trim(),
        purpose: $("#keperluan").value.trim(),
        peserta: d.peserta,
        alat: d.alat,
        roomId: d.roomId,
        roomName: d.roomId === "lain" ? d.roomName : IDB.roomName(d.roomId),
        date: d.date,
        start: d.start,
        end: d.end,
      }).then(function (result) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.textContent = "Kirim Pengajuan";

        if (!result.ok) {
          var saveError = $("#save-error");
          if (saveError) {
            saveError.hidden = false;
            saveError.focus();
            saveError.scrollIntoView({ block: "center" });
          }
          toast(
            result.message || "Pengajuan belum berhasil disimpan. Silakan coba kembali.",
            "danger"
          );
          return;
        }

        var rec = result.record;
        $("#success-id").textContent = rec.id;

        var rows = [
          ["Ruangan", d.roomName],
          ["Tanggal", fmtLong(fromISO(d.date))],
          ["Waktu", d.start + "–" + d.end + " WITA"],
          ["Durasi", duration(parseTime(d.start), parseTime(d.end))],
          ["Peserta", d.peserta + " orang"],
          ["Alat", d.alat.length ? d.alat.join(", ") : "-"],
        ];

        $("#success-summary").innerHTML = rows
          .map(function (r) {
            return (
              '<div class="success__row"><dt>' +
              r[0] +
              "</dt><dd>" +
              esc(r[1]) +
              "</dd></div>"
            );
          })
          .join("");

        var detailHref = "pengajuan-detail.html?id=" + encodeURIComponent(rec.id);
        var statusLink = $("#link-status");
        if (statusLink) {
          if (IDB.session()) {
            statusLink.href = detailHref;
            statusLink.textContent = "Lihat status pengajuan";
          } else {
            statusLink.href = IDBUI.loginUrl(detailHref, "baru");
            statusLink.textContent = "Masuk untuk melihat status";
          }
        }

        layoutEl.hidden = true;
        successEl.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
        successEl.focus({ preventScroll: true });
        toast("Pengajuan berhasil dikirim dan sedang menunggu pemeriksaan.");
      });

    });

    $("#btn-new").addEventListener("click", function () {
      form.reset();
      datePicker.clear();
      otherField.hidden = true;
      clashBanner.hidden = true;
      var saveError = $("#save-error");
      if (saveError) saveError.hidden = true;
      clearAllErrors();
      charCount.textContent = "0/500";
      updateSummary();
      successEl.hidden = true;
      layoutEl.hidden = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      $("#ormawa").focus({ preventScroll: true });
    });

    updateClash();
    updateSummary();
  }

  /* ---------- Mulai ---------- */

  function start() {
    initRoomsPage();
    initFormPage();
  }

  if (window.IDB && window.IDB.ready) {
    window.IDB.ready.then(start);
  } else {
    start();
  }
})();
