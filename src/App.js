import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const SPOTS = [
  { id: 1, name: "Dr. Green Bangkok", city: "Bangkok", area: "Asok", lat: 13.7420, lng: 100.5600, type: "dispensary", vibe: "Premium Clinic", rating: 4.9, reviews: 312, description: "Licensed medical cannabis dispensary & clinic. 24/7 operation, premium strains.", tags: ["medical", "24/7", "premium"] },
  { id: 2, name: "High Society Rooftop", city: "Bangkok", area: "Silom", lat: 13.7270, lng: 100.5310, type: "lounge", vibe: "Rooftop Chill", rating: 4.6, reviews: 189, description: "Open-air rooftop lounge with panoramic city views. Cannabis-friendly terrace.", tags: ["rooftop", "views", "social"] },
  { id: 3, name: "Green Garden Cafe", city: "Chiang Mai", area: "Nimman", lat: 18.7980, lng: 98.9680, type: "cafe", vibe: "Artsy Cafe", rating: 4.7, reviews: 241, description: "Cozy artsy cafe in Nimman with designated smoking garden and local strains.", tags: ["cafe", "artsy", "garden"] },
  { id: 4, name: "Pai Valley Sessions", city: "Pai", area: "Town Center", lat: 19.3630, lng: 98.4410, type: "lounge", vibe: "Mountain Chill", rating: 4.8, reviews: 156, description: "Legendary Pai hangout. Live music, mountain air, great vibes.", tags: ["live music", "mountains", "chill"] },
  { id: 5, name: "Koh Samui Sunset", city: "Koh Samui", area: "Chaweng", lat: 9.5120, lng: 100.0610, type: "beach", vibe: "Beach Vibes", rating: 4.5, reviews: 203, description: "Beach-side designated area with sunset views. Best at golden hour.", tags: ["beach", "sunset", "island"] },
  { id: 6, name: "Phuket High Club", city: "Phuket", area: "Patong", lat: 7.8950, lng: 98.2980, type: "club", vibe: "Party Scene", rating: 4.3, reviews: 178, description: "Party-friendly spot in Patong. Dedicated outdoor smoking lounge.", tags: ["nightlife", "party", "outdoor"] },
  { id: 7, name: "The Green Room BKK", city: "Bangkok", area: "Thonglor", lat: 13.7298, lng: 100.5839, type: "lounge", vibe: "Luxury Lounge", rating: 4.8, reviews: 290, description: "Luxury members lounge in Thonglor. Curated strains, jazz, dim lighting.", tags: ["luxury", "members", "jazz"] },
  { id: 8, name: "Phangan Sacred Garden", city: "Koh Phangan", area: "Haad Rin", lat: 9.6740, lng: 100.0580, type: "garden", vibe: "Festival Spirit", rating: 4.6, reviews: 167, description: "Legendary island garden near Full Moon Party. Spiritual, open, communal.", tags: ["island", "festival", "garden"] },
  { id: 9, name: "Chiang Rai Highlands", city: "Chiang Rai", area: "Mae Chan", lat: 20.1300, lng: 99.8780, type: "outdoor", vibe: "Nature Escape", rating: 4.7, reviews: 89, description: "Open-air highland spot near the golden triangle. Pure air, pure vibes.", tags: ["nature", "highland", "scenic"] },
  { id: 10, name: "Hua Hin Terrace", city: "Hua Hin", area: "Beach Road", lat: 12.5680, lng: 99.9580, type: "cafe", vibe: "Seaside Relax", rating: 4.4, reviews: 134, description: "Laid-back seaside terrace. Family-owned, local strains, sea breeze.", tags: ["seaside", "local", "relaxed"] },
];

const C = {
  dispensary: "#16a34a", lounge: "#ea580c", cafe: "#ca8a04",
  beach: "#0284c7", club: "#9333ea", garden: "#15803d", outdoor: "#057857",
};
const IC = {
  dispensary: "🏥", lounge: "🛋️", cafe: "☕",
  beach: "🏖️", club: "🎧", garden: "🌿", outdoor: "🏔️",
};
const TYPES = ["all", "dispensary", "lounge", "cafe", "beach", "club", "garden", "outdoor"];

// Fix Leaflet default marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function App() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "assistant", content: "🌿 Hey! I'm your 420 Spots Thailand AI guide. Ask me about the best spots by vibe, city, or what you're looking for tonight." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", area: "", type: "", description: "" });
  const msgEnd = useRef(null);

  const spots = SPOTS.filter(s => {
    const ok = filter === "all" || s.type === filter;
    const q = search.toLowerCase();
    return ok && (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.tags.some(t => t.includes(q)));
  });

  // Init Leaflet map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [13.0, 101.5],
      zoom: 6,
      zoomControl: false,
    });

    // OpenStreetMap tiles — works great in production
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Render markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    spots.forEach(spot => {
      const color = C[spot.type] || '#16a34a';
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            position:relative;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              background:${color};
              color:#fff;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              width:32px;height:32px;
              border:2px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="transform:rotate(45deg);font-size:14px;">${IC[spot.type]}</span>
            </div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="font-family:-apple-system,sans-serif;min-width:160px;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#202124;margin-bottom:2px">${spot.name}</div>
          <div style="font-size:11px;color:#5f6368;margin-bottom:4px">${spot.city} · ${spot.area}</div>
          <div style="font-size:12px;color:#f59e0b;font-weight:600">★ ${spot.rating} <span style="color:#5f6368;font-weight:400">(${spot.reviews})</span></div>
        </div>
      `, { closeButton: false });

      marker.on('click', () => {
        setSelected(spot);
        mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
      });
      marker.on('mouseover', () => marker.openPopup());
      marker.on('mouseout', () => marker.closePopup());

      markersRef.current.push(marker);
    });
  }, [filter, search]);

  // Fly to selected
  useEffect(() => {
    if (selected && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selected.lat, selected.lng], 14, { duration: 0.8 });
    }
  }, [selected]);

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const sendMsg = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim(); setInput('');
    setMsgs(p => [...p, { role: 'user', content: txt }]);
    setLoading(true);
    const ctx = SPOTS.map(s => `${s.name} (${s.city}) - ${s.type}, ★${s.rating}. ${s.description}`).join('\n');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are the AI guide for 420 Spots Thailand. Be chill, helpful. Cannabis legal medicinally in Thailand since 2022. Keep replies concise, use emojis.\n\nSpots:\n${ctx}`,
          messages: [...msgs, { role: 'user', content: txt }].map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const d = await r.json();
      setMsgs(p => [...p, { role: 'assistant', content: d.content?.[0]?.text || 'Try again 🙏' }]);
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'Connection issue 🙏' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', fontFamily: "-apple-system,'Helvetica Neue',sans-serif", overflow: 'hidden' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
        .tap { -webkit-tap-highlight-color: transparent; cursor: pointer; outline: none; border: none; }
        .fade-in { animation: fi .2s ease; }
        @keyframes fi { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:translateY(0) } }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; border: none !important; }
        .leaflet-popup-content { margin: 10px 14px !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-control-zoom a { background:#fff !important; color:#3c4043 !important; border-color:#e0e0e0 !important; width:36px !important; height:36px !important; line-height:36px !important; font-size:18px !important; box-shadow:0 2px 6px rgba(0,0,0,0.15) !important; }
        .leaflet-control-attribution { font-size:9px !important; background:rgba(255,255,255,0.7) !important; }
        .card-scroll { display:flex; gap:10px; padding:0 12px 16px; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; }
        .card-scroll::-webkit-scrollbar { display:none; }
        .spot-card { flex-shrink:0; width:220px; background:#fff; border-radius:14px; padding:14px; box-shadow:0 2px 12px rgba(0,0,0,0.12); scroll-snap-align:start; cursor:pointer; transition:transform .15s ease; }
        .spot-card:active { transform:scale(0.97); }
        .list-item:active { background:#f1f3f4 !important; }
        .typing-dot { display:inline-block; width:6px; height:6px; background:#1a73e8; border-radius:50%; animation:tb 1s infinite; margin:0 2px; }
        .typing-dot:nth-child(2){animation-delay:.2s} .typing-dot:nth-child(3){animation-delay:.4s}
        @keyframes tb { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
      `}</style>

      {/* TOP BAR */}
      <div style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', zIndex: 20, flexShrink: 0 }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f1f3f4', borderRadius: 24, padding: '8px 14px', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🌿</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 420 spots in Thailand" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: '#202124', fontFamily: 'inherit' }} />
            {search && <button className="tap" onClick={() => setSearch('')} style={{ background: 'transparent', color: '#5f6368', fontSize: 16 }}>✕</button>}
          </div>
          <button className="tap" onClick={() => setAgentOpen(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: '#e8f5e9', border: '2px solid #16a34a', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</button>
          <button className="tap" onClick={() => setAddMode(true)} style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a73e8', border: 'none', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 12px 10px', overflowX: 'auto' }}>
          {TYPES.map(t => (
            <button key={t} className="tap" onClick={() => setFilter(t)} style={{ flexShrink: 0, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: filter === t ? '#e8f5e9' : '#f1f3f4', border: filter === t ? '1.5px solid #16a34a' : '1.5px solid transparent', color: filter === t ? '#16a34a' : '#3c4043' }}>
              {t === 'all' ? '🗺 All' : `${IC[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* MAP + OVERLAYS */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />

        {/* BOTTOM CARDS */}
        {!selected && !showList && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <button className="tap" onClick={() => setShowList(true)} style={{ background: '#fff', borderRadius: 20, padding: '6px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', border: 'none', fontSize: 12, color: '#3c4043', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                {spots.length} spots · See list
              </button>
            </div>
            <div className="card-scroll">
              {spots.map(spot => (
                <div key={spot.id} className="spot-card" onClick={() => setSelected(spot)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: C[spot.type] }} />
                      <span style={{ fontSize: 10, color: C[spot.type], fontWeight: 600, textTransform: 'uppercase' }}>{spot.type}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>★ {spot.rating}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#202124', marginBottom: 2 }}>{IC[spot.type]} {spot.name}</div>
                  <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 6 }}>{spot.city} · {spot.area}</div>
                  <div style={{ fontSize: 11, color: '#3c4043', lineHeight: 1.4, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{spot.description}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {spot.tags.slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: `${C[spot.type]}18`, color: C[spot.type], fontWeight: 600 }}>#{tag}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SELECTED SPOT SHEET */}
        {selected && (
          <div className="fade-in" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#fff', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', padding: '14px 18px', maxHeight: '55%', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 12px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#202124', marginBottom: 2 }}>{IC[selected.type]} {selected.name}</div>
                <div style={{ fontSize: 12, color: '#5f6368' }}>📍 {selected.city} · {selected.area}</div>
              </div>
              <button className="tap" onClick={() => setSelected(null)} style={{ background: '#f1f3f4', border: 'none', borderRadius: '50%', width: 30, height: 30, fontSize: 16, color: '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: '#f8f9fa', borderRadius: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#202124' }}>{selected.rating}</span>
              <div>
                <div style={{ fontSize: 13, color: '#f59e0b' }}>{'★'.repeat(Math.round(selected.rating))}</div>
                <div style={{ fontSize: 10, color: '#5f6368' }}>{selected.reviews} reviews</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 10, background: `${C[selected.type]}15`, fontSize: 11, color: C[selected.type], fontWeight: 600 }}>{selected.vibe}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['🗺 Directions', '#1a73e8'], ['🔖 Save', '#ea4335'], ['📤 Share', '#34a853']].map(([label, color]) => (
                <button key={label} className="tap" style={{ flex: 1, padding: '8px 4px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 11, fontWeight: 600 }}>{label}</button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#3c4043', lineHeight: 1.6, marginBottom: 10 }}>{selected.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {selected.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 12, background: `${C[selected.type]}15`, color: C[selected.type], fontWeight: 600 }}>#{tag}</span>)}
            </div>
            <div style={{ padding: '8px 14px', background: '#e8f5e9', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>🌿 Cannabis Friendly Verified</div>
          </div>
        )}

        {/* LIST VIEW */}
        {showList && (
          <div className="fade-in" style={{ position: 'absolute', inset: 0, background: '#fff', overflowY: 'auto', zIndex: 10 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', position: 'sticky', top: 0 }}>
              <button className="tap" onClick={() => setShowList(false)} style={{ background: 'transparent', border: 'none', fontSize: 22, color: '#5f6368' }}>←</button>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#202124' }}>🌿 {spots.length} Spots in Thailand</div>
            </div>
            {spots.map(spot => (
              <div key={spot.id} className="tap list-item" onClick={() => selectSpot(spot)} style={{ padding: '14px 16px', borderBottom: '1px solid #f1f3f4', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${C[spot.type]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{IC[spot.type]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#202124' }}>{spot.name}</div>
                    <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700 }}>★ {spot.rating}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 5 }}>{spot.city} · {spot.area} · {spot.vibe}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {spot.tags.slice(0, 3).map(tag => <span key={tag} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 8, background: `${C[spot.type]}15`, color: C[spot.type], fontWeight: 600 }}>#{tag}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI AGENT */}
      {agentOpen && (
        <div className="fade-in" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#202124' }}>420 AI Guide</div>
                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 500 }}>● Online</div>
              </div>
            </div>
            <button className="tap" onClick={() => setAgentOpen(false)} style={{ background: '#f1f3f4', border: 'none', borderRadius: '50%', width: 32, height: 32, fontSize: 18, color: '#5f6368', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#f8f9fa' }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{ padding: '10px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? '#1a73e8' : '#fff', color: m.role === 'user' ? '#fff' : '#202124', fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>{m.content}</div>
              </div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start' }}><div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div></div>}
            <div ref={msgEnd} />
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid #e0e0e0', display: 'flex', gap: 8, background: '#fff' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Best spot in Bangkok tonight?" style={{ flex: 1, background: '#f1f3f4', border: 'none', color: '#202124', padding: '10px 16px', borderRadius: 24, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button className="tap" onClick={sendMsg} disabled={loading} style={{ background: '#1a73e8', border: 'none', color: '#fff', width: 42, height: 42, borderRadius: '50%', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
          </div>
        </div>
      )}

      {/* SUBMIT MODAL */}
      {addMode && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000055', display: 'flex', alignItems: 'flex-end', zIndex: 3000 }}>
          <div className="fade-in" style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: 22, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            {!submitted ? (
              <>
                <div style={{ width: 36, height: 4, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#202124', marginBottom: 4 }}>Submit a Spot 🌿</div>
                <div style={{ fontSize: 12, color: '#5f6368', marginBottom: 18 }}>Know a cannabis-friendly spot? Add it to the map.</div>
                {[['name', 'Spot Name'], ['city', 'City'], ['area', 'Area / District'], ['type', 'Type'], ['description', 'Description']].map(([k, l]) => (
                  <div key={k} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#5f6368', marginBottom: 4, fontWeight: 600 }}>{l}</div>
                    <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ width: '100%', background: '#f1f3f4', border: '1px solid #e0e0e0', color: '#202124', padding: '10px 14px', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="tap" onClick={() => setSubmitted(true)} style={{ flex: 1, background: '#16a34a', color: '#fff', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 700 }}>Submit for Review</button>
                  <button className="tap" onClick={() => setAddMode(false)} style={{ background: '#f1f3f4', color: '#5f6368', padding: '13px 16px', borderRadius: 12, fontSize: 14 }}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🌿</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#202124', marginBottom: 8 }}>Spot Submitted!</div>
                <div style={{ fontSize: 13, color: '#5f6368', marginBottom: 24 }}>We'll review and add it to the map within 24h.</div>
                <button className="tap" onClick={() => { setAddMode(false); setSubmitted(false); setForm({ name: '', city: '', area: '', type: '', description: '' }); }} style={{ background: '#16a34a', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 14, fontWeight: 700 }}>Back to Map</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function selectSpot(spot) {
    setSelected(spot);
    setShowList(false);
    if (mapInstanceRef.current) mapInstanceRef.current.flyTo([spot.lat, spot.lng], 14, { duration: 0.8 });
  }
}
