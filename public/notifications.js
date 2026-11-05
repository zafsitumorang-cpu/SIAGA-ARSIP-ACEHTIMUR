const notificationDate=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleDateString('id-ID',{day:'numeric',month:'short'}):'Waktu tidak dicatat';
export function createNotifications({api,esc,icon,onUpdate,onOpenTask,onTaskList,toast}){
  let panel,controller,page=1;
  const button=()=>document.querySelector('#notificationBtn');
  function close(restore=true){if(!panel)return;controller?.abort();panel.remove();panel=null;button()?.setAttribute('aria-expanded','false');if(restore)button()?.focus();}
  async function toggle(){
    if(panel){close();return;}
    const shell=document.querySelector('.workspace');if(!shell||!button())return;
    const current=document.createElement('section');panel=current;page=1;current.id='notificationPanel';current.className='ws-notification-panel';current.setAttribute('role','dialog');current.setAttribute('aria-labelledby','notificationTitle');button().setAttribute('aria-expanded','true');
    current.innerHTML=`<div class="ws-notification-head"><div><h2 id="notificationTitle">Notifikasi disposisi</h2><span id="notificationCounts">Memuat jumlah…</span></div><button class="ws-icon-button" id="closeNotifications" aria-label="Tutup notifikasi">${icon('close')}</button></div><div class="notification-toolbar"><button class="btn btn-soft" id="readAllNotifications" disabled>Tandai semua dibaca</button><button class="btn btn-soft" id="refreshNotifications">Perbarui</button></div><p class="archive-edit-error" id="notificationError" role="alert" hidden></p><div id="notificationList" aria-busy="true"><div class="ws-notification-loading" role="status"><i class="ws-spinner"></i>Memuat notifikasi…</div></div><button class="ws-notification-all" id="allNotifications">Buka daftar disposisi ${icon('arrow')}</button>`;
    shell.append(current);current.querySelector('#closeNotifications').onclick=()=>close();current.querySelector('#allNotifications').onclick=()=>{close(false);onTaskList();};current.querySelector('#closeNotifications').focus();
    controller=new AbortController();const {signal}=controller;
    document.addEventListener('pointerdown',event=>{if(!current.contains(event.target)&&!button()?.contains(event.target))close(false);},{signal});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'&&current.contains(document.activeElement)){const focusable=[...current.querySelectorAll('button:not(:disabled),a[href]')].filter(element=>element.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}},{signal});
    let busy=false;const disabledStates=new Map();
    const active=()=>panel===current&&current.isConnected;
    const error=failure=>{const message=current.querySelector('#notificationError');message.hidden=false;message.textContent=failure.message;};
    function lock(value){busy=value;current.querySelector('#notificationList').setAttribute('aria-busy',String(value));for(const control of current.querySelectorAll('button:not(#closeNotifications)')){if(value){disabledStates.set(control,control.disabled);control.disabled=true;}else control.disabled=disabledStates.get(control)??false;}if(!value)disabledStates.clear();}
    function paint(result){
      page=result.page;onUpdate(result);current.querySelector('#notificationCounts').textContent=`${result.unread} belum dibaca · ${result.activeTasks} tugas aktif`;
      const list=current.querySelector('#notificationList');
      list.innerHTML=result.items.length?`<ul>${result.items.map(item=>`<li data-notification="${esc(item.id)}" class="${item.read?'is-read':'is-unread'}"><span class="ws-notification-icon">${icon('disposition')}</span><div><button class="notification-open" data-id="${esc(item.id)}"><b>${esc(item.text)}</b><span>${esc(item.subject||'')}</span></button><small>${item.read?'Sudah dibaca':'Belum dibaca'} · ${esc(notificationDate(item.createdAt))}${item.byName?' · '+esc(item.byName):''}</small><small>Status tugas saat ini: ${esc(item.taskStatus)}</small><button class="notification-read" data-id="${esc(item.id)}">${item.read?'Tandai belum dibaca':'Tandai dibaca'}</button></div></li>`).join('')}</ul><div class="notification-pagination"><button class="btn btn-soft" id="previousNotifications" ${page<=1?'disabled':''}>Sebelumnya</button><span>${page}/${result.pages}</span><button class="btn btn-soft" id="nextNotifications" ${page>=result.pages?'disabled':''}>Berikutnya</button></div>`:`<div class="ws-notification-empty">${icon('bell')}<b>Belum ada notifikasi</b><p>Penugasan dan pembaruan oleh pengguna lain dalam cakupan tugas Anda akan tampil di sini.</p></div>`;
      current.querySelector('#readAllNotifications').disabled=result.unread===0;
      current.querySelector('#previousNotifications')?.addEventListener('click',()=>load(page-1));current.querySelector('#nextNotifications')?.addEventListener('click',()=>load(page+1));
      for(const control of current.querySelectorAll('.notification-read'))control.onclick=()=>{
        const item=result.items.find(item=>item.id===control.dataset.id);mutate(`/api/notifications/${encodeURIComponent(item.id)}/read?page=${page}`,'PATCH',{read:!item.read},item.id);
      };
      for(const control of current.querySelectorAll('.notification-open'))control.onclick=async()=>{
        if(busy)return;const item=result.items.find(item=>item.id===control.dataset.id);lock(true);
        if(!item.read)try{const updated=await api(`/api/notifications/${encodeURIComponent(item.id)}/read?page=${page}`,{method:'PATCH',body:JSON.stringify({read:true})});onUpdate(updated);}catch(failure){toast(failure.message,'error');}
        if(!active())return;close(false);onOpenTask(item.archiveId,item.dispositionId);
      };
    }
    async function load(target=page){
      if(busy||!active())return;lock(true);current.querySelector('#notificationError').hidden=true;
      try{const result=await api('/api/notifications?page='+target);if(active()){lock(false);paint(result);}}
      catch(failure){if(active()){lock(false);error(failure);current.querySelector('#notificationList').innerHTML='<div class="ws-notification-empty">Notifikasi belum dapat dimuat.<button type="button" class="btn btn-soft" id="retryNotifications">Coba lagi</button></div>';current.querySelector('#retryNotifications').onclick=()=>load(page);current.querySelector('#readAllNotifications').disabled=true;}}
    }
    async function mutate(url,method,body,focusId){
      if(busy||!active())return;lock(true);current.querySelector('#notificationError').hidden=true;
      try{const result=await api(url,{method,body:JSON.stringify(body)});if(active()){lock(false);paint(result);if(focusId)[...current.querySelectorAll('.notification-read')].find(control=>control.dataset.id===focusId)?.focus();}}
      catch(failure){if(active()){lock(false);error(failure);}}
    }
    current.querySelector('#refreshNotifications').onclick=()=>load(page);current.querySelector('#readAllNotifications').onclick=()=>mutate('/api/notifications/read-all?page='+page,'POST',{});
    await load();
  }
  return {toggle,close};
}
