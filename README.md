# Simpli-FI OS

**Software that eliminates friction.**

Simpli-FI OS is a software studio building open-source tools for identity, recruiting, local commerce, community stewardship, and operational compliance. Based in Denton, Texas.

> Chaos is not a character flaw. It is a systems failure. We fix systems.

---

## The Portfolio

| Project | Description | Stack | Repo |
|---------|-------------|-------|------|
| **Simpli-FI ID** | Business Cards 2.0 — digital identity platform with gamified achievements, journey tracking, and QR-code sharing | Firebase, HTML/JS | [simpli-fi-id](https://github.com/simpli-fi-os/simpli-fi-id) |
| **Ready to Serve** | Candidate Development as a Service — recruiting platform for Fire, EMS, Law Enforcement, and Military with living "Baseball Card" profiles | Next.js, TypeScript, Supabase | [ready-to-serve](https://github.com/simpli-fi-os/ready-to-serve) |
| **The Stewardship Initiative** | Privacy-conscious skills directory for churches — helping faith communities discover and leverage member expertise | Community, Skills Matching | [the-stewardship-initiative](https://github.com/simpli-fi-os/the-stewardship-initiative) |
| **Made Local Co.** | THE search engine for locally made and grown goods — connecting consumers with local artisans, craftsmen, and farmers | Next.js, Supabase, PostGIS, Stripe | [madelocalco](https://github.com/simpli-fi-os/madelocalco) |
| **Simpli-FI Admin** | Compliance engine for Registered Investment Advisers and General Partners — regulatory filing, client management, and operational oversight | Node.js | [simpli-fi-admin](https://github.com/simpli-fi-os/simpli-fi-admin) |

---

## Philosophy

### Clinical Logic + Tactical Logistics

Every project in this portfolio was born from a real gap — problems we've seen firsthand in fire stations, churches, small towns, and financial offices. We don't build software for the sake of building software.

**Three principles guide everything we ship:**

1. **Solve Real Problems** — If the pain isn't real, we don't build it. Every project starts with a person we've met who has a problem nobody else is solving.

2. **Build in the Open** — Open source by default. The best tools come from transparency, community contribution, and shared ownership.

3. **Mission Over Margin** — Revenue matters, but impact matters more. Every project carries a mission weight, and we optimize for people served.

---

## Tech Stack

The studio works across a modern, production-grade stack:

- **Frontend:** Next.js, React, Tailwind CSS, TypeScript
- **Backend:** Node.js, Supabase, Firebase
- **Database:** PostgreSQL, PostGIS, Firestore
- **Payments:** Stripe
- **AI:** Claude API, Grok API
- **Hosting:** Vercel, Firebase Hosting
- **Design:** Figma, Tailwind

---

## About

Simpli-FI OS is the creation of **Benjamin "Hunter" Lott** — a Fire Captain with the City of Denton, TX, a Registered Investment Adviser, and a builder.

- Fire Captain, City of Denton
- Father of four
- Denton, Texas

---

## Site

This repository is the source for **[simpli-fi-os.com](https://simpli-fi-os.com)**.
Vercel is the sole intended production host because the Family release contract
requires explicit security headers, cache controls, canonical redirects, and
an extensionless Apple App Site Association response. The GitHub Actions
workflow verifies source only; it does not deploy or claim the custom domain.

The portfolio root remains static HTML. The Family surface adds local CSS,
JavaScript, legal/support routes, a dependency-free Node test suite, and a
fail-closed production verifier.

### Run locally

```bash
# Use Node 22.16.0, then run the exact local gates
npm test
npm run build

# Optional local static server
npx serve .
```

## Simpli-FI Family public routes

The App Store support and universal-link surface lives at:

- `/family/`
- `/family/support/`
- `/family/privacy/`
- `/family/join/#token=<short-lived-invite>`
- `/.well-known/apple-app-site-association`

The invitation page removes the fragment from browser history before rendering state. URL fragments are not included in HTTP requests, and the client code never places the token in the DOM, browser storage, analytics, console output, or a link attribute. Invitations remain short-lived and single-use, and the installed app performs the authoritative token validation and claim.

Run the dependency-free local gates with:

```bash
npm test
npm run build
```

After an approved deployment, verify the real origin with:

```bash
npm run verify:family:production -- https://simpli-fi-os.com
```

The trailing-slash HTML URLs above are canonical because each route is published from a directory `index.html`; each must return `200` directly. Slashless aliases may redirect only to their matching trailing-slash URL. Generated invitation URLs use the canonical trailing-slash route and carry their capability only in the fragment.

**Production associated-domains status: HOLD.** This local source proves the
route and AASA content contract only. An approved Vercel deployment must serve
the exact association file directly as `application/json` and pass every
required header, redirect, and content check before live approval. See
[FAMILY-PUBLIC-RELEASE-GATE.md](FAMILY-PUBLIC-RELEASE-GATE.md).

---

## All Repositories

| Repo | Description |
|------|-------------|
| [simpli-fi-id](https://github.com/simpli-fi-os/simpli-fi-id) | Business Cards 2.0 |
| [ready-to-serve](https://github.com/simpli-fi-os/ready-to-serve) | Recruiting as a Service |
| [the-stewardship-initiative](https://github.com/simpli-fi-os/the-stewardship-initiative) | Skills directory for churches |
| [madelocalco](https://github.com/simpli-fi-os/madelocalco) | Search engine for local goods |
| [simpli-fi-admin](https://github.com/simpli-fi-os/simpli-fi-admin) | Compliance engine for RIAs |
| [cards](https://github.com/simpli-fi-os/cards) | ID Cards |
| [assets](https://github.com/simpli-fi-os/assets) | Shared assets |
| [breanne](https://github.com/simpli-fi-os/breanne) | Document reader and generator |
| [dfd_catalog](https://github.com/simpli-fi-os/dfd_catalog) | Resource catalog |

---

## License

MIT

---

*Built with purpose in Denton, TX.*
