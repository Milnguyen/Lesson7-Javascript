// ifttt
(function(){
    const $ = id=>document.getElementById(id);
    const fmt = n=>n==null?'-':(Number(n).toLocaleString('vi-VN') + ' ₫');
    const formatDate = iso => {
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
    };
    const form = $('expenseForm'), typeIn=$('type'), categoryIn=$('category'), amountIn=$('amount'), dateIn=$('date'), descIn=$('desc');
    const txTable = document.querySelector('#txTable tbody');
    const totalBalance=$('totalBalance'), totalIncome=$('totalIncome'), totalExpense=$('totalExpense');
    const countEl=$('count'), filterMonth=$('filterMonth'), filterCategory=$('filterCategory');
    const exportBtn=$('exportBtn'), clearBtn=$('clearBtn'), resetForm=$('resetForm');

    const KEY = 'qlct_transactions_v1';
    let txs = load(), editId=null;

    // mục tiêu tiết kiệm
    let savingGoal=0;
    const goalInput=$('goalInput'), setGoalBtn=$('setGoalBtn'), savedPercent=$('savedPercent'), remainingAmount=$('remainingAmount');

    dateIn.value = new Date().toISOString().slice(0,10);

    function refreshCategories(){
        const cats = Array.from(new Set(['Tất cả danh mục', ...txs.map(t=>t.category), ...Array.from(categoryIn.querySelectorAll('option')).map(o=>o.value)]))
            .filter(Boolean);
        filterCategory.innerHTML = '<option value="all">Tất cả danh mục</option>' + cats.filter(c=>c!=='Tất cả danh mục').map(c=>`<option>${c}</option>`).join('');
    }

    function refreshMonths(){
        const now = new Date();
        filterMonth.innerHTML = '<option value="all">Tất cả tháng</option>';
        for(let i=0;i<12;i++){
            const d = new Date(now.getFullYear(), now.getMonth()-i,1);
            const val = d.toISOString().slice(0,7);
            const label = d.toLocaleString('vi-VN',{month:'long',year:'numeric'});
            filterMonth.insertAdjacentHTML('beforeend',`<option value="${val}">${label}</option>`);
        }
    }

    function load(){try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw):[];}catch(e){return []}}
    function save(){ localStorage.setItem(KEY,JSON.stringify(txs)); }
    function id(){return 't'+Math.random().toString(36).slice(2,9)}

    function getTotalIncome(){ return txs.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0); }
    function getTotalExpense(){ return txs.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0); }

    function updateSavingProgress(){
        const totalSaved = getTotalIncome() - getTotalExpense();
        if(savingGoal>0){
            let percent = Math.min(100, Math.round((totalSaved / savingGoal)*100));
            savedPercent.textContent = percent;
            console.log(savingGoal, totalSaved)
            remainingAmount.textContent = fmt(Math.max(0, savingGoal - totalSaved));
        } else {
            savedPercent.textContent = 0;
            remainingAmount.textContent = 0;
        }
    }

    let chart;
    function render(){
        const fm = filterMonth.value, fc=filterCategory.value;
        let list = txs.slice().sort((a,b)=>b.date.localeCompare(a.date));
        if(fm && fm!=='all') list = list.filter(t=>t.date.slice(0,7)===fm);
        if(fc && fc!=='all') list = list.filter(t=>t.category===fc);

        txTable.innerHTML = list.map(t=>`<tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.desc||''}</td>
        <td>${t.category}</td>
        <td>${fmt(t.amount)}</td>
        <td class="small">${t.type==='income'? 'Thu' : 'Chi'}</td>
        <td class="actions">
            <button class="btn ghost" onclick="openEdit('${t.id}')"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn danger" onclick="del('${t.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
        </tr>`).join('');

        const totalInc = getTotalIncome();
        const totalExp = getTotalExpense();
        totalIncome.textContent = fmt(totalInc);
        totalExpense.textContent = fmt(totalExp);
        totalBalance.textContent = fmt(totalInc-totalExp);
        countEl.textContent = txs.length;

        const byCat = {};
        list.filter(t=>t.type==='expense').forEach(t=>{byCat[t.category]=(byCat[t.category]||0)+Number(t.amount)});
        const labels = Object.keys(byCat), data = labels.map(l=>byCat[l]);
        const ctx = document.getElementById('pieChart').getContext('2d');
        if(chart) chart.destroy();
        chart = new Chart(ctx,{type:'pie',data:{labels,datasets:[{data}]},options:{plugins:{legend:{position:'bottom'}}}});

        refreshCategories();
        refreshMonths();
        updateSavingProgress();
    }

    form.addEventListener('submit', e=>{
        e.preventDefault();
        const t={id:editId||id(), type:typeIn.value, category:categoryIn.value||'Khác', amount:Number(amountIn.value)||0, date:dateIn.value, desc:descIn.value};
        if(editId){txs=txs.map(x=>x.id===editId?t:x); editId=null;}
        else txs.push(t);
        save(); render();
        form.reset(); dateIn.value=new Date().toISOString().slice(0,10);
    });

    window.openEdit=function(id){
        const t=txs.find(x=>x.id===id); if(!t)return;
        editId=id; typeIn.value=t.type; categoryIn.value=t.category; amountIn.value=t.amount; dateIn.value=t.date; descIn.value=t.desc;
        window.scrollTo({top:0,behavior:'smooth'});
    }

    window.del=function(id){if(!confirm('Xác nhận xóa giao dịch?'))return; txs=txs.filter(x=>x.id!==id); save(); render();}

    exportBtn.addEventListener('click',()=>{
        if(!txs.length){alert('Không có dữ liệu để export');return;}
        const rows=[['id','type','category','amount','date','desc'], ...txs.map(t=>[t.id,t.type,t.category,t.amount,t.date,`"${(t.desc||'').replace(/"/g,'""')}"`])];
        const csv=rows.map(r=>r.join(',')).join('\n');
        const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a'); a.href=url; a.download='transactions.csv'; a.click(); URL.revokeObjectURL(url);
    });

    clearBtn.addEventListener('click',()=>{
        if(!confirm('Xóa toàn bộ dữ liệu? Hành động không thể hoàn tác.'))return;
        txs=[]; save(); render();
    });

    resetForm.addEventListener('click',()=>{form.reset(); editId=null; dateIn.value=new Date().toISOString().slice(0,10);});
    filterMonth.addEventListener('change',render);
    filterCategory.addEventListener('change',render);

    setGoalBtn.addEventListener('click', ()=>{savingGoal = parseFloat(goalInput.value)||0; updateSavingProgress();});

    render();
})();
