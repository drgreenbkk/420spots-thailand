import { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── MAPTILER KEY ─────────────────────────────────────────────────────────────
// Get a free key at maptiler.com and replace the string below
const MAPTILER_KEY = 'YOUR_MAPTILER_KEY';

// ─── THEME ────────────────────────────────────────────────────────────────────
const BG     = '#080c0a';
const BG2    = '#0f1511';
const BG3    = '#141a16';
const NEON   = '#00ff88';
const BORDER = '#1a2e22';
const TEXT1  = '#e8f5ee';
const TEXT2  = '#7a9e8a';
const TEXT3  = '#3d5c47';

// ─── SPOTS ────────────────────────────────────────────────────────────────────
const INIT_SPOTS = [
  { id:1,  name:'Dr. Green Bangkok',     city:'Bangkok',     area:'Asok',        lat:13.7376, lng:100.5613, type:'dispensary', vibe:'Premium Clinic',  rating:4.9, reviews:312, description:'Licensed medical cannabis dispensary & clinic on Sukhumvit 21. Open 24/7, premium strains, rooftop smoking lounge next door.',              tags:['medical','24/7','premium']       },
  { id:2,  name:'High Society Rooftop',  city:'Bangkok',     area:'Silom',       lat:13.7270, lng:100.5310, type:'lounge',     vibe:'Rooftop Chill',   rating:4.6, reviews:189, description:'Open-air rooftop lounge with panoramic Bangkok skyline views. Cannabis-friendly terrace above the Silom nightlife strip.',             tags:['rooftop','views','social']       },
  { id:3,  name:'Green Garden Cafe',     city:'Chiang Mai',  area:'Nimman',      lat:18.7958, lng:98.9658,  type:'cafe',       vibe:'Artsy Cafe',      rating:4.7, reviews:241, description:'Cozy artsy cafe on Nimman Road with designated smoking garden and curated local sativa strains.',                                       tags:['cafe','artsy','garden']          },
  { id:4,  name:'Pai Valley Sessions',   city:'Pai',         area:'Town Center', lat:19.3589, lng:98.4390,  type:'lounge',     vibe:'Mountain Chill',  rating:4.8, reviews:156, description:'Legendary Pai hangout. Live music, mountain air, bamboo lounge. The best landrace strains in northern Thailand.',                       tags:['live music','mountains','chill'] },
  { id:5,  name:'Koh Samui Sunset',      city:'Koh Samui',   area:'Chaweng',     lat:9.5324,  lng:100.0675, type:'beach',      vibe:'Beach Vibes',     rating:4.5, reviews:203, description:'Beachfront designated area on Chaweng Beach with sunset views. Pre-rolls served with cocktails at golden hour.',                        tags:['beach','sunset','island']        },
  { id:6,  name:'Phuket High Club',      city:'Phuket',      area:'Patong',      lat:7.8966,  lng:98.3021,  type:'club',       vibe:'Party Scene',     rating:4.3, reviews:178, description:'Party-friendly spot in the heart of Patong. Dedicated outdoor smoking lounge with DJ nights and party packages.',                       tags:['nightlife','party','outdoor']    },
  { id:7,  name:'The Green Room BKK',    city:'Bangkok',     area:'Thonglor',    lat:13.7298, lng:100.5839, type:'lounge',     vibe:'Luxury Lounge',   rating:4.8, reviews:290, description:'Luxury members lounge in Thonglor. Curated strains, live jazz, dim lighting. The most refined cannabis spot in Bangkok.',              tags:['luxury','members','jazz']        },
  { id:8,  name:'Phangan Sacred Garden', city:'Koh Phangan', area:'Haad Rin',    lat:9.6769,  lng:100.0681, type:'garden',     vibe:'Festival Spirit', rating:4.6, reviews:167, description:'Legendary island garden near Full Moon Party beach. Spiritual, communal, open-air with hammocks and stargazing.',                       tags:['island','festival','garden']     },
  { id:9,  name:'Chiang Rai Highlands',  city:'Chiang Rai',  area:'Mae Chan',    lat:19.9105, lng:99.8347,  type:'outdoor',    vibe:'Nature Escape',   rating:4.7, reviews:89,  description:'Open-air highland spot near the Golden Triangle. Pure mountain air, scenic rice fields, local hill tribe strains.',                    tags:['nature','highland','scenic']     },
  { id:10, name:'Hua Hin Terrace',       city:'Hua Hin',     area:'Beach Road',  lat:12.5577, lng:99.9604,  type:'cafe',       vibe:'Seaside Relax',   rating:4.4, reviews:134, description:'Laid-back seaside terrace on the beach road. Family-owned, local strains, sea breeze and Thai pastries.',                            tags:['seaside','local','relaxed']      },
];

const TYPE_CFG = {
  dispensary: { neon:'#00ff88', label:'Dispensary', icon:'⚕' },
  lounge:     { neon:'#ff6b35', label:'Lounge',     icon:'◉' },
  cafe:       { neon:'#ffd93d', label:'Cafe',       icon:'◈' },
  beach:      { neon:'#00d4ff', label:'Beach',      icon:'◇' },
  club:       { neon:'#c77dff', label:'Club',       icon:'◆' },
  garden:     { neon:'#69ff47', label:'Garden',     icon:'◎' },
  outdoor:    { neon:'#a8ff3e', label:'Outdoor',    icon:'△' },
};
const TYPES = ['all', ...Object.keys(TYPE_CFG)];

// ─── MARKER FACTORIES ─────────────────────────────────────────────────────────
function makeMarker(spot, isSelected) {
  const neon = TYPE_CFG[spot.type]?.neon || NEON;
  const s    = isSelected ? 16 : 10;
  const glow = isSelected ? 20 : 8;
  const pulse = isSelected
    ? `<div style="position:absolute;top:50%;left:50%;
        width:${s * 3}px;height:${s * 3}px;
        margin-left:-${s * 1.5}px;margin-top:-${s * 1.5}px;
        border-radius:50%;border:1.5px solid ${neon};
        opacity:.5;animation:pulse-ring 1.8s ease-out infinite;"></div>`
    : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;display:flex;align-items:center;
             justify-content:center;width:${s*3}px;height:${s*3}px;">
             ${pulse}
             <div style="width:${s}px;height:${s}px;border-radius:50%;
               background:${neon};
               box-shadow:0 0 ${glow}px ${neon},0 0 ${glow*2}px ${neon}55;
               border:1.5px solid rgba(255,255,255,.2);"></div>
           </div>`,
    iconSize:   [s * 3, s * 3],
    iconAnchor: [s * 1.5, s * 1.5],
  });
}

function makePendingMarker() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;
             background:#ff6b35;
             box-shadow:0 0 16px #ff6b35,0 0 32px #ff6b3555;
             border:2px solid rgba(255,255,255,.2);
             animation:pulse-ring 1s ease-out infinite;"></div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const markersRef = useRef([]);   // { id, marker } pairs
  const pendingRef = useRef(null);
  const selectedId = useRef(null); // track without re-rendering markers

  const [spots,      setSpots]      = useState(INIT_SPOTS);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [search,     setSearch]     = useState('');
  const [aiOpen,     setAiOpen]     = useState(false);
  const [addMode,    setAddMode]    = useState(false);
  const [pendingPos, setPendingPos] = useState(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [form,       setForm]       = useState({ name:'', city:'', area:'', type:'dispensary', description:'' });
  const [msgs,       setMsgs]       = useState([{ role:'assistant', content:"🌿 Hey! I'm your 420 guide for Thailand. Ask me about the best spots by vibe, city, or what you're feeling tonight." }]);
  const [aiInput,    setAiInput]    = useState('');
  const [aiLoading,  setAiLoading]  = useState(false);
  const [apiKey,     setApiKey]     = useState(() => localStorage.getItem('420_api_key') || '');
  const [showKey,    setShowKey]    = useState(false);
  const msgEnd = useRef(null);

  const filtered = spots.filter(s => {
    const okType = filter === 'all' || s.type === filter;
    const q = search.toLowerCase();
    return okType && (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
  });

  // ── Init map (runs once) ───────────────────────────────────────────────────
  useEffect(() => {
    if (mapInst.current) return;
    const map = L.map(mapRef.current, { center:[13.5, 101.0], zoom:6, zoomControl:false });
    const useMT = MAPTILER_KEY !== 'YOUR_MAPTILER_KEY';
    L.tileLayer(
      useMT
        ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: useMT
          ? '© <a href="https://www.maptiler.com">MapTiler</a> © <a href="https://www.openstreetmap.org">OSM</a>'
          : '© OpenStreetMap contributors',
      }
    ).addTo(map);
    L.control.zoom({ position:'bottomright' }).addTo(map);
    mapInst.current = map;
  }, []);

  // ── Map click → place pending pin ─────────────────────────────────────────
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    const fn = e => { if (addMode) setPendingPos({ lat: e.latlng.lat, lng: e.latlng.lng }); };
    map.on('click', fn);
    map.getContainer().style.cursor = addMode ? 'crosshair' : '';
    return () => map.off('click', fn);
  }, [addMode]);

  // ── Pending (orange) pin ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    pendingRef.current?.remove();
    pendingRef.current = null;
    if (pendingPos) {
      pendingRef.current = L.marker([pendingPos.lat, pendingPos.lng], { icon: makePendingMarker() }).addTo(map);
    }
  }, [pendingPos]);

  // ── Spot markers — only re-draw when the filtered list changes.
  //    Selection updates marker icons via updateMarkerIcons() below.
  useEffect(() => {
    const map = mapInst.current;
    if (!map) return;
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current = [];
    filtered.forEach(spot => {
      const isSelected = selectedId.current === spot.id;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: makeMarker(spot, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(map);
      marker.on('click', () => selectSpot(spot));
      markersRef.current.push({ id: spot.id, marker });
    });
  }, [filtered]); // ← intentionally excludes `selected`

  // ── Update only marker icons when selection changes (no full redraw) ───────
  useEffect(() => {
    selectedId.current = selected?.id ?? null;
    markersRef.current.forEach(({ id, marker }) => {
      const spot = spots.find(s => s.id === id);
      if (!spot) return;
      const isSelected = id === selected?.id;
      marker.setIcon(makeMarker(spot, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    });
  }, [selected]);

  // ── Scroll AI to bottom ────────────────────────────────────────────────────
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs]);

  // ── Select a spot ──────────────────────────────────────────────────────────
  const selectSpot = useCallback((spot) => {
    setSelected(spot);
    mapInst.current?.flyTo([spot.lat, spot.lng], Math.max(mapInst.current.getZoom(), 13), { duration: 0.7 });
  }, []);

  // ── AI send ────────────────────────────────────────────────────────────────
  const sendAI = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const txt = aiInput.trim();
    setAiInput('');
    const next = [...msgs, { role:'user', content:txt }];
    setMsgs(next);
    setAiLoading(true);
    const ctx = spots.map(s => `${s.name} (${s.city}) — ${s.type} ★${s.rating}. ${s.description}`).join('\n');
    const key = apiKey || localStorage.getItem('420_api_key') || '';
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are the AI guide for 420 Spots Thailand. Be chill, concise, helpful. Use emojis sparingly. Cannabis is legal medicinally in Thailand.\n\nSpots:\n${ctx}`,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const d = await r.json();
      setMsgs(p => [...p, { role:'assistant', content: d.content?.[0]?.text || 'Try again 🙏' }]);
    } catch {
      setMsgs(p => [...p, { role:'assistant', content:'Connection error — check your API key 🔑' }]);
    }
    setAiLoading(false);
  };

  // ── Submit new spot ────────────────────────────────────────────────────────
  const submitSpot = () => {
    if (!form.name || !pendingPos) return;
    const newSpot = {
      id: Date.now(), ...form,
      lat: pendingPos.lat, lng: pendingPos.lng,
      rating: 0, reviews: 0, vibe: 'New Spot', tags: [],
    };
    setSpots(p => [...p, newSpot]);
    setSubmitted(true);
  };

  const closeAdd = () => {
    setAddMode(false);
    setPendingPos(null);
    setSubmitted(false);
    setForm({ name:'', city:'', area:'', type:'dispensary', description:'' });
    pendingRef.current?.remove();
    pendingRef.current = null;
    mapInst.current.getContainer().style.cursor = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:BG, fontFamily:"'DM Mono',monospace", overflow:'hidden', color:TEXT1 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:${BORDER}; border-radius:2px; }
        .tap { -webkit-tap-highlight-color:transparent; cursor:pointer; outline:none; border:none; }
        .fade { animation:fadeUp .18s ease; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0% { transform:scale(.8); opacity:.8; } 100% { transform:scale(2.4); opacity:0; } }
        @keyframes glow { 0%,100% { opacity:.55; } 50% { opacity:1; } }
        .nbtn {
          background:transparent; border:1px solid ${NEON}; color:${NEON};
          font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.08em;
          padding:6px 13px; border-radius:3px; cursor:pointer;
          transition:all .15s; text-transform:uppercase; white-space:nowrap; flex-shrink:0;
        }
        .nbtn:hover  { background:${NEON}18; box-shadow:0 0 10px ${NEON}44; }
        .nbtn.on     { background:${NEON}; color:${BG}; font-weight:500; box-shadow:0 0 14px ${NEON}66; }
        .nbtn:disabled { opacity:.3; cursor:default; pointer-events:none; }
        .idk {
          width:100%; background:${BG3}; border:1px solid ${BORDER}; color:${TEXT1};
          padding:9px 13px; border-radius:5px; font-size:12px;
          font-family:'DM Mono',monospace; outline:none; transition:border-color .15s;
        }
        .idk:focus          { border-color:${NEON}77; }
        .idk::placeholder   { color:${TEXT3}; }
        select.idk option   { background:${BG2}; }
        .cards { display:flex; gap:10px; padding:0 14px 20px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .cards::-webkit-scrollbar { display:none; }
        .dot { display:inline-block; width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .leaflet-control-zoom a { background:${BG2}!important; color:${NEON}!important; border-color:${BORDER}!important; width:32px!important; height:32px!important; line-height:32px!important; font-size:15px!important; box-shadow:none!important; }
        .leaflet-control-attribution { background:${BG}cc!important; color:${TEXT3}!important; font-size:9px!important; }
        .leaflet-control-attribution a { color:${TEXT2}!important; }
        .leaflet-tile-pane { filter:brightness(.88) saturate(.75); }
        .leaflet-pane, .leaflet-map-pane { z-index:1!important; }
        .leaflet-control-container { z-index:10!important; }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div style={{ background:BG, borderBottom:`1px solid ${BORDER}`, zIndex:200, flexShrink:0 }}>

        {/* Logo + search + buttons */}
        <div style={{ padding:'10px 14px 8px', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:'.1em', color:NEON, lineHeight:1, flexShrink:0 }}>
            420 SPOTS
            <span style={{ fontSize:10, color:TEXT2, fontFamily:"'DM Mono',monospace", marginLeft:7, letterSpacing:'.04em' }}>TH</span>
          </div>
          <input
            className="idk tap" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search spots, cities..."
            style={{ flex:1, padding:'7px 12px' }}
          />
          <button className="tap" title="API Key" onClick={() => setShowKey(p => !p)}
            style={{ width:30, height:30, borderRadius:4, background:apiKey?`${NEON}22`:BG3, border:`1px solid ${apiKey?NEON+'55':BORDER}`, color:apiKey?NEON:TEXT2, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center' }}>
            🔑
          </button>
          <button className="tap" title="AI Guide" onClick={() => setAiOpen(true)}
            style={{ width:30, height:30, borderRadius:4, background:BG3, border:`1px solid ${BORDER}`, color:NEON, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
            ◈
          </button>
          <button
            className={`nbtn tap${addMode ? ' on' : ''}`}
            style={{ borderColor:addMode?'#ff6b35':NEON, color:addMode?BG:NEON, background:addMode?'#ff6b35':'transparent' }}
            onClick={() => addMode ? closeAdd() : setAddMode(true)}>
            {addMode ? '✕ EXIT' : '+ ADD'}
          </button>
        </div>

        {/* API key input */}
        {showKey && (
          <div style={{ padding:'0 14px 10px', display:'flex', gap:8 }}>
            <input
              className="idk" type="password" value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-... (Anthropic API key)"
              style={{ flex:1 }}
            />
            <button className="nbtn tap on" onClick={() => { localStorage.setItem('420_api_key', apiKey); setShowKey(false); }}>
              SAVE
            </button>
          </div>
        )}

        {/* Filter pills */}
        <div style={{ display:'flex', gap:6, padding:'0 14px 10px', overflowX:'auto' }}>
          {TYPES.map(t => {
            const cfg  = TYPE_CFG[t];
            const isOn = filter === t;
            const clr  = cfg?.neon || NEON;
            return (
              <button key={t}
                className={`nbtn tap${isOn ? ' on' : ''}`}
                style={{ borderColor:clr, color:isOn?BG:clr, background:isOn?clr:'transparent' }}
                onClick={() => setFilter(t)}>
                {t === 'all' ? '◈ ALL' : `${cfg.icon} ${t.toUpperCase()}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAP CONTAINER ───────────────────────────────────────────────────── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {/* Leaflet map — sits at z-index 0 via CSS override above */}
        <div ref={mapRef} style={{ position:'absolute', inset:0, zIndex:0 }} />

        {/* ── ADD MODE BANNER ─────────────────────────────────────────────── */}
        {addMode && (
          <div style={{
            position:'absolute', top:12, left:'50%', transform:'translateX(-50%)',
            zIndex:500,
            background:BG2, border:'1px solid #ff6b35', borderRadius:5,
            padding:'7px 16px', fontSize:10, color:'#ff6b35',
            letterSpacing:'.08em', textTransform:'uppercase',
            boxShadow:'0 0 18px #ff6b3533', pointerEvents:'none', whiteSpace:'nowrap',
          }}>
            {pendingPos
              ? `📍 ${pendingPos.lat.toFixed(4)}, ${pendingPos.lng.toFixed(4)} — fill details below`
              : '◉ TAP THE MAP TO PIN YOUR SPOT'}
          </div>
        )}

        {/* ── BOTTOM SPOT CARDS ───────────────────────────────────────────── */}
        {!selected && !addMode && (
          <div style={{
            position:'absolute', bottom:0, left:0, right:0,
            zIndex:100,
            background:`linear-gradient(transparent, ${BG} 38%)`,
            paddingTop:36,
            pointerEvents:'auto',
          }}>
            <div style={{ padding:'0 14px 7px', fontSize:9, color:TEXT3, letterSpacing:'.1em', textTransform:'uppercase' }}>
              {filtered.length} SPOTS
            </div>
            <div className="cards">
              {filtered.map(spot => {
                const neon = TYPE_CFG[spot.type]?.neon || NEON;
                return (
                  <div key={spot.id}
                    onClick={() => selectSpot(spot)}
                    style={{
                      flexShrink:0, width:190,
                      background:BG2, border:`1px solid ${BORDER}`,
                      borderRadius:8, padding:13, cursor:'pointer',
                      transition:'border-color .15s, box-shadow .15s',
                      position:'relative', overflow:'hidden',
                    }}>
                    {/* top colour line */}
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:neon, opacity:.85 }} />
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <span className="dot" style={{ background:neon, boxShadow:`0 0 5px ${neon}` }} />
                        <span style={{ fontSize:9, color:neon, letterSpacing:'.1em', textTransform:'uppercase' }}>{spot.type}</span>
                      </div>
                      <span style={{ fontSize:10, color:'#ffd93d' }}>★ {spot.rating || 'NEW'}</span>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:'.05em', color:TEXT1, marginBottom:2, lineHeight:1.2 }}>
                      {spot.name}
                    </div>
                    <div style={{ fontSize:9, color:TEXT2, marginBottom:7 }}>{spot.city} · {spot.area}</div>
                    <div style={{ fontSize:9, color:TEXT2, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {spot.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SPOT DETAIL SHEET ───────────────────────────────────────────── */}
        {selected && !addMode && (() => {
          const neon = TYPE_CFG[selected.type]?.neon || NEON;
          return (
            <div className="fade" style={{
              position:'absolute', bottom:0, left:0, right:0,
              zIndex:100,
              background:BG2,
              borderTop:`1px solid ${neon}55`,
              borderRadius:'14px 14px 0 0',
              padding:'14px 18px 36px',
              maxHeight:'60%', overflowY:'auto',
            }}>
              {/* handle */}
              <div style={{ width:30, height:3, background:BORDER, borderRadius:2, margin:'0 auto 14px' }} />

              {/* header row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                    <span className="dot" style={{ background:neon, boxShadow:`0 0 5px ${neon}` }} />
                    <span style={{ fontSize:9, color:neon, letterSpacing:'.1em', textTransform:'uppercase' }}>{selected.type}</span>
                    <span style={{ fontSize:9, color:TEXT3 }}>· {selected.vibe}</span>
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:'.06em', color:TEXT1, lineHeight:1.1, marginBottom:3 }}>
                    {selected.name}
                  </div>
                  <div style={{ fontSize:10, color:TEXT2 }}>📍 {selected.city} · {selected.area}</div>
                </div>
                <button className="tap" onClick={() => setSelected(null)}
                  style={{ background:BG3, border:`1px solid ${BORDER}`, borderRadius:4, width:28, height:28, fontSize:13, color:TEXT2, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  ✕
                </button>
              </div>

              {/* rating bar */}
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', background:BG3, border:`1px solid ${BORDER}`, borderRadius:7, marginBottom:14 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, color:neon, lineHeight:1, textShadow:`0 0 18px ${neon}88` }}>
                  {selected.rating > 0 ? selected.rating : 'NEW'}
                </div>
                <div>
                  <div style={{ fontSize:12, color:'#ffd93d', letterSpacing:2 }}>
                    {'★'.repeat(Math.round(selected.rating))}{'☆'.repeat(5 - Math.round(selected.rating))}
                  </div>
                  <div style={{ fontSize:9, color:TEXT3 }}>
                    {selected.reviews > 0 ? `${selected.reviews} reviews` : 'Be the first!'}
                  </div>
                </div>
                <button className="nbtn tap" style={{ marginLeft:'auto', borderColor:neon, color:neon }}
                  onClick={() => window.open(`https://www.google.com/maps?q=${selected.lat},${selected.lng}`, '_blank')}>
                  ◈ MAPS
                </button>
              </div>

              {/* description */}
              <p style={{ fontSize:11, color:TEXT2, lineHeight:1.7, marginBottom:12 }}>{selected.description}</p>

              {/* tags */}
              {selected.tags?.length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                  {selected.tags.map(tag => (
                    <span key={tag} style={{ fontSize:9, padding:'2px 8px', borderRadius:3, background:`${neon}18`, color:neon, letterSpacing:'.08em', textTransform:'uppercase', border:`1px solid ${neon}33` }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* AI button */}
              <button className="nbtn tap" style={{ width:'100%', padding:'11px', fontSize:11, textAlign:'center', borderColor:neon, background:`${neon}15`, color:neon }}
                onClick={() => setAiOpen(true)}>
                ◈ ASK AI GUIDE ABOUT THIS SPOT
              </button>
            </div>
          );
        })()}

        {/* ── ADD SPOT FORM ────────────────────────────────────────────────── */}
        {addMode && pendingPos && !submitted && (
          <div className="fade" style={{
            position:'absolute', bottom:0, left:0, right:0,
            zIndex:100,
            background:BG2, borderTop:'1px solid #ff6b3566',
            borderRadius:'14px 14px 0 0',
            padding:'14px 18px 36px',
            maxHeight:'65%', overflowY:'auto',
          }}>
            <div style={{ width:30, height:3, background:BORDER, borderRadius:2, margin:'0 auto 14px' }} />
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:'.08em', color:'#ff6b35', marginBottom:3 }}>
              NEW SPOT
            </div>
            <div style={{ fontSize:9, color:TEXT3, marginBottom:14, letterSpacing:'.06em' }}>
              📍 {pendingPos.lat.toFixed(5)}, {pendingPos.lng.toFixed(5)}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:9 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ fontSize:8, color:TEXT3, marginBottom:4, letterSpacing:'.1em', textTransform:'uppercase' }}>Spot Name *</div>
                <input className="idk" value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="e.g. Green House" />
              </div>
              <div>
                <div style={{ fontSize:8, color:TEXT3, marginBottom:4, letterSpacing:'.1em', textTransform:'uppercase' }}>City</div>
                <input className="idk" value={form.city} onChange={e => setForm(p => ({...p, city:e.target.value}))} placeholder="Bangkok" />
              </div>
              <div>
                <div style={{ fontSize:8, color:TEXT3, marginBottom:4, letterSpacing:'.1em', textTransform:'uppercase' }}>Area</div>
                <input className="idk" value={form.area} onChange={e => setForm(p => ({...p, area:e.target.value}))} placeholder="Sukhumvit" />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <div style={{ fontSize:8, color:TEXT3, marginBottom:4, letterSpacing:'.1em', textTransform:'uppercase' }}>Type</div>
                <select className="idk" value={form.type} onChange={e => setForm(p => ({...p, type:e.target.value}))}>
                  {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:8, color:TEXT3, marginBottom:4, letterSpacing:'.1em', textTransform:'uppercase' }}>Description</div>
              <textarea className="idk" value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} placeholder="Tell us about this spot..." rows={2} style={{ resize:'vertical' }} />
            </div>

            <div style={{ display:'flex', gap:9 }}>
              <button
                className="nbtn tap"
                style={{ flex:1, padding:'10px', borderColor:'#ff6b35', color:BG, background:'#ff6b35', boxShadow:'0 0 14px #ff6b3555', opacity:form.name ? 1 : .5 }}
                onClick={submitSpot} disabled={!form.name}>
                ◉ PIN SPOT
              </button>
              <button className="nbtn tap" style={{ padding:'10px 14px' }} onClick={closeAdd}>CANCEL</button>
            </div>
          </div>
        )}

        {/* ── SUBMIT SUCCESS ───────────────────────────────────────────────── */}
        {addMode && submitted && (
          <div className="fade" style={{
            position:'absolute', bottom:0, left:0, right:0,
            zIndex:100,
            background:BG2, borderTop:`1px solid ${NEON}44`,
            borderRadius:'14px 14px 0 0',
            padding:'32px 24px 48px', textAlign:'center',
          }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, color:NEON, marginBottom:6, textShadow:`0 0 28px ${NEON}` }}>
              PINNED!
            </div>
            <div style={{ fontSize:11, color:TEXT2, marginBottom:24, lineHeight:1.7 }}>
              Your spot is live on the map.<br />Thanks for growing the community 🌿
            </div>
            <button className="nbtn tap on" onClick={closeAdd} style={{ padding:'11px 32px' }}>
              BACK TO MAP
            </button>
          </div>
        )}
      </div>

      {/* ── AI GUIDE (full screen overlay) ──────────────────────────────────── */}
      {aiOpen && (
        <div className="fade" style={{ position:'fixed', inset:0, zIndex:3000, background:BG, display:'flex', flexDirection:'column' }}>

          {/* AI header */}
          <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:32, height:32, borderRadius:4, background:`${NEON}18`, border:`1px solid ${NEON}55`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:NEON, animation:'glow 2s infinite' }}>
              ◈
            </div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:'.08em', color:NEON }}>AI GUIDE</div>
              <div style={{ fontSize:8, color:NEON, letterSpacing:'.1em' }}>● ONLINE</div>
            </div>
            <button className="tap" onClick={() => setAiOpen(false)}
              style={{ marginLeft:'auto', background:BG3, border:`1px solid ${BORDER}`, borderRadius:4, width:28, height:28, fontSize:13, color:TEXT2, display:'flex', alignItems:'center', justifyContent:'center' }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:10 }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth:'85%' }}>
                <div style={{
                  padding:'9px 13px',
                  borderRadius: m.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                  background: m.role === 'user' ? `${NEON}1a` : BG2,
                  border: `1px solid ${m.role === 'user' ? NEON + '33' : BORDER}`,
                  color: TEXT1, fontSize:12, lineHeight:1.7,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ alignSelf:'flex-start' }}>
                <div style={{ padding:'10px 14px', borderRadius:'8px 8px 8px 2px', background:BG2, border:`1px solid ${BORDER}`, color:NEON, fontSize:14, animation:'glow 1s infinite', letterSpacing:4 }}>
                  ◈◈◈
                </div>
              </div>
            )}
            <div ref={msgEnd} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding:'8px 14px', display:'flex', gap:6, overflowX:'auto', borderTop:`1px solid ${BORDER}` }}>
            {['Best in Bangkok?', 'Most chill?', 'Beach spots?', 'For locals?'].map(q => (
              <button key={q} className="nbtn tap" onClick={() => setAiInput(q)}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding:'10px 14px 28px', display:'flex', gap:8, background:BG, borderTop:`1px solid ${BORDER}` }}>
            <input
              className="idk" value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendAI()}
              placeholder="Ask anything about 420 spots in Thailand..."
              style={{ flex:1, borderRadius:4 }}
            />
            <button className="nbtn tap on" onClick={sendAI}
              disabled={aiLoading || !aiInput.trim()}
              style={{ padding:'9px 14px', opacity: aiInput.trim() ? 1 : .4 }}>
              SEND
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
