# 📷 Slanje slika na Google Drive — podešavanje (jednom)

App može slikati hranu, račune, suplemente, etikete i nalaze pa ih poslati
**direktno u Google Drive**, svaku u svoj folder. Da to proradi, treba jednom
napraviti mali "most" preko Google Apps Script-a. Traje ~5 minuta.

## Korak po korak

1. Otvori **https://script.google.com** i klikni **New project**.
2. Obriši sav postojeći kod, pa **zalijepi cijeli sadržaj** fajla
   [`google-apps-script.gs`](google-apps-script.gs).
3. Gore desno: **Deploy → New deployment**.
   - Klikni zupčanik **⚙️ Select type → Web app**
   - **Execute as:** _Me_ (tvoj nalog)
   - **Who has access:** _Anyone_
   - **Deploy** → **Authorize access** → odaberi svoj Google nalog → **Allow**
     (Ako piše "Google hasn't verified this app": Advanced → Go to … (unsafe) →
     Allow. To je tvoj vlastiti skript, sigurno je.)
4. Kopiraj **Web app URL** — link koji završava na `/exec`.
5. U aplikaciji otvori tab **📷 Slike → Postavke**, zalijepi taj link i klikni
   **💾 Sačuvaj link**.

Gotovo! 🎉

## Kako se koristi

1. Tab **📷 Slike**
2. Odaberi kategoriju (Hrana / Računi / Suplementi / Etikete / Nalazi)
3. **📷 Slikaj i pošalji** (otvara kameru) ili **🖼️ Odaberi iz galerije**
4. Slika automatski ode u folder **`Nina & Hamid — Slike`** na Drive-u,
   u podfolder po kategoriji.

## Napomene

- Link se čuva **na ovom telefonu** (u pregledniku). Ako koristite dva telefona,
  zalijepite isti link na oba.
- Slike se spremaju na Drive **onog naloga koji je deployao skript** (najbolje
  glavni nalog na kojem su folderi).
- Ako želiš promijeniti imena foldera, izmijeni `folder` vrijednosti u
  `app.js` (lista `PHOTO_CATEGORIES`) i naziv `ROOT_FOLDER` u skripti.
