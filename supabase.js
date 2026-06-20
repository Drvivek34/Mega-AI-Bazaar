// Thin Supabase (PostgREST) client for shared ratings + submissions.
// Activates only when config.js sets window.SUPABASE_URL + window.SUPABASE_ANON_KEY.
// The anon key is public by design — protected by Row-Level Security (see supabase/schema.sql).
(function(){
  const URL = (window.SUPABASE_URL||"").replace(/\/$/,"");
  const KEY = window.SUPABASE_ANON_KEY||"";
  if(!URL || !KEY){ window.SB = null; return; }
  const H = (extra)=>Object.assign({apikey:KEY, Authorization:"Bearer "+KEY}, extra||{});
  window.SB = {
    async rate(bazaar,item,rating){
      return fetch(URL+"/rest/v1/ratings",{method:"POST",
        headers:H({"Content-Type":"application/json",Prefer:"return=minimal"}),
        body:JSON.stringify({bazaar,item,rating})});
    },
    async aggregates(bazaar){
      try{
        const r=await fetch(URL+"/rest/v1/rating_aggregates?bazaar=eq."+encodeURIComponent(bazaar)+"&select=item,avg,count",{headers:H()});
        if(!r.ok) return {};
        const m={}; (await r.json()).forEach(x=>m[x.item]={avg:Number(x.avg),count:x.count}); return m;
      }catch(e){ return {}; }
    },
    async one(bazaar,item){
      try{
        const r=await fetch(URL+"/rest/v1/rating_aggregates?bazaar=eq."+encodeURIComponent(bazaar)+"&item=eq."+encodeURIComponent(item)+"&select=avg,count",{headers:H()});
        if(!r.ok) return null; const rows=await r.json(); return rows[0]||null;
      }catch(e){ return null; }
    },
    async submit(payload){
      return fetch(URL+"/rest/v1/submissions",{method:"POST",
        headers:H({"Content-Type":"application/json",Prefer:"return=minimal"}),
        body:JSON.stringify(payload)});
    }
  };
})();
