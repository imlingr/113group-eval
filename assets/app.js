/***** 參數區 *****/
const endpoint = "https://script.google.com/macros/s/AKfycbxyuNBOgCLjiIRz6Z-CYxHKOa1GUlqnlmVCZC16ULuoB2xQ7c7FBxhm1nTmmdxJapqpRA/exec";

// 2 班級分組名單
const members = {
  "809":[
    ["第1組","04林藤諺","12謝秉玹","15邱雅涵","21陳冠瑜","24黃星瑜"],
    ["第2組","03林駿成","09黃珺","17張郁婍","22童于芳","25黃渝甄"],
    ["第3組","01王泉象","12謝秉玹","08曾唯祐","14林芊樂","19張學暄"],
    ["第4組","06張恩瑞","10劉修齊","16洪舒芸","20陳昀彤","23黃采潔"],
    ["第5組","02李昊叡","07曹煜承","11劉秩綸","18張宸語","26謝旻珊"]
  ],
  "818":[
    ["第1組","08陳奕崴","11蔡能筌","12蕭安祐","21劉予謙","27向文文"],
    ["第2組","02李和樂","03李哲廷","09歐祐綸","17林可惟","26羅培芯"],
    ["第3組","04林品佑","11蔡能筌","22蔡璦忻","23蕭安妍","25藍心言"],
    ["第4組","06洪晨耀","13薛牧宸","14龐仕杰","15王婧芸","18孫菉葉"],
    ["第5組","01王家薰","07張嘉宏","16李之瀠","20陳子姸","24蕭安妮"]
  ]
};
// 4 工作任務
const worksArr = ["📅 當天參與訪談","📞 接洽受談者","🔍 查資料","📝 設計問題","📰 小記者訪問","📸 拍照","🗒️ 記錄","💼 做簡報","🎤 上台報告","🎭 編劇","🎬 表演"];
// 5 投入程度
const effortArr = [
"A 我幾乎什麼都沒有做🙃","B 我只做了自己的工作，而且還沒做完😣",
"C 我只完成自己的工作，坦白說有點隨便😅","D 我只完成了自己的工作，而且我還遲交😔",
"E 我只完成了自己的工作，我盡力了，但成果好像普通而已🤔","F 我只完成了自己的工作，但我有認真做🫡",
"G 我只完成了自己的工作，但我花費了很多時間和心力，我很認真🙂",
"H 我不只完成了自己的工作，我還會關心提醒其他的組員進度😊",
"I 我不只完成自己的任務，我後來還幫忙其他人一起做，花了超多時間及心力😃"
];

/***** 共用變數 *****/
let formData = JSON.parse(localStorage.getItem("evalData") || "{}"); // 自動暫存
let peerRecords = []; // 互評陣列

/***** 輔助函式 *****/
function toStep(step){
  $(".step").addClass("d-none");
  $(`.step[data-step=${step}]`).removeClass("d-none");
}
function genCheckBox(arr, destID, name){
  let html="";
  arr.forEach((txt,i)=>{
    const id=`${destID}_${i}`;
    html+=`<div class="col-6 col-md-4 chkItem">
      <input type="checkbox" id="${id}" value="${txt}" name="${name}">
      <label for="${id}">${txt}</label></div>`;
  });
  $("#"+destID).html(html);
}
function saveDraft(){ localStorage.setItem("evalData",JSON.stringify(formData)); }

/***** 初始化 *****/
$(function(){
  // step1 若有暫存，預選
  if(formData.class){ $(`#c${formData.class}`).prop("checked",true); }

  // 監聽下一步 / 上一步
  $(".nextBtn").click(function(){
    const cur=$(this).closest(".step").data("step");
    if(cur==1){ // 檢查班級
      const cls=$("input[name=class]:checked").val();
      if(!cls) return alert("請先選班級！");
      formData.class=cls; saveDraft();
      // 產生組別
      let gHtml="";
      members[cls].forEach((g,idx)=>{
        gHtml+=`<div class="col-6 col-md-4">
          <input type="radio" id="g${idx}" name="group" value="${idx}" required>
          <label for="g${idx}" class="classCard">${g[0]}</label></div>`;
      });
      $("#groupBox").html(gHtml);
      if(formData.group){ $(`#g${formData.group}`).prop("checked",true); }
    }
    if(cur==2){
      const g=$("input[name=group]:checked").val();
      if(g===undefined) return alert("請先選組別！");
      formData.group=g; saveDraft();
      // 填入成員清單
      const list=members[formData.class][g].slice(1); // 去掉"第X組"
      $("#selfMember,#peerMember").empty();
      list.forEach(n=>$("#selfMember").append(`<option>${n}</option>`));
      $("#peerMember").html('<option value="">-- 請選擇 --</option>');
      list.forEach(n=>$("#peerMember").append(`<option>${n}</option>`));
      if(formData.self) $("#selfMember").val(formData.self);

      // 生成工作checkbox、投入checkbox
      genCheckBox(worksArr,"selfWorks","selfWork");
      genCheckBox(effortArr,"selfEfforts","selfEffort");
    }
    if(cur==3){
      // 讀取自評欄位到 formData
      const self=$("#selfMember").val();
      if(!self) return alert("請選擇自己");
      formData.self=self;
      formData.selfWorks=$("input[name=selfWork]:checked").map((_,e)=>e.value).get();
      formData.selfEfforts=$("input[name=selfEffort]:checked").map((_,e)=>e.value).get();
      const ex=$("#selfEffortExtra").val();
      if(ex) formData.selfEffortExtra=ex;
      formData.selfScore=$("#selfScore").val();
      formData.selfComment=$("#selfComment").val();
      if(!formData.selfComment) return alert("請填寫自評敘述");
      saveDraft();
      // 進入互評
      peerRecords = formData.peers || [];
      $("#peerIdx").text(peerRecords.length+1);
      refreshPeerSelect();
    }
    if(cur>=4 && cur<=7){ /* 透過 savePeer 控制 */ }
    toStep(cur+1);
  });

  $(".prevBtn").click(function(){
    const cur=$(this).closest(".step").data("step");
    toStep(cur-1);
  });

  // range顯示
  $("#selfScore").on("input",e=>$("#selfScoreShow").text(e.target.value));
  $("#peerScore").on("input",e=>$("#peerScoreShow").text(e.target.value));

  // 儲存單位互評
  $("#savePeer").click(function(){
    const member=$("#peerMember").val();
    if(!member) return alert("請選擇組員");
    const works=$("input[name=peerWork]:checked").map((_,e)=>e.value).get();
    const score=$("#peerScore").val();
    const cmt=$("#peerComment").val();
    if(!cmt) return alert("請填寫理由");
    peerRecords.push({member,works,score,comment:cmt});
    formData.peers=peerRecords;
    saveDraft();
    // reset
    $("#peerMember").val("");
    $("input[name=peerWork]").prop("checked",false);
    $("#peerScore").val(5); $("#peerScoreShow").text(5);
    $("#peerComment").val("");
    refreshPeerSelect();
    if(peerRecords.length>=4){
      genPreview(); toStep(8);
    }else{
      $("#peerIdx").text(peerRecords.length+1);
    }
  });

  // 生成互評工作 checkbox
  genCheckBox(worksArr,"peerWorks","peerWork");

  // 表單送出
  $("#evalForm").submit(function(e){
    e.preventDefault();
    const payload={...formData};
    $.post(endpoint,JSON.stringify(payload))
      .done(()=>{
        $("#evalForm").addClass("d-none");
        $("#finishBox").removeClass("d-none");
        localStorage.removeItem("evalData");
      })
      .fail(()=>alert("送出失敗，請稍後再試"));
  });
});

/***** 其他函式 *****/
function refreshPeerSelect(){
  $("#peerMember option").each(function(){
    const val=$(this).val();
    if(!val) return;
    const done=peerRecords.some(p=>p.member===val) || val===formData.self;
    $(this).toggleClass("evaluated",done);
  });
}
function genPreview(){
  let html=`<h5>班級：${formData.class}　組別：第${parseInt(formData.group)+1}組　姓名：${formData.self}</h5>`;
  html+=`<h6>🔧 自評工作：</h6><p>${formData.selfWorks?.join("、")}</p>`;
  html+=`<h6>💪 投入程度：</h6><p>${(formData.selfEfforts||[]).concat(formData.selfEffortExtra||[]).join("、")}</p>`;
  html+=`<h6>📊 分數：</h6><p>${formData.selfScore}/10</p>`;
  html+=`<h6>✏️ 自評敘述：</h6><p>${formData.selfComment}</p><hr>`;
  formData.peers.forEach((p,i)=>{
    html+=`<h6>互評${i+1}：${p.member}</h6>
      <p>🔍 工作：${p.works.join("、")}</p>
      <p>📈 分數：${p.score}/10</p>
      <p>🖋️ 理由：${p.comment}</p><hr>`;
  });
  $("#previewBox").html(html);
}
