// public/form-a11y.js
// Consistent accessible forms helper (TODO 07.1 / A-05)

export function setupFormA11y(form, options = {}) {
  form.noValidate = true;
  const {
    errorSummaryId,
    statusId,
    summaryTitle = 'Periksa kembali isian formulir:',
    onFieldFocus,
  } = options;

  let summaryEl = errorSummaryId ? (form.querySelector(`#${errorSummaryId}`) || document.getElementById(errorSummaryId)) : form.querySelector('.form-error-summary');
  if (!summaryEl && errorSummaryId) {
    summaryEl = document.createElement('div');
    summaryEl.id = errorSummaryId;
    summaryEl.className = 'form-error-summary archive-edit-error';
    summaryEl.setAttribute('role', 'alert');
    summaryEl.setAttribute('tabindex', '-1');
    summaryEl.hidden = true;
    form.prepend(summaryEl);
  }

  let statusEl = statusId ? (form.querySelector(`#${statusId}`) || document.getElementById(statusId)) : form.querySelector('.form-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    if (statusId) statusEl.id = statusId;
    statusEl.className = 'form-status sr-only';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', 'polite');
    form.append(statusEl);
  }

  function getFieldLabel(control) {
    let label = form.querySelector(`label[for="${control.id}"]`);
    if (!label && control.id) {
      label = document.querySelector(`label[for="${control.id}"]`);
    }
    if (!label) {
      label = control.closest('label');
    }
    if (label) {
      const clone = label.cloneNode(true);
      clone.querySelectorAll('.field-req-text, .field-opt-text, .field-help, .field-error, small').forEach(el => el.remove());
      return clone.textContent.trim();
    }
    return control.name || 'Kolom';
  }

  function attachAriaError(control, errorId) {
    const current = (control.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(id => id && id !== errorId);
    control.setAttribute('aria-describedby', [errorId, ...current].join(' '));
  }

  function detachAriaError(control, errorId) {
    const current = (control.getAttribute('aria-describedby') || '')
      .split(/\s+/)
      .filter(id => id && id !== errorId && !id.endsWith('-error'));
    if (current.length > 0) {
      control.setAttribute('aria-describedby', current.join(' '));
    } else {
      control.removeAttribute('aria-describedby');
    }
  }

  function showErrors(fieldErrors = [], generalMessage = '') {
    clearErrors();

    const is401 = (generalMessage && (generalMessage.includes('Sesi') || generalMessage.includes('401') || generalMessage.includes('Unauthorized')));
    let displayMessage = generalMessage;
    if (is401) {
      displayMessage = 'Sesi Anda telah berakhir. Formulir tetap dibuka agar draf Anda tidak hilang. Silakan salin draf Anda atau buka tab baru untuk masuk kembali.';
    }

    if (summaryEl) {
      summaryEl.innerHTML = '';
      const heading = document.createElement('h4');
      heading.className = 'form-error-title';
      heading.textContent = summaryTitle;
      summaryEl.appendChild(heading);

      if (displayMessage) {
        const genP = document.createElement('p');
        genP.className = 'form-error-desc';
        genP.textContent = displayMessage;
        summaryEl.appendChild(genP);
      }

      if (fieldErrors.length > 0) {
        const list = document.createElement('ul');
        list.className = 'error-summary-list';
        for (const err of fieldErrors) {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${err.id}`;
          link.textContent = err.message;
          link.onclick = (e) => {
            e.preventDefault();
            const el = form.querySelector(`#${err.id}`) || document.getElementById(err.id);
            if (el) {
              el.focus();
              if (onFieldFocus) onFieldFocus(el);
            }
          };
          li.appendChild(link);
          list.appendChild(li);
        }
        summaryEl.appendChild(list);
      }

      summaryEl.hidden = false;
      summaryEl.setAttribute('tabindex', '-1');
      summaryEl.focus();
    }

    // Set inline field errors
    for (const err of fieldErrors) {
      const control = form.querySelector(`#${err.id}`) || document.getElementById(err.id);
      if (control) {
        control.setAttribute('aria-invalid', 'true');
        let errorSpan = form.querySelector(`#${err.id}-error`);
        if (!errorSpan) {
          errorSpan = document.createElement('span');
          errorSpan.id = `${err.id}-error`;
          errorSpan.className = 'field-error';
          control.insertAdjacentElement('afterend', errorSpan);
        }
        errorSpan.textContent = err.message;
        errorSpan.hidden = false;

        attachAriaError(control, errorSpan.id);
      }
    }

    if (statusEl) {
      statusEl.textContent = displayMessage || 'Terdapat kesalahan pengisian formulir. Periksa pesan di atas.';
    }
  }

  function clearErrors() {
    if (summaryEl) {
      summaryEl.hidden = true;
      summaryEl.innerHTML = '';
    }
    form.querySelectorAll('.field-error').forEach(el => {
      el.hidden = true;
      el.textContent = '';
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach(control => {
      control.removeAttribute('aria-invalid');
      const errEl = form.querySelector(`#${control.id}-error`);
      detachAriaError(control, errEl ? errEl.id : `${control.id}-error`);
    });
  }

  function validate() {
    clearErrors();
    const fieldErrors = [];
    const controls = [...form.elements].filter(el => {
      if (!el.name && !el.id) return false;
      if (['submit', 'button', 'reset'].includes(el.type)) return false;
      if (el.disabled) return false;
      if (el.closest('[hidden]') || el.closest('.hidden')) return false;
      return true;
    });

    for (const control of controls) {
      if (!control.checkValidity()) {
        const label = getFieldLabel(control);
        let msg = `${label} wajib diisi.`;
        if (control.validity.typeMismatch) {
          msg = `Format ${label} tidak valid.`;
        } else if (control.validity.tooShort) {
          msg = `${label} minimal ${control.minLength} karakter.`;
        } else if (control.validity.patternMismatch) {
          msg = `Format ${label} tidak sesuai.`;
        } else if (control.validationMessage) {
          msg = `${label}: ${control.validationMessage}`;
        }
        fieldErrors.push({ id: control.id || control.name, message: msg, control });
      }
    }

    if (fieldErrors.length > 0) {
      showErrors(fieldErrors);
      return false;
    }
    return true;
  }

  function setSubmitting(statusText = 'Sedang menyimpan…') {
    clearErrors();
    form.setAttribute('aria-busy', 'true');
    if (statusEl) statusEl.textContent = statusText;
  }

  function setSuccess(statusText = 'Data berhasil disimpan.') {
    form.setAttribute('aria-busy', 'false');
    if (statusEl) statusEl.textContent = statusText;
  }

  function setFailure(message, fieldErrors = []) {
    form.setAttribute('aria-busy', 'false');
    showErrors(fieldErrors, message);
  }

  return {
    summaryEl,
    statusEl,
    showErrors,
    clearErrors,
    validate,
    setSubmitting,
    setSuccess,
    setFailure,
    getFieldLabel,
  };
}
