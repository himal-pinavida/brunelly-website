// ════════════════════════════════════════════════════════════════
// BRUNELLY CMS — Supabase Backend
// ════════════════════════════════════════════════════════════════

var SUPA_URL = 'https://frznrjgbbkfvjrxjcaho.supabase.co';
var SUPA_KEY = 'sb_publishable_Dwq-UtleJ8vEKYDpCV4TuQ_GneAVjTD';

// ── Auth ──────────────────────────────────────────────────────────
var PASS = 'brunelly2026';
function doLogin() {
  if (document.getElementById('pw-input').value === PASS) {
    sessionStorage.setItem('cms_auth','1');
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='block';
    init();
  } else {
    document.getElementById('login-err').style.display='block';
    document.getElementById('pw-input').value='';
  }
}
function logout() { sessionStorage.removeItem('cms_auth'); location.reload(); }
if (sessionStorage.getItem('cms_auth')==='1') {
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='block';
}

// ── Supabase helpers ──────────────────────────────────────────────
function sbHeaders(extra) {
  var h = {
    'Content-Type': 'application/json',
    'apikey': SUPA_KEY,
    'Authorization': 'Bearer ' + SUPA_KEY,
  };
  if (extra) Object.assign(h, extra);
  return h;
}

function sbGet(table, params) {
  var url = SUPA_URL + '/rest/v1/' + table + '?order=created_at.asc';
  if (params) url += '&' + params;
  return fetch(url, { method:'GET', headers: sbHeaders() }).then(function(r){ return r.json(); });
}

function sbUpsert(table, data) {
  return fetch(SUPA_URL + '/rest/v1/' + table, {
    method: 'POST',
    headers: sbHeaders({'Prefer':'resolution=merge-duplicates,return=representation'}),
    body: JSON.stringify(data)
  }).then(function(r){ return r.json(); });
}

function sbUpdate(table, id, data) {
  return fetch(SUPA_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: sbHeaders({'Prefer':'return=representation'}),
    body: JSON.stringify(data)
  }).then(function(r){ return r.json(); });
}

function sbDelete(table, id) {
  return fetch(SUPA_URL + '/rest/v1/' + table + '?id=eq.' + encodeURIComponent(id), {
    method: 'DELETE',
    headers: sbHeaders()
  });
}

// ── Tabs ──────────────────────────────────────────────────────────
var currentTab = 'articles';
function switchTab(t) {
  currentTab = t;
  ['articles','videos','usecases','images','faqs','leads'].forEach(function(id) {
    document.getElementById('view-'+id).style.display = id===t ? 'block' : 'none';
    document.getElementById('tab-'+id).classList.toggle('active', id===t);
  });
  document.getElementById('view-form').style.display = 'none';
  document.getElementById('view-faq-form').style.display = 'none';
  var labels = {'articles':'+ Add Article','videos':'+ Add Video','usecases':'+ Add Use Case','images':'Feature Images','faqs':'FAQs','leads':'Leads'};
  document.getElementById('add-btn').textContent = labels[t] || '+';
  document.getElementById('add-btn').style.display = (t==='images'||t==='faqs'||t==='leads') ? 'none' : 'inline-flex';
  render();
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStats() {
  Promise.all([
    sbGet('articles','select=id'),
    sbGet('videos','select=id,published,youtube_id'),
    sbGet('use_cases','select=id,published'),
    sbGet('feature_images','select=id,image_url'),
    sbGet('hero_images','select=id,image_url'),
  ]).then(function(results) {
    var arts  = Array.isArray(results[0]) ? results[0] : [];
    var vids  = Array.isArray(results[1]) ? results[1] : [];
    var ucs   = Array.isArray(results[2]) ? results[2] : [];
    var fimgs = Array.isArray(results[3]) ? results[3] : [];
    var himgs = Array.isArray(results[4]) ? results[4] : [];
    var s = document.getElementById.bind(document);
    s('s-articles').textContent = arts.length;
    s('s-videos-live').textContent = vids.filter(function(v){return v.published&&v.youtube_id;}).length;
    s('s-videos-soon').textContent = vids.filter(function(v){return !v.published||!v.youtube_id;}).length;
    s('s-uc-live').textContent = ucs.filter(function(u){return u.published;}).length;
    s('s-uc-hidden').textContent = ucs.filter(function(u){return !u.published;}).length;
    var imgCount = fimgs.filter(function(i){return i.image_url;}).length + himgs.filter(function(i){return i.image_url;}).length;
    s('s-images').textContent = imgCount + '/' + (fimgs.length + himgs.length);
  }).catch(function(e){ console.error('Stats error:', e); });
}

// ── Category colours ──────────────────────────────────────────────
var CC  = {'AI':'#a78bfa','Agile':'#60a5fa','ChatGPT & AI Orchestration':'#fb923c','Behind the Build':'#4ade80'};
var CB  = {'AI':'rgba(167,139,250,.4)','Agile':'rgba(96,165,250,.3)','ChatGPT & AI Orchestration':'rgba(251,146,60,.3)','Behind the Build':'rgba(74,222,128,.3)'};
var CBG = {'AI':'rgba(167,139,250,.12)','Agile':'rgba(96,165,250,.1)','ChatGPT & AI Orchestration':'rgba(251,146,60,.1)','Behind the Build':'rgba(74,222,128,.1)'};

// ── Render tables ─────────────────────────────────────────────────
function renderArticles() {
  sbGet('articles').then(function(arts) {
    if (!Array.isArray(arts)) { arts = []; }
    document.getElementById('art-count').textContent = '(' + arts.length + ')';
    var tbody = document.getElementById('articles-tbody');
    tbody.innerHTML = arts.length
      ? arts.map(function(a,i) {
          return '<tr>'
            + '<td>' + (a.image ? '<img src="'+a.image+'" class="preview-thumb" onerror="this.style.display=\'none\'">' : '<div class="preview-ph">No img</div>') + '</td>'
            + '<td class="td-title" style="max-width:260px;">' + a.title + '<br><a href="'+(a.url||'#')+'" target="_blank" style="font-family:\'DM Mono\',monospace;font-size:.65rem;color:var(--accent);text-decoration:none;">&#8599; view</a></td>'
            + '<td><span class="tag-pill" style="color:'+(CC[a.category]||'#a78bfa')+';border-color:'+(CB[a.category]||'rgba(167,139,250,.4)')+';background:'+(CBG[a.category]||'rgba(167,139,250,.12)')+';font-size:.58rem;">' + (a.category||'') + '</span></td>'
            + '<td style="font-family:\'DM Mono\',monospace;font-size:.7rem;">' + (a.date||'&mdash;') + '</td>'
            + '<td class="td-actions"><button class="btn btn-ghost" onclick="editItem(\'articles\',' + i + ',\'' + JSON.stringify(arts).replace(/"/g,'&quot;') + '\')">Edit</button><button class="btn btn-danger" onclick="deleteItem(\'articles\',\'' + a.id + '\')">Delete</button></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="5" class="empty-state">No articles yet. Click "+ Add Article" to create your first.</td></tr>';
    updateStats();
  });
}

function renderVideos() {
  sbGet('videos').then(function(vids) {
    if (!Array.isArray(vids)) vids = [];
    document.getElementById('vid-count').textContent = '(' + vids.length + ')';
    var tbody = document.getElementById('videos-tbody');
    tbody.innerHTML = vids.length
      ? vids.map(function(v,i) {
          var thumb = v.youtube_id ? 'https://img.youtube.com/vi/'+v.youtube_id+'/default.jpg' : '';
          return '<tr>'
            + '<td>' + (thumb ? '<img src="'+thumb+'" class="preview-thumb">' : '<div class="preview-ph">No YT</div>') + '</td>'
            + '<td class="td-title">' + v.title + '</td>'
            + '<td style="font-family:\'DM Mono\',monospace;font-size:.65rem;color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (v.youtube_url||'&mdash;') + '</td>'
            + '<td><span class="published-badge '+(v.published&&v.youtube_id?'pub-yes':'pub-no')+'">'+(v.published&&v.youtube_id?'&#9679; Live':'&#9675; Coming soon')+'</span></td>'
            + '<td class="td-actions"><button class="btn btn-ghost" onclick="editItem(\'videos\',' + i + ',\'' + JSON.stringify(vids).replace(/"/g,'&quot;') + '\')">Edit</button><button class="btn btn-danger" onclick="deleteItem(\'videos\',\'' + v.id + '\')">Delete</button></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="5" class="empty-state">No videos yet.</td></tr>';
    updateStats();
  });
}

function renderUseCases() {
  sbGet('use_cases','order=sort_order.asc').then(function(ucs) {
    if (!Array.isArray(ucs)) ucs = [];
    var tbody = document.getElementById('uc-tbody');
    tbody.innerHTML = ucs.length
      ? ucs.map(function(uc,i) {
          return '<tr>'
            + '<td><div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:'+(uc.icon_bg||'var(--accent-dim)')+';color:'+(uc.icon_color||'var(--accent)')+';border:1px solid var(--border);">'+(uc.icon||'◈')+'</div></td>'
            + '<td class="td-title" style="max-width:340px;">' + uc.title + '</td>'
            + '<td><span class="published-badge '+(uc.published?'pub-yes':'pub-no')+'">'+(uc.published?'&#9679; Published':'&#9675; Hidden')+'</span>'
            + '<label class="toggle" style="margin-left:.8rem;vertical-align:middle;"><input type="checkbox" '+(uc.published?'checked':'')+' onchange="toggleUC(\''+uc.id+'\',this.checked)"><div class="toggle-track"></div><div class="toggle-thumb"></div></label></td>'
            + '<td class="td-actions"><button class="btn btn-ghost" onclick="editItem(\'usecases\',' + i + ',\'' + JSON.stringify(ucs).replace(/"/g,'&quot;') + '\')">Edit</button><button class="btn btn-danger" onclick="deleteItem(\'use_cases\',\'' + uc.id + '\')">Delete</button></td>'
            + '</tr>';
        }).join('')
      : '<tr><td colspan="4" class="empty-state">No use cases yet.</td></tr>';
    updateStats();
  });
}

function toggleUC(id, val) {
  sbUpdate('use_cases', id, {published: val, updated_at: new Date().toISOString()})
    .then(function(){ renderUseCases(); showToast(val ? 'Use case published' : 'Use case hidden', 'success'); });
}

function render() {
  if (currentTab==='articles')  renderArticles();
  else if (currentTab==='videos')    renderVideos();
  else if (currentTab==='usecases')  renderUseCases();
  else if (currentTab==='images')    { renderHeroImages(); renderImages(); }
  else if (currentTab==='faqs')      { renderFaqs(); document.getElementById('view-faq-form').style.display='none'; }
  else if (currentTab==='leads')     renderLeads();
}

// ── Form ──────────────────────────────────────────────────────────
var _currentItems = [];

function showAdd() {
  document.getElementById('form-idx').value = '';
  document.getElementById('form-type').value = currentTab==='usecases'?'uc':currentTab==='videos'?'video':'article';
  var labels = {'articles':'Add New Article','videos':'Add New Video','usecases':'Add New Use Case'};
  document.getElementById('form-heading').textContent = labels[currentTab] || 'Add New';
  resetFormFields();
  showFormView();
}

function editItem(type, idx, itemsJson) {
  var items = typeof itemsJson === 'string' ? JSON.parse(itemsJson.replace(/&quot;/g,'"')) : itemsJson;
  _currentItems = items;
  var item = items[idx];
  var t = type==='usecases'?'uc':type==='videos'?'video':'article';
  document.getElementById('form-idx').value = item.id;
  document.getElementById('form-type').value = t;
  document.getElementById('form-heading').textContent = 'Edit ' + (type==='usecases'?'Use Case':type==='videos'?'Video':'Article');
  resetFormFields();
  if (t==='article') {
    document.getElementById('f-title').value    = item.title||'';
    document.getElementById('f-excerpt').value  = item.excerpt||'';
    document.getElementById('f-category').value = item.category||'';
    document.getElementById('f-date').value      = item.date||'';
    document.getElementById('f-url').value       = item.url||'';
    document.getElementById('f-image').value     = item.image||'';
    previewImg();
  } else if (t==='video') {
    document.getElementById('fv-title').value  = item.title||'';
    document.getElementById('fv-desc').value   = item.description||'';
    document.getElementById('fv-url').value    = item.youtube_url||'';
    document.getElementById('fv-ytid').value   = item.youtube_id||'';
    document.getElementById('fv-dur').value    = item.duration||'';
    document.getElementById('fv-pub').checked  = item.published||false;
  } else {
    document.getElementById('fuc-title').value = item.title||'';
    document.getElementById('fuc-body').value  = item.body||'';
    document.getElementById('fuc-icon').value  = item.icon||'';
    document.getElementById('fuc-color').value = item.icon_color||'#a78bfa';
    document.getElementById('fuc-pub').checked = item.published||false;
  }
  showFormView();
}

function deleteItem(table, id) {
  if (!confirm('Delete this item? This cannot be undone.')) return;
  sbDelete(table, id).then(function(){ render(); showToast('Deleted', 'success'); });
}

function saveItem() {
  var t    = document.getElementById('form-type').value;
  var id   = document.getElementById('form-idx').value;
  var type = t==='uc'?'use_cases':t==='video'?'videos':'articles';
  var item, now = new Date().toISOString();

  if (t==='article') {
    var title    = document.getElementById('f-title').value.trim();
    var excerpt  = document.getElementById('f-excerpt').value.trim();
    var category = document.getElementById('f-category').value;
    var url      = document.getElementById('f-url').value.trim();
    if (!title||!excerpt||!category||!url) { showToast('Fill in all required fields','error'); return; }
    item = { id: id||'art-'+Date.now(), title:title, excerpt:excerpt, category:category,
             date:document.getElementById('f-date').value.trim(),
             url:url, image:document.getElementById('f-image').value.trim(), updated_at:now };
    if (!id) item.created_at = now;
  } else if (t==='video') {
    var vtitle = document.getElementById('fv-title').value.trim();
    if (!vtitle) { showToast('Video title is required','error'); return; }
    item = { id: id||'vid-'+Date.now(), title:vtitle,
             description:document.getElementById('fv-desc').value.trim(),
             youtube_url:document.getElementById('fv-url').value.trim(),
             youtube_id:document.getElementById('fv-ytid').value.trim(),
             duration:document.getElementById('fv-dur').value.trim(),
             published:document.getElementById('fv-pub').checked, updated_at:now };
    if (!id) item.created_at = now;
  } else {
    var uctitle = document.getElementById('fuc-title').value.trim();
    var ucbody  = document.getElementById('fuc-body').value.trim();
    if (!uctitle||!ucbody) { showToast('Title and body are required','error'); return; }
    var color = document.getElementById('fuc-color').value;
    item = { id: id||'uc-'+Date.now(), icon:document.getElementById('fuc-icon').value.trim()||'◈',
             icon_color:color, icon_bg:color+'26', title:uctitle, body:ucbody,
             published:document.getElementById('fuc-pub').checked, updated_at:now };
    if (!id) item.created_at = now;
  }

  sbUpsert(type, item).then(function(){
    showToast(id ? 'Updated successfully' : 'Added successfully', 'success');
    switchTab(currentTab);
  }).catch(function(e){ showToast('Save failed: '+e.message, 'error'); });
}

function showFormView() {
  ['articles','videos','usecases'].forEach(function(id){ document.getElementById('view-'+id).style.display='none'; });
  document.getElementById('view-form').style.display='block';
  var t = document.getElementById('form-type').value;
  document.getElementById('fields-article').style.display = t==='article' ? 'block' : 'none';
  document.getElementById('fields-video').style.display   = t==='video'   ? 'block' : 'none';
  document.getElementById('fields-uc').style.display      = t==='uc'      ? 'block' : 'none';
}

function cancelForm() { switchTab(currentTab); }

function resetFormFields() {
  ['f-title','f-excerpt','f-date','f-url','f-image','fv-title','fv-desc','fv-url','fv-ytid','fv-dur','fuc-title','fuc-body','fuc-icon'].forEach(function(id){ var el=document.getElementById(id); if(el)el.value=''; });
  var p=document.getElementById('fv-pub'); if(p)p.checked=false;
  var q=document.getElementById('fuc-pub'); if(q)q.checked=false;
  var c=document.getElementById('f-category'); if(c)c.value='';
  var pr=document.getElementById('img-prev'); if(pr)pr.style.display='none';
  var cc=document.getElementById('fuc-color'); if(cc)cc.value='#a78bfa';
}

function previewImg() {
  var url=document.getElementById('f-image').value.trim();
  var img=document.getElementById('img-prev');
  if(url){img.src=url;img.style.display='block';}else{img.style.display='none';}
}

function extractYouTubeId() {
  var url=document.getElementById('fv-url').value.trim();
  var m=url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  document.getElementById('fv-ytid').value=m?m[1]:'';
}

// ── Feature Images ────────────────────────────────────────────────
function renderImages() {
  sbGet('feature_images','order=page.asc,id.asc').then(function(slots) {
    if (!Array.isArray(slots)) slots = [];
    var grid = document.getElementById('feat-images-grid');
    if (!grid) return;
    var PAGE_LABELS = {
      'brunelly-features-understand.html':'Understand',
      'brunelly-features-plan.html':'Plan',
      'brunelly-features-build.html':'Build',
      'brunelly-features-quality.html':'Quality',
      'brunelly-features-collaborate.html':'Collaborate'
    };
    var html = '', currentPage = '';
    slots.forEach(function(s) {
      if (s.page !== currentPage) {
        currentPage = s.page;
        html += '<div style="grid-column:1/-1;background:var(--surface);padding:.8rem 1.2rem;border-bottom:1px solid var(--border);"><span style="font-family:\'DM Mono\',monospace;font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);">'+(PAGE_LABELS[s.page]||s.page)+' — Feature Page</span></div>';
      }
      var stored = s.image_url || '';
      var thumb = stored ? '<img src="'+stored+'" style="width:72px;height:48px;object-fit:cover;border-radius:5px;border:1px solid var(--border);flex-shrink:0;" onerror="this.style.opacity=0.3">'
                         : '<div style="width:72px;height:48px;border-radius:5px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--muted);flex-shrink:0;text-align:center;line-height:1.4;">No<br>image</div>';
      var badge = stored ? '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:var(--green-dim);border:1px solid rgba(74,222,128,.3);color:var(--green);">&#10003; Live</span>'
                         : '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:rgba(113,113,122,.08);border:1px solid var(--border);color:var(--muted);">Empty</span>';
      var clearBtn = stored ? '<button onclick="clearFeatImage(\''+s.id+'\')" class="btn btn-danger" style="font-size:.62rem;padding:.3rem .6rem;flex-shrink:0;">Clear</button>' : '';
      html += '<div style="background:var(--off-black);padding:1rem 1.2rem;display:flex;align-items:center;gap:1rem;border-bottom:1px solid var(--border);">'
            + thumb + '<div style="flex:1;min-width:0;">'
            + '<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.3rem;"><span style="font-size:.88rem;color:var(--white);">'+s.label+'</span>'+badge+'</div>'
            + '<div style="font-size:.74rem;color:var(--muted);margin-bottom:.5rem;">'+(s.hint||'')+'</div>'
            + '<input type="url" placeholder="Paste image URL (https://...)" value="'+stored.replace(/"/g,'&quot;')+'" data-slot="'+s.id+'" onchange="saveFeatImage(this)" class="form-input" style="font-size:.78rem;padding:.4rem .7rem;" />'
            + '</div>' + clearBtn + '</div>';
    });
    grid.innerHTML = html || '<div class="empty-state">No feature image slots found.</div>';
    updateStats();
  });
}

function saveFeatImage(input) {
  var id = input.getAttribute('data-slot');
  var url = input.value.trim();
  sbUpdate('feature_images', id, { image_url: url || null, updated_at: new Date().toISOString() })
    .then(function(){ renderImages(); showToast(url ? 'Image saved — live immediately' : 'Image cleared', 'success'); });
}

function clearFeatImage(id) {
  sbUpdate('feature_images', id, { image_url: null, updated_at: new Date().toISOString() })
    .then(function(){ renderImages(); showToast('Image cleared', 'success'); });
}

// ── Hero Images ───────────────────────────────────────────────────
function renderHeroImages() {
  sbGet('hero_images').then(function(slots) {
    if (!Array.isArray(slots)) slots = [];
    var grid = document.getElementById('hero-images-grid');
    if (!grid) return;
    var html = '';
    slots.forEach(function(s) {
      var stored = s.image_url || '';
      var thumb = stored ? '<img src="'+stored+'" style="width:72px;height:48px;object-fit:cover;border-radius:5px;border:1px solid var(--border);flex-shrink:0;" onerror="this.style.opacity=0.3">'
                         : '<div style="width:72px;height:48px;border-radius:5px;border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:.6rem;color:var(--muted);flex-shrink:0;text-align:center;line-height:1.4;">No<br>image</div>';
      var badge = stored ? '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:var(--green-dim);border:1px solid rgba(74,222,128,.3);color:var(--green);">&#10003; Live</span>'
                         : '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:rgba(113,113,122,.08);border:1px solid var(--border);color:var(--muted);">Empty</span>';
      var clearBtn = stored ? '<button onclick="clearHeroImage(\''+s.id+'\')" class="btn btn-danger" style="font-size:.62rem;padding:.3rem .6rem;flex-shrink:0;">Clear</button>' : '';
      html += '<div style="background:var(--off-black);padding:1rem 1.2rem;display:flex;align-items:center;gap:1rem;border-bottom:1px solid var(--border);">'
            + thumb + '<div style="flex:1;min-width:0;">'
            + '<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.3rem;"><span style="font-size:.88rem;color:var(--white);">'+s.label+' tab</span>'+badge+'</div>'
            + '<div style="font-size:.74rem;color:var(--muted);margin-bottom:.5rem;">'+(s.hint||'')+'</div>'
            + '<input type="url" placeholder="Paste image URL (https://...)" value="'+stored.replace(/"/g,'&quot;')+'" data-hero="'+s.id+'" onchange="saveHeroImage(this)" class="form-input" style="font-size:.78rem;padding:.4rem .7rem;" />'
            + '</div>' + clearBtn + '</div>';
    });
    grid.innerHTML = html || '<div class="empty-state">No hero image slots found.</div>';
  });
}

function saveHeroImage(input) {
  var id = input.getAttribute('data-hero');
  var url = input.value.trim();
  sbUpdate('hero_images', id, { image_url: url || null, updated_at: new Date().toISOString() })
    .then(function(){ renderHeroImages(); showToast(url ? 'Hero image saved' : 'Hero image cleared', 'success'); });
}

function clearHeroImage(id) {
  sbUpdate('hero_images', id, { image_url: null, updated_at: new Date().toISOString() })
    .then(function(){ renderHeroImages(); showToast('Hero image cleared', 'success'); });
}

// ── FAQs ──────────────────────────────────────────────────────────
function renderFaqs() {
  Promise.all([
    sbGet('faqs', 'page=eq.hub&order=sort_order.asc'),
    sbGet('faqs', 'page=eq.pricing&order=sort_order.asc')
  ]).then(function(results) {
    var hubFaqs = Array.isArray(results[0]) ? results[0] : [];
    var priceFaqs = Array.isArray(results[1]) ? results[1] : [];
    ['hub','pricing'].forEach(function(page) {
      var faqs = page==='hub' ? hubFaqs : priceFaqs;
      var tbody = document.getElementById(page+'-faq-tbody');
      if (!tbody) return;
      tbody.innerHTML = faqs.length
        ? faqs.map(function(f,i) {
            return '<tr>'
              + '<td style="font-family:\'DM Mono\',monospace;font-size:.7rem;color:var(--muted);width:32px;">'+(i+1)+'</td>'
              + '<td class="td-title" style="max-width:500px;">'+f.question+'</td>'
              + '<td class="td-actions">'
              + '<button class="btn btn-ghost" onclick="editFaqById(\''+page+'\',\''+f.id+'\',\''+f.question.replace(/'/g,"\\\'").replace(/"/g,'&quot;')+'\',\''+f.answer.replace(/'/g,"\\\'").replace(/"/g,'&quot;')+'\')">Edit</button>'
              + '<button class="btn btn-danger" onclick="deleteFaqById(\''+f.id+'\')">Delete</button>'
              + '</td></tr>';
          }).join('')
        : '<tr><td colspan="3" class="empty-state">No FAQs yet.</td></tr>';
    });
  });
}

function showFaqForm(page) {
  document.getElementById('view-faqs').style.display='none';
  document.getElementById('view-faq-form').style.display='block';
  document.getElementById('faq-form-page').value = page;
  document.getElementById('faq-form-idx').value = '';
  document.getElementById('ff-q').value = '';
  document.getElementById('ff-a').value = '';
  document.getElementById('faq-form-heading').textContent = 'Add FAQ — ' + (page==='hub'?'Features Hub':'Pricing Page');
}

function editFaqById(page, id, q, a) {
  document.getElementById('view-faqs').style.display='none';
  document.getElementById('view-faq-form').style.display='block';
  document.getElementById('faq-form-page').value = page;
  document.getElementById('faq-form-idx').value = id;
  document.getElementById('ff-q').value = q;
  document.getElementById('ff-a').value = a;
  document.getElementById('faq-form-heading').textContent = 'Edit FAQ — ' + (page==='hub'?'Features Hub':'Pricing Page');
}

function cancelFaqForm() {
  document.getElementById('view-faq-form').style.display='none';
  document.getElementById('view-faqs').style.display='block';
  renderFaqs();
}

function saveFaq() {
  var page = document.getElementById('faq-form-page').value;
  var id   = document.getElementById('faq-form-idx').value;
  var q    = document.getElementById('ff-q').value.trim();
  var a    = document.getElementById('ff-a').value.trim();
  if (!q||!a) { showToast('Question and answer are both required','error'); return; }
  var now = new Date().toISOString();
  var item = { id: id||'faq-'+Date.now(), page:page, question:q, answer:a, updated_at:now };
  if (!id) item.created_at = now;
  sbUpsert('faqs', item).then(function(){
    showToast('FAQ saved — live immediately','success');
    cancelFaqForm();
  });
}

function deleteFaqById(id) {
  if (!confirm('Delete this FAQ?')) return;
  sbDelete('faqs', id).then(function(){ renderFaqs(); showToast('FAQ deleted','success'); });
}

// ── Leads ─────────────────────────────────────────────────────────
function renderLeads() {
  document.getElementById('leads-count').textContent = '(loading...)';
  sbGet('leads', 'order=created_at.desc&limit=500').then(function(leads) {
    if (!Array.isArray(leads)) leads = [];
    document.getElementById('leads-count').textContent = '(' + leads.length + ')';
    var tbody = document.getElementById('leads-tbody');
    if (!leads.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No leads yet. Leads from the chatbot and contact form will appear here.</td></tr>';
      return;
    }
    tbody.innerHTML = leads.map(function(l) {
      var d = new Date(l.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
      var sourceBadge = l.source === 'chatbot'
        ? '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:var(--accent-dim);border:1px solid var(--accent-mid);color:var(--accent);">Chatbot</span>'
        : '<span style="font-family:\'DM Mono\',monospace;font-size:.6rem;padding:.18rem .5rem;border-radius:4px;background:rgba(96,165,250,.1);border:1px solid rgba(96,165,250,.3);color:#60a5fa;">Contact Form</span>';
      return '<tr>'
        + '<td style="color:var(--white);">' + (l.name||'&mdash;') + '</td>'
        + '<td><a href="mailto:'+l.email+'" style="color:var(--accent);text-decoration:none;">'+l.email+'</a></td>'
        + '<td>' + (l.company ? '<span style="font-size:.82rem;color:var(--light);">'+l.company+'</span>' : '<span style="color:var(--muted);">&mdash;</span>') + '</td>'
        + '<td>' + sourceBadge + '</td>'
        + '<td style="font-family:\'DM Mono\',monospace;font-size:.7rem;color:var(--muted);">' + d + '</td>'
        + '</tr>';
    }).join('');
  }).catch(function() {
    document.getElementById('leads-tbody').innerHTML = '<tr><td colspan="5" class="empty-state">Error loading leads. Check Supabase connection.</td></tr>';
  });
}

function exportLeads() {
  sbGet('leads', 'order=created_at.desc&limit=5000').then(function(leads) {
    if (!Array.isArray(leads) || !leads.length) { showToast('No leads to export','error'); return; }
    var rows = [['Name','Email','Company','Message','Source','Date']];
    leads.forEach(function(l) {
      rows.push([l.name||'', l.email||'', l.company||'', l.message||'', l.source||'', new Date(l.created_at).toISOString()]);
    });
    var csv = rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download = 'brunelly-leads-'+new Date().toISOString().slice(0,10)+'.csv';
    a.click();
    showToast('Exported '+leads.length+' leads','success');
  });
}

function clearLeads() {
  if (!confirm('This will delete all leads from Supabase. This cannot be undone.')) return;
  fetch(SUPA_URL + '/rest/v1/leads?id=gt.0', {
    method: 'DELETE',
    headers: sbHeaders()
  }).then(function(){ renderLeads(); showToast('All leads cleared','success'); });
}

// ── Export/Import ─────────────────────────────────────────────────
function triggerImport(type) { document.getElementById('import-'+type).click(); }

function exportData(type) {
  var table = type==='articles'?'articles':type==='videos'?'videos':'use_cases';
  sbGet(table).then(function(data) {
    var a = document.createElement('a');
    a.href = 'data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));
    a.download = 'brunelly-'+type+'-'+new Date().toISOString().slice(0,10)+'.json';
    a.click();
    showToast('Exported','success');
  });
}

function importData(event, type) {
  var file = event.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      var table = type==='articles'?'articles':type==='videos'?'videos':'use_cases';
      sbUpsert(table, data).then(function(){
        render();
        showToast('Imported '+data.length+' items','success');
      });
    } catch(err) { showToast('Invalid JSON file','error'); }
  };
  reader.readAsText(file);
  event.target.value='';
}

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, type) {
  type = type || 'success';
  var el = document.getElementById('toast');
  el.textContent = (type==='success'?'✓ ':'✕ ')+msg;
  el.className = 'toast '+type;
  el.style.display = 'flex';
  setTimeout(function(){ el.style.display='none'; }, 3000);
}

// ── Seed initial data into Supabase ──────────────────────────────
function seedIfEmpty() {
  sbGet('articles','select=id&limit=1').then(function(rows) {
    if (Array.isArray(rows) && rows.length === 0) {
      console.log('Seeding articles...');
      var seed = window.ARTICLES_SEED || [];
      if (seed.length > 0) {
        sbUpsert('articles', seed).then(function(){ console.log('Articles seeded'); render(); });
      }
    }
  });

  sbGet('videos','select=id&limit=1').then(function(rows) {
    if (Array.isArray(rows) && rows.length === 0) {
      var seed = window.VIDEOS_SEED || [];
      if (seed.length > 0) sbUpsert('videos', seed).then(function(){ console.log('Videos seeded'); });
    }
  });

  sbGet('use_cases','select=id&limit=1').then(function(rows) {
    if (Array.isArray(rows) && rows.length === 0) {
      var seed = window.UC_SEED || [];
      if (seed.length > 0) sbUpsert('use_cases', seed).then(function(){ console.log('Use cases seeded'); });
    }
  });

  sbGet('faqs','select=id&limit=1').then(function(rows) {
    if (Array.isArray(rows) && rows.length === 0) {
      var seed = window.FAQS_SEED || [];
      if (seed.length > 0) sbUpsert('faqs', seed).then(function(){ console.log('FAQs seeded'); });
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────
function init() {
  seedIfEmpty();
  render();
  updateStats();
}

if (sessionStorage.getItem('cms_auth')==='1') init();
