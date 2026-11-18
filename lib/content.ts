// All site copy lives here. Facts (projects, industries, contact details, process
// steps, mission) come from cyoptmic.com; descriptive copy is new and can be edited freely.

export const site = {
  name: "Cyoptmic",
  tagline: "Engineering the cyberspace.",
  email: "hello@cyoptmic.com",
  phone: "+234 816 175 3780",
  phoneHref: "tel:+2348161753780",
  address: ["22 Palace Road, Oniru Estate", "Victoria Island, Lagos"],
  // TODO: replace with the real profile URLs.
  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "X", href: "#" },
  ],
};

export const nav = [
  { label: "The build", href: "#process" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Contact", href: "#contact" },
];

export const mission =
  "We engineer the cyberspace for ambitious businesses and founders: software that is built to scale, designed to be used, and made to compete in emerging markets and beyond.";

// The pinned build section: Cyoptmic's six process steps, plus a closing call to action.
export const build = [
  { title: "An idea.", body: "Every product starts as one sentence. We sit with you until it is sharp enough to build on." },
  { title: "Analysis.", body: "Users, devices, networks, cost. We measure what matters before a single screen exists." },
  { title: "Design.", body: "Flows first, then pixels. Desktop and mobile designed side by side, never as an afterthought." },
  { title: "Develop.", body: "Design becomes working code: typed, reviewed and built from reusable parts." },
  { title: "Test.", body: "Every platform, every browser, slow networks included. We break it so your users never do." },
  { title: "Deploy.", body: "Shipped to production, monitored, and ready for the next release." },
  { title: "Your turn.", body: "That was the whole journey in a few seconds of scrolling. Yours starts with one message." },
];

export const values = [
  { title: "Built to scale.", body: "Architecture chosen for where your business is going, not just where it is today." },
  { title: "Designed to be used.", body: "Interfaces people understand on the first tap and still enjoy on the hundredth." },
  { title: "Engineered in Lagos.", body: "We build for emerging markets from inside one: real devices, real networks, real users." },
  { title: "One team, end to end.", body: "Strategy, design, code and delivery under one roof. One contact, no hand-offs." },
];

export const industries = ["FinTech", "Real Estate", "E-commerce", "Communication", "Media"];

export const services = [
  {
    title: "Web Development",
    body: "Fast, accessible websites and web apps, from landing pages to full platforms.",
    tags: ["Next.js", "CMS", "Performance"],
  },
  {
    title: "Mobile Development",
    body: "Native iOS and cross-platform hybrid apps that feel at home on every device.",
    tags: ["iOS", "Hybrid", "App Store"],
  },
  {
    title: "UI/UX Design",
    body: "Research, product design and design systems that make complex things simple.",
    tags: ["Research", "Prototyping", "Design systems"],
  },
  {
    title: "Custom Software",
    body: "Bespoke platforms, dashboards and integrations built around how your business really works.",
    tags: ["APIs", "Dashboards", "Integrations"],
  },
  {
    title: "DevOps",
    body: "Cloud infrastructure, CI/CD and monitoring so releases are boring in the best way.",
    tags: ["Cloud", "CI/CD", "Monitoring"],
  },
  {
    title: "Project Management",
    body: "One accountable team, clear milestones and no surprises from kickoff to launch.",
    tags: ["Agile", "Roadmaps", "Delivery"],
  },
];

export const work = [
  { name: "Biltapay", kind: "FinTech · Mobile app", body: "A mobile app for paying bills.", hue: 18 },
  { name: "BiltaTech", kind: "FinTech · Landing page", body: "A landing page for a fintech company.", hue: 40 },
  { name: "Ikeja Tech", kind: "E-commerce · Website", body: "An online store for a gadget shop.", hue: 200 },
  { name: "HoodSavants", kind: "E-commerce · Website", body: "An online store for a clothing brand.", hue: 330 },
  { name: "Nearlify", kind: "Social · Landing page", body: "A landing page for a social networking app.", hue: 160 },
];

// TODO: replace with a real, approved quote. Do not publish this placeholder.
export const testimonial = {
  quote: "Client quote goes here. Ask Biltapay for two or three sentences about working with Cyoptmic.",
  name: "Gifted Emmanuel",
  role: "CEO, Biltapay",
};
