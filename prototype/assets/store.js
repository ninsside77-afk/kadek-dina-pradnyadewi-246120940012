/* ==========================================================================
   DATA BERSAMA
   Sumber tunggal untuk ruangan, pengajuan, sesi, dan keputusan.
   Data pengajuan, akun, dan sesi diverifikasi oleh server lokal.
   ========================================================================== */

(function (global) {
  "use strict";

  /* ---------- Bangunan & ruangan (Lampiran B, belum final) ---------- */

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

  /* ---------- Waktu ---------- */

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

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(d, n) {
    var x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function nextWorkday(offset) {
    var d = startOfToday();
    var added = 0;
    while (added < offset) {
      d = addDays(d, 1);
      if (d.getDay() !== 0) added++;
    }
    return toISO(d);
  }

  function pastWorkday(daysAgo) {
    var d = startOfToday();
    var added = 0;
    while (added < daysAgo) {
      d = addDays(d, -1);
      if (d.getDay() !== 0) added++;
    }
    return toISO(d);
  }

  function fmtTime(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    return pad(hh) + "." + pad(mm);
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

  function fmtLong(value) {
    var d = typeof value === "string" ? fromISO(value) : value;
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function fmtFull(value) {
    var d = typeof value === "string" ? fromISO(value) : value;
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function fmtStamp(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) + ", " + pad(d.getHours()) + "." + pad(d.getMinutes());
  }

  function ageLabel(iso) {
    var created = new Date(iso);
    var now = new Date();
    var days = Math.floor((now - created) / 86400000);
    if (days <= 0) return "Hari ini";
    if (days === 1) return "1 hari";
    return days + " hari";
  }

  /* ---------- Keadaan data ---------- */

  var state = {
    user: null,
    bookings: [],
    schedule: [],
    loadError: "",
  };

  var readyResolve = null;
  var readySettled = false;
  var ready = new Promise(function (resolve) {
    readyResolve = resolve;
  });

  function resolveReady() {
    if (readySettled) return;
    readySettled = true;
    if (readyResolve) {
      readyResolve(state);
      readyResolve = null;
    }
  }

  function loadError() {
    return state.loadError;
  }

  function api(method, url, body) {
    var options = {
      method: method,
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    };

    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    return global.fetch(url, options).then(function (response) {
      var type = response.headers.get("Content-Type") || "";
      var parsed = type.indexOf("application/json") !== -1
        ? response.json()
        : response.text().then(function (text) {
            return { message: text };
          });

      return parsed.catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok) {
          var error = new Error(
            data && data.message ? data.message : "Permintaan tidak dapat diproses."
          );
          error.status = response.status;
          error.code = data && data.code ? data.code : "request_failed";
          error.data = data || {};
          throw error;
        }
        return data || {};
      });
    });
  }

  function matchRequestError(error, fallback) {
    if (error && error.status) return error.message || fallback;
    return "Layanan tidak dapat dihubungi. Pastikan server berjalan, lalu coba kembali.";
  }

  function loadSchedule() {
    return api("GET", "/api/schedule").then(function (result) {
      state.schedule = Array.isArray(result.bookings) ? result.bookings : [];
    });
  }

  function loadBookings() {
    return api("GET", "/api/bookings").then(function (result) {
      state.bookings = Array.isArray(result.bookings) ? result.bookings : [];
    });
  }

  function refresh() {
    var tasks = [loadSchedule()];
    if (state.user) tasks.push(loadBookings());
    return Promise.all(tasks).catch(function (error) {
      if (error && error.status === 401) {
        state.user = null;
        state.bookings = [];
      } else {
        state.loadError = matchRequestError(error, "Data tidak dapat dimuat.");
      }
    });
  }

  function boot() {
    Promise.all([
      api("GET", "/api/session").then(function (result) {
        state.user = result.authenticated && result.user ? result.user : null;
      }),
      loadSchedule(),
    ])
      .then(function () {
        if (state.user) {
          return loadBookings().catch(function (error) {
            if (error && error.status === 401) {
              state.user = null;
              state.bookings = [];
            } else {
              state.loadError = matchRequestError(error, "Data pengajuan tidak dapat dimuat.");
            }
          });
        }
      })
      .catch(function (error) {
        state.loadError = matchRequestError(
          error,
          "Data tidak dapat dimuat. Pastikan server berjalan, lalu muat ulang halaman."
        );
      })
      .then(resolveReady);
  }

  /* ---------- Sesi ---------- */

  function session() {
    return state.user;
  }

  function login(userId, password, role) {
    var payload = {
      userId: String(userId || ""),
      password: String(password || ""),
    };
    if (role) payload.role = String(role);

    return api("POST", "/api/login", payload)
      .then(function (result) {
        state.user = result.user;
        state.loadError = "";
        return loadBookings()
          .catch(function (error) {
            state.loadError = matchRequestError(error, "Data pengajuan tidak dapat dimuat.");
          })
          .then(function () {
            return { ok: true, user: state.user };
          });
      })
      .catch(function (error) {
        return {
          ok: false,
          code: error && error.code ? error.code : "auth",
          message: matchRequestError(error, "ID pengguna atau kata sandi tidak sesuai."),
          role: error && error.data && error.data.role ? error.data.role : "",
        };
      });
  }

  function logout() {
    return api("POST", "/api/logout", {})
      .catch(function () {
        /* Sesi lokal tetap dibersihkan meskipun server tidak dapat dihubungi. */
      })
      .then(function () {
        state.user = null;
        state.bookings = [];
        return { ok: true };
      });
  }

  /* ---------- Turunan ---------- */

  function roomName(id) {
    var room = ROOMS.filter(function (item) {
      return item.id === id;
    })[0];
    return room ? room.name : "";
  }

  function findRoom(id) {
    return ROOMS.filter(function (room) {
      return room.id === id;
    })[0] || null;
  }

  function numberTime(value) {
    return typeof value === "number" ? value : parseTime(value);
  }

  function overlaps(a, b) {
    var aRoom = a.roomId || a.room;
    var bRoom = b.roomId || b.room;
    var aStart = numberTime(a.start);
    var aEnd = numberTime(a.end);
    var bStart = numberTime(b.start);
    var bEnd = numberTime(b.end);
    return aRoom === bRoom && a.date === b.date && aStart < bEnd && bStart < aEnd;
  }

  function bookingsOn(date) {
    return state.schedule
      .filter(function (item) {
        return (
          item.date === date &&
          (item.status === "approved" || item.status === "pending") &&
          !!findRoom(item.roomId)
        );
      })
      .map(function (item) {
        return {
          id: item.id,
          room: item.roomId,
          roomId: item.roomId,
          roomName: item.roomName,
          date: item.date,
          start: parseTime(item.start),
          end: parseTime(item.end),
          status: item.status,
          by: item.ormawa,
          purpose: item.purpose,
        };
      })
      .sort(function (a, b) {
        return a.start - b.start;
      });
  }

  function scheduleFor(roomId, date) {
    return state.schedule
      .filter(function (item) {
        return item.roomId === roomId && item.date === date && item.status !== "rejected";
      })
      .slice()
      .sort(function (a, b) {
        return parseTime(a.start) - parseTime(b.start);
      });
  }

  function conflictsFor(record) {
    if (!record || !findRoom(record.roomId)) {
      return { approved: [], pending: [] };
    }
    var list = scheduleFor(record.roomId, record.date).filter(function (item) {
      return (
        item.id !== record.id &&
        (item.status === "approved" || item.status === "pending") &&
        overlaps(record, item)
      );
    });
    return {
      approved: list.filter(function (item) {
        return item.status === "approved";
      }),
      pending: list.filter(function (item) {
        return item.status === "pending";
      }),
    };
  }

  function all() {
    return state.bookings;
  }

  function get(id) {
    var full = state.bookings.filter(function (item) {
      return item.id === id;
    })[0];
    if (full) return full;

    var publicItem = state.schedule.filter(function (item) {
      return item.id === id;
    })[0];
    if (!publicItem) return null;

    return {
      id: publicItem.id,
      ormawa: publicItem.ormawa,
      purpose: publicItem.purpose,
      roomId: publicItem.roomId,
      roomName: publicItem.roomName,
      date: publicItem.date,
      start: publicItem.start,
      end: publicItem.end,
      status: publicItem.status,
      mine: false,
      publicOnly: true,
    };
  }

  function mine() {
    return state.bookings
      .filter(function (item) {
        return item.mine || (state.user && item.ownerId === state.user.id);
      })
      .sort(function (a, b) {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }

  function stats() {
    var list = state.schedule.length ? state.schedule : state.bookings;
    return {
      total: list.length,
      pending: list.filter(function (item) {
        return item.status === "pending";
      }).length,
      approved: list.filter(function (item) {
        return item.status === "approved";
      }).length,
      rejected: list.filter(function (item) {
        return item.status === "rejected";
      }).length,
    };
  }

  function nextId() {
    var maximum = 30;
    state.bookings.concat(state.schedule).forEach(function (item) {
      var number = Number(String(item.id || "").split("-").pop());
      if (isFinite(number) && number > maximum) maximum = number;
    });
    return "IDB-2026-" + String(maximum + 1).padStart(4, "0");
  }

  function create(payload) {
    return api("POST", "/api/bookings", payload)
      .then(function (result) {
        return refresh().then(function () {
          return {
            ok: true,
            record: result.booking,
            conflicts: result.conflicts || { approved: [], pending: [] },
          };
        });
      })
      .catch(function (error) {
        return {
          ok: false,
          code: error && error.code ? error.code : "save",
          message: matchRequestError(error, "Pengajuan belum berhasil disimpan. Silakan coba kembali."),
          errors: (error && error.data && error.data.errors) || [],
        };
      });
  }

  function decide(id, action, reason) {
    return api("POST", "/api/bookings/" + encodeURIComponent(id) + "/decision", {
      action: action,
      reason: reason || "",
    })
      .then(function (result) {
        return refresh().then(function () {
          return { ok: true, record: result.booking };
        });
      })
      .catch(function (error) {
        return {
          ok: false,
          code: error && error.code ? error.code : "save",
          message: matchRequestError(error, "Keputusan belum berhasil disimpan. Silakan coba kembali."),
          conflicts: (error && error.data && error.data.conflicts) || null,
        };
      });
  }

  function letterUrl(id) {
    return "/api/bookings/" + encodeURIComponent(id) + "/letter";
  }

  /* ---------- Label status ---------- */

  function statusLabel(status) {
    if (status === "approved") return "Disetujui";
    if (status === "rejected") return "Ditolak";
    if (status === "cancelled") return "Dibatalkan";
    return "Menunggu Pemeriksaan";
  }

  function statusClass(status) {
    if (status === "approved") return "badge--approved";
    if (status === "rejected") return "badge--rejected";
    if (status === "cancelled") return "badge--cancelled";
    return "badge--pending";
  }

  function statusMessage(status) {
    if (status === "approved") return "Pengajuan peminjaman ruangan Anda telah disetujui.";
    if (status === "rejected")
      return "Pengajuan peminjaman ruangan Anda ditolak. Silakan periksa alasan yang diberikan.";
    return "Pengajuan sedang menunggu pemeriksaan Bagian Kemahasiswaan.";
  }

  function letterState(record) {
    if (!record) return "unavailable";
    if (record.status === "rejected") return "rejected";
    if (record.status !== "approved") return "unavailable";
    return record.letter === "ready" ? "ready" : "processing";
  }

  /* ---------- Ekspor ---------- */

  global.IDB = {
    BUILDINGS: BUILDINGS,
    ROOMS: ROOMS,

    ready: ready,
    loadError: loadError,
    refresh: refresh,

    all: all,
    get: get,
    create: create,
    decide: decide,
    mine: mine,
    stats: stats,
    nextId: nextId,
    letterUrl: letterUrl,

    bookingsOn: bookingsOn,
    conflictsFor: conflictsFor,
    scheduleFor: scheduleFor,
    findRoom: findRoom,
    roomName: roomName,
    overlaps: overlaps,

    statusLabel: statusLabel,
    statusClass: statusClass,
    statusMessage: statusMessage,
    letterState: letterState,

    session: session,
    login: login,
    logout: logout,

    toISO: toISO,
    fromISO: fromISO,
    startOfToday: startOfToday,
    addDays: addDays,
    nextWorkday: nextWorkday,
    pastWorkday: pastWorkday,
    fmtTime: fmtTime,
    parseTime: parseTime,
    duration: duration,
    fmtLong: fmtLong,
    fmtFull: fmtFull,
    fmtStamp: fmtStamp,
    ageLabel: ageLabel,
    pad: pad,
  };

  boot();
})(window);
