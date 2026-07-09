# TikTok Accessibility

*English description. [Magyar leírás itt olvasható](README.hu.md).*

A browser extension that makes tiktok.com usable with screen readers (optimized for NVDA). It is not a separate app: it runs on the normal TikTok website, with your own account, after you sign in. Announcements follow your browser's language: Hungarian in a Hungarian browser, English otherwise.

## Features

- **Keyboard audio control** – TikTok's mute/volume control is mouse-only and unlabeled; the extension controls the video element directly and re-applies your chosen volume on every new video. (This also fixes the common "no sound" problem: TikTok starts muted by default and remembers it.)
- **Video navigation** – next/previous video with a single key.
- **Automatic announcements** – when you scroll, NVDA reads the new video's author and description.
- **Interactions** – like, open/close comments from the keyboard.
- **Labeling** – unlabeled icon buttons (like, comment, share…) get proper `aria-label`s.
- Settings (volume, mute, auto-announce) persist across browser restarts.

## Keyboard shortcuts

Every command is a **single key** when NVDA is in **focus mode** (toggle: `NVDA+Space`). From **browse mode**, the same keys work with `Alt+Shift` (e.g. `Alt+Shift+M`).

| Key | Function |
|---|---|
| `M` | Mute / unmute |
| `,` (comma) | Volume down 10% |
| `.` (period) | Volume up 10% (also unmutes) |
| `K` | Play / pause |
| `N` | Next video |
| `P` | Previous video |
| `L` | Like / remove like |
| `F` | Add to / remove from favorites |
| `S` | Copy the video link to the clipboard |
| `C` | Open / close comments (while open, reading stays inside the panel, like in a dialog) |
| `I` | Detailed info about the current video (author, description, music, counts, state) |
| `A` | Toggle automatic video announcements |
| `H` | Help (reads the key list) |

> **Note:** if you have multiple keyboard layouts installed in Windows, `Alt+Shift` switches layouts by default. In that case either use focus mode with the single-key commands, or disable the layout-switching hotkey (Settings → Time & Language → Typing → Advanced keyboard settings → Input language hot keys).

## Download and install

The extension is not in a web store yet; download it from GitHub and load it as an "unpacked" extension. It takes about 2 minutes and is fully doable with a screen reader — every step below names the exact buttons and links so you can find them with NVDA.

### Step 1: download from GitHub

1. On this page (the project's GitHub front page), find the button named **"Code"** (with NVDA: press `B` to jump between buttons, or search for the word "Code").
2. In the dropdown, choose the **"Download ZIP"** link. Your browser downloads a ZIP file (named something like `tiktok-accessibility-main.zip`).
3. Open your Downloads folder, select the ZIP file and extract it: context menu (Applications key or Shift+F10) → **"Extract All…"** → Extract.
4. **Important:** put the extracted folder somewhere you won't delete it (e.g. Documents), because the browser runs the extension from that folder. If you delete or move the folder, the extension disappears.

### Step 2 for Chrome or Edge

1. Type `chrome://extensions` in the address bar (`edge://extensions` in Edge) and press Enter.
2. Find the **"Developer mode"** toggle (with NVDA: search for "Developer") and turn it on (Space).
3. New buttons appear. Choose **"Load unpacked"**.
4. In the folder picker, browse to the extracted folder. **Select the folder that directly contains `manifest.json`** (extraction sometimes creates a folder inside a folder with the same name — pick the inner one).
5. Done. Open (or refresh with F5) tiktok.com — the extension announces itself: "TikTok accessibility helper active".
6. Note: Chrome may warn about developer-mode extensions on every start ("Disable developer mode extensions") — choose **"Cancel"**, otherwise it turns the extension off.

### Step 2 for Firefox

1. Type `about:debugging#/runtime/this-firefox` in the address bar and press Enter.
2. Choose the **"Load Temporary Add-on…"** button.
3. In the file picker, select `manifest.json` from the extracted folder.
4. **Important limitation:** Firefox removes temporarily loaded add-ons when the browser closes, so you must reload it after every restart. If you use Firefox regularly, let the author know — permanent installation is possible with Mozilla's free signing.

### Updating to a newer version

1. Download the ZIP again (Step 1) and extract it to the same place, overwriting the old files.
2. Chrome/Edge: on the `chrome://extensions` page, press the **"Reload"** button on the extension's card, or simply restart the browser.
3. Refresh the TikTok tab (F5).

## Quick start with NVDA

1. Open tiktok.com and sign in.
2. Press `NVDA+Space` for **focus mode** — single-key commands work from here.
3. No sound? Press `M` (unmute), then `.` (period) to raise the volume.
4. Use `N`/`P` to move between videos; NVDA automatically reads each new video's author and description.
5. To read content (e.g. comments), switch back to browse mode (`NVDA+Space`) — the Alt+Shift commands still work there.

## Known limitations

- TikTok changes its page structure often; a feature (e.g. reading the author, or finding the like button) may break. This is fixable by updating the `SEL` selector list at the top of `content.js` — please report anything that stops speaking.
- Writing comments uses TikTok's own input field; it is at the end of the open comment panel (Tab or arrow down to reach it).
- The extension only helps on the website, not in TikTok's desktop (Microsoft Store) app.
