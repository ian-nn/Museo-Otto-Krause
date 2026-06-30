import { getJson, postJson } from '../services/api.js';

let availability = {
  personal: [],
  escolar: [],
  institucional: []
};

const header = document.querySelector('.main-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
});

const tabButtons = document.querySelectorAll('.tab-btn');
const tabGroups = document.querySelectorAll('.form-tab-group');
const form = document.getElementById('reserva-form');
const fechaSelect = document.getElementById('fecha');
const horarioSelect = document.getElementById('horario');
const successPanel = document.getElementById('success-panel');
const successIcon = document.getElementById('success-icon');
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

function setTab(tab) {
  currentTab = tab;
  tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  tabGroups.forEach(group => {
    group.hidden = group.dataset.tabGroup !== tab;
  });
  updateDateOptions();
  horarioSelect.innerHTML = '<option value="">— Primero elegí una fecha —</option>';
  form.reset();
  clearExtraRows();
  clearErrors();
}

function clearErrors() {
  document.querySelectorAll('[data-error]').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('err'));
}

function updateDateOptions() {
  const options = availability[currentTab] || [];
  fechaSelect.innerHTML = '<option value="">— Seleccioná una fecha —</option>';
  options.forEach(item => {
    const option = document.createElement('option');
    option.value = item.date;
    const timeStrings = item.times.map(t => t.time);
    option.textContent = `${formatDate(item.date)} (${timeStrings.join(' / ')})`;
    fechaSelect.appendChild(option);
  });
}

function getFieldValue(name) {
  const input = form.querySelector(`[name="${name}"]`);
  return input ? input.value.trim() : '';
}

function clearExtraRows() {
  if (personalExtraList) personalExtraList.innerHTML = '';
  if (escolarExtraList) escolarExtraList.innerHTML = '';
  if (institucionalExtraList) institucionalExtraList.innerHTML = '';
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
    { tab: 'personal', list: personalExtraList },
    { tab: 'escolar', list: escolarExtraList },
    { tab: 'institucional', list: institucionalExtraList }
  ];

  extraGroups.forEach(({ list }) => {
    if (!list) return;
    list.querySelectorAll('.extra-row').forEach((row, index) => {
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
    valid = validateNumberField('dni_docente', 'Ingresá un DNI válido (8 dígitos).', dniPattern) && valid;
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
    valid = validateNumberField('dni_referente', 'Ingresá un DNI válido (8 dígitos).', dniPattern) && valid;
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

document.querySelectorAll('input[data-text-only="true"], input[data-numeric-only="true"], input[data-phone-only="true"], input[data-maxlength]').forEach(applyInputRestrictions);

fechaSelect.addEventListener('change', () => {
  const options = availability[currentTab] || [];
  const selected = options.find(item => item.date === fechaSelect.value);
  horarioSelect.innerHTML = '<option value="">— Seleccioná un horario —</option>';
  if (selected) {
    selected.times.forEach(tObj => {
      const option = document.createElement('option');
      option.value = tObj.id;
      option.textContent = `${tObj.time} hs`;
      horarioSelect.appendChild(option);
    });
  }
  clearErrors();
});

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const submitBtn = form.querySelector('.btn-submit');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Enviando...';
  submitBtn.disabled = true;

  try {
    const payload = {
      id_visita: parseInt(horarioSelect.value),
      tipo_visita: currentTab,
    };

    if (currentTab === 'personal') {
      payload.nombre = getFieldValue('nombre');
      payload.apellido = getFieldValue('apellido');
      payload.dni = getFieldValue('dni');
      payload.email = getFieldValue('email');
      payload.telefono = getFieldValue('tel');
      payload.cantidad_personas = 1 + countExtraRows('personal');
      
      const personas = [{
        nombre: payload.nombre,
        apellido: payload.apellido,
        dni: payload.dni
      }];
      const extraRows = personalExtraList.querySelectorAll('.extra-row');
      extraRows.forEach((row) => {
        const inputs = row.querySelectorAll('input');
        personas.push({
          nombre: inputs[0]?.value || '',
          apellido: inputs[1]?.value || '',
          dni: inputs[2]?.value || ''
        });
      });
      payload.personas = personas;
    } else if (currentTab === 'escolar') {
      payload.nombre_institucion = getFieldValue('institucion');
      payload.tipo_institucion = 'Escuela';
      payload.cue = getFieldValue('cue');
      payload.cantidad_alumnos = getFieldValue('alumnos');
      payload.nombre_responsable = getFieldValue('docente_nombre');
      payload.apellido_responsable = getFieldValue('docente_apellido');
      payload.dni_responsable = getFieldValue('dni_docente');
      payload.email_contacto = getFieldValue('email_institucional');
      payload.telefono_contacto = getFieldValue('tel_institucional');
    } else if (currentTab === 'institucional') {
      payload.nombre_institucion = getFieldValue('organizacion');
      payload.tipo_institucion = 'Institucion';
      payload.cantidad_alumnos = getFieldValue('personas');
      payload.nombre_responsable = getFieldValue('referente_nombre');
      payload.apellido_responsable = getFieldValue('referente_apellido');
      payload.dni_responsable = getFieldValue('dni_referente');
      payload.email_contacto = getFieldValue('email_institucional2');
      payload.telefono_contacto = getFieldValue('tel_institucional2');
    }

    const res = await postJson('routes/reservar.php', payload);
    
    if (res && res.status === 'success') {
      const isPending = res.data.estado === 'pendiente';
      
      successPanel.classList.add('visible');
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      successIcon.innerHTML = isPending
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      successIcon.style.background = isPending ? 'rgba(245, 158, 11, 0.14)' : 'rgba(34, 197, 94, 0.12)';
      successTitle.textContent = isPending ? '¡Reserva enviada!' : '¡Reserva confirmada!';
      successText.innerHTML = isPending
        ? 'Tu solicitud fue recibida y quedó pendiente de revisión por el administrador.'
        : 'Tu reserva fue aprobada. Recibirás una confirmación por email.';
      form.style.display = 'none';
      const tabRow = document.querySelector('.tab-row');
      if (tabRow) tabRow.style.display = 'none';
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => btn.style.display = 'none');
      
      initAvailability(); // reload slots
    }
  } catch (err) {
    alert(err.message || 'Error al enviar la reserva');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

addPersonalExtraBtn?.addEventListener('click', () => addExtraRow('personal'));
addEscolarExtraBtn?.addEventListener('click', () => addExtraRow('escolar'));
addInstitucionalExtraBtn?.addEventListener('click', () => addExtraRow('institucional'));

form.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-extra-btn')) {
    e.target.closest('.extra-row')?.remove();
  }
});

resetBtn.addEventListener('click', () => {
  successPanel.classList.remove('visible');
  form.style.display = 'block';
  const tabRow = document.querySelector('.tab-row');
  if (tabRow) tabRow.style.display = '';
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => btn.style.display = '');
  setTab(currentTab);
});

async function initAvailability() {
  try {
    const data = await getJson('routes/obtener_visita.php');
    if (data && data.success && Array.isArray(data.visitas_disponibles)) {
      availability = { personal: [], escolar: [], institucional: [] };
      data.visitas_disponibles.forEach(v => {
        const parts = v.fecha_hora.split(' ');
        const dateStr = parts[0];
        const timeStr = parts[1].substring(0, 5);
        
        const type = v.tipo_visita.toLowerCase();
        const tabs = type === 'publica' ? ['personal'] : ['escolar', 'institucional'];
        
        tabs.forEach(tab => {
          let dateObj = availability[tab].find(item => item.date === dateStr);
          if (!dateObj) {
            dateObj = { date: dateStr, times: [] };
            availability[tab].push(dateObj);
          }
          dateObj.times.push({ time: timeStr, id: v.id_visita });
        });
      });
    }
  } catch (err) {
    console.error('Error cargando visitas disponibles:', err);
  }
  setTab('personal');
}

initAvailability();