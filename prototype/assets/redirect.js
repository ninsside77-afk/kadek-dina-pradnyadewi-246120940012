/* Halaman pertama: arahkan ke masuk atau dasbor sesuai sesi. */

(function () {
  "use strict";

  var redirected = false;

  function go(url) {
    if (redirected) return;
    redirected = true;
    window.location.replace(url);
  }

  function decide() {
    var session = null;

    try {
      session = window.IDB && window.IDB.session ? window.IDB.session() : null;
    } catch (error) {
      session = null;
    }

    if (!session) {
      go("masuk.html");
      return;
    }

    go(session.role === "petugas" ? "petugas.html" : "pengajuan-saya.html");
  }

  if (window.IDB && window.IDB.ready) {
    window.IDB.ready.then(decide);
  } else {
    go("masuk.html");
  }

  // Cadangan bila pemuatan sesi tidak selesai.
  window.setTimeout(function () {
    go("masuk.html");
  }, 2500);
})();
