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
