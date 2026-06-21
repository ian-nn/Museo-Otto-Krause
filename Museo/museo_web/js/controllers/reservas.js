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
      const options = availability[currentTab];
      fechaSelect.innerHTML = '<option value="">— Seleccioná una fecha —</option>';
      options.forEach(item => {
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
            <input class="form-input" type="text" name="${tabType}_extra_nombre_${index}" placeholder="Ej: Ana">
          </div>
          <div class="form-field">
            <label class="form-label">Apellido</label>
            <input class="form-input" type="text" name="${tabType}_extra_apellido_${index}" placeholder="Ej: Pérez">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:0;">
          <div class="form-field">
            <label class="form-label">DNI</label>
            <input class="form-input" type="text" name="${tabType}_extra_dni_${index}" placeholder="Ej: 30111222">
          </div>
          <div class="form-field">
            <button type="button" class="btn-sm btn-reject remove-extra-btn">Eliminar</button>
          </div>
        </div>
      `;
      list.appendChild(row);
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

    function validate() {
      clearErrors();
      let valid = true;

      const rules = {
        personal: ['nombre', 'apellido', 'dni', 'email', 'tel'],
        escolar: ['docente_nombre', 'docente_apellido', 'institucion', 'cue', 'alumnos', 'docentes', 'email_institucional', 'tel_institucional'],
        institucional: ['referente_nombre', 'referente_apellido', 'organizacion', 'personas', 'email_institucional2', 'tel_institucional2']
      };

      const emailFields = {
        personal: ['email'],
        escolar: ['email_institucional'],
        institucional: ['email_institucional2']
      };

      const numberedFields = {
        escolar: ['alumnos', 'docentes'],
        institucional: ['personas']
      };

      const fields = rules[currentTab];
      fields.forEach(field => {
        const value = getFieldValue(field);
        if (!value) {
          setError(field, 'Este campo es obligatorio.');
          valid = false;
        }
      });

      (emailFields[currentTab] || []).forEach(field => {
        const value = getFieldValue(field);
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setError(field, 'Ingresá un email válido.');
          valid = false;
        }
      });

      if (currentTab === 'personal') {
        const dni = getFieldValue('dni');
        if (dni && !/^\d{7,8}$/.test(dni)) {
          setError('dni', 'Ingresá un DNI válido.');
          valid = false;
        }
      }

      if (currentTab === 'escolar') {
        const cue = getFieldValue('cue');
        if (cue && !/^\d{9}$/.test(cue)) {
          setError('cue', 'El CUE debe tener 9 dígitos.');
          valid = false;
        }
      }

      (numberedFields[currentTab] || []).forEach(field => {
        const value = getFieldValue(field);
        if (value && !/^\d+$/.test(value)) {
          setError(field, 'Ingresá un número válido.');
          valid = false;
        }
      });

      if (!fechaSelect.value) {
        setError('fecha', 'Seleccioná una fecha.');
        valid = false;
      }
      if (!horarioSelect.value) {
        setError('horario', 'Seleccioná un horario.');
        valid = false;
      }

      return valid;
    }

    fechaSelect.addEventListener('change', () => {
      const selected = availability[currentTab].find(item => item.date === fechaSelect.value);
      horarioSelect.innerHTML = '<option value="">— Seleccioná un horario —</option>';
      if (selected) {
        selected.times.forEach(time => {
          const option = document.createElement('option');
          option.value = time;
          option.textContent = `${time} hs`;
          horarioSelect.appendChild(option);
        });
      }
      clearErrors();
    });

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate()) return;

      const peopleCount = currentTab === 'institucional'
        ? Number(getFieldValue('personas') || 0) + countExtraRows('institucional')
        : currentTab === 'escolar'
          ? Number(getFieldValue('alumnos') || 0) + Number(getFieldValue('docentes') || 0) + countExtraRows('escolar')
          : 1 + countExtraRows('personal');

      const pending = currentTab === 'institucional' && peopleCount > 30;
      successPanel.classList.add('visible');
      successPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      successIcon.innerHTML = pending
        ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
        : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
      successIcon.style.background = pending ? 'rgba(245, 158, 11, 0.14)' : 'rgba(34, 197, 94, 0.12)';
      successTitle.textContent = pending ? '¡Reserva enviada!' : '¡Reserva confirmada!';
      successText.innerHTML = pending
        ? 'Tu solicitud fue recibida y quedó pendiente de revisión por el administrador.'
        : 'Tu reserva fue aprobada. Recibirás una confirmación por email.';
      form.style.display = 'none';
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
      setTab(currentTab);
    });

    setTab('personal');