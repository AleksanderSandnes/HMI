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

## Still to produce (needs the running app or design tools)

- Screenshots captured from a demo account with fictional data only (phone, 7" and 10" tablet,
  iPhone 6.9"/6.7", iPad 13"). Review every image before committing.
- Play feature graphic (1024x500) and hi-res icon (512x512).
- Review notes with demo reviewer credentials (supplied to the store console, never committed).

Legal-sensitive text (privacy claims, data-safety answers) must be reviewed by the owner before submission.
