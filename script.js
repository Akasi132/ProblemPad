// Tab functionality
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Show the startup tab by default
  showTab('startup');
  
  // Add event listeners to tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const tabName = e.target.getAttribute('data-tab');
      showTab(tabName);
    });
  });
  
  function showTab(tabName) {
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button and corresponding content
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeButton && activeContent) {
      activeButton.classList.add('active');
      activeContent.classList.add('active');
    }
  }
}

// Update startup summary in the Saved Report tab
function updateStartupSummary() {
  const startupName = document.getElementById('startup-name').value.trim() || 'ProblemPad';
  const startupDesc = document.getElementById('startup-desc').value.trim();
  const startupIndustry = document.getElementById('startup-industry').value.trim();
  const startupMarket = document.getElementById('startup-market').value.trim();
  const startupFounded = document.getElementById('startup-founded').value;
  
  const summaryContent = document.getElementById('startup-summary-content');
  summaryContent.innerHTML = `
    <p><strong>Name:</strong> ${escapeHtml(startupName)}</p>
    ${startupDesc ? `<p><strong>Description:</strong> ${escapeHtml(startupDesc)}</p>` : ''}
    ${startupIndustry ? `<p><strong>Industry:</strong> ${escapeHtml(startupIndustry)}</p>` : ''}
    ${startupMarket ? `<p><strong>Target Market:</strong> ${escapeHtml(startupMarket)}</p>` : ''}
    ${startupFounded ? `<p><strong>Founded:</strong> ${new Date(startupFounded).toLocaleDateString()}</p>` : ''}
  `;
}

// Update problems summary in the Saved Report tab
function updateProblemsSummary() {
  const blocks = Array.from(document.querySelectorAll('.problem-block'));
  const summaryContent = document.getElementById('problems-summary-content');
  
  let problemsHtml = '';
  let problemCount = 0;
  
  blocks.forEach((block, index) => {
    const titleEl = block.querySelector('.title');
    const descEl = block.querySelector('.description');
    const impactEl = block.querySelector('.impact');
    const solEl = block.querySelector('.solution');
    
    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    
    if (title || description) {
      problemCount++;
      problemsHtml += `
        <div class="problem-summary">
          <h4>Problem ${index + 1}: ${escapeHtml(title) || 'Untitled'}</h4>
          ${description ? `<p><strong>Description:</strong> ${escapeHtml(description)}</p>` : ''}
          <p><strong>Impact Score:</strong> ${impactEl.value}/10</p>
          ${solEl.value.trim() ? `<p><strong>Solution:</strong> ${escapeHtml(solEl.value.trim())}</p>` : ''}
        </div>
      `;
    }
  });
  
  if (problemCount === 0) {
    summaryContent.innerHTML = '<p>No problems have been defined yet.</p>';
  } else {
    summaryContent.innerHTML = problemsHtml;
  }
}

// Add event listeners to update summaries when fields change
function addSummaryUpdateListeners() {
  // Startup fields
  const startupFields = ['startup-name', 'startup-desc', 'startup-industry', 'startup-market', 'startup-founded'];
  startupFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', updateStartupSummary);
      field.addEventListener('change', updateStartupSummary);
    }
  });
  
  // Problem fields
  const problemFields = document.querySelectorAll('.problem-block input, .problem-block textarea');
  problemFields.forEach(field => {
    field.addEventListener('input', updateProblemsSummary);
    field.addEventListener('change', updateProblemsSummary);
  });
}

// Original code with modifications
const form = document.getElementById('problem-form');
const reportsList = document.getElementById('reports');
const clearBtn = document.getElementById('clear');
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
    left.innerHTML = `${escapeHtml(r.title)}<div class="meta">${escapeHtml(r.description)}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div class="meta">${r.impact || r.severity} · ${new Date(r.created).toLocaleString()}</div><button data-id="${r.id}">Open</button>`;
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
  const startupIndustry = document.getElementById('startup-industry').value.trim() || '';
  const startupMarket = document.getElementById('startup-market').value.trim() || '';
  const startupFounded = document.getElementById('startup-founded').value || '';
  
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
      startup_industry: startupIndustry,
      startup_market: startupMarket,
      startup_founded: startupFounded,
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
  // Reset startup form as well
  document.getElementById('startup-name').value = 'ProblemPad';
  document.getElementById('startup-desc').value = 'Helping people discover, prioritize and solve real problems; focus on user acquisition by solving high-impact issues quickly.';
  await render();
  // Update summaries after reset
  updateStartupSummary();
  updateProblemsSummary();
  // Switch to saved report tab to show results
  showTab('saved-report');
  
  function showTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeButton && activeContent) {
      activeButton.classList.add('active');
      activeContent.classList.add('active');
    }
  }
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
  const text = `Title: ${r.title}\nImpact: ${r.impact}\nCreated: ${new Date(r.created).toLocaleString()}\n\nDescription:\n${r.description}\n\nSolution:\n${r.solution || '(none)'}\n\nDelete this report?`;
  if(confirm(text)){
    await deleteReportById(id);
    await render();
  }
});

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  addSummaryUpdateListeners();
  updateStartupSummary();
  updateProblemsSummary();
  render();
});

// Also run initialization immediately in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
  // Do nothing, wait for DOMContentLoaded
} else {
  // DOM is already loaded
  initializeTabs();
  addSummaryUpdateListeners();
  updateStartupSummary();
  updateProblemsSummary();
  render();
}
