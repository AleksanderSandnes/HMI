# Security policy

## Supported versions

Only the latest release published from `main` (web, Android/iOS app and the
Growatt backend) receives security fixes.

## Reporting a vulnerability

Email **aleksandersandnes78@gmail.com** with the subject `HMI security`. Include
the affected component, reproduction steps and the impact you observed. Do not
open a public issue and do not access other users' data while testing.

You will get an acknowledgement within 5 working days and a status update at
least every 14 days until the issue is resolved. Please allow a fix to ship
before any public disclosure.

## Scope

In scope: the web app, the mobile apps, `backend/growattAPI`, Supabase
functions, database policies and this repository's CI configuration.
Out of scope: Supabase, Vercel, Render, Expo, Growatt and Weather.com platforms
themselves — report those to the vendor.

The current audit status is in `docs/SECURITY_AUDIT.md`.
