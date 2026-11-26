const STORAGE_KEY = 'rahman_trip_payroll_v5';

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');

const monthInput = document.getElementById('selectedMonth');
const dateInput = document.getElementById('tripDate');

if (monthInput) monthInput.value = `${yyyy}-${mm}`;
if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;

let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  entries: [],
  monthlySettings: {}
};

let showAllLogs = false;

function persistData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

/* BINA PILL SLIDER 1 - 20 */
function initTripPills() {
  const scroller = document.getElementById('tripPillScroller');
  if (!scroller) return;
  let html = '';
  for (let i = 1; i <= 20; i++) {
    const bonusCls = i >= 7 ? 'bonus-tier' : '';
    html += `<button type="button" class="trip-num-pill ${bonusCls}" data-val="${i}" onclick="selectTripPill(${i})">${i}</button>`;
  }
  scroller.innerHTML = html;
}

function selectTripPill(num) {
  const countInputEl = document.getElementById('tripCount');
  const badgeEl = document.getElementById('selectedTripBadge');
  if (countInputEl) countInputEl.value = num || '';

  document.querySelectorAll('.trip-num-pill').forEach(btn => {
    if (parseInt(btn.dataset.val, 10) === num) {
      btn.classList.add('selected');
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      btn.classList.remove('selected');
    }
  });

  if (badgeEl) {
    badgeEl.innerText = num ? `DIPILIH: ${num} TRIP` : 'PILIH: -';
  }
}

function switchTab(tabName, btnEl) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  btnEl.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  const floatBar = document.getElementById('floatingSaveBar');
  if (floatBar) {
    floatBar.style.display = tabName === 'daily' ? 'block' : 'none';
  }

  recalculateAll();
}

function getMonthSettings(monthStr) {
  if (!appData.monthlySettings[monthStr]) {
    appData.monthlySettings[monthStr] = {
      advance: 0,
      phone: 30,
      epf: 187.00,
      socso: 20.60,
      eis: 3.30,
      pcb: 0
    };
  }
  return appData.monthlySettings[monthStr];
}

function loadSettingsToUI() {
  if (!monthInput) return;
  const m = monthInput.value;
  const s = getMonthSettings(m);
  document.getElementById('inputAdvance').value = s.advance;
  document.getElementById('inputPhone').value = s.phone;
  document.getElementById('inputEpf').value = s.epf;
  document.getElementById('inputSocso').value = s.socso;
  document.getElementById('inputEis').value = s.eis;
  document.getElementById('inputPcb').value = s.pcb;
}

function saveSettings() {
  if (!monthInput) return;
  const m = monthInput.value;
  appData.monthlySettings[m] = {
    advance: parseFloat(document.getElementById('inputAdvance').value) || 0,
    phone: parseFloat(document.getElementById('inputPhone').value) || 0,
    epf: parseFloat(document.getElementById('inputEpf').value) || 0,
    socso: parseFloat(document.getElementById('inputSocso').value) || 0,
    eis: parseFloat(document.getElementById('inputEis').value) || 0,
    pcb: parseFloat(document.getElementById('inputPcb').value) || 0
  };
  persistData();
  recalculateAll();
}

function saveTripEntry() {
  const dateInputEl = document.getElementById('tripDate');
  const countInputEl = document.getElementById('tripCount');
  const editIdEl = document.getElementById('editId');

  const dateVal = dateInputEl ? dateInputEl.value : '';
  const tripsVal = countInputEl ? parseInt(countInputEl.value, 10) : 0;
  const selectedRadio = document.querySelector('input[name="dayType"]:checked');
  const typeVal = selectedRadio ? selectedRadio.value : 'normal';
  const editId = editIdEl ? editIdEl.value : '';

  if (!dateVal) {
    alert('Sila pilih tarikh terlebih dahulu.');
    if (dateInputEl) dateInputEl.focus();
    return;
  }

  if (isNaN(tripsVal) || tripsVal <= 0) {
    alert('Sila pilih bilangan trip (1 - 20) pada bar nombor dahulu.');
    return;
  }

  if (editId) {
    const idx = appData.entries.findIndex(e => e.id === editId);
    if (idx !== -1) {
      appData.entries[idx] = { id: editId, date: dateVal, trips: tripsVal, type: typeVal, note: '' };
    }
  } else {
    appData.entries.push({ id: 'trip_' + Date.now(), date: dateVal, trips: tripsVal, type: typeVal, note: '' });
  }

  if (dateVal.length >= 7 && monthInput) {
    monthInput.value = dateVal.substring(0, 7);
  }

  persistData();
  resetForm();
  loadSettingsToUI();
  recalculateAll();
}

function editEntry(id) {
  const item = appData.entries.find(e => e.id === id);
  if (!item) return;
  document.getElementById('editId').value = item.id;
  document.getElementById('tripDate').value = item.date;
  selectTripPill(item.trips);

  const radioEl = document.querySelector(`input[name="dayType"][value="${item.type || 'normal'}"]`);
  if (radioEl) radioEl.checked = true;

  document.getElementById('formTitle').innerText = 'Edit Rekod Trip';
  document.getElementById('saveBtn').innerText = 'KEMASKINI REKOD';
  document.getElementById('cancelEditBtn').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
  if (!confirm('Padam rekod hari ini?')) return;
  appData.entries = appData.entries.filter(e => e.id !== id);
  persistData();
  recalculateAll();
}

function resetCurrentMonthData() {
  if (!monthInput) return;
  const targetMonth = monthInput.value;
  if (!confirm(`AMARAN: Adakah anda pasti mahu memadam SEMUA rekod trip untuk bulan ${formatMonthName(targetMonth)} (${targetMonth})?`)) return;

  appData.entries = appData.entries.filter(e => !e.date.startsWith(targetMonth));
  persistData();
  recalculateAll();
  alert('Semua rekod untuk bulan ini telah dipadam.');
}

function resetAllData() {
  if (!confirm('AMARAN BESAR: Ini akan memadam KESELURUHAN rekod trip dari hari pertama. Pastikan anda sudah buat Backup (JSON) jika perlu. Teruskan?')) return;
  if (!confirm('Betul-betul yakin nak kosongkan semua data? Tindakan ini tidak boleh diundur.')) return;

  appData = { entries: [], monthlySettings: {} };
  persistData();
  loadSettingsToUI();
  recalculateAll();
  alert('Semua data dalam sistem telah dikosongkan.');
}

function resetForm() {
  document.getElementById('editId').value = '';
  selectTripPill(0);
  const normalRadio = document.querySelector('input[name="dayType"][value="normal"]');
  if (normalRadio) normalRadio.checked = true;
  document.getElementById('formTitle').innerText = 'Tambah Rekod Trip';
  document.getElementById('saveBtn').innerText = 'SIMPAN TRIP HARI INI';
  document.getElementById('cancelEditBtn').style.display = 'none';
}

/* FUNGSI MASS INPUT (PUKAL BULAN LEPAS) */
function toggleMassModal(show) {
  const modal = document.getElementById('massModal');
  if (!modal) return;
  if (show) {
    const massPicker = document.getElementById('massMonthPicker');
    if (massPicker && monthInput) {
      massPicker.value = monthInput.value;
    }
    generateMassRows();
    modal.classList.add('open');
  } else {
    modal.classList.remove('open');
  }
}

function generateMassRows() {
  const container = document.getElementById('massRowsContainer');
  const massPicker = document.getElementById('massMonthPicker');
  if (!container || !massPicker || !massPicker.value) return;

  const [yStr, mStr] = massPicker.value.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  let rowsHtml = '';
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const fullDate = `${yStr}-${mStr}-${dayStr}`;
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    const defaultType = dayOfWeek === 0 ? 'holiday' : 'normal';
    rowsHtml += buildMassRowHTML(fullDate, defaultType);
  }
  container.innerHTML = rowsHtml;
}

function buildMassRowHTML(dateVal, defaultType = 'normal') {
  return `
    <div class="mass-row" data-type="${defaultType}">
      <input type="date" class="m-date" value="${dateVal}" />
      <input type="number" class="m-trips" min="1" max="50" placeholder="0" />
      <div class="mass-type-group">
        <button type="button" class="mass-type-btn ${defaultType === 'normal' ? 'active-normal' : ''}" onclick="setMassRowType(this, 'normal')">B</button>
        <button type="button" class="mass-type-btn ${defaultType === 'holiday' ? 'active-holiday' : ''}" onclick="setMassRowType(this, 'holiday')">H</button>
        <button type="button" class="mass-type-btn ${defaultType === 'offer' ? 'active-offer' : ''}" onclick="setMassRowType(this, 'offer')">O</button>
      </div>
    </div>
  `;
}

function addExtraMassRow() {
  const container = document.getElementById('massRowsContainer');
  const massPicker = document.getElementById('massMonthPicker');
  if (!container) return;
  const baseDate = massPicker && massPicker.value ? `${massPicker.value}-01` : '';
  container.insertAdjacentHTML('beforeend', buildMassRowHTML(baseDate, 'normal'));
  container.scrollTop = container.scrollHeight;
}

function setMassRowType(btn, type) {
  const row = btn.closest('.mass-row');
  if (!row) return;
  row.dataset.type = type;
  row.querySelectorAll('.mass-type-btn').forEach(b => {
    b.classList.remove('active-normal', 'active-holiday', 'active-offer');
  });
  btn.classList.add(`active-${type}`);
}

function saveMassEntries() {
  const rows = document.querySelectorAll('#massRowsContainer .mass-row');
  let addedCount = 0;
  let lastMonth = '';

  rows.forEach((row, index) => {
    const dateVal = row.querySelector('.m-date').value;
    const tripsVal = parseInt(row.querySelector('.m-trips').value, 10);
    const typeVal = row.dataset.type || 'normal';

    if (dateVal && !isNaN(tripsVal) && tripsVal > 0) {
      appData.entries.push({
        id: 'trip_' + Date.now() + '_' + index,
        date: dateVal,
        trips: tripsVal,
        type: typeVal,
        note: ''
      });
      addedCount++;
      lastMonth = dateVal.substring(0, 7);
    }
  });

  if (addedCount === 0) {
    alert('Tiada rekod trip diisi. Sila masukkan sekurang-kurangnya satu bilangan trip.');
    return;
  }

  if (lastMonth && monthInput) {
    monthInput.value = lastMonth;
  }

  persistData();
  loadSettingsToUI();
  recalculateAll();
  toggleMassModal(false);
  alert(`Berjaya simpan ${addedCount} rekod trip!`);
}

function recalculateAll() {
  if (!monthInput) return;
  const selectedMonth = monthInput.value;
  const monthEntries = appData.entries
    .filter(e => e.date && e.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalTrips = 0;
  let normalTrips = 0;
  let tripsRate20 = 0;
  let tripsRate25 = 0;
  let days7Plus = 0;

  monthEntries.forEach(item => {
    totalTrips += item.trips;
    if (item.trips >= 7) days7Plus += 1;

    if (item.type === 'normal') {
      normalTrips += item.trips;
    } else if (item.type === 'holiday') {
      if (item.trips >= 10) tripsRate25 += item.trips;
      else tripsRate20 += item.trips;
    } else if (item.type === 'offer') {
      tripsRate25 += item.trips;
    }
  });

  let normalTopUpRate = 0;
  let effectiveNormalRate = 13;

  if (totalTrips >= 170) {
    effectiveNormalRate = 15;
    normalTopUpRate = 2;
  } else if (totalTrips >= 120) {
    effectiveNormalRate = 18;
    normalTopUpRate = 5;
  }

  let monthlyBonus = 0;
  let bonusLabel = 'MONTHLY TRIP BONUS (<120 TRIP)';

  if (totalTrips >= 300) {
    monthlyBonus = 3400;
    bonusLabel = 'MONTHLY TRIP BONUS (300+ TRIP)';
  } else if (totalTrips >= 280) {
    monthlyBonus = 3200;
    bonusLabel = 'MONTHLY TRIP BONUS (280-299 TRIP)';
  } else if (totalTrips >= 260) {
    monthlyBonus = 3000;
    bonusLabel = 'MONTHLY TRIP BONUS (260-279 TRIP)';
  } else if (totalTrips >= 240) {
    monthlyBonus = 2800;
    bonusLabel = 'MONTHLY TRIP BONUS (240-259 TRIP)';
  } else if (totalTrips >= 220) {
    monthlyBonus = 2600;
    bonusLabel = 'MONTHLY TRIP BONUS (220-239 TRIP)';
  } else if (totalTrips >= 200) {
    monthlyBonus = 2200;
    bonusLabel = 'MONTHLY TRIP BONUS (200-219 TRIP)';
  } else if (totalTrips >= 190) {
    monthlyBonus = 1700;
    bonusLabel = 'MONTHLY TRIP BONUS (190-199 TRIP)';
  } else if (totalTrips >= 180) {
    monthlyBonus = 1600;
    bonusLabel = 'MONTHLY TRIP BONUS (180-189 TRIP)';
  } else if (totalTrips >= 170) {
    monthlyBonus = 1500;
    bonusLabel = 'MONTHLY TRIP BONUS (170-179 TRIP)';
  } else if (totalTrips >= 150) {
    monthlyBonus = 800;
    bonusLabel = 'MONTHLY TRIP BONUS (150-169 TRIP)';
  } else if (totalTrips >= 120) {
    monthlyBonus = 200;
    bonusLabel = 'MONTHLY TRIP BONUS (120-149 TRIP)';
  }

  const amt13 = normalTrips * 13;
  const amt20 = tripsRate20 * 20;
  const amt25 = tripsRate25 * 25;
  const amt30 = 0;
  const totalTripCommission = amt13 + amt20 + amt25 + amt30;

  const amtA02 = normalTrips * normalTopUpRate;
  const amtA20 = days7Plus * 20;
  const totalAllowance = amtA02 + amtA20 + monthlyBonus;

  const totalSalary = totalTripCommission + totalAllowance;
  const basicSalary = totalTrips >= 120 ? 1700 : 0;
  const subContract = Math.max(0, totalSalary - basicSalary);

  const settings = getMonthSettings(selectedMonth);
  const phoneAllow = settings.phone;
  const totalIncome = totalSalary + phoneAllow;

  const epf = settings.epf;
  const socso = settings.socso;
  const eis = settings.eis;
  const pcb = settings.pcb;
  const statDeductions = epf + socso + eis + pcb;
  const advance = settings.advance;
  const totalDeductions = statDeductions + advance;
  const nettPay = totalIncome - totalDeductions;

  document.getElementById('statTotalTrips').innerText = totalTrips;
  document.getElementById('statBonusDays').innerText = days7Plus;

  document.getElementById('tierLabel').innerText = `Rate Biasa: RM${effectiveNormalRate} / trip`;
  let nextTargetText = 'Tahap Maksimum (300+ trip)!';
  if (totalTrips < 120) nextTargetText = `Kurang ${120 - totalTrips} trip ke 120`;
  else if (totalTrips < 150) nextTargetText = `Kurang ${150 - totalTrips} trip ke Bonus RM800`;
  else if (totalTrips < 170) nextTargetText = `Kurang ${170 - totalTrips} trip ke 170`;
  else if (totalTrips < 180) nextTargetText = `Kurang ${180 - totalTrips} trip ke 180`;
  else if (totalTrips < 200) nextTargetText = `Kurang ${200 - totalTrips} trip ke 200`;
  else if (totalTrips < 300) nextTargetText = `Sasaran seterusnya: 300 trip`;
  document.getElementById('nextTargetLabel').innerText = nextTargetText;

  const pct = Math.min(100, (totalTrips / 300) * 100);
  document.getElementById('tripProgressBar').style.width = pct + '%';

  renderLogList(monthEntries, effectiveNormalRate);

  document.getElementById('slipPeriodLabel').innerText = `BULAN: ${formatMonthName(selectedMonth)}`;
  document.getElementById('slipBasic').innerText = fmt(basicSalary);
  document.getElementById('slipSubContract').innerText = fmt(subContract);
  document.getElementById('slipTotalSalary').innerText = fmt(totalSalary);
  document.getElementById('slipPhone').innerText = fmt(phoneAllow);
  document.getElementById('slipTotalIncome').innerText = fmt(totalIncome);

  document.getElementById('slipEpf').innerText = fmt(epf);
  document.getElementById('slipSocso').innerText = fmt(socso);
  document.getElementById('slipEis').innerText = fmt(eis);
  document.getElementById('slipPcb').innerText = fmt(pcb);
  document.getElementById('slipStatDed').innerText = fmt(statDeductions);
  document.getElementById('slipAdvance').innerText = fmt(advance);
  document.getElementById('slipTotalDed').innerText = fmt(totalDeductions);
  document.getElementById('slipNettPay').innerText = 'RM ' + fmt(nettPay);
  document.getElementById('slipTierBadge').innerText = `${totalTrips} TRIP | RATE BIASA RM${effectiveNormalRate}`;

  document.getElementById('qty13').innerText = normalTrips;
  document.getElementById('amt13').innerText = fmt(amt13);
  document.getElementById('qty20').innerText = tripsRate20;
  document.getElementById('amt20').innerText = fmt(amt20);
  document.getElementById('qty25').innerText = tripsRate25;
  document.getElementById('amt25').innerText = fmt(amt25);
  document.getElementById('qty30').innerText = 0;
  document.getElementById('amt30').innerText = '0.00';
  document.getElementById('qtyTotalTrip').innerText = totalTrips;
  document.getElementById('amtTotalTrip').innerText = fmt(totalTripCommission);

  document.getElementById('labelA02').innerText = totalTrips >= 170
    ? 'OVER 170 TRIP TOP-UP'
    : 'OVER 120 TRIP ALLOWANCE';
  document.getElementById('rateA02').innerText = fmt(normalTopUpRate);
  document.getElementById('qtyA02').innerText = normalTrips;
  document.getElementById('amtA02').innerText = fmt(amtA02);

  document.getElementById('qtyA20').innerText = days7Plus;
  document.getElementById('amtA20').innerText = fmt(amtA20);

  document.getElementById('labelMonthlyBonus').innerText = bonusLabel;
  document.getElementById('qtyBonusTrip').innerText = totalTrips;
  document.getElementById('amtMonthlyBonus').innerText = fmt(monthlyBonus);

  document.getElementById('amtTotalAllowance').innerText = fmt(totalAllowance);
}

function toggleShowAllLogs() {
  showAllLogs = !showAllLogs;
  recalculateAll();
}

function renderLogList(entries, effectiveNormalRate) {
  const listEl = document.getElementById('logList');
  document.getElementById('logCountLabel').innerText = entries.length;

  if (entries.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; color:#94a3b8; padding:12px; font-size:0.8rem;">Belum ada rekod trip untuk bulan ini.</div>`;
    return;
  }

  const sorted = entries.slice().reverse();
  const limit = 5;
  const visibleEntries = showAllLogs ? sorted : sorted.slice(0, limit);

  const rowsHtml = visibleEntries.map(item => {
    let badgeHtml = `<span class="badge badge-normal">Biasa RM${effectiveNormalRate}</span>`;
    let rateApplied = effectiveNormalRate;

    if (item.type === 'holiday') {
      rateApplied = item.trips >= 10 ? 25 : 20;
      badgeHtml = `<span class="badge badge-holiday">PH RM${rateApplied}</span>`;
    } else if (item.type === 'offer') {
      rateApplied = 25;
      badgeHtml = `<span class="badge badge-offer">Offer RM25</span>`;
    }

    const dailyBonus = item.trips >= 7 ? 20 : 0;
    const bonusBadge = dailyBonus > 0 ? `<span class="badge badge-bonus">+RM20</span>` : '';
    const dayTotal = (item.trips * rateApplied) + dailyBonus;

    return `
      <div class="log-item compact-log-item">
        <div class="log-row-top">
          <div class="log-left-top">
            <span class="date">${formatDisplayDate(item.date)}</span>
            ${badgeHtml}
            ${bonusBadge}
          </div>
          <div class="log-trips">${item.trips} Trip</div>
        </div>
        <div class="log-row-bottom">
          <div class="log-meta">Anggaran: <strong>RM ${dayTotal.toFixed(2)}</strong></div>
          <div class="log-btn-group">
            <button type="button" class="btn btn-edit" onclick="editEntry('${item.id}')">Edit</button>
            <button type="button" class="btn btn-danger" onclick="deleteEntry('${item.id}')">Padam</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const toggleBtnHtml = sorted.length > limit
    ? `<button type="button" class="log-toggle-btn" onclick="toggleShowAllLogs()">${
        showAllLogs ? 'Tunjuk 5 Terkini Sahaja' : `Lihat Semua (${sorted.length} Hari)`
      }</button>`
    : '';

  listEl.innerHTML = rowsHtml + toggleBtnHtml;
}

function fmt(num) {
  return Number(num || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function formatMonthName(ym) {
  if (!ym) return '-';
  const [y, m] = ym.split('-');
  const names = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'];
  return `${names[parseInt(m, 10) - 1]} '${y.slice(2)}`;
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_trip_gaji_${monthInput.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && Array.isArray(parsed.entries)) {
        appData = parsed;
        persistData();
        loadSettingsToUI();
        recalculateAll();
        alert('Data backup berjaya dipulihkan!');
      } else {
        alert('Fail backup tidak sah.');
      }
    } catch (err) {
      alert('Ralat membaca fail backup.');
    }
  };
  reader.readAsText(file);
}

if (monthInput) {
  monthInput.addEventListener('change', () => {
    loadSettingsToUI();
    recalculateAll();
  });
}

initTripPills();
loadSettingsToUI();
recalculateAll();
