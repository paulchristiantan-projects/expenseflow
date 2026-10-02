export function cat(s) {
  s = (s || "").toLowerCase();
  if (s.includes("savings")) return "Savings";
  if (/tiktokshop|lazada|uniqlo|kaia shirt|bench|caravan black|race photos|haircut/.test(s)) return "Shopping";
  if (/airbnb|hotel/.test(s)) return "Lodging";
  if (/mototaxi|angkas|grab\s*\(?car\)?|grab\s*car|mini bus|bus|uv|tricycle|beep|smart load|green gsm|grab food/.test(s)) return "Transport";
  if (/google one|netflix|spotify|youtube premium|icloud|subscription|esim/.test(s)) return "Subscription";
  if (/cess|ipad|iphone|laptop|gadget|earbuds|airpods|charger/.test(s)) return "Gadgets";
  if (/deca|aircon|tuition|contribution|inno share|adidas/.test(s)) return "Bills";
  if (/nanyang|lunch|chow|manam|mcdo|zus|merienda|komoro|hawker|energy|supermarket|food|kfc|lawson|tim ho|kiwami|yoshinoya|secret recipe|snacks|coffee|mercury|tokyo|ksph|dinner|mang inasal|shakeys|llao/.test(s)) return "Food & Dining";
  return "Other";
}

export function money(n) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n || 0);
}

export function monthLabel(key, opts = { month: "long", year: "numeric" }) {
  return new Date(key + "-01").toLocaleString("en-US", opts);
}

// Returns a new array sorted by date descending (newest first).
// ISO "YYYY-MM-DD" strings compare correctly as plain strings.
export function byDateDesc(rows) {
  return rows.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

// Derive up-to-two-letter initials from a display name, falling back to email.
// "Paul Christian" -> "PC", "paul" -> "PA", "jane@x.com" -> "JA".
export function getInitials(displayName, email) {
  const name = (displayName || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = (email || "").split("@")[0];
  if (local) return local.slice(0, 2).toUpperCase();
  return "?";
}

// Return today's date as YYYY-MM-DD in local time.
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Default date for a given month key ("YYYY-MM"): today if it falls inside that
// month, otherwise the first day of the month.
export function defaultDateForMonth(monthKey) {
  const today = todayISO();
  return today.startsWith(monthKey) ? today : `${monthKey}-01`;
}

// Add `n` months to a "YYYY-MM" key and return a new "YYYY-MM".
export function addMonths(monthKey, n) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Whole months from month key A to month key B (B - A). Can be negative.
export function monthsBetween(a, b) {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

// Compute live progress of an installment/loan against a reference month.
// Returns paid/remaining counts, amounts, end month, and status.
export function loanProgress(loan, refMonth) {
  const term = Math.max(0, Number(loan.termMonths) || 0);
  const monthly = Number(loan.monthlyAmount) || 0;
  const start = loan.startMonth;
  const endMonth = term > 0 ? addMonths(start, term - 1) : start;

  // Elapsed = how many monthly payments should have been made by refMonth.
  const elapsedRaw = monthsBetween(start, refMonth) + 1; // inclusive of start month
  const paid = Math.min(Math.max(0, elapsedRaw), term);
  const remaining = Math.max(0, term - paid);

  const notStarted = monthsBetween(start, refMonth) < 0;
  const done = term > 0 && remaining === 0 && !notStarted;

  const totalAmount = monthly * term;
  const paidAmount = monthly * paid;
  const remainingAmount = monthly * remaining;
  const pct = term > 0 ? Math.round((paid / term) * 100) : 0;

  return {
    term, monthly, start, endMonth,
    paid, remaining, notStarted, done,
    totalAmount, paidAmount, remainingAmount, pct,
  };
}

// Escape a single CSV field per RFC 4180.
function csvField(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Build CSV text from an array of header keys and row objects.
export function toCSV(headers, rows) {
  const head = headers.map((h) => csvField(h.label)).join(",");
  const body = rows.map((r) => headers.map((h) => csvField(r[h.key])).join(",")).join("\n");
  return head + "\n" + body;
}

// Trigger a client-side file download of text content.
export function downloadFile(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const CATEGORIES = [
  "Bills",
  "Food & Dining",
  "Gadgets",
  "House Payment",
  "Lodging",
  "Other",
  "Savings",
  "Shopping",
  "Subscription",
  "Transport",
];

// Merge the built-in categories with the user's custom ones (deduped,
// case-insensitive) and return a sorted list.
export function mergedCategories(customCats = []) {
  const seen = new Map();
  for (const c of CATEGORIES) seen.set(c.toLowerCase(), c);
  for (const c of customCats) {
    const name = (c?.name || "").trim();
    if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
