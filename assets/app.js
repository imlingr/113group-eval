/* ------------ 常量 ------------ */
const endpoint = "https://script.google.com/macros/s/AKfycbxZOoIEQUOWhvff16SJJrGFX7m7Jb5dFpdXneBnCEbnmh60SPS7K6CMNJvVG7ABiMX7ZQ/exec";

/* 班級 → 組別＆名單 */
const DB = {
  "809":[
    ["04林藤諺","12謝秉玹","15邱雅涵","21陳冠瑜","24黃星瑜"],
    ["03林駿成","09黃珺","17張郁婍","22童于芳","25黃渝甄"],
    ["01王泉象","12謝秉玹","08曾唯祐","14林芊樂","19張學暄"],
    ["06張恩瑞","10劉修齊","16洪舒芸","20陳昀彤","23黃采潔"],
    ["02李昊叡","07曹煜承","11劉秩綸","18張宸語","26謝旻珊"]
  ],
  "818":[
    ["08陳奕崴","11蔡能筌","12蕭安祐","21劉予謙","27向文文"],
    ["02李和樂","03李哲廷","09歐祐綸","17林可惟","26羅培芯"],
    ["04林品佑","11蔡能筌","22蔡璦忻","23蕭安妍","25藍心言"],
    ["06洪晨耀","13薛牧宸","14龐仕杰","15王婧芸","18孫菉葉"],
    ["01王家薰","07張嘉宏","16李之瀠","20陳子姸","24蕭安妮"]
  ]
};

/* 工作任務／投入程度 */
const WORKS = ["📅當天參與訪談","📞接洽受談者","🔍查資料","📝設計問題","📰小記者訪問","📸拍照","🗒️記錄","💼做簡報","🎤上台報告","🎭編劇","🎬表演","其他"];
const EFFORTS = [
"A我幾乎什麼都沒有做🙃","B我只做了自己的工作，而且還沒做完😣","C我只完成自己的工作，坦白說有點隨便😅","D我只完成了自己的工作，而且我還遲交😔","E我只完成了自己的工作，我盡力了，但成果好像普通而已🤔","F我只完成了自己的工作，但我有認真做🫡","G我只完成了自己的工作，但我花費了很多時間和心力，我很認真🙂","H我不只完成了自己的工作，我還會關心提醒其他的組員進度😊","I我不只完成自己的任務，我後來還幫忙其他人一起做，花了超多時間及心力😃","其他"];

/* ------------ DOM 取得 ------------ */
const $=id=>document.getElementById(id);

/* section shortcut */
const secClass=$("step-class"),secGroup=$("step-group"),secMe=$("step-me"),
      secSelf=$("step-self"),secPeerList=$("step-peer-list"),
      secPeer=$("step-peer"),secDone=$("step-done");

/* ------------ 內部狀態 ------------ */
let form = JSON.parse(localStorage.getItem("peerForm")||"{}"); //自動存取
let classPicked="", groupPicked=-1, members=[], meName="";
let currentPeerIdx=-1; // 0~3

/* ------------ 共用函數 ------------ */
function showSection(sec){
  [secClass,secGroup,secMe,secSelf,secPeerList,secPeer,secDone]
    .forEach(s=>s.classList.toggle("hidden",s!==sec));
  save();
}
function save(){ localStorage.setItem("peerForm",JSON.stringify(form)); }

/* circled number U+2460~U+2469 ①…⑩ */
function circled(n){return String.fromCharCode(9311+n);}

/* 產生量表 */
function renderScale(dom,name,nowVal){
  dom.innerHTML="";
  for(let i=1;i<=10;i++){
    const label=document.createElement("label");
    label.innerHTML=`<input type="radio" name="${name}" value="${i}" ${nowVal==i?"checked":""}><span class="circle">${circled(i)}</span>`;
    dom.appendChild(label);
  }
}

/* 產生 checkbox 列表 */
function renderChecks(dom,arr,checkedArr){
  dom.innerHTML="";
  arr.forEach(txt=>{
    const val=txt.replace(/\s/g,"");
    dom.insertAdjacentHTML("beforeend",
      `<label><input type="checkbox" value="${txt}" ${checkedArr?.includes(txt)?"checked":""}>${txt}</label>`);
  });
}

/* ------------------------------------------------------- */
/* 0. 選班級 */
document.querySelectorAll("input[name=classPick]").forEach(r=>{
  r.onchange=e=>{
    classPicked=e.target.value;
    $("btnClassNext").disabled=false;
  }
});
$("btnClassNext").onclick=()=>{
  form.class=classPicked;
  /* 畫出 1~5 組按鈕 */
  $("groupArea").innerHTML = DB[classPicked].map((_,i)=>
    `<button data-g="${i}">${i+1}</button>`).join("");
  $("groupArea").onclick=e=>{
    if(e.target.tagName!=="BUTTON")return;
    groupPicked=parseInt(e.target.dataset.g);
    [...$("groupArea").children].forEach(b=>b.classList.toggle("selected",b===e.target));
    $("btnGroupNext").disabled=false;
  }
  showSection(secGroup);
};

/* ------------------------------------------------------- */
/* 1. 選組別 */
$("btnGroupBack").onclick=()=>showSection(secClass);
$("btnGroupNext").onclick=()=>{
  members=[...DB[classPicked][groupPicked]];       // 複製
  $("meList").innerHTML=members.map(n=>`<li>${n}</li>`).join("");
  $("meList").onclick=e=>{
    if(e.target.tagName!=="LI")return;
    meName=e.target.textContent;
    [...$("meList").children].forEach(li=>li.classList.toggle("selected",li===e.target));
    setTimeout(()=>enterSelf(),300);
  };
  showSection(secMe);
};

/* ------------------------------------------------------- */
/* 2. 自評 */
function enterSelf(){
  form.group=groupPicked+1;
  form.self=meName;
  /* Work & effort checkbox */
  renderChecks($("selfWorks"),WORKS,form.selfWorks);
  renderChecks($("selfEfforts"),EFFORTS,form.selfEfforts);
  $("selfWorkOtherLine").classList.toggle("hidden",!form.selfWorks?.includes("其他"));
  $("selfEffortOtherLine").classList.toggle("hidden",!form.selfEfforts?.includes("其他"));
  $("selfWorkOther").value=form.selfWorkOther||"";
  $("selfEffortOther").value=form.selfEffortOther||"";
  renderScale($("selfScoreArea"),"selfScore",form.selfScore);
  $("selfComment").value=form.selfComment||"";
  showSection(secSelf);
}
/* 其他勾選顯示自填 */
$("selfWorks").onchange=e=>{
  if(e.target.value==="其他")
    $("selfWorkOtherLine").classList.toggle("hidden",!e.target.checked);
};
$("selfEfforts").onchange=e=>{
  if(e.target.value==="其他")
    $("selfEffortOtherLine").classList.toggle("hidden",!e.target.checked);
};
/* 自評下一步 */
$("btnSelfNext").onclick=()=>{
  /* 把輸入存入 form */
  form.selfWorks=[...$("selfWorks").querySelectorAll("input:checked")].map(i=>i.value);
  form.selfWorkOther=$("selfWorkOther").value.trim();
  form.selfEfforts=[...$("selfEfforts").querySelectorAll("input:checked")].map(i=>i.value);
  form.selfEffortOther=$("selfEffortOther").value.trim();
  form.selfScore=document.querySelector("input[name=selfScore]:checked")?.value||"";
  form.selfComment=$("selfComment").value.trim();

  /* 組互評名單(扣掉自己) 取前 4 人 */
  form.peers=form.peers||[];
  const list=members.filter(n=>n!==meName).slice(0,4);
  list.forEach((n,i)=>{
    form.peers[i]=form.peers[i]||{member:n};
  });
  renderPeerList();
  showSection(secPeerList);
};
/* 返回 */
$("btnSelfBack").onclick=()=>showSection(secMe);

/* ------------------------------------------------------- */
/* 3. 互評名單 */
function renderPeerList(){
  $("peerList").innerHTML=form.peers.map((p,i)=>
    `<li data-i="${i}" class="${p.done?"selected":""}">
      ${p.member}${p.done?"<span class='done'>(已評分)</span>":""}
    </li>`).join("");
}
$("peerList").onclick=e=>{
  if(e.target.tagName!=="LI")return;
  currentPeerIdx=parseInt(e.target.dataset.i);
  loadPeer();
};
$("btnPeerListBack").onclick=()=>showSection(secSelf);

/* ------------------------------------------------------- */
/* 4. 互評單人 */
function loadPeer(){
  const p=form.peers[currentPeerIdx];
  $("peerTitle").textContent=`正在評分：${p.member}`;
  renderChecks($("peerWorks"),WORKS,p.works);
  $("peerWorkOtherLine").classList.toggle("hidden",!(p.works||[]).includes("其他"));
  $("peerWorkOther").value=p.otherWorks||"";
  $("peerWorks").onchange=e=>{
    if(e.target.value==="其他")
      $("peerWorkOtherLine").classList.toggle("hidden",!e.target.checked);
  };
  renderScale($("peerScoreArea"),"peerScore",p.score);
  $("peerComment").value=p.comment||"";
  showSection(secPeer);
}
$("btnPeerBack").onclick=()=>showSection(secPeerList);
$("btnPeerSave").onclick=()=>{
  const p=form.peers[currentPeerIdx];
  p.works=[...$("peerWorks").querySelectorAll("input:checked")].map(i=>i.value);
  p.otherWorks=$("peerWorkOther").value.trim();
  p.score=document.querySelector("input[name=peerScore]:checked")?.value||"";
  p.comment=$("peerComment").value.trim();
  p.done=true;
  renderPeerList();
  showSection(secPeerList);

  /* 若 4 位皆 done → 送出 */
  if(form.peers.every(x=>x.done)) submit();
};

/* ------------------------------------------------------- */
/* 5. 送出 */
function submit(){
  fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(form)
  })
  .then(r=>r.json())
  .then(res=>{
    if(res.result==="success") showSection(secDone);
    else alert("寫入失敗："+res.message);
  })
  .catch(e=>alert("送出失敗\n"+e));
}

/* ------------------------------------------------------- */
/* 6. 完成頁 */
$("btnAgain").onclick=()=>showSection(secPeerList);

/* 進站自動恢復上次紀錄 ---------------------------- */
window.addEventListener("load",()=>{
  if(form.class){                 // 已做過一部份
    classPicked=form.class;
    groupPicked=(form.group||1)-1;
    members=[...DB[classPicked][groupPicked]];
    meName=form.self||"";
    renderPeerList();
    showSection(secPeerList);     // 直接到互評名單
  }
});
