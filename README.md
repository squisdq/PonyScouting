# Pony Scouting

A mobile-first scouting app for **FIRST® Tech Challenge** teams. Scouts record what other robots can do, the whole team sees the notes instantly, and it keeps working at venues with bad or no Wi-Fi.

> Unofficial. Not affiliated with or endorsed by FIRST® or FTCScout.

## Features

- **Team workspaces with access codes.** Register your team, get a code like `ABCD-EFGH-JKLM`, share it with teammates. Only people with the code can open your data.
- **Sessions per competition.** Create a session for each event and keep all scouting cards inside it.
- **Scouting cards.** Team number and name, driving style, driving skill (1–5), scoring types (Flower, Pollen, Nectar), autonomous, intake, shooter/scoring, endgame, comments and breakdowns. Search cards by team number.
- **FTCScout integration.** Link an event to a session to see matches, rankings and team stats. Teams from the event are added as cards automatically, filling in numbers and names without touching cards you already made.
- **Analytics.** OPR (overall and by Auto / TeleOp / End when the data has it), an EPA-style rating, consistency index, and a per-match trend chart.
- **Alliance selection tools.** A drag-and-drop pick list, a color-coded pick matrix, and partner suggestions that favor teams strong where yours is weak.
- **Field canvas.** Mark autonomous start points, driving paths and pickup zones directly on the field image.
- **PWA and offline mode.** Install it to the home screen. Cards you add offline are saved on the device and synced when the internet returns.
- **Light and dark themes** with a slowly drifting background.

## For scouts: quick start

1. Open the site. Choose **New team** to register (needs internet) or **Sign in with code** if your team already has one.
2. Save the access code and share it with your team. It cannot be recovered.
3. Create a session, for example “Almaty Regional 2026”.
4. Tap **Link FTCScout competition**, pick the season, search the event or enter its code. Event teams appear as cards.
5. Add or edit cards while you watch matches. Use the **field** button on a card to draw paths and zones.
6. Check **Matches**, **Rankings**, **Analytics** and **Alliance** before alliance selection.
7. Before the event: open the site once with internet, then add it to your home screen (iPhone: Share → Add to Home Screen; Android: menu → Install app). It then works without a connection.

Offline, you can open sessions and add or edit cards. FTCScout data is shown from the last download, so refresh it while you are online. Changes from different devices show up for everyone once those devices have been online.

## Self-hosting

No build step: plain files served from the `docs/` folder.

1. **Firebase.** Create a project, enable Firestore, register a Web app, and paste its config into `docs/js/firebase.js`. The values are public identifiers, not secrets.
2. **Firestore rules.** Publish:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /workspaces/{code} {
         allow get: if true;
         allow create: if true;
         match /{document=**} { allow read, write: if true; }
       }
     }
   }
   ```

3. **Hosting.** Push the repository to GitHub, then Settings → Pages → Deploy from a branch → `main` → `/docs`.
4. **Fonts (optional).** The design uses the commercial font Tobi, which is not included. Put licensed files in `docs/fonts/` as `Tobi.woff2` and `Tobi-Light.woff2` (`.ttf` or `.otf` also work). Without them the browser falls back to a system font.
5. **Texts.** All on-screen text lives in `docs/js` (mostly `constants.js` and `components/`). Replace `[your e-mail or Telegram]` in `components/Footer.js` with your contact.

## Access model and privacy

Data lives under `workspaces/{code}`. The code is 12 random characters (60 bits), and the rules do not allow listing workspaces, so data cannot be found without the code. It is a secret link, not a personal account: anyone with the code can read and change that team's data, and a lost code cannot be recovered. For stricter control, add Firebase Authentication.

The app has no ads or analytics. The server stores what you enter (Firebase Firestore). The browser stores your team codes, theme, an offline data copy and a cache of FTCScout responses.

## Tech

React 18 (via esm.sh) with `htm` templates, Tailwind CSS (CDN), Firebase Firestore 10 with offline persistence, a service worker for the app shell, and the public FTCScout REST API. No bundler, no npm.

```
docs/
  index.html, sw.js, manifest.webmanifest
  css/theme.css            colors, fonts, animated background
  img/                     backgrounds, field image, icons
  js/
    firebase.js            your Firebase config
    workspace.js           access codes
    ftcscout.js            API client and cache
    analytics.js           OPR, EPA, consistency, suggestions
    components/            screens and tabs
```

## Limitations

- FTCScout responses are parsed defensively. If the API changes, some fields may be missing.
- EPA here is the app's own online rating inspired by Statbotics, not an official metric.
- Early in an event there are few matches, so analytics are rough.
- Early-season score breakdowns may be incomplete, so Auto / TeleOp / End columns can be absent.

## Credits

Match data from [FTCScout](https://ftcscout.org). Built on Firebase. FIRST® and FIRST® Tech Challenge are trademarks of their owners.

## License

Add your license here. Fonts, background artwork and the field image are not covered by the code license.