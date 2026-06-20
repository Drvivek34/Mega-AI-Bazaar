// Per-bazaar page: search box + category accordions (click-to-reveal) with GitHub links,
// star ratings next to each item, and a quick-submit (pre-filled GitHub issue).
const GH_USER = "Drvivek34";
const ID = window.BAZAAR_ID;
// Optional shared-ratings backend. If set (e.g. by a future config.js), ratings POST here.
const RATINGS_ENDPOINT = window.RATINGS_ENDPOINT || null;

function st(r){ r=Math.round(r||0); return "★".repeat(r)+"☆".repeat(5-r); }
function repoUrl(b){ return `https://github.com/${GH_USER}/${b.repo}`; }
function noun(b){ return b.name.replace(/ Bazaar$/,"").toLowerCase(); }
async function getJSON(p){ try{const r=await fetch(p,{cache:"no-store"});return r.ok?await r.json():null;}catch(e){return null;} }
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

let B=null, ITEMS=[];

async function main(){
  const meta = await getJSON("../bazaars.json");
  B = meta && meta.bazaars.find(x=>x.id===ID);
  if(!B){ document.getElementById("app").innerHTML="<p>Unknown bazaar.</p>"; return; }
  document.title = `${B.name} — all items | Mega AI Bazaar`;
  document.getElementById("crumb").textContent = B.name;
  document.getElementById("hero").innerHTML = `
    <div class="bz-top"><span class="bz-emoji">${B.emoji}</span>
      <div><h1>${esc(B.name)}</h1><p class="bz-tag">${esc(B.tagline)}</p></div></div>
    <p class="bz-desc">${esc(B.description)}</p>
    <div class="bz-actions">
      <button class="btn btn-primary" id="quickSubmit">➕ Submit a ${esc(noun(B))}</button>
      <a class="btn btn-ghost" href="${repoUrl(B)}/issues/new/choose" target="_blank" rel="noopener">Form on GitHub</a>
      <a class="btn btn-ghost" href="${repoUrl(B)}" target="_blank" rel="noopener">View repo</a>
    </div>
    <div id="submitPanel" class="submit-panel hidden"></div>`;
  document.getElementById("quickSubmit").addEventListener("click",toggleSubmit);

  const cat = await getJSON(`../catalog/${ID}.json`);
  ITEMS = (cat && cat.items) || [];
  // Merge live community averages from Supabase, if configured.
  if(window.SB && ITEMS.length){
    const agg = await window.SB.aggregates(ID);
    ITEMS.forEach(i=>{ const a=agg[i.url]; if(a){ i.rating=a.avg; i.count=a.count; } });
  }
  document.getElementById("controls").innerHTML = `
    <input id="q" type="search" placeholder="🔍 Search ${ITEMS.length||B.categories.length} ${ITEMS.length?'items':'categories'} in ${esc(B.name)}…" autocomplete="off"/>
    <span id="count" class="count"></span>`;
  document.getElementById("q").addEventListener("input",render);
  render();
}

function render(){
  const q=(document.getElementById("q").value||"").trim().toLowerCase();
  const app=document.getElementById("app");
  if(!ITEMS.length){ return renderCategories(app,q); }      // no catalog yet
  if(q){ return renderSearch(app,q); }                       // flat search results
  renderAccordions(app);                                     // default: accordions
}

// ----- accordions (click to reveal) grouped by category -----
function renderAccordions(app){
  const groups={};
  ITEMS.forEach(i=>(groups[i.category]=groups[i.category]||[]).push(i));
  const cats=Object.keys(groups).sort();
  document.getElementById("count").textContent=`${ITEMS.length} items · ${cats.length} categories`;
  const top=ITEMS.slice().sort((a,b)=>(b.rating||0)-(a.rating||0)).slice(0,15);
  app.innerHTML = `<h3 class="sec">⭐ Top rated <small>— click a star to rate</small></h3>
    <ul class="rows">${top.map(rowLI).join("")}</ul>
    <h3 class="sec">Browse by category <small>— click to reveal</small></h3>` +
    cats.map(c=>`
    <details class="acc" data-cat="${esc(c)}">
      <summary>${esc(c)} <span class="acc-n">${groups[c].length}</span></summary>
      <div class="acc-body"></div>
    </details>`).join("");
  wireStars(app); // wire the Top-rated list immediately
  // lazy-render each category's rows on first open
  app.querySelectorAll("details.acc").forEach(d=>{
    d.addEventListener("toggle",()=>{
      if(d.open){
        const body=d.querySelector(".acc-body");
        if(!body.dataset.done){ body.innerHTML=rowsHTML(groups[d.dataset.cat]); body.dataset.done="1"; wireStars(body); }
      }
    },{once:false});
  });
}

function renderSearch(app,q){
  const list=ITEMS.filter(i=>(i.title+" "+(i.author||"")+" "+i.category).toLowerCase().includes(q));
  document.getElementById("count").textContent=`${list.length} match`;
  app.innerHTML = `<ul class="rows">${list.slice(0,2000).map(rowLI).join("")}</ul>`+
    (list.length>2000?`<p class="notice">Showing first 2,000 — refine your search.</p>`:"");
  wireStars(app);
}

function renderCategories(app,q){
  const cats=B.categories.filter(c=>!q||c.includes(q));
  document.getElementById("count").textContent=`${cats.length} categories`;
  app.innerHTML = `<div class="notice">📥 This bazaar's items are being added by our automation — click a category to browse it on GitHub.</div>`+
    cats.map(c=>`<a class="cat-card" href="${repoUrl(B)}/tree/main/${c}" target="_blank" rel="noopener">
      <span>${c.replace(/-/g,' ')}</span><span class="arrow">Open on GitHub →</span></a>`).join("");
}

function rowsHTML(items){
  const sorted=items.slice().sort((a,b)=>(b.rating||0)-(a.rating||0));
  const shown=sorted.slice(0,300);
  return `<ul class="rows">${shown.map(rowLI).join("")}</ul>`+
    (sorted.length>300?`<p class="notice">Showing 300 of ${sorted.length} — use the search box above to find a specific one.</p>`:"");
}
function rowLI(i){
  return `<li class="row">
    <a class="r-title" href="${i.url}" target="_blank" rel="noopener">${esc(i.title)}</a>
    <span class="r-cat">${esc(i.category)}</span>
    <span class="r-auth">${esc(i.author||"—")}</span>
    <span class="stars" data-url="${esc(i.url)}" data-avg="${i.rating||0}" title="Avg ${i.rating||0} — click to rate">${starSpans(i.url,i.rating)}</span>
  </li>`;
}
function starSpans(url,avg){
  const mine=Number(localStorage.getItem("rate:"+ID+":"+url)||0);
  const shown=mine||Math.round(avg||0);
  let h="";
  for(let n=1;n<=5;n++) h+=`<span class="star ${n<=shown?'on':''} ${mine?'mine':''}" data-n="${n}">★</span>`;
  return h;
}
function wireStars(scope){
  scope.querySelectorAll(".stars").forEach(s=>{
    s.querySelectorAll(".star").forEach(star=>{
      star.addEventListener("click",async e=>{
        e.preventDefault();
        const n=Number(star.dataset.n), url=s.dataset.url;
        localStorage.setItem("rate:"+ID+":"+url,String(n));
        if(window.SB){
          try{ await window.SB.rate(ID,url,n); const a=await window.SB.one(ID,url); if(a) s.dataset.avg=a.avg;
               toast("Thanks — rating saved!"); }
          catch(_){ toast("Couldn't save rating right now."); }
        } else { toast("Saved on this device. (Shared ratings activate once Supabase is configured.)"); }
        s.innerHTML=starSpans(url,Number(s.dataset.avg)); wireStars(s.parentElement);
      });
    });
  });
}

// ----- quick submit: pre-filled GitHub issue -----
function toggleSubmit(){
  const p=document.getElementById("submitPanel");
  if(!p.classList.contains("hidden")){ p.classList.add("hidden"); return; }
  p.classList.remove("hidden");
  p.innerHTML=`
    <h3>Submit a ${esc(noun(B))}</h3>
    <p class="muted">Fill this in — it opens a pre-filled GitHub issue you just confirm.</p>
    <label>Name<input id="sName"/></label>
    <label>Category
      <select id="sCat">${B.categories.map(c=>`<option>${c}</option>`).join("")}</select></label>
    <label>Source URL<input id="sSrc" placeholder="https://…"/></label>
    <label>Author / credit<input id="sAuth"/></label>
    <label>Note<textarea id="sNote" rows="2"></textarea></label>
    <button class="btn btn-primary" id="sGo">Open pre-filled GitHub issue →</button>`;
  document.getElementById("sGo").addEventListener("click",async()=>{
    const name=val("sName"),cat=val("sCat"),src=val("sSrc"),auth=val("sAuth"),note=val("sNote");
    if(!name||!src){ toast("Name and Source URL are required."); return; }
    if(window.SB){
      try{
        const r=await window.SB.submit({bazaar:ID,name,category:cat,source:src,author:auth,note});
        if(r.ok){ toast("Submitted — thank you! 🎉"); document.getElementById("submitPanel").classList.add("hidden"); return; }
      }catch(_){ /* fall through to GitHub */ }
    }
    const title=`[${B.name}] ${name}`;
    const body=`**Name:** ${name}\n**Category:** ${cat}\n**Source:** ${src}\n**Author:** ${auth}\n**Note:** ${note}\n\n_Submitted via the Mega AI Bazaar website._`;
    const url=`${repoUrl(B)}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=submission`;
    window.open(url,"_blank","noopener");
  });
}
function val(id){ return (document.getElementById(id).value||"").trim(); }
function toast(m){ let t=document.getElementById("toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);} t.textContent=m; t.className="show"; setTimeout(()=>t.className="",2600); }

main();
