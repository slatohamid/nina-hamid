/**
 * Nina & Hamid — Drive Upload Web App
 * ------------------------------------------------------------
 * Ovaj skript prima slike iz aplikacije i sprema ih u Google Drive,
 * svaku u svoj folder (Hrana, Računi, Suplementi, Nalazi...).
 *
 * KAKO POSTAVITI (jednom, ~5 min):
 *  1. Otvori  https://script.google.com  → New project
 *  2. Obriši sve i zalijepi OVAJ kod (cijeli)
 *  3. Gore desno: Deploy → New deployment
 *       - Select type (zupčanik): Web app
 *       - Description: bilo šta
 *       - Execute as: Me (tvoj nalog)
 *       - Who has access: Anyone
 *     → Deploy → Authorize access → odaberi nalog → Allow
 *  4. Kopiraj "Web app URL" (završava na /exec)
 *  5. U aplikaciji: tab 📷 Slike → Postavke → zalijepi taj link → Sačuvaj
 *
 * Slike se spremaju u folder "Nina & Hamid — Slike" na tvom Drive-u.
 */

var ROOT_FOLDER = "Nina & Hamid — Slike";

// Test u browseru — ako otvoriš /exec link treba pisati da radi.
function doGet() {
  return json({ ok: true, msg: "Radi! Zalijepi ovaj /exec link u aplikaciju (tab Slike → Postavke)." });
}

// Prima sliku iz aplikacije i sprema je u Drive.
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER);
    var sub = getOrCreateFolder(root, body.folder || "Ostalo");
    var bytes = Utilities.base64Decode(body.data);
    var blob = Utilities.newBlob(bytes, body.mimeType || "image/jpeg", body.filename || "slika.jpg");
    var file = sub.createFile(blob);
    return json({ ok: true, url: file.getUrl(), name: file.getName() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getOrCreateFolder(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
