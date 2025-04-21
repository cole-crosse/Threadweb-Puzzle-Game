import React, { useState, useMemo, useEffect, useRef } from "react";
import stringSimilarity from "string-similarity";
import "./index.css"; // Tailwind – `dark` class strategy enabled

/*************************************************************************
 * 🔹 PUZZLE DATA                                                        *
 *************************************************************************/
const PEOPLE = ["Cole", "Kenzie", "Nicky", "Reid", "Julia"];

const ALL_LINKS = [
  "Cole&Kenzie",
  "Cole&Nicky",
  "Cole&Reid",
  "Cole&Julia",
  "Kenzie&Nicky",
  "Kenzie&Reid",
  "Kenzie&Julia",
  "Nicky&Reid",
  "Nicky&Julia",
  "Reid&Julia",
];

// ✔️ These are the 5 real links a player must solve
const USED_LINKS = Object.keys({
  "Cole&Kenzie": 1,
  "Cole&Nicky": 1,
  "Kenzie&Nicky": 1,
  "Nicky&Reid": 1,
  "Reid&Julia": 1,
});

const ANSWERS = {
  links: {
    "Cole&Kenzie": {
      words: ["Braves", "Celtics"],
      descriptions: [
        "sports lover",
        "sports nut",
        "loves sports",
        "huge sports fans",
        "like sports",
      ],
    },
    "Cole&Nicky": {
      words: ["Ja", "Flugzeug"],
      descriptions: [
        "speak german",
        "german speakers",
        "know german",
        "german dweebs",
      ],
    },
    "Kenzie&Nicky": {
      words: ["Greenville", "Florence"],
      descriptions: [
        "south carolinian",
        "from south carolina",
        "local natives",
        "in‑state students",
      ],
    },
    "Nicky&Reid": {
      words: ["Clutch Kick", "Drag"],
      descriptions: [
        "car guys",
        "car enthusiasts",
        "love cars",
        "car nerds",
        "car lovers",
        "car people",
      ],
    },
    "Reid&Julia": {
      words: ["Pacific", "Rockies"],
      descriptions: [
        "west coast raised",
        "grew up west coast",
        "west coast kids",
      ],
    },
  },
  theme: {
    descriptions: [
      "university of south carolina students",
      "usc students",
      "go to south carolina",
    ],
    words: ["Gamecocks", "School"],
  },
};

const RED_HERRINGS = [
  "Appalachians",
  "Minnesota",
  "Corn",
  "Tigers",
  "Obama",
  "Gibbes",
];

/*************************************************************************
 * 🔹 HELPERS                                                            *
 *************************************************************************/
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

const isCorrectWord = (k, w) =>
  ANSWERS.links[k]?.words.some(
    (x) => x.toLowerCase() === w.trim().toLowerCase()
  ) ?? false;

const isCorrectDescription = (k, txt) =>
  ANSWERS.links[k]?.descriptions.some(
    (d) =>
      stringSimilarity.compareTwoStrings(
        d.toLowerCase(),
        txt.toLowerCase().trim()
      ) > 0.6
  ) ?? false;

const isThemeDesc = (txt) =>
  ANSWERS.theme.descriptions.some(
    (d) =>
      stringSimilarity.compareTwoStrings(
        d.toLowerCase(),
        txt.toLowerCase().trim()
      ) > 0.6
  );

const isThemeWord = (w) =>
  ANSWERS.theme.words.some((x) => x.toLowerCase() === w.trim().toLowerCase());

/*************************************************************************
 * 🔹 INSTRUCTIONS MODAL (original)                                      *
 *************************************************************************/
function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800 dark:text-slate-100">
        <h2 className="mb-4 text-2xl font-bold">How to Play</h2>
        <p className="mb-2">
          A penta‑star map is provided, with an item at each point. The 10
          possible links (similarities) between two items are shown. Only 5 are
          used—you must identify them using clue words from the bank below, and
          then name the overall theme connecting all five.
        </p>
        <p className="mb-2 font-semibold">Additional Info:</p>
        <ul className="mb-4 list-inside list-disc">
          <li>Every item has at least 1 and at most 3 links.</li>
          <li>Each correct link has exactly 2 clue words.</li>
          <li>Some words in the bank are not used.</li>
          <li>Theme descriptions are open‑ended.</li>
        </ul>
        <p className="mb-2 font-semibold">Example:</p>
        <ul className="mb-4 list-inside list-disc">
          <li>Items: Solar Panel &amp; Coffee</li>
          <li>Clue Words: Caffeine, Energy</li>
          <li>Link: Provides Energy</li>
        </ul>
        <button
          onClick={onClose}
          className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

/*************************************************************************
 * 🔹 POPUP (Word Bank & Map)                                            *
 *************************************************************************/
function Popup({ id, index, title, children, onClose, diagramRef }) {
  const ref = useRef(null);
  const [top, setTop] = useState(64);

  useEffect(() => {
    const reposition = () => {
      const gap = 16;
      let t = 64 + index * 24;

      const d = diagramRef.current?.getBoundingClientRect();
      if (d) t = Math.max(t, d.bottom + gap);

      const prev = document.getElementById(`popup-${index - 1}`);
      if (prev) t = prev.getBoundingClientRect().bottom + gap;

      const max = window.innerHeight - 160 - (ref.current?.offsetHeight ?? 0);
      setTop(Math.min(t, max));
    };
    reposition();
    window.addEventListener("scroll", reposition);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [index, diagramRef]);

  return (
    <div
      id={`popup-${index}`}
      ref={ref}
      className="fixed z-40 right-4 animate-popupIn"
      style={{ top }}
    >
      <div className="max-h-[70vh] w-72 overflow-auto rounded-lg border bg-white shadow-lg dark:bg-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b px-4 py-2 dark:border-slate-700">
          <h3 className="font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-lg font-bold transition-transform hover:rotate-90"
          >
            ✕
          </button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

/*************************************************************************
 * 🔹 ENDGAME MODAL (WIN / LOSE)                                         *
 *************************************************************************/
function EndgameModal({ open, win, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl dark:bg-slate-800 dark:text-slate-100">
        <h2
          className={`mb-4 text-2xl font-bold ${
            win
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {win ? "🎉  You Win!  🎉" : "💀  Game Over!  💀"}
        </h2>
        <p className="mb-6">Scroll down to view your progression diagram.</p>
        <button
          onClick={onClose}
          className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/*************************************************************************
 * 🔹 PROGRESS DIAGRAM – 2 × 3 grid                                       *
 *************************************************************************/
function ProgressGraphic({ guessHistory, hasWon }) {
  // Exactly six squares → snapshots or smileys
  const slots = Array.from({ length: 6 }).map((_, i) => guessHistory[i]);

  return (
    <div className="mt-10">
      <h2 className="mb-4 text-xl font-semibold">Your Progress</h2>
      <div className="grid grid-cols-2 gap-4">
        {slots.map((snap, i) => (
          <div
            key={i}
            className="flex h-40 w-full items-center justify-center border dark:border-slate-600"
          >
            {!snap ? (
              hasWon && <span className="text-4xl">😊</span>
            ) : (
              <svg width={140} height={140}>
                {/* draw links that had some success this guess */}
                {USED_LINKS.map((lk) => {
                  const [p1, p2] = lk.split("&");
                  const idx1 = PEOPLE.indexOf(p1);
                  const idx2 = PEOPLE.indexOf(p2);
                  const ang1 = (2 * Math.PI * idx1) / PEOPLE.length;
                  const ang2 = (2 * Math.PI * idx2) / PEOPLE.length;
                  const x1 = 70 + 55 * Math.cos(ang1);
                  const y1 = 70 + 55 * Math.sin(ang1);
                  const x2 = 70 + 55 * Math.cos(ang2);
                  const y2 = 70 + 55 * Math.sin(ang2);
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  const wordsOK =
                    snap.linkWordResults[lk].filter(Boolean).length;
                  const descOK = snap.linkDescResults[lk];

                  if (!wordsOK && !descOK) return null;

                  const full = descOK && wordsOK === 2;
                  const color = full ? "green" : wordsOK ? "orange" : "red";

                  return (
                    <g key={lk}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth={2}
                      />
                      {[...Array(wordsOK)].map((_, d) => (
                        <circle
                          key={d}
                          cx={midX + (d === 0 ? -4 : 4)}
                          cy={midY}
                          r={3}
                          fill={color}
                        />
                      ))}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/*************************************************************************
 * 🔹 MAIN COMPONENT                                                     *
 *************************************************************************/
export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  /* USER INPUTS */
  const [userWords, setUserWords] = useState(
    Object.fromEntries(ALL_LINKS.map((k) => [k, ["", ""]]))
  );
  const [descriptions, setDescriptions] = useState(
    Object.fromEntries(ALL_LINKS.map((k) => [k, ""]))
  );
  const [noLink, setNoLink] = useState(
    Object.fromEntries(ALL_LINKS.map((k) => [k, false]))
  );
  const [themeInput, setThemeInput] = useState("");
  const [themeWords, setThemeWords] = useState(["", ""]);

  /* UI STATE */
  const [shuffledWords, setShuffledWords] = useState(() =>
    shuffle([
      ...new Set([
        ...Object.values(ANSWERS.links).flatMap((l) => l.words),
        ...ANSWERS.theme.words,
        ...RED_HERRINGS,
      ]),
    ])
  );
  const [lives, setLives] = useState(6);
  const [submitted, setSubmitted] = useState(false);
  const [showInst, setShowInst] = useState(true);
  const [guessHistory, setGuessHistory] = useState([]);
  const [popups, setPopups] = useState([]);

  const diagramRef = useRef(null);

  /* SUBMISSION RESULTS */
  const [result, setResult] = useState({
    linkWordResults: Object.fromEntries(
      ALL_LINKS.map((k) => [k, [false, false]])
    ),
    linkDescResults: Object.fromEntries(ALL_LINKS.map((k) => [k, false])),
    themeWordResults: [false, false],
    themeDescResult: false,
  });

  const [showEnd, setShowEnd] = useState(false);
  const [endIsWin, setEndIsWin] = useState(false);

  /* DERIVED */
  const usedWords = useMemo(
    () =>
      new Set(
        [...Object.values(userWords).flat(), ...themeWords].map((w) =>
          w.toLowerCase()
        )
      ),
    [userWords, themeWords]
  );

  const themeDescCorrect = submitted && result.themeDescResult;
  const themeWordArrayCorrect = result.themeWordResults;
  const themeCorrect = themeDescCorrect && themeWordArrayCorrect.every(Boolean);

  const hasWon =
    submitted &&
    USED_LINKS.every((k) => result.linkWordResults[k].every(Boolean)) &&
    USED_LINKS.every((k) => result.linkDescResults[k]) &&
    themeCorrect;

  /* SUBMIT HANDLER */
  const handleSubmit = () => {
    /* evaluate */
    const linkWordResults = Object.fromEntries(
      ALL_LINKS.map((k) => [k, userWords[k].map((w) => isCorrectWord(k, w))])
    );
    const linkDescResults = Object.fromEntries(
      ALL_LINKS.map((k) => [k, isCorrectDescription(k, descriptions[k])])
    );
    const themeWordResults = themeWords.map(isThemeWord);
    const themeDescResult = isThemeDesc(themeInput);

    const snap = {
      linkWordResults,
      linkDescResults,
      themeWordResults,
      themeDescResult,
    };
    setResult(snap);
    setSubmitted(true);
    setGuessHistory((h) => [snap, ...h].slice(0, 6));

    const solved =
      USED_LINKS.every((k) => linkWordResults[k].every(Boolean)) &&
      USED_LINKS.every((k) => linkDescResults[k]) &&
      themeWordResults.every(Boolean) &&
      themeDescResult;

    if (!solved && lives > 0) setLives((l) => l - 1);
    if (solved) {
      setEndIsWin(true);
      setShowEnd(true);
    } else if (!solved && lives - 1 === 0) {
      setEndIsWin(false);
      setShowEnd(true);
    }
  };

  /* POPUPS */
  const openPopup = (id) => setPopups((p) => (p.includes(id) ? p : [...p, id]));
  const closePopup = (id) => setPopups((p) => p.filter((x) => x !== id));

  /* RENDER */
  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="relative min-h-screen bg-gray-50 p-6 text-gray-800 transition-colors dark:bg-slate-900 dark:text-slate-100 md:p-8">
        {/* TOP RIGHT CONTROLS */}
        <div className="absolute right-4 top-4 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1 text-sm font-medium">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode((d) => !d)}
              className="sr-only peer"
            />
            <span className="relative inline-block h-4 w-8 rounded-full bg-slate-400 transition-colors peer-checked:bg-blue-500">
              <span className="absolute h-4 w-4 translate-x-0 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </span>
            Dark
          </label>
          <button
            onClick={() => setShowInst(true)}
            className="rounded-full bg-gray-200 p-2 text-xl font-bold hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            ?
          </button>
        </div>

        <InstructionsModal
          isOpen={showInst}
          onClose={() => setShowInst(false)}
        />

        {/* POPUPS */}
        {popups.map((id, i) => (
          <Popup
            key={id}
            id={id}
            index={i}
            title={id === "word" ? "Word Bank" : "Map"}
            onClose={() => closePopup(id)}
            diagramRef={diagramRef}
          >
            {id === "word" && (
              <div className="flex flex-wrap gap-2">
                {shuffledWords.map((w) => (
                  <span
                    key={w}
                    className={`rounded border px-2 py-1 text-sm ${
                      usedWords.has(w.toLowerCase())
                        ? "line-through text-gray-500 bg-gray-300 dark:text-gray-500"
                        : ""
                    }`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}

            {id === "map" && (
              <svg width={280} height={280} className="mx-auto block">
                {ALL_LINKS.map((lk) => {
                  const [p1, p2] = lk.split("&");
                  const i1 = PEOPLE.indexOf(p1);
                  const i2 = PEOPLE.indexOf(p2);
                  const a1 = (2 * Math.PI * i1) / PEOPLE.length;
                  const a2 = (2 * Math.PI * i2) / PEOPLE.length;
                  const x1 = 140 + 90 * Math.cos(a1);
                  const y1 = 140 + 90 * Math.sin(a1);
                  const x2 = 140 + 90 * Math.cos(a2);
                  const y2 = 140 + 90 * Math.sin(a2);
                  const ok =
                    result.linkWordResults[lk].every(Boolean) &&
                    result.linkDescResults[lk];
                  return (
                    <line
                      key={lk}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={ok ? "green" : darkMode ? "white" : "black"}
                      strokeWidth="2"
                    />
                  );
                })}
                {PEOPLE.map((p, i) => {
                  const a = (2 * Math.PI * i) / PEOPLE.length;
                  const x = 140 + 105 * Math.cos(a);
                  const y = 140 + 105 * Math.sin(a);
                  const fill = themeCorrect
                    ? "green"
                    : darkMode
                    ? "white"
                    : "black";
                  return (
                    <text
                      key={p}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-bold"
                      fill={fill}
                    >
                      {p}
                    </text>
                  );
                })}
              </svg>
            )}
          </Popup>
        ))}

        {/* HEADER */}
        <h1 className="mb-2 text-3xl font-bold">🧵🕸 Threadweb Puzzle</h1>
        <p className="mb-6 text-lg">Lives Remaining: {lives}</p>

        {/* MAIN MAP */}
        <svg
          ref={diagramRef}
          width={320}
          height={320}
          className="mx-auto mb-8 max-w-full"
        >
          {ALL_LINKS.map((lk) => {
            const [p1, p2] = lk.split("&");
            const i1 = PEOPLE.indexOf(p1);
            const i2 = PEOPLE.indexOf(p2);
            const a1 = (2 * Math.PI * i1) / PEOPLE.length;
            const a2 = (2 * Math.PI * i2) / PEOPLE.length;
            const x1 = 160 + 110 * Math.cos(a1);
            const y1 = 160 + 110 * Math.sin(a1);
            const x2 = 160 + 110 * Math.cos(a2);
            const y2 = 160 + 110 * Math.sin(a2);
            const ok =
              result.linkWordResults[lk].every(Boolean) &&
              result.linkDescResults[lk];
            return (
              <line
                key={lk}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={ok ? "green" : darkMode ? "white" : "black"}
                strokeWidth="2"
              />
            );
          })}
          {PEOPLE.map((p, i) => {
            const a = (2 * Math.PI * i) / PEOPLE.length;
            const x = 160 + 130 * Math.cos(a);
            const y = 160 + 130 * Math.sin(a);
            const fill = themeCorrect ? "green" : darkMode ? "white" : "black";
            return (
              <text
                key={p}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-bold"
                fill={fill}
              >
                {p}
              </text>
            );
          })}
        </svg>

        {/* POP‑OUT MAP BTN */}
        <div className="mb-8 flex justify-end">
          <button
            onClick={() => openPopup("map")}
            className="mb-2 flex items-center gap-1 rounded bg-green-500 px-3 py-1 text-white transition-transform hover:rotate-6"
          >
            ⇖ pop‑out map
          </button>
        </div>

        {/* LINK INPUTS */}
        {ALL_LINKS.map((lk) => (
          <div key={lk} className="mb-6 border-b pb-4 dark:border-slate-700">
            <div className="mb-1 flex items-center">
              <h2 className="flex-1 text-xl font-semibold">
                {lk.replace(/&/g, " & ")}
              </h2>
              <label className="ml-auto mr-[340px] flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={noLink[lk]}
                  onChange={() => setNoLink({ ...noLink, [lk]: !noLink[lk] })}
                  className="h-4 w-4"
                />
                <span>No link</span>
              </label>
            </div>

            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
              {userWords[lk].map((w, idx) => {
                const ok = result.linkWordResults[lk][idx];
                const disabled = noLink[lk];
                return (
                  <input
                    key={idx}
                    value={w}
                    disabled={disabled}
                    onChange={(e) => {
                      const arr = [...userWords[lk]];
                      arr[idx] = e.target.value;
                      setUserWords({ ...userWords, [lk]: arr });
                    }}
                    placeholder={`Word ${idx + 1}`}
                    className={`w-full rounded border px-3 py-1 sm:w-40 ${
                      disabled
                        ? "bg-slate-300 text-slate-500"
                        : "dark:bg-slate-800 dark:border-slate-600"
                    } ${ok ? "bg-green-200 dark:bg-green-700/40" : ""}`}
                  />
                );
              })}
            </div>

            <input
              type="text"
              disabled={noLink[lk]}
              value={descriptions[lk]}
              onChange={(e) =>
                setDescriptions({ ...descriptions, [lk]: e.target.value })
              }
              placeholder="Describe the link"
              className={`w-full rounded border px-3 py-1 ${
                noLink[lk]
                  ? "bg-slate-300 text-slate-500"
                  : "dark:bg-slate-800 dark:border-slate-600"
              } ${
                result.linkDescResults[lk]
                  ? "bg-green-200 dark:bg-green-700/40"
                  : ""
              }`}
            />
          </div>
        ))}

        {/* THEME */}
        <div className="mb-8 mt-10">
          <h2 className="mb-2 text-xl font-semibold">Overall Theme</h2>
          <input
            type="text"
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="Describe the overall theme"
            className={`w-full rounded border px-3 py-1 ${
              themeDescCorrect
                ? "bg-green-200 dark:bg-green-700/40"
                : "dark:bg-slate-800 dark:border-slate-600"
            }`}
          />

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-3">
            {themeWords.map((w, idx) => (
              <input
                key={idx}
                value={w}
                onChange={(e) => {
                  const arr = [...themeWords];
                  arr[idx] = e.target.value;
                  setThemeWords(arr);
                }}
                placeholder={`Theme word ${idx + 1}`}
                className={`w-full rounded border px-3 py-1 sm:w-40 ${
                  result.themeWordResults[idx]
                    ? "bg-green-200 dark:bg-green-700/40"
                    : "dark:bg-slate-800 dark:border-slate-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="sticky bottom-0 z-10 mb-6 flex flex-col gap-4 border-t bg-gray-50 pb-4 pt-4 dark:bg-slate-900 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setShuffledWords((p) => shuffle([...p]))}
              className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
            >
              Shuffle
            </button>
            <button
              onClick={handleSubmit}
              className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
            >
              Submit
            </button>
          </div>
          <button
            onClick={() => openPopup("word")}
            className="ml-auto flex items-center gap-1 self-center rounded bg-gray-200 px-3 py-1 transition-transform hover:rotate-6 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            ⇖ pop‑out word bank
          </button>
        </div>

        {/* INLINE WORD BANK */}
        <div className="mb-24 flex flex-wrap gap-2 sm:gap-3">
          {shuffledWords.map((w) => (
            <span
              key={w}
              className={`rounded border px-3 py-1 text-sm ${
                usedWords.has(w.toLowerCase())
                  ? "line-through text-gray-500 bg-gray-300 dark:text-gray-500"
                  : ""
              }`}
            >
              {w}
            </span>
          ))}
        </div>

        {/* END GAME SECTION */}
        <EndgameModal
          open={showEnd}
          win={endIsWin}
          onClose={() => setShowEnd(false)}
        />

        {(hasWon || (submitted && lives === 0)) && (
          <ProgressGraphic guessHistory={guessHistory} hasWon={hasWon} />
        )}

        {hasWon && (
          <div className="mt-10 text-center text-2xl font-bold text-green-600 dark:text-green-400">
            🎉 You Win! Congratulations! 🎉
          </div>
        )}
        {submitted && lives === 0 && !hasWon && (
          <div className="mt-10 text-center text-2xl font-bold text-red-600 dark:text-red-400">
            💀 Game Over! Better luck next time. 💀
          </div>
        )}
      </div>
    </div>
  );
}

/*************************************************************************
 * 🔹 ANIMATIONS                                                         *
 *************************************************************************/
/*  Add to global CSS or index.css
@keyframes popupIn{0%{transform:scale(.8) translateY(-10px);opacity:0}100%{transform:scale(1) translateY(0);opacity:1}}
.animate-popupIn{animation:popupIn .25s ease-out}
*/
