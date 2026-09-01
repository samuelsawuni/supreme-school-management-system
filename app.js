const { createClient } = window.supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);

const app = document.querySelector('#app');
const title = document.querySelector('#page-title');
const loading = document.querySelector('#loading');
let cache = { students: [], payments: [], attendance: [], teachers: [], classes: [] };
let currentPage = 'dashboard';

const money = n => 'GH₵ ' + Number(n || 0).toLocaleString('en-GH', {minimumFractionDigits:2, maximumFractionDigits:2});
const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
function setLoading(v){ loading.classList.toggle('hidden', !v); }
function showError(message){ app.innerHTML = `<div class="panel"><div class="alert">${esc(message)}</div><p>Check that your Supabase tables and Row Level Security policies match the SQL setup for this project.</p></div>`; }

async function loadData(){
  setLoading(true);
  const queries = await Promise.allSettled([
    db.from('students').select('*').order('created_at',{ascending:false}),
    db.from('payments').select('*').order('payment_date',{ascending:false}).limit(100),
    db.from('attendance').select('*').order('attendance_date',{ascending:false}).limit(500),
    db.from('teachers').select('*').order('name'),
    db.from('classes').select('*').order('name')
  ]);
  const names=['students','payments','attendance','teachers','classes'];
  queries.forEach((r,i)=>{ if(r.status==='fulfilled' && !r.value.error) cache[names[i]]=r.value.data || []; });
  const failed = queries.find(r=>r.status==='fulfilled' && r.value.error);
  setLoading(false);
  if(failed) console.warn('Supabase query warning:', failed.value.error);
}

function studentName(id){ const s=cache.students.find(x=>String(x.id)===String(id)); return s?.name || id || 'Unknown'; }
function className(id){ const c=cache.classes.find(x=>String(x.id)===String(id)); return c?.name || id || ''; }
function teacherName(id){ const t=cache.teachers.find(x=>String(x.id)===String(id)); return t?.name || id || ''; }
function studentFees(s){ return Number(s.total_fees ?? s.fees ?? 0); }
function studentPaid(s){ return Number(s.total_paid ?? s.paid ?? 0); }
function studentBalance(s){ return Math.max(0, studentFees(s)-studentPaid(s)); }

function dashboard(){
  const totalFees=cache.students.reduce((a,s)=>a+studentFees(s),0);
  const totalPaid=cache.students.reduce((a,s)=>a+studentPaid(s),0);
  const records=cache.attendance.filter(a=>String(a.attendance_date||a.date||'').slice(0,10)===today());
  const present=records.filter(a=>String(a.status).toLowerCase()==='present').length;
  const late=records.filter(a=>String(a.status).toLowerCase()==='late').length;
  const absent=records.filter(a=>String(a.status).toLowerCase()==='absent').length;
  const pct=totalFees?Math.min(100,totalPaid/totalFees*100):0;
  return `<div class="cards">
    <div class="card"><div class="label">Total Students</div><div class="amount">${cache.students.length}</div><div class="trend">Live from Supabase</div></div>
    <div class="card"><div class="label">Total Fees Expected</div><div class="amount">${money(totalFees)}</div><div class="trend">Current records</div></div>
    <div class="card"><div class="label">Total Collected</div><div class="amount">${money(totalPaid)}</div><div class="trend">Recorded payments</div></div>
    <div class="card"><div class="label">Outstanding</div><div class="amount">${money(totalFees-totalPaid)}</div><div class="trend">Needs collection</div></div>
  </div>
  <div class="grid"><div class="panel"><h2>Fee Collection Progress</h2><div class="statline"><span>Collected</span><b>${Math.round(pct)}%</b></div><div class="bar"><i style="width:${pct}%"></i></div><div class="statline"><span>${money(totalPaid)} collected</span><span>${money(totalFees-totalPaid)} balance</span></div></div>
  <div class="panel"><h2>Today's Attendance</h2><div class="statline"><span>Present</span><b>${present}</b></div><div class="bar"><i style="width:${records.length?present/records.length*100:0}%"></i></div><div class="statline"><span>Late ${late}</span><span>Absent ${absent}</span></div></div></div>
  <div class="grid"><div class="panel"><h2>Recent Payments</h2>${cache.payments.slice(0,6).map(p=>`<div class="row"><span><b>${esc(p.student_name||studentName(p.student_id))}</b><br><small>${esc(p.payment_date||p.date||'')} · ${esc(p.method||p.payment_method||'')}</small></span><b>${money(p.amount)}</b></div>`).join('') || '<div class="empty">No payments recorded yet.</div>'}</div>
  <div class="panel"><h2>Quick Summary</h2><div class="row"><span>Students fully paid</span><b>${cache.students.filter(s=>studentBalance(s)<=0).length}</b></div><div class="row"><span>Students with balance</span><b>${cache.students.filter(s=>studentBalance(s)>0).length}</b></div><div class="row"><span>Attendance records today</span><b>${records.length}</b></div></div></div>`;
}

function studentsPage(){ return `<div class="panel"><div class="toolbar"><input id="student-search" class="input" placeholder="Search student..." oninput="filterStudents(this.value)"><button class="btn" onclick="openStudentModal()">+ Add Student</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>Student</th><th>Admission No.</th><th>Class</th><th>Fees</th><th>Paid</th><th>Balance</th><th>Action</th></tr></thead><tbody id="studentRows">${studentRows(cache.students)}</tbody></table></div></div>`; }
function studentRows(list){ return list.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.admission_no||s.student_number||s.id)}</td><td>${esc(s.class_name||className(s.class_id)||s.class||'')}</td><td>${money(studentFees(s))}</td><td>${money(studentPaid(s))}</td><td><span class="badge ${studentBalance(s)<=0?'green':'red'}">${money(studentBalance(s))}</span></td><td><button class="btn" onclick="openPaymentModal('${esc(s.id)}')">Record Payment</button></td></tr>`).join('') || '<tr><td colspan="7" class="empty">No students found.</td></tr>'; }
window.filterStudents=q=>{ const v=q.toLowerCase(); document.querySelector('#studentRows').innerHTML=studentRows(cache.students.filter(s=>(s.name||'').toLowerCase().includes(v)||(s.admission_no||'').toLowerCase().includes(v))); };

function feesPage(){ return `<div class="cards"><div class="card"><div class="label">Collected</div><div class="amount">${money(cache.payments.reduce((a,p)=>a+Number(p.amount||0),0))}</div></div><div class="card"><div class="label">Outstanding</div><div class="amount">${money(cache.students.reduce((a,s)=>a+studentBalance(s),0))}</div></div></div><div class="panel" style="margin-top:18px"><div class="toolbar"><button class="btn" onclick="openPaymentModal()">+ Record Payment</button></div><h2>Payment History</h2><div style="overflow:auto"><table class="table"><thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>${cache.payments.map(p=>`<tr><td>${esc(p.receipt_no||p.receipt||'')}</td><td>${esc(p.student_name||studentName(p.student_id))}</td><td><b>${money(p.amount)}</b></td><td>${esc(p.method||p.payment_method||'')}</td><td>${esc(p.payment_date||p.date||'')}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">No payments recorded.</td></tr>'}</tbody></table></div></div>`; }

function attendancePage(){ const date=today(); return `<div class="panel"><div class="toolbar"><input id="attendance-date" class="input" type="date" value="${date}"><select id="attendance-class" class="select"><option value="">All Classes</option>${cache.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><button class="btn" onclick="saveAttendance()">Save Attendance</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Teacher</th></tr></thead><tbody id="attendanceRows">${attendanceRows(date)}</tbody></table></div></div>`; }
function attendanceRows(date){ const selected=document.querySelector('#attendance-class')?.value||''; return cache.students.filter(s=>!selected||String(s.class_id)===selected||String(s.class)===selected).map(s=>{ const rec=cache.attendance.find(a=>String(a.student_id)===String(s.id)&&String(a.attendance_date||a.date).slice(0,10)===date); return `<tr data-student="${esc(s.id)}"><td><b>${esc(s.name)}</b></td><td>${esc(s.class_name||className(s.class_id)||s.class||'')}</td><td><select class="select attendance-status"><option ${rec?.status==='Present'?'selected':''}>Present</option><option ${rec?.status==='Late'?'selected':''}>Late</option><option ${rec?.status==='Absent'?'selected':''}>Absent</option></select></td><td>${esc(rec?.teacher_name||teacherName(rec?.teacher_id)||'Admin')}</td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">No students in this class.</td></tr>'; }

function teachersPage(){ return `<div class="panel"><div class="toolbar"><button class="btn" onclick="openTeacherModal()">+ Add Teacher</button></div><table class="table"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Role</th></tr></thead><tbody>${cache.teachers.map(t=>`<tr><td><b>${esc(t.name)}</b></td><td>${esc(t.phone||'')}</td><td>${esc(t.email||'')}</td><td>${esc(t.role||'Teacher')}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No teachers yet.</td></tr>'}</tbody></table></div>`; }
function classesPage(){ return `<div class="panel"><div class="toolbar"><button class="btn" onclick="openClassModal()">+ Add Class</button></div><table class="table"><thead><tr><th>Class</th><th>Teacher</th><th>Students</th></tr></thead><tbody>${cache.classes.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.teacher_name||teacherName(c.teacher_id)||'Not assigned')}</td><td>${cache.students.filter(s=>String(s.class_id)===String(c.id)).length}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">No classes yet.</td></tr>'}</tbody></table></div>`; }
function reportsPage(){ const outstanding=cache.students.filter(s=>studentBalance(s)>0); return `<div class="panel"><div class="toolbar"><button class="btn" onclick="window.print()">Print Report</button></div><h2>Outstanding Fees Report</h2><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Expected</th><th>Paid</th><th>Balance</th></tr></thead><tbody>${outstanding.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.class_name||className(s.class_id)||s.class||'')}</td><td>${money(studentFees(s))}</td><td>${money(studentPaid(s))}</td><td><b>${money(studentBalance(s))}</b></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No outstanding balances.</td></tr>'}</tbody></table></div>`; }

function modal(html){ document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="modal"><div class="modal-card">${html}</div></div>`); }
function closeModal(){document.querySelector('#modal')?.remove();}
window.openStudentModal=()=>modal(`<h2>Add Student</h2><div class="form-grid"><label>Full name<input id="f-name" required></label><label>Admission number<input id="f-admission"></label><label>Class<select id="f-class"><option value="">Select class</option>${cache.classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><label>Total fees<input id="f-fees" type="number" min="0" step="0.01" value="0"></label></div><div id="modal-error" class="form-error"></div><div class="form-actions"><button class="input" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveStudent()">Save Student</button></div>`);
window.saveStudent=async()=>{ const payload={name:document.querySelector('#f-name').value.trim(),admission_no:document.querySelector('#f-admission').value.trim()||null,class_id:document.querySelector('#f-class').value||null,total_fees:Number(document.querySelector('#f-fees').value||0)}; if(!payload.name)return document.querySelector('#modal-error').textContent='Enter the student name.'; const {error}=await db.from('students').insert(payload); if(error)return document.querySelector('#modal-error').textContent=error.message; closeModal(); await loadData(); navigate(currentPage); };
window.openPaymentModal=(studentId='')=>modal(`<h2>Record Payment</h2><div class="form-grid"><label>Student<select id="p-student"><option value="">Select student</option>${cache.students.map(s=>`<option value="${esc(s.id)}" ${String(s.id)===String(studentId)?'selected':''}>${esc(s.name)}</option>`).join('')}</select></label><label>Amount<input id="p-amount" type="number" min="0.01" step="0.01"></label><label>Method<select id="p-method"><option>Cash</option><option>Mobile Money</option><option>Bank Transfer</option><option>Card</option></select></label><label>Payment date<input id="p-date" type="date" value="${today()}"></label><label>Receipt number<input id="p-receipt" placeholder="Auto if blank"></label></div><div id="modal-error" class="form-error"></div><div class="form-actions"><button class="input" onclick="closeModal()">Cancel</button><button class="btn" onclick="savePayment()">Save Payment</button></div>`);
window.savePayment=async()=>{ const payload={student_id:document.querySelector('#p-student').value,amount:Number(document.querySelector('#p-amount').value||0),method:document.querySelector('#p-method').value,payment_date:document.querySelector('#p-date').value,receipt_no:document.querySelector('#p-receipt').value.trim()||null}; if(!payload.student_id||payload.amount<=0)return document.querySelector('#modal-error').textContent='Select a student and enter a valid amount.'; const {error}=await db.from('payments').insert(payload); if(error)return document.querySelector('#modal-error').textContent=error.message; closeModal(); await loadData(); navigate(currentPage); };
window.saveAttendance=async()=>{ const date=document.querySelector('#attendance-date').value; const rows=[...document.querySelectorAll('#attendanceRows tr[data-student]')]; if(!rows.length)return; const teacherId=cache.teachers[0]?.id||null; const payload=rows.map(r=>({student_id:r.dataset.student,attendance_date:date,status:r.querySelector('.attendance-status').value,teacher_id:teacherId})); const {error}=await db.from('attendance').upsert(payload,{onConflict:'student_id,attendance_date'}); if(error)return showError(error.message); await loadData(); navigate('attendance'); };
window.openTeacherModal=()=>modal(`<h2>Add Teacher</h2><div class="form-grid"><label>Name<input id="t-name"></label><label>Phone<input id="t-phone"></label><label>Email<input id="t-email" type="email"></label><label>Role<input id="t-role" value="Teacher"></label></div><div id="modal-error" class="form-error"></div><div class="form-actions"><button class="input" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveTeacher()">Save Teacher</button></div>`);
window.saveTeacher=async()=>{ const payload={name:document.querySelector('#t-name').value.trim(),phone:document.querySelector('#t-phone').value.trim()||null,email:document.querySelector('#t-email').value.trim()||null,role:document.querySelector('#t-role').value.trim()||'Teacher'}; if(!payload.name)return document.querySelector('#modal-error').textContent='Enter the teacher name.'; const {error}=await db.from('teachers').insert(payload); if(error)return document.querySelector('#modal-error').textContent=error.message; closeModal(); await loadData(); navigate('teachers'); };
window.openClassModal=()=>modal(`<h2>Add Class</h2><div class="form-grid"><label>Class name<input id="c-name" placeholder="JHS 1"></label><label>Teacher<select id="c-teacher"><option value="">Not assigned</option>${cache.teachers.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label></div><div id="modal-error" class="form-error"></div><div class="form-actions"><button class="input" onclick="closeModal()">Cancel</button><button class="btn" onclick="saveClass()">Save Class</button></div>`);
window.saveClass=async()=>{ const payload={name:document.querySelector('#c-name').value.trim(),teacher_id:document.querySelector('#c-teacher').value||null}; if(!payload.name)return document.querySelector('#modal-error').textContent='Enter the class name.'; const {error}=await db.from('classes').insert(payload); if(error)return document.querySelector('#modal-error').textContent=error.message; closeModal(); await loadData(); navigate('classes'); };

const pages={dashboard,students:studentsPage,fees:feesPage,attendance:attendancePage,teachers:teachersPage,classes:classesPage,reports:reportsPage};
async function navigate(page){ currentPage=page; document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); title.textContent=page==='fees'?'Fees & Payments':page[0].toUpperCase()+page.slice(1); app.innerHTML=pages[page](); }

document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
document.querySelector('#logout-btn').addEventListener('click',async()=>{await db.auth.signOut(); location.reload();});
document.querySelector('#login-form').addEventListener('submit',async e=>{e.preventDefault();const err=document.querySelector('#login-error');err.textContent='';const {error}=await db.auth.signInWithPassword({email:document.querySelector('#login-email').value,password:document.querySelector('#login-password').value});if(error)err.textContent=error.message;else await startApp();});

async function startApp(){ const {data:{user}}=await db.auth.getUser(); if(!user){document.querySelector('#login-screen').classList.remove('hidden');document.querySelector('#app-shell').classList.add('hidden');return;} document.querySelector('#login-screen').classList.add('hidden');document.querySelector('#app-shell').classList.remove('hidden');document.querySelector('#admin-email').textContent=user.email||'Admin';await loadData();navigate('dashboard'); }
startApp();
