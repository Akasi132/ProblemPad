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
  } catch{
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

async function saveReports(list){
  try{
    const res = await fetch('/api/reports', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(list)
    });
    if(!res.ok) throw new Error('api error');
  } catch{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}

async function deleteReportById(id){
  const list = await fetchReports();
  const filtered = list.filter(x=>x.id !== id);
  await saveReports(filtered);
}

function escapeHtml(text){
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function render(){
  const list = await fetchReports();
  if(list.length === 0){
    reportsList.innerHTML = '<li style="color:#9aa4b2;">No saved reports yet.</li>';
    return;
  }
  reportsList.innerHTML = list.map(r=>`
    <li>
      <div>
        <div class="small">${escapeHtml(r.title || '(Untitled)')}</div>
        <div class="meta">Impact: ${r.impact}/10 &nbsp;|&nbsp; ${new Date(r.created).toLocaleDateString()}</div>
      </div>
      <button class="delete-btn" data-id="${r.id}">Delete</button>
    </li>
  `).join('');
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const blocks = Array.from(document.querySelectorAll('.problem-block'));
  const now = nowISO();
  const list = await fetchReports();
  blocks.forEach((block,i)=>{
    const titleEl = block.querySelector('.title');
    const descEl = block.querySelector('.description');
    const impactEl = block.querySelector('.impact');
    const solEl = block.querySelector('.solution');
    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    if(!title && !description) return;
    const report = {
      id: now + '-' + i,
      title,
      description,
      impact: Number(impactEl.value),
      solution: solEl.value.trim(),
      created: now
    };
    list.push(report);
    titleEl.value = '';
    descEl.value = '';
    impactEl.value = '5';
    solEl.value = '';
  });
  await saveReports(list);
  await render();
  alert('Problems saved!');
});

clearBtn.addEventListener('click', async ()=>{
  if(!confirm('Clear all saved reports?')) return;
  await saveReports([]);
  await render();
});

reportsList.addEventListener('click', async (e)=>{
  if(!e.target.classList.contains('delete-btn')) return;
  const btn = e.target;
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