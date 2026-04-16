# plato.

An AI-powered hotel review platform that generates **personalised follow-up questions** based on each guest's written review and star rating.

---

## How it works

1. **Select** — swipe through hotel cards
2. **Review** — write your experience + pick a star rating
3. **AI questions** — Claude reads your review and generates 5 bespoke follow-up questions tailored to what you wrote and the property's known data gaps
4. **Insights** — two views powered by Claude:
   - **For Guests** — scored categories (1–10) that will appear on future listings
   - **For Managers** — a prioritised improvement report with action steps

Two Claude API calls are made per review session:

| Call | Prompt goal | Max tokens |
|------|-------------|------------|
| `generateQuestions` | Produce 5 targeted questions from review text | 700 |
| `generateInsights` | Score categories + build manager report | 1200 |

Both calls gracefully fall back to static defaults if the API is unavailable.

---

## Project structure

```
plato/
├── public/
│   └── index.html
├── src/
│   ├── index.js        ← React entry point
│   ├── App.js          ← Root wrapper
│   └── Plato.jsx       ← Entire application
├── package.json
└── README.md
```

---

## Getting started

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
npm start

# Production build
npm run build
```

**Node requirement:** 16+  
**React version:** 18

---

## Customising properties

Edit the `PROPERTIES` array in `src/Plato.jsx`. Each property object supports:

```js
{
  id:      "unique-id",          // used for gradient lookup
  name:    "Hotel Name",
  city:    "City, Country",
  stars:   4,                    // 1–5
  avg:     4.2,                  // community average rating
  count:   152,                  // number of existing reviews
  tagline: "Short poetic line",
  tags:    ["Tag1", "Tag2"],     // shown on card
  gaps:    ["topic a", ...],     // data gaps — fed to Claude for question generation
  weak:    ["weak area", ...],   // currently underperforming
  strong:  ["strong area", ...], // currently excelling
}
```

To add property photos, replace `GRADIENTS[id]` references in the component with `<img>` elements pointing to your image URLs.

---

## Claude API

This app calls `https://api.anthropic.com/v1/messages` directly from the browser.  
The API key is injected by the Anthropic platform when running inside Claude.ai artifacts.

For standalone deployment, add your key as a request header or proxy calls through your own backend.

---

## Design tokens

All colours live in the `C` object at the top of `Plato.jsx`:

```js
const C = {
  navy:    "#00355F",
  yellow:  "#FDDB32",
  cream:   "#FAFAF8",
  ...
};
```

Fonts: **Playfair Display** (headings / wordmark) + **DM Sans** (body)  
Both loaded from Google Fonts via the embedded CSS string.
