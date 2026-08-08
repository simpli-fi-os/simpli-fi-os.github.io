// Single source of truth for the published security.txt body.
//
// Vercel's `headers` rules in vercel.json are not applied to static files under
// `/.well-known/`, which is why the live document was served without
// `X-Content-Type-Options: nosniff`. The AASA document already works around this
// by being served from a serverless function that sets its own headers, so
// security.txt uses the same proven path.
//
// There is deliberately NO static `.well-known/security.txt`. Vercel resolves
// the filesystem before it applies `rewrites`, so a static file at the source
// path wins and the function never runs. Commit 117aaa3 removed the static AASA
// for exactly this reason; keeping a "fallback" file here would silently
// reinstate the missing-nosniff bug this module exists to fix.
export const familySecurityTxt = `Contact: mailto:ready@simpli-fi-os.com
Expires: 2027-07-16T04:59:59Z
Preferred-Languages: en
Canonical: https://simpli-fi-os.com/.well-known/security.txt
Policy: https://simpli-fi-os.com/family/security/
`
