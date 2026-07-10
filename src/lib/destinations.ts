export type Destination = {
  slug: string;
  title: string;
  tagline: string;
  hero: string;
  about: string;
  attractions: { name: string; image?: string }[];
  packages: { title: string; slug: string; duration: string; price: string }[];
  services: { name: string; slug: string; desc: string }[];
  howToReach: { mode: string; detail: string; icon: string }[];
  bestTime: string;
  faqs: { q: string; a: string }[];
};

export const destinations: Destination[] = [
  {
    slug: "jaipur",
    title: "Jaipur — The Pink City",
    tagline: "Explore the majestic capital of Rajasthan",
    hero: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80",
    about: "Jaipur, the capital of Rajasthan, is a vibrant blend of ancient heritage and modern charm. Founded in 1727 by Maharaja Sawai Jai Singh II, the city is famous for its distinctive pink-colored buildings, majestic forts, and bustling bazaars. Known as the Pink City, Jaipur is part of India's iconic Golden Triangle and offers visitors a rich experience of Rajput architecture, colorful culture, and warm hospitality.",
    attractions: [
      { name: "Amer Fort" },
      { name: "Hawa Mahal" },
      { name: "City Palace" },
      { name: "Jantar Mantar" },
      { name: "Jal Mahal" },
      { name: "Birla Temple" },
    ],
    packages: [
      { title: "Jaipur Same Day Tour", slug: "jaipur-same-day-tour", duration: "1 Day", price: "₹1,800" },
      { title: "Golden Triangle Tour", slug: "golden-triangle-tour", duration: "4 Days", price: "₹12,500" },
      { title: "Rajasthan Heritage Tour", slug: "rajasthan-heritage-tour", duration: "7 Days", price: "₹22,000" },
    ],
    services: [
      { name: "Local Darshan Cab", slug: "local", desc: "Hourly rental packages to explore Jaipur at your own pace" },
      { name: "Airport Transfer", slug: "airport", desc: "Fixed-price pickup and drop at Jaipur International Airport" },
      { name: "Outstation Cab", slug: "outstation", desc: "Intercity travel from Jaipur to Delhi, Agra, Udaipur and more" },
    ],
    howToReach: [
      { mode: "By Air", detail: "Jaipur International Airport (JAI) connects to all major Indian cities with daily flights from Delhi, Mumbai, Bangalore, and more.", icon: "Plane" },
      { mode: "By Train", detail: "Jaipur Junction railway station is well-connected with superfast and express trains from Delhi (5 hrs), Mumbai (14 hrs), and other cities.", icon: "Train" },
      { mode: "By Road", detail: "NH-48 connects Jaipur to Delhi (280 km, 5 hrs). Regular state bus and private AC bus services operate daily.", icon: "Bus" },
    ],
    bestTime: "October to March (winter). The weather is pleasant with temperatures between 10-25°C, ideal for sightseeing. Avoid summer months (April-June) when temperatures can exceed 45°C.",
    faqs: [
      { q: "What is Jaipur famous for?", a: "Jaipur is famous for its Amer Fort, Hawa Mahal, City Palace, vibrant bazaars, and as the gateway to Rajasthan tourism." },
      { q: "How many days are enough for Jaipur?", a: "2-3 days are sufficient to cover the main attractions including Amer Fort, City Palace, Hawa Mahal, and local markets." },
    ],
  },
  {
    slug: "udaipur",
    title: "Udaipur — City of Lakes",
    tagline: "The Venice of the East",
    hero: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=1200&auto=format&fit=crop&q=80",
    about: "Udaipur, formerly the capital of the Mewar Kingdom, is a city in the western Indian state of Rajasthan. Set around a series of artificial lakes and known for its lavish royal residences, Udaipur is often called the 'Venice of the East' and is one of India's most romantic destinations. The city's beautiful palaces, serene lakes, and rich cultural heritage make it a must-visit destination.",
    attractions: [
      { name: "City Palace" },
      { name: "Lake Pichola" },
      { name: "Jag Mandir" },
      { name: "Saheliyon-ki-Bari" },
      { name: "Fateh Sagar Lake" },
      { name: "Sajjangarh Monsoon Palace" },
    ],
    packages: [
      { title: "Rajasthan Heritage Tour", slug: "rajasthan-heritage-tour", duration: "7 Days", price: "₹22,000" },
      { title: "Golden Triangle Tour", slug: "golden-triangle-tour", duration: "4 Days", price: "₹12,500" },
    ],
    services: [
      { name: "Local Darshan Cab", slug: "local", desc: "Explore Udaipur's lakes and palaces at your own pace" },
      { name: "Airport Transfer", slug: "airport", desc: "Fixed-price transfers from Maharana Pratap Airport" },
      { name: "Outstation Cab", slug: "outstation", desc: "Intercity travel from Udaipur to Jaipur, Jodhpur and more" },
    ],
    howToReach: [
      { mode: "By Air", detail: "Maharana Pratap Airport (UDR) is 22 km from city center. Direct flights from Delhi, Mumbai, and other major cities.", icon: "Plane" },
      { mode: "By Train", detail: "Udaipur City railway station is connected to Delhi, Mumbai, Jaipur, and other major cities with express trains.", icon: "Train" },
      { mode: "By Road", detail: "Well-connected by road to Jaipur (400 km), Jodhpur (260 km), and Ahmedabad (260 km). Regular bus services available.", icon: "Bus" },
    ],
    bestTime: "October to March is the best time. Pleasant weather with temperatures 12-28°C. The monsoon (July-September) adds to the beauty of the lakes.",
    faqs: [
      { q: "What is Udaipur known for?", a: "Udaipur is known for its beautiful lakes, royal palaces including the City Palace, and romantic ambiance. It's a popular destination for weddings and honeymoons." },
      { q: "Is Udaipur worth visiting?", a: "Absolutely. Udaipur's stunning lake views, magnificent palaces, and rich culture make it one of India's most beautiful cities." },
    ],
  },
  {
    slug: "jaisalmer",
    title: "Jaisalmer — The Golden City",
    tagline: "Experience the heart of the Thar Desert",
    hero: "https://images.unsplash.com/photo-1524650359799-842906ca1c06?w=1200&auto=format&fit=crop&q=80",
    about: "Jaisalmer, known as the Golden City, rises from the heart of the Thar Desert like a golden mirage. Founded in 1156 AD by Rawal Jaisal, the city is famous for its yellow sandstone architecture, magnificent fort, and vibrant desert culture. From camel safaris on sand dunes to starlit desert camps, Jaisalmer offers an unforgettable desert experience.",
    attractions: [
      { name: "Jaisalmer Fort" },
      { name: "Sam Sand Dunes" },
      { name: "Patwon Ki Haveli" },
      { name: "Gadisar Lake" },
      { name: "Salim Singh Ki Haveli" },
      { name: "Desert National Park" },
    ],
    packages: [
      { title: "Desert Safari Special", slug: "desert-safari-special", duration: "5 Days", price: "₹16,800" },
    ],
    services: [
      { name: "Local Darshan Cab", slug: "local", desc: "Explore Jaisalmer Fort and havelis comfortably" },
      { name: "Outstation Cab", slug: "outstation", desc: "Travel from Jaisalmer to Jodhpur, Bikaner and other cities" },
    ],
    howToReach: [
      { mode: "By Air", detail: "Jaisalmer Airport has limited connectivity. The nearest major airport is Jodhpur (330 km). Alternatively, fly to Jaipur and drive.", icon: "Plane" },
      { mode: "By Train", detail: "Jaisalmer railway station is connected to Delhi, Jaipur, and Jodhpur with express trains including the famous Palace on Wheels.", icon: "Train" },
      { mode: "By Road", detail: "State highways connect Jaisalmer to Jodhpur (330 km, 5 hrs), Bikaner (330 km, 5 hrs), and Jaipur (640 km, 9 hrs).", icon: "Bus" },
    ],
    bestTime: "October to February (winter). Temperatures range 5-25°C, perfect for desert activities. Avoid summer (April-September) when temperatures exceed 45°C.",
    faqs: [
      { q: "What is the best time to visit Jaisalmer?", a: "Winter months (October to February) offer pleasant weather for sightseeing and desert camping. The Jaisalmer Desert Festival in February is a highlight." },
      { q: "How many days are enough for Jaisalmer?", a: "2-3 days are ideal — one day for the fort and havelis, one day for the desert safari and Sam Sand Dunes, and one day for nearby attractions." },
    ],
  },
  {
    slug: "jodhpur",
    title: "Jodhpur — The Blue City",
    tagline: "Where every street tells a story",
    hero: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80",
    about: "Jodhpur, the second-largest city in Rajasthan, is famously called the Blue City for the indigo-painted houses surrounding the mighty Mehrangarh Fort. Founded in 1459 by Rao Jodha, the city offers a perfect blend of majestic architecture, rich history, and vibrant markets. The imposing Mehrangarh Fort, one of India's largest forts, towers over the city with stunning views.",
    attractions: [
      { name: "Mehrangarh Fort" },
      { name: "Jaswant Thada" },
      { name: "Umaid Bhawan Palace" },
      { name: "Clock Tower & Sardar Market" },
      { name: "Blue City Walk" },
      { name: "Mandore Gardens" },
    ],
    packages: [
      { title: "Rajasthan Heritage Tour", slug: "rajasthan-heritage-tour", duration: "7 Days", price: "₹22,000" },
      { title: "Desert Safari Special", slug: "desert-safari-special", duration: "5 Days", price: "₹16,800" },
    ],
    services: [
      { name: "Local Darshan Cab", slug: "local", desc: "Explore Mehrangarh Fort and blue city lanes comfortably" },
      { name: "Airport Transfer", slug: "airport", desc: "Fixed-price transfers from Jodhpur Airport" },
      { name: "Outstation Cab", slug: "outstation", desc: "Travel from Jodhpur to Jaisalmer, Udaipur and other cities" },
    ],
    howToReach: [
      { mode: "By Air", detail: "Jodhpur Airport (JDH) connects to Delhi, Mumbai, Jaipur, and other major cities with daily flights.", icon: "Plane" },
      { mode: "By Train", detail: "Jodhpur Junction is a major railway hub with direct trains to Delhi, Mumbai, Jaipur, Kolkata, and Bangalore.", icon: "Train" },
      { mode: "By Road", detail: "Well-connected by NH-62 and NH-112 to Jaipur (350 km), Jaisalmer (330 km), and Udaipur (260 km).", icon: "Bus" },
    ],
    bestTime: "October to March. Pleasant winter weather with temperatures 10-27°C. Ideal for fort visits and city walks.",
    faqs: [
      { q: "Why is Jodhpur called the Blue City?", a: "The Brahmin community traditionally painted their houses blue to signify their caste and keep the houses cool. This gave the old city its distinctive blue hue." },
      { q: "How much time is needed for Jodhpur?", a: "1-2 days is sufficient. Day 1 for Mehrangarh Fort, Jaswant Thada, and Umaid Bhawan. Day 2 for the Blue City walk and markets." },
    ],
  },
];

export function getDestinationBySlug(slug: string) {
  return destinations.find((d) => d.slug === slug) || null;
}
