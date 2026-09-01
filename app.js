const students=[
 {id:'S001',name:'Kwame Mensah',class:'JHS 1',fees:2000,paid:1200},
 {id:'S002',name:'Ama Boateng',class:'JHS 1',fees:2000,paid:2000},
 {id:'S003',name:'Kofi Asare',class:'P6',fees:1500,paid:900},
 {id:'S004',name:'Abena Owusu',class:'P5',fees:1500,paid:500},
 {id:'S005',name:'Yaw Ofori',class:'P4',fees:1400,paid:1400},
 {id:'S006',name:'Akosua Mensah',class:'KG 2',fees:1100,paid:650}
];
const payments=[
 {receipt:'R-1006',student:'Kwame Mensah',amount:400,method:'Mobile Money',date:'31 Aug 2026'},
 {receipt:'R-1005',student:'Ama Boateng',amount:500,method:'Cash',date:'31 Aug 2026'},
 {receipt:'R-1004',student:'Kofi Asare',amount:300,method:'Mobile Money',date:'30 Aug 2026'}
];
const attendance=[
 {name:'Kwame Mensah',class:'JHS 1',status:'Present'},
 {name:'Ama Boateng',class:'JHS 1',status:'Present'},
 {name:'Kofi Asare',class:'P6',status:'Late'},
 {name:'Abena Owusu',class:'P5',status:'Absent'},
 {name:'Yaw Ofori',class:'P4',status:'Present'}
];
const totalFees=students.reduce((a,s)=>a+s.fees,0), totalPaid=students.reduce((a,s)=>a+s.paid,0);
const app=document.querySelector('#app'), title=document.querySelector('#page-title');
function money(n){return 'GH₵ '+n.toLocaleString('en-GH',{minimumFractionDigits:2})}
function dashboard(){return `<div class="cards">
<div class="card"><div class="label">Total Students</div><div class="amount">${students.length}</div><div class="trend">Active students</div></div>
<div class="card"><div class="label">Total Fees Expected</div><div class="amount">${money(totalFees)}</div><div class="trend">Current term</div></div>
<div class="card"><div class="label">Total Collected</div><div class="amount">${money(totalPaid)}</div><div class="trend">● Updated today</div></div>
<div class="card"><div class="label">Outstanding</div><div class="amount">${money(totalFees-totalPaid)}</div><div class="trend">Needs collection</div></div>
</div>
<div class="grid"><div class="panel"><h2>Fee Collection Progress</h2><div class="statline"><span>Collected</span><b>${Math.round(totalPaid/totalFees*100)}%</b></div><div class="bar"><i style="width:${totalPaid/totalFees*100}%"></i></div><div class="statline"><span>${money(totalPaid)} collected</span><span>${money(totalFees-totalPaid)} balance</span></div></div>
<div class="panel"><h2>Today's Attendance</h2><div class="statline"><span>Present</span><b>${attendance.filter(x=>x.status==='Present').length}</b></div><div class="bar"><i style="width:60%"></i></div><div class="statline"><span>Late ${attendance.filter(x=>x.status==='Late').length}</span><span>Absent ${attendance.filter(x=>x.status==='Absent').length}</span></div></div></div>
<div class="grid"><div class="panel"><h2>Recent Payments</h2>${payments.map(p=>`<div class="row"><span><b>${p.student}</b><br><small>${p.date} · ${p.method}</small></span><b>${money(p.amount)}</b></div>`).join('')}</div>
<div class="panel"><h2>Quick Summary</h2><div class="row"><span>Students fully paid</span><b>${students.filter(s=>s.paid>=s.fees).length}</b></div><div class="row"><span>Students with balance</span><b>${students.filter(s=>s.paid<s.fees).length}</b></div><div class="row"><span>Attendance records</span><b>${attendance.length}</b></div></div></div>`}
function studentsPage(){return `<div class="panel"><div class="toolbar"><input class="input" placeholder="Search student..." oninput="filterStudents(this.value)"><button class="btn">+ Add Student</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>ID</th><th>Student</th><th>Class</th><th>Fees</th><th>Paid</th><th>Balance</th></tr></thead><tbody id="studentRows">${studentRows(students)}</tbody></table></div></div>`}
function studentRows(list){return list.map(s=>`<tr><td>${s.id}</td><td><b>${s.name}</b></td><td>${s.class}</td><td>${money(s.fees)}</td><td>${money(s.paid)}</td><td><span class="badge ${s.paid>=s.fees?'green':'red'}">${money(s.fees-s.paid)}</span></td></tr>`).join('')}
function filterStudents(q){document.querySelector('#studentRows').innerHTML=studentRows(students.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.id.toLowerCase().includes(q.toLowerCase())))}
function feesPage(){return `<div class="cards"><div class="card"><div class="label">Collected</div><div class="amount">${money(totalPaid)}</div></div><div class="card"><div class="label">Outstanding</div><div class="amount">${money(totalFees-totalPaid)}</div></div></div><div class="panel" style="margin-top:18px"><h2>Payment History</h2><table class="table"><thead><tr><th>Receipt</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead><tbody>${payments.map(p=>`<tr><td>${p.receipt}</td><td>${p.student}</td><td><b>${money(p.amount)}</b></td><td>${p.method}</td><td>${p.date}</td></tr>`).join('')}</tbody></table></div>`}
function attendancePage(){return `<div class="panel"><div class="toolbar"><select class="select"><option>Today — 31 Aug 2026</option></select><select class="select"><option>All Classes</option><option>JHS 1</option><option>P6</option></select><button class="btn">Save Attendance</button></div><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Teacher</th></tr></thead><tbody>${attendance.map(a=>`<tr><td><b>${a.name}</b></td><td>${a.class}</td><td><span class="badge ${a.status==='Present'?'green':a.status==='Absent'?'red':''}">${a.status}</span></td><td>Assigned Teacher</td></tr>`).join('')}</tbody></table></div>`}
function simplePage(name,desc){return `<div class="panel"><h2>${name}</h2><p style="color:#73788d">${desc}</p><div class="empty">This module is ready for the next development phase.</div></div>`}
const pages={dashboard,students:studentsPage,fees:feesPage,attendance:attendancePage,teachers:()=>simplePage('Teachers','Manage teachers and assign classes.'),classes:()=>simplePage('Classes','Create classes and assign teachers.'),reports:()=>simplePage('Reports','Generate fee and attendance reports.')};
function navigate(page){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page));title.textContent=page==='fees'?'Fees & Payments':page[0].toUpperCase()+page.slice(1);app.innerHTML=pages[page]()}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
navigate('dashboard');
