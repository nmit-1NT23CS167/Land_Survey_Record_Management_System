/* main.js — LandSurveyPro client-side utilities */

// ── Auto-dismiss alerts after 5s ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var alerts = document.querySelectorAll('.alert-float .alert');
  alerts.forEach(function (alert) {
    setTimeout(function () {
      var bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 5000);
  });

  // ── File drop-zone interactions ─────────────────────────────────────────────
  document.querySelectorAll('.file-drop-zone').forEach(function (zone) {
    var input = zone.querySelector('.file-input');
    var previewId = zone.id === 'proofDrop' ? 'proofPreview' : zone.id === 'imgDrop' ? 'imgPreview' : null;
    var preview = previewId ? document.getElementById(previewId) : null;

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (input) {
        input.files = e.dataTransfer.files;
        showFilePreview(e.dataTransfer.files, preview);
      }
    });

    if (input) {
      input.addEventListener('change', function () {
        showFilePreview(input.files, preview);
      });
    }
  });

  function showFilePreview(files, container) {
    if (!container) return;
    container.innerHTML = '';
    Array.from(files).forEach(function (file) {
      var item = document.createElement('div');
      item.className = 'file-preview-item';
      item.innerHTML =
        '<i class="bi bi-file-earmark-check" style="color:var(--green-soft)"></i>' +
        '<span>' + file.name + '</span>' +
        '<small>(' + (file.size / 1024).toFixed(1) + ' KB)</small>';
      container.appendChild(item);
    });
  }

  // ── Confirm delete forms ─────────────────────────────────────────────────
  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!confirm(form.dataset.confirm)) e.preventDefault();
    });
  });

  // ── Highlight active nav link ────────────────────────────────────────────
  var path = window.location.pathname;
  document.querySelectorAll('.lsm-navbar .nav-link').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href !== '/' && path.startsWith(href)) {
      link.style.color = 'var(--gold-light)';
      link.style.background = 'var(--surface)';
    }
  });
});