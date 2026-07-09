# TikTok Akadálymentesítő

Böngészőbővítmény, amely a tiktok.com webhelyet teszi használhatóvá képernyőolvasóval (NVDA-ra optimalizálva). Nem külön alkalmazás: a normál TikTok weboldalon fut, a saját fiókoddal, bejelentkezés után.

## Mit tud?

- **Hangvezérlés billentyűvel** – a TikTok némítás/hangerő gombja egérrel érhető csak el és címkézetlen; a bővítmény közvetlenül a videót vezérli, és minden új videón kikényszeríti a beállított hangerőt. (Ez oldja meg azt is, hogy „nincs hang”: a TikTok alapból némítva indul, és megjegyzi.)
- **Videónavigáció** – következő/előző videó egyetlen billentyűvel.
- **Automatikus bejelentés** – görgetéskor az NVDA felolvassa az új videó szerzőjét és leírását.
- **Interakciók** – kedvelés, kommentek megnyitása/bezárása billentyűvel.
- **Címkézés** – a címkézetlen ikongombok (kedvelés, komment, megosztás…) magyar `aria-label`-t kapnak.
- A beállítások (hangerő, némítás, automatikus bejelentés) megmaradnak a böngésző újraindítása után is.

## Billentyűparancsok

Minden parancs **egyetlen billentyű**, ha az NVDA **fókusz módban** van (váltás: `NVDA+Szóköz`). **Böngészőmódból** ugyanezek `Alt+Shift`-tel együtt működnek (pl. `Alt+Shift+M`).

| Billentyű | Funkció |
|---|---|
| `M` | Némítás be/ki |
| `,` (vessző) | Halkítás 10%-kal |
| `.` (pont) | Hangosítás 10%-kal (némításból is felold) |
| `K` | Lejátszás / szünet |
| `N` | Következő videó |
| `P` | Előző videó |
| `L` | Kedvelés / kedvelés visszavonása |
| `C` | Kommentek megnyitása / bezárása (nyitott panel alatt az olvasás a panelen belül marad, mint egy párbeszédablakban) |
| `I` | Aktuális videó részletes adatai (szerző, leírás, zene, számlálók, állapot) |
| `A` | Automatikus videóbejelentés ki/be |
| `H` | Súgó (billentyűlista felolvasása) |

> **Figyelem:** ha a Windowsban több billentyűzetkiosztás van telepítve, az `Alt+Shift` alapból a kiosztások közt vált. Ilyenkor vagy használd a fókusz módot az egybetűs parancsokkal, vagy kapcsold ki a kiosztásváltó gyorsbillentyűt (Beállítások → Idő és nyelv → Gépelés → Speciális billentyűzetbeállítások → Beviteli nyelvi gyorsbillentyűk).

## Letöltés és telepítés

A bővítmény egyelőre nincs bővítményáruházban, innen GitHubról kell letölteni, és „kicsomagolt” bővítményként betölteni. Ez kb. 2 percet vesz igénybe, és képernyőolvasóval is végigcsinálható. A leírásban minden lépésnél a gombok/hivatkozások pontos neve szerepel, így NVDA-val kereshetők.

### 1. lépés: letöltés GitHubról

1. Ezen az oldalon (a projekt GitHub-főoldalán) keresd meg a **„Code”** nevű gombot (NVDA-val: `B` billentyűvel gombról gombra lépkedve, vagy keresés a „Code” szóra).
2. A lenyíló menüben válaszd a **„Download ZIP”** hivatkozást. A böngésző letölt egy ZIP-fájlt (a neve valami ilyesmi: `tiktok-akadalymentesito-main.zip`).
3. Nyisd meg a Letöltések mappát, állj a ZIP-fájlra, és csomagold ki: helyi menü (Alkalmazás-billentyű vagy Shift+F10) → **„Az összes kibontása…”** → Kibontás gomb.
4. **Fontos:** a kicsomagolt mappát olyan helyre tedd, ahonnan nem fogod törölni (pl. Dokumentumok), mert a böngésző onnan futtatja a bővítményt. Ha a mappát letörlöd vagy áthelyezed, a bővítmény eltűnik.

### 2. lépés, Chrome vagy Edge esetén

1. Írd be a címsorba: `chrome://extensions` (Edge-ben: `edge://extensions`), és nyomj Entert.
2. Keresd meg a **„Fejlesztői mód”** kapcsolót (NVDA-val: keresés a „Fejlesztői” szóra), és kapcsold be (Szóköz).
3. Megjelenik néhány új gomb. Válaszd a **„Kicsomagolt bővítmény betöltése”** gombot.
4. A megnyíló mappaválasztóban keresd ki a kicsomagolt mappát. **Azt a mappát jelöld ki, amelyikben közvetlenül a `manifest.json` fájl van** (a kicsomagolásnál előfordulhat, hogy a ZIP neve szerinti mappán belül van még egy ugyanolyan nevű mappa – akkor a belsőt válaszd).
5. Kész. Nyisd meg (vagy frissítsd F5-tel) a tiktok.com-ot – a bővítmény bejelentkezik: „TikTok akadálymentesítő aktív”.
6. Megjegyzés: a Chrome minden indításnál figyelmeztethet a fejlesztői módú bővítményre („Fejlesztői módban futó bővítmények letiltása” kérdés) – ott a **„Mégse”** választandó, különben kikapcsolja a bővítményt.

### 2. lépés, Firefox esetén

1. Írd be a címsorba: `about:debugging#/runtime/this-firefox`, és nyomj Entert.
2. Válaszd az **„Ideiglenes kiegészítő betöltése…”** gombot.
3. A fájlválasztóban keresd ki a kicsomagolt mappából a `manifest.json` fájlt, és nyisd meg.
4. **Fontos korlát:** a Firefox az így betöltött kiegészítőt a böngésző bezárásakor eltávolítja, tehát minden indítás után újra be kell tölteni. Ha Firefoxot használsz rendszeresen, szólj a készítőnek – a Mozilla ingyenes aláírásával tartós telepítés is megoldható.

### Frissítés újabb verzióra

1. Töltsd le újra a ZIP-et (1. lépés), és csomagold ki ugyanoda, a régi fájlok felülírásával.
2. Chrome/Edge: a `chrome://extensions` oldalon a bővítmény kártyáján nyomd meg a **„Frissítés”** (újratöltés) gombot, vagy egyszerűen indítsd újra a böngészőt.
3. Frissítsd a TikTok lapot (F5).

## Használat NVDA-val – gyorstalpaló

1. Nyisd meg a tiktok.com-ot és jelentkezz be.
2. Nyomd meg az `NVDA+Szóköz`-t a **fókusz módhoz** – innentől az egybetűs parancsok működnek.
3. Ha nincs hang: nyomj `M`-et (némítás feloldása), majd `.` (pont) billentyűvel hangosíts.
4. `N`/`P` a videók közt, közben az NVDA automatikusan felolvassa az új videó szerzőjét és leírását.
5. Ha olvasgatni akarsz (pl. kommenteket), válts vissza böngészőmódba (`NVDA+Szóköz`) – az Alt+Shift-es parancsok ott is működnek.

## Ismert korlátok

- A TikTok gyakran változtatja a weboldala felépítését; ilyenkor egy-egy funkció (pl. a szerző felolvasása vagy a like gomb megtalálása) eltörhet. Ez a `content.js` elején lévő `SEL` szelektorlista frissítésével javítható – jelezd, ha valami nem szólal meg.
- A kommentírás a TikTok saját beviteli mezőjével megy; a mező a nyitott kommentpanelen belül, annak végén érhető el (Tab vagy lefelé nyilazás).
- A bővítmény csak a webes felületen segít, a TikTok asztali (Microsoft Store-os) alkalmazásán nem.
