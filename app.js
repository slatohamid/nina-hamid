const { useState, useEffect, useRef } = React;

const TODAY = "2026-05-31";
const GOAL1 = { label: "🇫🇷 Paris 20km", date: "2026-10-11", days: Math.floor((new Date("2026-10-11") - new Date(TODAY)) / 86400000) };
const GOAL2 = { label: "🇧🇪 Brussels 20km", date: "2027-05-30", days: Math.floor((new Date("2027-05-30") - new Date(TODAY)) / 86400000) };

const PROFILES = {
  slato: { name: "Slato", age: 41, height: 184, gender: "m", color: "#3b82f6", emoji: "👨", goal: "Faza 1: Rehab ahilove → Kardio & Snaga → Trčanje uz Ninu" },
  nina: { name: "Nina", age: 39, height: 162, gender: "f", color: "#ec4899", emoji: "👩", goal: "Mršavljenje + snaga — Paris Oct 2026, Brussels Maj 2027" }
};

const STORAGE_KEY = "mak_v5";
function load() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    const base = { slato: { logs: [], weights: [], doneHistory: [] }, nina: { logs: [], weights: [], doneHistory: [] }, shoppingList: [], shoppingChecked: [], driveUrl: "", uploads: [] };
    return r ? { ...base, ...JSON.parse(r) } : base;
  } catch { return { slato: { logs: [], weights: [], doneHistory: [] }, nina: { logs: [], weights: [], doneHistory: [] }, shoppingList: [], shoppingChecked: [], driveUrl: "", uploads: [] }; }
}
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

const TABS = ["Dashboard", "Raspored", "Trening", "Snaga", "Rehab", "Ahilova", "Prehrana", "Suplementi", "Tjelo", "Uređaji", "🛒 Lista", "📷 Slike", "❓ Upute"];

// Putanje odgovaraju stvarnim folderima na Google Drive-u (Training Hub).
// {P} se zamijeni imenom aktivne osobe (Slato / Nina).
const PHOTO_CATEGORIES = [
  { id: "hrana",      label: "🍽️ Hrana / računi",   path: "04_Slike/Hrana_Racuni" },
  { id: "suplementi", label: "💊 Suplementi",         path: "04_Slike/Suplementi" },
  { id: "krv",        label: "🩸 Krvna slika",        path: "01_Medicinski_Nalazi/{P}/Krvna_Slika" },
  { id: "recepti",    label: "💊 Recepti / ljekovi",  path: "01_Medicinski_Nalazi/{P}/Recepti_Ljekovi" },
  { id: "progres",    label: "📸 Foto napretka",      path: "04_Slike/{P}_Progress" }
];

const scheduleData = {
  slato: { wake: "05:30", days: [
    { day: "Ponedjeljak", time: "06:00", type: "Kardio BEZ trčanja + Rehab", details: "Bicikl / eliptical 30 min (Zona 2). Eccentric heel drops 3×15 + led 15 min poslije.", icon: "🚴", duration: 45, noRun: true, goal: "Održati kardio bazu i hraniti Ahilovu tetivu — bez ijednog udara o tlo.", intensity: "Zona 2 · RPE 5-6" },
    { day: "Utorak", time: "06:00", type: "Snaga gornji dio + Core", details: "Elastične trake — gornji dio + core. Jutarnja mobilnost 15 min.", icon: "💪", duration: 50, goal: "Jačati gornji dio tijela i trup dok Ahilova miruje.", intensity: "Snaga · RPE 7" },
    { day: "Srijeda", time: "06:00", type: "Plivanje ili Bicikl + Rehab", details: "Plivanje 30 min ili bicikl. Eccentric heel drops navečer.", icon: "🏊", duration: 40, noRun: true, goal: "Aktivni oporavak i kardio bez opterećenja tetive.", intensity: "Zona 2 · RPE 5" },
    { day: "Četvrtak", time: "06:00", type: "Snaga noge (modificirano)", details: "Trake — hip thrust, banded clam, squat. BEZ skakanja.", icon: "💪", duration: 45, goal: "Jačati kukove i gluteus bez skoka i bez bola u Ahilovoj.", intensity: "Snaga · RPE 7" },
    { day: "Petak", time: "06:00", type: "Kardio nisko + Rehab", details: "Bicikl 20-25 min lagano + kompletan rehab protokol.", icon: "🚴", duration: 40, noRun: true, goal: "Lagani kardio + puni rehab protokol za tetivu.", intensity: "Zona 1-2 · RPE 4-5" },
    { day: "Subota", time: "07:00", type: "Brza šetnja s Ninom", details: "45-60 min zajedno. Kad kiné odobri → lagano trčanje.", icon: "👫", duration: 60, goal: "Zajednička aktivnost i baza izdržljivosti; trčanje tek kad fizioterapeut dozvoli.", intensity: "Zona 2 · RPE 5-6" },
    { day: "Nedjelja", time: null, type: "Odmor + Foam rolling", details: "Foam rolling lista, istezanje. Rehab obavezno!", icon: "😴", duration: null, goal: "Oporavak — bez njega nema napretka ni zacjeljivanja tetive.", intensity: "Odmor" }
  ]},
  nina: { wake: "05:30", days: [
    { day: "Ponedjeljak", time: "06:00", type: "Trčanje (intervali hod/trk)", details: "5 min hod / 1 min trčanje — 30 min ukupno.", icon: "🏃", duration: 30, goal: "Graditi naviku trčanja; postepeno produžavati trčane intervale.", intensity: "Zona 2-3 · RPE 6" },
    { day: "Utorak", time: "06:00", type: "Fitnes — Snaga (donji dio)", details: "Squats, lunges, hip thrust, leg press — 45 min.", icon: "🏋️", duration: 45, goal: "Jak donji dio i gluteus — temelj za 20 km bez ozljeda.", intensity: "Snaga · RPE 7-8" },
    { day: "Srijeda", time: "06:00", type: "Trčanje (lako)", details: "Kontinuirano lagano trčanje 30-35 min.", icon: "🏃", duration: 35, goal: "Aerobna baza — tempo na kojem možeš pričati.", intensity: "Zona 2 · RPE 5-6" },
    { day: "Četvrtak", time: "06:00", type: "Fitnes — Snaga (gornji + core)", details: "Rows, press, plank, lat pulldown — 45 min.", icon: "🏋️", duration: 45, goal: "Balansiran gornji dio i stabilan trup za bolju trkačku formu.", intensity: "Snaga · RPE 7-8" },
    { day: "Petak", time: "06:00", type: "Trčanje ili kardio", details: "Trčanje 30 min ili eliptical.", icon: "🏃", duration: 30, goal: "Još jedan aerobni stimulus — trčanje ili kardio po izboru.", intensity: "Zona 2 · RPE 6" },
    { day: "Subota", time: "07:00", type: "Dugo trčanje (s Slatom)", details: "Lagano, Ninin tempo. Postepeno povećavati udaljenost.", icon: "👫", duration: 60, goal: "NAJVAŽNIJI trening sedmice — gradi izdržljivost za 20 km.", intensity: "Zona 2 · RPE 5-6" },
    { day: "Nedjelja", time: null, type: "Odmor + Mobilnost", details: "Istezanje, foam rolling, šetnja.", icon: "😴", duration: null, goal: "Oporavak i mobilnost — tijelo jača dok se odmara.", intensity: "Odmor" }
  ]}
};

const strengthData = {
  slato: { title: "Kućni trening — Elastične trake", note: "Sve s trakama. Bez teretane. BEZ opterećenja Ahilove.",
    blocks: [
      { name: "A — Jutarnja mobilnost (svaki dan)", color: "#7c3aed", exercises: [
        { name: "Hip circles", sets: "2×10/strana", tip: "Polako, puna amplituda", yt: "hip+circles+mobility" },
        { name: "World's greatest stretch", sets: "5/strana", tip: "Drži 3 sek", yt: "world+greatest+stretch" },
        { name: "Thoracic rotation", sets: "2×10/strana", tip: "Bok na podu, ramena otvaraj", yt: "thoracic+rotation+mobility" },
        { name: "90/90 hip stretch", sets: "2×45 sek", tip: "Noge u 90°", yt: "90+90+hip+stretch" },
        { name: "Cat-cow", sets: "2×10", tip: "Polagano, diši", yt: "cat+cow+spine" },
        { name: "Ankle circles + calf stretch", sets: "2×10 + 30 sek", tip: "Obavezno za Ahilovu", yt: "ankle+circles+calf+stretch" }
      ]},
      { name: "B — Snaga gornji dio (Uto/Pet)", color: "#3b82f6", exercises: [
        { name: "Banded pull-apart", sets: "3×15", tip: "Medium traka, drži 1 sek", yt: "banded+pull+apart" },
        { name: "Banded row jednoručno", sets: "3×12/strana", tip: "Lakat uz tijelo", yt: "resistance+band+single+arm+row" },
        { name: "Banded push-up", sets: "3×12", tip: "Traka oko leđa", yt: "resistance+band+push+up" },
        { name: "Banded overhead press", sets: "3×12", tip: "Stani na traku", yt: "resistance+band+overhead+press" },
        { name: "Banded bicep curl", sets: "3×15", tip: "Kontrolirano spuštanje", yt: "resistance+band+bicep+curl" },
        { name: "Dead bug (core)", sets: "3×10/strana", tip: "Leđa u pod", yt: "dead+bug+core" }
      ]},
      { name: "C — Snaga noge + glute (Čet)", color: "#10b981", exercises: [
        { name: "Banded squat", sets: "4×15", tip: "Koljena van", yt: "resistance+band+squat" },
        { name: "Banded hip thrust", sets: "4×15", tip: "Stisni glute na vrhu", yt: "resistance+band+hip+thrust" },
        { name: "Banded lateral walk", sets: "3×15/smjer", tip: "Mini squat stalno", yt: "banded+lateral+walk" },
        { name: "Banded clamshell", sets: "3×15/strana", tip: "Peta uz petu", yt: "banded+clamshell" },
        { name: "Single leg glute bridge", sets: "3×12/strana", tip: "Kontrola balance", yt: "single+leg+glute+bridge" },
        { name: "Plank hold", sets: "3×45 sek", tip: "Ravno kao daska", yt: "perfect+plank+form" }
      ]}
    ]
  },
  nina: { title: "Fitnes — Mršavljenje + Snaga", note: "Compound pokreti — troše kalorije i grade mišiće.",
    blocks: [
      { name: "A — Snaga donji dio (Uto)", color: "#ec4899", exercises: [
        { name: "Goblet squat", sets: "4×12", tip: "Duboki squat, koljena van", yt: "goblet+squat+tutorial" },
        { name: "Hip thrust", sets: "4×12", tip: "Heavy — najvažnija za glute", yt: "hip+thrust+proper+form" },
        { name: "Romanian deadlift", sets: "3×12", tip: "Osjeti stretch bedra", yt: "romanian+deadlift" },
        { name: "Walking lunges", sets: "3×10/strana", tip: "Drži bučice", yt: "walking+lunges+form" },
        { name: "Leg press", sets: "3×15", tip: "Visoko stopalo = više glute", yt: "leg+press+foot+placement" },
        { name: "Standing calf raise", sets: "4×20", tip: "Puni raspon", yt: "standing+calf+raise" }
      ]},
      { name: "B — Snaga gornji + core (Čet)", color: "#f59e0b", exercises: [
        { name: "Lat pulldown", sets: "4×12", tip: "Laktovima prema kukovima", yt: "lat+pulldown+proper+form" },
        { name: "Seated cable row", sets: "3×12", tip: "Ramena nazad", yt: "seated+cable+row" },
        { name: "Dumbbell shoulder press", sets: "3×12", tip: "Sjedni, kontrolirano", yt: "dumbbell+shoulder+press" },
        { name: "Dumbbell chest press", sets: "3×12", tip: "Puni raspon", yt: "dumbbell+chest+press" },
        { name: "Face pull", sets: "3×15", tip: "Odlično za ramena", yt: "face+pull+cable" },
        { name: "Plank", sets: "3×45 sek", tip: "Ne spuštaj kuk", yt: "perfect+plank+form" }
      ]},
      { name: "C — HIIT Finisher (10 min, 2×/tjedno)", color: "#ef4444", exercises: [
        { name: "Jumping jacks", sets: "30 sek", tip: "Visok intenzitet", yt: "jumping+jacks" },
        { name: "Mountain climbers", sets: "30 sek", tip: "Core aktivan", yt: "mountain+climbers+form" },
        { name: "Squat jumps", sets: "30 sek", tip: "Mekano dočekaj", yt: "squat+jumps" },
        { name: "High knees", sets: "30 sek", tip: "Ruke aktivne", yt: "high+knees+cardio" },
        { name: "Burpees (modificirani)", sets: "30 sek", tip: "Bez skoka ako su noge umorne", yt: "modified+burpee" }
      ]}
    ]
  }
};

const rehabList = [
  { id: "naproxen", name: "💊 Naproxen Forte 550mg", sets: "1 tableta", times: "Jutro + večer uz hranu", desc: "Dr Fouarge Sep 2025. Ne s ibuprofenom. Bez alkohola.", color: "#ef4444" },
  { id: "kine", name: "🏥 Kineziterapija", sets: "2-3×/sedmično", times: "Do poboljšanja", desc: "Eccentric vježbe, ultrazvuk, masaža dubokog tkiva.", color: "#7c3aed" },
  { id: "ecc_str", name: "Eccentric Heel Drop — ravna noga", sets: "3×15", times: "2× dnevno", desc: "Rub stepenice. Podigni OBJEMA, spusti POLAKO (4 sek) samo bolesnom.", color: "#3b82f6" },
  { id: "ecc_bent", name: "Eccentric Heel Drop — savijena noga", sets: "3×15", times: "2× dnevno", desc: "Koljeno savijeno ~30°. Targeta soleus.", color: "#3b82f6" },
  { id: "foam", name: "Foam roll — list", sets: "60 sek", times: "Svaki dan", desc: "PORED tetive, ne direktno. Suralni nerv je lateralno.", color: "#10b981" },
  { id: "stretch", name: "Statično istezanje lista", sets: "3×30 sek", times: "Post-trening ONLY", desc: "Nikad hladno. Zid ili stepenica.", color: "#10b981" },
  { id: "ice", name: "🧊 Led na tetive", sets: "10-15 min", times: "Nakon aktivnosti", desc: "Nikad direktno na kožu.", color: "#f59e0b" },
  { id: "shoes", name: "👟 Obuća s povišenom petom", sets: "—", times: "Svaki dan", desc: "Heel drop 8-12mm ili ortopedski ulošci.", color: "#f59e0b" }
];

const mealOptions = {
  slato: { macros: { kcal: 2400, protein: 160, carbs: 260, fat: 75 }, options: [
    { num: "Opcija 1", name: "Klasična pileća osnova", meals: [
      { t:"06:00", n:"Doručak", d:"Zobene pahuljice 80g + bademovo mlijeko + borovnice + 2 jaja", k:520 },
      { t:"10:00", n:"Užina", d:"Grčki jogurt 200g + orasi + jabuka", k:310 },
      { t:"13:00", n:"Ručak", d:"Piletina 200g + kvinoja 80g + pečeno povrće + maslinovo ulje", k:720 },
      { t:"16:30", n:"Pre-trening", d:"Banana + badema puter 1 kašika", k:220 },
      { t:"19:30", n:"Večera", d:"Losos 180g + brokula + špinat + maslinovo ulje", k:580 },
      { t:"21:30", n:"Noćna", d:"Skuta 150g + cimet", k:180 }
    ]},
    { num: "Opcija 2", name: "Mediteranska", meals: [
      { t:"06:00", n:"Doručak", d:"3 jaja + hljeb cjelovito zrno + avokado pola", k:580 },
      { t:"10:00", n:"Užina", d:"Šaka badema + kruška", k:260 },
      { t:"13:00", n:"Ručak", d:"Tuna 160g + quinoa salata + feta + masline", k:680 },
      { t:"16:30", n:"Pre-trening", d:"Rižini keksevi ×4 + hummus", k:200 },
      { t:"19:30", n:"Večera", d:"Govedina 180g + batat + zelena salata", k:640 },
      { t:"21:30", n:"Noćna", d:"Kefir 200ml + pumpkin seeds", k:180 }
    ]},
    { num: "Opcija 3", name: "Meal prep", meals: [
      { t:"06:00", n:"Doručak", d:"Overnight oats 60g + chia + bademovo mlijeko + borovnice", k:480 },
      { t:"10:00", n:"Užina", d:"2 jaja tvrdo kuhana + celer", k:200 },
      { t:"13:00", n:"Ručak", d:"Riža 100g + piletina 200g + brokula + soja sos", k:690 },
      { t:"16:30", n:"Pre-trening", d:"Banana + kafa", k:130 },
      { t:"19:30", n:"Večera", d:"Sardine 150g + varivo od leće", k:560 },
      { t:"21:30", n:"Noćna", d:"Protein shake + orasi", k:280 }
    ]},
    { num: "Opcija 4", name: "Anti-upalna (za Ahilovu)", meals: [
      { t:"06:00", n:"Doručak", d:"Smoothie: spanać + banana + đumbir + kurkuma + protein prah", k:440 },
      { t:"10:00", n:"Užina", d:"Grčki jogurt 200g + chia + borovnice + med 1 kašičica", k:290 },
      { t:"13:00", n:"Ručak", d:"Losos 200g + riža 80g + špinat s bijelim lukom", k:700 },
      { t:"16:30", n:"Pre-trening", d:"Orasi + narandža", k:220 },
      { t:"19:30", n:"Večera", d:"Piletina 180g s kurkumom + tikvica + quinoa", k:600 },
      { t:"21:30", n:"Noćna", d:"Čaj đumbir + skuta 120g", k:150 }
    ]},
    { num: "Opcija 5", name: "Visoki protein", meals: [
      { t:"06:00", n:"Doručak", d:"4 jaja + zob 60g + bademovo mlijeko", k:600 },
      { t:"10:00", n:"Užina", d:"Protein shake 30g + banana", k:280 },
      { t:"13:00", n:"Ručak", d:"Govedina 200g + batat 200g + brokula", k:750 },
      { t:"16:30", n:"Pre-trening", d:"Skuta 150g + jabuka", k:230 },
      { t:"19:30", n:"Večera", d:"Piletina prsa 220g + špinat + maslinovo ulje", k:480 },
      { t:"21:30", n:"Noćna", d:"Casein 30g ili skuta 200g", k:240 }
    ]}
  ]},
  nina: { macros: { kcal: 1750, protein: 140, carbs: 170, fat: 58 }, options: [
    { num: "Opcija 1", name: "Balansirana osnova", meals: [
      { t:"06:00", n:"Doručak", d:"Zobene pahuljice 55g + bademovo mlijeko + jagode + 1 jaje", k:380 },
      { t:"10:00", n:"Užina", d:"Grčki jogurt 0% 150g + chia + borovnice", k:200 },
      { t:"13:00", n:"Ručak", d:"Piletina 140g + quinoa 70g + povrće + maslinovo ulje", k:500 },
      { t:"16:30", n:"Pre-trening", d:"Banana pola + bademi", k:170 },
      { t:"19:30", n:"Večera", d:"Losos 150g + špinat + brokula", k:420 },
      { t:"21:30", n:"Noćna", d:"Skuta 100g + cimet", k:110 }
    ]},
    { num: "Opcija 2", name: "Fitnes cutting", meals: [
      { t:"06:00", n:"Doručak", d:"2 jaja + 3 bjelanjka + avokado pola + paradajz", k:360 },
      { t:"10:00", n:"Užina", d:"Protein shake 20g + orasi", k:240 },
      { t:"13:00", n:"Ručak", d:"Tuna 140g + riža 70g + salata", k:480 },
      { t:"16:30", n:"Pre-trening", d:"Jabuka + badema puter", k:160 },
      { t:"19:30", n:"Večera", d:"Piletina 160g + tikvica + paprika", k:380 },
      { t:"21:30", n:"Noćna", d:"Kefir 150ml", k:90 }
    ]},
    { num: "Opcija 3", name: "Meal prep", meals: [
      { t:"06:00", n:"Doručak", d:"Overnight oats 50g + chia + borovnice", k:380 },
      { t:"10:00", n:"Užina", d:"2 jaja tvrdo kuhana + krastavac", k:160 },
      { t:"13:00", n:"Ručak", d:"Varivo od leće 250g + piletina 120g", k:480 },
      { t:"16:30", n:"Pre-trening", d:"Banana + kafa", k:120 },
      { t:"19:30", n:"Večera", d:"Skuša 130g + salata + maslinovo ulje", k:380 },
      { t:"21:30", n:"Noćna", d:"Grčki jogurt 120g", k:100 }
    ]},
    { num: "Opcija 4", name: "Anti-upalna + mršavljenje", meals: [
      { t:"06:00", n:"Doručak", d:"Smoothie: spanać + banana pola + kurkuma + protein 20g", k:360 },
      { t:"10:00", n:"Užina", d:"Orasi + mandarina", k:180 },
      { t:"13:00", n:"Ručak", d:"Losos 150g + špinat + quinoa 60g + kurkuma", k:520 },
      { t:"16:30", n:"Pre-trening", d:"Jabuka + 5 badema", k:120 },
      { t:"19:30", n:"Večera", d:"Tofu 150g + tikvica + paprika", k:380 },
      { t:"21:30", n:"Noćna", d:"Skuta 80g", k:100 }
    ]},
    { num: "Opcija 5", name: "Visoki protein + deficit", meals: [
      { t:"06:00", n:"Doručak", d:"3 bjelanjka + 1 jaje + zob 40g", k:320 },
      { t:"10:00", n:"Užina", d:"Protein shake 20g + bademovo mlijeko", k:190 },
      { t:"13:00", n:"Ručak", d:"Piletina prsa 170g + batat 150g + brokula", k:500 },
      { t:"16:30", n:"Pre-trening", d:"Skuta 100g + borovnice", k:140 },
      { t:"19:30", n:"Večera", d:"Bakalar 180g + špinat + maslinovo ulje", k:360 },
      { t:"21:30", n:"Noćna", d:"Casein 20g ili skuta 120g", k:160 }
    ]}
  ]}
};

const supplementsData = {
  slato: [
    { name: "Kolagen peptidi", dose: "10g", time: "Ujutro uz Vit C", why: "Hrani Ahilovu tetivu — #1 prioritet", p: "🔴" },
    { name: "Vitamin C", dose: "500mg", time: "Uz kolagen", why: "Obavezna kombinacija", p: "🔴" },
    { name: "Omega-3", dose: "2-3g EPA+DHA", time: "Uz obrok", why: "Smanjuje upalu tetive", p: "🔴" },
    { name: "Magnezij glicinat", dose: "300-400mg", time: "Navečer", why: "Opušta mišiće, bolji san", p: "🔴" },
    { name: "Kreatin monohidrat", dose: "5g/dan", time: "Bilo kad", why: "Snaga, masa, energija — najsigurniji suplement", p: "🟡" },
    { name: "Vitamin D3 + K2", dose: "3000-4000 IU", time: "Ujutro uz masnoću", why: "Kosti, imunitet, hormoni — važno u Belgiji", p: "🟡" },
    { name: "Zink", dose: "15-25mg", time: "Navečer", why: "Testosteron, oporavak za 40+", p: "🟡" },
    { name: "Whey protein", dose: "25-30g", time: "Post-trening", why: "Ako ne dostižeš 160g iz hrane", p: "🟢" },
    { name: "Voltaren gel", dose: "Po potrebi", time: "Na Ahilovu", why: "Akutna upala — ne kronično", p: "🟠" }
  ],
  nina: [
    { name: "Kolagen peptidi", dose: "10g", time: "Ujutro uz Vit C", why: "Zglobovi, koža — za žene 39+", p: "🔴" },
    { name: "Vitamin C", dose: "500mg", time: "Uz kolagen", why: "Obavezna kombinacija", p: "🔴" },
    { name: "Magnezij glicinat", dose: "200-300mg", time: "Navečer", why: "Hormoni, san, mišići", p: "🔴" },
    { name: "Vitamin D3 + K2", dose: "2000 IU", time: "Ujutro uz masnoću", why: "Žene često imaju deficit", p: "🔴" },
    { name: "Omega-3", dose: "1-2g EPA+DHA", time: "Uz obrok", why: "Upale, hormoni, oporavak", p: "🟡" },
    { name: "Kreatin monohidrat", dose: "3-5g/dan", time: "Bilo kad", why: "Snaga i mišići — sigurno i za žene", p: "🟡" },
    { name: "Gvožđe", dose: "Po krvnoj slici", time: "Ujutro + Vit C", why: "Provjeri kod doktora", p: "🟡" },
    { name: "Protein prah", dose: "20-25g", time: "Post-trening", why: "Za dostizanje 140g uz deficit", p: "🟢" },
    { name: "Probiotici", dose: "1 kapsula", time: "Ujutro", why: "Flora, apsorpcija, imunitet", p: "🟢" }
  ]
};

const hrZones = {
  slato: { maxHR: 179, zones: [
    { z: "Z1 Oporavak", bpm: "90-107", c: "#94a3b8", tip: "Hodanje" },
    { z: "Z2 Aerobna baza", bpm: "107-125", c: "#22c55e", tip: "80% treninga ovdje!" },
    { z: "Z3 Tempo", bpm: "125-143", c: "#f59e0b", tip: "Kontrolirani napor" },
    { z: "Z4 Intervali", bpm: "143-161", c: "#f97316", tip: "Max 1-2×/tjedno" },
    { z: "Z5 Maks", bpm: "161+", c: "#ef4444", tip: "Rijetko" }
  ]},
  nina: { maxHR: 181, zones: [
    { z: "Z1 Oporavak", bpm: "91-109", c: "#94a3b8", tip: "Zagrijavanje" },
    { z: "Z2 Aerobna baza", bpm: "109-127", c: "#22c55e", tip: "80% trčanja — sagorijeva masti!" },
    { z: "Z3 Tempo", bpm: "127-145", c: "#f59e0b", tip: "Raste forma" },
    { z: "Z4 Intervali", bpm: "145-163", c: "#f97316", tip: "1-2×/tjedno" },
    { z: "Z5 Maks", bpm: "163+", c: "#ef4444", tip: "Rijetko" }
  ]}
};

const achillesPhases = [
  { phase: "Faza 1 — Akutna (Sed. 1-2)", color: "#ef4444", goal: "Smanjiti bol i upalu. NEMA trčanja ni skakanja.", exercises: [
    { name: "Isometric heel raise", sets: "5×45 sek", times: "3×/dan", desc: "Podigi se na prste, zadrži 45 sek. Max bol 4/10.", yt: "isometric+calf+raise+achilles", pain: "Max 4/10" },
    { name: "Seated isometric calf press", sets: "5×45 sek", times: "3×/dan", desc: "Pritisni stopalo prema dolje bez pokreta.", yt: "seated+isometric+calf+press", pain: "Max 4/10" },
    { name: "Ankle alphabet", sets: "1× abeceda", times: "2×/dan", desc: "Stopalo u zraku, piši slova. Mobilnost bez udara.", yt: "ankle+alphabet+rehab", pain: "Bez bola" },
    { name: "🧊 Led 10-15 min", sets: "—", times: "Nakon aktivnosti", desc: "Krpa + led. Nikad direktno na kožu.", yt: "", pain: "—" }
  ]},
  { phase: "Faza 2 — Alfredson (Sed. 3-6)", color: "#f59e0b", goal: "Postepeno opterećivati tetivu. Eccentric protokol.", exercises: [
    { name: "Eccentric Heel Drop — ravna noga", sets: "3×15", times: "2×/dan", desc: "Rub stepenice. Podigni OBJEMA, spusti POLAKO (4 sek) samo bolesnom. Boli = normalno!", yt: "eccentric+heel+drop+straight+leg", pain: "Max 5/10 OK" },
    { name: "Eccentric Heel Drop — savijena noga", sets: "3×15", times: "2×/dan", desc: "Koljeno savijeno 30°. Targeta soleus.", yt: "eccentric+heel+drop+bent+knee", pain: "Max 5/10 OK" },
    { name: "Double leg heel raise", sets: "3×15", times: "1×/dan", desc: "Obje noge — polako gore i dolje.", yt: "double+leg+calf+raise+achilles", pain: "Max 3/10" },
    { name: "Foam roll lista", sets: "60-90 sek", times: "Svaki dan", desc: "PORED tetive, ne po sredini. Lagano.", yt: "foam+roll+calf+technique", pain: "Neugodan" },
    { name: "Statično istezanje lista", sets: "3×30 sek", times: "Post-trening", desc: "Nikad hladno! Ravna i savijena noga.", yt: "calf+stretch+wall", pain: "Bez oštrog bola" }
  ]},
  { phase: "Faza 3 — Jačanje (Sed. 7-12)", color: "#22c55e", goal: "Jačanje pod opterećenjem. Uvođenje trčanja na kraju.", exercises: [
    { name: "Single leg heel raise s opterećenjem", sets: "4×12", times: "1×/dan", desc: "Jedna noga, drži bučicu. Puni raspon.", yt: "single+leg+calf+raise+loading", pain: "Max 4/10" },
    { name: "Banded dorsiflexion", sets: "3×15", times: "Svaki dan", desc: "Traka oko stopala, vuci prema sebi.", yt: "banded+dorsiflexion+ankle", pain: "Bez bola" },
    { name: "Hip strengthening (glute med)", sets: "3×15", times: "3×/tjedno", desc: "Lateral walk + clamshell. Slaba glutea = preopterećena Ahilova.", yt: "hip+strengthening+achilles+rehab", pain: "Bez bola" },
    { name: "Towel curl", sets: "3×20", times: "Svaki dan", desc: "Skupljaj ručnik prstima.", yt: "towel+curl+foot+muscles", pain: "Bez bola" },
    { name: "Hopping (kad kiné odobri)", sets: "3×20 sek", times: "2×/tjedno", desc: "SAMO kad si bez bola 2 sedmice i kiné da zeleno!", yt: "single+leg+hopping+achilles+return", pain: "Max 3/10" }
  ]}
];

// ─── ACHILLES TAB ────────────────────────────────────────────
function AchillesTab({ showToast }) {
  const [activePhase, setActivePhase] = useState(1);
  const [painLog, setPainLog] = useState([]);
  const [painInput, setPainInput] = useState({ score: 3, note: "", time: "jutro" });
  const [showPainLog, setShowPainLog] = useState(false);
  const bg = "#0f172a", bgC = "#1e293b", bdr = "#334155";

  function logPain() {
    setPainLog(p => [{ ...painInput, date: TODAY, id: Date.now() }, ...p]);
    showToast("📊 Bol zapisana!");
  }

  const painColor = s => s <= 3 ? "#22c55e" : s <= 6 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🦵 Ahilova — Rehab Program</div>
      <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 13, color: "#fca5a5" }}>
        🏥 Dr Fouarge Sep 2025 — Tendinoza obje tetive. Bez rupture ✅. PRP samo ako sve ostalo ne pomogne.
      </div>
      <div style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 10 }}>📊 Dnevnik bola</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Bol:</span>
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <button key={n} onClick={() => setPainInput(p => ({ ...p, score: n }))}
              style={{ width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: painInput.score === n ? painColor(n) : "#334155", color: "#fff" }}>{n}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {["jutro","trening","večer"].map(t => (
            <button key={t} onClick={() => setPainInput(p => ({ ...p, time: t }))}
              style={{ padding: "5px 12px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: painInput.time === t ? "#f59e0b" : "#334155", color: painInput.time === t ? "#000" : "#fff" }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={painInput.note} onChange={e => setPainInput(p => ({ ...p, note: e.target.value }))} placeholder="Napomena..."
            style={{ flex: 1, padding: "8px 12px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, color: "#f1f5f9", fontSize: 13 }} />
          <button onClick={logPain} style={{ padding: "8px 16px", background: "#f59e0b", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, cursor: "pointer" }}>Spremi</button>
        </div>
        {painLog.length > 0 && (
          <>
            <button onClick={() => setShowPainLog(!showPainLog)} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 12 }}>
              {showPainLog ? "▲ Sakrij" : `▼ Historija (${painLog.length})`}
            </button>
            {showPainLog && painLog.slice(0,10).map(p => (
              <div key={p.id} style={{ display: "flex", gap: 10, padding: "5px 0", fontSize: 12, borderBottom: `1px solid ${bdr}` }}>
                <span style={{ color: painColor(p.score), fontWeight: 700 }}>{p.score}/10</span>
                <span style={{ color: "#94a3b8" }}>{p.time}</span>
                <span style={{ color: "#64748b" }}>{p.date}</span>
                {p.note && <span style={{ color: "#cbd5e1" }}>{p.note}</span>}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {achillesPhases.map((p, i) => (
          <button key={i} onClick={() => setActivePhase(i)}
            style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, background: activePhase === i ? p.color : "#334155", color: "#fff" }}>
            {i === 0 ? "Faza 1\nAkutna" : i === 1 ? "Faza 2\nAlfredson" : "Faza 3\nJačanje"}
          </button>
        ))}
      </div>
      <div style={{ background: bgC, borderRadius: 12, padding: 12, marginBottom: 10, borderLeft: `4px solid ${achillesPhases[activePhase].color}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: achillesPhases[activePhase].color }}>{achillesPhases[activePhase].phase}</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>🎯 {achillesPhases[activePhase].goal}</div>
      </div>
      {achillesPhases[activePhase].exercises.map(ex => (
        <div key={ex.name} style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{ex.name}</div>
            {ex.yt && <a href={`https://www.youtube.com/results?search_query=${ex.yt}`} target="_blank" rel="noreferrer"
              style={{ background: "#ef4444", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#fff", textDecoration: "none", fontWeight: 700, marginLeft: 8 }}>▶ YT</a>}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{ex.desc}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ background: "#334155", borderRadius: 6, padding: "3px 8px", fontSize: 12, color: "#cbd5e1" }}>{ex.sets}</span>
            <span style={{ background: "#334155", borderRadius: 6, padding: "3px 8px", fontSize: 12, color: "#cbd5e1" }}>{ex.times}</span>
            {ex.pain !== "—" && <span style={{ background: "#334155", borderRadius: 6, padding: "3px 8px", fontSize: 12, color: ex.pain.includes("5/10") ? "#fcd34d" : "#86efac" }}>😣 {ex.pain}</span>}
          </div>
        </div>
      ))}
      <div style={{ background: bgC, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>📋 Pravila bola</div>
        {[
          { i: "✅", t: "Bol do 4-5/10 tokom vježbe = normalna", c: "#86efac" },
          { i: "✅", t: "Jutarnja ukočenost koja prolazi u 10 min = OK", c: "#86efac" },
          { i: "⚠️", t: "Bol koja RASTE tokom vježbe = stani odmah", c: "#fcd34d" },
          { i: "⚠️", t: "Bol GORA sljedećeg jutra = smanji intenzitet", c: "#fcd34d" },
          { i: "❌", t: "Trčanje, skakanje dok kiné ne odobri", c: "#fca5a5" },
          { i: "❌", t: "Istezanje hladno — samo post-trening!", c: "#fca5a5" },
          { i: "❌", t: "Foam roller direktno po sredini tetive", c: "#fca5a5" }
        ].map((w, i) => (
          <div key={i} style={{ fontSize: 13, padding: "6px 0", borderBottom: i < 6 ? `1px solid ${bdr}` : "none", color: w.c }}>{w.i} {w.t}</div>
        ))}
      </div>
    </div>
  );
}

// ─── SEDMIČNA LISTA NAMIRNICA (Slato + Nina, ~7 dana) ─────────
// bs = bosanski naziv, fr = francuski (za police u Belgiji), qty = sedmična
// količina za oboje, cat = kategorija (mora biti jedna iz `cats` liste).
const WEEKLY_GROCERIES = [
  // 🥩 Proteini
  { bs: "Pileća prsa", fr: "Blanc de poulet", qty: "2 kg", cat: "🥩 Proteini" },
  { bs: "Jaja", fr: "Œufs", qty: "30 kom", cat: "🥩 Proteini" },
  { bs: "Losos (file)", fr: "Saumon (filet)", qty: "800 g", cat: "🥩 Proteini" },
  { bs: "Tuna u konzervi", fr: "Thon en boîte", qty: "4 konzerve", cat: "🥩 Proteini" },
  { bs: "Mljevena govedina", fr: "Bœuf haché", qty: "800 g", cat: "🥩 Proteini" },
  { bs: "Sardine / skuša", fr: "Sardines / Maquereau", qty: "3 konzerve", cat: "🥩 Proteini" },
  { bs: "Tofu", fr: "Tofu", qty: "400 g", cat: "🥩 Proteini" },
  // 🥛 Mliječni proizvodi
  { bs: "Grčki jogurt", fr: "Yaourt grec", qty: "1.5 kg", cat: "🥛 Mliječni proizvodi" },
  { bs: "Skuta / svježi sir", fr: "Fromage blanc / Skyr", qty: "1 kg", cat: "🥛 Mliječni proizvodi" },
  { bs: "Kefir", fr: "Kéfir", qty: "1 L", cat: "🥛 Mliječni proizvodi" },
  { bs: "Feta", fr: "Feta", qty: "200 g", cat: "🥛 Mliječni proizvodi" },
  // 🌾 Žitarice & Suhe namirnice
  { bs: "Zobene pahuljice", fr: "Flocons d'avoine", qty: "1 kg", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Kvinoja", fr: "Quinoa", qty: "500 g", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Riža (basmati/integralna)", fr: "Riz (basmati/complet)", qty: "1 kg", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Integralni hljeb", fr: "Pain complet", qty: "1 veknu", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Chia sjemenke", fr: "Graines de chia", qty: "250 g", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Leća", fr: "Lentilles", qty: "500 g", cat: "🌾 Žitarice & Suhe namirnice" },
  { bs: "Batat", fr: "Patate douce", qty: "1 kg", cat: "🌾 Žitarice & Suhe namirnice" },
  // 🥦 Povrće & Voće
  { bs: "Borovnice", fr: "Myrtilles", qty: "500 g", cat: "🥦 Povrće & Voće" },
  { bs: "Banane", fr: "Bananes", qty: "1 kg", cat: "🥦 Povrće & Voće" },
  { bs: "Jabuke", fr: "Pommes", qty: "1 kg", cat: "🥦 Povrće & Voće" },
  { bs: "Brokula", fr: "Brocoli", qty: "1 kg", cat: "🥦 Povrće & Voće" },
  { bs: "Špinat", fr: "Épinards", qty: "400 g", cat: "🥦 Povrće & Voće" },
  { bs: "Avokado", fr: "Avocat", qty: "4 kom", cat: "🥦 Povrće & Voće" },
  { bs: "Paradajz", fr: "Tomates", qty: "600 g", cat: "🥦 Povrće & Voće" },
  { bs: "Tikvica", fr: "Courgette", qty: "3 kom", cat: "🥦 Povrće & Voće" },
  { bs: "Paprika", fr: "Poivron", qty: "4 kom", cat: "🥦 Povrće & Voće" },
  { bs: "Zelena salata", fr: "Salade verte", qty: "2 kom", cat: "🥦 Povrće & Voće" },
  { bs: "Đumbir", fr: "Gingembre", qty: "1 korijen", cat: "🥦 Povrće & Voće" },
  { bs: "Bijeli luk", fr: "Ail", qty: "1 glavica", cat: "🥦 Povrće & Voće" },
  { bs: "Limun", fr: "Citron", qty: "3 kom", cat: "🥦 Povrće & Voće" },
  // 🧴 Ostalo
  { bs: "Maslinovo ulje", fr: "Huile d'olive", qty: "1 boca", cat: "🧴 Ostalo" },
  { bs: "Bademi", fr: "Amandes", qty: "250 g", cat: "🧴 Ostalo" },
  { bs: "Orasi", fr: "Noix", qty: "250 g", cat: "🧴 Ostalo" },
  { bs: "Bademov puter", fr: "Beurre d'amande", qty: "1 teglica", cat: "🧴 Ostalo" },
  { bs: "Med", fr: "Miel", qty: "1 teglica", cat: "🧴 Ostalo" },
  { bs: "Bademovo mlijeko", fr: "Lait d'amande", qty: "2 L", cat: "🧴 Ostalo" },
  { bs: "Kurkuma + cimet", fr: "Curcuma + cannelle", qty: "1+1", cat: "🧴 Ostalo" },
  { bs: "Hummus", fr: "Houmous", qty: "1 pakovanje", cat: "🧴 Ostalo" },
  // 🫙 Suplementi (po potrebi)
  { bs: "Protein prah", fr: "Protéine en poudre", qty: "po potrebi", cat: "🫙 Suplementi" },
  { bs: "Kreatin", fr: "Créatine", qty: "po potrebi", cat: "🫙 Suplementi" }
];

// ─── SHOPPING LIST ────────────────────────────────────────────
function ShoppingList({ shoppingList, shoppingChecked, setShoppingList, setShoppingChecked, showToast }) {
  const [newItem, setNewItem] = useState("");
  const [newCat, setNewCat] = useState("🥩 Proteini");

  const cats = ["🥩 Proteini", "🥦 Povrće & Voće", "🌾 Žitarice & Suhe namirnice", "🥛 Mliječni proizvodi", "🫙 Suplementi", "🧴 Ostalo"];
  const items = shoppingList || [];
  const checked = shoppingChecked || [];
  const bg = "#0f172a", bgC = "#1e293b", bdr = "#334155";

  function toggleCheck(id) {
    setShoppingChecked(checked.includes(id) ? checked.filter(x => x !== id) : [...checked, id]);
  }
  function addItem() {
    if (!newItem.trim()) return;
    setShoppingList([...items, { id: Date.now(), name: newItem.trim(), cat: newCat, manual: true }]);
    setNewItem(""); showToast("✅ Dodano!");
  }
  function removeItem(id) {
    setShoppingList(items.filter(x => x.id !== id));
    setShoppingChecked(checked.filter(x => x !== id));
  }
  function clearChecked() {
    setShoppingList(items.filter(x => !checked.includes(x.id)));
    setShoppingChecked([]); showToast("🗑️ Kupljeno uklonjeno!");
  }
  function clearAll() {
    setShoppingList([]); setShoppingChecked([]); showToast("🗑️ Lista očišćena!");
  }

  // Generiše fiksnu sedmičnu listu za domaćinstvo (Slato + Nina) s BS/FR nazivima.
  function generateWeekly() {
    const out = WEEKLY_GROCERIES.map((g, i) => ({
      id: Date.now() + i,
      name: `${g.bs} / ${g.fr} — ${g.qty}`,
      cat: g.cat,
      manual: false
    }));
    setShoppingList(out); setShoppingChecked([]);
    showToast(`✅ Sedmična lista: ${out.length} namirnica`);
  }

  const unchecked = items.filter(x => !checked.includes(x.id));
  const checkedItems = items.filter(x => checked.includes(x.id));

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🛒 Shopping Lista</div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
        {items.length > 0 ? `${unchecked.length} preostalo · ${checkedItems.length} kupljeno` : "Lista je prazna"}
      </div>
      <div style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 12, borderTop: "3px solid #7c3aed" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", marginBottom: 6 }}>🍽️ Sedmična lista (Slato + Nina)</div>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, lineHeight: 1.5 }}>
          Glavne namirnice za ~7 dana, s francuskim nazivima za police u Belgiji.
          Količine su za oboje — prilagodi po potrebi.
        </div>
        <button onClick={generateWeekly} style={{ width: "100%", padding: 13, background: "#7c3aed", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          ✨ Generiši sedmičnu listu
        </button>
        {items.length > 0 && <button onClick={clearAll} style={{ width: "100%", padding: 8, background: "transparent", border: `1px solid ${bdr}`, borderRadius: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer", marginTop: 8 }}>🗑️ Očisti cijelu listu</button>}
      </div>
      <div style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>➕ Dodaj ručno</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem()} placeholder="npr. Grčki jogurt 500g"
            style={{ flex: 1, padding: "10px 12px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, color: "#f1f5f9", fontSize: 14 }} />
          <button onClick={addItem} style={{ padding: "10px 18px", background: "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 18, cursor: "pointer" }}>+</button>
        </div>
        <select value={newCat} onChange={e => setNewCat(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, color: "#f1f5f9", fontSize: 13 }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {unchecked.length > 0 && cats.map(cat => {
        const catItems = unchecked.filter(x => x.cat === cat);
        if (!catItems.length) return null;
        return (
          <div key={cat} style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>{cat} <span style={{ fontWeight: 400, color: "#64748b" }}>({catItems.length})</span></div>
            {catItems.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${bdr}` }}>
                <button onClick={() => toggleCheck(item.id)} style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #475569", background: "transparent", cursor: "pointer", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14 }}>{item.name}</span>
                <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        );
      })}
      {checkedItems.length > 0 && (
        <div style={{ background: bgC, borderRadius: 12, padding: 14, marginBottom: 10, opacity: 0.75 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>✓ Kupljeno ({checkedItems.length})</div>
            <button onClick={clearChecked} style={{ padding: "4px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#ef4444", color: "#fff" }}>Ukloni</button>
          </div>
          {checkedItems.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${bdr}` }}>
              <button onClick={() => toggleCheck(item.id)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: "#22c55e", cursor: "pointer", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</button>
              <span style={{ flex: 1, fontSize: 14, textDecoration: "line-through", color: "#64748b" }}>{item.name}</span>
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && (
        <div style={{ background: bgC, borderRadius: 12, padding: 30, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Lista je prazna</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Klikni "Generiši listu" gore ili dodaj ručno</div>
        </div>
      )}
    </div>
  );
}

// ─── SLIKE → GOOGLE DRIVE ────────────────────────────────────
// Napravi malu sličicu (thumbnail) iz slike za preview u aplikaciji.
function makeThumb(dataUrl, maxSize) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      try { resolve(c.toDataURL("image/jpeg", 0.7)); } catch (e) { resolve(""); }
    };
    img.onerror = () => resolve("");
    img.src = dataUrl;
  });
}

function PhotoUpload({ data, setData, showToast, pid }) {
  const bg = "#0f172a", bgC = "#1e293b", bdr = "#334155";
  const pname = pid === "slato" ? "Slato" : "Nina";
  const driveUrl = data.driveUrl || "";
  const uploads = data.uploads || [];
  const [urlInput, setUrlInput] = useState(driveUrl);
  const [cat, setCat] = useState(PHOTO_CATEGORIES[0].id);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showCfg, setShowCfg] = useState(!driveUrl);
  const camRef = useRef();
  const galRef = useRef();

  const card = { background: bgC, borderRadius: 12, padding: 16, marginBottom: 12 };
  const inp = { width: "100%", padding: "11px 14px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", marginTop: 6 };

  function saveUrl() {
    const u = urlInput.trim();
    setData(d => ({ ...d, driveUrl: u }));
    setShowCfg(false);
    showToast(u ? "✅ Drive link sačuvan" : "Link obrisan");
  }

  function pick(ref) {
    if (!driveUrl) { setShowCfg(true); showToast("⚠️ Prvo zalijepi Drive link"); return; }
    ref.current.click();
  }

  function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = String(ev.target.result);
      const base64 = dataUrl.split(",")[1];
      const catObj = PHOTO_CATEGORIES.find(c => c.id === cat) || PHOTO_CATEGORIES[0];
      const path = catObj.path.replace("{P}", pname);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const ext = ((file.type.split("/")[1]) || "jpg").replace("jpeg", "jpg");
      const filename = `${pname}_${stamp}.${ext}`;
      // no-cors: Apps Script ne šalje CORS header pa odgovor ne možemo pročitati,
      // ali zahtjev SVAKAKO prolazi i fajl se kreira na Drive-u. Zato uspjeh
      // bilježimo optimistično. Malu sličicu (thumb) čuvamo lokalno za preview.
      makeThumb(dataUrl, 400).then(thumb => {
        fetch(driveUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ path, filename, mimeType: file.type || "image/jpeg", data: base64 })
        })
          .then(() => {
            setData(d => ({ ...d, uploads: [{ id: Date.now(), label: catObj.label, path, filename, date: TODAY, thumb }, ...(d.uploads || [])].slice(0, 40) }));
            showToast("✅ Slika poslana na Drive!");
          })
          .catch(() => showToast("❌ Nema veze s internetom"))
          .then(() => setBusy(false));
      });
    };
    reader.readAsDataURL(file);
  }

  // Briše sliku iz aplikacije I s Google Drive-a (po path + filename).
  // (Bez window.confirm — u PWA zna biti blokiran; fajl na Drive-u ide u smeće.)
  function deleteUpload(u) {
    setData(d => ({ ...d, uploads: (d.uploads || []).filter(x => x.id !== u.id) }));
    if (driveUrl && u.path && u.filename) {
      fetch(driveUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "delete", path: u.path, filename: u.filename })
      }).catch(() => {});
    }
    showToast("🗑️ Slika obrisana");
  }

  const selected = PHOTO_CATEGORIES.find(c => c.id === cat) || PHOTO_CATEGORIES[0];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>📷 Slike → Google Drive</div>

      <div style={{ ...card, borderLeft: `3px solid ${driveUrl ? "#22c55e" : "#f59e0b"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: driveUrl ? "#22c55e" : "#f59e0b" }}>
            {driveUrl ? "✅ Povezano s Drive-om" : "⚠️ Nije povezano"}
          </div>
          <button onClick={() => setShowCfg(s => !s)} style={{ background: "none", border: `1px solid ${bdr}`, color: "#94a3b8", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {showCfg ? "Sakrij" : "Postavke"}
          </button>
        </div>
        {showCfg && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
              Zalijepi <b>Web app URL</b> (završava na /exec) iz Google Apps Script-a.
              Uputstvo je u fajlu <b>SETUP-SLIKE.md</b>.
            </div>
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" style={inp} />
            <button onClick={saveUrl} style={{ width: "100%", padding: 11, background: "#22c55e", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 8 }}>💾 Sačuvaj link</button>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>1. Odaberi gdje ide slika ({pname})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PHOTO_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{ padding: "8px 12px", borderRadius: 16, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: cat === c.id ? "#3b82f6" : "#334155", color: "#fff" }}>{c.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>
          📁 Ide u: <b style={{ color: "#94a3b8" }}>{selected.path.replace("{P}", pname)}</b>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>2. Slikaj ili odaberi sliku</div>
        <input type="file" accept="image/*" capture="environment" ref={camRef} onChange={handleFile} style={{ display: "none" }} />
        <input type="file" accept="image/*" ref={galRef} onChange={handleFile} style={{ display: "none" }} />
        <button disabled={busy} onClick={() => pick(camRef)} style={{ width: "100%", padding: 13, background: busy ? "#475569" : "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: busy ? "default" : "pointer", marginBottom: 8 }}>
          {busy ? "⏳ Šaljem..." : `📷 Slikaj i pošalji → ${selected.label}`}
        </button>
        <button disabled={busy} onClick={() => pick(galRef)} style={{ width: "100%", padding: 13, background: busy ? "#475569" : "#334155", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: busy ? "default" : "pointer" }}>
          🖼️ Odaberi iz galerije
        </button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>Zadnje poslano</div>
        {uploads.length === 0 && <div style={{ fontSize: 13, color: "#64748b" }}>Još nema poslanih slika.</div>}
        {uploads.slice(0, 20).map(u => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${bdr}` }}>
            {u.thumb
              ? <img src={u.thumb} onClick={() => setPreview(u.thumb)} style={{ width: 46, height: 46, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
              : <div style={{ width: 46, height: 46, borderRadius: 8, background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>🖼️</div>}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.label || u.path}</div>
              <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.path} · {u.date}</div>
            </div>
            <button onClick={() => deleteUpload(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 16, flexShrink: 0 }}>🗑️</button>
          </div>
        ))}
      </div>

      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <img src={preview} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12 }} />
          <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Tapni za zatvaranje</div>
        </div>
      )}
    </div>
  );
}

// ─── UPUTE / GUIDE TAB ───────────────────────────────────────
function GuideTab() {
  const bgC = "#1e293b", bdr = "#334155";
  const card = { background: bgC, borderRadius: 12, padding: 16, marginBottom: 12 };
  const h = { fontSize: 15, fontWeight: 700, marginBottom: 10, display: "flex", gap: 8, alignItems: "center" };
  const p = { fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 };
  const stepWrap = { display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" };
  const num = c => ({ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: c, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" });

  const tabGuide = [
    { ic: "🏠", n: "Dashboard", d: "Početni pregled: odbrojavanje do ciljeva, pređeni km, sedmični napredak. Tu je i 📋 Dnevni check-in (san, Ahilova bol, energija) — popuni ga svako jutro." },
    { ic: "📅", n: "Raspored", d: "Sedmični plan. Tapni dan u traci da vidiš 🎯 cilj i detalje tog treninga. Dolje označavaš trening kao završen (✅). Gore biraš vrijeme buđenja." },
    { ic: "🏃", n: "Trening", d: "Ovdje BILJEŽIŠ svaki kardio trening — vrstu, kilometre, tempo, puls (HR), RPE (koliko teško 1-10) i bilješku. Ispod vidiš historiju." },
    { ic: "💪", n: "Snaga", d: "Vježbe snage podijeljene po danima. Svaka vježba ima broj serija, savjet i ▶️ video demonstraciju (klik na 'YT')." },
    { ic: "🩹", n: "Rehab", d: "Samo za Slatu. Checklist za oporavak Ahilove tetive — lijekovi, vježbe, led, istezanje." },
    { ic: "🦵", n: "Ahilova", d: "Samo za Slatu. Plan oporavka Ahilove kroz 3 faze (akutna → Alfredson → jačanje) s vježbama i nivoom dozvoljenog bola." },
    { ic: "🥗", n: "Prehrana", d: "5 opcija jelovnika po osobi s makronutrijentima (kalorije, proteini, ugljikohidrati, masti). Gore biraš opciju." },
    { ic: "💊", n: "Suplementi", d: "Lista suplemenata s dozom, vremenom uzimanja i razlogom. 🔴 = najvažnije, 🟢 = opcionalno." },
    { ic: "⚖️", n: "Tjelo", d: "Upisuješ težinu (kg). Aplikacija pamti historiju i pokazuje razliku (zeleno = smršao/la, crveno = dobio/la)." },
    { ic: "⌚", n: "Uređaji", d: "Povezivanje sata: uvoz GPX fajla sa Garmina, uputstvo za Fitbit i tvoje HR (puls) zone." },
    { ic: "🛒", n: "🛒 Lista", d: "Lista za kupovinu — klikni 'Generiši sedmičnu listu' (gotov set glavnih namirnica za oboje, bosanski + francuski nazivi) ili dodaj ručno; kvačicom označavaš šta si kupio/la." },
    { ic: "📷", n: "📷 Slike", d: "Slikaj hranu/račune, suplemente, krvnu sliku, recepte ili foto napretka i pošalji ih direktno u pravi folder na Google Drive-u (nalazi i napredak idu u folder odabrane osobe)." },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 14 }}>❓ Kako koristiti aplikaciju</div>

      <div style={{ ...card, borderLeft: "3px solid #7c3aed" }}>
        <div style={p}>
          Dobrodošli! 👋 Ovo je vaš lični trening centar — plan, bilježenje treninga,
          prehrana, suplementi i oporavak, sve na jednom mjestu. Ispod je kratko uputstvo
          za sve. Ne brini — ništa ne možeš pokvariti. 🙂
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #22c55e" }}>
        <div style={h}>🚀 Brzi start</div>
        <div style={stepWrap}><div style={num("#22c55e")}>1</div><div style={p}><b>Odaberi osobu</b> gore (👨 Slato ili 👩 Nina). Svako ima svoje podatke i svoj plan.</div></div>
        <div style={stepWrap}><div style={num("#22c55e")}>2</div><div style={p}><b>Kreći se kroz tabove</b> (Dashboard, Raspored, Trening…) tako što ih prevučeš prstom lijevo-desno.</div></div>
        <div style={stepWrap}><div style={num("#22c55e")}>3</div><div style={p}><b>Sve se sprema samo</b> — čim nešto upišeš, automatski je sačuvano na ovom telefonu.</div></div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #3b82f6" }}>
        <div style={h}>👫 Profili — Slato i Nina</div>
        <div style={p}>
          Gore su dva dugmeta. Klikni 👩 <b>Nina</b> ili 👨 <b>Slato</b> da prebaciš ko se
          trenutno koristi. Svaka osoba ima <b>odvojene</b> treninge, težinu i plan.
          Tabovi <b>Rehab</b> i <b>Ahilova</b> se prikazuju samo za Slatu (njegov oporavak tetive).
        </div>
      </div>

      <div style={card}>
        <div style={h}>📑 Šta koji tab radi</div>
        {tabGuide.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < tabGuide.length - 1 ? `1px solid ${bdr}` : "none" }}>
            <div style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>{t.ic}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.n}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{t.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, borderLeft: "3px solid #ec4899" }}>
        <div style={h}>➕ Kako zabilježiti trening</div>
        <div style={stepWrap}><div style={num("#ec4899")}>1</div><div style={p}>Otvori tab <b>Trening</b>.</div></div>
        <div style={stepWrap}><div style={num("#ec4899")}>2</div><div style={p}>Odaberi vrstu (trčanje, bicikl, plivanje…).</div></div>
        <div style={stepWrap}><div style={num("#ec4899")}>3</div><div style={p}>Upiši <b>kilometre</b> i/ili <b>trajanje</b>, po želji tempo, puls i bilješku.</div></div>
        <div style={stepWrap}><div style={num("#ec4899")}>4</div><div style={p}>Klikni <b>✅ Zabilježi</b>. Trening se pojavi u historiji ispod (možeš ga i obrisati).</div></div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #f59e0b" }}>
        <div style={h}>⚖️ Težina i ✅ završeni treninzi</div>
        <div style={p}>
          <b>Težina:</b> tab <b>Tjelo</b> → upiši kg → <b>Spremi</b>.<br /><br />
          <b>Označi trening kao odrađen:</b> tab <b>Raspored</b> → klikni na dan → <b>Završeno ✅</b>.
          Time raste tvoj sedmični postotak na Dashboardu.
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #3b82f6" }}>
        <div style={h}>⌚ Kako povezati sat (uvoz treninga)</div>
        <div style={p} >
          <b>👨 Slato (Garmin):</b>
        </div>
        <div style={{ ...stepWrap, marginTop: 8 }}><div style={num("#3b82f6")}>1</div><div style={p}>U <b>Garmin Connect</b> aplikaciji otvori aktivnost → ⋮ (tri tačke) → <b>Export GPX</b>.</div></div>
        <div style={stepWrap}><div style={num("#3b82f6")}>2</div><div style={p}>U ovoj aplikaciji idi na tab <b>Uređaji</b> → <b>📂 Uvezi GPX fajl</b> → odaberi taj fajl.</div></div>
        <div style={stepWrap}><div style={num("#3b82f6")}>3</div><div style={p}>Kilometri i puls se sami popune u tabu Trening — samo klikni Zabilježi.</div></div>
        <div style={{ ...p, marginTop: 6 }}>
          <b>👩 Nina (Fitbit):</b> Fitbit nema GPX, pa pogledaj km i puls u Fitbit aplikaciji i
          upiši ih ručno u tab <b>Trening</b>.
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #7c3aed" }}>
        <div style={h}>▶️ Video demonstracije & 🛒 Lista</div>
        <div style={p}>
          U tabu <b>Snaga</b> svaka vježba ima crveno dugme <b>▶️ YT</b> koje otvara
          video na YouTubeu da vidiš pravilnu izvedbu.
          <br /><br />
          U tabu <b>🛒 Lista</b> klikni <b>„Generiši sedmičnu listu"</b> — dobiješ gotov set
          glavnih namirnica za oboje (bosanski + francuski nazivi, s količinama za sedmicu).
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #ef4444" }}>
        <div style={h}>💾 Gdje se čuvaju podaci (VAŽNO)</div>
        <div style={p}>
          Podaci se čuvaju <b>na ovom telefonu/pregledniku</b>, lokalno. To znači:
          <br />• Slatov telefon i Ninin telefon imaju <b>odvojene</b> podatke — ne sinkroniziraju se sami.
          <br />• Ako obrišeš historiju preglednika, podaci nestaju.
          <br />• Najbolje je da svako koristi <b>svoj uvijek isti telefon</b> za svoj profil.
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #22c55e" }}>
        <div style={h}>📲 Instaliraj kao aplikaciju</div>
        <div style={p}>
          Da bude kao prava aplikacija na ekranu (bez adresne trake):
          <br /><br /><b>iPhone (Safari):</b> dugme <b>Podijeli</b> (kvadrat sa strelicom) → <b>Add to Home Screen</b>.
          <br /><b>Android (Chrome):</b> meni ⋮ → <b>Install app</b> / <b>Dodaj na početni ekran</b>.
        </div>
      </div>

      <div style={{ ...card, borderLeft: "3px solid #3b82f6", marginBottom: 4 }}>
        <div style={h}>📷 Slanje slika na Google Drive</div>
        <div style={p}>
          U tabu <b>📷 Slike</b> slikaš i šalješ direktno u prave foldere na Drive-u:
          <br />• 🍽️ Hrana/računi → <b>04_Slike/Hrana_Racuni</b>
          <br />• 💊 Suplementi → <b>04_Slike/Suplementi</b>
          <br />• 🩸 Krvna slika / 💊 Recepti → <b>01_Medicinski_Nalazi/(osoba)</b>
          <br />• 📸 Foto napretka → <b>04_Slike/(osoba)_Progress</b>
          <br /><br />
          <b>1.</b> Gore odaberi osobu (bitno za nalaze i napredak).<br />
          <b>2.</b> Odaberi kategoriju — app pokaže tačan folder.<br />
          <b>3.</b> „📷 Slikaj i pošalji" (kamera) ili „🖼️ Odaberi iz galerije". ✅
          <br /><br />
          <span style={{ color: "#94a3b8", fontSize: 12 }}>
            Napomena: prvo se jednom podesi Drive link (Postavke u tabu Slike) —
            uputstvo je u fajlu SETUP-SLIKE.md.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── PRAVILA & SAVJETI ZA PREHRANU (na bazi istraživanja) ────
const NUTRITION_RULES = [
  { icon: "🫒", title: "Ulja i masti", color: "#84cc16", tips: [
    "Maslinovo ulje (extra virgin) za salate i blago kuhanje — ne pregrijavaj do dima.",
    "Za jako prženje koristi avokado ili kokosovo ulje (podnose visoku temperaturu).",
    "Izbjegavaj rafinisana biljna ulja (suncokret, kukuruz, soja) — pojačavaju upalu.",
    "Zdrave masti: avokado, orašasti plodovi, masna riba, maslinovo ulje. Mast NIJE neprijatelj — bira se kvalitet."
  ]},
  { icon: "🧂", title: "So i začini", color: "#06b6d4", tips: [
    "Manje soli — okus gradi začinima i svježim biljem umjesto soli.",
    "Kurkuma + crni biber zajedno (biber višestruko poveća apsorpciju kurkume).",
    "Đumbir, bijeli luk, cimet — prirodno anti-upalno i za probavu.",
    "Cimet pomaže stabilizaciju šećera u krvi — odličan u zobi/jogurtu."
  ]},
  { icon: "🍬", title: "Kad organizam traži šećer", color: "#ec4899", tips: [
    "Žudnja za šećerom često = manjak proteina, sna ili vode (ne pravi glad).",
    "Prvo popij čašu vode i sačekaj 10 min — često prođe.",
    "Posegni za voćem + orasima ili grčkim jogurtom s bobicama umjesto slatkiša.",
    "Ako baš moraš — tamna čokolada 85%+, mali komad.",
    "Ne drži slatkiše u kući. Redovni obroci s proteinom sprečavaju nagle padove šećera i 'napade' gladi."
  ]},
  { icon: "🍳", title: "Priprema hrane", color: "#f59e0b", tips: [
    "Peci, kuhaj, na pari ili roštilj — umjesto prženja u dubokom ulju.",
    "Ne zagaraj/pretpeci meso (zagorjeli dijelovi su štetni).",
    "Povrće kuhaj kratko (al dente) da zadrži vitamine.",
    "Meal-prep: skuhaj proteine i žitarice unaprijed za 2-3 dana."
  ]},
  { icon: "💧", title: "Hidracija", color: "#3b82f6", tips: [
    "Cilj ~2.5-3 L vode dnevno.",
    "Žeđ se često zamijeni za glad — popij vodu prije nego posegneš za hranom.",
    "Čaša vode prije obroka pomaže sitosti i kontroli porcija."
  ]},
  { icon: "🍽️", title: "Tanjir i navike", color: "#22c55e", tips: [
    "Pola tanjira povrće, četvrtina protein, četvrtina složeni ugljikohidrati.",
    "Protein uz SVAKI obrok — sitost i čuvanje mišića.",
    "Ne jedi 2-3 h prije spavanja.",
    "Jedi polako i žvaći — sitost stiže za ~20 min.",
    "Pravilo 80/20: dosljednost, ne savršenstvo. Jedan slobodan obrok sedmično je OK."
  ]},
  { icon: "🔥", title: "Anti-upalno (važno za Ahilovu)", color: "#ef4444", tips: [
    "Više omega-3: losos, sardine, skuša, orasi, lanene/chia sjemenke.",
    "Kurkuma, đumbir, bobičasto voće, lisnato povrće — smiruju upalu.",
    "Manje prerađene hrane, šećera i alkohola — pojačavaju upalu i usporavaju oporavak."
  ]}
];

// ─── MAIN APP ────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("Dashboard");
  const [pid, setPid] = useState("slato");
  const [data, setData] = useState(load);
  const [form, setForm] = useState({ type: "bike", km: "", pace_min: "", pace_sec: "", duration: "", hr: "", rpe: "", notes: "", date: TODAY });
  const [wInput, setWInput] = useState("");
  const [rehabDone, setRehabDone] = useState({});
  const [toast, setToast] = useState("");
  const [wakeTime, setWakeTime] = useState("05:30");
  const [mealOpt, setMealOpt] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [openDay, setOpenDay] = useState(null);
  const [checkin, setCheckin] = useState({ sleepH: "", sleepQ: 0, pain: 0, energy: 0 });
  const fileRef = useRef();

  useEffect(() => { save(data); }, [data]);

  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2800); };
  const profile = PROFILES[pid];
  const pData = data[pid] || { logs: [], weights: [], doneHistory: [] };
  const allCardio = (pData.logs || []).filter(l => ["run","bike","swim"].includes(l.type));
  const totalKm = allCardio.reduce((s, r) => s + (parseFloat(r.km) || 0), 0);
  const lastW = pData.weights?.[0]?.weight;

  function getWeekKey(dateStr) {
    const d = new Date(dateStr), day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  }
  const thisWeek = getWeekKey(TODAY);
  const doneDaysThisWeek = (pData.doneHistory || []).filter(d => d.weekKey === thisWeek).map(d => d.dayIndex);
  const activeDays = scheduleData[pid].days.map((d, i) => ({ ...d, origIndex: i })).filter((_, i) => !doneDaysThisWeek.includes(i));
  const totalDaysWithTraining = scheduleData[pid].days.filter(d => d.time).length;

  function markDone(dayIndex) {
    const day = scheduleData[pid].days[dayIndex];
    const updated = { ...data };
    updated[pid] = { ...updated[pid], doneHistory: [...(updated[pid].doneHistory || []), { dayIndex, day: day.day, type: day.type, date: TODAY, weekKey: thisWeek }] };
    setData(updated); showToast(`✅ ${day.day} završeno!`);
  }

  function undoDone(dayIndex) {
    const updated = { ...data };
    updated[pid].doneHistory = updated[pid].doneHistory.filter(x => !(x.dayIndex === dayIndex && x.weekKey === thisWeek));
    setData(updated); showToast("↩️ Trening vraćen!");
  }

  function logTraining() {
    if (!form.km && !form.duration) { showToast("⚠️ Unesi km ili trajanje!"); return; }
    const updated = { ...data };
    updated[pid] = { ...updated[pid], logs: [{ ...form, id: Date.now() }, ...(updated[pid].logs || [])] };
    setData(updated);
    setForm({ type: pid === "slato" ? "bike" : "run", km: "", pace_min: "", pace_sec: "", duration: "", hr: "", rpe: "", notes: "", date: TODAY });
    showToast("✅ Trening zabilježen!");
  }

  function deleteLog(id) {
    const updated = { ...data };
    updated[pid].logs = updated[pid].logs.filter(l => l.id !== id);
    setData(updated);
  }

  function logWeight() {
    if (!wInput) return;
    const updated = { ...data };
    updated[pid] = { ...updated[pid], weights: [{ weight: parseFloat(wInput), date: TODAY, ts: Date.now() }, ...(updated[pid].weights || [])] };
    setData(updated); setWInput(""); showToast("✅ Težina zapisana!");
  }

  function logCheckin() {
    const entry = { date: TODAY, sleepH: checkin.sleepH, sleepQ: checkin.sleepQ, pain: checkin.pain, energy: checkin.energy };
    setData(d => {
      const pd = d[pid] || {};
      const rest = (pd.checkins || []).filter(c => c.date !== TODAY);
      return { ...d, [pid]: { ...pd, checkins: [entry, ...rest] } };
    });
    showToast("✅ Dnevni check-in sačuvan!");
  }

  function parseGPX(text) {
    try {
      const pts = [...text.matchAll(/<trkpt lat="([\d.-]+)" lon="([\d.-]+)"[\s\S]*?<\/trkpt>/g)];
      let dist = 0;
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = [[+pts[i-1][1],+pts[i-1][2]], [+pts[i][1],+pts[i][2]]];
        const dLat=(b[0]-a[0])*Math.PI/180, dLon=(b[1]-a[1])*Math.PI/180;
        const x=Math.sin(dLat/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)**2;
        dist += 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
      }
      const hrVals = [...text.matchAll(/<gpxtpx:hr>(\d+)<\/gpxtpx:hr>/g)].map(m=>+m[1]);
      const avgHr = hrVals.length ? Math.round(hrVals.reduce((a,b)=>a+b)/hrVals.length) : null;
      const timeMatch = text.match(/<time>([\s\S]*?)<\/time>/);
      return { km: dist.toFixed(2), hr: avgHr, date: timeMatch ? timeMatch[1].slice(0,10) : TODAY };
    } catch { return null; }
  }

  function handleGPX(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const parsed = parseGPX(ev.target.result);
      if (parsed) { setForm(f => ({ ...f, type:"run", km: parsed.km, hr: parsed.hr||"", date: parsed.date })); showToast(`✅ GPX: ${parsed.km}km`); setTab("Trening"); }
      else showToast("❌ Greška GPX");
    };
    reader.readAsText(file);
  }

  const bg = "#0f172a", bgC = "#1e293b", bdr = "#334155";
  const card = { background: bgC, borderRadius: 12, padding: 16, marginBottom: 12 };
  const inp = { width: "100%", padding: "11px 14px", background: bg, border: `1px solid ${bdr}`, borderRadius: 8, color: "#f1f5f9", fontSize: 15, boxSizing: "border-box", marginTop: 6 };
  const todayDOW = new Date(TODAY).getDay();
  const dowMap = { "Ponedjeljak":1,"Utorak":2,"Srijeda":3,"Četvrtak":4,"Petak":5,"Subota":6,"Nedjelja":0 };
  const completedThisWeek = doneDaysThisWeek.length;

  return (
    <div style={{ background: bg, minHeight: "100vh", color: "#f1f5f9", fontFamily: "'Segoe UI',sans-serif", maxWidth: 720, margin: "0 auto", paddingBottom: 80 }}>
      {toast && <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"#22c55e", color:"#fff", padding:"10px 24px", borderRadius:30, fontWeight:700, zIndex:999, fontSize:15, whiteSpace:"nowrap" }}>{toast}</div>}

      <div style={{ background:bgC, padding:"14px 16px", borderBottom:`1px solid ${bdr}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:17, fontWeight:700 }}>❤️ Nina & Hamid</div>
          <div style={{ fontSize:12, color:"#64748b" }}>📅 {TODAY}</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {Object.entries(PROFILES).map(([k,p]) => (
            <button key={k} onClick={()=>setPid(k)} style={{ padding:"8px 22px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:14, background:pid===k?p.color:"#334155", color:"#fff" }}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", overflowX:"auto", background:bgC, borderBottom:`1px solid ${bdr}` }}>
        {TABS.filter(t => !(t==="Rehab" && pid==="nina")).map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{ padding:"11px 12px", border:"none", background:"transparent", cursor:"pointer", fontSize:12, fontWeight:700, whiteSpace:"nowrap", color:tab===t?profile.color:"#94a3b8", borderBottom:tab===t?`2px solid ${profile.color}`:"2px solid transparent" }}>{t}</button>
        ))}
      </div>

      <div style={{ padding:16 }}>

        {tab==="Dashboard" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:2 }}>{profile.emoji} {profile.name}</div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:12 }}>{profile.goal}</div>
            {pid==="slato" && <div style={{ background:"#ef444422", border:"1px solid #ef4444", borderRadius:10, padding:10, marginBottom:12, fontSize:13, color:"#fca5a5" }}>🦵 Rehab faza — nema trčanja dok kiné ne odobri!</div>}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {[GOAL1, GOAL2].map(g=>(
                <div key={g.label} style={{ background:bgC, borderRadius:12, padding:"12px 14px", flex:1, minWidth:120 }}>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{g.label}</div>
                  <div style={{ fontSize:24, fontWeight:700, color:profile.color }}>{g.days}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>dana · {g.date}</div>
                </div>
              ))}
              <div style={{ background:bgC, borderRadius:12, padding:"12px 14px", flex:1, minWidth:100 }}>
                <div style={{ fontSize:11, color:"#94a3b8" }}>Ukupno km</div>
                <div style={{ fontSize:24, fontWeight:700, color:profile.color }}>{totalKm.toFixed(1)}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>od početka</div>
              </div>
            </div>
            <div style={{ ...card, borderLeft:`3px solid ${profile.color}` }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#94a3b8", marginBottom:10 }}>📋 Dnevni check-in {(pData.checkins||[]).some(c=>c.date===TODAY) && <span style={{ color:"#22c55e", fontSize:11, fontWeight:700 }}>✓ uneseno danas</span>}</div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:12, color:"#94a3b8" }}>😴 San (sati)</label>
                <input type="number" step="0.5" value={checkin.sleepH} onChange={e=>setCheckin({...checkin, sleepH:e.target.value})} placeholder="7.5" style={inp}/>
              </div>
              <div style={{ marginBottom:10 }}>
                <label style={{ fontSize:12, color:"#94a3b8" }}>Kvaliteta sna (1 loše → 5 odlično)</label>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setCheckin({...checkin,sleepQ:n})} style={{ flex:1, padding:8, borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, background:checkin.sleepQ===n?profile.color:"#334155", color:"#fff" }}>{n}</button>)}
                </div>
              </div>
              {pid==="slato" && (
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, color:"#94a3b8" }}>🦵 Ahilova bol (0 nema → 10 jaka)</label>
                  <div style={{ display:"flex", gap:3, marginTop:6, flexWrap:"wrap" }}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n=>{ const c=n<=2?"#22c55e":n<=5?"#f59e0b":"#ef4444"; return <button key={n} onClick={()=>setCheckin({...checkin,pain:n})} style={{ width:28, height:32, borderRadius:6, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:checkin.pain===n?c:"#334155", color:"#fff" }}>{n}</button>; })}
                  </div>
                </div>
              )}
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, color:"#94a3b8" }}>⚡ Energija (1 iscrpljen → 5 odlično)</label>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  {[1,2,3,4,5].map(n=><button key={n} onClick={()=>setCheckin({...checkin,energy:n})} style={{ flex:1, padding:8, borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, background:checkin.energy===n?profile.color:"#334155", color:"#fff" }}>{n}</button>)}
                </div>
              </div>
              <button onClick={logCheckin} style={{ width:"100%", padding:11, background:profile.color, border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer" }}>💾 Spremi check-in</button>
            </div>
            <div style={card}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:13, color:"#94a3b8" }}>Ova sedmica: {completedThisWeek}/{totalDaysWithTraining}</div>
                <div style={{ fontSize:13, color:profile.color, fontWeight:700 }}>{Math.round((completedThisWeek/totalDaysWithTraining)*100)}%</div>
              </div>
              <div style={{ background:"#334155", borderRadius:20, height:10, overflow:"hidden" }}>
                <div style={{ background:profile.color, height:"100%", borderRadius:20, width:`${(completedThisWeek/totalDaysWithTraining)*100}%` }}/>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:13, color:"#94a3b8", marginBottom:6 }}>Progress ka Brussels 2027</div>
              <div style={{ background:"#334155", borderRadius:20, height:10, overflow:"hidden" }}>
                <div style={{ background:profile.color, height:"100%", borderRadius:20, width:`${Math.min((totalKm/500)*100,100)}%` }}/>
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{totalKm.toFixed(1)} / 500 km</div>
            </div>
            <div style={card}>
              <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:8 }}>ZADNJI TRENINZI</div>
              {(pData.logs||[]).length===0 && <div style={{ color:"#64748b" }}>Nema unesenih treninga.</div>}
              {(pData.logs||[]).slice(0,5).map(log=>(
                <div key={log.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${bdr}` }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>
                      {log.type==="run"?`🏃 ${log.km}km${log.pace_min?` @ ${log.pace_min}:${log.pace_sec||"00"}`:""}`:
                       log.type==="bike"?`🚴 ${log.km?log.km+"km":log.duration+"min"}`:
                       log.type==="swim"?`🏊 ${log.duration}min`:
                       log.type==="strength"?`💪 ${log.duration||""}min`:
                       log.type==="mobility"?`🧘 ${log.duration||""}min`:`🦵 Rehab`}
                      {log.hr?` · ♥ ${log.hr}bpm`:""}
                    </div>
                    <div style={{ fontSize:11, color:"#64748b" }}>{log.date}{log.notes?` · ${log.notes}`:""}</div>
                  </div>
                  <button onClick={()=>deleteLog(log.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:15 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="Raspored" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📅 Raspored</div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>Buđenje {wakeTime} · {completedThisWeek}/{totalDaysWithTraining} završeno</div>
            <div style={{ ...card, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"#94a3b8" }}>⏰</span>
              {["05:00","05:30","06:00"].map(t=>(
                <button key={t} onClick={()=>setWakeTime(t)} style={{ padding:"6px 14px", borderRadius:16, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, background:wakeTime===t?profile.color:"#334155", color:"#fff" }}>{t}</button>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>👆 Tapni dan za cilj i detalje treninga</div>
            <div style={{ display:"flex", gap:4, marginBottom:10 }}>
              {scheduleData[pid].days.map((d,i)=>{
                const done=doneDaysThisWeek.includes(i), isToday=dowMap[d.day]===todayDOW, isOpen=openDay===i;
                return (
                  <button key={i} onClick={()=>setOpenDay(isOpen?null:i)} style={{ flex:1, textAlign:"center", background:isOpen?"#334155":"transparent", border:"none", borderRadius:8, padding:"4px 2px", cursor:"pointer" }}>
                    <div style={{ height:6, borderRadius:3, background:done?"#22c55e":isToday?profile.color:"#475569", marginBottom:3 }}/>
                    <div style={{ fontSize:9, color:done?"#22c55e":isToday?profile.color:"#94a3b8", fontWeight:700 }}>{d.day.slice(0,3).toUpperCase()}</div>
                  </button>
                );
              })}
            </div>
            {openDay!=null && (()=>{
              const d=scheduleData[pid].days[openDay];
              return (
                <div style={{ ...card, borderLeft:`3px solid ${profile.color}`, marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontSize:16, fontWeight:700 }}>{d.icon} {d.day}</div>
                    <button onClick={()=>setOpenDay(null)} style={{ background:"none", border:"none", color:"#64748b", fontSize:16, cursor:"pointer" }}>✕</button>
                  </div>
                  <div style={{ fontSize:15, color:profile.color, fontWeight:700, marginBottom:8 }}>{d.type}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                    {d.time && <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12 }}>🕕 {d.time}</span>}
                    {d.duration && <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12 }}>⏱️ {d.duration} min</span>}
                    {d.intensity && <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12 }}>🔥 {d.intensity}</span>}
                  </div>
                  {d.noRun && pid==="slato" && <div style={{ fontSize:12, color:"#ef4444", fontWeight:700, marginBottom:8 }}>⛔ BEZ trčanja / skakanja (zaštita Ahilove)</div>}
                  <div style={{ background:"#0f172a", borderRadius:8, padding:10, marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:profile.color, marginBottom:3 }}>🎯 Cilj</div>
                    <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{d.goal}</div>
                  </div>
                  <div style={{ background:"#0f172a", borderRadius:8, padding:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:3 }}>📋 Šta raditi</div>
                    <div style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{d.details}</div>
                  </div>
                </div>
              );
            })()}
            {activeDays.length > 0 && (
              <>
                <div style={{ fontSize:12, color:"#94a3b8", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Preostalo ove sedmice</div>
                {activeDays.map(d => {
                  const isToday = dowMap[d.day]===todayDOW;
                  return (
                    <div key={d.origIndex} style={{ ...card, borderLeft:`3px solid ${isToday?profile.color:"#334155"}`, marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <div style={{ fontSize:15, fontWeight:700 }}>{d.icon} {d.day}</div>
                            {isToday && <span style={{ background:profile.color, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:700 }}>DANAS</span>}
                          </div>
                          <div style={{ fontSize:14, color:profile.color, fontWeight:600, marginTop:2 }}>{d.type}</div>
                          {d.noRun && pid==="slato" && <div style={{ fontSize:11, color:"#ef4444", marginTop:2 }}>⛔ Nema trčanja</div>}
                          <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>{d.details}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end", marginLeft:10, flexShrink:0 }}>
                          {d.time && <div style={{ fontSize:13, fontWeight:700 }}>🕕 {d.time}</div>}
                          {d.duration && <div style={{ fontSize:12, color:"#64748b" }}>{d.duration}min</div>}
                          {d.time && <button onClick={()=>markDone(d.origIndex)} style={{ padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:"#22c55e", color:"#fff" }}>✓ Završeno</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {activeDays.length===0 && (
              <div style={{ background:"#22c55e22", border:"1px solid #22c55e", borderRadius:12, padding:20, textAlign:"center", marginBottom:12 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>🎉</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#22c55e" }}>Svi treninzi završeni!</div>
                <div style={{ fontSize:13, color:"#86efac", marginTop:4 }}>Reset u ponedjeljak.</div>
              </div>
            )}
            <button onClick={()=>setShowHistory(!showHistory)} style={{ width:"100%", padding:10, background:"#334155", border:"none", borderRadius:10, color:"#94a3b8", fontWeight:600, fontSize:13, cursor:"pointer" }}>
              {showHistory?"▲ Sakrij historiju":"▼ Historija završenih treninga"}
            </button>
            {showHistory && (
              <div style={{ ...card, marginTop:8 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:8 }}>HISTORIJA</div>
                {(pData.doneHistory||[]).length===0 && <div style={{ color:"#64748b", fontSize:13 }}>Nema još.</div>}
                {(pData.doneHistory||[]).slice().reverse().map((d,i)=>{
                  const isThisWeek = d.weekKey===thisWeek;
                  return (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${bdr}` }}>
                      <div style={{ fontSize:13 }}>
                        <span style={{ color:"#22c55e", fontWeight:700 }}>✓ </span>
                        <span style={{ color:"#64748b" }}>{d.date}</span> — <strong>{d.day}</strong>: {d.type}
                      </div>
                      {isThisWeek && (
                        <button onClick={()=>undoDone(d.dayIndex)} style={{ padding:"4px 10px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:"#f59e0b", color:"#000", marginLeft:8, flexShrink:0 }}>↩️ Vrati</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab==="Trening" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>📝 Zapiši Trening</div>
            <div style={card}>
              <label style={{ fontSize:13, color:"#94a3b8" }}>Tip</label>
              <div style={{ display:"flex", gap:8, marginTop:6, flexWrap:"wrap", marginBottom:12 }}>
                {(pid==="slato"
                  ? [["bike","🚴 Bicikl"],["swim","🏊 Plivanje"],["strength","💪 Snaga"],["mobility","🧘 Mob."],["rehab","🦵 Rehab"],["run","🏃 Trčanje*"]]
                  : [["run","🏃 Trčanje"],["strength","💪 Snaga"],["bike","🚴 Bicikl"],["mobility","🧘 Mob."]]
                ).map(([v,l])=>(
                  <button key={v} onClick={()=>setForm({...form,type:v})} style={{ padding:"7px 12px", borderRadius:20, border:v==="run"&&pid==="slato"?"1px solid #ef4444":"none", cursor:"pointer", fontSize:13, fontWeight:700, background:form.type===v?profile.color:"#334155", color:"#fff" }}>{l}</button>
                ))}
              </div>
              {form.type==="run"&&pid==="slato"&&<div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>⚠️ Samo kad kiné odobri!</div>}
              {(form.type==="run"||form.type==="bike")&&(
                <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:100 }}><label style={{ fontSize:13, color:"#94a3b8" }}>Kilometri</label><input value={form.km} onChange={e=>setForm({...form,km:e.target.value})} placeholder="5.2" type="number" step="0.1" style={inp}/></div>
                  {form.type==="run"&&<div style={{ flex:1, minWidth:120 }}><label style={{ fontSize:13, color:"#94a3b8" }}>Pace min:sec/km</label><div style={{ display:"flex", gap:4, marginTop:6 }}><input value={form.pace_min} onChange={e=>setForm({...form,pace_min:e.target.value})} placeholder="5" type="number" style={{ ...inp, marginTop:0, width:"50%" }}/><span style={{ lineHeight:"42px", color:"#94a3b8" }}>:</span><input value={form.pace_sec} onChange={e=>setForm({...form,pace_sec:e.target.value})} placeholder="30" type="number" style={{ ...inp, marginTop:0, width:"50%" }}/></div></div>}
                </div>
              )}
              {!["run","bike"].includes(form.type)&&<div style={{ marginBottom:12 }}><label style={{ fontSize:13, color:"#94a3b8" }}>Trajanje (min)</label><input value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="45" type="number" style={inp}/></div>}
              <div style={{ marginBottom:10 }}><label style={{ fontSize:13, color:"#94a3b8" }}>HR (bpm)</label><input value={form.hr} onChange={e=>setForm({...form,hr:e.target.value})} placeholder="145" type="number" style={inp}/></div>
              <div style={{ marginBottom:10 }}><label style={{ fontSize:13, color:"#94a3b8" }}>Datum</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp}/></div>
              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:13, color:"#94a3b8" }}>RPE — koliko je bilo teško? (1 lako → 10 maksimalno)</label>
                <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n=>{
                    const c = n<=3?"#22c55e":n<=6?"#f59e0b":n<=8?"#f97316":"#ef4444";
                    return <button key={n} onClick={()=>setForm({...form,rpe:n})} style={{ width:30, height:34, borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, background:form.rpe===n?c:"#334155", color:"#fff" }}>{n}</button>;
                  })}
                </div>
              </div>
              <div style={{ marginBottom:14 }}><label style={{ fontSize:13, color:"#94a3b8" }}>Napomena</label><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Osjećaj, bol..." style={inp}/></div>
              <button onClick={logTraining} style={{ width:"100%", padding:13, background:profile.color, border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:16, cursor:"pointer" }}>✅ Zabilježi</button>
            </div>
            <div style={card}>
              <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:8 }}>HISTORIJA</div>
              {(pData.logs||[]).length===0&&<div style={{ color:"#64748b" }}>Nema treninga.</div>}
              {(pData.logs||[]).map(log=>(
                <div key={log.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${bdr}` }}>
                  <div><div style={{ fontSize:13, fontWeight:600 }}>{log.type==="run"?`🏃 ${log.km}km${log.pace_min?` @ ${log.pace_min}:${log.pace_sec||"00"}`:""}`:log.type==="bike"?`🚴 ${log.km?log.km+"km":log.duration+"min"}`:log.type==="swim"?`🏊 ${log.duration}min`:log.type==="strength"?`💪 ${log.duration||""}min`:log.type==="mobility"?`🧘 ${log.duration||""}min`:`🦵 Rehab`}{log.hr?` · ♥ ${log.hr}bpm`:""}</div><div style={{ fontSize:11, color:"#64748b" }}>{log.date}{log.rpe?` · RPE ${log.rpe}`:""}{log.notes?` · ${log.notes}`:""}</div></div>
                  <button onClick={()=>deleteLog(log.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#ef4444", fontSize:15 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="Snaga" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{pid==="slato"?"💪 Kućni trening — Trake":"🏋️ Fitnes — Nina"}</div>
            <div style={{ fontSize:13, color:"#94a3b8", marginBottom:14 }}>{strengthData[pid].note}</div>
            {strengthData[pid].blocks.map(block=>(
              <div key={block.name} style={{ ...card, borderTop:`3px solid ${block.color}` }}>
                <div style={{ fontSize:14, fontWeight:700, color:block.color, marginBottom:10 }}>{block.name}</div>
                {block.exercises.map(ex=>(
                  <div key={ex.name} style={{ padding:"10px 0", borderBottom:`1px solid ${bdr}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{ex.name}</div>
                      <div style={{ display:"flex", gap:6 }}>
                        <span style={{ background:"#334155", borderRadius:6, padding:"3px 8px", fontSize:12, color:"#cbd5e1" }}>{ex.sets}</span>
                        <a href={`https://www.youtube.com/results?search_query=${ex.yt}`} target="_blank" rel="noreferrer" style={{ background:"#ef4444", borderRadius:6, padding:"3px 8px", fontSize:11, color:"#fff", textDecoration:"none", fontWeight:700 }}>▶ YT</a>
                      </div>
                    </div>
                    <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>💡 {ex.tip}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab==="Rehab" && pid==="slato" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🦵 Rehab — Dnevni protokol</div>
            <div style={{ background:"#ef444422", border:"1px solid #ef4444", borderRadius:10, padding:10, marginBottom:12, fontSize:13, color:"#fca5a5" }}>
              Dr Fouarge — Tendinoza obje tetive. Bez rupture ✅
            </div>
            {rehabList.map(ex=>(
              <div key={ex.id} style={{ ...card, borderLeft:`3px solid ${ex.color}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{ex.name}</div>
                    <div style={{ fontSize:13, color:"#94a3b8", marginBottom:6 }}>{ex.desc}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#cbd5e1" }}>{ex.sets}</span>
                      <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#cbd5e1" }}>{ex.times}</span>
                    </div>
                  </div>
                  <button onClick={()=>setRehabDone({...rehabDone,[ex.id]:!rehabDone[ex.id]})} style={{ marginLeft:12, width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer", fontSize:18, background:rehabDone[ex.id]?"#22c55e":"#334155", color:"#fff", flexShrink:0 }}>
                    {rehabDone[ex.id]?"✓":"○"}
                  </button>
                </div>
              </div>
            ))}
            <div style={card}>
              <div style={{ fontSize:13, color:"#94a3b8", marginBottom:4 }}>Danas</div>
              <div style={{ background:"#334155", borderRadius:20, height:10, overflow:"hidden" }}>
                <div style={{ background:"#22c55e", height:"100%", borderRadius:20, width:`${(Object.values(rehabDone).filter(Boolean).length/rehabList.length)*100}%` }}/>
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>{Object.values(rehabDone).filter(Boolean).length}/{rehabList.length}</div>
            </div>
          </div>
        )}

        {tab==="Ahilova" && <AchillesTab showToast={showToast} />}

        {tab==="Prehrana" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🥗 Prehrana</div>
            <div style={{ background:"#22c55e22", border:"1px solid #22c55e", borderRadius:10, padding:10, marginBottom:12, fontSize:13, color:"#86efac" }}>✅ 100% bez šećera — bez bijelog brašna</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {[{l:"kcal",v:mealOptions[pid].macros.kcal,c:profile.color},{l:"Protein",v:`${mealOptions[pid].macros.protein}g`,c:"#22c55e"},{l:"Carbs",v:`${mealOptions[pid].macros.carbs}g`,c:"#f59e0b"},{l:"Mast",v:`${mealOptions[pid].macros.fat}g`,c:"#ec4899"}].map(({l,v,c})=>(
                <div key={l} style={{ background:bgC, borderRadius:10, padding:"10px 12px", flex:1, minWidth:80, textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{l}</div>
                  <div style={{ fontSize:17, fontWeight:700, color:c }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {mealOptions[pid].options.map((o,i)=>(
                <button key={i} onClick={()=>setMealOpt(i)} style={{ padding:"7px 12px", borderRadius:16, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:mealOpt===i?profile.color:"#334155", color:"#fff" }}>{o.num}</button>
              ))}
            </div>
            <div style={{ fontSize:15, fontWeight:700, color:profile.color, marginBottom:10 }}>{mealOptions[pid].options[mealOpt].name}</div>
            {mealOptions[pid].options[mealOpt].meals.map(m=>(
              <div key={m.n} style={card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{m.t} — {m.n}</div>
                  <span style={{ background:"#334155", borderRadius:6, padding:"2px 8px", fontSize:12, color:"#94a3b8" }}>{m.k} kcal</span>
                </div>
                <div style={{ fontSize:13, color:"#94a3b8" }}>{m.d}</div>
              </div>
            ))}

            <button onClick={()=>setShowRules(s=>!s)} style={{ width:"100%", padding:13, background:"#7c3aed", border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", marginTop:6, marginBottom:12 }}>
              📖 Pravila & savjeti pri kuhanju {showRules?"▲":"▼"}
            </button>
            {showRules && NUTRITION_RULES.map(r=>(
              <div key={r.title} style={{ ...card, borderLeft:`3px solid ${r.color}` }}>
                <div style={{ fontSize:15, fontWeight:700, color:r.color, marginBottom:8 }}>{r.icon} {r.title}</div>
                {r.tips.map((t,i)=>(
                  <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                    <span style={{ color:r.color, flexShrink:0 }}>•</span>
                    <span style={{ fontSize:13, color:"#cbd5e1", lineHeight:1.5 }}>{t}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {tab==="Suplementi" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>💊 Suplementi — {profile.emoji} {profile.name}</div>
            {supplementsData[pid].map(s=>(
              <div key={s.name} style={card}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{s.name}</div>
                  <span>{s.p}</span>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                  <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#cbd5e1" }}>💊 {s.dose}</span>
                  <span style={{ background:"#334155", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#cbd5e1" }}>⏰ {s.time}</span>
                </div>
                <div style={{ fontSize:13, color:"#94a3b8" }}>💡 {s.why}</div>
              </div>
            ))}
          </div>
        )}

        {tab==="Tjelo" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>⚖️ Težina</div>
            <div style={card}>
              <label style={{ fontSize:13, color:"#94a3b8" }}>Unesi danas (kg)</label>
              <div style={{ display:"flex", gap:10, marginTop:8 }}>
                <input value={wInput} onChange={e=>setWInput(e.target.value)} placeholder="79.5" type="number" step="0.1" style={{ ...inp, flex:1, marginTop:0 }}/>
                <button onClick={logWeight} style={{ padding:"11px 20px", background:profile.color, border:"none", borderRadius:8, color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer" }}>Spremi</button>
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:13, fontWeight:600, color:"#94a3b8", marginBottom:8 }}>HISTORIJA</div>
              {(pData.weights||[]).length===0&&<div style={{ color:"#64748b" }}>Nema mjerenja.</div>}
              {(pData.weights||[]).slice(0,12).map((w,i)=>{
                const prev=(pData.weights||[])[i+1], diff=prev?(w.weight-prev.weight).toFixed(1):null;
                return (
                  <div key={w.ts} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${bdr}` }}>
                    <span style={{ fontSize:14 }}>{w.date}</span>
                    <div style={{ display:"flex", gap:10 }}>
                      {diff!=null&&<span style={{ fontSize:12, color:parseFloat(diff)<0?"#22c55e":parseFloat(diff)>0?"#ef4444":"#64748b" }}>{parseFloat(diff)>0?"+":""}{diff}kg</span>}
                      <span style={{ fontWeight:700 }}>{w.weight}kg</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="Uređaji" && (
          <div>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:14 }}>⌚ Uređaji</div>
            <div style={{ ...card, borderLeft:"3px solid #3b82f6" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#3b82f6", marginBottom:6 }}>👨 Slato — Garmin Fénix 5X Pro</div>
              <input type="file" accept=".gpx" ref={fileRef} onChange={handleGPX} style={{ display:"none" }}/>
              <button onClick={()=>fileRef.current.click()} style={{ width:"100%", padding:11, background:"#3b82f6", border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:14, cursor:"pointer", marginBottom:8 }}>📂 Uvezi GPX fajl</button>
              <div style={{ fontSize:13, color:"#64748b" }}>Garmin Connect → Trening → ⋮ → Export GPX</div>
            </div>
            <div style={{ ...card, borderLeft:"3px solid #ec4899" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#ec4899", marginBottom:6 }}>👩 Nina — Fitbit</div>
              <div style={{ background:"#334155", borderRadius:8, padding:12, fontSize:13, color:"#cbd5e1" }}>
                Fitbit prati: km, korake, HR, san, kalorije.<br/><br/>
                Export: fitbit.com → Settings → Data Export<br/>
                Unos: Trening tab → km + HR iz Fitbit appa
              </div>
            </div>
            <div style={card}>
              <div style={{ fontSize:14, fontWeight:700, color:"#f59e0b", marginBottom:10 }}>❤️ HR Zone — {profile.emoji} (max {hrZones[pid].maxHR} bpm)</div>
              {hrZones[pid].zones.map(z=>(
                <div key={z.z} style={{ display:"flex", gap:10, padding:"7px 0", borderBottom:`1px solid ${bdr}` }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:z.c, marginTop:4, flexShrink:0 }}/>
                  <div><div style={{ fontSize:13, fontWeight:700 }}>{z.z} — {z.bpm} bpm</div><div style={{ fontSize:12, color:"#94a3b8" }}>{z.tip}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="🛒 Lista" && (
          <ShoppingList
            shoppingList={data.shoppingList || []}
            shoppingChecked={data.shoppingChecked || []}
            setShoppingList={list => setData(d => ({ ...d, shoppingList: list }))}
            setShoppingChecked={ch => setData(d => ({ ...d, shoppingChecked: ch }))}
            showToast={showToast}
          />
        )}

        {tab==="📷 Slike" && <PhotoUpload data={data} setData={setData} showToast={showToast} pid={pid} />}

        {tab==="❓ Upute" && <GuideTab />}

      </div>
    </div>
  );
}

// ─── RENDER ──────────────────────────────────────────────────
// Renderira se ovdje (na kraju app.js) jer Babel asinhrono dohvaća
// ovu skriptu — tek tu je App sigurno definiran i #root postoji.
ReactDOM.createRoot(document.getElementById("root")).render(
  React.createElement(App)
);