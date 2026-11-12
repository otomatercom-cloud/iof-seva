/**
 * Single source of truth for every editable piece of website content.
 * - The site renders these as fallbacks when Odoo is unreachable.
 * - `npm run content:export` turns them into the Odoo seed data (addon iof_site_content),
 *   where staff edit them. Keep this file plain data (no imports) so Node can run it directly.
 * Text kinds: line (one line), text (paragraph), long (multi-paragraph, see RichText), image.
 */
export type TextKind = "line" | "text" | "long" | "image";
export type TextDef = [page: string, label: string, value: string, kind?: TextKind];
export type ItemDef = { title: string; text?: string; icon?: string };

const LEGAL_PRIVACY = `This policy explains what personal information we collect when you register as a volunteer, why we collect it and how it is protected.

## Information we collect
Through the volunteer registration form we collect your name, contact details, optional personal and professional details, volunteer interests and availability, an emergency contact, and your consent. We ask only for what we need to coordinate volunteers.

## How we use it
- To review your registration and contact you about volunteer opportunities, events and community initiatives.
- To contact your emergency contact if needed during activities.
- To keep records of volunteer participation.

## Storage and access
Registrations are stored in IOF's secure registration system and are accessible only to authorised IOF staff. Data is sent over encrypted connections. We do not sell your information.

## Sharing
We do not share your personal information with third parties except where required by law.

## Your choices
You may ask to see, correct or delete your information, or withdraw your consent to be contacted, by emailing {email} and quoting your registration reference.

## Contact
Questions about this policy: {email}.`;

const LEGAL_TERMS = `## Use of this website
This website is provided by India Overseas Forum (IOF) to share information about our activities and to register volunteers. Please use it lawfully and do not attempt to disrupt or misuse it.

## Volunteer registration
By registering you confirm that the information you provide is true and accurate and that you voluntarily agree to take part in IOF Seva activities. Registration does not guarantee a volunteer role; IOF may review, accept or decline registrations.

## Accuracy of information
General guidance on this site (for example on passports or Iqama services) is not official advice. Always confirm requirements with the relevant embassy or authority.

## Changes
We may update these terms from time to time. Continued use of the site means you accept the updated terms.

## Contact
Questions: {email}.`;

export const TEXTS: Record<string, TextDef> = {
  // ---- Site-wide
  "site.name": ["Site-wide", "Organisation name", "India Overseas Forum"],
  "site.tagline": ["Site-wide", "Header tagline", "Serving Indians across Saudi Arabia"],
  "site.logo": ["Site-wide", "Logo (square PNG, transparent)", "", "image"],
  "site.email": ["Site-wide", "Contact email", "info@iofseva.org"],
  "site.address": ["Site-wide", "Address", "Riyadh, Saudi Arabia"],
  "site.hours": ["Site-wide", "Office hours", "9am – 6pm"],
  "site.join": ["Site-wide", "Volunteer button label", "Join as Volunteer"],
  "seo.title": ["Site-wide", "Browser title (home)", "India Overseas Forum | Serving Indians in Saudi Arabia"],
  "seo.description": ["Site-wide", "Search-engine description", "India Overseas Forum supports the Indian community in Saudi Arabia through volunteer programs, cultural activities and essential support services.", "text"],
  // ---- Menu & footer
  "nav.home": ["Menu & footer", "Menu: Home", "Home"],
  "nav.about": ["Menu & footer", "Menu: About", "About Us"],
  "nav.indians": ["Menu & footer", "Menu: Indians in KSA", "Indians in KSA"],
  "nav.seva": ["Menu & footer", "Menu: Seva Activities", "Seva Activities"],
  "nav.gallery": ["Menu & footer", "Menu: Gallery", "Gallery"],
  "nav.collab": ["Menu & footer", "Menu: Collaborations", "Collaborations"],
  "nav.reports": ["Menu & footer", "Menu: Reports", "Reports"],
  "nav.contact": ["Menu & footer", "Menu: Contact", "Contact"],
  "nav.support": ["Menu & footer", "Menu: Support", "Support"],
  "footer.support": ["Menu & footer", "Footer link: Track a request", "Track a Support Request"],
  "footer.about": ["Menu & footer", "Footer description", "Uplifting the Indian community in Saudi Arabia through support, culture and service.", "text"],
  "footer.explore": ["Menu & footer", "Footer heading: Explore", "Explore"],
  "footer.volunteer": ["Menu & footer", "Footer link: Volunteer Registration", "Volunteer Registration"],
  "footer.contact": ["Menu & footer", "Footer heading: Contact", "Contact"],
  "footer.rights": ["Menu & footer", "Copyright line (after year and name)", "All rights reserved."],
  "footer.privacy": ["Menu & footer", "Footer link: Privacy", "Privacy Policy"],
  "footer.terms": ["Menu & footer", "Footer link: Terms", "Terms & Conditions"],
  // ---- Home
  "home.hero.badge": ["Home", "Hero badge", "India Overseas Forum · Saudi Arabia"],
  "home.hero.title_main": ["Home", "Hero headline (white part)", "Together, We Make a"],
  "home.hero.title_accent": ["Home", "Hero headline (orange word)", "Difference."],
  "home.hero.intro": ["Home", "Hero paragraph", "Connecting, supporting and empowering the Indian community across Saudi Arabia, every day, through service, culture and volunteering.", "text"],
  "home.hero.cta1": ["Home", "Hero button 1", "Join as Volunteer"],
  "home.hero.cta2": ["Home", "Hero button 2", "Explore Seva Activities"],
  "home.intro.image": ["Home", "About section photo", "", "image"],
  "home.intro.image_alt": ["Home", "About section photo description", "IOF volunteers serving the community"],
  "home.intro.badge": ["Home", "About section orange badge", "Volunteer-driven since day one"],
  "home.intro.eyebrow": ["Home", "About eyebrow", "About IOF"],
  "home.intro.title": ["Home", "About heading", "A nonprofit that serves, educates and connects"],
  "home.intro.body": ["Home", "About paragraph", "India Overseas Forum is dedicated to uplifting the Indian community in Saudi Arabia through support, culture and service, with welfare programs, cultural events and volunteer-driven initiatives.", "text"],
  "home.intro.link": ["Home", "About link text", "Learn more about us"],
  "home.pillars.eyebrow": ["Home", "Pillars eyebrow", "Seva Activities"],
  "home.pillars.title": ["Home", "Pillars heading", "How we stand with our community"],
  "home.impact.eyebrow": ["Home", "Impact eyebrow", "Community Impact"],
  "home.impact.number": ["Home", "Impact big number", "500"],
  "home.impact.suffix": ["Home", "Impact number suffix", "+"],
  "home.impact.text": ["Home", "Impact sentence", "families received nutritious meals during Ramadan across Saudi Arabia through our Food Drive.", "text"],
  "home.events.eyebrow": ["Home", "Events eyebrow", "Events"],
  "home.events.title": ["Home", "Events heading", "Upcoming events and gatherings"],
  "home.events.intro": ["Home", "Events sentence", "Camps, celebrations and seva drives happening across Saudi Arabia. Everyone is welcome."],
  "home.events.empty": ["Home", "Events empty message", "New events will be announced here soon."],
  "home.events.upcoming": ["Home", "Events 'upcoming' label", "Upcoming"],
  "home.events.past": ["Home", "Events 'past' label", "Past event"],
  "home.moments.eyebrow": ["Home", "Moments eyebrow", "Our Moments"],
  "home.moments.title": ["Home", "Moments heading", "Snapshots of community spirit"],
  "home.moments.intro": ["Home", "Moments sentence", "Vibrant cultural celebrations and seva activities across Saudi Arabia."],
  "home.moments.link": ["Home", "Moments link text", "View full gallery"],
  "home.volunteer.eyebrow": ["Home", "Volunteer eyebrow", "Volunteer Hub"],
  "home.volunteer.title": ["Home", "Volunteer heading", "Your time can change a family's week."],
  "home.volunteer.body": ["Home", "Volunteer paragraph", "Join hands with us in blood donation, education, cultural events, medical support, emergency relief and more. Registration takes a few minutes.", "text"],
  "home.volunteer.note": ["Home", "Volunteer small note", "Free · Flexible hours · Every skill welcome"],
  "home.collab.eyebrow": ["Home", "Collaboration eyebrow", "Collaborations"],
  "home.collab.title": ["Home", "Collaboration heading", "Partner with IOF to reach more families"],
  "home.collab.body": ["Home", "Collaboration paragraph", "Organisations and professionals are welcome. Our planned Medical, Teacher and Business Forums connect the community with those who can help.", "text"],
  "home.collab.cta": ["Home", "Collaboration button", "Partnership enquiries"],
  "home.reports.eyebrow": ["Home", "Reports eyebrow", "Reports and updates"],
  "home.contact.title": ["Home", "Contact strip heading", "Get in touch"],
  // ---- About
  "about.title": ["About", "Page heading", "About India Overseas Forum"],
  "about.intro": ["About", "Page intro", "A nonprofit supporting the Indian community in Saudi Arabia through welfare programs, cultural events, and volunteer-driven initiatives.", "text"],
  "about.mission.title": ["About", "Mission heading", "Our mission"],
  "about.mission.text": ["About", "Mission text", "To become a leading organization that serves, educates, and creates business opportunities for the Indian diaspora in Saudi Arabia.", "text"],
  "about.goals.title": ["About", "Goals heading", "Our goals"],
  "about.forums.title": ["About", "Forums heading", "Our forums"],
  "about.forums.intro": ["About", "Forums sentence", "Three volunteer-led forums are planned to widen IOF's reach."],
  "about.support.title": ["About", "Community support heading", "Community support"],
  // ---- Indians in KSA
  "indians.title": ["Indians in KSA", "Page heading", "Indians in KSA"],
  "indians.intro": ["Indians in KSA", "Page intro", "Information and support for Indian residents across Saudi Arabia."],
  "indians.helps.title": ["Indians in KSA", "How IOF helps heading", "How IOF helps"],
  "indians.faq.title": ["Indians in KSA", "FAQ heading", "Frequently asked questions"],
  "indians.faq.note": ["Indians in KSA", "FAQ disclaimer", "This is general guidance. Always confirm requirements on the official Indian Embassy or Saudi government websites.", "text"],
  // ---- Seva activities & gallery
  "seva.title": ["Seva Activities", "Page heading", "Seva Activities"],
  "seva.intro": ["Seva Activities", "Page intro", "Service in action: how IOF volunteers support families across Saudi Arabia."],
  "seva.gallery.title": ["Seva Activities", "Gallery section heading", "Gallery"],
  "seva.gallery.intro": ["Seva Activities", "Gallery section sentence", "Snapshots of community moments and seva activities."],
  "seva.gallery.link": ["Seva Activities", "Gallery link text", "View full gallery"],
  "gallery.title": ["Gallery", "Page heading", "Photo Gallery"],
  "gallery.intro": ["Gallery", "Page intro", "Snapshots of community moments and heartfelt seva activities across Saudi Arabia."],
  "gallery.cta": ["Gallery", "Call-to-action sentence", "Be part of the next moment."],
  // ---- Collaborations, reports, contact
  "collab.title": ["Collaborations", "Page heading", "Collaborations"],
  "collab.intro": ["Collaborations", "Page intro", "Partner with IOF to support Indian residents across Saudi Arabia."],
  "collab.enquiry.title": ["Collaborations", "Enquiry heading", "Partnership enquiries"],
  "collab.enquiry.text": ["Collaborations", "Enquiry sentence", "Tell us about your organisation and how you would like to collaborate."],
  "collab.enquiry.button": ["Collaborations", "Enquiry button (before email)", "Email"],
  "reports.title": ["Reports", "Page heading", "Reports & Updates"],
  "reports.intro": ["Reports", "Page intro", "A look at what our volunteers and supporters have achieved together."],
  "reports.download": ["Reports", "Download link label", "Download report"],
  "contact.title": ["Contact", "Page heading", "Contact Us"],
  "contact.intro": ["Contact", "Page intro", "We'd love to hear from you."],
  "contact.email_label": ["Contact", "Card title: Email", "Email"],
  "contact.address_label": ["Contact", "Card title: Address", "Address"],
  "contact.hours_label": ["Contact", "Card title: Office hours", "Office hours"],
  "contact.cta": ["Contact", "Call-to-action sentence", "Want to help? Support and uplift the Indian community in Saudi Arabia."],
  // ---- Volunteer registration page
  "volunteer.eyebrow": ["Volunteer page", "Eyebrow", "Volunteer Registration"],
  "volunteer.title": ["Volunteer page", "Heading", "Register as an IOF volunteer"],
  "volunteer.intro": ["Volunteer page", "Intro", "Become a volunteer and help strengthen our Indian community in Saudi Arabia. Tell us about yourself and where you would like to help.", "text"],
  "volunteer.time": ["Volunteer page", "Progress label left", "About 3 minutes"],
  "volunteer.sections": ["Volunteer page", "Progress label right", "6 short sections"],
  "volunteer.next.title": ["Volunteer page", "Side card heading", "What happens next"],
  "volunteer.help.title": ["Volunteer page", "Questions card heading", "Questions?"],
  "volunteer.help.text": ["Volunteer page", "Questions card text", "Write to us and we will help you pick the right way to volunteer.", "text"],
  // ---- Support tickets
  "support.eyebrow": ["Support", "Request page: eyebrow", "IOF Support"],
  "support.title": ["Support", "Request page: heading", "Get help with visa, iqama and other issues"],
  "support.intro": ["Support", "Request page: intro", "Tell us what you need. You will get a private tracking token to follow your request and talk to our team.", "text"],
  "support.next.title": ["Support", "Side card heading", "How it works"],
  "support.track.title": ["Support", "Track card heading", "Already have a token?"],
  "support.track.text": ["Support", "Track card text", "Check the status of your request and read replies from our team.", "text"],
  "support.track.button": ["Support", "Track card button", "Track my request"],
  "track.title": ["Support", "Track page: heading", "Track your support request"],
  "track.intro": ["Support", "Track page: intro", "Enter the token you received when you submitted your request.", "text"],
  "track.new": ["Support", "Track page: new request link", "Need to raise a new request?"],
  // ---- Legal
  "privacy.title": ["Legal", "Privacy: heading", "Privacy Policy"],
  "privacy.intro": ["Legal", "Privacy: intro", "How India Overseas Forum handles volunteer information."],
  "privacy.body": ["Legal", "Privacy: body (## = heading, - = bullet, {email} = contact email)", LEGAL_PRIVACY, "long"],
  "terms.title": ["Legal", "Terms: heading", "Terms & Conditions"],
  "terms.intro": ["Legal", "Terms: intro", "Terms for using this website and registering as a volunteer."],
  "terms.body": ["Legal", "Terms: body (## = heading, - = bullet, {email} = contact email)", LEGAL_TERMS, "long"],
};

export const ICONS = [
  "droplet", "heart-pulse", "graduation-cap", "hand-heart", "party-popper", "life-buoy", "utensils",
  "stethoscope", "school", "briefcase", "siren", "users", "check",
] as const;

export const COLLECTIONS: Record<string, { label: string; items: ItemDef[] }> = {
  hero_checks: { label: "Home: hero tick list", items: [
    { title: "Blood donation camps" }, { title: "Medical and education aid" }, { title: "Emergency relief" }] },
  hero_cards: { label: "Home: hero floating cards", items: [
    { title: "Blood Donation", text: "Regular camps for local hospitals", icon: "droplet" },
    { title: "Ramadan Food Drive", text: "500+ families fed", icon: "utensils" },
    { title: "Rapid Response", text: "Aid when the community needs it", icon: "life-buoy" }] },
  services: { label: "Home: scrolling services strip", items: [
    { title: "Blood Donation" }, { title: "Educational Aid" }, { title: "Medical Support" },
    { title: "Emergency Relief" }, { title: "Food & Supplies" }, { title: "Cultural Events" }] },
  goals: { label: "Goals (Home and About)", items: [
    { title: "Serve needy members of the Indian diaspora in KSA." },
    { title: "Expand trade and commerce between KSA and India." },
    { title: "Educate the diaspora about Indian government policies." }] },
  pillars: { label: "Home: four pillars", items: [
    { title: "Community Support", text: "Assistance for Indian families across Saudi Arabia, delivered with warmth and dedication.", icon: "hand-heart" },
    { title: "Medical Aid", text: "Timely medical assistance and health camps for those who need them most.", icon: "heart-pulse" },
    { title: "Education", text: "Scholarships and tutoring that help Indian students thrive far from home.", icon: "graduation-cap" },
    { title: "Cultural Activities", text: "Festival celebrations with music and dance that keep our traditions alive abroad.", icon: "party-popper" }] },
  impact: { label: "Home: impact list", items: [
    { title: "Blood donation camps", text: "Regular camps supporting local hospitals and patients.", icon: "droplet" },
    { title: "Health camps", text: "Free medical checkups and emergency aid for the Indian community.", icon: "heart-pulse" },
    { title: "Education aid", text: "Books and tuition assistance for underprivileged children.", icon: "graduation-cap" }] },
  volunteer_tags: { label: "Home: volunteer tags", items: [
    "Community Service", "Blood Donation", "Educational Programs", "Cultural Events", "Youth Activities",
    "Medical Support", "Disaster Relief", "Event Management", "Social Media & Digital", "Fundraising"].map((title) => ({ title })) },
  forums: { label: "About: forums", items: [
    { title: "Medical Forum", text: "Connects Indian medical professionals in KSA.", icon: "stethoscope" },
    { title: "Teacher Forum", text: "Connects Indian teachers at IIS schools across KSA and promotes yoga in Indian schools.", icon: "school" },
    { title: "Business Forum", text: "Connects Indian business owners to create jobs in KSA and India.", icon: "briefcase" }] },
  support: { label: "About: community support", items: [
    { title: "Cultural Events", text: "Festival celebrations with music and dance.", icon: "party-popper" },
    { title: "Medical Aid", text: "Timely medical assistance and health camps.", icon: "heart-pulse" },
    { title: "Educational Support", text: "Scholarships and tutoring for Indian students abroad.", icon: "graduation-cap" },
    { title: "Rapid Response", text: "Aid during crises to help keep the community safe.", icon: "siren" }] },
  activities: { label: "Seva Activities: cards", items: [
    { title: "Blood Donation", text: "Regular blood donation camps supporting local hospitals and patients.", icon: "droplet" },
    { title: "Educational Aid", text: "Scholarships and learning materials for Indian children in Saudi Arabia.", icon: "graduation-cap" },
    { title: "Medical Support", text: "Help with medical consultations and emergency healthcare for community members.", icon: "heart-pulse" },
    { title: "Emergency Relief", text: "Quick crisis response, supplying essentials to Indian families affected by emergencies.", icon: "life-buoy" },
    { title: "Food & Supplies", text: "Food and supplies for families in need across Saudi Arabia.", icon: "utensils" }] },
  helps: { label: "Indians in KSA: how IOF helps", items: [
    { title: "Medical aid & health awareness", text: "Support and awareness programs for Indian residents." },
    { title: "Education support", text: "Free tutoring and resource distribution for students." }] },
  faq: { label: "Indians in KSA: FAQ", items: [
    { title: "Passport renewal", text: "Check the embassy website for current guidelines and required documents." },
    { title: "Iqama services", text: "Visit the Jawazat office or use the Absher online portal." },
    { title: "Madad registration", text: "Register on the Madad platform through the embassy website." },
    { title: "Travel advisories", text: "Look in the news section of the embassy website." },
    { title: "Volunteering", text: "Fill out the volunteer registration form on this website." }] },
  collab_cards: { label: "Collaborations: cards", items: [
    { title: "Health drives", text: "Free medical check-ups and blood donation camps." },
    { title: "Educational aid", text: "Scholarships and learning materials for Indian students." },
    { title: "Emergency relief", text: "Rapid response teams that assist during crises." }] },
  reports: { label: "Reports (optional PDF)", items: [
    { title: "Food Drive", text: "Providing nutritious meals to over 500 families during Ramadan across Saudi Arabia." },
    { title: "Education Aid", text: "Supporting underprivileged children with books and tuition assistance for brighter futures." },
    { title: "Health Camps", text: "Organizing free medical checkups and emergency aid for the Indian community in need." }] },
  steps: { label: "Volunteer page: what happens next", items: [
    { title: "We receive your registration", text: "You get a reference number straight away, generated by our registration system." },
    { title: "Our team reviews it", text: "An IOF coordinator looks at your interests and availability." },
    { title: "We get in touch", text: "We contact you about volunteer opportunities, events and community service." }] },
  support_steps: { label: "Support page: how it works", items: [
    { title: "Submit your request", text: "Choose a category and urgency. Emergencies and medical cases are prioritised automatically." },
    { title: "Save your token", text: "You receive a private token once. Keep it safe: it is the only way to open your request." },
    { title: "Track and reply", text: "Use the token on the Track page to see status, read our replies and add messages." }] },
  gallery: { label: "Photo gallery (upload photos in Odoo)", items: [] },
};
