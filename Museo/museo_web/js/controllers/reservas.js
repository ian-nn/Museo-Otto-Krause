import { postJson } from '../services/api.js';

const availability = {
  personal: [
    { date: '2026-07-01', times: ['09:00', '14:00'] },
    { date: '2026-07-03', times: ['09:00'] },
    { date: '2026-07-08', times: ['14:00'] }
  ],
  escolar: [
    { date: '2026-07-02', times: ['09:00', '14:00'] },
    { date: '2026-07-06', times: ['09:00'] },
    { date: '2026-07-10', times: ['14:00'] }
  ],
  institucional: [
    { date: '2026-07-04', times: ['09:00', '14:00'] },
    { date: '2026-07-09', times: ['09:00'] },
    { date: '2026-07-12', times: ['14:00'] }
  ]
};

const header = document.querySelector('.main-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

const tabButtons = document.querySelectorAll('.tab-btn');
const tabGroups = document.querySelectorAll('.form-tab-group');
const form = document.getElementById('reserva-form');
const fechaSelect = document.getElementById('fecha');
const horarioSelect = document.getElementById('horario');
const successPanel = document.getElementById('success-panel');
const successTitle = document.getElementById('success-title');
const successText = document.getElementById('success-text');
const resetBtn = document.getElementById('reset-btn');
const addPersonalExtraBtn = document.getElementById('add-personal-extra');
const addEscolarExtraBtn = document.getElementById('add-escolar-extra');
const addInstitucionalExtraBtn = document.getElementById('add-institucional-extra');
const personalExtraList = document.getElementById('personal-extra-list');
const escolarExtraList = document.getElementById('escolar-extra-list');
const institucionalExtraList = document.getElementById('institucional-extra-list');

let currentTab = 'personal';

const namePattern = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\s]+$/;
const phonePattern = /^[0-9+()\-\s]{7,20}$/;
const dniPattern = /^\d{8}$/;
const cuePattern = /^\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function clearErrors() {
  document.querySelectorAll('[data-error]').forEach((el) => {
    el.textContent = '';
  });
  document.querySelectorAll('.form-input, .form-select').forEach((el) => {
    el.classList.remove('err');
  });
}

function updateDateOptions() {
  const options = availability[currentTab] || [];
  fechaSelect.innerHTML = '<option value="">— Seleccioná una fecha —</option>';
  options.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.date;
    option.textContent = `${formatDate(item.date)} (${item.times.join(' / ')})`;
    fechaSelect.appendChild(option);
  });
}

function getFieldValue(name) {
  const input = form.querySelector(`[name="${name}"]`);
  return input ? input.value.trim() : '';
}

function clearExtraRows() {
  personalExtraList.innerHTML = '';
  escolarExtraList.innerHTML = '';
  institucionalExtraList.innerHTML = '';
}

function addExtraRow(tabType) {
  const listMap = {
    personal: personalExtraList,
    escolar: escolarExtraList,
    institucional: institucionalExtraList
  };
  const list = listMap[tabType];
  if (!list) return;

  const index = list.children.length;
  const row = document.createElement('div');
  row.className = 'extra-row';
  row.style.marginTop = '10px';
  row.style.padding = '10px';
  row.style.border = '1px dashed var(--gray-200)';
  row.style.borderRadius = '8px';
  row.innerHTML = `
    <div class="form-row" style="margin-bottom:8px;">
      <div class="form-field">
        <label class="form-label">Nombre</label>
        <input class="form-input" type="text" name="${tabType}_extra_nombre_${index}" data-text-only="true" placeholder="Ej: Ana">
      </div>
      <div class="form-field">
        <label class="form-label">Apellido</label>
        <input class="form-input" type="text" name="${tabType}_extra_apellido_${index}" data-text-only="true" placeholder="Ej: Pérez">
      </div>
    </div>
    <div class="form-row" style="margin-bottom:0;">
      <div class="form-field">
        <label class="form-label">DNI</label>
        <input class="form-input" type="text" name="${tabType}_extra_dni_${index}" data-numeric-only="true" data-maxlength="8" inputmode="numeric" placeholder="Ej: 30111222">
      </div>
      <div class="form-field">
        <button type="button" class="btn-sm btn-reject remove-extra-btn">Eliminar</button>
      </div>
    </div>
  `;
  list.appendChild(row);
  row.querySelectorAll('input').forEach(applyInputRestrictions);
}

function countExtraRows(tabType) {
  const listMap = {
    personal: personalExtraList,
    escolar: escolarExtraList,
    institucional: institucionalExtraList
  };
  const list = listMap[tabType];
  return list ? list.querySelectorAll('.extra-row').length : 0;
}

function setError(field, message) {
  const errorEl = form.querySelector(`[data-error="${field}"]`);
  const inputEl = form.querySelector(`[name="${field}"]`);
  if (errorEl) errorEl.textContent = message;
  if (inputEl) inputEl.classList.add('err');
}

function validateTextField(field, message, pattern) {
  const value = getFieldValue(field);
  if (!value) {
    setError(field, 'Este campo es obligatorio.');
    return false;
  }
  if (pattern && !pattern.test(value)) {
    setError(field, message);
    return false;
  }
  return true;
}

function validateNumberField(field, message, pattern = /^\d+$/) {
  const value = getFieldValue(field);
  if (!value) {
    setError(field, 'Este campo es obligatorio.');
    return false;
  }
  if (!pattern.test(value)) {
    setError(field, message);
    return false;
  }
  return true;
}

function validateEmailField(field) {
  const value = getFieldValue(field);
  if (!value) {
    setError(field, 'Este campo es obligatorio.');
    return false;
  }
  if (!emailPattern.test(value)) {
    setError(field, 'Ingresá un email válido.');
    return false;
  }
  return true;
}

function cleanPhoneInput(input) {
  if (!input) return;
  input.value = input.value.replace(/[^0-9+()\-\s]/g, '');
  input.value = input.value.slice(0, 20);
}

function cleanNumericInput(input) {
  if (!input) return;
  input.value = input.value.replace(/\D/g, '');
  const maxLength = Number(input.dataset.maxlength || input.maxLength || 0);
  if (maxLength > 0) input.value = input.value.slice(0, maxLength);
}

function cleanTextInput(input) {
  if (!input) return;
  input.value = input.value.replace(/\d/g, '');
}

function applyInputRestrictions(input) {
  if (!input) return;
  if (input.dataset.textOnly === 'true') {
    input.addEventListener('input', () => cleanTextInput(input));
  }
  if (input.dataset.numericOnly === 'true') {
    input.addEventListener('input', () => cleanNumericInput(input));
  }
  if (input.dataset.phoneOnly === 'true') {
    input.addEventListener('input', () => cleanPhoneInput(input));
  }
  if (input.dataset.maxlength) {
    input.addEventListener('input', () => {
      input.value = input.value.slice(0, Number(input.dataset.maxlength));
    });
  }
}

function validatePhoneField(field) {
  const value = getFieldValue(field);
  if (!value) {
    setError(field, 'Este campo es obligatorio.');
    return false;
  }
  if (!phonePattern.test(value)) {
    setError(field, 'Ingresá un teléfono válido.');
    return false;
  }
  return true;
}

function validateExtraRows() {
  let valid = true;
  const extraGroups = [
    { list: personalExtraList },
    { list: escolarExtraList },
    { list: institucionalExtraList }
  ];

  extraGroups.forEach(({ list }) => {
    if (!list) return;
    list.querySelectorAll('.extra-row').forEach((row) => {
      const inputs = row.querySelectorAll('input');
      const nombre = inputs[0]?.value.trim();
      const apellido = inputs[1]?.value.trim();
      const dni = inputs[2]?.value.trim();

      if (nombre && !namePattern.test(nombre)) {
        inputs[0].classList.add('err');
        valid = false;
      }
      if (apellido && !namePattern.test(apellido)) {
        inputs[1].classList.add('err');
        valid = false;
      }
      if (dni && !dniPattern.test(dni)) {
        inputs[2].classList.add('err');
        valid = false;
      }
    });
  });
  return valid;
}

function validate() {
  clearErrors();
  let valid = true;

  if (currentTab === 'personal') {
    valid = validateTextField('nombre', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateTextField('apellido', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateNumberField('dni', 'Ingresá un DNI válido (8 dígitos).', dniPattern) && valid;
    valid = validateEmailField('email') && valid;
    valid = validatePhoneField('tel') && valid;
  }

  if (currentTab === 'escolar') {
    valid = validateTextField('docente_nombre', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateTextField('docente_apellido', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateTextField('institucion', 'Ingresá una institución válida.', /^.+$/) && valid;
    valid = validateNumberField('cue', 'El CUE debe tener 9 dígitos.', cuePattern) && valid;
    valid = validateNumberField('alumnos', 'Ingresá una cantidad válida.', /^\d+$/) && valid;
    valid = validateNumberField('docentes', 'Ingresá una cantidad válida.', /^\d+$/) && valid;
    valid = validateEmailField('email_institucional') && valid;
    valid = validatePhoneField('tel_institucional') && valid;
  }

  if (currentTab === 'institucional') {
    valid = validateTextField('referente_nombre', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateTextField('referente_apellido', 'Solo se permiten letras y espacios.', namePattern) && valid;
    valid = validateTextField('organizacion', 'Ingresá una organización válida.', /^.+$/) && valid;
    valid = validateNumberField('personas', 'Ingresá una cantidad válida.', /^\d+$/) && valid;
    valid = validateEmailField('email_institucional2') && valid;
    valid = validatePhoneField('tel_institucional2') && valid;
  }

  if (!fechaSelect.value) {
    setError('fecha', 'Seleccioná una fecha.');
    valid = false;
  }
  if (!horarioSelect.value) {
    setError('horario', 'Seleccioná un horario.');
    valid = false;
  }

  valid = validateExtraRows() && valid;
  return valid;
}

function getSelectedSlot() {
  return (availability[currentTab] || []).find((item) => item.date === fechaSelect.value);
}

function getAttendeeCount() {
  if (currentTab === 'personal') {
    return 1 + countExtraRows('personal');
  }

  if (currentTab === 'escolar') {
    const alumnos = Number(getFieldValue('alumnos')) || 0;
    const docentes = Number(getFieldValue('docentes')) || 0;
    return alumnos + docentes;
  }

  if (currentTab === 'institucional') {
    return Number(getFieldValue('personas')) || 0;
  }

  return 0;
}

function getReservationStatus() {
  const attendees = getAttendeeCount();
  const selectedSlot = getSelectedSlot();
  const hasSelectedTime = Boolean(selectedSlot && selectedSlot.times.includes(horarioSelect.value));

  if ((currentTab === 'escolar' || currentTab === 'institucional') && attendees > 30) {
    return 'en_revision';
  }

  if (!hasSelectedTime) {
    return 'sin_cupos';
  }

  return 'aprobada';
}

function buildPayload() {
  if (currentTab === 'personal') {
    return {
      id_visita: 12,
      nombre: getFieldValue('nombre'),
      apellido: getFieldValue('apellido'),
      email: getFieldValue('email'),
      dni: getFieldValue('dni'),
      telefono: getFieldValue('tel'),
      cantidad_personas: 1 + countExtraRows('personal')
    };
  }

  const tipoInstitucion = currentTab === 'escolar' ? 'Escuela' : 'Institucion';
  const cueValue = currentTab === 'escolar' ? getFieldValue('cue') : null;

  return {
    id_visita: currentTab === 'escolar' ? 13 : 15,
    nombre_institucion: getFieldValue('institucion') || getFieldValue('organizacion'),
    tipo_institucion: tipoInstitucion,
    cue: cueValue || null,
    cantidad_alumnos: Number(getFieldValue('alumnos') || getFieldValue('personas')) || 0,
    nombre_responsable: currentTab === 'escolar' ? getFieldValue('docente_nombre') : getFieldValue('referente_nombre'),
    apellido_responsable: currentTab === 'escolar' ? getFieldValue('docente_apellido') : getFieldValue('referente_apellido'),
    email_contacto: getFieldValue('email_institucional') || getFieldValue('email_institucional2'),
    telefono_contacto: getFieldValue('tel_institucional') || getFieldValue('tel_institucional2'),
    dni_responsable: ''
  };
}

function showFeedback(status, message) {
  form.style.display = 'none';
  document.querySelector('.tab-row').style.display = 'none';

  const titleByStatus = {
    aprobada: '¡Reserva aprobada!',
    en_revision: '¡Reserva en revisión!',
    sin_cupos: 'Sin cupos disponibles'
  };

  successTitle.textContent = titleByStatus[status] || '¡Reserva enviada!';
  successText.textContent = message;
  successPanel.style.backgroundColor = status === 'aprobada' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(245, 158, 11, 0.14)';
  successPanel.classList.add('visible');
}

function setTab(tab) {
  currentTab = tab;
  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  tabGroups.forEach((group) => {
    group.hidden = group.dataset.tabGroup !== tab;
  });
  updateDateOptions();
  horarioSelect.innerHTML = '<option value="">— Primero elegí una fecha —</option>';
  form.reset();
  clearExtraRows();
  clearErrors();
}

document.querySelectorAll('input[data-text-only="true"], input[data-numeric-only="true"], input[data-phone-only="true"], input[data-maxlength]').forEach(applyInputRestrictions);

fechaSelect.addEventListener('change', () => {
  const selected = getSelectedSlot();
  horarioSelect.innerHTML = '<option value="">— Seleccioná un horario —</option>';
  if (selected) {
    selected.times.forEach((time) => {
      const option = document.createElement('option');
      option.value = time;
      option.textContent = `${time} hs`;
      horarioSelect.appendChild(option);
    });
  }
  clearErrors();
});

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!validate()) {
    return;
  }

  const btnSubmit = form.querySelector('button[type="submit"]');
  const originalText = btnSubmit.textContent;
  btnSubmit.textContent = 'Enviando...';
  btnSubmit.disabled = true;

  try {
    const payload = buildPayload();
    const endpoint = currentTab === 'personal'
      ? 'routes/api.php/api/reservas/publicas'
      : 'routes/api.php/api/reservas/institucionales';

    const response = await postJson(endpoint, {
      ...payload,
      fecha: fechaSelect.value,
      horario: horarioSelect.value
    });

    const status = response?.data?.estado || response?.estado || getReservationStatus();
    const message = response?.message || (status === 'aprobada'
      ? 'Tu reserva quedó aprobada y recibirás la confirmación por correo.'
      : status === 'en_revision'
        ? 'Tu solicitud quedó enviada a revisión por superar la capacidad indicada.'
        : 'No hay cupos disponibles para ese horario.');

    showFeedback(status, message);
  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    successTitle.textContent = 'No se pudo enviar la reserva';
    successText.textContent = error.message || 'Revisá la conexión o los datos e intentá nuevamente.';
    successPanel.style.backgroundColor = 'rgba(245, 158, 11, 0.14)';
    successPanel.classList.add('visible');
    form.style.display = 'none';
    document.querySelector('.tab-row').style.display = 'none';
  } finally {
    btnSubmit.textContent = originalText;
    btnSubmit.disabled = false;
  }
});

addPersonalExtraBtn?.addEventListener('click', () => addExtraRow('personal'));
addEscolarExtraBtn?.addEventListener('click', () => addExtraRow('escolar'));
addInstitucionalExtraBtn?.addEventListener('click', () => addExtraRow('institucional'));

form.addEventListener('click', (event) => {
  if (event.target.classList.contains('remove-extra-btn')) {
    event.target.closest('.extra-row')?.remove();
  }
});

resetBtn.addEventListener('click', () => {
  successPanel.classList.remove('visible');
  form.style.display = 'block';
  const tabRow = document.querySelector('.tab-row');
  if (tabRow) tabRow.style.display = '';
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.style.display = '';
  });
  setTab(currentTab);
});

setTab('personal');