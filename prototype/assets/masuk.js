/* Halaman masuk — autentikasi akun dan pengalihan sesuai peran. */

(function () {
  "use strict";

  window.IDB.ready.then(function () {
    var form = document.getElementById("form-masuk");
    if (!form) return;

    var params = new URLSearchParams(window.location.search);
    var next = safeNext(params.get("next"));
    var reason = params.get("alasan");

    var idInput = document.getElementById("id-pengguna");
    var passwordInput = document.getElementById("kata-sandi");
    var roleInputs = Array.prototype.slice.call(
      form.querySelectorAll('input[name="peran"]')
    );
    var authNote = document.getElementById("auth-note");
    var toggle = document.getElementById("toggle-password");
    var toggleLabel = document.getElementById("toggle-password-label");
    var submitBtn = document.getElementById("btn-masuk");
    var submitLabel = document.getElementById("btn-masuk-label");
    var loginError = document.getElementById("login-error");
    var idError = document.getElementById("err-id");
    var passwordError = document.getElementById("err-password");
    var reasonBox = document.getElementById("auth-reason");
    var reasonText = document.getElementById("auth-reason-text");
    var sessionPanel = document.getElementById("session-panel");
    var sessionMeta = document.getElementById("session-meta");
    var sessionContinue = document.getElementById("session-continue");
    var sessionLogout = document.getElementById("session-logout");
    var session = window.IDB.session();

    var texts = {
      masuk: "Silakan masuk untuk melanjutkan.",
      sesi: "Sesi Anda telah berakhir. Silakan masuk kembali.",
      baru: "Pengajuan berhasil dikirim. Masuk untuk melihat statusnya.",
      keluar: "Anda telah keluar. Masuk kembali untuk membuka data pengajuan.",
      peran: "Akun ini tidak memiliki akses ke halaman yang diminta.",
    };

    /* Akun uji lokal untuk mempercepat pengujian. Hapus sebelum produksi. */
    var testAccounts = {
      peminjam: { id: "peminjam01", password: "Peminjam1#2026" },
      petugas: { id: "petugas01", password: "Petugas#2026" },
    };

    function safeNext(value) {
      if (!value) return "";
      var text = String(value).trim().replace(/^\/+/, "");
      if (text.indexOf("..") !== -1 || text.indexOf("//") !== -1) return "";
      if (!/^[a-z0-9][a-z0-9-]*\.html(?:\?[^#]*)?$/i.test(text)) return "";
      return text;
    }

    function roleLabel(role) {
      return role === "petugas" ? "Petugas Kemahasiswaan" : "Peminjam";
    }

    function isAdminPage(value) {
      return /^petugas(?:-|\.)/i.test(value || "");
    }

    function isBorrowerPage(value) {
      return /^ajukan\.html/i.test(value || "");
    }

    function defaultFor(role) {
      return role === "petugas" ? "petugas.html" : "pengajuan-saya.html";
    }

    function destinationFor(user, requested) {
      var fallback = defaultFor(user.role);
      if (!requested) return fallback;
      if (isAdminPage(requested) && user.role !== "petugas") return "tidak-berizin.html";
      if (isBorrowerPage(requested) && user.role !== "peminjam") return "petugas.html";
      return requested;
    }

    function clearErrors() {
      loginError.hidden = true;
      loginError.textContent = "";
      ["id-pengguna", "kata-sandi"].forEach(function (id) {
        var field = document.getElementById(id);
        var wrap = field ? field.closest(".field") : null;
        if (wrap) wrap.classList.remove("is-invalid");
        if (field) field.removeAttribute("aria-invalid");
        var error = id === "id-pengguna" ? idError : passwordError;
        if (error) {
          error.hidden = true;
          error.textContent = "";
        }
      });
    }

    function setFieldError(input, errorEl, message) {
      var wrap = input ? input.closest(".field") : null;
      if (wrap) wrap.classList.add("is-invalid");
      if (input) input.setAttribute("aria-invalid", "true");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    }

    function showLoginError(message) {
      loginError.textContent = message;
      loginError.hidden = false;
    }

    function selectedRole() {
      for (var i = 0; i < roleInputs.length; i += 1) {
        if (roleInputs[i].checked) return roleInputs[i].value;
      }
      return "peminjam";
    }

    function roleInfo(role) {
      if (role === "petugas") {
        return {
          idPlaceholder: "Masukkan ID petugas",
          note: "Gunakan akun Petugas Kemahasiswaan yang terdaftar. Peran yang dipilih harus cocok dengan data akun.",
        };
      }
      return {
        idPlaceholder: "Masukkan ID peminjam",
        note: "Gunakan akun Peminjam yang terdaftar. Peran yang dipilih harus cocok dengan data akun.",
      };
    }

    function applyRole(role) {
      var info = roleInfo(role);
      if (idInput) idInput.placeholder = info.idPlaceholder;
      if (authNote) authNote.textContent = info.note;
    }

    function setPasswordVisibility(visible) {
      if (!passwordInput) return;
      passwordInput.type = visible ? "text" : "password";
      if (toggle) {
        toggle.setAttribute("aria-pressed", String(visible));
        toggle.setAttribute(
          "aria-label",
          visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
        );
      }
      if (toggleLabel) toggleLabel.textContent = visible ? "Sembunyikan" : "Tampilkan";
    }

    function fillTestAccount(role) {
      var account = testAccounts[role] || testAccounts.peminjam;
      if (idInput) idInput.value = account.id;
      if (passwordInput) passwordInput.value = account.password;
      setPasswordVisibility(false);
      clearErrors();
    }

    function syncRole() {
      var role = selectedRole();
      applyRole(role);
      fillTestAccount(role);
    }

    function roleMismatchMessage(actualRole) {
      var actual = roleLabel(actualRole);
      var chosen = roleLabel(selectedRole());
      return (
        "Akun ini terdaftar sebagai " +
        actual +
        ", bukan " +
        chosen +
        ". Pilih peran " +
        actual +
        " atau gunakan akun " +
        chosen +
        "."
      );
    }

    if (reason && texts[reason]) {
      reasonText.textContent = texts[reason];
      reasonBox.hidden = false;
    }

    if (sessionLogout) {
      sessionLogout.addEventListener("click", function () {
        window.IDB.logout().then(function () {
          window.location.reload();
        });
      });
    }

    if (session) {
      form.hidden = true;
      sessionPanel.hidden = false;
      sessionMeta.textContent =
        "Masuk sebagai " +
        session.name +
        " · " +
        roleLabel(session.role) +
        (session.unit ? " · " + session.unit : "");
      sessionContinue.href = destinationFor(session, next);
      return;
    }

    sessionPanel.hidden = true;
    form.hidden = false;

    roleInputs.forEach(function (input) {
      input.addEventListener("change", syncRole);
      input.addEventListener("click", syncRole);
    });
    applyRole(selectedRole());

    if (idInput) {
      idInput.addEventListener("input", function () {
        clearErrors();
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener("input", function () {
        clearErrors();
      });
    }

    if (toggle && passwordInput) {
      toggle.addEventListener("click", function () {
        setPasswordVisibility(passwordInput.type !== "text");
        passwordInput.focus();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();

      var userId = idInput ? idInput.value.trim() : "";
      var password = passwordInput ? passwordInput.value : "";
      var role = selectedRole();
      var invalid = false;

      if (!userId) {
        setFieldError(idInput, idError, "ID pengguna wajib diisi.");
        invalid = true;
      }

      if (!password) {
        setFieldError(passwordInput, passwordError, "Kata sandi wajib diisi.");
        invalid = true;
      }

      if (invalid) {
        showLoginError("Lengkapi ID pengguna dan kata sandi.");
        (userId ? passwordInput : idInput).focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.classList.add("is-loading");
      if (submitLabel) submitLabel.textContent = "Memeriksa…";
      roleInputs.forEach(function (input) {
        input.disabled = true;
      });

      window.IDB.login(userId, password, role).then(function (result) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        submitBtn.classList.remove("is-loading");
        if (submitLabel) submitLabel.textContent = "Masuk";
        roleInputs.forEach(function (input) {
          input.disabled = false;
        });

        if (!result.ok) {
          if (result.code === "role_mismatch") {
            showLoginError(result.message || roleMismatchMessage(result.role));
            passwordInput.value = "";
            setPasswordVisibility(false);
            passwordInput.focus();
            return;
          }

          if (result.code === "invalid_credentials") {
            showLoginError("ID pengguna atau kata sandi tidak sesuai.");
            passwordInput.value = "";
            passwordInput.focus();
          } else {
            showLoginError(result.message || "Login belum berhasil. Silakan coba kembali.");
            (result.code === "rate_limited" ? passwordInput : idInput).focus();
          }
          return;
        }

        if (!result.user) {
          showLoginError("Data akun tidak lengkap. Silakan coba kembali.");
          return;
        }

        if (result.user.role !== role) {
          window.IDB.logout();
          showLoginError(roleMismatchMessage(result.user.role));
          passwordInput.value = "";
          setPasswordVisibility(false);
          passwordInput.focus();
          return;
        }

        window.location.href = destinationFor(result.user, next);
      });
    });
  });
})();
