/**
 * Nina & Hamid — Drive Upload Web App
 * ------------------------------------------------------------
 * Prima slike iz aplikacije i sprema ih u POSTOJEĆU strukturu foldera
 * unutar "Nina & Hamid — Training Hub" na Google Drive-u.
 *
 * KAKO POSTAVITI (jednom, ~5 min):
 *  1. Otvori  https://script.google.com  → New project
 *  2. Obriši sve i zalijepi OVAJ kod (cijeli)
 *  3. Gore desno: Deploy → New deployment
 *       - Select type (zupčanik): Web app
 *       - Execute as: Me (nalog koji ima Training Hub folder)
 *       - Who has access: Anyone
 *     → Deploy → Authorize access → odaberi nalog → Allow
 *  4. Kopiraj "Web app URL" (završava na /exec)
 *  5. U aplikaciji: tab 📷 Slike → Postavke → zalijepi link → Sačuvaj
 */

// ID foldera "Nina & Hamid — Training Hub" (već popunjeno za vaš Drive).
// Ako ikad promijeniš lokaciju, zamijeni ovaj ID.
var ROOT_FOLDER_ID = "13krrnlKJAote1PSn7vLNTkB8VUDl4ONz";

// Test u browseru — ako otvoriš /exec link treba pisati da radi.
function doGet() {
  return json({ ok: true, msg: "Radi! Zalijepi ovaj /exec link u aplikaciju (tab Slike → Postavke)." });
}

// Prima sliku (upload) ili zahtjev za brisanje (action: "delete").
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // Brisanje: nađi fajl po imenu u folderu i baci u smeće.
    if (body.action === "delete") {
      var dfolder = getFolderByPath(body.path || "04_Slike");
      var files = dfolder.getFilesByName(body.filename || "");
      var n = 0;
      while (files.hasNext()) { files.next().setTrashed(true); n++; }
      return json({ ok: true, deleted: n });
    }

    // Upload: spremi sliku u folder po putanji (npr. "04_Slike/Hrana_Racuni").
    var folder = getFolderByPath(body.path || "04_Slike");
    var bytes = Utilities.base64Decode(body.data);
    var blob = Utilities.newBlob(bytes, body.mimeType || "image/jpeg", body.filename || "slika.jpg");
    var file = folder.createFile(blob);
    return json({ ok: true, id: file.getId(), url: file.getUrl(), name: file.getName() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function getRoot() {
  return DriveApp.getFolderById(ROOT_FOLDER_ID);
}

// Prati putanju "a/b/c" od root foldera; pravi foldere koji fale.
function getFolderByPath(path) {
  var parts = String(path).split("/").filter(function (p) { return p && p.trim(); });
  var cur = getRoot();
  for (var i = 0; i < parts.length; i++) {
    cur = getOrCreateFolder(cur, parts[i]);
  }
  return cur;
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
