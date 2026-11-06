import {renderArchiveSearch} from './archive-search.js';
import {openArchiveEditor} from './archive-editor.js';
import {bindArchiveCreate} from './archive-create.js';
import {openFileHistory} from './archive-files.js';
import {openDispositionForm} from './disposition-create.js';
import {archiveChronology,openDispositionHistory} from './disposition-history.js';
import {renderDispositionWorklist} from './disposition-worklist.js';
import {createNotifications} from './notifications.js';
import {openArchiveQuality} from './archive-quality.js';
import {archiveSourceFields,bindArchiveSourceFields} from './archive-source-fields.js';
import {setupFormA11y} from './form-a11y.js';
const app = document.querySelector('#app');
const state = { user: null, page: 'dashboard', archives: [], archiveItems: [], archivePage: 1, archivePageSize: 25, dashboard: null, filters: { q: '', type: '', category: '', year: '', status: '' }, classifications: [], categories: [], users: [], modal: null, selected: null };
const subsections = ['Administrasi', 'Hukum dan Sengketa Proses', 'Pencegahan, Partisipasi Masyarakat, dan Humas', 'Penanganan Pelanggaran dan Data Informasi'];
const subsectionAliases = { 'Administrasi':'Administrasi', 'Hukum':'Hukum dan Sengketa Proses', 'Hukum dan Sengketa Proses':'Hukum dan Sengketa Proses', 'Pengawasan':'Pencegahan, Partisipasi Masyarakat, dan Humas', 'Pencegahan, Partisipasi Masyarakat, dan Humas':'Pencegahan, Partisipasi Masyarakat, dan Humas', 'PPPS':'Penanganan Pelanggaran dan Data Informasi', 'Penanganan Pelanggaran dan Data Informasi':'Penanganan Pelanggaran dan Data Informasi' };
const subsectionLabel = value => subsectionAliases[value] || value || '';
const sameSubsection = (left,right) => Boolean(subsectionLabel(left) && subsectionLabel(left) === subsectionLabel(right));
const localToday = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Jakarta', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const $ = (s, root = document) => root.querySelector(s);
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, options = {}) {
  const stop=requestActivity();
  try { const r=await fetch(url,{...options,headers:{'Content-Type':'application/json','X-SIAGA-Request':'1',...(options.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'Permintaan gagal'),{status:r.status});return j; }
  finally { stop(); }
}
function toast(text, type='success') {
  let stack=$('#toastStack');if(!stack){stack=document.createElement('div');stack.id='toastStack';stack.className='ws-toast-stack';stack.setAttribute('aria-label','Pesan sistem');document.body.append(stack);}
  while(stack.children.length>=3)stack.firstElementChild.remove();
  const el=document.createElement('div');el.className=`ws-toast ${type}`;el.innerHTML=`<span class="ws-toast-symbol">${icon(type==='error'?'close':'disposition')}</span><div role="${type==='error'?'alert':'status'}"><b>${type==='error'?'Perlu diperiksa':'Berhasil'}</b><p>${esc(text)}</p></div><button aria-label="Tutup pesan">${icon('close')}</button>`;stack.append(el);
  let timer;const dismiss=()=>{clearTimeout(timer);el.classList.add('is-leaving');setTimeout(()=>el.remove(),150);};const schedule=()=>{clearTimeout(timer);timer=setTimeout(dismiss,type==='error'?9000:5000);};el.querySelector('button').onclick=dismiss;el.onpointerenter=()=>clearTimeout(timer);el.onpointerleave=schedule;el.onfocusin=()=>clearTimeout(timer);el.onfocusout=schedule;schedule();
}
function initials(name = '') { return name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function canRecord() { return ['admin', 'recorder'].includes(state.user?.role); }
function canUpload() { return ['admin', 'uploader'].includes(state.user?.role); }
function icon(name) {
  const paths = {
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    archive: '<path d="M4 7h16v14H4z"/><path d="m3 7 2-4h14l2 4M9 12h6"/>',
    disposition: '<path d="m5 12 4 4L19 6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 1.7-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L8 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.7v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L8 8.6l1.7-1.7.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.7 1.7-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z"/>',
    audit: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    incoming: '<path d="M12 4v13m0 0-5-5m5 5 5-5M5 20h14"/>',
    outgoing: '<path d="M12 20V7m0 0 5 5m-5-5-5 5M5 4h14"/>',
    total: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>'
  };
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
}
function publicView() {
  app.innerHTML = `<main class="landing" id="beranda">
    <a class="lp-skip" href="#lp-main">Langsung ke konten</a>
    <header class="lp-header"><a class="lp-brand" href="#beranda" aria-label="SIAGA ARSIP beranda"><span class="lp-monogram">SA<span>.</span></span><span><strong>SIAGA ARSIP</strong><small>Bawaslu Kabupaten Aceh Timur</small></span></a><nav aria-label="Navigasi portal"><a href="#statistik">Statistik publik</a><a href="#alur">Alur pengelolaan</a><button class="lp-login" data-login>Masuk staf ${icon('arrow')}</button></nav></header>
    <section class="lp-hero" id="lp-main"><div class="lp-hero-copy"><h1>Arsip tertata.<br>Informasi <em>terjaga.</em></h1><p>Ruang kelola arsip digital Bawaslu Kabupaten Aceh Timur. Mendukung pencatatan naskah dinas dan tindak lanjut disposisi dalam satu sistem.</p><div class="lp-hero-actions"><button class="lp-button" data-login>Masuk ke ruang arsip ${icon('arrow')}</button><a class="lp-link" href="#statistik">Lihat statistik publik</a></div><div class="lp-access-note">${icon('archive')}<span>Ringkasan terbuka untuk publik.<br>Dokumen diakses oleh staf berwenang.</span></div></div><figure class="lp-hero-image"><img src="/assets/images/archive-library.jpg" alt="Deretan rak buku sebagai ilustrasi pengelolaan koleksi dan arsip" width="1400" height="933" fetchpriority="high"><figcaption><span>Menjaga catatan.<br><b>Merawat akuntabilitas.</b></span><small>Ilustrasi koleksi arsip</small></figcaption></figure></section>
    <section class="lp-stats" id="statistik" aria-labelledby="lp-stats-title"><div class="lp-section-intro"><div><h2 id="lp-stats-title">Kearsipan dalam angka.</h2><p>Ringkasan surat yang tercatat di SIAGA ARSIP.<br>${state.demoMode?'Data saat ini merupakan data uji coba.':'Data agregat dari sistem kearsipan.'}</p></div><label class="lp-year" for="publicYear">Periode data<select id="publicYear"><option value="">Semua tahun</option><option>2026</option><option>2025</option></select></label></div><div id="publicStats" class="lp-stat-grid" aria-live="polite" aria-busy="true"><p>Memuat statistik…</p></div><p class="lp-stats-footnote">Statistik hanya menampilkan jumlah agregat. Isi dan rincian dokumen memerlukan hak akses.</p></section>
    <section class="lp-workflow" id="alur" aria-labelledby="lp-workflow-title"><div class="lp-workflow-intro"><h2 id="lp-workflow-title">Dari pencatatan<br>hingga tindak lanjut.</h2><p>Alur yang menghubungkan naskah dinas, berkas digital, dan penugasan antar-subbagian.</p><a class="lp-link" href="#akses">Tentang akses dokumen ${icon('arrow')}</a></div><ol class="lp-steps"><li><span>1</span><div><h3>Catat naskah dinas</h3><p>Surat masuk dan keluar dicatat bersama metadata serta subbagian penanggung jawab.</p></div></li><li><span>2</span><div><h3>Lengkapi berkas digital</h3><p>Petugas mengunggah berkas untuk melengkapi arsip yang sudah terdaftar.</p></div></li><li><span>3</span><div><h3>Teruskan dan tindak lanjuti</h3><p>Pimpinan memberikan disposisi. Penerima memperbarui status pelaksanaan tugas.</p></div></li></ol></section>
    <section class="lp-access" id="akses"><div><h2>Terbuka informasinya.<br>Terjaga aksesnya.</h2><p>Portal ini menyajikan ringkasan kearsipan kepada publik. Pengelolaan surat, berkas, dan disposisi tersedia di ruang internal sesuai peran serta subbagian pengguna.</p></div><div class="lp-access-action"><button class="lp-button lp-button-light" data-login>Masuk sebagai staf ${icon('arrow')}</button><span>Gunakan akun yang diberikan pengelola sistem.</span></div></section>
    <footer class="lp-footer"><div class="lp-footer-top"><div><b>SIAGA ARSIP</b><p>Sistem Informasi Administrasi<br>&amp; Digitalisasi Arsip Terpadu</p></div><div><b>Bawaslu Kabupaten Aceh Timur</b><p>Pengelolaan arsip dan naskah dinas<br>di lingkungan Bawaslu Kabupaten Aceh Timur.</p></div><a href="#beranda">Kembali ke atas ↑</a></div><div class="lp-footer-bottom"><span>© ${new Date().getFullYear()} SIAGA ARSIP</span><span>Foto ilustrasi: <a href="https://unsplash.com/photos/15t--8VTxsU" target="_blank" rel="noopener noreferrer">Unsplash</a></span></div></footer>
  </main>`;
  document.querySelectorAll('[data-login]').forEach(button => button.onclick = loginView);
  $('#publicYear').onchange = loadPublic;
  loadPublic();
}
async function loadPublic() {
  const year = $('#publicYear')?.value || '';
  const container = $('#publicStats');
  if (!container) return;
  container.setAttribute('aria-busy', 'true');
  try {
    const data = await api('/api/public/stats' + (year ? `?year=${encodeURIComponent(year)}` : ''));
    if ($('#publicStats') !== container || ($('#publicYear')?.value || '') !== year) return;
    container.innerHTML = [['Total arsip', data.total, 'Naskah dinas tercatat'], ['Surat masuk', data.incoming, 'Surat yang diterima'], ['Surat keluar', data.outgoing, 'Surat yang diterbitkan']].map(([label, value, note]) => `<article class="lp-stat"><h3>${label}</h3><b>${Number(value).toLocaleString('id-ID')}</b><p>${note}</p></article>`).join('');
  } catch {
    if ($('#publicStats') !== container) return;
    container.innerHTML = '<div class="lp-stat-error" role="alert">Statistik belum dapat dimuat. <button id="retryStats">Coba lagi</button></div>';
    $('#retryStats').onclick = loadPublic;
  } finally { container.setAttribute('aria-busy', 'false'); }
}
function loginView() {
  app.innerHTML = `<main class="auth-page"><section class="auth-story"><a href="#" class="auth-brand" id="authHome"><span class="auth-mark">SA<span>.</span></span><span><b>SIAGA ARSIP</b><small>Bawaslu Kabupaten Aceh Timur</small></span></a><div class="auth-message"><h1>Catatan yang tertata.<br><span>Kerja yang terarah.</span></h1><p>Kelola naskah dinas, temukan berkas, dan tindak lanjuti disposisi di ruang kerja Anda.</p><div class="auth-capabilities"><span>${icon('archive')} Arsip surat</span><span>${icon('disposition')} Disposisi</span><span>${icon('audit')} Riwayat aktivitas</span></div></div><div class="auth-story-foot"><span>Akses sesuai peran dan subbagian.</span><small>© ${new Date().getFullYear()} SIAGA ARSIP</small></div></section><section class="auth-main"><button class="auth-back" id="goPublic">${icon('arrow')} Kembali ke portal publik</button><div class="auth-form-wrap"><h2>Selamat datang kembali.</h2><p>Masuk dengan akun yang diberikan oleh pengelola sistem.</p><form id="loginForm"><div class="auth-field"><label for="authUsername">Nama pengguna <span class="field-req-text">(wajib)</span></label><input id="authUsername" name="username" autocomplete="username" required placeholder="Masukkan nama pengguna" autocapitalize="none" spellcheck="false"><span id="authUsername-error" class="field-error" role="alert" hidden></span></div><div class="auth-field"><label for="authPassword">Kata sandi <span class="field-req-text">(wajib)</span></label><div class="auth-password"><input id="authPassword" name="password" type="password" autocomplete="current-password" required placeholder="Masukkan kata sandi"><button type="button" id="togglePassword" aria-controls="authPassword" aria-pressed="false">Tampilkan</button></div><span id="authPassword-error" class="field-error" role="alert" hidden></span></div><p class="auth-error" id="loginError" role="alert" tabindex="-1" hidden></p><div id="loginStatus" class="sr-only" role="status" aria-live="polite"></div><button class="auth-submit" id="loginSubmit">Masuk ke ruang arsip ${icon('arrow')}</button></form><p class="auth-help">Kesulitan masuk? Hubungi admin pengelola arsip untuk bantuan akun.</p>${state.demoMode?`<details class="auth-demo"><summary>Akun uji coba</summary><p>Sistem saat ini menggunakan data demo.</p><dl><div><dt>Administrator</dt><dd>admin / admin123</dd></div><div><dt>Pimpinan</dt><dd>pimpinan / pimpinan123</dd></div><div><dt>Pegawai Administrasi</dt><dd>pegawai.administrasi / pegawai123</dd></div></dl></details>`:''}<div class="auth-privacy">${icon('archive')}<p>Akses dokumen mengikuti hak pengguna. Aktivitas pengelolaan tercatat dalam sistem.</p></div></div><span class="auth-institution">BAWASLU KABUPATEN ACEH TIMUR</span></section></main>`;
  $('#goPublic').onclick = publicView;
  $('#authHome').onclick = event => { event.preventDefault(); publicView(); };
  $('#togglePassword').onclick = event => { const input = $('#authPassword'); const shown = input.type === 'password'; input.type = shown ? 'text' : 'password'; event.currentTarget.textContent = shown ? 'Sembunyikan' : 'Tampilkan'; event.currentTarget.setAttribute('aria-pressed', String(shown)); };
  $('#loginForm').onsubmit = async event => {
    event.preventDefault(); const form = event.currentTarget; const button = $('#loginSubmit'); const error = $('#loginError'); const status = $('#loginStatus');
    const uIn = $('#authUsername'), pIn = $('#authPassword'), uErr = $('#authUsername-error'), pErr = $('#authPassword-error');
    error.hidden = true; error.textContent = '';
    uIn.removeAttribute('aria-invalid'); pIn.removeAttribute('aria-invalid');
    uIn.removeAttribute('aria-describedby'); pIn.removeAttribute('aria-describedby');
    if (uErr) uErr.hidden = true; if (pErr) pErr.hidden = true;

    const errors = [];
    if (!uIn.value.trim()) { errors.push({ id: 'authUsername', message: 'Nama pengguna wajib diisi.', input: uIn, errEl: uErr }); }
    if (!pIn.value) { errors.push({ id: 'authPassword', message: 'Kata sandi wajib diisi.', input: pIn, errEl: pErr }); }
    if (errors.length > 0) {
      for (const e of errors) {
        e.input.setAttribute('aria-invalid', 'true');
        e.input.setAttribute('aria-describedby', `${e.id}-error`);
        if (e.errEl) { e.errEl.textContent = e.message; e.errEl.hidden = false; }
      }
      error.innerHTML = `<ul class="error-summary-list">${errors.map(e => `<li><a href="#${e.id}">${e.message}</a></li>`).join('')}</ul>`;
      error.hidden = false;
      error.querySelectorAll('a').forEach(a => a.onclick = (ev) => { ev.preventDefault(); form.querySelector(a.getAttribute('href'))?.focus(); });
      error.focus();
      if (status) status.textContent = 'Gagal masuk: periksa nama pengguna dan kata sandi.';
      return;
    }

    button.disabled = true; button.textContent = 'Sedang masuk…'; form.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'Sedang masuk ke sistem…';
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      if (status) status.textContent = 'Berhasil masuk ke sistem.';
      state.page = 'dashboard'; await loadApp();
    }
    catch (err) {
      uIn.setAttribute('aria-invalid', 'true'); pIn.setAttribute('aria-invalid', 'true');
      uIn.setAttribute('aria-describedby', 'loginError'); pIn.setAttribute('aria-describedby', 'loginError');
      error.textContent = err.message || 'Tidak dapat masuk. Periksa nama pengguna dan kata sandi Anda.';
      error.hidden = false; error.focus();
      if (status) status.textContent = 'Gagal masuk: ' + (err.message || 'periksa kredensial.');
    }
    finally { button.disabled = false; button.innerHTML = `Masuk ke ruang arsip ${icon('arrow')}`; form.setAttribute('aria-busy', 'false'); }
  };
  $('#loginForm').noValidate = true;
}
async function loadApp() { const me = await api('/api/me'); state.user = me.user; await refresh(); renderShell(); }
async function refresh(){
  const [dashboard,result,notifications]=await Promise.all([api('/api/dashboard'),api('/api/archives'),api('/api/notifications').catch(()=>null)]);
  state.notifications=notifications;state.dashboard=dashboard;state.archives=result.items;state.classifications=result.classifications;state.categories=result.categories||state.categories;syncWorkspaceStatus();
}
function renderShell() {
  const nav = [ ['dashboard','Beranda','dashboard'], ['archives','Arsip surat','archive'], ['dispositions','Disposisi','disposition'], ...(state.user.role === 'admin' ? [['settings','Pengguna & klasifikasi','user']] : []), ...(['admin','leader'].includes(state.user.role) ? [['audit','Audit aktivitas','audit']] : []) ];
  const roleNames = {admin:'Administrator',leader:'Pimpinan',recorder:'Pencatat',uploader:'Pengunggah',employee:'Pegawai'};
  app.innerHTML = `<div class="shell design-shell workspace"><button class="ws-scrim" id="closeNav" aria-label="Tutup navigasi" hidden></button><aside class="side" id="workspaceNav"><a class="ws-brand" href="#" id="workspaceHome"><span class="ws-logo">SA</span><span>SIAGA <b>ARSIP</b><small>Bawaslu Aceh Timur</small></span></a><div class="nav-heading">RUANG KERJA</div><nav class="nav" aria-label="Navigasi sistem">${nav.map(([page,label,glyph])=>`<button data-page="${page}"><span class="nav-icon">${icon(glyph)}</span><span class="nav-label">${label}</span>${page==='dispositions' && state.dashboard.pending ? `<small class="nav-badge">${state.dashboard.pending}</small>`:''}</button>`).join('')}</nav><div class="ws-side-note"><span class="ws-demo-dot"></span>${state.demoMode?'Lingkungan uji coba':'Ruang kerja internal'}<p>${state.demoMode?'Data contoh untuk pengujian sistem kearsipan.':'Akses mengikuti peran dan subbagian.'}</p></div><div class="profile-card"><div class="avatar">${initials(state.user.name)}</div><div class="profile-copy"><b>${esc(state.user.name)}</b><small>${esc(roleNames[state.user.role] || state.user.role)}</small></div><button class="ws-icon-button" id="logout" aria-label="Keluar dari sistem">${icon('outgoing')}</button></div></aside><main class="main"><header class="top"><button class="ws-icon-button" id="toggleNav" aria-controls="workspaceNav" aria-expanded="true" aria-label="Buka atau tutup navigasi">${icon('menu')}</button><form class="ws-search" id="globalSearchForm" role="search">${icon('search')}<input id="globalSearch" type="search" maxlength="200" placeholder="Cari arsip surat…" aria-label="Cari arsip surat"><kbd>/</kbd></form><div class="ws-top-right"><span class="ws-office">Bawaslu Kabupaten Aceh Timur</span><button class="ws-icon-button" id="notificationBtn" aria-label="Lihat disposisi">${icon('bell')}${state.notifications?.unread?'<i class="ws-notification-dot"></i>':''}</button><div class="avatar" title="${esc(state.user.name)}">${initials(state.user.name)}</div></div></header><section class="content" id="content"></section><footer class="ws-footer"><span>SIAGA ARSIP · Bawaslu Aceh Timur</span><span>Akses sesuai peran & subbagian</span></footer></main></div>`;
  const shell = $('.workspace');
  function closeMobileNav() { shell.classList.remove('nav-open'); $('#closeNav').hidden = true; $('#toggleNav').setAttribute('aria-expanded',String(innerWidth>900 && !shell.classList.contains('nav-collapsed'))); }
  document.querySelectorAll('[data-page]').forEach(button => button.onclick = async () => { if(button.dataset.page==='dashboard' && Object.values(state.filters).some(Boolean)){state.filters={q:'',type:'',category:'',year:'',status:''};try{await refresh();}catch(err){toast(err.message, 'error');return;}} state.navigationEpoch=(state.navigationEpoch||0)+1;state.page=button.dataset.page; document.querySelectorAll('[data-page]').forEach(item=>{ item.classList.toggle('active',item===button); item.setAttribute('aria-current',item===button?'page':'false'); }); closeMobileNav(); renderPage(); });
  $('#workspaceHome').onclick = event => {event.preventDefault(); document.querySelector('[data-page="dashboard"]').click();};
  $('#toggleNav').onclick = () => { if(innerWidth<=900){const open=shell.classList.toggle('nav-open'); $('#closeNav').hidden=!open; $('#toggleNav').setAttribute('aria-expanded',String(open));}else{shell.classList.toggle('nav-collapsed');$('#toggleNav').setAttribute('aria-expanded',String(!shell.classList.contains('nav-collapsed')));} };
  $('#closeNav').onclick=closeMobileNav;
  shell.addEventListener('keydown', event=>{if(event.key==='Escape')closeMobileNav();if(event.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){event.preventDefault();$('#globalSearch').focus();}});
  $('#notificationBtn').setAttribute('aria-expanded','false');$('#notificationBtn').setAttribute('aria-controls','notificationPanel');$('#notificationBtn').onclick=toggleNotifications;
  $('#logout').onclick=async()=>{await api('/api/logout',{method:'POST'});state.user=null;state.page=null;state.navigationEpoch=(state.navigationEpoch||0)+1;loginView();};
  $('#globalSearchForm').onsubmit=async event=>{event.preventDefault();state.filters.q=$('#globalSearch').value.trim();state.archivePage=1;try{await refresh();document.querySelector('[data-page="archives"]').click();}catch(err){toast(err.message, 'error');}};
  $('#toggleNav').setAttribute('aria-expanded',String(innerWidth>900));syncWorkspaceStatus();
  document.querySelector(`[data-page="${state.page}"]`)?.click();
}
function renderPage() {
  closeNotifications(false);
  const content=$('#content');if(!content)return;
  content.getAnimations().forEach(animation=>animation.cancel());
  if(state.page==='dashboard')renderDashboard();else if(state.page==='archives')renderArchives();else if(state.page==='dispositions')renderDispositions();else { content.innerHTML=loadingSkeleton();content.setAttribute('aria-busy','true');if(state.page==='settings')renderSettings();else renderAudit();return; }
  content.setAttribute('aria-busy','false');animateContent(content);
}
function dispositionStatusClass(status) { return status === 'Selesai' ? 'badge-done' : status === 'Sedang diproses' ? 'badge-progress' : 'badge-pending'; }
function renderDashboard() {
  const d=state.dashboard;
  const tasks=state.archives.flatMap(a=>a.dispositions.map(task=>({a,task})));
  const open=tasks.filter(({task})=>task.status!=='Selesai');
  const distribution=subsections.map(name=>({name,count:state.archives.filter(a=>sameSubsection(a.subsection,name)).length}));
  const statYear=String(new Date().getFullYear());
  const monthlyStats = (type) => Array.from({length:12},(_,month)=>state.archives.filter(a=>a.letterDate?.startsWith(`${statYear}-${String(month+1).padStart(2,'0')}`)&&(!type||a.type===type)).length);
  const statSeries=[monthlyStats(),monthlyStats('incoming'),monthlyStats('outgoing'),Array.from({length:12},(_,month)=>open.filter(({task})=>task.createdAt?.startsWith(`${statYear}-${String(month+1).padStart(2,'0')}`)).length)];
  const stats=[['Total arsip',d.total,'total','Semua naskah dalam cakupan akses','red'],['Surat masuk',d.incoming,'incoming','Naskah dinas yang diterima','blue'],['Surat keluar',d.outgoing,'outgoing','Naskah dinas yang diterbitkan','green'],['Disposisi aktif',d.pending,'disposition','Penugasan yang perlu ditindaklanjuti','amber']];
  $('#content').innerHTML=`<div class="ws-page-heading"><div><p>Ruang kerja <span>/</span> Beranda</p><h1>Ringkasan kearsipan</h1></div><span class="ws-scope">${icon('user')}${esc(state.user.subsectionLabel || subsectionLabel(state.user.subsection) || 'Lintas subbagian')}</span></div><section class="ws-welcome"><div><h2>Selamat datang, ${esc(state.user.name.split(' ')[0])}.</h2><p>Kelola surat dan pantau tindak lanjut disposisi dari satu ruang kerja.</p><button class="ws-welcome-button" id="welcomeAction">${canRecord()?'Registrasi arsip baru':'Buka daftar arsip'} ${icon('arrow')}</button></div><div class="ws-welcome-status"><img src="/assets/images/dashboard-archive.png" alt="" width="220" height="220"></div></section><div class="cards ws-stat-grid">${stats.map(([label,count,glyph,description,color],index)=>`<article class="ws-stat ${color}"><div class="ws-stat-head"><span class="ws-stat-icon">${icon(glyph)}</span><h2>${label}</h2></div><div class="ws-stat-body"><div class="ws-mini-chart" role="img" aria-label="${esc(label)} per bulan tahun ${statYear}: ${statSeries[index].join(', ')}">${statSeries[index].map(value=>`<i style="height:${value/Math.max(1,...statSeries[index])*100}%"></i>`).join('')}</div><div class="ws-stat-value"><b>${count.toLocaleString('id-ID')}</b><span>${index===0?'Arsip tercatat':index===3?'Perlu tindak lanjut':`${d.total?Math.round(count/d.total*100):0}% dari arsip`}</span></div></div><span class="ws-stat-period">Jan–Des ${statYear}</span></article>`).join('')}</div><div class="ws-overview-grid"><section class="panel ws-chart-panel"><div class="ws-panel-head"><div><h2>Volume naskah dinas</h2><p>Jumlah surat berdasarkan tanggal naskah</p></div><label class="ws-chart-filter">Tahun <select id="chartYear" aria-label="Tahun grafik">${[...new Set([String(new Date().getFullYear()),...state.archives.map(a=>a.letterDate?.slice(0,4)).filter(Boolean)])].sort().reverse().map(year=>`<option>${esc(year)}</option>`).join('')}</select></label></div><div id="archiveChart"></div></section><section class="panel ws-distribution"><div class="ws-panel-head"><div><h2>Sebaran arsip</h2><p>Berdasarkan subbagian penanggung jawab</p></div></div><div class="ws-distribution-total"><b>${d.total}</b><span>arsip dalam cakupan akses</span></div>${distribution.map((item,index)=>`<div class="ws-distribution-row"><div><span><i class="ws-dot tone-${index}"></i>${esc(item.name)}</span><b>${item.count}</b></div><div class="ws-track"><i class="tone-${index}" style="width:${d.total?item.count/d.total*100:0}%"></i></div></div>`).join('')}</section></div><section class="panel ws-recent"><div class="ws-panel-head"><div><h2>Arsip terbaru</h2><p>Naskah dinas yang dapat Anda akses</p></div><div class="ws-panel-actions"><a class="btn btn-soft" href="/api/export.csv?${new URLSearchParams(Object.entries(state.filters).filter(([,value])=>value)).toString()}" target="_blank" rel="noopener">${icon('outgoing')} Ekspor CSV</a><button class="btn btn-primary" id="seeArchives">Lihat semua ${icon('arrow')}</button></div></div>${dashboardArchiveTable([...state.archives].sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,5))}</section><section class="panel ws-task-panel"><div class="ws-panel-head"><div><h2>Tindak lanjut disposisi</h2><p>${open.length} penugasan belum selesai</p></div><button class="ws-text-button" id="seeDispositions">Semua disposisi ${icon('arrow')}</button></div>${open.length?`<div class="ws-task-list">${open.slice(0,3).map(({a,task})=>`<div><span class="ws-task-icon">${icon('disposition')}</span><div><b>${esc(a.subject)}</b><small>${esc(a.number)} · ${esc(task.assignedSubsectionLabel||subsectionLabel(task.assignedSubsection||a.subsection))}</small></div><span class="badge ${dispositionStatusClass(task.status)}">${esc(task.status)}</span></div>`).join('')}</div>`:`<div class="ws-empty-tasks">${icon('disposition')}<div><b>Tidak ada disposisi aktif</b><p>Penugasan yang menunggu tindak lanjut akan muncul di sini.</p></div></div>`}</section>`;
  const quality=d.qualityCounts||{},missing=(quality.metadata_only||0)+(quality.missing_file||0)+(quality.missing_attachment||0);
  $('#content').insertAdjacentHTML('beforeend',`<section class="panel quality-queue"><h2>Kelengkapan arsip dalam cakupan akses</h2><p>${missing} berkas belum lengkap · ${quality.needs_review||0} perlu verifikasi · ${quality.needs_correction||0} perlu koreksi · ${quality.complete||0} lengkap setelah verifikasi.</p><p class="muted">Semua tahun. File tersedia belum otomatis dinyatakan benar/lengkap; status disposisi dihitung terpisah.</p><div class="actions">${canUpload()?'<button class="btn btn-soft" data-quality-queue="missing">Antrean unggah</button>':''}${state.user.role==='admin'?'<button class="btn btn-soft" data-quality-queue="needs_review">Antrean verifikasi</button>':''}<button class="btn btn-soft" data-quality-queue="needs_correction">Lihat koreksi</button></div></section>`);
  document.querySelectorAll('[data-quality-queue]').forEach(button=>button.onclick=()=>{state.filters={q:'',type:'',category:'',year:'',status:'',completeness:button.dataset.qualityQueue};state.archivePage=1;document.querySelector('[data-page="archives"]').click();});
  $('#welcomeAction').onclick=()=>canRecord()?openModal('archive'):document.querySelector('[data-page="archives"]').click();
  $('#seeArchives').onclick=()=>document.querySelector('[data-page="archives"]').click();
  $('#seeDispositions').onclick=()=>document.querySelector('[data-page="dispositions"]').click();
  $('#chartYear').onchange=renderArchiveChart;renderArchiveChart();bindArchiveActions();
}
function renderArchiveChart(){
  const year=$('#chartYear').value, months=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const values=months.map((name,index)=>{const list=state.archives.filter(a=>a.letterDate?.startsWith(`${year}-${String(index+1).padStart(2,'0')}`));return {name,incoming:list.filter(a=>a.type==='incoming').length,outgoing:list.filter(a=>a.type==='outgoing').length};});
  const max=Math.ceil(Math.max(4,...values.flatMap(v=>[v.incoming,v.outgoing]))/4)*4;
  const x=index=>40+index*60, y=count=>220-count/max*190;
  const line=key=>values.map((v,index)=>`${index?'L':'M'}${x(index)} ${y(v[key])}`).join(' ');
  const sum=values.reduce((n,v)=>n+v.incoming+v.outgoing,0);
  $('#archiveChart').innerHTML=`<div class="ws-chart-summary"><span><b>${sum}</b> naskah pada ${esc(year)}</span><div class="ws-chart-legend"><span><i class="ws-dot tone-0"></i>Surat masuk</span><span><i class="ws-dot tone-1"></i>Surat keluar</span></div></div><div class="ws-line-chart"><svg viewBox="0 0 730 260" role="img" aria-label="Volume surat masuk dan keluar per bulan tahun ${esc(year)}"><defs><linearGradient id="archiveArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bd241f" stop-opacity=".12"/><stop offset="1" stop-color="#bd241f" stop-opacity="0"/></linearGradient></defs>${[0,1,2,3,4].map(step=>`<line x1="40" y1="${30+step*47.5}" x2="700" y2="${30+step*47.5}" stroke="#e5e9ef" stroke-dasharray="4 5"/><text x="8" y="${34+step*47.5}" fill="#657180" font-size="11">${max-step*max/4}</text>`).join('')}<path d="${line('incoming')} L700 220 L40 220 Z" fill="url(#archiveArea)"/><path d="${line('incoming')}" fill="none" stroke="#bd241f" stroke-width="2"/><path d="${line('outgoing')}" fill="none" stroke="#5680e9" stroke-width="2"/>${values.map((v,index)=>`<circle cx="${x(index)}" cy="${y(v.incoming)}" r="3" fill="#bd241f"><title>${v.name}: ${v.incoming} surat masuk</title></circle><circle cx="${x(index)}" cy="${y(v.outgoing)}" r="3" fill="#5680e9"><title>${v.name}: ${v.outgoing} surat keluar</title></circle><text x="${x(index)}" y="248" text-anchor="middle" fill="#657180" font-size="11">${v.name}</text>`).join('')}</svg></div><details class="ws-chart-data"><summary>Lihat rincian bulanan</summary><table class="table"><caption>Jumlah naskah tahun ${esc(year)}</caption><thead><tr><th>Bulan</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>${values.map(v=>`<tr><td>${v.name}</td><td>${v.incoming}</td><td>${v.outgoing}</td></tr>`).join('')}</tbody></table></details><p class="ws-chart-note">${sum} naskah tercatat pada tahun ${esc(year)}.</p>`;

}
function archiveTypeLabel(type){return type==='incoming'?'Surat masuk':type==='outgoing'?'Surat keluar':'Arsip administrasi umum';}
function archiveCounterparty(archive){return archive.type==='incoming'?archive.origin:archive.type==='outgoing'?archive.destination:'Dokumen administrasi';}
function dashboardArchiveTable(rows){if(!rows.length)return '<div class="empty">Belum ada arsip.</div>';return `<div class="table-wrap"><table class="table dashboard-table"><thead><tr><th>Nomor & tanggal</th><th>Perihal naskah</th><th>Jenis</th><th>Subbagian</th><th>Berkas digital</th><th>Aksi</th></tr></thead><tbody>${rows.map(a=>`<tr><td><b>${esc(a.number)}</b><small>${esc(a.letterDate)}</small></td><td><b>${esc(a.subject)}</b><small>${esc(archiveCounterparty(a))}</small></td><td><span class="badge ${a.type==='incoming'?'badge-in':a.type==='outgoing'?'badge-out':'badge-neutral'}">${archiveTypeLabel(a.type)}</span></td><td>${esc(a.subsectionLabel||subsectionLabel(a.subsection))}</td><td><span class="ws-file-state">${a.fileAvailable?'Tercatat':'Belum dilengkapi'}</span></td><td><button class="ws-icon-button table-link" data-action="detail" data-id="${a.id}" aria-label="Detail ${esc(a.number)}">${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`;}
function archiveRows(rows) { if (!rows.length) return `<div class="empty">Belum ada arsip.</div>`; return `<div class="table-wrap"><table class="table"><thead><tr><th>Jenis / nomor</th><th>Perihal</th><th>Subbagian</th><th>Disposisi / kelengkapan</th><th>Aksi</th></tr></thead><tbody>${rows.map(a => `<tr><td><span class="badge ${a.type === 'incoming' ? 'badge-in' : a.type === 'outgoing' ? 'badge-out' : 'badge-neutral'}">${archiveTypeLabel(a.type)}</span><br><b>${esc(a.number)}</b><br><span class="muted">${esc(a.letterDate)}</span></td><td>${esc(a.subject)}<br><span class="muted">${esc(archiveCounterparty(a))}</span><small class="muted">${esc(a.category||'')}</small></td><td>${esc(a.subsectionLabel||subsectionLabel(a.subsection))}</td><td>${a.dispositions.length ? a.dispositions.map(d => `<span class="badge ${d.status === 'Selesai' ? 'badge-done' : d.status === 'Sedang diproses' ? 'badge-progress' : 'badge-pending'}">${esc(d.status)}</span>`).join('<br>') : '<span class="muted">Tanpa disposisi</span>'}<small class="quality-state">${esc(a.quality?.label||'Perlu verifikasi')}</small></td><td><button class="btn btn-soft table-link" data-action="detail" data-id="${esc(a.id)}">Detail</button><button class="btn btn-soft quality-btn" data-id="${esc(a.id)}">Kelengkapan</button><button class="btn btn-soft file-history" data-id="${esc(a.id)}">Berkas & versi</button>${state.user?.role==='admin'?`<button class="btn btn-soft edit-archive" data-id="${a.id}">Ubah metadata</button>`:''}${a.type === 'incoming' && ['admin','leader'].includes(state.user?.role) ? `<button class="btn btn-soft dispose-btn" data-id="${a.id}">Disposisi</button>` : ''}${a.fileAvailable ? `<a class="btn btn-soft" href="/api/files/${a.fileId}" target="_blank" rel="noopener">Unduh</a>` : canUpload() ? `<button class="btn btn-soft upload-btn" data-id="${a.id}">Unggah berkas</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`; }
async function openArchiveEdit(id){
  if(state.user?.role!=='admin')return;
  const page=state.page;
  return openArchiveEditor({id,api,app,esc,icon,subsections,classifications:state.classifications,categories:state.categories,toast,closeModal,canShow:()=>state.user?.role==='admin'&&state.page===page,onSaved:async()=>{await refresh();renderPage();}});
}
function bindArchiveActions() { document.querySelectorAll('.quality-btn').forEach(button=>button.onclick=()=>openQuality(button.dataset.id)); document.querySelectorAll('.file-history').forEach(button=>button.onclick=()=>openArchiveFiles(button.dataset.id)); document.querySelectorAll('.edit-archive').forEach(button=>button.onclick=()=>openArchiveEdit(button.dataset.id)); document.querySelectorAll('.dispose-btn').forEach(b => b.onclick = () => openDisposition(b.dataset.id)); document.querySelectorAll('.upload-btn').forEach(b => b.onclick = () => openUploadModal(b.dataset.id)); document.querySelectorAll('.table-link[data-action="detail"]').forEach(b => b.onclick = () => { const archive = (state.page==='archives'?state.archiveItems:state.archives).find(item => item.id === b.dataset.id); if (archive) openArchiveDetail(archive); }); }
function metadataHistoryHtml(archive){
  const history=archive.metadataHistory||[],earlier=(archive.metadataVersion||0)>0&&(!history.length||history[0].version>1);
  const when=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB':'Waktu tidak tercatat';
  return `<section class="metadata-history" aria-labelledby="metadataHistoryTitle"><h4 id="metadataHistoryTitle">Riwayat koreksi metadata</h4><p class="muted">Riwayat mencatat kolom yang berubah, pelaku, waktu, dan versi. Nilai lama/baru tidak disalin ke riwayat.</p>${earlier?'<p class="notice">Rincian koreksi sebelum pencatatan riwayat ini belum tersedia.</p>':''}${history.length?`<ol>${[...history].reverse().map(event=>`<li><p><strong>Versi ${esc(event.version)}</strong> · ${esc(event.byName)}<br><time>${esc(when(event.at))}</time></p><p>Kolom diperbarui: ${esc(event.fieldLabels.join(', ')||'Tidak tercatat')}.</p></li>`).join('')}</ol>`:'<p>Belum ada koreksi metadata yang tercatat.</p>'}</section>`;
}
async function openArchiveDetail(archive) {
  const userId=state.user?.id,epoch=state.navigationEpoch,page=state.page;
  try{archive=await api('/api/archives/'+encodeURIComponent(archive.id));}catch(err){toast(err.message,'error');return;}
  if(!userId||state.user?.id!==userId||state.navigationEpoch!==epoch||state.page!==page)return;
  const previous=document.activeElement;
  app.insertAdjacentHTML('beforeend', `<div class="modal-back" id="modalBack"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="detailTitle" tabindex="-1"><div class="modal-head"><h3 id="detailTitle">Detail arsip</h3><button class="icon-btn" id="closeModal" aria-label="Tutup detail">${icon('close')}</button></div><h4>${esc(archive.subject)}</h4><dl class="ws-detail-list">${[['Indeks sistem',archive.systemIndex],['Tahun arsip',archive.year],['Nomor agenda',archive.agendaNumber],['Kode klasifikasi',archive.classificationCode],['Jenis sumber',archive.sourceLabel],['Lokasi fisik',archive.physicalLocation],['Referensi sumber',archive.sourceReference],['Kategori',archive.category],['Nomor arsip',archive.number],['Tanggal arsip',archive.letterDate],['Jenis',archiveTypeLabel(archive.type)],['Asal / tujuan',archiveCounterparty(archive)],['Subbagian',archive.subsectionLabel||subsectionLabel(archive.subsection)],['Klasifikasi',archive.classification]].map(([label,value])=>`<div><dt>${label}</dt><dd>${esc(value||'—')}</dd></div>`).join('')}</dl>${archive.updatedAt?`<p class="muted archive-edit-intro">Terakhir diubah ${esc(new Date(archive.updatedAt).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'}))} oleh ${esc(archive.updatedByName||'admin')}.</p>`:''}<p class="quality-state">${esc(archive.quality.label)}</p>${metadataHistoryHtml(archive)}${archiveChronology(archive,esc)}<div class="actions"><button class="btn btn-soft" id="qualityFromDetail">Kelengkapan & verifikasi</button><button class="btn btn-soft" id="filesFromDetail">Berkas & riwayat versi</button>${state.user?.role==='admin'?'<button class="btn btn-soft" id="editFromDetail">Ubah metadata</button>':''}${archive.fileAvailable?`<a class="btn btn-primary" href="/api/files/${encodeURIComponent(archive.fileId)}" target="_blank" rel="noopener">Unduh berkas</a><a class="btn btn-soft" href="/api/files/${encodeURIComponent(archive.fileId)}?filename=structured" target="_blank" rel="noopener">Unduh nama terstruktur</a>`:'<span class="muted">Berkas belum dilengkapi.</span>'}</div></section></div>`);
  const back=$('#modalBack'),dialog=$('.modal',back);const close=()=>{closeModal();previous?.focus();};$('#closeModal',back).onclick=close;$('#qualityFromDetail',back).onclick=()=>openQuality(archive.id);$('#filesFromDetail',back).onclick=()=>openArchiveFiles(archive.id);$('#editFromDetail',back)?.addEventListener('click',()=>openArchiveEdit(archive.id));
  back.onclick=event=>{if(event.target===back)close();};back.onkeydown=event=>{if(event.key==='Escape')close();if(event.key==='Tab'){const focusable=[...dialog.querySelectorAll('button,a[href]')];const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};dialog.focus();
}
function renderArchives(){
  const root=$('#content');
  renderArchiveSearch({root,state,api,esc,subsections,canRecord,onAdd:()=>openModal('archive'),rowsHtml:archiveRows,bindActions:bindArchiveActions,loading:loadingSkeleton,isCurrent:()=>state.page==='archives'&&$('#content')===root});
}
async function openQuality(id){const page=state.page,epoch=state.navigationEpoch;try{await openArchiveQuality({id,api,app,esc,closeModal,canReview:state.user?.role==='admin',canInspect:canUpload(),toast,isCurrent:()=>state.page===page&&state.navigationEpoch===epoch,onSaved:async()=>{await refresh();if(state.page===page&&state.navigationEpoch===epoch)renderPage();}});}catch(failure){toast(failure.message,'error');}}
async function openArchiveFiles(id){
  const page=state.page;
  try{await openFileHistory({id,api,app,esc,readFile,canUpload:canUpload(),closeModal,onSaved:async()=>{await refresh();renderPage();},toast,isCurrent:()=>state.page===page});}catch(failure){toast(failure.message,'error');}
}
function renderDispositions(){const root=$('#content'),epoch=state.navigationEpoch;renderDispositionWorklist({root,state,api,esc,onHistory:openDispositionTimeline,onDetail:openArchiveDetail,onChanged:refresh,toast,loading:loadingSkeleton,isCurrent:()=>state.page==='dispositions'&&state.navigationEpoch===epoch});}
async function openDispositionTimeline(archiveId,dispositionId){const page=state.page,epoch=state.navigationEpoch;try{await openDispositionHistory({archiveId,dispositionId,api,app,esc,closeModal,canUpdate,supervisor:['admin','leader'].includes(state.user?.role),toast,onSaved:async()=>{await refresh();if(state.page===page&&state.navigationEpoch===epoch)renderPage();},isCurrent:()=>state.page===page&&state.navigationEpoch===epoch});}catch(failure){toast(failure.message,'error');}}
function canUpdate(d) { return state.user.role === 'admin' || state.user.role === 'leader' || (d.assignedUserId ? d.assignedUserId === state.user.id : Boolean(state.user.subsection && sameSubsection(d.assignedSubsection,state.user.subsection))); }
async function renderSettings() {
  try {
    const target=$('#content');const [users, roles] = await Promise.all([api('/api/admin/users'), api('/api/admin/roles')]); if(state.page!=='settings'||$('#content')!==target)return;state.users = users.items;target.setAttribute('aria-busy','false');
    $('#content').innerHTML = `<div class="title-row"><div><div class="eyebrow">Administrasi sistem</div><h1>Pengaturan</h1></div></div><div class="grid-2"><div class="panel"><b>Buat akun baru</b><p class="muted" style="font-size:12px">Akun dibuat dan dikelola langsung oleh admin.</p>
    <div id="userFormErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden><h4 class="form-error-title">Periksa kesalahan pengisian akun:</h4><ul class="error-summary-list"></ul><p class="form-error-desc" hidden></p></div>
    <form id="userForm" data-managed-submit="true"><div class="form-grid">
      <div class="field"><label for="create-user-username">Username <span class="field-req-text">(wajib)</span></label><input id="create-user-username" name="username" required autocomplete="username"><span id="create-user-username-error" class="field-error" role="alert" hidden></span></div>
      <div class="field"><label for="create-user-name">Nama lengkap <span class="field-req-text">(wajib)</span></label><input id="create-user-name" name="name" required autocomplete="name"><span id="create-user-name-error" class="field-error" role="alert" hidden></span></div>
      <div class="field"><label for="create-user-email">Email <span class="field-opt-text">(opsional)</span></label><input id="create-user-email" name="email" type="email" autocomplete="email" aria-describedby="create-user-email-help"><small id="create-user-email-help" class="field-help">Dicatat sebagai informasi kontak akun.</small><span id="create-user-email-error" class="field-error" role="alert" hidden></span></div>
      <div class="field"><label for="create-user-password">Kata sandi <span class="field-req-text">(wajib)</span></label><input id="create-user-password" name="password" type="password" minlength="8" required autocomplete="new-password" aria-describedby="create-user-password-help"><small id="create-user-password-help" class="field-help">Minimal 8 karakter.</small><span id="create-user-password-error" class="field-error" role="alert" hidden></span></div>
      <div class="field"><label for="create-user-role">Peran <span class="field-req-text">(wajib)</span></label><select id="create-user-role" name="role">${roles.items.map(x => `<option value="${x}">${x}</option>`).join('')}</select><span id="create-user-role-error" class="field-error" role="alert" hidden></span></div>
      <div class="field subsection-field"><label for="create-user-subsection">Subbagian <span id="create-user-sub-req" class="field-req-text">(wajib)</span></label><select id="create-user-subsection" name="subsection" aria-describedby="create-user-subsection-help">${(state.user.role==='recorder'?[state.user.subsection]:subsections).map(x => `<option value="${esc(x)}">${esc(sameSubsection(x,state.user.subsection)?(state.user.subsectionLabel||x):x)}</option>`).join('')}</select><small id="create-user-subsection-help" class="field-help">Diperlukan untuk peran pencatat, pengunggah, dan pegawai.</small><span id="create-user-subsection-error" class="field-error" role="alert" hidden></span></div>
    </div><div id="userFormStatus" class="form-status sr-only" role="status" aria-live="polite"></div><button class="btn btn-primary" id="saveNewUser">Buat akun</button></form></div>
    <div class="panel"><b>Klasifikasi arsip</b><p class="muted" style="font-size:12px">Tambahkan pilihan yang sudah disepakati kantor.</p><form id="classificationForm" style="display:flex;gap:8px"><label for="newClassification" class="sr-only">Nama klasifikasi</label><input id="newClassification" name="label" required placeholder="Nama klasifikasi"><button class="btn btn-soft">Tambah</button></form><div class="tag-list" style="margin-top:14px">${state.classifications.map(x => `<span class="badge badge-out">${esc(x)}</span>`).join(' ')}</div><div class="notice" style="margin-top:20px">Perubahan klasifikasi dicatat ke audit log dan tidak otomatis mengubah akses subbagian.</div></div></div><div class="panel" style="margin-top:18px"><div class="title-row" style="margin-bottom:10px"><div><b>Daftar akun</b><div class="muted" style="font-size:12px">Peran, subbagian, dan status akses.</div></div></div><div class="table-wrap"><table class="table"><thead><tr><th>Nama / username</th><th>Peran</th><th>Subbagian</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${state.users.map(x => `<tr><td><b>${esc(x.name)}</b><br><span class="muted">${esc(x.username)}</span></td><td>${esc(x.role)}</td><td>${esc(x.subsection || 'Lintas subbagian')}</td><td><span class="badge ${x.active ? 'badge-done' : 'badge-pending'}">${x.active ? 'Aktif' : 'Nonaktif'}</span></td><td><button class="btn btn-soft user-edit" data-id="${x.id}">Ubah</button> <button class="btn btn-soft user-toggle" data-id="${x.id}" data-active="${x.active}">${x.active ? 'Nonaktifkan' : 'Aktifkan'}</button></td></tr>`).join('')}</tbody></table></div></div>`;
    animateContent($('#content'));
    const role = $('#create-user-role'); const subsectionField = $('.subsection-field'); const subSelect = $('#create-user-subsection'); const subReq = $('#create-user-sub-req');
    const toggleSubsection = () => {
      const isLeaderAdmin = ['admin', 'leader'].includes(role.value);
      subsectionField.classList.toggle('hidden', isLeaderAdmin);
      subSelect.disabled = isLeaderAdmin;
      if (isLeaderAdmin) {
        subSelect.removeAttribute('required');
        subSelect.removeAttribute('aria-required');
        if (subReq) { subReq.textContent = '(tidak berlaku)'; subReq.className = 'field-opt-text'; }
      } else {
        subSelect.required = true;
        subSelect.setAttribute('aria-required', 'true');
        if (subReq) { subReq.textContent = '(wajib)'; subReq.className = 'field-req-text'; }
      }
    };
    role.onchange = toggleSubsection; toggleSubsection();

    const uForm = $('#userForm');
    const uA11y = setupFormA11y(uForm, { errorSummaryId: 'userFormErrorSummary', statusId: 'userFormStatus', summaryTitle: 'Periksa kesalahan pengisian akun:' });

    uForm.onsubmit = async e => {
      e.preventDefault();
      if (!uA11y.validate()) return;
      const btn = $('#saveNewUser');
      btn.disabled = true; btn.innerHTML = '<i class="ws-spinner"></i> Menyimpan…';
      uA11y.setSubmitting('Sedang membuat akun baru…');
      try {
        await api('/api/admin/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
        uA11y.setSuccess('Akun berhasil dibuat.');
        toast('Akun berhasil dibuat.');
        await renderSettings();
      } catch (err) {
        let msg = err.message;
        if (err.status === 401) {
          msg = 'Sesi Anda telah berakhir. Formulir tetap dibuka agar draf Anda tidak hilang. Salin draf Anda atau buka tab baru untuk masuk kembali.';
        }
        uA11y.setFailure(msg);
        toast(msg, 'error');
      } finally {
        btn.disabled = false; btn.textContent = 'Buat akun';
      }
    };
    $('#classificationForm').onsubmit = async e => { e.preventDefault(); try { const result = await api('/api/admin/classifications', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }); state.classifications = result.classifications; e.target.reset(); toast('Klasifikasi ditambahkan.'); renderSettings(); } catch (err) { toast(err.message, 'error'); } };
    document.querySelectorAll('.user-edit').forEach(b => b.onclick = () => openUserModal(b.dataset.id));
    document.querySelectorAll('.user-toggle').forEach(b => b.onclick = async () => { try { await api(`/api/admin/users/${b.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ active: b.dataset.active !== 'true' }) }); toast('Status akun diperbarui.'); renderSettings(); } catch (err) { toast(err.message, 'error'); } });
  } catch (err) { if(state.page==='settings')pageLoadError(err); }
}
function openUserModal(userId) {
  const user = state.users.find(x => x.id === userId); if (!user) return;
  app.insertAdjacentHTML('beforeend', `<div class="modal-back" id="modalBack"><section class="modal"><div class="modal-head"><h3>Ubah akun</h3><button class="icon-btn" id="closeModal" aria-label="Tutup ubah akun">×</button></div>
  <div id="editUserErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden><h4 class="form-error-title">Periksa kesalahan pengisian akun:</h4><ul class="error-summary-list"></ul><p class="form-error-desc" hidden></p></div>
  <form id="editUserForm" data-managed-submit="true">
    <div class="field"><label for="edit-user-username">Username</label><input id="edit-user-username" value="${esc(user.username)}" disabled></div>
    <div class="field"><label for="edit-user-name">Nama lengkap <span class="field-req-text">(wajib)</span></label><input id="edit-user-name" name="name" value="${esc(user.name)}" required autocomplete="name"><span id="edit-user-name-error" class="field-error" role="alert" hidden></span></div>
    <div class="field"><label for="edit-user-email">Email <span class="field-opt-text">(opsional)</span></label><input id="edit-user-email" name="email" type="email" value="${esc(user.email || '')}" autocomplete="email"><span id="edit-user-email-error" class="field-error" role="alert" hidden></span></div>
    <div class="field"><label for="edit-user-password">Kata sandi baru <span class="field-opt-text">(opsional)</span></label><input id="edit-user-password" name="password" type="password" minlength="8" placeholder="Kosongkan jika tidak berubah" autocomplete="new-password" aria-describedby="edit-user-password-help"><small id="edit-user-password-help" class="field-help">Minimal 8 karakter jika ingin diubah.</small><span id="edit-user-password-error" class="field-error" role="alert" hidden></span></div>
    <div class="field"><label for="edit-user-role">Peran <span class="field-req-text">(wajib)</span></label><select id="edit-user-role" name="role">${['admin','leader','recorder','uploader','employee'].map(x => `<option ${x === user.role ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="field edit-subsection"><label for="edit-user-subsection">Subbagian <span id="edit-user-sub-req" class="field-req-text">(wajib)</span></label><select id="edit-user-subsection" name="subsection">${subsections.map(x => `<option value="${esc(x)}" ${sameSubsection(x,user.subsection) ? 'selected' : ''}>${esc(sameSubsection(x,user.subsection)?(user.subsectionLabel||x):x)}</option>`).join('')}</select></div>
    <div id="editUserStatus" class="form-status sr-only" role="status" aria-live="polite"></div>
    <div class="actions"><button type="button" class="btn btn-soft" id="cancelModal">Batal</button><button class="btn btn-primary" id="saveEditUser">Simpan perubahan</button></div>
  </form></section></div>`);
  $('#closeModal').onclick = closeModal; $('#cancelModal').onclick = closeModal;
  const role = $('#editUserForm select[name=role]'); const field = $('.edit-subsection'); const subSelect = $('#editUserForm select[name=subsection]'); const subReq = $('#edit-user-sub-req');
  const toggle = () => {
    const isLeaderAdmin = ['admin', 'leader'].includes(role.value);
    field.classList.toggle('hidden', isLeaderAdmin);
    subSelect.disabled = isLeaderAdmin;
    if (isLeaderAdmin) {
      subSelect.removeAttribute('required');
      subSelect.removeAttribute('aria-required');
      if (subReq) { subReq.textContent = '(tidak berlaku)'; subReq.className = 'field-opt-text'; }
    } else {
      subSelect.required = true;
      subSelect.setAttribute('aria-required', 'true');
      if (subReq) { subReq.textContent = '(wajib)'; subReq.className = 'field-req-text'; }
    }
  };
  role.onchange = toggle; toggle();

  const editForm = $('#editUserForm');
  const editA11y = setupFormA11y(editForm, { errorSummaryId: 'editUserErrorSummary', statusId: 'editUserStatus', summaryTitle: 'Periksa kesalahan pengisian akun:' });

  editForm.onsubmit = async e => {
    e.preventDefault();
    if (!editA11y.validate()) return;
    const btn = $('#saveEditUser');
    btn.disabled = true; btn.innerHTML = '<i class="ws-spinner"></i> Menyimpan…';
    editA11y.setSubmitting('Sedang menyimpan perubahan akun…');
    try {
      const values = Object.fromEntries(new FormData(e.target));
      if (!values.password) delete values.password;
      await api(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(values) });
      editA11y.setSuccess('Akun berhasil diperbarui.');
      closeModal();
      if(userId===state.user.id){state.user=null;loginView();toast('Akun diperbarui. Silakan masuk kembali.');}
      else{toast('Akun berhasil diperbarui.');renderSettings();}
    } catch (err) {
      let msg = err.message;
      if (err.status === 401) {
        msg = 'Sesi Anda telah berakhir. Formulir tetap dibuka agar draf Anda tidak hilang. Salin draf Anda atau buka tab baru untuk masuk kembali.';
      }
      editA11y.setFailure(msg);
      toast(msg, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan perubahan';
    }
  };
}
function renderAudit() { const target=$('#content');return api('/api/admin/audit').then(r => { if(state.page!=='audit'||$('#content')!==target)return;target.setAttribute('aria-busy','false'); $('#content').innerHTML = `<div class="title-row"><div><div class="eyebrow">Jejak sistem</div><h1>Audit aktivitas</h1></div></div><div class="panel">${archiveRows([]).replace('Belum ada arsip.', `<div class="table-wrap"><table class="table"><thead><tr><th>Waktu</th><th>Aktor</th><th>Aksi</th><th>Detail</th></tr></thead><tbody>${r.items.map(x => `<tr><td>${new Date(x.at).toLocaleString('id-ID')}</td><td>${esc(x.actorName)}</td><td><span class="badge badge-out">${esc(x.action)}</span></td><td>${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>`)}</div>`; animateContent(target);}).catch(e => {if(state.page==='audit')pageLoadError(e);}); }
function openUploadModal(archiveId) {
  const a = (state.page==='archives'?state.archiveItems:state.archives).find(x => x.id === archiveId); if (!a) return;
  app.insertAdjacentHTML('beforeend', `<div class="modal-back" id="modalBack"><section class="modal"><div class="modal-head"><h3>Unggah berkas arsip</h3><button class="icon-btn" id="closeModal" aria-label="Tutup unggah berkas">×</button></div><p class="muted" style="font-size:12px">${esc(a.number)} · ${esc(a.subject)}</p>
  <div id="uploadFormErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden></div>
  <form id="uploadForm" data-managed-submit="true"><div class="field">
    <label for="upload-file">Berkas digital <span class="field-req-text">(wajib)</span></label>
    <input id="upload-file" name="upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" required aria-describedby="upload-file-help">
    <small id="upload-file-help" class="field-help muted">PDF, JPG/PNG, XLSX, DOCX · maksimal 15 MB</small>
    <span id="upload-file-error" class="field-error" role="alert" hidden></span>
  </div>
  <div id="uploadFormStatus" class="form-status sr-only" role="status" aria-live="polite"></div>
  <div class="actions"><button type="button" class="btn btn-soft" id="cancelModal">Batal</button><button class="btn btn-primary" id="saveUploadModal">Unggah berkas</button></div></form></section></div>`);
  $('#closeModal').onclick = closeModal; $('#cancelModal').onclick = closeModal;
  const upForm = $('#uploadForm');
  const upA11y = setupFormA11y(upForm, { errorSummaryId: 'uploadFormErrorSummary', statusId: 'uploadFormStatus', summaryTitle: 'Periksa berkas unggahan:' });

  upForm.onsubmit = async e => {
    e.preventDefault();
    const fileIn = $('#upload-file');
    const file = fileIn.files[0];
    const btn = $('#saveUploadModal');

    if (!file) {
      upA11y.showErrors([{ id: 'upload-file', message: 'Pilih berkas digital yang akan diunggah.' }], 'Pilih berkas digital yang akan diunggah.');
      return;
    }

    btn.disabled = true; btn.innerHTML = '<i class="ws-spinner"></i> Mengunggah…';
    upA11y.setSubmitting('Sedang membaca dan mengunggah berkas…');
    try {
      const data = await readFile(file);
      await api(`/api/archives/${archiveId}/files`, { method: 'POST', body: JSON.stringify({ fileName: file.name, mimeType: file.type, data }) });
      upA11y.setSuccess('Berkas berhasil diunggah.');
      closeModal(); await refresh(); renderPage(); toast('Berkas berhasil diunggah.');
    } catch (err) {
      let msg = err.message;
      if (err.status === 401) {
        msg = 'Sesi Anda telah berakhir. Formulir dan berkas tetap terbuka. Silakan buka tab baru untuk masuk kembali.';
      }
      upA11y.setFailure(msg, [{ id: 'upload-file', message: msg }]);
      toast(msg, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Unggah berkas';
    }
  };
}
function openDisposition(archiveId) { const archive=(state.page==='archives'?state.archiveItems:state.archives).find(item=>item.id===archiveId);const page=state.page,epoch=state.navigationEpoch;if(archive)openDispositionForm({archive,app,api,esc,closeModal,refresh,renderPage,toast,isCurrent:()=>state.page===page&&state.navigationEpoch===epoch}); }
function openModal(kind){
  state.modal=kind;
  app.insertAdjacentHTML('beforeend',`<div class="modal-back" id="modalBack"><section class="modal"><div class="modal-head"><h3>Tambah arsip surat</h3><button type="button" class="icon-btn" id="closeModal" aria-label="Tutup pencatatan arsip">×</button></div>
  <div id="archiveFormErrorSummary" class="form-error-summary archive-edit-error" role="alert" tabindex="-1" hidden>
    <h4 class="form-error-title" id="archiveFormErrorTitle">Periksa kembali isian formulir:</h4>
    <ul class="error-summary-list" id="archiveFormErrorList"></ul>
    <p class="form-error-desc" id="archiveFormErrorDesc" hidden></p>
  </div>
  <form id="archiveForm" data-managed-submit="true">
  <fieldset id="archiveMetadata" class="archive-create-fields"><legend class="archive-create-legend">Metadata surat</legend><div class="form-grid">
  <div class="field"><label for="create-type">Jenis arsip <span class="field-req-text">(wajib)</span></label><select id="create-type" name="type"><option value="incoming">Surat masuk</option><option value="outgoing">Surat keluar</option><option value="administrative">Arsip administrasi umum</option></select><span id="create-type-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-category">Kategori arsip <span class="field-req-text">(wajib)</span></label><select id="create-category" name="category">${state.categories.map(value=>`<option value="${esc(value)}">${esc(value)}</option>`).join('')}</select><span id="create-category-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-subsection">Subbagian penanggung jawab <span class="field-req-text">(wajib)</span></label><select id="create-subsection" name="subsection">${(state.user.role==='recorder'?[state.user.subsection]:subsections).map(value=>`<option>${esc(value)}</option>`).join('')}</select><span id="create-subsection-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-number">Nomor surat <span class="field-req-text">(wajib)</span></label><input id="create-number" name="number" required maxlength="200" placeholder="Contoh: IN/AT/011/2026"><span id="create-number-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-letterDate">Tanggal surat <span class="field-req-text">(wajib)</span></label><input id="create-letterDate" name="letterDate" type="date" required value="${localToday()}"><span id="create-letterDate-error" class="field-error" role="alert" hidden></span></div>
  <div class="field incoming-only"><label for="create-receivedDate">Tanggal diterima <span id="create-receivedDate-req" class="field-req-text">(wajib)</span></label><input id="create-receivedDate" name="receivedDate" type="date" value="${localToday()}"><span id="create-receivedDate-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-classification">Klasifikasi <span class="field-req-text">(wajib)</span></label><select id="create-classification" name="classification">${state.classifications.map(value=>`<option>${esc(value)}</option>`).join('')}</select><span id="create-classification-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-origin">Asal surat <span id="create-origin-req" class="field-req-text">(wajib)</span></label><input id="create-origin" name="origin" maxlength="500" placeholder="Untuk surat masuk"><span id="create-origin-error" class="field-error" role="alert" hidden></span></div>
  <div class="field"><label for="create-destination">Tujuan surat <span id="create-destination-req" class="field-opt-text">(opsional)</span></label><input id="create-destination" name="destination" maxlength="500" placeholder="Untuk surat keluar"><span id="create-destination-error" class="field-error" role="alert" hidden></span></div>
  <div class="field full"><label for="create-subject">Perihal <span class="field-req-text">(wajib)</span></label><textarea id="create-subject" name="subject" rows="2" required maxlength="2000"></textarea><span id="create-subject-error" class="field-error" role="alert" hidden></span></div>
  <div class="field outgoing-only"><label for="create-signatory">Penandatangan <span id="create-signatory-req" class="field-req-text">(wajib)</span></label><input id="create-signatory" name="signatory" maxlength="300" placeholder="Nama/jabatan penandatangan"><span id="create-signatory-error" class="field-error" role="alert" hidden></span></div>
  </div>${archiveSourceFields({},esc,'create')}</fieldset>
  ${canUpload()?'<div class="field"><label for="create-upload">Unggah berkas <span class="field-opt-text">(opsional)</span></label><input id="create-upload" name="upload" type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx" aria-describedby="create-upload-help"><small id="create-upload-help" class="field-help muted">PDF, JPG/PNG, XLSX, DOCX · maksimal 15 MB</small><span id="create-upload-error" class="field-error" role="alert" hidden></span></div>':''}
  <p id="archiveSaveNotice" class="notice" role="status" hidden></p><p id="archiveSaveError" class="archive-edit-error" role="alert" tabindex="-1" hidden></p>
  <div id="archiveFormStatus" class="form-status sr-only" role="status" aria-live="polite"></div>
  <div class="actions"><button type="button" class="btn btn-soft" id="cancelModal">Batal</button><button type="submit" class="btn btn-primary" id="saveArchive">Simpan arsip</button></div></form></section></div>`);
  const type=$('#create-type');
  const toggle=()=>{
    const incoming = type.value === 'incoming', outgoing=type.value==='outgoing';
    const category=$('#create-category'),defaultCategory=incoming?'Surat Masuk':outgoing?'Surat Keluar':'Arsip Administrasi Umum';
    if(category?.querySelector(`option[value="${CSS.escape(defaultCategory)}"]`))category.value=defaultCategory;
    document.querySelectorAll('.incoming-only').forEach(el=>el.classList.toggle('hidden',!incoming));
    document.querySelectorAll('.outgoing-only').forEach(el=>el.classList.toggle('hidden',!outgoing));
    const recIn = $('#create-receivedDate'), destIn = $('#create-destination'), sigIn = $('#create-signatory'), origIn = $('#create-origin');
    const origReq = $('#create-origin-req'), destReq = $('#create-destination-req');
    if (recIn) {
      recIn.required = incoming;
      if (incoming) recIn.setAttribute('aria-required','true'); else recIn.removeAttribute('aria-required');
    }
    if (origIn) {
      origIn.required = incoming;
      if (incoming) origIn.setAttribute('aria-required','true'); else origIn.removeAttribute('aria-required');
      if (origReq) {
        origReq.textContent = incoming ? '(wajib)' : '(opsional)';
        origReq.className = incoming ? 'field-req-text' : 'field-opt-text';
      }
    }
    if (destIn) {
      destIn.required = outgoing;
      if (outgoing) destIn.setAttribute('aria-required','true'); else destIn.removeAttribute('aria-required');
      if (destReq) {
        destReq.textContent = outgoing ? '(wajib)' : '(opsional)';
        destReq.className = outgoing ? 'field-req-text' : 'field-opt-text';
      }
    }
    if (sigIn) {
      sigIn.required = outgoing;
      if (outgoing) sigIn.setAttribute('aria-required','true'); else sigIn.removeAttribute('aria-required');
    }
  };
  type.onchange=toggle;toggle();
  bindArchiveSourceFields($('#archiveForm'));
  bindArchiveCreate({form:$('#archiveForm'),api,readFile,onClose:()=>closeModal(true),onSaved:async()=>{await refresh();renderPage();},toast});
}
function readFile(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('Berkas belum dapat dibaca.')); reader.readAsDataURL(file); }); }
function closeModal(force=false) {
  const back=$('#modalBack');if(!back)return;
  const createForm=back.querySelector('#archiveForm');if(createForm?.dataset.submitting)return;if(!force&&createForm?._closeArchive)return createForm._closeArchive();
  back.removeAttribute('id');back.inert=true;back.classList.add('is-closing');back._restoreFocus?.focus();
  if(reduceMotion())back.remove();else setTimeout(()=>back.remove(),140);
}
function debounce(fn, ms) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; }
// Workspace feedback uses native CSS/WAAPI, without an animation dependency.
function reduceMotion(){return window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function animateContent(content){if(!content||reduceMotion())return;content.animate([{opacity:.6,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:190,easing:'cubic-bezier(.16,1,.3,1)'});}
function loadingSkeleton(){return `<div class="ws-loading" role="status"><span class="ws-loading-label"><i class="ws-spinner"></i>Memuat data…</span><div class="ws-skeleton-heading"></div><div class="ws-skeleton-grid">${'<div></div>'.repeat(4)}</div><div class="ws-skeleton-table">${'<span></span>'.repeat(5)}</div></div>`;}
function pageLoadError(error){const content=$('#content');if(!content)return;content.setAttribute('aria-busy','false');content.innerHTML=`<div class="panel ws-load-error" role="alert"><h2>Data belum dapat dimuat</h2><p>${esc(error.message)}</p><button class="btn btn-primary" id="retryPage">Coba lagi</button></div>`;$('#retryPage').onclick=renderPage;}
const requestState={pending:0,timer:null};
function requestActivity(){requestState.pending++;if(!requestState.timer)requestState.timer=setTimeout(()=>{$('.workspace')?.classList.add('network-busy');},120);let stopped=false;return()=>{if(stopped)return;stopped=true;requestState.pending--;if(!requestState.pending){clearTimeout(requestState.timer);requestState.timer=null;$('.workspace')?.classList.remove('network-busy');}};}
function syncWorkspaceStatus(){
  const button=$('#notificationBtn');if(!button||!state.dashboard)return;const count=state.notifications?.activeTasks??state.dashboard.pending,unread=state.notifications?.unread;
  button.setAttribute('aria-label',unread===undefined?'Notifikasi belum dapat dimuat':`Notifikasi, ${unread} belum dibaca; ${count} tugas aktif`);
  const dot=button.querySelector('.ws-notification-dot');if(unread&&!dot)button.insertAdjacentHTML('beforeend','<i class="ws-notification-dot"></i>');else if(!unread)dot?.remove();
  const nav=document.querySelector('[data-page="dispositions"]');if(nav){nav.querySelector('.nav-badge')?.remove();if(count)nav.insertAdjacentHTML('beforeend',`<small class="nav-badge">${count}</small>`);}
}
const notificationsUI=createNotifications({api,esc,icon,toast,onUpdate:result=>{state.notifications=result;syncWorkspaceStatus();},onOpenTask:openDispositionTimeline,onTaskList:()=>document.querySelector('[data-page="dispositions"]')?.click()});
function closeNotifications(restore=true){notificationsUI.close(restore);}
function toggleNotifications(){return notificationsUI.toggle();}
const enhancedForms=new WeakSet();
new MutationObserver(()=>{
  document.querySelectorAll('.workspace form').forEach(form=>{
    if(enhancedForms.has(form)||!form.onsubmit||form.dataset.managedSubmit==='true')return;enhancedForms.add(form);const handler=form.onsubmit;
    form.onsubmit=async function(event){event.preventDefault();if(form.dataset.submitting)return;form.dataset.submitting='true';form.setAttribute('aria-busy','true');const button=event.submitter||form.querySelector('button:not([type="button"])');const original=button?.innerHTML;if(button){button.disabled=true;button.innerHTML='<i class="ws-spinner"></i> Menyimpan…';}try{await handler.call(form,event);}finally{delete form.dataset.submitting;form.setAttribute('aria-busy','false');if(button){button.disabled=false;button.innerHTML=original;}}};
  });
  const back=$('#modalBack');if(back&&!back.dataset.enhanced){back.dataset.enhanced='true';const dialog=back.querySelector('.modal');if(dialog){back._restoreFocus=document.activeElement;if(!dialog.hasAttribute('role')){dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('tabindex','-1');const heading=dialog.querySelector('h3');if(heading){heading.id='workspaceDialogTitle';dialog.setAttribute('aria-labelledby',heading.id);}}dialog.focus();back.addEventListener('keydown',event=>{if(event.key==='Escape'&&!back.querySelector('[data-submitting]'))closeModal();if(event.key==='Tab'){const items=[...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(el=>el.getClientRects().length);const first=items[0],last=items.at(-1);if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});}}
}).observe(app,{childList:true,subtree:true});
async function start() { try{const config=await api('/api/config');state.demoMode=config.demoMode;}catch{state.demoMode=false;}try { await loadApp(); } catch { publicView(); } }
start();
