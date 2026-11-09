/** Editable website copy. Contact details are placeholders – replace before publishing. */
export const CONTACT = { email: "contact@iof.example", phone: "+966 00 000 0000", address: "Riyadh · Jeddah · Dammam, Kingdom of Saudi Arabia" };

export const HERO = [
  { eyebrow: "Seva · Service beyond borders", title: "Standing with every Indian expatriate in need", text: "From detention and labour disputes to hospital care and repatriation, IOF volunteers act quickly, quietly and with dignity.", cta: ["Report a case", "#contact"], alt: ["Our Seva", "#services"], bg: "bg1", icon: "scale" },
  { eyebrow: "Medical & hospital support", title: "Care and comfort when a family is far from home", text: "We visit hospitals, coordinate with the Embassy and support families in India until the patient is safe.", cta: ["Get help", "#contact"], alt: ["How it works", "#process"], bg: "bg2", icon: "cross" },
  { eyebrow: "Dignified repatriation", title: "Bringing loved ones home with respect", text: "Documentation, police and Embassy formalities and mortal-remains repatriation handled with compassion.", cta: ["Volunteer with us", "#contact"], alt: ["FAQ", "#faq"], bg: "bg3", icon: "home" },
] as const;

export const SERVICES = [
  { n: "01", t: "Legal & Detention Support", d: "Mediation, lawyer coordination and consular access for people detained over financial, labour or criminal allegations.", icon: "M3 6l9-3 9 3M6 8v8m6-8v8m6-8v8M3 20h18" },
  { n: "02", t: "Medical & Hospital Support", d: "Hospital visits, bill negotiation, treatment follow-up and medical repatriation for the sick and injured.", icon: "M12 5v14M5 12h14" },
  { n: "03", t: "Labour & Work-contract Help", d: "Unpaid wages, final-exit disputes and contract violations resolved through the Labour Office and Embassy.", icon: "M4 10h16l-1.5 9h-13zM8 10V7a4 4 0 018 0v3" },
];

export const CAUSES = [
  { t: "Jailed – financial issue", p: "Settlement mediation, legal-aid lawyers and fundraising among members for people detained over debts or cheques.", g: "150deg,#138a50,#075b38" },
  { t: "Jailed – labour & violent crime", p: "Consular access, lawyers and family counselling while a case is in court.", g: "150deg,#f7b866,#f39a32" },
  { t: "Hospitalised", p: "Volunteer visits, hospital social-service liaison and help bringing patients home.", g: "150deg,#f3c46a,#e88b2e" },
  { t: "Death – natural & unnatural", p: "Documents, police and Embassy clearance and repatriation of mortal remains.", g: "150deg,#0b4a2e,#4fb286" },
];

export const PROVINCES = [
  { t: "Dammam", s: "Eastern Province", g: "150deg,#f7b866,#f39a32" },
  { t: "Jubail", s: "Eastern Province", g: "150deg,#138a50,#0b6a3f" },
  { t: "Al-Hasa", s: "Eastern Province", g: "150deg,#f3c46a,#d9822b" },
  { t: "Khobar", s: "Eastern Province", g: "150deg,#4fb286,#138a50" },
  { t: "Riyadh", s: "Central Province", g: "150deg,#f7b866,#c85a1f" },
  { t: "Jeddah", s: "Western Province", g: "150deg,#075b38,#138a50" },
];

export const STEPS = [
  { n: "01", t: "Report", d: "Anyone – a friend, family member or volunteer – tells the nearest IOF committee." },
  { n: "02", t: "Register", d: "A coordinator records the case with the victim, location and issue type." },
  { n: "03", t: "Assign", d: "The responsible province head assigns a coordinator, even across provinces." },
  { n: "04", t: "Resolve", d: "Progress is tracked step by step until the case is completed and closed." },
];

export const PRINCIPLES = [
  { q: "Every case is handled in confidence. Personal details are seen only by the people who need them to help.", t: "Confidentiality", s: "Our promise" },
  { q: "A case never waits unseen. Each one has a named owner, a province and a clear next step.", t: "Clear ownership", s: "Our promise" },
  { q: "Cases move across provinces without losing history, so help follows the person, wherever they are.", t: "One register, every province", s: "Our promise" },
];

export const FAQS = [
  ["Who can ask IOF for help?", "Any Indian expatriate in distress, or a relative, friend or community member acting on their behalf. Contact the nearest IOF committee or use the details below."],
  ["What kinds of cases does IOF take?", "Work-contract issues, detention (financial, labour or criminal), hospitalisation and deaths – natural or unnatural – including repatriation support."],
  ["Is my information kept private?", "Yes. Case details are restricted by role inside our case-management portal and shared only as needed to resolve the case."],
  ["Does IOF charge for Seva?", "No. Seva is a voluntary service. Where expenses arise, they are recorded openly against the case."],
];

export const NUMBERS = [
  { n: 10, s: "", l: "IOF committees" }, { n: 3, s: "", l: "Provinces covered" },
  { n: 7, s: "", l: "Kinds of case supported" }, { n: 9, s: "", l: "Tracked case stages" },
];
