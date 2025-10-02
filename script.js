const form = document.getElementById('problem-form');
const reportsList = document.getElementById('reports');
const clearBtn = document.getElementById('clear');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');


const STORAGE_KEY = 'problem_reports_v1';

function nowISO(){ return new Date().toISOString(); }

async function fetchReports(){
  try{
    const res = await fetch('/api/reports');
    if(!res.ok) throw new Error('api error');
    return await res.json();
  }catch(e){
    // fallback to localStorage
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(_){return []}
  }
}

async function postReport(data){
  try{
    const res = await fetch('/api/reports', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(data)});
    if(!res.ok) throw new Error('post failed');
    return true;
  }catch(e){
    // fallback: store locally
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    list.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return false;
  }
}

async function deleteReportById(id){
  try{
    const res = await fetch('/api/reports/'+encodeURIComponent(id), {method:'DELETE'});
    if(!res.ok) throw new Error('delete failed');
    return true;
  }catch(e){
    // fallback to local
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const remaining = list.filter(x=>x.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    return false;
  }
}

async function render(){
  const list = await fetchReports();
  reportsList.innerHTML = '';
  if(list.length === 0){
    reportsList.innerHTML = '<li class="small">No saved reports yet.</li>';
    return;
  }

  list.forEach((r, idx)=>{
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(r.title)}</strong><div class="meta">${escapeHtml(r.description)}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div class="meta">${r.severity} · ${new Date(r.created).toLocaleString()}</div><button data-id="${r.id}">Open</button>`;
    li.appendChild(left);
    li.appendChild(right);
    reportsList.appendChild(li);
  });
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
  })[c]);
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  // collect startup metadata
  const startupName = document.getElementById('startup-name').value.trim() || 'ProblemPad';
  const startupDesc = document.getElementById('startup-desc').value.trim() || '';

  // collect up to 3 problem blocks
  const blocks = Array.from(document.querySelectorAll('.problem-block'));
  const payloads = [];
  for(const block of blocks){
    const titleEl = block.querySelector('.title');
    const descEl = block.querySelector('.description');
    const impactEl = block.querySelector('.impact');
    const solEl = block.querySelector('.solution');
    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    if(!title && !description) continue; // skip empty
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    payloads.push({
      id,
      startup: startupName,
      startup_desc: startupDesc,
      title,
      description,
      impact: Number(impactEl.value) || 5,
      solution: solEl.value.trim(),
      created: nowISO()
    });
  }
  if(payloads.length === 0){ alert('Please fill at least one problem'); return; }

  // send each payload (backend will append to Excel)
  for(const p of payloads){ await postReport(p); }
  form.reset();
  await render();
});

clearBtn.addEventListener('click', ()=>{
  if(!confirm('Clear all saved reports?')) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
});

reportsList.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button[data-id]');
  if(!btn) return;
  const id = btn.getAttribute('data-id');
  const list = await fetchReports();
  const r = list.find(x=>x.id === id);
  if(!r) return alert('Report not found');

  const text = `Title: ${r.title}\nSeverity: ${r.severity}\nCreated: ${new Date(r.created).toLocaleString()}\n\nDescription:\n${r.description}\n\nSolution:\n${r.solution || '(none)'}\n\nDelete this report?`;
  if(confirm(text)){
    await deleteReportById(id);
    await render();
  }
});

// initial render
render();

// Tab switching functionality
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all buttons and content
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button
    btn.classList.add('active');
    
    // Show corresponding content
    const tabId = btn.getAttribute('data-tab');
    const tabContent = document.getElementById(`${tabId}-tab`);
    tabContent.classList.add('active');
  });
});
