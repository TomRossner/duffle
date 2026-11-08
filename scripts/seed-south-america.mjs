// A three-month South America trip with lots of everything, to see how the app holds up with a long, busy trip.
// Tom Rossner is the admin; Alex and Sam travel along and Jordan is invited.
//
//   node scripts/seed-south-america.mjs           create the trip (replacing an earlier copy)
//   node scripts/seed-south-america.mjs --remove  delete it
//
// Times are local wall-clock times at each place, as the app stores them.
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JOIN_TOKEN = "south-america-demo-join-token";

const existing = await prisma.trip.findUnique({ where: { joinToken: JOIN_TOKEN } });
if (existing) await prisma.trip.delete({ where: { id: existing.id } });
if (process.argv.includes("--remove")) {
  console.log(existing ? "Deleted the South America trip." : "No South America trip to delete.");
  await prisma.$disconnect();
  process.exit(0);
}

const byEmail = (email) => prisma.user.findUniqueOrThrow({ where: { email } });
const [tom, alex, sam, jordan] = await Promise.all(
  ["tomrossner2@gmail.com", "alex@example.com", "sam@example.com", "jordan@example.com"].map(byEmail),
);
const everyone = [tom, alex, sam];

/** "2026-11-04", "10:30" → that local time, stored as UTC like the app does. */
const at = (date, time = "00:00") => new Date(`${date}T${time}:00.000Z`);
const day = (date) => at(date);

const trip = await prisma.trip.create({
  data: {
    name: "South America, three months",
    // From the overnight flight out to landing back home.
    startDate: day("2026-10-31"),
    endDate: day("2027-02-01"),
    baseCurrency: "USD",
    countries: ["PE", "BO", "CL", "AR", "BR"],
    coverNote: "Andes, salt flats, Patagonia and Brazilian beaches, from Lima to Rio.",
    ownerId: tom.id,
    joinToken: JOIN_TOKEN,
    members: {
      create: [
        { userId: tom.id, role: "ADMIN", status: "ACCEPTED" },
        { userId: alex.id, role: "MEMBER", status: "ACCEPTED" },
        { userId: sam.id, role: "MEMBER", status: "ACCEPTED" },
        { userId: jordan.id, role: "MEMBER", status: "INVITED" },
      ],
    },
  },
});
const tripId = trip.id;

// Demo rates, fixed so the seed works offline. The trip's base currency is USD.
const RATES = { USD: 1, EUR: 1.08 };

async function expense({ title, category, amount, currency = "USD", date, paidBy = tom, phase = "PLANNED", paid = true, split = everyone }) {
  const cents = Math.round(amount * 100);
  const each = Math.floor(cents / split.length);
  const remainder = cents - each * split.length;
  return prisma.expense.create({
    data: {
      tripId,
      phase,
      paid,
      category,
      title,
      amount,
      currency,
      fxRate: RATES[currency],
      fxDate: day(date),
      amountInBase: Math.round(amount * RATES[currency] * 100) / 100,
      manualRate: false,
      date: day(date),
      paidById: paidBy.id,
      splitType: "EQUAL",
      shares: {
        create: split.map((user, index) => ({ userId: user.id, amount: (each + (index < remainder ? 1 : 0)) / 100 })),
      },
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Destinations, each with its stay and activities.
// Activity: [title, tags, date, start, end, lat, lng, cost?, notes?]; start "allday" for an all-day activity.
const STOPS = [
  {
    name: "Lima", address: "Lima, Peru", lat: -12.0464, lng: -77.0428, start: "2026-11-01", end: "2026-11-04",
    notes: "Recover from the long flight. Miraflores for food, Barranco for evenings.",
    stay: { name: "Casa Miraflores B&B", address: "Calle Berlín 245, Miraflores, Lima", lat: -12.1216, lng: -77.0312, in: ["2026-11-01", "14:00"], out: ["2026-11-04", "08:00"], confirmation: "BK-77120", cost: 270, notes: "Late check-in arranged; the night guard has the key." },
    activities: [
      ["Malecón cliff walk", ["CITY"], "2026-11-02", "08:30", "10:30", -12.1302, -77.0337],
      ["Ceviche lunch at La Mar", ["DINNER"], "2026-11-02", "13:00", "14:30", -12.1094, -77.0386, 135, "No reservations, arrive by 12:45."],
      ["Barranco street art", ["CITY"], "2026-11-02", "16:00", "18:30", -12.1491, -77.0213],
      ["Larco Museum", ["CITY"], "2026-11-03", "10:00", "13:00", -12.0723, -77.0707, 45],
      ["Huaca Pucllana dinner", ["DINNER"], "2026-11-03", "19:30", "22:00", -12.1107, -77.0336, 160],
    ],
  },
  {
    name: "Cusco", address: "Cusco, Peru", lat: -13.5319, lng: -71.9675, start: "2026-11-04", end: "2026-11-11",
    notes: "3,400 m. Take the first two days slowly, coca tea, no big hikes.",
    stay: { name: "Casa San Blas", address: "Tocuyeros 566, San Blas, Cusco", lat: -13.5153, lng: -71.9759, in: ["2026-11-04", "12:00"], out: ["2026-11-11", "07:30"], confirmation: "CSB-4410", cost: 630, notes: "Oxygen available at reception.\nBreakfast 6:30–10:00." },
    activities: [
      ["Plaza de Armas and cathedral", ["CITY"], "2026-11-05", "15:00", "17:00", -13.5164, -71.9785, 30],
      ["San Pedro market", ["CITY"], "2026-11-06", "12:00", "13:30", -13.5225, -71.9844],
      ["Sacsayhuamán ruins", ["HIKE", "CITY"], "2026-11-07", "14:00", "17:00", -13.5094, -71.9817, 70],
      ["Rainbow Mountain day trip", ["HIKE"], "2026-11-09", "allday", null, -13.8695, -71.3031, 105, "Pickup 3:30 from the hotel. Bring layers and cash for the entrance."],
      ["Cooking class with pisco sours", ["DINNER"], "2026-11-10", "17:00", "20:30", -13.5181, -71.9771, 165],
    ],
  },
  {
    name: "Sacred Valley", address: "Urubamba, Peru", lat: -13.3047, lng: -72.1158, start: "2026-11-11", end: "2026-11-13",
    notes: "Base in Urubamba; Ollantaytambo for the train.",
    stay: { name: "Tambo del Inka lodge", address: "Av. Ferrocarril, Urubamba", lat: -13.3089, lng: -72.1197, in: ["2026-11-11", "14:00"], out: ["2026-11-13", "05:30"], confirmation: "TDI-90812", cost: 520 },
    activities: [
      ["Pisac market and ruins", ["HIKE", "CITY"], "2026-11-11", "09:00", "13:00", -13.4092, -71.8467, 30],
      ["Moray and Maras salt pans", ["HIKE"], "2026-11-12", "08:30", "13:30", -13.3297, -72.1966, 60],
      ["Ollantaytambo fortress", ["HIKE", "CITY"], "2026-11-12", "15:00", "17:30", -13.2572, -72.2669, 30],
    ],
  },
  {
    name: "Machu Picchu", address: "Aguas Calientes, Peru", lat: -13.1547, lng: -72.5254, start: "2026-11-13", end: "2026-11-14",
    notes: "Tickets are for circuit 2, 7:00 entry. Passports needed at the gate.",
    stay: { name: "Inkaterra Pueblo Hotel", address: "Aguas Calientes", lat: -13.1563, lng: -72.5249, in: ["2026-11-13", "12:00"], out: ["2026-11-14", "15:00"], confirmation: "INK-22031", cost: 480 },
    activities: [
      ["Hot springs soak", ["SPORT"], "2026-11-13", "17:00", "19:00", -13.1531, -72.5216, 15],
      ["Machu Picchu circuit 2", ["HIKE", "CITY"], "2026-11-14", "07:00", "11:00", -13.1631, -72.545, 210, "Bus up at 6:15. Guide meets us at the gate."],
      ["Huayna Picchu climb", ["HIKE"], "2026-11-14", "10:00", "12:30", -13.1574, -72.5465, 0, "Steep with drops. Gloves help."],
    ],
  },
  {
    name: "Arequipa", address: "Arequipa, Peru", lat: -16.409, lng: -71.5375, start: "2026-11-15", end: "2026-11-18",
    notes: "The white city. Good food, easy days before Colca.",
    stay: { name: "Casona Solar", address: "Consuelo 116, Arequipa", lat: -16.4012, lng: -71.5378, in: ["2026-11-15", "13:00"], out: ["2026-11-18", "02:30"], confirmation: "CS-3381", cost: 240 },
    activities: [
      ["Santa Catalina monastery", ["CITY"], "2026-11-15", "15:30", "18:00", -16.3954, -71.5366, 45],
      ["Picantería lunch", ["DINNER"], "2026-11-16", "12:30", "14:30", -16.4021, -71.5332, 60],
      ["Yanahuara viewpoint", ["CITY"], "2026-11-16", "17:00", "18:30", -16.3874, -71.5427],
      ["Misti volcano viewpoint ride", ["SPORT"], "2026-11-17", "08:00", "13:00", -16.3519, -71.4508, 90],
    ],
  },
  {
    name: "Colca Canyon", address: "Cabanaconde, Peru", lat: -15.6189, lng: -71.9776, start: "2026-11-18", end: "2026-11-20",
    notes: "Two-day trek down to the Sangalle oasis and back up.",
    stay: { name: "Oasis Paradise lodge", address: "Sangalle, Colca Canyon", lat: -15.6209, lng: -71.9531, in: ["2026-11-18", "15:00"], out: ["2026-11-19", "05:00"], cost: 75, notes: "Basic bungalows, cold showers, no Wi-Fi." },
    activities: [
      ["Cruz del Cóndor condors", ["HIKE"], "2026-11-18", "08:00", "09:30", -15.6127, -71.9049],
      ["Trek down to Sangalle", ["HIKE"], "2026-11-18", "10:00", "14:00", -15.6209, -71.9531, 0, "Steep descent, about 1,100 m."],
      ["Climb out of the canyon", ["HIKE"], "2026-11-19", "05:00", "08:30", -15.6189, -71.9776],
    ],
  },
  {
    name: "Puno", address: "Puno, Peru", lat: -15.8402, lng: -70.0219, start: "2026-11-20", end: "2026-11-23",
    notes: "Lake Titicaca at 3,800 m.",
    stay: { name: "Casa Andina Lake Titicaca", address: "Av. Sesquicentenario 1970, Puno", lat: -15.8228, lng: -70.0129, in: ["2026-11-20", "15:00"], out: ["2026-11-23", "06:30"], confirmation: "CAP-6602", cost: 210 },
    activities: [
      ["Uros floating islands", ["CITY"], "2026-11-21", "07:30", "11:00", -15.8188, -69.9701, 50],
      ["Taquile island homestay lunch", ["HIKE", "DINNER"], "2026-11-21", "12:30", "16:00", -15.7748, -69.6866],
      ["Sillustani towers at sunset", ["HIKE"], "2026-11-22", "15:00", "18:30", -15.7212, -70.1556, 40],
    ],
  },
  {
    name: "La Paz", address: "La Paz, Bolivia", lat: -16.4897, lng: -68.1193, start: "2026-11-23", end: "2026-11-27",
    notes: "Cross at Copacabana. Cable cars are the best way around.",
    stay: { name: "Atix Hotel", address: "Calle 16 No. 8052, Calacoto, La Paz", lat: -16.5414, lng: -68.0779, in: ["2026-11-23", "17:00"], out: ["2026-11-27", "06:00"], confirmation: "ATX-1903", cost: 380 },
    activities: [
      ["Mi Teleférico cable car loop", ["CITY"], "2026-11-24", "10:00", "13:00", -16.4955, -68.1336, 10],
      ["Witches' Market", ["CITY"], "2026-11-24", "15:00", "16:30", -16.4978, -68.1377],
      ["Death Road mountain bike", ["SPORT"], "2026-11-25", "allday", null, -16.2575, -67.8227, 270, "Gravity Bolivia, pickup 7:00."],
      ["Valle de la Luna", ["HIKE"], "2026-11-26", "10:00", "12:30", -16.5687, -68.0927, 10],
      ["Cholita wrestling", ["SPORT"], "2026-11-26", "16:00", "19:00", -16.5034, -68.163, 45],
    ],
  },
  {
    name: "Uyuni", address: "Uyuni, Bolivia", lat: -20.4597, lng: -66.8253, start: "2026-11-27", end: "2026-12-01",
    notes: "Three-day salt flat tour ending at the Chilean border.",
    stay: { name: "Palacio de Sal", address: "Colchani, Salar de Uyuni", lat: -20.3367, lng: -66.9547, in: ["2026-11-27", "15:00"], out: ["2026-11-28", "08:00"], confirmation: "PDS-5521", cost: 360, notes: "Hotel built from salt blocks. Then two nights in refugios on the tour." },
    activities: [
      ["Train cemetery", ["CITY"], "2026-11-27", "16:30", "17:30", -20.4769, -66.8366],
      ["Salar de Uyuni sunrise", ["HIKE"], "2026-11-28", "05:00", "08:00", -20.1338, -67.4891, 0, "Bring sunglasses and sunscreen; the glare is intense."],
      ["Isla Incahuasi cacti", ["HIKE"], "2026-11-28", "11:00", "12:30", -20.2425, -67.6255, 10],
      ["Laguna Colorada flamingos", ["HIKE"], "2026-11-29", "14:00", "16:00", -22.2079, -67.8173, 25],
      ["Sol de Mañana geysers", ["HIKE"], "2026-11-30", "05:30", "06:30", -22.4337, -67.7584],
      ["Polques hot springs", ["SPORT"], "2026-11-30", "07:00", "08:00", -22.5361, -67.6488, 6],
    ],
  },
  {
    name: "San Pedro de Atacama", address: "San Pedro de Atacama, Chile", lat: -22.9087, lng: -68.1997, start: "2026-12-01", end: "2026-12-05",
    notes: "The driest desert on earth. Book the stargazing early.",
    stay: { name: "Hostal Takha Takha", address: "Caracoles 101-A, San Pedro de Atacama", lat: -22.9118, lng: -68.1976, in: ["2026-12-01", "13:00"], out: ["2026-12-05", "10:00"], confirmation: "TT-2280", cost: 340 },
    activities: [
      ["Valle de la Luna sunset", ["HIKE"], "2026-12-01", "16:30", "20:00", -22.9333, -68.25, 45],
      ["Stargazing tour", ["CITY"], "2026-12-02", "22:00", "00:30", -22.9533, -68.1792, 120, "Dress warmly, it drops below freezing."],
      ["Lagunas Altiplánicas", ["HIKE"], "2026-12-03", "07:00", "16:00", -23.7319, -67.7932, 135],
      ["Sandboarding in Death Valley", ["SPORT"], "2026-12-04", "09:00", "12:00", -22.9101, -68.2421, 75],
    ],
  },
  {
    name: "Santiago", address: "Santiago, Chile", lat: -33.4489, lng: -70.6693, start: "2026-12-05", end: "2026-12-09",
    notes: "Rest days. Laundry and admin before Patagonia gear shopping.",
    stay: { name: "Lastarria Boutique Hotel", address: "Coronel Santiago Bueras 188, Santiago", lat: -33.4377, lng: -70.6413, in: ["2026-12-05", "15:00"], out: ["2026-12-09", "10:00"], confirmation: "LBH-81233", cost: 520 },
    activities: [
      ["Cerro San Cristóbal funicular", ["CITY", "HIKE"], "2026-12-06", "10:00", "12:30", -33.4253, -70.6331, 18],
      ["Mercado Central seafood lunch", ["DINNER"], "2026-12-06", "13:30", "15:00", -33.4334, -70.6513, 90],
      ["Concha y Toro winery", ["CITY", "DINNER"], "2026-12-07", "11:00", "15:00", -33.5794, -70.5642, 105],
      ["Outdoor gear shopping", ["CITY"], "2026-12-08", "11:00", "14:00", -33.4173, -70.6047, 0, "Rain shell, gaiters, gloves for Torres del Paine."],
    ],
  },
  {
    name: "Valparaíso", address: "Valparaíso, Chile", lat: -33.0472, lng: -71.6127, start: "2026-12-09", end: "2026-12-11",
    notes: "Hills, murals, funiculars.",
    stay: { name: "Casa Higueras", address: "Higuera 133, Cerro Alegre, Valparaíso", lat: -33.0421, lng: -71.6264, in: ["2026-12-09", "13:00"], out: ["2026-12-11", "08:00"], confirmation: "CH-55102", cost: 290 },
    activities: [
      ["Street art walking tour", ["CITY"], "2026-12-09", "15:00", "18:00", -33.0417, -71.6266, 30],
      ["La Sebastiana (Neruda's house)", ["CITY"], "2026-12-10", "10:30", "12:30", -33.0526, -71.6294, 24],
      ["Viña del Mar beach afternoon", ["BEACH"], "2026-12-10", "14:00", "18:00", -33.0197, -71.5519],
    ],
  },
  {
    name: "Mendoza", address: "Mendoza, Argentina", lat: -32.8895, lng: -68.8458, start: "2026-12-11", end: "2026-12-15",
    notes: "Bus over the Andes via Paso Los Libertadores. Bring passports for the border.",
    stay: { name: "Finca Adalgisa", address: "Pueyrredón 2222, Chacras de Coria, Mendoza", lat: -32.9875, lng: -68.8838, in: ["2026-12-11", "17:00"], out: ["2026-12-15", "05:00"], confirmation: "FA-7718", cost: 560 },
    activities: [
      ["Bike the Maipú wineries", ["SPORT", "DINNER"], "2026-12-12", "10:00", "17:00", -32.9822, -68.7909, 80],
      ["Asado night at the finca", ["DINNER"], "2026-12-12", "21:00", "23:59", -32.9875, -68.8838, 135],
      ["Uco Valley tasting", ["CITY", "DINNER"], "2026-12-13", "09:00", "18:00", -33.5994, -69.1544, 210],
      ["Aconcagua viewpoint", ["HIKE"], "2026-12-14", "08:00", "17:00", -32.8209, -69.9318, 95],
    ],
  },
  {
    name: "Torres del Paine", address: "Puerto Natales, Chile", lat: -51.7298, lng: -72.5077, start: "2026-12-15", end: "2026-12-21",
    notes: "W trek, four days. Refugios booked; carry our own food for lunches.",
    stay: { name: "W Trek refugios", address: "Torres del Paine National Park", lat: -50.9423, lng: -73.4068, in: ["2026-12-16", "17:00"], out: ["2026-12-20", "15:00"], confirmation: "VERT-W-30419", cost: 1140, notes: "Refugio Torre Central, Los Cuernos, Paine Grande, Grey.\nBedding included; showers are short." },
    activities: [
      ["Base of the Towers hike", ["HIKE"], "2026-12-17", "06:00", "15:00", -50.9423, -72.9659, 0, "The last hour is a boulder scramble."],
      ["Los Cuernos traverse", ["HIKE"], "2026-12-18", "08:00", "14:00", -51.0154, -72.9867],
      ["French Valley", ["HIKE"], "2026-12-19", "07:30", "16:30", -51.0156, -73.0563],
      ["Grey Glacier kayak", ["SPORT"], "2026-12-20", "09:00", "12:30", -51.0119, -73.2128, 285],
    ],
  },
  {
    name: "El Calafate", address: "El Calafate, Argentina", lat: -50.3402, lng: -72.2648, start: "2026-12-21", end: "2026-12-24",
    notes: "Perito Moreno and a rest after the trek.",
    stay: { name: "Kau Yatun", address: "25 de Mayo, El Calafate", lat: -50.3361, lng: -72.2683, in: ["2026-12-21", "16:00"], out: ["2026-12-24", "08:00"], confirmation: "KY-12940", cost: 420 },
    activities: [
      ["Perito Moreno glacier walkways", ["HIKE"], "2026-12-22", "09:00", "15:00", -50.4967, -73.1377, 90],
      ["Big Ice trek on the glacier", ["HIKE", "SPORT"], "2026-12-23", "allday", null, -50.4967, -73.1377, 1200, "Ages 18–50 only. Crampons provided."],
    ],
  },
  {
    name: "El Chaltén", address: "El Chaltén, Argentina", lat: -49.3315, lng: -72.8863, start: "2026-12-24", end: "2026-12-28",
    notes: "Christmas in the hiking capital. Shops close early on the 24th.",
    stay: { name: "Destino Sur", address: "Lago del Desierto 216, El Chaltén", lat: -49.3302, lng: -72.8848, in: ["2026-12-24", "13:00"], out: ["2026-12-28", "07:00"], confirmation: "DS-40018", cost: 480 },
    activities: [
      ["Laguna de los Tres (Fitz Roy)", ["HIKE"], "2026-12-25", "05:30", "16:30", -49.2717, -73.0283, 0, "20 km round trip, the last kilometre is brutal."],
      ["Laguna Torre", ["HIKE"], "2026-12-26", "08:00", "15:00", -49.3263, -73.0049],
      ["Chorrillo del Salto waterfall", ["HIKE"], "2026-12-27", "10:00", "12:30", -49.2974, -72.9134],
    ],
  },
  {
    name: "Buenos Aires", address: "Buenos Aires, Argentina", lat: -34.6037, lng: -58.3816, start: "2026-12-28", end: "2027-01-05",
    notes: "New Year's Eve in Palermo. Carry cash for the blue rate.",
    stay: { name: "Palermo Soho apartment", address: "Gurruchaga 1650, Palermo, Buenos Aires", lat: -34.5889, lng: -58.4261, in: ["2026-12-28", "16:00"], out: ["2027-01-05", "08:00"], confirmation: "AIR-HMQ82", cost: 920, notes: "Door code in the Airbnb app.\nWasher in the flat." },
    activities: [
      ["La Boca and Caminito", ["CITY"], "2026-12-29", "10:00", "13:00", -34.6345, -58.3631],
      ["Recoleta Cemetery", ["CITY"], "2026-12-29", "15:00", "17:00", -34.5875, -58.3933, 15],
      ["Tango show and dinner", ["DINNER"], "2026-12-30", "20:30", "23:59", -34.6122, -58.3718, 240],
      ["New Year's Eve rooftop", ["DINNER"], "2026-12-31", "21:00", "23:59", -34.5815, -58.4314, 300],
      ["San Telmo Sunday market", ["CITY"], "2027-01-03", "11:00", "15:00", -34.6206, -58.3715],
      ["Tigre delta boat trip", ["CITY"], "2027-01-04", "09:30", "16:00", -34.4262, -58.5797, 75],
    ],
  },
  {
    name: "Iguazú", address: "Puerto Iguazú, Argentina", lat: -25.5972, lng: -54.5786, start: "2027-01-05", end: "2027-01-08",
    notes: "Argentine side one day, Brazilian side the next. Bring a dry bag.",
    stay: { name: "Hotel La Cantera", address: "Selva Iryapú, Puerto Iguazú", lat: -25.6213, lng: -54.5585, in: ["2027-01-05", "14:00"], out: ["2027-01-08", "09:00"], confirmation: "LC-50923", cost: 450 },
    activities: [
      ["Devil's Throat walkway", ["HIKE"], "2027-01-06", "08:00", "12:00", -25.6953, -54.4367, 60],
      ["Gran Aventura boat under the falls", ["SPORT"], "2027-01-06", "13:30", "15:00", -25.6866, -54.4442, 165, "You will be soaked. Phones in the dry bag."],
      ["Brazilian side panorama", ["HIKE"], "2027-01-07", "09:00", "13:00", -25.6953, -54.4367, 45],
      ["Parque das Aves", ["CITY"], "2027-01-07", "14:00", "16:30", -25.6176, -54.4824, 30],
    ],
  },
  {
    name: "Rio de Janeiro", address: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729, start: "2027-01-08", end: "2027-01-20",
    notes: "Beach days, the classics, and a long break before the coast.",
    stay: { name: "Ipanema beach flat", address: "Rua Vinícius de Moraes 120, Ipanema, Rio de Janeiro", lat: -22.9841, lng: -43.2014, in: ["2027-01-08", "15:00"], out: ["2027-01-20", "08:00"], confirmation: "AIR-RJ5530", cost: 1680 },
    activities: [
      ["Christ the Redeemer", ["CITY"], "2027-01-09", "08:00", "11:00", -22.9519, -43.2105, 90],
      ["Sugarloaf cable car at sunset", ["CITY"], "2027-01-09", "17:00", "19:30", -22.9488, -43.1567, 90],
      ["Ipanema beach day", ["BEACH"], "2027-01-10", "allday", null, -22.9868, -43.2049],
      ["Selarón Steps and Lapa", ["CITY"], "2027-01-11", "16:00", "19:00", -22.9153, -43.1792],
      ["Tijuca forest hike", ["HIKE"], "2027-01-12", "08:00", "13:00", -22.9519, -43.2914, 60],
      ["Maracanã match", ["SPORT"], "2027-01-13", "19:00", "21:30", -22.9121, -43.2302, 150],
      ["Hang gliding over São Conrado", ["SPORT"], "2027-01-15", "10:00", "12:00", -22.9944, -43.2696, 600],
      ["Copacabana beach volleyball", ["BEACH", "SPORT"], "2027-01-16", "16:00", "18:00", -22.9711, -43.1822],
      ["Samba night in Lapa", ["DINNER"], "2027-01-17", "22:00", "23:59", -22.9133, -43.1822, 45],
      ["Prainha surf lesson", ["BEACH", "SPORT"], "2027-01-18", "09:00", "12:00", -23.0413, -43.5059, 120],
    ],
  },
  {
    name: "Paraty", address: "Paraty, Brazil", lat: -23.2192, lng: -44.7139, start: "2027-01-20", end: "2027-01-24",
    notes: "Colonial town and islands by schooner.",
    stay: { name: "Pousada do Sandi", address: "Largo do Rosário 1, Paraty", lat: -23.2195, lng: -44.7146, in: ["2027-01-20", "14:00"], out: ["2027-01-24", "09:00"], confirmation: "PDS-88014", cost: 640 },
    activities: [
      ["Historic centre walk", ["CITY"], "2027-01-20", "16:00", "18:00", -23.2177, -44.7131],
      ["Schooner island hopping", ["BEACH"], "2027-01-21", "10:30", "16:30", -23.2028, -44.6986, 105],
      ["Trindade natural pools", ["BEACH", "HIKE"], "2027-01-22", "09:00", "16:00", -23.3536, -44.7225],
      ["Cachaça distillery tour", ["DINNER"], "2027-01-23", "14:00", "16:00", -23.1919, -44.7553, 30],
    ],
  },
  {
    name: "Ilha Grande", address: "Abraão, Ilha Grande, Brazil", lat: -23.1435, lng: -44.1686, start: "2027-01-24", end: "2027-01-27",
    notes: "No cars on the island. Cash only in most places.",
    stay: { name: "Pousada Naturalia", address: "Rua da Praia 149, Abraão", lat: -23.1424, lng: -44.1653, in: ["2027-01-24", "13:00"], out: ["2027-01-27", "09:00"], confirmation: "PN-60372", cost: 390 },
    activities: [
      ["Lopes Mendes beach hike", ["BEACH", "HIKE"], "2027-01-25", "08:30", "16:00", -23.1755, -44.1356, 0, "Water taxi back if legs give out."],
      ["Lagoa Azul snorkel", ["BEACH", "SPORT"], "2027-01-26", "10:00", "15:00", -23.0906, -44.2299, 45],
    ],
  },
  {
    name: "Rio de Janeiro (last days)", address: "Rio de Janeiro, Brazil", lat: -22.9068, lng: -43.1729, start: "2027-01-27", end: "2027-01-31",
    notes: "Souvenirs, one more beach, fly home.",
    stay: { name: "Copacabana Palace", address: "Av. Atlântica 1702, Copacabana, Rio de Janeiro", lat: -22.967, lng: -43.1786, in: ["2027-01-27", "15:00"], out: ["2027-01-31", "12:00"], confirmation: "BLM-30115", cost: 1450, notes: "The splurge. Pool closes at 21:00." },
    activities: [
      ["Botanical Garden", ["CITY"], "2027-01-28", "09:30", "12:00", -22.9673, -43.2244, 15],
      ["Santa Teresa tram and lunch", ["CITY", "DINNER"], "2027-01-29", "11:00", "15:00", -22.9206, -43.1866, 55],
      ["Farewell churrascaria", ["DINNER"], "2027-01-30", "20:00", "22:30", -22.9853, -43.2093, 180],
    ],
  },
];

const destinationIds = new Map();
for (const [index, stop] of STOPS.entries()) {
  const destination = await prisma.destination.create({
    data: {
      tripId, name: stop.name, address: stop.address, lat: stop.lat, lng: stop.lng,
      startDate: day(stop.start), endDate: day(stop.end), notes: stop.notes, sortOrder: index,
    },
  });
  destinationIds.set(stop.name, destination.id);

  const { stay } = stop;
  const stayCost = stay.cost
    ? await expense({ title: stay.name, category: "STAY", amount: stay.cost, date: stay.in[0], paidBy: everyone[index % 3] })
    : null;
  await prisma.stay.create({
    data: {
      tripId, destinationId: destination.id, name: stay.name, address: stay.address, lat: stay.lat, lng: stay.lng,
      checkIn: at(...stay.in), checkOut: at(...stay.out), confirmation: stay.confirmation ?? null, notes: stay.notes ?? null,
      expenseId: stayCost?.id,
    },
  });

  for (const [activityIndex, [title, tags, date, start, end, lat, lng, cost, notes]] of stop.activities.entries()) {
    const allDay = start === "allday";
    const planned = cost
      ? await expense({ title, category: "ACTIVITY", amount: cost, date, paidBy: everyone[(index + activityIndex) % 3] })
      : null;
    await prisma.activity.create({
      data: {
        destinationId: destination.id, title, tags,
        startAt: allDay ? at(date) : at(date, start), endAt: allDay || !end ? null : at(date, end), allDay,
        lat, lng, notes: notes ?? null, expenseId: planned?.id,
      },
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Flights: [airline, number, from, to, depart date, time, arrive date, time, minutes, fromTerminal, toTerminal, seats, confirmation, cost?]
const AIRPORTS = {
  TLV: [32.0114, 34.8867], MAD: [40.4719, -3.5626], LIM: [-12.0219, -77.1143], CUZ: [-13.5357, -71.9388],
  AQP: [-16.3411, -71.583], LPB: [-16.5133, -68.1923], UYU: [-20.4463, -66.8484], CJC: [-22.4982, -68.9036],
  SCL: [-33.393, -70.7858], MDZ: [-32.8317, -68.7929], PUQ: [-53.0026, -70.8546], FTE: [-50.2803, -72.0531],
  AEP: [-34.5592, -58.4156], IGR: [-25.7373, -54.4734], IGU: [-25.6003, -54.4873], GIG: [-22.81, -43.2506],
  LIS: [38.7742, -9.1342],
};
const FLIGHTS = [
  ["El Al", "LY395", "TLV", "MAD", "2026-10-31", "06:10", "2026-10-31", "10:25", 315, "3", "4S", "23A, 23B, 23C", "LYQ2K8", 2340],
  ["Iberia", "IB6651", "MAD", "LIM", "2026-10-31", "12:15", "2026-10-31", "17:05", 710, "4S", null, "31D, 31E, 31F", "LYQ2K8"],
  ["LATAM Airlines", "LA2025", "LIM", "CUZ", "2026-11-04", "09:05", "2026-11-04", "10:30", 85, null, null, "8A, 8B, 8C", "LA7XKQ", 285],
  ["LATAM Airlines", "LA2111", "CUZ", "AQP", "2026-11-15", "10:20", "2026-11-15", "11:20", 60, null, null, null, "LA9MPD", 195],
  ["Boliviana de Aviación", "OB810", "LPB", "UYU", "2026-11-27", "07:30", "2026-11-27", "08:30", 60, null, null, null, "OB55TR", 330],
  ["Sky Airline", "H2111", "CJC", "SCL", "2026-12-05", "11:40", "2026-12-05", "13:50", 130, null, "1", "12D, 12E, 12F", "SKY4QW", 240],
  ["LATAM Airlines", "LA471", "MDZ", "SCL", "2026-12-15", "06:30", "2026-12-15", "07:35", 65, null, "1", null, "LA3RTV", 410],
  ["LATAM Airlines", "LA97", "SCL", "PUQ", "2026-12-15", "09:20", "2026-12-15", "12:50", 210, "1", null, "20A, 20B, 20C", "LA3RTV"],
  ["Aerolíneas Argentinas", "AR1873", "FTE", "AEP", "2026-12-28", "10:50", "2026-12-28", "14:10", 200, null, "A", null, "AR8NBZ", 390],
  ["Aerolíneas Argentinas", "AR1724", "AEP", "IGR", "2027-01-05", "08:40", "2027-01-05", "10:35", 115, "A", null, "14A, 14B, 14C", "AR2HLM", 270],
  ["LATAM Airlines", "LA3253", "IGU", "GIG", "2027-01-08", "12:15", "2027-01-08", "14:20", 125, null, "2", null, "LA6DWE", 310],
  ["TAP Air Portugal", "TP74", "GIG", "LIS", "2027-01-31", "17:05", "2027-02-01", "06:45", 580, "2", "1", "40A, 40B, 40C", "TP8MHA", 2610],
  ["TAP Air Portugal", "TP1610", "LIS", "TLV", "2027-02-01", "09:55", "2027-02-01", "16:25", 330, "1", "3", "18D, 18E, 18F", "TP8MHA"],
];
for (const [airline, flightNumber, from, to, departDate, departTime, arriveDate, arriveTime, minutes, fromTerminal, toTerminal, seats, confirmation, cost] of FLIGHTS) {
  const planned = cost
    ? await expense({ title: `${from} → ${to}`, category: "FLIGHT", amount: cost, date: departDate })
    : null;
  await prisma.flight.create({
    data: {
      tripId, airline, flightNumber, fromAirport: from, toAirport: to,
      fromLat: AIRPORTS[from][0], fromLng: AIRPORTS[from][1], toLat: AIRPORTS[to][0], toLng: AIRPORTS[to][1],
      fromTerminal, toTerminal, durationMinutes: minutes,
      departAt: at(departDate, departTime), arriveAt: at(arriveDate, arriveTime),
      confirmation, seats, expenseId: planned?.id,
      travelers: { create: everyone.map((user) => ({ userId: user.id })) },
    },
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Plans: [kind, title, date, start, end, placeName, lat, lng, notes?]; start "allday" for all-day.
const PLANS = [
  ["TRANSFER", "Taxi to Casa Miraflores", "2026-11-01", "07:30", "08:30", "Jorge Chávez Airport", -12.0219, -77.1143, "Official taxi desk inside arrivals only."],
  ["OTHER", "Sleep off the flight", "2026-11-01", "09:00", "13:00", null, null, null],
  ["DINNER", "Dinner at Central", "2026-11-01", "20:00", "23:00", "Central, Barranco", -12.1471, -77.0213, "Tasting menu booked months ago. Smart casual."],
  ["MEETUP", "Drinks with Diego", "2026-11-03", "18:00", "20:00", "Barranco bar", -12.1498, -77.0206, "Alex's friend from Lima. He'll pick the bar."],
  ["TRANSFER", "Taxi to the airport", "2026-11-04", "06:30", "07:30", "Jorge Chávez Airport", -12.0219, -77.1143],
  ["TRANSFER", "Hotel pickup in Cusco", "2026-11-04", "10:45", "11:30", "Cusco Airport", -13.5357, -71.9388],
  ["OTHER", "Acclimatize: rest and coca tea", "2026-11-04", "allday", null, null, null, null, "No alcohol today, lots of water."],
  ["OTHER", "Buy Boleto Turístico", "2026-11-05", "11:30", "12:00", "COSITUC office", -13.5171, -71.9782],
  // Today (Nov 8) is a full day, to see "Now" and "Up next" in action.
  ["DINNER", "Breakfast at Jack's Café", "2026-11-08", "08:00", "09:00", "Jack's Café, San Blas", -13.5156, -71.9764],
  ["OTHER", "Laundry drop-off", "2026-11-08", "09:15", "09:30", "Lavandería San Blas", -13.5149, -71.9757],
  ["MEETUP", "Walking tour meeting point", "2026-11-08", "10:00", "12:30", "Plaza de Armas", -13.5164, -71.9785, "Look for the guide with the yellow umbrella."],
  ["DINNER", "Lunch at Chicha", "2026-11-08", "13:00", "14:30", "Chicha por Gastón Acurio", -13.5179, -71.9799],
  ["OTHER", "Pick up Machu Picchu tickets", "2026-11-08", "15:00", "15:30", "Ministry of Culture office", -13.5197, -71.9776, "Bring all three passports."],
  ["OTHER", "Siesta", "2026-11-08", "15:45", "17:00", null, null, null],
  ["MEETUP", "Sunset at San Cristóbal viewpoint", "2026-11-08", "17:30", "18:30", "Mirador de San Cristóbal", -13.5138, -71.9822],
  ["DINNER", "Dinner at Morena Peruvian Kitchen", "2026-11-08", "19:30", "21:30", "Morena, Calle Plateros", -13.5155, -71.9802],
  ["TRANSFER", "Private driver to Urubamba", "2026-11-11", "07:30", "09:00", "Casa San Blas", -13.5153, -71.9759],
  ["TRANSFER", "Vistadome train to Aguas Calientes", "2026-11-13", "07:05", "08:35", "Ollantaytambo station", -13.2588, -72.2647, "Seats in car C. One small bag each."],
  ["TRANSFER", "Train and bus back to Cusco", "2026-11-14", "15:20", "19:30", "Aguas Calientes station", -13.1545, -72.5253],
  ["TRANSFER", "Colca tour pickup", "2026-11-18", "03:00", "07:30", "Casona Solar", -16.4012, -71.5378, "Packed breakfast from the hotel."],
  ["TRANSFER", "Bus Chivay to Puno", "2026-11-20", "08:00", "14:00", "Chivay terminal", -15.6381, -71.6012],
  ["TRANSFER", "Bus Puno to La Paz via Copacabana", "2026-11-23", "07:00", "16:30", "Puno bus terminal", -15.8402, -70.0219, "Border crossing at Kasani, about an hour."],
  ["DINNER", "Gustu tasting menu", "2026-11-24", "19:30", "22:30", "Gustu, Calacoto", -16.5395, -68.0794],
  ["TRANSFER", "Salar tour starts", "2026-11-28", "08:00", "08:30", "Uyuni tour office", -20.4597, -66.8253, "Three days, two nights. Ends at the Chilean border."],
  ["TRANSFER", "Border crossing to Chile", "2026-11-30", "09:00", "10:30", "Hito Cajón", -22.8988, -67.7926],
  ["TRANSFER", "Bus to Valparaíso", "2026-12-09", "10:30", "12:15", "Terminal Alameda", -33.4537, -70.6872],
  ["TRANSFER", "Bus over the Andes to Mendoza", "2026-12-11", "08:30", "16:30", "Valparaíso terminal", -33.0478, -71.6067, "Spectacular switchbacks. Window seats on the right."],
  ["TRANSFER", "Bus to Puerto Natales", "2026-12-15", "14:00", "17:00", "Punta Arenas airport", -53.0026, -70.8546],
  ["OTHER", "Rent trekking poles and stove", "2026-12-15", "18:00", "19:00", "Erratic Rock, Puerto Natales", -51.7286, -72.5066],
  ["TRANSFER", "Park bus to Laguna Amarga", "2026-12-16", "07:30", "10:00", "Puerto Natales terminal", -51.7298, -72.5077],
  ["TRANSFER", "Bus to El Calafate", "2026-12-21", "08:00", "13:30", "Puerto Natales terminal", -51.7298, -72.5077],
  ["TRANSFER", "Bus to El Chaltén", "2026-12-24", "08:00", "11:00", "El Calafate terminal", -50.3375, -72.2622],
  ["DINNER", "Christmas Eve dinner", "2026-12-24", "21:00", "23:59", "La Tapera, El Chaltén", -49.3307, -72.8861, "Booked for three. Bring a small gift each."],
  ["OTHER", "Christmas Day", "2026-12-25", "allday", null, null, null, null, "Shops closed. Big hike, then video calls home."],
  ["MEETUP", "Lunch with Sofía's family", "2027-01-02", "13:00", "16:00", "Belgrano", -34.5627, -58.4566, "Bring wine and dessert."],
  ["OTHER", "Visa run admin day", "2027-01-04", "allday", null, null, null, null, "Check Brazil entry rules and print bookings."],
  ["TRANSFER", "Border crossing to Foz do Iguaçu", "2027-01-07", "08:00", "08:45", "Tancredo Neves Bridge", -25.5937, -54.5904],
  ["MEETUP", "Football with Ipanema locals", "2027-01-14", "17:00", "19:00", "Posto 9, Ipanema", -22.9868, -43.2049],
  ["OTHER", "Laundry and repacking", "2027-01-19", "allday", null, null, null, null],
  ["TRANSFER", "Bus to Paraty", "2027-01-20", "08:00", "12:30", "Rodoviária Novo Rio", -22.8987, -43.2096],
  ["TRANSFER", "Bus and ferry to Ilha Grande", "2027-01-24", "08:00", "12:00", "Paraty bus station", -23.2183, -44.7212],
  ["TRANSFER", "Ferry and bus back to Rio", "2027-01-27", "09:30", "14:00", "Abraão pier", -23.1435, -44.1686],
  ["OTHER", "Souvenir shopping", "2027-01-29", "16:00", "18:30", "Feira Hippie de Ipanema", -22.9845, -43.1985],
  ["TRANSFER", "Taxi to the airport", "2027-01-31", "13:30", "14:30", "Copacabana Palace", -22.967, -43.1786],
];
await prisma.scheduleItem.createMany({
  data: PLANS.map(([kind, title, date, start, end, placeName, lat, lng, notes]) => ({
    tripId, kind, title,
    startAt: start === "allday" ? at(date) : at(date, start),
    endAt: start === "allday" || !end ? null : at(date, end),
    allDay: start === "allday",
    placeName, lat, lng, notes: notes ?? null,
  })),
});

// Repeating plans: Spanish classes in Cusco and morning runs in Rio.
const series = (kind, title, dates, start, end, placeName, lat, lng, notes) => {
  const seriesId = randomUUID();
  return prisma.scheduleItem.createMany({
    data: dates.map((date) => ({
      tripId, kind, title, startAt: at(date, start), endAt: at(date, end), seriesId, placeName, lat, lng, notes,
    })),
  });
};
await series("MEETUP", "Spanish class", ["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-09", "2026-11-10"], "08:30", "10:30", "Amauta Spanish School", -13.5183, -71.9746, "Bring the workbook. Homework due Monday.");
await series("OTHER", "Morning run on the beach", ["2027-01-10", "2027-01-12", "2027-01-14", "2027-01-16", "2027-01-18"], "06:30", "07:15", "Ipanema promenade", -22.9868, -43.2049, null);

// ---------------------------------------------------------------------------------------------------------------
// Money spent so far on the ground, in USD (the app has no local South American currencies yet).
const SPENT = [
  ["Airport taxi", "TAXI", 28, "2026-11-01", tom],
  ["Groceries and water", "GROCERIES", 34.5, "2026-11-01", alex],
  ["SIM cards", "PHONE", 27, "2026-11-02", sam],
  ["Lunch in Miraflores", "FOOD", 41.2, "2026-11-02", tom],
  ["Pisco sours", "LIQUOR", 24, "2026-11-02", alex],
  ["Uber to Barranco", "TAXI", 9.4, "2026-11-03", sam],
  ["Chifa dinner", "FOOD", 52.8, "2026-11-03", tom],
  ["Altitude pills", "MEDICAL", 18, "2026-11-04", sam],
  ["Coca tea and snacks", "FOOD", 11.5, "2026-11-04", alex],
  ["Boleto Turístico", "ACTIVITY", 120, "2026-11-05", tom],
  ["Alpaca sweaters", "CLOTHING", 96, "2026-11-06", alex, [alex]],
  ["Market lunch", "FOOD", 15.6, "2026-11-06", sam],
  ["Laundry", "HOUSEHOLD", 9, "2026-11-07", tom],
  ["Dinner at Pachapapa", "FOOD", 74.3, "2026-11-07", alex],
];
for (const [title, category, amount, date, paidBy, split] of SPENT) {
  await expense({ title, category, amount, date, paidBy, phase: "ACTUAL", split });
}
// Alex paid Tom back for part of the flights.
await expense({ title: "Alex → Tom", category: "SETTLEMENT", amount: 400, date: "2026-11-03", paidBy: alex, phase: "ACTUAL", split: [tom] });

// Travel insurance for the whole trip.
const policyCost = await expense({ title: "SafetyWing Nomad Insurance", category: "INSURANCE", amount: 486, date: "2026-11-01" });
await prisma.insurancePolicy.create({
  data: {
    tripId, userId: tom.id, provider: "SafetyWing", type: "Travel medical", policyNumber: "SW-2026-448102",
    startDate: day("2026-11-01"), endDate: day("2027-02-01"), notes: "Covers all three of us. Adventure sports add-on included.",
    expenseId: policyCost.id,
  },
});

// A budget table for comparing Patagonia options.
await prisma.budgetTable.create({
  data: {
    tripId, title: "Patagonia trek options", kind: "CUSTOM", currency: "USD", sortOrder: 0,
    rows: {
      create: [
        { label: "W trek, refugios with meals", amount: 1140, note: "Booked", startDate: day("2026-12-16"), endDate: day("2026-12-20"), sortOrder: 0 },
        { label: "W trek, camping", amount: 520, note: "Carry tents and food", startDate: day("2026-12-16"), endDate: day("2026-12-20"), sortOrder: 1 },
        { label: "O circuit, 8 days", amount: 1690, note: "Needs two extra days", startDate: day("2026-12-15"), endDate: day("2026-12-22"), sortOrder: 2 },
      ],
    },
  },
});

const counts = await Promise.all([
  prisma.destination.count({ where: { tripId } }),
  prisma.flight.count({ where: { tripId } }),
  prisma.stay.count({ where: { tripId } }),
  prisma.activity.count({ where: { destination: { tripId } } }),
  prisma.scheduleItem.count({ where: { tripId } }),
  prisma.expense.count({ where: { tripId } }),
]);
console.log(
  `Created "${trip.name}" (${tripId}): ${counts[0]} destinations, ${counts[1]} flights, ${counts[2]} stays, ` +
    `${counts[3]} activities, ${counts[4]} plans, ${counts[5]} expenses.`,
);
await prisma.$disconnect();
