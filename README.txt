釣りいこ！マグロ大作戦 — Web release, 2026-10

Run npm start to serve the source. Run npm test for web model/save regressions.
Run npm run build:web to create web-dist, then serve that directory over HTTP.
The release uses original procedural Canvas art and credited CC0 recordings in audio/CREDITS.txt.

This release starts fresh at 3 fish / 4 metres / zero money. It uses
tsuriiko.game.release202610.v1. Previous storage keys are never read, changed,
migrated or deleted. Current saves stop safely on corruption or storage failure.

The existing review-core URL remains a separate historical review candidate.
No ads, purchases, analytics, accounts or external game APIs are connected.

iOS/TestFlight are outside this web release. Native project files remain in the
repository for future work; the old native storage contract is not compatible
with this release yet. Do not treat the web checks as native validation.
The prepare-testflight branch retains the previous native preparation.
Legacy tests under tests/ describe the previous implementation; npm test now
runs the current web release tests listed above.

play-offline.html redirects to the HTTP-served index; audio is served as local
assets. Opening files through file:// is not a supported release mode.
