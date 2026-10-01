# Store listing assets

Text for the Google Play and App Store listings, in English (`en-US`) and Norwegian Bokmål (`nb-NO`).
Every string is plain fictional-data-free marketing copy; nothing here contains personal data.

```
store/
  android/listing/<locale>/{title,short_description,full_description}.txt
  ios/<locale>/{name,subtitle,keywords,promotional_text,description}.txt
```

## Store limits

| Field                                         | Limit |
| --------------------------------------------- | ----- |
| Play title / App Store name / subtitle        | 30    |
| Play short description                        | 80    |
| Play full description / App Store description | 4000  |
| App Store keywords                            | 100   |
| App Store promotional text                    | 170   |

`scripts/check-store-listing.mjs` enforces these limits and is run by the repository checks.

## Screenshots (regenerable, fictional data only)

`store/screenshots/<device>/<locale>/*.png` — dashboard, solar, weather and settings for
`phone` (1080x1920), `tablet-7` (1200x1920), `tablet-10` (1600x2560) and `desktop` (2880x1800),
in `en` and `nb`. Regenerate with Docker running:

```sh
npm run store:screenshots
```

The script starts the **local** Supabase stack (it refuses any non-local URL), applies
`supabase/seed_demo.sql` (fictional "Emma Nordmann" / `demo@example.com`; the seed refuses
databases that contain real accounts), builds the web app against it and runs
`apps/web/playwright.store.config.ts`. Every solar and weather request is answered from
`apps/web/tests/store/fixtures.ts`, so no Growatt or Weather.com account is involved. If port
54322 is taken by another local stack, prefix the command with `SUPABASE_DB_PORT=54422`.
Review every image before committing.

## Play graphics

`store/android/graphics/feature-graphic.png` (1024x500) and `icon-512.png` (512x512) are
rendered from the app icon, the en-US title/short description and the fictional phone
dashboard screenshot: `node scripts/render-store-graphics.mjs` (run after the screenshots).

## Still to produce

## Expo phone screenshots

`store/screenshots/mobile/phone/{en,nb}/` contains four reviewed 1080x1920
captures per language from the Expo app exported to web. Source: Store screenshots
run 36862228058, artifact `mobile-store-screenshots`, 1 October 2026.
These use fictional demo data. They are separate from the Next.js screenshots
above and do not replace native iOS simulator captures or a signed-build smoke test.

## Remaining native assets

The Expo screenshot configuration also captures a 13-inch iPad viewport at
1032x1376 points with 2x scale (2064x2752 pixels). These captures are stored under
`store/screenshots/mobile/ipad-13/{en,nb}/` and are exported-to-web images;
native iPad simulator screenshots remain a separate release task.
Eight reviewed iPad images are committed from run 36862228058. The phone
captures were refreshed from the same run to include Norwegian compass labels
and the chart edge-label fix. All sixteen image dimensions were verified.

- Native-app screenshots for iPhone 6.9"/6.7" and iPad 13" (needs the Expo build on a simulator).
- Production reviewer account: create it in the hosted project with a secret password and give
  the credentials to the store consoles only — never commit them. Do not run `seed_demo.sql`
  against production.

Legal-sensitive text (privacy claims, data-safety answers) must be reviewed by the owner before submission.
