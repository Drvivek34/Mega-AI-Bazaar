// Mega AI Bazaar home: bazaar cards + search bar with a scope dropdown
// (All bazaars / a specific bazaar). Specific scope searches that bazaar's items.
const GH_USER = "Drvivek34";
let DATA = { bazaars: [] };
const CATCACHE = {}; // id -> items[]

async function load() {
  try {
    DATA = await (await fetch("bazaars.json", { cache: "no-store" })).json();
  } catch (e) {
    console.error(e);
  }
  render(DATA.bazaars);
  renderSubmit(DATA.bazaars);
  fillScope(DATA.bazaars);
  wireSearch();
  wireCardClicks();
}

function repoUrl(b){ return `https://github.com/${GH_USER}/${b.repo}`; }
function submitUrl(b){ return `${repoUrl(b)}/issues/new/choose`; }
function st(r){ r=Math.round(r||0); return "★".repeat(r)+"☆".repeat(5-r); }
function esc(s){ return (s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function toast(m){ let t=document.getElementById("toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);} t.textContent=m; t.className="show"; setTimeout(()=>t.className="",2600); }

function card(b) {
  const chips = b.categories.slice(0,8).map(c=>`<span class="chip">${c}</span>`).join("") +
    (b.categories.length>8?`<span class="chip">+${b.categories.length-8} more</span>`:"");
  return `<article class="card" data-id="${b.id}" style="cursor: pointer;" data-haystack="${esc((b.name+" "+b.tagline+" "+b.description+" "+b.categories.join(" ")).toLowerCase())}">
    <div class="top"><span class="emoji">${b.emoji}</span><h3>${esc(b.name)}</h3></div>
    <div class="tag">${esc(b.tagline)}</div>
    <div class="chips">${chips}</div>
    <div class="actions">
      <a class="btn btn-primary" href="b/${b.id}.html">Browse all items</a>
      <a class="btn btn-ghost" href="${repoUrl(b)}" target="_blank" rel="noopener">GitHub</a>
      <a class="btn btn-ghost" href="${submitUrl(b)}" target="_blank" rel="noopener">➕</a>
    </div></article>`;
}

function render(bazaars){
  document.getElementById("bazaars").innerHTML = bazaars.map(card).join("");
  const cats = bazaars.reduce((n,b)=>n+b.categories.length,0);
  document.getElementById("counts").textContent = `${bazaars.length} bazaars · ${cats} categories · open & community-driven`;
}

function renderSubmit(bazaars){
  document.getElementById("submit-grid").innerHTML = bazaars
    .map(b=>`<a href="${submitUrl(b)}" target="_blank" rel="noopener">${b.emoji} ${esc(b.name)} →</a>`).join("");
}

function fillScope(bazaars){
  const sel=document.getElementById("scope");
  sel.innerHTML = `<option value="all">All bazaars</option>` +
    bazaars.map(b=>`<option value="${b.id}">${b.emoji} ${esc(b.name)}</option>`).join("");
}

async function catalog(id){
  if(CATCACHE[id]) return CATCACHE[id];
  try{
    const r=await fetch(`catalog/${id}.json`,{cache:"no-store"});
    const d=r.ok?await r.json():null;
    CATCACHE[id]=(d&&d.items)||[];
  }catch(e){ CATCACHE[id]=[]; }
  return CATCACHE[id];
}

function wireCardClicks() {
  document.getElementById("bazaars").addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;
    if (e.target.closest("a")) return; // Let buttons handle their links
    const bId = card.dataset.id;
    if (bId) {
      const scope = document.getElementById("scope");
      scope.value = bId;
      scope.dispatchEvent(new Event("change"));
      document.getElementById("top").scrollIntoView({ behavior: "smooth" });
    }
  });
}

function resetScope() {
  const scope = document.getElementById("scope");
  scope.value = "all";
  scope.dispatchEvent(new Event("change"));
}

window.resetScope = resetScope;

function starSpans(bId, url, avg){
  const mine=Number(localStorage.getItem("rate:"+bId+":"+url)||0);
  const shown=mine||Math.round(avg||0);
  let h="";
  for(let n=1;n<=5;n++) h+=`<span class="star ${n<=shown?'on':''} ${mine?'mine':''}" data-n="${n}">★</span>`;
  return h;
}

function wireStars(scope, bId){
  scope.querySelectorAll(".stars").forEach(s=>{
    s.querySelectorAll(".star").forEach(star=>{
      star.addEventListener("click",async e=>{
        e.preventDefault();
        const n=Number(star.dataset.n), url=s.dataset.url;
        localStorage.setItem("rate:"+bId+":"+url,String(n));
        if(window.SB){
          try{
            await window.SB.rate(bId,url,n);
            const a=await window.SB.one(bId,url);
            if(a) s.dataset.avg=a.avg;
            toast("Thanks — rating saved!");
          }
          catch(_){ toast("Couldn't save rating right now."); }
        } else {
          toast("Saved on this device. (Shared ratings activate once Supabase is configured.)");
        }
        s.innerHTML=starSpans(bId,url,Number(s.dataset.avg));
        wireStars(s.parentElement, bId);
      });
    });
  });
}

function rowLI(i, bId){
  return `<li class="row">
    <a class="r-title" href="${i.url}" target="_blank" rel="noopener">${esc(i.title)}</a>
    <span class="r-cat">${esc(i.category)}</span>
    <span class="r-auth">${esc(i.author||"—")}</span>
    <span class="stars" data-url="${esc(i.url)}" data-avg="${i.rating||0}" title="Avg ${i.rating||0} — click to rate">${starSpans(bId,i.url,i.rating)}</span>
  </li>`;
}

function rowsHTML(items, bId){
  const sorted=items.slice().sort((a,b)=>(b.rating||0)-(a.rating||0));
  const shown=sorted.slice(0,300);
  return `<ul class="rows">${shown.map(i=>rowLI(i, bId)).join("")}</ul>`+
    (sorted.length>300?`<p class="notice">Showing 300 of ${sorted.length} — refine your search.</p>`:"");
}

async function renderBazaarInline(bId, q) {
  const res = document.getElementById("results");
  const b = DATA.bazaars.find(x=>x.id===bId);
  if (!b) return;

  // Render baseline shell
  res.innerHTML = `
    <div class="bz-hero" style="border-top: 4px solid ${b.accent || 'var(--accent)'}; margin-bottom:1rem;">
      <div class="bz-top">
        <span class="bz-emoji" style="font-size:2.2rem; margin-right:0.8rem;">${b.emoji}</span>
        <div>
          <h2 style="margin:0; font-size:1.6rem;">${esc(b.name)}</h2>
          <p class="bz-tag" style="margin:0.2rem 0 0; color:var(--muted); font-size:0.95rem;">${esc(b.tagline)}</p>
        </div>
      </div>
      <p class="bz-desc" style="color:var(--muted); margin:0.8rem 0 1rem;">${esc(b.description)}</p>
      <div class="bz-actions" style="display:flex; gap:0.6rem; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="resetScope()">✕ Close Bazaar View</button>
        <a class="btn btn-ghost" href="b/${b.id}.html">Open static page</a>
        <a class="btn btn-ghost" href="${repoUrl(b)}" target="_blank" rel="noopener">GitHub Repo</a>
        <a class="btn btn-ghost" href="${submitUrl(b)}" target="_blank" rel="noopener">➕ Submit Item</a>
      </div>
    </div>
    <div class="bz-controls" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
      <span id="inline-count" class="count" style="color:var(--muted); font-size:0.85rem;"></span>
    </div>
    <div id="inline-app"></div>
  `;

  const inlineApp = document.getElementById("inline-app");
  const inlineCount = document.getElementById("inline-count");

  inlineApp.innerHTML = `<p class="muted">Loading ${esc(b.name)} catalog…</p>`;

  const items = await catalog(bId);

  // Merge live community averages from Supabase
  if (window.SB && items.length) {
    try {
      const agg = await window.SB.aggregates(bId);
      items.forEach(i => {
        const a = agg[i.url];
        if (a) {
          i.rating = a.avg;
          i.count = a.count;
        }
      });
    } catch(e) {
      console.error(e);
    }
  }

  if (!items.length) {
    inlineCount.textContent = `${b.categories.length} categories`;
    inlineApp.innerHTML = `
      <div class="notice">📥 This bazaar's items are being added by our automation — click a category to browse it on GitHub.</div>
      <div class="cat-grid">
        ${b.categories.map(c => `
          <a class="cat-card" href="${repoUrl(b)}/tree/main/${c}" target="_blank" rel="noopener">
            <span>${c.replace(/-/g, ' ')}</span>
            <span class="arrow">Open on GitHub →</span>
          </a>
        `).join("")}
      </div>
    `;
    return;
  }

  if (q) {
    const list = items.filter(i => (i.title + " " + (i.author || "") + " " + i.category).toLowerCase().includes(q));
    inlineCount.textContent = `${list.length} matches`;
    inlineApp.innerHTML = `<ul class="rows">${list.slice(0, 500).map(i => rowLI(i, bId)).join("")}</ul>` +
      (list.length > 500 ? `<p class="notice">Showing first 500 — open the full page or refine search.</p>` : "");
    wireStars(inlineApp, bId);
  } else {
    // Accordions grouped by category
    const groups = {};
    items.forEach(i => (groups[i.category] = groups[i.category] || []).push(i));
    const cats = Object.keys(groups).sort();
    inlineCount.textContent = `${items.length} items · ${cats.length} categories`;

    const top = items.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
    inlineApp.innerHTML = `
      <h3 class="sec" style="margin-top:1rem; font-size:1.1rem; color:var(--ink);">⭐ Top rated <small style="color:var(--muted); font-size:0.8rem;">— click a star to rate</small></h3>
      <ul class="rows">${top.map(i => rowLI(i, bId)).join("")}</ul>
      <h3 class="sec" style="margin-top:1.5rem; font-size:1.1rem; color:var(--ink);">Browse by category <small style="color:var(--muted); font-size:0.8rem;">— click to reveal</small></h3>
      ${cats.map(c => `
        <details class="acc" data-cat="${esc(c)}">
          <summary>${esc(c)} <span class="acc-n">${groups[c].length}</span></summary>
          <div class="acc-body"></div>
        </details>
      `).join("")}
    `;

    wireStars(inlineApp, bId);

    // lazy-render accordion body on open
    inlineApp.querySelectorAll("details.acc").forEach(d => {
      d.addEventListener("toggle", () => {
        if (d.open) {
          const body = d.querySelector(".acc-body");
          if (!body.dataset.done) {
            body.innerHTML = rowsHTML(groups[d.dataset.cat], bId);
            body.dataset.done = "1";
            wireStars(body, bId);
          }
        }
      }, { once: false });
    });
  }
}

function wireSearch(){
  const input=document.getElementById("search");
  const scope=document.getElementById("scope");
  const run=async()=>{
    const q=(input.value||"").trim().toLowerCase();
    const sc=scope.value;
    const grid=document.getElementById("bazaars");
    const res=document.getElementById("results");
    if(sc==="all"){
      res.classList.add("hidden"); grid.classList.remove("hidden");
      document.querySelectorAll(".card").forEach(c=>c.classList.toggle("hidden", !!q && !c.dataset.haystack.includes(q)));
      return;
    }
    // specific bazaar: search and render its items/categories inline on the homepage
    grid.classList.add("hidden"); res.classList.remove("hidden");
    await renderBazaarInline(sc, q);
  };
  input.addEventListener("input",run);
  scope.addEventListener("change",run);
}
load();
