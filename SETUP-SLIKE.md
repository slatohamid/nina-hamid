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

1. Gore odaberi osobu (👨 Slato ili 👩 Nina) — bitno za nalaze i foto napretka.
2. Tab **📷 Slike**
3. Odaberi kategoriju; app pokaže tačan folder gdje slika ide.
4. **📷 Slikaj i pošalji** (kamera) ili **🖼️ Odaberi iz galerije**
5. Slika automatski ode u odgovarajući folder na Drive-u.

## Gdje slike završe (postojeća struktura)

| Kategorija u appu | Folder na Drive-u |
|---|---|
| 🍽️ Hrana / računi | `04_Slike/Hrana_Racuni` |
| 💊 Suplementi | `04_Slike/Suplementi` |
| 📸 Foto napretka | `04_Slike/Slato_Progress` ili `Nina_Progress` |
| 🩸 Krvna slika | `01_Medicinski_Nalazi/Slato/Krvna_Slika` ili `Nina/...` |
| 💊 Recepti / ljekovi | `01_Medicinski_Nalazi/Slato/Recepti_Ljekovi` ili `Nina/...` |

Nalazi i foto napretka idu u folder **trenutno odabrane osobe** (Slato/Nina).

## Napomene

- Link se čuva **na ovom telefonu** (u pregledniku). Ako koristite dva telefona,
  zalijepite isti link na oba.
- Skript sprema u folder `Nina & Hamid — Training Hub` (po ID-u, već popunjeno).
  Ako želiš dodati/promijeniti kategorije, izmijeni `PHOTO_CATEGORIES` u `app.js`.
