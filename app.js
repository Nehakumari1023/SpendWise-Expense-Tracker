(() => {
  "use strict";

  const CATEGORIES = ["Food & dining", "Transport", "Shopping", "Bills & utilities", "Health", "Entertainment", "Education", "Other"];
  const COLORS = ["#3985e5", "#58c5d5", "#8b79e6", "#f1ad62", "#49b88d", "#e47d91", "#7b9caf", "#b3bdc7"];
  const ICONS = {"Food & dining":"☕","Transport":"↗","Shopping":"◇","Bills & utilities":"⌁","Health":"＋","Entertainment":"♫","Education":"▤","Other":"•"};
  const STORAGE_KEY = "spendwise_transactions_v1";
  const BUDGET_KEY = "spendwise_budget_v1";
  const money = amount => new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0}).format(Number(amount) || 0);
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const monthKey = date => String(date).slice(0,7);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const el = id => document.getElementById(id);

  function demoTransactions() {
    const year = new Date().getFullYear(), month = new Date().getMonth();
    const date = (offset) => { const d = new Date(year, month, Math.max(1, Math.min(28, new Date().getDate() - offset))); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
    const samples = [
      ["Weekly groceries",840,"Food & dining",0,"UPI"],["Metro recharge",350,"Transport",1,"UPI"],
      ["Coffee with friends",280,"Food & dining",2,"Card"],["Online course",1299,"Education",3,"Card"],
      ["Mobile bill",599,"Bills & utilities",4,"UPI"],["Pharmacy",430,"Health",5,"UPI"],
      ["New notebook",245,"Shopping",6,"Cash"],["Movie tickets",620,"Entertainment",8,"Card"],
      ["Lunch",420,"Food & dining",9,"UPI"],["Cab ride",310,"Transport",10,"UPI"],
      ["Electricity bill",1460,"Bills & utilities",12,"UPI"],["Skincare",780,"Shopping",14,"Card"],
      ["Weekend groceries",1120,"Food & dining",17,"UPI"],["Yoga class",500,"Health",19,"UPI"],
      ["Book purchase",560,"Education",22,"Card"],["Streaming subscription",299,"Entertainment",24,"Card"]
    ];
    return samples.map((s,i)=>({id:`demo-${i+1}`,name:s[0],amount:s[1],category:s[2],date:date(s[3]),payment:s[4],notes:""}));
  }

  let transactions = loadTransactions();
  let budget = Number(localStorage.getItem(BUDGET_KEY)) || 15000;
  let selectedMonth = monthKey(todayISO());
  let showAll = false;
  let toastTimer;

  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; }
    } catch (error) { console.warn("Could not load saved data:", error); }
    const seed = demoTransactions();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); } catch (_) {}
    return seed;
  }
  function saveTransactions() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }
    catch (_) { showToast("Browser storage is full. Export your data to keep a copy."); }
  }
  function selectedTransactions() { return transactions.filter(t => monthKey(t.date) === selectedMonth); }
  function sum(items) { return items.reduce((total,t)=>total+Number(t.amount),0); }
  function categoryTotals(items) {
    const totals = {};
    items.forEach(t => totals[t.category] = (totals[t.category] || 0) + Number(t.amount));
    return Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  }
  function initFilters() {
    const months = new Set([monthKey(todayISO()), ...transactions.map(t=>monthKey(t.date))]);
    const current = new Date(); for(let i=0;i<5;i++){ const d=new Date(current.getFullYear(),current.getMonth()-i,1); months.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }
    el("monthFilter").innerHTML = [...months].sort().reverse().map(m=>`<option value="${m}">${new Date(`${m}-02T00:00:00`).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</option>`).join("");
    el("monthFilter").value = selectedMonth;
    el("categoryFilter").innerHTML = '<option value="all">All categories</option>' + CATEGORIES.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    el("expenseCategory").innerHTML = CATEGORIES.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
    el("todayLabel").textContent = new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
    el("budgetInput").value = budget || "";
  }
  function render() {
    const items = selectedTransactions(), total = sum(items), remaining = budget-total;
    el("totalSpent").textContent = money(total);
    el("remainingBudget").textContent = money(remaining);
    el("remainingBudget").style.color = remaining < 0 ? "#d65b62" : "";
    el("transactionCount").textContent = items.length;
    el("averageExpense").textContent = money(items.length ? total/items.length : 0);
    const progress = budget > 0 ? Math.min(100,total/budget*100) : 0;
    el("budgetProgress").style.width = `${progress}%`;
    el("budgetProgress").style.background = total > budget ? "#e66d76" : "";
    el("budgetFoot").textContent = budget > 0 ? `${Math.round(progress)}% of ${money(budget)} used` : "Set a budget to get started";
    el("spendFoot").textContent = total > 0 ? `${items.length} expense${items.length===1?"":"s"} recorded` : "No expenses for this month";
    el("categoryTotal").textContent = money(total);
    renderTransactions();
    renderCategoryChart(items);
    renderTrendChart();
    renderInsights(items,total);
  }
  function renderTransactions() {
    const query = el("searchInput").value.trim().toLowerCase(), category = el("categoryFilter").value;
    let items = selectedTransactions().filter(t => (category==="all"||t.category===category) && `${t.name} ${t.category} ${t.notes||""}`.toLowerCase().includes(query));
    items.sort((a,b)=>b.date.localeCompare(a.date));
    const visible = showAll ? items : items.slice(0,6);
    el("transactionRows").innerHTML = visible.map(t=>`<tr>
      <td><div class="expense-name"><span class="expense-symbol">${ICONS[t.category]||"•"}</span><span>${escapeHTML(t.name)}</span></div></td>
      <td><span class="category-pill">${escapeHTML(t.category)}</span></td>
      <td>${new Date(`${t.date}T12:00:00`).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</td>
      <td class="amount-cell">${money(t.amount)}</td>
      <td class="action-cell"><button class="row-action" data-edit="${escapeHTML(t.id)}" aria-label="Edit ${escapeHTML(t.name)}" title="Edit">✎</button><button class="row-action" data-delete="${escapeHTML(t.id)}" aria-label="Delete ${escapeHTML(t.name)}" title="Delete">×</button></td>
    </tr>`).join("");
    el("emptyState").classList.toggle("hidden",items.length>0);
    el("tableFooter").textContent = items.length ? `Showing ${visible.length} of ${items.length} transaction${items.length===1?"":"s"}` : "";
    el("viewAllLink").textContent = showAll ? "Show less ↑" : "View all →";
  }
  function renderCategoryChart(items) {
    const canvas = el("categoryChart"), ctx = canvas.getContext("2d"), rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(1,rect.width*dpr); canvas.height=Math.max(1,rect.height*dpr); ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height,cx=w/2,cy=h/2,r=Math.min(w,h)*.42,inner=r*.68, totals=categoryTotals(items), total=sum(items);
    ctx.clearRect(0,0,w,h);
    if(!total){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.arc(cx,cy,inner,0,Math.PI*2,true);ctx.fillStyle="#edf2f6";ctx.fill("evenodd");}
    else {let angle=-Math.PI/2;totals.forEach(([cat,val])=>{const end=angle+val/total*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=COLORS[CATEGORIES.indexOf(cat)]||COLORS[7];ctx.fill();angle=end;});}
    el("categoryLegend").innerHTML=totals.length?totals.slice(0,6).map(([cat,val])=>`<div class="legend-item"><i class="legend-dot" style="background:${COLORS[CATEGORIES.indexOf(cat)]||COLORS[7]}"></i><span>${escapeHTML(cat)}</span><strong>${Math.round(val/total*100)}%</strong></div>`).join(""):'<p class="metric-foot">Add expenses to see category insights.</p>';
  }
  function renderTrendChart() {
    const canvas=el("trendChart"),ctx=canvas.getContext("2d"),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
    canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height,p={l:42,r:13,t:15,b:27},plotW=w-p.l-p.r,plotH=h-p.t-p.b;
    ctx.clearRect(0,0,w,h);
    const [year,month]=selectedMonth.split("-").map(Number);
    const points=[];
    for(let i=5;i>=0;i--){const d=new Date(year,month-1-i,1),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,v=sum(transactions.filter(t=>monthKey(t.date)===key));points.push({label:d.toLocaleDateString("en-IN",{month:"short"}),value:v});}
    const max=Math.max(1000,...points.map(p=>p.value))*1.15;
    ctx.font='10px "DM Sans", sans-serif';ctx.textBaseline="middle";
    for(let i=0;i<4;i++){const y=p.t+plotH*i/3;ctx.strokeStyle="#edf1f5";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(w-p.r,y);ctx.stroke();ctx.fillStyle="#a2adb7";ctx.textAlign="right";ctx.fillText(i===0?shortMoney(max):i===1?shortMoney(max*2/3):i===2?shortMoney(max/3):"₹0",p.l-8,y);}
    const coords=points.map((point,i)=>({x:p.l+plotW*i/(points.length-1),y:p.t+plotH-(point.value/max)*plotH,...point}));
    const grad=ctx.createLinearGradient(0,p.t,0,h-p.b);grad.addColorStop(0,"rgba(51,130,229,.22)");grad.addColorStop(1,"rgba(51,130,229,0)");
    ctx.beginPath();coords.forEach((c,i)=>i?ctx.lineTo(c.x,c.y):ctx.moveTo(c.x,c.y));ctx.lineTo(coords[coords.length-1].x,h-p.b);ctx.lineTo(coords[0].x,h-p.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();coords.forEach((c,i)=>i?ctx.lineTo(c.x,c.y):ctx.moveTo(c.x,c.y));ctx.strokeStyle="#3985e5";ctx.lineWidth=2.5;ctx.lineJoin="round";ctx.lineCap="round";ctx.stroke();
    coords.forEach(c=>{ctx.beginPath();ctx.arc(c.x,c.y,3.5,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.strokeStyle="#3985e5";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#9aa7b1";ctx.textAlign="center";ctx.fillText(c.label,c.x,h-9);});
  }
  function shortMoney(v){if(v>=100000)return `₹${(v/100000).toFixed(1)}L`;if(v>=1000)return `₹${(v/1000).toFixed(v>=10000?0:1)}k`;return `₹${Math.round(v)}`;}
  function renderInsights(items,total) {
    const cats=categoryTotals(items),top=cats[0],days=new Set(items.map(t=>t.date)).size;
    const insights=[];
    if(!items.length) insights.push(["＋","Start with one expense","Add a transaction to begin discovering your spending habits."]);
    else if(top) insights.push(["◉",`${top[0]} is your top category`,`${money(top[1])} spent here — ${Math.round(top[1]/total*100)}% of this month's expenses.`]);
    if(budget>0&&total>budget) insights.push(["!","Budget exceeded",`You're ${money(total-budget)} over your monthly budget. Review non-essential spending.`]);
    else if(budget>0) insights.push(["✓","You're within budget",`${money(budget-total)} remains from your monthly limit.`]);
    if(items.length) insights.push(["↗","Spending snapshot",`You recorded ${items.length} expenses across ${days} day${days===1?"":"s"} this month.`]);
    if(items.length>=3){const largest=items.reduce((a,b)=>Number(a.amount)>Number(b.amount)?a:b);insights.push(["₹","Largest transaction",`${largest.name} was your largest expense at ${money(largest.amount)}.`]);}
    el("insightList").innerHTML=insights.slice(0,3).map(i=>`<div class="insight-item"><span class="insight-icon">${i[0]}</span><div><strong>${escapeHTML(i[1])}</strong><p>${escapeHTML(i[2])}</p></div></div>`).join("");
  }
  function showToast(message){const toast=el("toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2600);}
  function openModal(transaction) {
    el("expenseForm").reset();el("formError").classList.add("hidden");el("expenseId").value="";
    el("modalTitle").textContent=transaction?"Edit expense":"Add an expense";el("saveExpense").textContent=transaction?"Save changes":"Save expense";
    el("expenseDate").value=todayISO();el("expenseCategory").value=CATEGORIES[0];
    if(transaction){el("expenseId").value=transaction.id;el("expenseName").value=transaction.name;el("expenseAmount").value=transaction.amount;el("expenseDate").value=transaction.date;el("expenseCategory").value=transaction.category;el("expensePayment").value=transaction.payment||"UPI";el("expenseNotes").value=transaction.notes||"";}
    el("expenseModal").classList.remove("hidden");document.body.style.overflow="hidden";setTimeout(()=>el("expenseName").focus(),30);
  }
  function closeModal(){el("expenseModal").classList.add("hidden");document.body.style.overflow="";}
  function submitExpense(event) {
    event.preventDefault();const id=el("expenseId").value,name=el("expenseName").value.trim(),amount=Number(el("expenseAmount").value),date=el("expenseDate").value;
    if(!name||!Number.isFinite(amount)||amount<=0||!date){el("formError").textContent="Enter a name, a positive amount, and a valid date.";el("formError").classList.remove("hidden");return;}
    if(amount>100000000){el("formError").textContent="Please enter an amount below ₹10 crore.";el("formError").classList.remove("hidden");return;}
    const record={id:id||`tx-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,name,amount,category:el("expenseCategory").value,date,payment:el("expensePayment").value,notes:el("expenseNotes").value.trim()};
    if(id)transactions=transactions.map(t=>t.id===id?record:t);else transactions.push(record);
    selectedMonth=monthKey(date);saveTransactions();initFilters();el("monthFilter").value=selectedMonth;closeModal();render();showToast(id?"Expense updated successfully":"Expense added successfully");
  }
  function deleteExpense(id){const t=transactions.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete "${t.name}"? This cannot be undone.`))return;transactions=transactions.filter(x=>x.id!==id);saveTransactions();render();showToast("Expense deleted");}
  function exportCSV(){
    const rows=[["Name","Amount (INR)","Category","Date","Payment method","Notes"],...transactions.map(t=>[t.name,t.amount,t.category,t.date,t.payment||"",t.notes||""])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download="spendwise-transactions.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast("CSV export downloaded");
  }
  function resetDemo(){if(!confirm("Reset all expenses to the original demo data and restore the default budget? Your added transactions will be removed."))return;transactions=demoTransactions();budget=15000;selectedMonth=monthKey(todayISO());localStorage.removeItem(STORAGE_KEY);localStorage.setItem(STORAGE_KEY,JSON.stringify(transactions));localStorage.setItem(BUDGET_KEY,String(budget));initFilters();render();showToast("Demo data restored");}

  el("addExpenseTop").addEventListener("click",()=>openModal());
  el("closeModal").addEventListener("click",closeModal);el("cancelModal").addEventListener("click",closeModal);
  el("expenseModal").addEventListener("click",e=>{if(e.target===el("expenseModal"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  el("expenseForm").addEventListener("submit",submitExpense);
  el("monthFilter").addEventListener("change",e=>{selectedMonth=e.target.value;showAll=false;render();});
  el("searchInput").addEventListener("input",renderTransactions);el("categoryFilter").addEventListener("change",renderTransactions);
  el("transactionRows").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit){const t=transactions.find(x=>x.id===edit.dataset.edit);if(t)openModal(t);}if(del)deleteExpense(del.dataset.delete);});
  el("viewAllLink").addEventListener("click",e=>{e.preventDefault();showAll=!showAll;renderTransactions();});
  el("budgetForm").addEventListener("submit",e=>{e.preventDefault();const val=Number(el("budgetInput").value);if(!Number.isFinite(val)||val<0){showToast("Enter a valid budget amount");return;}budget=val;localStorage.setItem(BUDGET_KEY,String(budget));render();showToast("Monthly budget saved");});
  el("exportCsv").addEventListener("click",exportCSV);el("resetDemo").addEventListener("click",resetDemo);
  el("menuToggle").addEventListener("click",()=>el("sidebar").classList.toggle("open"));
  document.querySelectorAll(".nav-item").forEach(link=>link.addEventListener("click",()=>el("sidebar").classList.remove("open")));
  let resizeTimer;window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{renderCategoryChart(selectedTransactions());renderTrendChart();},100);});
  initFilters();render();
})();