---
name: Simpli-FI Family Public
description: Calm, private family coordination in black, white, and one action lime.
colors:
  ink: "#0b0b0b"
  white: "#ffffff"
  wash: "#f4f4f4"
  soft: "#e9e9e9"
  line: "#d3d3d3"
  muted: "#666666"
  quiet: "#6f6f6f"
  action-lime: "#9edd36"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(3rem, 8vw, 5.75rem)"
    fontWeight: 790
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.25rem)"
    fontWeight: 780
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Helvetica Neue, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "22px"
  lg: "38px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.action-lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 22px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "14px 22px"
    height: "52px"
  content-surface:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "32px"
---

## Overview

The Family public surface should feel like a clear household agreement laid on a clean kitchen counter: direct, tangible, and composed enough to reduce tension. It is a restrained black-and-white system with a single lime action signal. Pages use large, compact native typography, ruled structure, and generous pacing rather than decorative dashboards or stacked cards. The legacy studio homepage retains its own identity; these tokens govern `/family` and its child routes.

## Colors

Black and true neutral grays create hierarchy. White is the primary canvas; wash and soft separate sections without warm beige tinting. `#9EDD36` is the exact lime from the approved dimensional-F icon and appears only on interactive primary actions. It is never used as decoration, status color, body text, or a section background. Text must maintain WCAG AA contrast; quiet copy uses `#6F6F6F` or darker on white.

## Typography

Use the Apple system stack so the web surface feels continuous with the release app and loads without third-party font requests. Display type is heavy, compact, and never tighter than `-0.04em`. Body copy stays between 65 and 75 characters per line, uses sentence case, and favors short concrete language. Labels are plain sentence case rather than recurring tracked uppercase eyebrows.

## Elevation

The system is mostly flat. One-pixel grayscale rules define sections and rows. Important interactive or illustrative surfaces may use a crisp offset shadow with no blur, echoing a physical index card; avoid diffuse “ghost card” shadows and glass effects. Keyboard focus uses a high-contrast black outline with clear offset.

## Components

Primary buttons are lime with black text, a black border, and a restrained offset press effect. Secondary actions are white with a black border. The approved dimensional-F icon is the only brand image required on utility pages. Process steps and support answers use ruled lists and sections rather than identical cards. The invitation panel is a singular, centered utility surface with a polite live region; it never renders or stores the token.

Responsive layouts collapse from asymmetric two-column compositions to a single readable column. Navigation keeps the brand and one high-value action visible, while secondary links yield on small screens. All tap targets are at least 44 by 44 CSS pixels.

## Do's and Don'ts

- Do reserve lime for the next primary action and verify black-on-lime contrast.
- Do use the approved app icon and release-backed language.
- Do give legal and support prose generous measure, headings, and anchored navigation.
- Do remove motion when `prefers-reduced-motion` is set and keep content visible without animation.
- Don’t use gradients, colored stripes, decorative pills, glass panels, or repeated icon cards.
- Don’t expose invitation tokens in text, DOM attributes, storage, logs, analytics, or referrers.
- Don’t fabricate screenshots, testimonials, availability, or child-privacy guarantees.
