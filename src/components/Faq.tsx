"use client";

import { useState } from "react";

export interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqProps {
  items: FaqEntry[];
  /** class names from the page's CSS module so styling matches the page */
  classes: {
    item: string;
    itemActive: string;
    question: string;
    toggle: string;
    answer: string;
  };
  /** icon element rendered inside the toggle (Font Awesome <i/>) */
  toggleIconClass?: string;
}

// Accordion FAQ — only one item open at a time (matches script.js behaviour).
export default function Faq({
  items,
  classes,
  toggleIconClass = "fa fa-plus",
}: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`${classes.item} ${isOpen ? classes.itemActive : ""}`}
          >
            <div
              className={classes.question}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <h3>{item.question}</h3>
              <span className={classes.toggle}>
                <i className={toggleIconClass}></i>
              </span>
            </div>
            <div className={classes.answer}>
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </>
  );
}
