"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

type Theme = "orange" | "mist";
type FontDirection = "archivo-bodoni" | "hanken-lora" | "karla-fraunces";

const themes: Array<{ id: Theme; number: string; name: string }> = [
  { id: "orange", number: "01", name: "Orange editorial" },
  { id: "mist", number: "02", name: "Photo mist" },
];

const fontDirections: Array<{
  id: FontDirection;
  number: string;
  name: string;
  note: string;
}> = [
  {
    id: "archivo-bodoni",
    number: "A",
    name: "Archivo + Bodoni",
    note: "Structured with sharp contrast",
  },
  {
    id: "hanken-lora",
    number: "B",
    name: "Hanken + Lora",
    note: "Quiet, warm and highly readable",
  },
  {
    id: "karla-fraunces",
    number: "C",
    name: "Karla + Fraunces",
    note: "Modern with a softer personality",
  },
];

export default function DesignDirectionsPage() {
  const [theme, setTheme] = useState<Theme>("orange");
  const [fontDirection, setFontDirection] =
    useState<FontDirection>("archivo-bodoni");

  return (
    <main className={styles.comparisonPage}>
      <div className={styles.intro}>
        <Link href="/" className={styles.backLink}>
          Back to Record Keep
        </Link>

        <div>
          <p className={styles.kicker}>Design study</p>
          <h1>Colour and type studies</h1>
          <p>
            Compare two palettes across three distinct type directions. The
            mist palette is drawn from the blue-grey, charcoal and soft white
            tones in your reference image.
          </p>
        </div>
      </div>

      <div className={styles.themePicker} aria-label="Choose a design direction">
        {themes.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={theme === option.id}
            onClick={() => setTheme(option.id)}
          >
            <span>{option.number}</span>
            {option.name}
          </button>
        ))}
      </div>

      <div className={styles.fontPicker} aria-label="Choose a font direction">
        {fontDirections.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={fontDirection === option.id}
            onClick={() => setFontDirection(option.id)}
          >
            <span className={styles.fontNumber}>{option.number}</span>
            <span className={styles.fontChoiceName}>{option.name}</span>
            <span className={styles.fontNote}>{option.note}</span>
          </button>
        ))}
      </div>

      <section
        className={styles.preview}
        data-theme={theme}
        data-font={fontDirection}
      >
        <div className={styles.wash} />

        <nav className={styles.previewNav}>
          <span className={styles.brand}>Record Keep</span>
          <span className={styles.tagline}>Your important details, kept clear</span>
        </nav>

        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Personal archive</p>
            <h2>
              Life admin,
              <br />
              without the clutter.
            </h2>
            <p className={styles.description}>
              Policies, warranties, licences and subscriptions—organised with
              the dates and documents you will need later.
            </p>
          </div>

          <button type="button" className={styles.primaryButton}>
            Sign in
          </button>
        </header>

        <div className={styles.recordsHeading}>
          <div>
            <h3>Your records</h3>
            <p>A clear view of what matters.</p>
          </div>

          <div className={styles.actions}>
            <span className={styles.select}>All categories</span>
            <span className={styles.primaryButton}>Add record</span>
          </div>
        </div>

        <div className={styles.emptyState}>
          <strong>Your archive is private</strong>
          <span>Sign in to see your saved records and documents.</span>
        </div>

        <div className={styles.palette} aria-label="Current colour palette">
          <span className={styles.paperSwatch} />
          <span className={styles.inkSwatch} />
          <span className={styles.mutedSwatch} />
          <span className={styles.accentSwatch} />
        </div>
      </section>
    </main>
  );
}
