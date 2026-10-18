// Sample data for the prototype (no backend yet)
// TODO milestone 1-2: load profiles from the database and cities from a geocoding API

// city center coordinates + first 3 chars of the postcodes
const CITIES = [
  { name: "Montréal",       region: "QC", postcodes: ["H2X", "H3B", "H2J"], lat: 45.5019, lng: -73.5674 },
  { name: "Laval",          region: "QC", postcodes: ["H7N", "H7T"],        lat: 45.6066, lng: -73.7124 },
  { name: "Longueuil",      region: "QC", postcodes: ["J4K", "J4H"],        lat: 45.5312, lng: -73.5181 },
  { name: "Québec",         region: "QC", postcodes: ["G1R", "G1K"],        lat: 46.8139, lng: -71.2080 },
  { name: "Gatineau",       region: "QC", postcodes: ["J8X", "J8Y"],        lat: 45.4765, lng: -75.7013 },
  { name: "Ottawa",         region: "ON", postcodes: ["K1P", "K2P"],        lat: 45.4215, lng: -75.6972 },
  { name: "Sherbrooke",     region: "QC", postcodes: ["J1H", "J1J"],        lat: 45.4042, lng: -71.8929 },
  { name: "Trois-Rivières", region: "QC", postcodes: ["G9A", "G8T"],        lat: 46.3430, lng: -72.5430 },
  { name: "Val-d'Or",       region: "QC", postcodes: ["J9P"],               lat: 48.0975, lng: -77.7828 },
  { name: "Rouyn-Noranda",  region: "QC", postcodes: ["J9X", "J9Y"],        lat: 48.2366, lng: -79.0231 },
  { name: "Saint-Jérôme",   region: "QC", postcodes: ["J7Z", "J7Y"],        lat: 45.7804, lng: -74.0036 },
  { name: "Drummondville",  region: "QC", postcodes: ["J2B", "J2C"],        lat: 45.8838, lng: -72.4843 },
];

const INTERESTS = [
  "Hiking", "Coffee", "Board games", "Photography", "Cooking", "Live music",
  "Cycling", "Books", "Yoga", "Travel", "Cinema", "Dancing",
  "Art galleries", "Running", "Wine tasting", "Languages",
];

const photo = (n) => `https://i.pravatar.cc/600?img=${n}`;

const PROFILES = [
  { id: "camille", name: "Camille", age: 29, city: "Montréal", photo: photo(25), online: true,  joined: "2026-09-28",
    interests: ["Coffee", "Photography", "Live music", "Cycling"],
    bio: "Graphic designer who knows every café on Saint-Laurent. Looking for people to shoot film photos with on weekends." },
  { id: "julien", name: "Julien", age: 34, city: "Laval", photo: photo(13), online: false, joined: "2026-08-14",
    interests: ["Board games", "Cooking", "Cinema"],
    bio: "Host of a monthly board-game night. Always happy to teach a new game — or to learn your grandmother's tourtière recipe." },
  { id: "amira", name: "Amira", age: 27, city: "Longueuil", photo: photo(42), online: true, joined: "2026-10-02",
    interests: ["Yoga", "Books", "Languages", "Travel"],
    bio: "Nurse, bookworm, and slowly learning Spanish. Let's do a language exchange over tea." },
  { id: "marc", name: "Marc-André", age: 41, city: "Val-d'Or", photo: photo(60), online: true, joined: "2026-07-20",
    interests: ["Hiking", "Photography", "Cycling", "Coffee"],
    bio: "Born and raised in Abitibi. I know the best trails around Lac Blouin and I'm looking for hiking partners." },
  { id: "sophie", name: "Sophie", age: 31, city: "Rouyn-Noranda", photo: photo(30), online: false, joined: "2026-09-10",
    interests: ["Live music", "Dancing", "Wine tasting"],
    bio: "Never miss the FME festival. Salsa on Thursdays, if you want to join a beginner-friendly crowd." },
  { id: "olivier", name: "Olivier", age: 36, city: "Québec", photo: photo(12), online: true, joined: "2026-10-09",
    interests: ["Running", "Cooking", "Travel", "Hiking"],
    bio: "Training for my second marathon. Weekend long runs on the Plains of Abraham — slow pace, good chat." },
  { id: "lea", name: "Léa", age: 25, city: "Sherbrooke", photo: photo(44), online: true, joined: "2026-10-12",
    interests: ["Art galleries", "Books", "Coffee", "Cinema"],
    bio: "Master's student in art history. Looking for company for exhibitions and indie film screenings." },
  { id: "karim", name: "Karim", age: 30, city: "Gatineau", photo: photo(59), online: false, joined: "2026-06-30",
    interests: ["Cycling", "Board games", "Languages"],
    bio: "Software tester by day, cyclist by evening. The Gatineau Park loop is my happy place." },
  { id: "nadia", name: "Nadia", age: 38, city: "Ottawa", photo: photo(47), online: false, joined: "2026-05-18",
    interests: ["Yoga", "Cooking", "Wine tasting", "Travel"],
    bio: "Plant-based cook and yoga teacher. I host small potluck dinners — new faces always welcome." },
  { id: "thomas", name: "Thomas", age: 28, city: "Trois-Rivières", photo: photo(53), online: true, joined: "2026-09-01",
    interests: ["Live music", "Photography", "Hiking"],
    bio: "Guitarist in a local folk band. Come to a show, then let's go take photos of the St. Lawrence at sunset." },
  { id: "chloe", name: "Chloé", age: 33, city: "Saint-Jérôme", photo: photo(32), online: false, joined: "2026-08-25",
    interests: ["Cycling", "Running", "Coffee"],
    bio: "The P'tit Train du Nord is my backyard. Looking for cycling buddies for Sunday rides." },
  { id: "samuel", name: "Samuel", age: 45, city: "Drummondville", photo: photo(68), online: false, joined: "2026-04-11",
    interests: ["Books", "Board games", "Cinema", "Languages"],
    bio: "High-school teacher and chess club organiser. Ask me for a book recommendation, I have hundreds." },
];

// fake logged in user
const CURRENT_USER = {
  id: "me", name: "Alex", age: 32, city: "Val-d'Or", photo: photo(51),
  online: true, joined: "2026-10-01",
  interests: ["Hiking", "Coffee", "Photography"],
  bio: "Just moved to Abitibi for work. Looking for people to explore the trails and the local coffee scene with.",
};

// sample conversations (key = profile id)
const SEED_MESSAGES = {
  marc: [
    { from: "marc", text: "Hi Alex! Saw you like hiking too 🙂", at: "09:12" },
    { from: "me",   text: "Hey Marc-André! Yes — I'm new to Val-d'Or, any trail you'd recommend?", at: "09:15" },
    { from: "marc", text: "Lac Blouin loop is perfect for a first one. I'm going Saturday morning if you want to join.", at: "09:18" },
  ],
  camille: [
    { from: "camille", text: "Your photos from Old Montréal are beautiful!", at: "Yesterday" },
  ],
};
