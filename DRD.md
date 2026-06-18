
---

## Table of Contents

1. [Design Philosophy & Aesthetic Direction](#1-design-philosophy--aesthetic-direction)
2. [Typography System — Deep Analysis](#2-typography-system--deep-analysis)
3. [Colour Palette — Exact Tokens](#3-colour-palette--exact-tokens)
4. [Spacing & Layout System](#4-spacing--layout-system)
5. [Background Design & Texture Language](#5-background-design--texture-language)
6. [Animation System — GSAP & Scroll](#6-animation-system--gsap--scroll)
7. [Hover & Micro-Interaction States](#7-hover--micro-interaction-states)
8. [Button Design System](#8-button-design-system)
9. [Component Inventory — Section by Section](#9-component-inventory--section-by-section)
10. [Mobile-First Responsive Behaviour](#10-mobile-first-responsive-behaviour)
11. [Image & Media Treatment](#11-image--media-treatment)
12. [ScoreUs Adaptation Guide](#12-ScoreUs-adaptation-guide)

---

## 1. Design Philosophy & Aesthetic Direction



**editorial luxury minimalism with warmth** — a specific flavour of design that feels personal, alive, and unhurried. It is not the cold techno-brutalism of Linear or Vercel. It's the opposite: warm, organic, intimate. The site feels like a lovingly printed magazine you pick up slowly, not a SaaS dashboard you scan in 10 seconds.

### The Three Core Design Principles Extracted

**1. Organic Warmth Over Sterile Tech**  
Every colour, every curve, every font choice says "human". The background is not white (#ffffff). It's a warm parchment cream (#f6f1ea). Headings are not Inter or Roboto — they're editorial serifs with personality. The site feels like it was designed by a thoughtful human for thoughtful humans.

**2. Whitespace as a Primary Design Element**  
Sections breathe. Nothing is crammed. Padding values hit 100px, 120px, 160px on desktop. There is confident negative space between every element. The design trusts the user to scroll and discover — it doesn't panic and stack everything upfront.

**3. Typography IS the Animation**  
The biggest, most memorable animations on this site are not particles or SVGs — they are the *text itself* moving, splitting, flowing. Words stagger in. Headlines animate word by word. The italic serif letterforms do more visual work than any graphic element.

### Mood Board Keywords for ScoreUs

`warm` · `editorial` · `trustworthy` · `organic` · `premium local` · `Indian warmth` · `unhurried` · `confident` · `serif + modern sans` · `parchment` · `forest green` · `conversational`

---

## 2. Typography System — Deep Analysis

### Fonts Used on heywavelength.com (Extracted from Source)

The site loads **custom-hosted woff2 fonts via Framer CDN**, which means these are **paid/licensed fonts**. Here is the exact inventory:

| Font Family | Weights/Styles | Role on Site |
|---|---|---|
| **PP Editorial Old** | Regular (400), Ultrabold (800), Regular Italic, Ultrabold Italic | Primary editorial display — the big hero headlines |
| **PP Neue Montreal** | Medium (500), Book (400) | Body text, UI text, navigation |
| **Roslindale Display Narrow** | Regular (400), Medium (500), Extra Light (200) | Secondary display / section headers |
| **Roslindale Display Condensed** | Light (300), Medium (500), Light Italic, Italic | Accent headlines — condensed style |
| **Roslindale Deck Narrow** | Medium (500), SemiBold (600) | Mid-size callouts |
| **Roslindale Text** | Medium Italic, Bold Italic, Italic, Regular Italic | Pull quotes, italic emphasis |
| **Revalyn Pixel Regular Demo** | Regular (400) | Novelty / decorative accent only |
| **Plus Jakarta Sans** | Multiple weights | Secondary sans — used for UI elements, body paragraphs |
| **Outfit** | Regular | Minimal usage — possible navbar/utility text |
| **Inter** | 400, 600, 700 (normal + italic) | Fallback / form elements |

### Font Roles Mapped

```
DISPLAY (Hero Headlines)     → PP Editorial Old Ultrabold Italic / Ultrabold
EDITORIAL (Sub-headlines)    → Roslindale Display Narrow Regular
BODY TEXT                    → PP Neue Montreal Book / Plus Jakarta Sans
UI / NAVIGATION              → PP Neue Montreal Medium / Plus Jakarta Sans
PULL QUOTES / EMPHASIS       → Roslindale Text Italic / PP Editorial Old Italic
UTILITY / CAPTIONS           → Plus Jakarta Sans 400
NOVELTY ACCENT               → Revalyn Pixel Regular Demo
```

### Font Sizes Extracted (px, desktop first)

| Scale Label | Size | Usage |
|---|---|---|
| Display XL | 72px | Hero headline (e.g. "While you're at work…") |
| Display L | 58px | Section-opening large statements |
| Display M | 46px | Mid-section callouts |
| Heading 1 | 24px | Section titles |
| Heading 2 | 22px | Card headings |
| Body L | 20px | Featured body text |
| Body M | 18px | Standard body paragraphs |
| Body S | 16px | Secondary body / descriptions |
| Caption | 15px | Small labels |
| Label | 14px | Tags, metadata |
| Micro | 12px | Legal, footer |

### Typography Behaviour Rules Extracted

**Letter Spacing:**
- `-0.03em` → Display headlines (tight, professional)
- `-0.02em` → Sub-headlines
- `0.01em` → Body text (slightly open for readability)
- `0em` → UI elements (neutral)

**Line Heights:**
- `0.7em` – `0.8em` → Display type (tightly stacked editorial look, text overlapping vertically)
- `0.9em` – `1.0em` → Mid-size heads
- `1.2em` → Body text
- `1.4em` → Long-form paragraphs

> **Key Insight:** The headline line-height of 0.7–0.8em creates the characteristic "stacked editorial" look where lines of large text sit *tightly*, almost touching. This is the most distinctive typographic signature of this design style.

### Free/Open Alternatives for ScoreUs

Since PP Editorial Old and PP Neue Montreal are paid (~$200–600 licences), here are exact free substitutes that match the aesthetic:

| Original (Paid) | Free Alternative | Source |
|---|---|---|
| PP Editorial Old Ultrabold Italic | **Cormorant Garamond Bold Italic** | Google Fonts |
| PP Editorial Old Regular | **Cormorant Garamond Regular** | Google Fonts |
| PP Neue Montreal | **DM Sans** | Google Fonts |
| Roslindale Display Narrow | **Playfair Display** | Google Fonts |
| Plus Jakarta Sans | **Plus Jakarta Sans** ✓ (already free) | Google Fonts |
| Outfit | **Outfit** ✓ (already free) | Google Fonts |

**Recommended ScoreUs Font Stack:**

```css
/* Primary Display — Big hero headlines */
--font-display: 'Cormorant Garamond', 'Playfair Display', serif;

/* Secondary Display — Section callouts */
--font-editorial: 'Playfair Display', serif;

/* Body + UI */
--font-body: 'DM Sans', 'Plus Jakarta Sans', sans-serif;

/* Mono / Labels */
--font-mono: 'DM Mono', monospace;
```

```html
<!-- Google Fonts import for ScoreUs -->
<link href="https://fonts.googleapis.com/css2?
  family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&
  family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&
  family=DM+Sans:wght@300;400;500;600&
  family=DM+Mono:wght@300;400;500&
  family=Plus+Jakarta+Sans:wght@300;400;500;600;700&
  display=swap" rel="stylesheet">
```

---

## 3. Colour Palette — Exact Tokens

### Primary Palette (Extracted from heywavelength.com CSS)

```css
:root {
  /* ─── BACKGROUNDS ─────────────────────── */
  --color-bg-primary:       #f6f1ea;   /* Warm parchment cream — main page bg */
  --color-bg-secondary:     #ece5db;   /* Slightly darker cream — alt sections */
  --color-bg-dark:          #06120b;   /* Deep forest black — dark sections */
  --color-bg-dark-mid:      #2c4839;   /* Forest green — card backgrounds */
  --color-bg-dark-light:    #324a36;   /* Lighter forest — hover states */

  /* ─── TEXT ────────────────────────────── */
  --color-text-primary:     #0d1510;   /* Near-black with green undertone */
  --color-text-secondary:   #253c31;   /* Dark forest green — secondary text */
  --color-text-muted:       #2c4839;   /* Muted green — captions */
  --color-text-on-dark:     #f6f1ea;   /* Cream on dark backgrounds */
  --color-text-link:        #0099ff;   /* Bright blue — link accent */

  /* ─── ACCENT CHIPS / TAGS ─────────────── */
  --color-chip-blue:        #dbf7ff;   /* Soft blue chip bg */
  --color-chip-green:       #dcffdb;   /* Soft green chip bg */
  --color-chip-purple:      #dedbff;   /* Soft lavender chip bg */
  --color-chip-yellow:      #faffdb;   /* Soft yellow chip bg */
  --color-chip-red:         #ffdbdb;   /* Soft red chip bg */
  --color-chip-orange:      #ffefdb;   /* Soft orange chip bg */

  /* ─── OVERLAYS ────────────────────────── */
  --color-overlay-dark:     rgba(28, 28, 28, 0.9);  /* Video/image overlay */
  --color-overlay-subtle:   rgba(44, 72, 57, 0.10); /* Subtle green tint */

  /* ─── THEME COLOR (Browser Chrome) ───── */
  --color-theme:            #f6f1ea;   /* Meta theme-color */
}
```

### Colour Usage Map for ScoreUs

| Context | Color Token | Notes |
|---|---|---|
| Page background | `#f6f1ea` | Never pure white — always this warm cream |
| Dark hero sections | `#06120b` | Used for full-bleed dark moments |
| Body text | `#0d1510` | Not pure black, has green warmth |
| Section dividers (alt bg) | `#ece5db` | Subtle background shift |
| CTA button | `#0d1510` dark on `#f6f1ea` OR inverse | |
| Pill/chip labels | The 6 soft pastels above | Rotating for variety |
| Scroll-triggered dark section | `#2c4839` | Forest green mid-tone |

### ScoreUs-Specific Additions

```css
/* ScoreUs extends the palette with brand accents */
--color-brand-gold:       #c8933a;   /* From PRD — gold accent */
--color-brand-rust:       #b84c2b;   /* From PRD — rust/negative */
--color-brand-forest:     #2a4a35;   /* Borrowed from Wavelength */
--color-star:             #f4c542;   /* Star rating yellow */
--color-whatsapp:         #25d366;   /* WhatsApp green — used sparingly */
```

---

## 4. Spacing & Layout System

### Grid System

```css
/* Breakpoints (extracted from Framer media queries) */
--bp-mobile:  0px    → 809px   (mobile-first default)
--bp-tablet:  810px  → 1199px  (tablet)
--bp-desktop: 1200px+          (desktop)
```

### Padding Scale (Extracted Values)

```css
--space-4:    4px    /* Chip internal padding */
--space-12:   12px   /* Tag padding */
--space-16:   16px   /* Small gap */
--space-20:   20px   /* Mobile section padding-x */
--space-24:   24px   /* Button padding, card gap */
--space-32:   32px   /* Component padding */
--space-40:   40px   /* Section padding-y (mobile) */
--space-60:   60px   /* Gap between large sections (tablet) */
--space-80:   80px   /* Section padding-y (tablet) */
--space-100:  100px  /* Section padding-y (desktop) */
--space-120:  120px  /* Hero top padding */
--space-160:  160px  /* XL section padding (desktop) */
--space-300:  300px  /* Massive bottom padding on hero sections */
--space-400:  400px  /* Extreme bottom padding — creates scroll-trigger space */
```

> **Key Layout Insight:** The very large bottom paddings (300px, 400px) on sections are intentional. They create the vertical scroll space needed for GSAP ScrollTrigger animations to have room to play out before the next section enters. This is the fundamental technique behind the cinematic scroll feel.

### Gap System

```css
--gap-4:   4px    /* Tight labels */
--gap-10:  10px   /* Close items */
--gap-12:  12px   /* Tags row */
--gap-16:  16px   /* List items */
--gap-20:  20px   /* Cards */
--gap-24:  24px   /* Sections internal */
--gap-26:  26px   /* Special */
--gap-32:  32px   /* Major components */
--gap-40:  40px   /* Section-level */
--gap-60:  60px   /* Large separation */
--gap-100: 100px  /* Hero elements */
--gap-167: 167px  /* Specific editorial gap */
```

### Border Radius Scale

```css
--radius-0:    0px    /* Sharp — used on full-bleed cards */
--radius-16:   16px   /* Cards */
--radius-30:   30px   /* Pill-ish rounded rectangles */
--radius-32:   32px   /* Large cards, modals */
--radius-36:   36px   /* Image containers */
--radius-full:  99px  /* Pills, chips, buttons */
```

---

## 5. Background Design & Texture Language

### What the Site Does (Detailed)

**Section 1 — Warm Cream (#f6f1ea)**  
The base background is a warm parchment. Not stark white. This single decision makes the entire site feel warmer, more inviting, and more analogue. It pairs naturally with the serif typography.

**Section 2 — Full-Bleed Dark (#06120b)**  
The site transitions into a near-black section with a deep forest-green undertone (not neutral grey/black). This creates strong contrast without feeling cold. Text on this section is cream/white.

**Section 3 — Forest Green Cards (#2c4839)**  
Individual elements and cards use a deep forest green background, reinforcing the brand's nature-influenced warmth.

**Overlay Technique**  
Videos and images use `rgba(28, 28, 28, 0.9)` overlays for legibility. This dark-dominant overlay is heavy enough to make text readable but still lets the media bleed through slightly.

**Blur Effects Used**  
- `blur(1.05px)` — very subtle background blur on some floating elements
- `blur(8px)` — frosted glass effect on card overlays
- `blur(10px)` — moderate background elements
- `blur(16px)` — heavy glassmorphism (e.g. floating notification-style card)

### For ScoreUs — Background Spec

```css
/* Section backgrounds — alternating rhythm */
.section-cream    { background: #f6f1ea; }
.section-alt      { background: #ece5db; }
.section-dark     { background: #06120b; }
.section-forest   { background: #2c4839; }

/* Texture overlay — grain noise for warmth */
.with-grain::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* SVG noise pattern */
  opacity: 0.03;
  pointer-events: none;
  z-index: 9999;
}

/* Frosted glass card */
.glass-card {
  background: rgba(246, 241, 234, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(246, 241, 234, 0.3);
}
```

---

## 6. Animation System — GSAP & Scroll

### How heywavelength.com Uses Animation

The site is a Framer project, which means animations are handled via Framer's built-in animation system (which is React + Framer Motion under the hood). However, the *patterns* are identical to what you'd implement with GSAP ScrollTrigger in a Next.js app. Here is a precise recreation spec.

---

### 6.1 Hero Text Stagger Animation

**What it does:** The hero headline animates in word by word (or phrase by phrase), staggered with a slight delay between each word.

**Extracted behaviour:**
- Words start at `opacity: 0`, `translateY: 20px`
- Each word animates to `opacity: 1`, `translateY: 0`
- Stagger delay: ~0.07s between words
- Easing: custom ease-in-out (smooth)
- Duration per word: ~0.5s

```javascript
// GSAP Implementation
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

const heroAnim = () => {
  const split = new SplitText('.hero-headline', { type: 'words' })

  gsap.from(split.words, {
    opacity: 0,
    y: 28,
    duration: 0.65,
    stagger: 0.07,
    ease: 'power3.out',
    delay: 0.3
  })
}
```

---

### 6.2 Rotating/Cycling Text Animation (Hero Typewriter)

**What it does:** The hero section has cycling text — phrases rotate in/out (e.g. "I listen to **who you are**", "I notice things **you don't**"). Each phrase slides in from below, holds, then slides out upward.

**Spec:**
- Enter: `translateY: 100%` → `translateY: 0`, `opacity: 0` → `1`, duration 0.5s
- Hold: 2.0s
- Exit: `translateY: 0` → `translateY: -100%`, `opacity: 1` → `0`, duration 0.4s
- Overflow on container: `hidden` (clips the entering/exiting text)

```javascript
// Vanilla JS / GSAP cycling text
const phrases = ['who you are', 'your energy', 'what you protect']
let current = 0

const cycleText = () => {
  const el = document.querySelector('.cycling-phrase')

  gsap.to(el, {
    y: '-100%',
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      el.textContent = phrases[current % phrases.length]
      current++
      gsap.fromTo(el,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
    }
  })
}

setInterval(cycleText, 2500)
```

---

### 6.3 Scroll-Pinned Horizontal Image Strip

**What it does:** A row of images (the profile photo collage strip) scrolls horizontally as the user scrolls vertically. The section is pinned, and the strip translates left.

**Spec:**
- Outer container: `overflow: hidden`
- Inner strip: `display: flex`, `width: 200%–300%` (wider than viewport)
- ScrollTrigger pins the section, animates `translateX` from `0` to `-50%` as scroll progresses
- Scrub: `true` (perfectly tied to scroll position)

```javascript
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

gsap.to('.image-strip', {
  x: '-50%',
  ease: 'none',
  scrollTrigger: {
    trigger: '.image-strip-section',
    start: 'top top',
    end: '+=200%',
    pin: true,
    scrub: 1,
  }
})
```

---

### 6.4 Scroll-Triggered Fade-Up (Standard Entrance)

**What it does:** Every section and significant element fades up into position as it enters the viewport.

**Spec:**
- Start state: `opacity: 0`, `y: 40px`
- End state: `opacity: 1`, `y: 0`
- Trigger: when element is 20% into viewport
- Duration: 0.8s
- Ease: `power2.out`
- No scrub — plays once on enter

```javascript
// Apply to all .reveal elements
document.querySelectorAll('.reveal').forEach(el => {
  gsap.from(el, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 80%',
      toggleActions: 'play none none none'
    }
  })
})
```

---

### 6.5 Parallax Background Shift

**What it does:** Background layers (images inside sections) scroll at a slightly different speed than the content, creating depth.

```javascript
gsap.to('.parallax-bg', {
  y: '20%',
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true
  }
})
```

---

### 6.6 Text Scale on Scroll (Large Statement Sections)

**What it does:** The large paragraph text (e.g. "The things that make two people work…") scales very slightly from 0.95 to 1.0 as it enters the viewport, combined with opacity 0 → 1.

```javascript
gsap.from('.scroll-statement', {
  scale: 0.94,
  opacity: 0,
  duration: 1.2,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.scroll-statement',
    start: 'top 75%',
  }
})
```

---

### 6.7 Auto-Scrolling Ticker / Marquee

**What it does:** The image rows on Wavelength include a duplicate-and-loop horizontal marquee — images repeat and animate infinitely left.

```css
/* CSS-only infinite marquee (no GSAP needed) */
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 30s linear infinite;
}

@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }  /* -50% because content is doubled */
}

.marquee-track:hover {
  animation-play-state: paused;
}
```

---

### 6.8 Page Load Sequence (Initial Animation)

**What it does:** On first load, the navigation fades in first, then the hero text staggers in word by word.

```javascript
const loadTimeline = gsap.timeline()

loadTimeline
  .from('.nav', { opacity: 0, y: -20, duration: 0.4, ease: 'power2.out' })
  .from('.hero-eyebrow', { opacity: 0, y: 15, duration: 0.5 }, '-=0.1')
  .from('.hero-headline .word', {
    opacity: 0,
    y: 30,
    stagger: 0.06,
    duration: 0.6,
    ease: 'power3.out'
  }, '-=0.2')
  .from('.hero-cta', { opacity: 0, y: 12, duration: 0.4 }, '-=0.3')
```

---

## 7. Hover & Micro-Interaction States

### Extracted Hover Behaviours from heywavelength.com

**Image Cards / Photo Grids**
- On hover: slight scale up (`transform: scale(1.02)`)
- Transition: `all 0.3s ease`
- Overlay shifts from `opacity: 0.1` → `opacity: 0`
- Duration: 300ms cubic-bezier

**Navigation Links**
- Underline slides in from left (CSS pseudo-element `::after`)
- `width: 0` → `width: 100%`
- Transition: `0.25s ease`
- Color shifts slightly warmer on hover

**Buttons**
- Background darkens: `#0d1510` → `#000000`
- Or inverse: cream bg + dark text → dark bg + cream text
- Scale: `1.0` → `1.02` (subtle lift)
- Transition: `background 0.2s ease, transform 0.2s ease`

**Text Links**
- Opacity: `0.75` → `1.0`
- Very fast (150ms)

**Video / Media Cards**
- On hover: play icon fades in (opacity 0 → 1, scale 0.8 → 1)
- Background overlay lightens slightly

### ScoreUs Hover Spec

```css
/* ── Button Base ────────────────────── */
.btn {
  transition:
    background-color 220ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 180ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 220ms ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(13, 21, 16, 0.15);
}

.btn:active {
  transform: translateY(0px) scale(0.98);
}

/* ── Card Hover ─────────────────────── */
.card {
  transition: transform 300ms ease, box-shadow 300ms ease;
}

.card:hover {
  transform: scale(1.015) translateY(-2px);
  box-shadow: 0 8px 32px rgba(13, 21, 16, 0.08);
}

/* ── Navigation Link ────────────────── */
.nav-link {
  position: relative;
  opacity: 0.75;
  transition: opacity 150ms ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  height: 1px;
  width: 0;
  background: currentColor;
  transition: width 250ms ease;
}

.nav-link:hover {
  opacity: 1;
}

.nav-link:hover::after {
  width: 100%;
}

/* ── Image Hover ─────────────────────── */
.media-card img {
  transition: transform 400ms ease;
}

.media-card:hover img {
  transform: scale(1.03);
}
```

---

## 8. Button Design System

### Extracted Button Patterns from heywavelength.com

**Primary Button ("Download App")**
- Background: `#0d1510` (near-black)
- Text: `#f6f1ea` (cream white)
- Font: `PP Neue Montreal Medium` / DM Sans 500
- Size: `12px–14px`, letter-spacing `0.01em`
- Padding: `12px 24px`
- Border-radius: `99px` (full pill)
- No border
- Hover: subtle scale + brightness shift

**Secondary / Ghost Button**
- Background: transparent
- Border: `1px solid rgba(13,21,16,0.25)`
- Text: `#0d1510`
- Same pill radius (`99px`)
- Hover: background fills to `rgba(13,21,16,0.06)`

**Dark Section Button (On dark bg)**
- Background: `#f6f1ea` (cream)
- Text: `#0d1510`
- Same pill shape
- Hover: background brightens to `#ffffff`

### ScoreUs Button Spec

```css
/* ── Base Button Reset ──────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.01em;
  cursor: pointer;
  border: none;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 220ms ease,
    color 220ms ease,
    transform 180ms ease,
    box-shadow 220ms ease;
}

/* ── Primary (Dark Pill) ─────────────── */
.btn-primary {
  background: #0d1510;
  color: #f6f1ea;
  padding: 12px 24px;
  border-radius: 99px;
}

.btn-primary:hover {
  background: #000000;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 21, 16, 0.2);
}

/* ── Secondary (Ghost) ───────────────── */
.btn-secondary {
  background: transparent;
  color: #0d1510;
  padding: 12px 24px;
  border-radius: 99px;
  border: 1px solid rgba(13, 21, 16, 0.25);
}

.btn-secondary:hover {
  background: rgba(13, 21, 16, 0.06);
  border-color: rgba(13, 21, 16, 0.4);
}

/* ── CTA Large (On Dark BG) ──────────── */
.btn-cta-light {
  background: #f6f1ea;
  color: #0d1510;
  padding: 16px 32px;
  border-radius: 99px;
  font-size: 16px;
}

.btn-cta-light:hover {
  background: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

/* ── Icon Button ─────────────────────── */
.btn-icon {
  background: rgba(13, 21, 16, 0.06);
  color: #0d1510;
  width: 40px; height: 40px;
  border-radius: 50%;
  padding: 0;
}

.btn-icon:hover {
  background: rgba(13, 21, 16, 0.12);
}

/* ── Active / Pressed State ──────────── */
.btn:active {
  transform: scale(0.97);
}

/* ── Focus (Accessibility) ───────────── */
.btn:focus-visible {
  outline: 2px solid #0d1510;
  outline-offset: 3px;
}
```

### Button Sizes

| Size | Padding | Font Size | Use Case |
|---|---|---|---|
| xs | `6px 14px` | 12px | Tags, compact actions |
| sm | `8px 16px` | 13px | Secondary actions |
| md (default) | `12px 24px` | 14px | Standard CTAs |
| lg | `14px 28px` | 15px | Hero section |
| xl | `16px 32px` | 16px | Primary page CTA |

---

## 9. Component Inventory — Section by Section

### Section 01 — Navigation / Navbar

**Design:**
- Fixed top, transparent background initially
- Logo left — wordmark only (no icon on mobile)
- Single CTA button right — pill-style primary button
- Background becomes semi-opaque (`rgba(246,241,234,0.9)`) with `backdrop-filter: blur(8px)` on scroll
- No hamburger menu on Wavelength (single CTA only)
- Mobile: logo left, CTA right, nothing else

**ScoreUs Nav Items:** Logo · Features · Pricing · [Sign In] · [Start Free →]

---

### Section 02 — Hero

**Layout:** Full viewport height. Centered vertically. Cream background.

**Elements:**
1. Eyebrow text — small pill label (e.g. "AI-Powered Review Management")
2. Large cycling text block — editorial serif, line-height 0.75–0.8em
3. Subheadline — DM Sans 400, 18–20px, muted colour
4. CTA button — primary dark pill
5. Social proof microtext — "Trusted by 500+ businesses" etc.

**Animations:**
- On load: sequence (see 6.8)
- Cycling phrases (see 6.2)
- Subtle background parallax on scroll

---

### Section 03 — Feature Statement (Large Scroll Section)

**Layout:** Full-width, dark background (#06120b). Very large `padding-bottom: 300–400px` to create scroll space.

**Elements:**
1. `<h1>` — huge editorial serif, 58–72px, line-height 0.8em
2. Italicised phrase embedded in headline (PP Editorial Old Italic or Cormorant Italic)
3. Text fades in as you scroll, word by word

**Animation:** GSAP SplitText word-by-word reveal (see 6.1)

---

### Section 04 — Horizontal Scroll Strip

**Layout:** Pinned section. Content scrolls horizontally as user scrolls down.

**Elements:** Row of cards/screenshots — QR scan flow, WhatsApp conversation screens, Dashboard mockup.

**Animation:** GSAP ScrollTrigger pin + horizontal translate (see 6.3)

---

### Section 05 — Marquee Social Proof

**Layout:** Full-width infinite scroll row. Two rows, opposite directions.

**Elements:** Business logos OR review snippets OR customer photos.

**Animation:** CSS marquee (see 6.7), pause on hover.

---

### Section 06 — Feature Detail Cards

**Layout:** Staggered grid. 1-col mobile → 2-col tablet → 3-col desktop.

**Each Card:**
- Icon (24–32px)
- Heading — Playfair Display 22px
- Body — DM Sans 400 16px
- Rounded corners `border-radius: 16–32px`
- Background: either cream `#f6f1ea` or white `#ffffff`
- Soft shadow: `box-shadow: 0 2px 16px rgba(13,21,16,0.06)`

**Animation:** Staggered fade-up on scroll enter (each card +0.1s delay)

---

### Section 07 — Large Quote / Pull Statement

**Layout:** Centered, max-width 720px. Dark or cream background.

**Elements:**
1. Opening `"` — large serif punctuation (80–100px, low opacity)
2. Quote text — Cormorant Garamond Italic, 28–36px, line-height 1.4em
3. Attribution — DM Sans 400, muted, 14px

**Animation:** Scale-from-0.94 on scroll enter (see 6.6)

---

### Section 08 — How It Works (Flow)

**Layout:** Vertical step flow on mobile, horizontal timeline on desktop.

**Elements per step:**
- Step number — DM Mono, small, gold accent colour
- Icon or illustration
- Step title — Playfair Display 20px
- Step description — DM Sans 400 15px

**Connector lines:** CSS `::after` pseudo-elements

**Animation:** Each step reveals sequentially as you scroll

---

### Section 09 — Pricing

**Layout:** 3-column card grid (1-col mobile → 3-col desktop)

**Each Pricing Card:**
- Plan name — Playfair Display 700
- Price — Cormorant Garamond 900, large (48px)
- Feature list — DM Sans 400, `::before` dash markers
- CTA button — primary or secondary
- Featured plan: dark background (`#0d1510`), cream text, slightly taller

**Animation:** Cards fade-up with stagger

---

### Section 10 — Footer

**Layout:** 2-column on desktop (brand left, links right). Stacked on mobile.

**Elements:**
- Logo (wordmark)
- Tagline — DM Sans 300, muted
- Link columns — DM Sans 400, 14px
- Legal text — 12px, opacity 0.5
- Social icons — 20px, opacity 0.6 → 1.0 on hover
- Background: `#0d1510` dark

---

## 10. Mobile-First Responsive Behaviour

### Core Strategy

The site is designed **mobile-first** with Framer breakpoints at `809px` (tablet) and `1199px` (desktop). Everything starts with the mobile layout and expands outward.

### Typography Scaling

```css
/* Font sizes scale down on mobile */
@media (max-width: 809px) {
  /* Display XL: 72px → 40px */
  .display-xl { font-size: clamp(36px, 10vw, 72px); }

  /* Display L: 58px → 32px */
  .display-l  { font-size: clamp(30px, 8vw, 58px); }

  /* Display M: 46px → 26px */
  .display-m  { font-size: clamp(24px, 6vw, 46px); }

  /* Body stays at 16px minimum */
  .body-m { font-size: 16px; }
}
```

### Layout Shifts

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Navigation | Logo + CTA only | Logo + links + CTA | Full nav |
| Hero | Single column | Single column | Single column (centered) |
| Feature cards | 1 column | 2 columns | 3 columns |
| Pricing | 1 column (scroll) | 2 columns | 3 columns |
| Footer | Stacked | 2 columns | 3 columns |
| Image strip | Horizontal scroll (native) | Pinned scroll | Pinned scroll |

### Mobile Spacing Adjustments

```css
@media (max-width: 809px) {
  .section     { padding: 60px 20px; }
  .section-lg  { padding: 80px 20px; }
  .hero        { padding: 80px 20px 120px; }

  /* Remove extreme padding-bottom (GSAP needs less room on mobile) */
  .scroll-pinned-section { padding-bottom: 80px; }
}
```

### Touch Interactions

- All hover states have equivalent `active` states for mobile
- Tap targets minimum `44px × 44px`
- Marquee strip: `overflow-x: auto` on mobile with `scroll-snap-type: x mandatory`
- Scroll-pinned horizontal strip: converted to native horizontal scroll on mobile

---

## 11. Image & Media Treatment

### Photo Grid Style

The site uses real photography — candid, warm, slightly desaturated lifestyle shots. Not stock imagery. Not illustrations.

**Image Treatment:**
- Slight warm tone overlay on some images: `rgba(245, 228, 206, 0.1)` tint
- Rounded corners: `border-radius: 16px–36px`
- `object-fit: cover` always
- Aspect ratios: `4:5` (portrait) and `4:3` (landscape) dominant
- On hover: scale 1.0 → 1.03 with `overflow: hidden` on parent

### Video Cards

The site embeds autoplay silent videos (`.mp4`/`.webm`) within card-like containers.

**Spec:**
- `autoplay` `muted` `loop` `playsinline`
- Container: `border-radius: 16–32px`, `overflow: hidden`
- Aspect ratio: `9:16` (portrait video = phone screenshots) or `16:9` (landscape)
- Lazy loaded

### For ScoreUs

Use screenshots of the WhatsApp conversation, the QR scan flow, and the dashboard as the primary media. These should look like real phone screenshots — not mockup frames. Warm background tones behind them.

---

## 12. ScoreUs Adaptation Guide

### How to Translate the Wavelength Design Language to ScoreUs

ScoreUs is a B2B SaaS. Wavelength is a consumer app. The *tone* adapts — ScoreUs should feel like a premium-but-approachable tool for business owners, not an intimate dating product. But the aesthetic language transfers perfectly.

### Copywriting Style (Mirror Wavelength's Tone)

Wavelength copy is **first-person AI voice**: "I listen to who you are." "I notice things you don't."

ScoreUs CAN do the same: **"I listen to your customers so you don't have to."** "While you're making dosas, I'm having conversations." The product's AI agent *Priya* can speak in first person on the marketing site.

| Wavelength Phrase | ScoreUs Equivalent |
|---|---|
| "I listen to who you are" | "I listen to every customer" |
| "I notice things you don't" | "I catch problems before they go public" |
| "Then I go meet everyone" | "Then I bring you the ones who matter" |
| "While you're at the gym…" | "While you're running your restaurant…" |

### Section-by-Section Mapping

| Wavelength Section | ScoreUs Version |
|---|---|
| Hero — "I listen to who you are" cycling text | Hero — AI Priya says: "I listen to every customer who walks through your door" with rotating business types |
| Big dark scroll section — "While you're at work…" | "While you're making food, I'm making sure your reputation grows" |
| Horizontal photo strip | Horizontal strip of restaurant/clinic/gym real photos |
| Pull quote — "The things that make two people work…" | "The things that make a business thrive aren't in any Google rating. They're in every conversation that never made it online." |
| "& then your phone lights up" | "& then you get the alert. A new 5-star review." |
| Notification card | WhatsApp message card — the exact conversation the AI had |
| "The longer I know you, the better I know you" | "The more customers I talk to, the sharper your insights get." |
| CTA — "Download app" | CTA — "Start Free Today →" |

### CSS Variables Master Sheet for ScoreUs

```css
:root {
  /* Typography */
  --font-display:  'Cormorant Garamond', 'Playfair Display', serif;
  --font-editorial:'Playfair Display', serif;
  --font-body:     'DM Sans', 'Plus Jakarta Sans', sans-serif;
  --font-mono:     'DM Mono', monospace;

  /* Type Scale */
  --text-xs:    12px;
  --text-sm:    14px;
  --text-base:  16px;
  --text-lg:    18px;
  --text-xl:    20px;
  --text-2xl:   24px;
  --text-3xl:   30px;
  --text-4xl:   36px;
  --text-5xl:   46px;
  --text-6xl:   58px;
  --text-7xl:   72px;

  /* Colours */
  --color-bg:           #f6f1ea;
  --color-bg-alt:       #ece5db;
  --color-bg-dark:      #06120b;
  --color-bg-forest:    #2c4839;
  --color-text:         #0d1510;
  --color-text-muted:   #253c31;
  --color-text-light:   #f6f1ea;
  --color-accent:       #c8933a;
  --color-accent-rust:  #b84c2b;
  --color-whatsapp:     #25d366;

  /* Spacing */
  --sp-4:    4px;   --sp-8:   8px;   --sp-12:  12px;
  --sp-16:  16px;  --sp-20:  20px;  --sp-24:  24px;
  --sp-32:  32px;  --sp-40:  40px;  --sp-60:  60px;
  --sp-80:  80px;  --sp-100:100px;  --sp-120:120px;
  --sp-160:160px;

  /* Radii */
  --r-sm:   8px;
  --r-md:  16px;
  --r-lg:  32px;
  --r-xl:  36px;
  --r-full:99px;

  /* Shadows */
  --shadow-sm:  0 1px 8px rgba(13,21,16,0.04);
  --shadow-md:  0 4px 20px rgba(13,21,16,0.08);
  --shadow-lg:  0 8px 40px rgba(13,21,16,0.12);

  /* Transitions */
  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
  --duration-slow: 400ms;
  --duration-xl:   800ms;
}
```

---

## Quick Reference Cheat Sheet

| Property | Wavelength Value | ScoreUs Value |
|---|---|---|
| Page BG | `#f6f1ea` | `#f6f1ea` (same) |
| Dark Section BG | `#06120b` | `#06120b` (same) |
| Body text | `#0d1510` | `#0d1510` (same) |
| Display font | PP Editorial Old | Cormorant Garamond |
| Body font | PP Neue Montreal | DM Sans |
| H1 size (mobile) | ~38–42px | `clamp(36px, 10vw, 72px)` |
| H1 line-height | 0.75–0.8em | 0.8em |
| Letter spacing (display) | -0.03em | -0.03em |
| Button shape | Pill (`99px`) | Pill (`99px`) |
| Button padding | `12px 24px` | `12px 24px` |
| Border radius (cards) | 16–36px | 16–32px |
| Section padding-y (desktop) | 100–160px | 100–120px |
| Scroll pin space | 300–400px extra | 200–300px extra |
| Marquee speed | ~30s per cycle | 30–40s per cycle |
| Image hover scale | 1.03 | 1.02–1.03 |
| Card blur (glass) | blur(16px) | blur(12–16px) |
| Text stagger delay | 0.07s/word | 0.07s/word |

---

*ScoreUs DRD — Analysed from heywavelength.com source code · May 2026*  
*Prepared for development handoff · Mobile-first implementation*