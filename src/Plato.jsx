import { useState, useRef, useEffect } from "react";

const C = {
  navy: "#00355F", yellow: "#FDDB32", cream: "#FAFAF8",
  gray100: "#F3F4F6", gray200: "#E5E7EB", gray400: "#9CA3AF",
  gray600: "#6B7280", gray900: "#111827",
  green: "#16a34a", red: "#dc2626", orange: "#d97706",
};

const QUOTES = [
  { text: "Travel is the only thing you buy that makes you richer.", attr: "— Anonymous" },
  { text: "The world is a book, and those who do not travel read only one page.", attr: "— Saint Augustine" },
  { text: "We travel not to escape life, but for life not to escape us.", attr: "— Anonymous" },
  { text: "Not all those who wander are lost.", attr: "— J.R.R. Tolkien" },
  { text: "To travel is to live.", attr: "— Hans Christian Andersen" },
];

const PROPERTIES = [
  {
    id: "roma", name: "Hotel Termini Roma", city: "Rome, Italy", stars: 4, avg: 4.2, count: 152,
    tagline: "Where history breathes",
    tags: ["Historic", "Elegant", "Central"],
    gaps: ["value for money", "check-in experience", "neighborhood satisfaction", "communication"],
    weak: ["eco-friendliness", "room amenities"],
    strong: ["room cleanliness", "service", "hotel condition"],
  },
  {
    id: "beach", name: "Sunset Beach Resort", city: "New Smyrna Beach, FL", stars: 3, avg: 2.8, count: 765,
    tagline: "Salt air, no schedule",
    tags: ["Oceanfront", "Breezy", "Casual"],
    gaps: ["value for money", "check-in experience", "listing accuracy", "communication"],
    weak: ["hotel condition", "room cleanliness"],
    strong: ["service", "beach location"],
  },
  {
    id: "frisco", name: "Grand Frisco Hotel", city: "Frisco, TX", stars: 4, avg: 4.5, count: 1094,
    tagline: "Modern comfort, Texas scale",
    tags: ["Modern", "Spacious", "Connected"],
    gaps: ["value for money", "check-in experience", "eco-friendliness"],
    weak: ["room comfort scores"],
    strong: ["room cleanliness", "service", "hotel condition", "room amenities"],
  },
  {
    id: "pompei", name: "Pompei Heritage Inn", city: "Pompei, Italy", stars: 3, avg: 3.1, count: 50,
    tagline: "Sleep beside eternity",
    tags: ["Ancient", "Intimate", "Authentic"],
    gaps: ["value for money", "check-in experience", "room comfort", "communication"],
    weak: ["hotel condition", "eco-friendliness"],
    strong: ["room cleanliness", "service"],
  },
];

// Property gradient colors (used in place of images)
const GRADIENTS = {
  roma: "linear-gradient(135deg, #1a0a00, #8B4513 50%, #C9A96E)",
  beach: "linear-gradient(135deg, #0c2340, #1e5f8c 50%, #7ec8e3)",
  frisco: "linear-gradient(135deg, #1a0030, #4c1d95 50%, #8B5CF6)",
  pompei: "linear-gradient(135deg, #1a0a00, #92400e 50%, #D97706)",
};

const scoreColor = (s) => (s >= 8 ? C.green : s >= 6 ? C.orange : C.red);

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
  *{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
  ::-webkit-scrollbar{display:none;}
  *{scrollbar-width:none;-ms-overflow-style:none;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(32px) scale(0.98);}to{opacity:1;transform:translateY(0) scale(1);}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(253,219,50,0.55);}60%{box-shadow:0 0 0 16px rgba(253,219,50,0);}}
  @keyframes qUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
  @keyframes flipExit{from{transform:perspective(900px) rotateY(0deg);opacity:1;}to{transform:perspective(900px) rotateY(88deg);opacity:0;}}
  @keyframes flipEnter{from{transform:perspective(900px) rotateY(-88deg);opacity:0;}to{transform:perspective(900px) rotateY(0deg);opacity:1;}}
  @keyframes qOut{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(-14px);}}
  @keyframes qIn{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}
  .opt-btn:hover:not(:disabled){background:#00355F !important;color:#FDDB32 !important;border-color:#00355F !important;}
`;

// ── OPENAI API CALLS ─────────────────────────────────────────────────────────

async function callClaude(prompt, maxTokens = 900) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  const d = await res.json();
  const raw = d.choices?.[0]?.message?.content || "{}";
  return JSON.parse(raw.replace(/```json\n?|```\n?/g, "").trim());
}

/**
 * Generates 5 personalised follow-up questions based on the guest's
 * written review, star rating, and known property data gaps.
 */
async function generateQuestions(prop, rating, reviewText) {
  const prompt = `You are a hotel review assistant. A guest just reviewed "${prop.name}" (${prop.stars} stars, ${prop.city}).

Their star rating: ${rating}/5
Their written review: "${reviewText}"

Known property strengths: ${prop.strong.join(", ")}
Known data gaps (topics needing more feedback): ${prop.gaps.join(", ")}

Generate exactly 5 targeted follow-up questions that:
1. Probe specific things mentioned or implied in THEIR review text
2. Fill the known data gaps for this property
3. Are short, direct, and feel personal — not generic
4. Each has 4 answer options (short phrases, no punctuation)
5. Vary in tone: some about specifics, some emotional, some comparative

Respond ONLY with valid JSON in this exact format:
{"questions":[
  {"cat":"Category","q":"Question text?","opts":["Opt A","Opt B","Opt C","Opt D"]},
  ...5 items total
]}`;

  try {
    const result = await callClaude(prompt, 700);
    const qs = result?.questions || result;
    if (Array.isArray(qs) && qs.length >= 4) return qs.slice(0, 5);
  } catch (e) {}
  return null;
}

/**
 * Generates guest-facing insight scores and manager-facing improvement
 * report, both shaped by the personalised follow-up answers.
 */
async function generateInsights(prop, rating, reviewText, questions, answers) {
  const aText = questions
    .map((q) => `${q.cat}: "${answers[q.cat] || "skipped"}"`)
    .join("; ");

  const prompt = `Generate hotel property insights for two audiences.
Property: ${prop.name}, ${prop.city} (${prop.stars} stars). Community avg: ${prop.avg}/5.
Known strengths: ${prop.strong.join(", ")}. Data gaps: ${prop.gaps.join(", ")}.
Guest star rating: ${rating}/5
Guest written review: "${reviewText}"
Follow-up answers: ${aText}

Respond ONLY valid JSON, no markdown:
{"forGuests":[{"category":"short name","score":7,"label":"brief 4-word label","basis":"1 response"}],"forManagers":[{"priority":"high","area":"area name","finding":"2 sentence insight","action":"specific action step","benchmark":"peer context note"}]}
Return exactly 4 forGuests items (scores 1-10) and 3 forManagers items.`;

  try {
    const result = await callClaude(prompt, 1200);
    if (result?.forGuests && result?.forManagers) return result;
  } catch (e) {}
  return null;
}

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Wordmark({ size = 28, light = false }) {
  return (
    <div
      style={{
        fontSize: size,
        fontFamily: "'Playfair Display', Georgia, serif",
        fontStyle: "italic",
        color: light ? "#fff" : C.navy,
        fontWeight: 600,
        letterSpacing: -0.5,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      plato<span style={{ color: C.yellow, fontStyle: "normal" }}>.</span>
    </div>
  );
}

function PropertyHero({ prop, height = 200 }) {
  return (
    <div
      style={{
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        height,
backgroundImage: `url(/images/${prop.id === 'roma' ? 'roma.webp' : prop.id + '.jpg'})`,
backgroundSize: "cover",
backgroundPosition: "center",      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 18,
          right: 18,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 21,
            fontWeight: 700,
            color: "#fff",
          }}
        >
          {prop.name}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", marginTop: 4 }}>
          {prop.city} · {prop.stars}-star · {prop.count} reviews
        </div>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Plato() {
  const [screen, setScreen] = useState("select");
  const [prop, setProp] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // AI-generated questions (null = not yet generated)
  const [questions, setQuestions] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [qKey, setQKey] = useState(0);
  const [answers, setAnswers] = useState({});
  const [transitioning, setTransitioning] = useState(false);

  const [insights, setInsights] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quotePhase, setQuotePhase] = useState("in");
  const [flipAnim, setFlipAnim] = useState("idle");
  const [flipped, setFlipped] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const carouselRef = useRef(null);

  // Quote cycling on loading screens
  useEffect(() => {
    if (screen !== "loading" && screen !== "genq" && screen !== "loading2") return;
    const iv = setInterval(() => {
      setQuotePhase("out");
      setTimeout(() => {
        setQuoteIdx((i) => (i + 1) % QUOTES.length);
        setQuotePhase("in");
      }, 520);
    }, 3400);
    return () => clearInterval(iv);
  }, [screen]);

  const handleCarouselScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / PROPERTIES.length;
    setActiveCard(Math.min(Math.round(el.scrollLeft / cardW), PROPERTIES.length - 1));
  };

  // ── STEP: Continue from review → generate questions ──────────────────────
  async function handleContinue() {
    if (!rating || reviewText.trim().length < 10) return;
    setScreen("genq"); // show "Reading your review…"

    const qs = await generateQuestions(prop, rating, reviewText);
    setQuestions(qs); // may be null if API failed — fallback used in questions screen
    setQIndex(0);
    setQKey(0);
    setAnswers({});
    setScreen("questions");
  }

  // ── STEP: Answer a question ──────────────────────────────────────────────
  async function handleSelectAnswer(opt) {
    if (transitioning) return;
    const currentQ = (questions || FALLBACK_QUESTIONS)[qIndex];
    const newAnswers = { ...answers, [currentQ.cat]: opt };
    setAnswers(newAnswers);
    setTransitioning(true);

    setTimeout(async () => {
      const qs = questions || FALLBACK_QUESTIONS;
      if (qIndex < qs.length - 1) {
        setQIndex((i) => i + 1);
        setQKey((k) => k + 1);
        setTransitioning(false);
      } else {
        // Last question answered → generate insights
        setScreen("loading2");
        const ins = await generateInsights(prop, rating, reviewText, qs, newAnswers);
        setInsights(ins || fallbackInsights(qs, newAnswers));
        setScreen("insights");
      }
    }, 400);
  }

  // ── Fallback data ────────────────────────────────────────────────────────
  function fallbackInsights(qs, ans) {
    const sc = (cat, good, ok) =>
      ans[cat]?.includes(good) ? 9 : ans[cat]?.includes(ok) ? 6 : 4;
    return {
      forGuests: [
        {
          category: "Arrival",
          score: sc("Arrival", "Effortless", "Quick"),
          label: ans["Arrival"] || "Response collected",
          basis: "1 new response",
        },
        {
          category: "Value",
          score: sc("Value", "Exceptional", "Fair"),
          label: ans["Value"] || "Response collected",
          basis: "1 new response",
        },
        {
          category: "Comfort",
          score: sc("Comfort", "Perfect", "Mostly"),
          label: ans["Comfort"] || "Response collected",
          basis: "1 new response",
        },
        {
          category: "Service",
          score: sc("Service", "cared", "Professional"),
          label: ans["Service"] || "Response collected",
          basis: "1 new response",
        },
      ],
      forManagers: [
        {
          priority: "high",
          area: "Check-in experience",
          finding:
            "Arrival friction is the leading gap vs peer properties. First impressions drive overall satisfaction scores more than any other single factor.",
          action:
            "Introduce digital pre-check-in and provide a welcome card covering parking, amenity hours, and included services.",
          benchmark:
            "Top comparable properties average 8.4/10 on arrival in this region.",
        },
        {
          priority: "medium",
          area: "Value perception",
          finding:
            "Guests are uncertain what is included in their rate, creating a perceived gap between price and experience regardless of actual quality.",
          action:
            "Send a pre-arrival email listing exactly what is included — amenities, meals, fees — to set clear expectations.",
          benchmark:
            "Properties with proactive value comms see measurable uplift in satisfaction.",
        },
        {
          priority: "low",
          area: "Listing completeness",
          finding:
            "Key amenity details are absent from the listing, leaving prospective guests without critical decision-making information.",
          action:
            "Audit listing with current pool, gym, and dining availability. Request amenity confirmation from next ten reviewers.",
          benchmark:
            "No peer benchmark yet — collecting this data creates early listing advantage.",
        },
      ],
    };
  }

  // ── Flip animation ───────────────────────────────────────────────────────
  function handleFlipToggle(toManager) {
    if ((toManager && flipped) || (!toManager && !flipped) || flipAnim !== "idle")
      return;
    setFlipAnim("exit");
    setTimeout(() => {
      setFlipped(toManager);
      setFlipAnim("enter");
      setTimeout(() => setFlipAnim("idle"), 420);
    }, 340);
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  function reset() {
    setScreen("select");
    setProp(null);
    setRating(0);
    setHoverStar(0);
    setReviewText("");
    setQuestions(null);
    setQIndex(0);
    setQKey(0);
    setAnswers({});
    setInsights(null);
    setFlipped(false);
    setFlipAnim("idle");
    setActiveCard(0);
  }

  const flipStyle = {
    idle: {},
    exit: { animation: "flipExit 0.34s ease-in forwards" },
    enter: { animation: "flipEnter 0.42s ease-out forwards" },
  }[flipAnim];

  // ── SCREEN: SELECT ───────────────────────────────────────────────────────
  if (screen === "select")
    return (
      <div
        style={{
          background: C.cream,
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div style={{ padding: "1.5rem 1.5rem 0" }}>
          <Wordmark />
        </div>
        <div style={{ padding: "1.25rem 1.5rem 1rem" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 42,
              fontWeight: 700,
              color: C.navy,
              lineHeight: 1.05,
              margin: 0,
              letterSpacing: -1.5,
            }}
          >
            Review
            <br />
            my stays.
          </h1>
          <p
            style={{
              color: C.gray600,
              fontSize: 14,
              marginTop: 10,
              fontWeight: 300,
              lineHeight: 1.6,
            }}
          >
            Your voice shapes every future journey.
          </p>
        </div>

        {/* Carousel */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          style={{
            display: "flex",
            overflowX: "scroll",
            scrollSnapType: "x mandatory",
            gap: 14,
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            paddingBottom: "0.25rem",
          }}
        >
          {PROPERTIES.map((p, i) => (
            <div
              key={p.id}
              onClick={() => {
                setProp(p);
                setScreen("review");
              }}
              style={{
                minWidth: "calc(100% - 56px)",
                scrollSnapAlign: "start",
                borderRadius: 24,
                overflow: "hidden",
                cursor: "pointer",
                flexShrink: 0,
                transition:
                  "transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease",
                transform: activeCard === i ? "scale(1.025)" : "scale(0.965)",
                boxShadow:
                  activeCard === i
                    ? "0 24px 64px rgba(0,53,95,.22)"
                    : "0 4px 20px rgba(0,0,0,.06)",
              }}
            >
              {/* Card hero */}
              <div
                style={{
                  position: "relative",
                  height: 240,
backgroundImage: `url(/images/${p.id === 'roma' ? 'roma.webp' : p.id + '.jpg'})`,
backgroundSize: "cover",
backgroundPosition: "center",                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 55%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(12px)",
                    borderRadius: 12,
                    padding: "5px 13px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span style={{ fontSize: 14, color: C.yellow }}>★</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {p.avg}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    /5
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "22px 22px 20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: C.yellow,
                      letterSpacing: ".12em",
                      marginBottom: 7,
                    }}
                  >
                    {"★".repeat(p.stars)} · {p.city.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.15,
                      marginBottom: 6,
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.68)",
                      fontStyle: "italic",
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {p.tagline}
                  </div>
                </div>
              </div>
              {/* Tags */}
              <div
                style={{
                  background: "#fff",
                  padding: "14px 20px 18px",
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {p.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "6px 15px",
                      borderRadius: 99,
                      fontSize: 12,
                      fontWeight: 500,
                      background: C.navy,
                      color: C.yellow,
                      letterSpacing: ".03em",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            margin: "1.1rem 0 0.4rem",
          }}
        >
          {PROPERTIES.map((_, i) => (
            <div
              key={i}
              style={{
                height: 6,
                borderRadius: 99,
                background: activeCard === i ? C.navy : C.gray200,
                width: activeCard === i ? 24 : 7,
                transition: "all .4s cubic-bezier(.22,1,.36,1)",
              }}
            />
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: C.gray400,
            fontWeight: 300,
            paddingBottom: "2rem",
          }}
        >
          Scroll to explore · Tap to begin
        </div>
      </div>
    );

  // ── SCREEN: REVIEW ───────────────────────────────────────────────────────
  if (screen === "review")
    return (
      <div
        style={{
          background: C.cream,
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div style={{ padding: "1.25rem 1.5rem 0" }}>
          <button
            onClick={reset}
            style={{
              background: "none",
              border: "none",
              color: C.navy,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            ← Back
          </button>
        </div>
        <div style={{ margin: "1rem 1.5rem 0" }}>
          <PropertyHero prop={prop} height={200} />
        </div>
        <div style={{ padding: "1.5rem 1.5rem 2rem" }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 30,
              fontWeight: 700,
              color: C.navy,
              margin: "0 0 1.5rem",
              letterSpacing: -0.8,
              lineHeight: 1.2,
            }}
          >
            How was your stay?
          </h2>

          {/* Stars */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.gray400,
                letterSpacing: ".1em",
                marginBottom: 12,
              }}
            >
              RATING
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverStar(s)}
                  onMouseLeave={() => setHoverStar(0)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    border:
                      s <= (hoverStar || rating)
                        ? `2px solid ${C.yellow}`
                        : `1.5px solid ${C.gray200}`,
                    background:
                      s <= (hoverStar || rating) ? "#FFFBEB" : "#fff",
                    fontSize: 26,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all .12s",
                    color:
                      s <= (hoverStar || rating) ? "#F59E0B" : C.gray200,
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.gray400,
                letterSpacing: ".1em",
                marginBottom: 12,
              }}
            >
              YOUR EXPERIENCE
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What made this stay memorable? Share the details — Claude will tailor follow-up questions just for you..."
              onFocus={(e) => (e.target.style.borderColor = C.navy)}
              onBlur={(e) => (e.target.style.borderColor = C.gray200)}
              style={{
                width: "100%",
                minHeight: 130,
                padding: "14px 16px",
                borderRadius: 18,
                border: `1.5px solid ${C.gray200}`,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                color: C.gray900,
                background: "#fff",
                resize: "none",
                lineHeight: 1.65,
                outline: "none",
                transition: "border-color .2s",
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: C.gray400,
                marginTop: 6,
                textAlign: "right",
              }}
            >
              {reviewText.length} characters
            </div>
          </div>

          {/* AI hint badge */}
          <div
            style={{
              fontSize: 12,
              color: C.gray600,
              background: "#fff",
              border: `1.5px solid ${C.gray200}`,
              borderRadius: 14,
              padding: "11px 15px",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <span style={{ fontSize: 18 }}>✦</span>
            <span>
              Claude will read your review and generate{" "}
              <strong>personalised follow-up questions</strong> just for you.
            </span>
          </div>

          <button
            onClick={handleContinue}
            disabled={!rating || reviewText.trim().length < 10}
            style={{
              width: "100%",
              padding: "17px",
              borderRadius: 18,
              border: "none",
              background:
                !rating || reviewText.trim().length < 10 ? C.gray200 : C.navy,
              color:
                !rating || reviewText.trim().length < 10
                  ? C.gray400
                  : C.yellow,
              fontSize: 15,
              fontWeight: 600,
              cursor:
                !rating || reviewText.trim().length < 10
                  ? "default"
                  : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all .2s",
              letterSpacing: ".02em",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );

  // ── SCREEN: GENERATING QUESTIONS ─────────────────────────────────────────
  if (screen === "genq")
    return (
      <div
        style={{
          background: C.navy,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: "2.5rem",
          textAlign: "center",
        }}
      >
        <style>{CSS}</style>
        <Wordmark size={28} light />
        <div
          style={{
            marginTop: "2.75rem",
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: `3px solid rgba(253,219,50,.16)`,
            borderTopColor: C.yellow,
            animation: "spin 1.1s linear infinite",
            marginBottom: "1.5rem",
          }}
        />
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20,
            color: "rgba(255,255,255,0.88)",
            fontWeight: 400,
            marginBottom: ".75rem",
          }}
        >
          Reading your review…
        </div>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            maxWidth: 260,
            lineHeight: 1.7,
          }}
        >
          Claude is crafting personalised questions based on exactly what you
          wrote.
        </div>
      </div>
    );

  // ── SCREEN: QUESTIONS ────────────────────────────────────────────────────
  if (screen === "questions") {
    const qs = questions || FALLBACK_QUESTIONS;
    const q = qs[qIndex];
    const isAI = !!questions;

    return (
      <div
        style={{
          background: C.cream,
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div
          style={{
            padding: "1.5rem 1.5rem 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Wordmark size={22} />
          {/* AI badge */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.navy,
              background: C.yellow,
              padding: "4px 11px",
              borderRadius: 99,
            }}
          >
            {isAI ? "✦ AI questions" : "Static questions due to API security"}
          </div>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 9,
            padding: "1.4rem 1.5rem 0",
          }}
        >
          {qs.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === qIndex ? 26 : 8,
                height: 8,
                borderRadius: 99,
                background: i <= qIndex ? C.navy : C.gray200,
                opacity: i < qIndex ? 0.38 : 1,
                transition: "all .45s cubic-bezier(.22,1,.36,1)",
              }}
            />
          ))}
        </div>

        <div
          key={qKey}
          style={{
            padding: "2rem 1.5rem 1.5rem",
            animation: "qUp 0.48s cubic-bezier(.22,1,.36,1) forwards",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "5px 15px",
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 600,
              background: C.navy,
              color: C.yellow,
              letterSpacing: ".08em",
              marginBottom: 22,
            }}
          >
            {q.cat.toUpperCase()}
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 29,
              fontWeight: 700,
              color: C.navy,
              margin: "0 0 1.75rem",
              letterSpacing: -0.8,
              lineHeight: 1.22,
            }}
          >
            {q.q}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {q.opts.map((opt) => {
              const sel = answers[q.cat] === opt;
              return (
                <button
                  key={opt}
                  className="opt-btn"
                  onClick={() => handleSelectAnswer(opt)}
                  disabled={transitioning}
                  style={{
                    padding: "17px 20px",
                    borderRadius: 18,
                    border: `1.5px solid ${sel ? C.navy : C.gray200}`,
                    background: sel ? C.navy : "#fff",
                    color: sel ? C.yellow : C.gray900,
                    fontSize: 15,
                    fontWeight: sel ? 600 : 400,
                    cursor: transitioning ? "default" : "pointer",
                    textAlign: "left",
                    fontFamily: "'DM Sans', sans-serif",
                    transition: "all .15s",
                    letterSpacing: ".01em",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: LOADING INSIGHTS ─────────────────────────────────────────────
  if (screen === "loading2")
    return (
      <div
        style={{
          background: C.navy,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: "2.5rem",
          textAlign: "center",
        }}
      >
        <style>{CSS}</style>
        <Wordmark size={28} light />
        <div
          style={{
            marginTop: "2.75rem",
            width: 54,
            height: 54,
            borderRadius: "50%",
            border: `3px solid rgba(253,219,50,.16)`,
            borderTopColor: C.yellow,
            animation: "spin 1.1s linear infinite",
            marginBottom: "2.75rem",
          }}
        />
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            color: "rgba(255,255,255,0.88)",
            fontWeight: 400,
            marginBottom: "2rem",
          }}
        >
          Building your insights…
        </div>
        <div
          key={quoteIdx}
          style={{
            maxWidth: 310,
            animation: `${quotePhase === "in" ? "qIn" : "qOut"} 0.52s ease forwards`,
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: 16,
              color: "rgba(255,255,255,0.68)",
              lineHeight: 1.75,
              marginBottom: 14,
            }}
          >
            "{QUOTES[quoteIdx].text}"
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.yellow,
              letterSpacing: ".08em",
            }}
          >
            {QUOTES[quoteIdx].attr}
          </div>
        </div>
      </div>
    );

  // ── SCREEN: INSIGHTS ─────────────────────────────────────────────────────
  if (screen === "insights" && insights)
    return (
      <div
        style={{
          background: C.cream,
          minHeight: "100vh",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <style>{CSS}</style>
        <div style={{ padding: "1.25rem 1.5rem 0" }}>
          <Wordmark size={22} />
        </div>
        <div style={{ margin: "1rem 1.5rem 0" }}>
          <PropertyHero prop={prop} height={190} />
        </div>

        {/* Toggle */}
        <div style={{ padding: "1.25rem 1.5rem 0" }}>
          <div
            style={{
              display: "inline-flex",
              background: C.gray100,
              borderRadius: 99,
              padding: 4,
              gap: 2,
            }}
          >
            {["For Guests", "For Managers"].map((label, i) => (
              <button
                key={label}
                onClick={() => handleFlipToggle(i === 1)}
                style={{
                  padding: "9px 22px",
                  borderRadius: 99,
                  border: "none",
                  background:
                    (i === 1) === flipped ? C.navy : "transparent",
                  color: (i === 1) === flipped ? C.yellow : C.gray600,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background .3s, color .3s",
                  letterSpacing: ".01em",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* AI badge */}
        {questions && (
          <div
            style={{
              margin: "0.75rem 1.5rem 0",
              fontSize: 11,
              color: C.navy,
              background: C.yellow,
              borderRadius: 10,
              padding: "7px 13px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>✦</span>
            <span>
              Insights shaped by your personalised AI follow-up questions
            </span>
          </div>
        )}

        {/* Panel */}
        <div style={{ margin: "1rem 1.5rem 1.5rem", ...flipStyle }}>
          {!flipped ? (
            // Guest scores
            <div
              style={{
                background: "#fff",
                borderRadius: 22,
                border: `1px solid ${C.gray200}`,
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.gray400,
                  letterSpacing: ".1em",
                  marginBottom: 16,
                }}
              >
                WHAT FUTURE GUESTS WILL SEE
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {(insights.forGuests || []).map((g, i) => {
                  const sc = scoreColor(g.score);
                  return (
                    <div
                      key={i}
                      style={{
                        background: C.cream,
                        borderRadius: 16,
                        padding: "15px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: C.gray400,
                          letterSpacing: ".07em",
                          marginBottom: 8,
                        }}
                      >
                        {(g.category || "").toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 34,
                          fontWeight: 700,
                          color: sc,
                          lineHeight: 1,
                        }}
                      >
                        {g.score}
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 400,
                            color: C.gray400,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          /10
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          background: C.gray200,
                          borderRadius: 99,
                          margin: "10px 0 8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${g.score * 10}%`,
                            background: sc,
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.gray600,
                          lineHeight: 1.5,
                        }}
                      >
                        {g.label}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.gray400,
                          marginTop: 4,
                        }}
                      >
                        {g.basis}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Manager report
            <div
              style={{
                background: C.navy,
                borderRadius: 22,
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.yellow,
                  letterSpacing: ".1em",
                  marginBottom: 20,
                  opacity: 0.82,
                }}
              >
                PROPERTY IMPROVEMENT REPORT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {(insights.forManagers || []).map((s, i, arr) => (
                  <div
                    key={i}
                    style={{
                      paddingBottom: i < arr.length - 1 ? 18 : 0,
                      borderBottom:
                        i < arr.length - 1
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 9,
                      }}
                    >
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: 99,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: ".05em",
                          background:
                            s.priority === "high"
                              ? "#dc2626"
                              : s.priority === "medium"
                              ? "#d97706"
                              : "rgba(255,255,255,0.12)",
                          color:
                            s.priority === "low"
                              ? "rgba(255,255,255,0.55)"
                              : "#fff",
                        }}
                      >
                        {s.priority.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {s.area}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.58)",
                        lineHeight: 1.68,
                        marginBottom: 10,
                      }}
                    >
                      {s.finding}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        padding: "10px 14px",
                        background: "rgba(253,219,50,0.08)",
                        borderRadius: 12,
                        borderLeft: `3px solid ${C.yellow}`,
                        lineHeight: 1.68,
                      }}
                    >
                      <span style={{ color: C.yellow, fontWeight: 600 }}>
                        Action{"  "}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.8)" }}>
                        {s.action}
                      </span>
                    </div>
                    {s.benchmark && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.32)",
                          marginTop: 9,
                          lineHeight: 1.5,
                        }}
                      >
                        {s.benchmark}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "0 1.5rem 2.5rem" }}>
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 18,
              border: `1.5px solid ${C.gray200}`,
              background: "transparent",
              color: C.navy,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: ".01em",
            }}
          >
            Review another stay
          </button>
        </div>
      </div>
    );

  return null;
}

// ── FALLBACK QUESTIONS (used if AI call fails) ────────────────────────────
const FALLBACK_QUESTIONS = [
  {
    cat: "Arrival",
    q: "How would you describe your check-in experience?",
    opts: ["Effortless", "Quick enough", "A bit slow", "Frustrating"],
  },
  {
    cat: "Value",
    q: "For what you paid, how was the overall value?",
    opts: ["Exceptional", "Fair", "Average", "Overpriced"],
  },
  {
    cat: "Comfort",
    q: "How comfortable was your room?",
    opts: ["Perfect", "Mostly good", "A few issues", "Uncomfortable"],
  },
  {
    cat: "Service",
    q: "How did the staff make you feel?",
    opts: ["Genuinely cared", "Professional", "Indifferent", "Unhelpful"],
  },
  {
    cat: "Return",
    q: "Would you stay here again?",
    opts: ["Without doubt", "Very likely", "Possibly", "Unlikely"],
  },
];
