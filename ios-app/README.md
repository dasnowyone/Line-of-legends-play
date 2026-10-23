# Line of Legends for iPhone

The web game (`../index.html`) wrapped as an iPhone app with Capacitor, so it can go to TestFlight and the App Store.

- `make-www.cjs` copies the game into `www/` with the font bundled, so the app works offline.
- `ios/` is the Xcode project (bundle ID `com.dasnowyone.lineoflegends`, iPhone only, pencil-blade icon).
- `.github/workflows/iphone.yml` builds it on a GitHub Mac whenever `index.html` changes.
  Without the Apple secrets it only checks that the app compiles. With them it signs the app and uploads it to TestFlight.

GitHub secrets (Settings > Secrets and variables > Actions):

| Secret | What it is |
| --- | --- |
| `APPLE_TEAM_ID` | The 10-character Team ID from developer.apple.com > Membership details |
| `ASC_KEY_ID` | The App Store Connect API key's Key ID |
| `ASC_ISSUER_ID` | The Issuer ID shown above the keys list |
| `ASC_KEY_P8` | The whole text of the downloaded `AuthKey_XXXX.p8` file |
