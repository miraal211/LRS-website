# Open the corrected LRS website

Extract this ZIP into a **new folder**. Do not merge it with your old extracted copy: that may retain an auto-generated launch configuration.

## Simplest: no VS Code, server, or installation

Double-click `index.html` beside this file. The complete site opens in your default browser.

## VS Code: press F5

1. In VS Code, choose **File → Open Workspace from File** and select `LRS.code-workspace` beside this file. This sets the correct project root, even if you extracted the ZIP inside another folder.
2. Open **Run and Debug**.
3. Select **LRS - Open in Chrome (no server needed)**, or the **Edge** option if you use Edge.
4. Press **F5**.

These configurations open `site/index.html` directly. They do not point at localhost and do not require a running server. The chosen browser must be installed. If VS Code cannot find that browser, use the other browser option or double-click `index.html` outside VS Code.

## Optional: localhost

Requires Node.js 18 or newer. No `npm install` is needed.

- In Run and Debug, choose **LRS - Start localhost + Chrome (requires Node.js)** and press F5. It starts the server and waits for its ready message before launching Chrome.
- Or open a terminal in this folder and run `npm start` (equivalently `node scripts/serve.mjs`). Open the exact `http://127.0.0.1:...` address printed in the terminal.

The server starts on port 8000. If that port is busy, it chooses an available port and prints its address. Keep the server running; stopping it makes that address unavailable. Use HTTP, not HTTPS.

Python remains an alternative: `python3 -m http.server 8000 --directory site` (Windows: `py -m http.server 8000 --directory site`). Start that command inside this folder, then visit `http://localhost:8000`.

## This edition

This is the immersive LRS edition: mosque greeting/loader, floating oval navigation, horizontal events, scroll-controlled sunlight, looping gallery, gold Islamic borders and the numbered FAQ.

All JavaScript libraries, fonts, video and homepage photographs are included. The default file launch does not use localhost. If your computer has Reduce Motion enabled, decorative motion and autoplay are intentionally disabled.

On desktop, scroll down through Events to travel sideways. On phones, swipe the cards. The pause/play and arrow buttons also work. The sun moves with your scroll through the prayer section. The ∞ button at the bottom-right toggles looping back to the top after the footer.

## Validation limits

The automated page, prayer, calendar and actual HTTP server tests passed. Browser visual appearance and VS Code's GUI launch could not be verified in this environment. If your editor reports an error, use the double-click option first and include the exact error text when reporting it.
