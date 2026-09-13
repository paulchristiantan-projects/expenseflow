// Parses pasted text into daily transactions and "other expenses".
//
// Recognizes:
//   - Year headers: a standalone line like "2025" sets the year for lines below it
//   - Date headers:
//       "August 1", "August 1, 2025", "August 1 2025"
//       "08/01", "08/01/2025", "08/01/25", "08/29 - 08/31" (range end ignored)
//   - Expense lines: "260 - Mototaxi"
//   - An "Others:" section header — every amount line after it is treated as
//     an "other expense" instead of a daily transaction
//
// Ignores summary lines like "Total:", "Init total:", "Others total:", "Grand Total:".
//
// Year resolution order: explicit year in the date header → most recent standalone
// year header → the defaultYear argument.
export function parseBulk(text, defaultYear = new Date().getFullYear()) {
  const lines = (text || "").split(/\r?\n/);
  let current = null; // current date, e.g. "2025-08-01"
  let lastMonth = null; // most recent YYYY-MM seen, used to tag others
  let section = "daily"; // "daily" | "others"
  let yearCtx = defaultYear; // active year context from a standalone year header
  const tx = [];
  const others = [];

  const normYear = (y) => {
    if (y == null) return null;
    const n = Number(y);
    return n < 100 ? 2000 + n : n; // "25" → 2025
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Section switch: a line that is just "Others" or "Others:"
    if (/^others\s*:?\s*$/i.test(line)) {
      section = "others";
      continue;
    }

    // Standalone year header, e.g. "2025".
    const ym = line.match(/^(20\d{2})$/);
    if (ym) {
      yearCtx = Number(ym[1]);
      continue;
    }

    // Skip calculated summary lines.
    if (/^(total|init total|others total|grand total)\b/i.test(line)) continue;

    // Month-name date: "August 1", "August 1, 2025", "August 1 2025"
    const nameDm = line.match(
      /^(July|August|September|October|November|December|January|February|March|April|May|June)\s+(\d{1,2})(?:\s*,?\s*(\d{2,4}))?(?:\s*-\s*.+)?$/i
    );
    // Numeric date: "08/01", "08/01/2025", "08/01/25"
    const numDm = line.match(
      /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?:\s*-\s*.+)?$/
    );

    if (nameDm || numDm) {
      let mo, day, year;
      if (nameDm) {
        mo = new Date(Date.parse(nameDm[1] + " 1, 2000")).getMonth() + 1;
        day = Number(nameDm[2]);
        year = normYear(nameDm[3]) ?? yearCtx;
      } else {
        mo = Number(numDm[1]);
        day = Number(numDm[2]);
        year = normYear(numDm[3]) ?? yearCtx;
      }
      current = `${year}-${String(mo).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      lastMonth = current.slice(0, 7);
      continue;
    }

    // Amount line: "AMOUNT - Description"
    const em = line.match(/^([\d,]+(?:\.\d+)?)\s*-\s*(.+)$/);
    if (em) {
      const amount = Number(em[1].replace(/,/g, ""));
      const desc = em[2].trim();
      if (section === "others") {
        others.push({ desc, amount, month: lastMonth });
      } else if (current) {
        tx.push({ date: current, amount, desc });
      }
    }
  }

  return { tx, others };
}
