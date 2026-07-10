export type TourPackage = {
  slug: string;
  title: string;
  duration: string;
  nights: string;
  places: string;
  price: string;
  pricePerPerson: string;
  rating: number;
  reviews: number;
  desc: string;
  longDesc: string;
  image: string;
  includes: string[];
  excludes: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
  faqs: { q: string; a: string }[];
};

export const tourPackages: TourPackage[] = [
  {
    slug: "golden-triangle-tour",
    title: "Golden Triangle Tour",
    duration: "4 Days / 3 Nights",
    nights: "3",
    places: "Delhi - Agra - Jaipur",
    price: "₹12,500",
    pricePerPerson: "₹12,500",
    rating: 4.8,
    reviews: 127,
    desc: "Experience the rich heritage of India covering the capital, the Taj Mahal, and the Pink City.",
    longDesc: "The Golden Triangle is India's most iconic tourist circuit, connecting three of its most vibrant cities — Delhi, Agra, and Jaipur. This 4-day journey takes you through millennia of history, from Mughal architecture to Rajput grandeur, all while traveling in comfort with Aradhana Travel.",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&auto=format&fit=crop&q=60",
    includes: ["Hotel accommodation (3-star)", "Daily breakfast", "Private AC cab for all transfers & sightseeing", "Professional English-speaking driver", "Toll tax, parking, state tax included"],
    excludes: ["Flight or train tickets", "Entry fees to monuments", "Lunch and dinner", "Guide charges", "Personal expenses"],
    itinerary: [
      { day: 1, title: "Delhi Arrival", activities: ["Arrive at Delhi airport/railway station", "Meet our driver and transfer to hotel", "Evening leisure / optional Delhi city tour", "Overnight stay in Delhi"] },
      { day: 2, title: "Delhi → Agra (240 km / 4 hrs)", activities: ["Morning drive to Agra", "Check-in hotel and freshen up", "Visit Taj Mahal (sunset view)", "Explore Agra Fort", "Overnight stay in Agra"] },
      { day: 3, title: "Agra → Jaipur (240 km / 4 hrs)", activities: ["Morning drive to Jaipur via Fatehpur Sikri", "Visit the abandoned Mughal city", "Continue drive to Jaipur", "Evening check-in hotel", "Overnight stay in Jaipur"] },
      { day: 4, title: "Jaipur Sightseeing → Departure", activities: ["Morning visit Amer Fort (Jeep ride)", "Visit City Palace & Hawa Mahal", "Explore Jantar Mantar", "Evening drop at Jaipur airport/station", "Tour ends"] },
    ],
    faqs: [
      { q: "What is included in the tour price?", a: "The tour price includes hotel accommodation with daily breakfast, a private AC cab for all transfers and sightseeing, and a professional English-speaking driver. Entry fees to monuments are not included." },
      { q: "Can I customize the itinerary?", a: "Yes, we can customize the itinerary based on your preferences. Contact us for a personalized quote." },
    ],
  },
  {
    slug: "rajasthan-heritage-tour",
    title: "Rajasthan Heritage Tour",
    duration: "7 Days / 6 Nights",
    nights: "6",
    places: "Jaipur - Jodhpur - Udaipur",
    price: "₹22,000",
    pricePerPerson: "₹22,000",
    rating: 4.9,
    reviews: 89,
    desc: "A royal journey through the majestic forts of Jaipur, the blue alleys of Jodhpur, and the lakes of Udaipur.",
    longDesc: "Discover the royal heart of Rajasthan on this 7-day journey through three of its most captivating cities. From the pink-hued streets of Jaipur to the blue lanes of Jodhpur and the shimmering lakes of Udaipur, this tour immerses you in the grandeur of Rajput history and culture.",
    image: "https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=600&auto=format&fit=crop&q=60",
    includes: ["Hotel accommodation (3-star/4-star)", "Daily breakfast", "Private AC cab", "Professional driver", "All toll tax & parking", "State tax & permit fees"],
    excludes: ["Flight/train tickets", "Monument entry fees", "Meals other than breakfast", "Guide charges", "Camera fees at monuments"],
    itinerary: [
      { day: 1, title: "Jaipur Arrival", activities: ["Arrive at Jaipur airport/railway station", "Transfer to hotel and check-in", "Evening visit Hawa Mahal & local bazaar", "Overnight stay in Jaipur"] },
      { day: 2, title: "Jaipur Sightseeing", activities: ["Morning visit Amer Fort (elephant ride option)", "Visit City Palace & Jantar Mantar", "Afternoon visit Jal Mahal & Birla Temple", "Overnight stay in Jaipur"] },
      { day: 3, title: "Jaipur → Jodhpur (350 km / 5.5 hrs)", activities: ["Morning drive to Jodhpur", "En route visit Ajmer & Pushkar", "Continue drive to Jodhpur", "Evening check-in hotel", "Overnight stay in Jodhpur"] },
      { day: 4, title: "Jodhpur Sightseeing", activities: ["Morning visit Mehrangarh Fort", "Explore Jaswant Thada & Umaid Bhawan", "Walk through Blue City & clock tower market", "Overnight stay in Jodhpur"] },
      { day: 5, title: "Jodhpur → Udaipur (260 km / 5 hrs)", activities: ["Morning drive to Udaipur via Ranakpur", "Visit the famous Jain temple at Ranakpur", "Continue to Udaipur", "Evening check-in hotel", "Overnight stay in Udaipur"] },
      { day: 6, title: "Udaipur Sightseeing", activities: ["Morning visit City Palace & Jagdish Temple", "Boat ride on Lake Pichola", "Visit Saheliyon-ki-Bari & Fateh Sagar Lake", "Evening view from Sajjangarh Monsoon Palace", "Overnight stay in Udaipur"] },
      { day: 7, title: "Udaipur Departure", activities: ["Morning leisure / optional shopping", "Check-out and transfer to Udaipur airport/station", "Tour ends"] },
    ],
    faqs: [
      { q: "Is this tour suitable for families?", a: "Absolutely! This tour is perfect for families. The itinerary is paced comfortably with plenty of breaks and flexibility." },
    ],
  },
  {
    slug: "desert-safari-special",
    title: "Desert Safari Special",
    duration: "5 Days / 4 Nights",
    nights: "4",
    places: "Jodhpur - Jaisalmer - Bikaner",
    price: "₹16,800",
    pricePerPerson: "₹16,800",
    rating: 4.7,
    reviews: 64,
    desc: "Explore the golden sands of the Thar desert, camel safaris, and ancient desert forts.",
    longDesc: "Embark on a thrilling desert adventure through Rajasthan's most arid and fascinating region. From the blue city of Jodhpur to the golden ramparts of Jaisalmer, experience camel safaris, desert camps, starlit nights, and magnificent fortresses that rise from the sands.",
    image: "https://images.unsplash.com/photo-1524650359799-842906ca1c06?w=600&auto=format&fit=crop&q=60",
    includes: ["Hotel accommodation (3-star + desert camp)", "Daily breakfast & dinner", "Private AC cab", "Camel safari in Jaisalmer", "Desert camp with cultural program", "All toll tax & parking"],
    excludes: ["Flight/train tickets", "Monument entry fees", "Lunch meals", "Guide charges", "Personal expenses"],
    itinerary: [
      { day: 1, title: "Jodhpur Arrival", activities: ["Arrive at Jodhpur airport/station", "Transfer to hotel", "Visit Mehrangarh Fort & Jaswant Thada", "Evening walk through Sardar Market", "Overnight in Jodhpur"] },
      { day: 2, title: "Jodhpur → Jaisalmer (330 km / 5 hrs)", activities: ["Morning drive to Jaisalmer", "En route visit Khichan (crane sanctuary)", "Arrive in Jaisalmer, check-in", "Evening walk through Jaisalmer Fort", "Overnight in Jaisalmer"] },
      { day: 3, title: "Jaisalmer Sightseeing + Desert Safari", activities: ["Morning visit Patwon Ki Haveli & Gadisar Lake", "Afternoon drive to Sam Sand Dunes", "Camel safari at sunset", "Desert camp with dinner & folk dance", "Overnight at desert camp"] },
      { day: 4, title: "Jaisalmer → Bikaner (330 km / 5 hrs)", activities: ["Morning drive to Bikaner", "Visit Junagarh Fort", "Explore Karni Mata Temple (Rat Temple)", "Evening walk through old city", "Overnight in Bikaner"] },
      { day: 5, title: "Bikaner Departure", activities: ["Morning visit National Research Centre on Camel", "Check-out and transfer to Bikaner station/airport", "Tour ends"] },
    ],
    faqs: [
      { q: "What is the desert camp like?", a: "The desert camp includes comfortable Swiss tents with attached bathrooms, a cultural program with folk music and dance, dinner under the stars, and camel safari at sunset." },
    ],
  },
  {
    slug: "jaipur-same-day-tour",
    title: "Jaipur Same Day Tour",
    duration: "1 Day",
    nights: "0",
    places: "Jaipur Local Sightseeing",
    price: "₹1,800",
    pricePerPerson: "₹1,800",
    rating: 4.8,
    reviews: 203,
    desc: "A complete 8-hour / 80km package covering all major monuments in Jaipur with a private cab.",
    longDesc: "Perfect for travelers with limited time, this same-day Jaipur tour covers all major attractions in the Pink City. Visit the magnificent Amer Fort, the iconic Hawa Mahal, the royal City Palace, and more — all in the comfort of a private cab with a knowledgeable driver.",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&auto=format&fit=crop&q=60",
    includes: ["Private AC cab for 8 hours / 80 km", "Professional driver", "Bottled water", "Toll tax & parking", "Pickup & drop from your location"],
    excludes: ["Monument entry fees", "Guide charges", "Lunch", "Camera fees at monuments", "Extra km charges beyond 80 km"],
    itinerary: [
      { day: 1, title: "Jaipur City Tour", activities: ["9:00 AM — Pickup from your location", "10:00 AM — Visit Amer Fort (jeep ride)", "12:30 PM — Visit Jal Mahal (photo stop)", "1:00 PM — Lunch break", "2:00 PM — Visit City Palace & Jantar Mantar", "3:30 PM — Visit Hawa Mahal", "4:00 PM — Visit Birla Temple", "5:00 PM — Drop back at your location"] },
    ],
    faqs: [
      { q: "Can we extend the tour duration?", a: "Yes, extra hours and km can be added at standard rates. Please discuss with the driver." },
    ],
  },
  {
    slug: "wildlife-tour-package",
    title: "Wildlife Tour Package",
    duration: "3 Days / 2 Nights",
    nights: "2",
    places: "Jaipur - Ranthambore",
    price: "₹9,500",
    pricePerPerson: "₹9,500",
    rating: 4.6,
    reviews: 78,
    desc: "Thrilling tiger safaris in the famous Ranthambore National Park paired with a Jaipur city tour.",
    longDesc: "Combine the thrill of wildlife spotting with the cultural richness of Jaipur. This 3-day package includes tiger safaris in Ranthambore National Park — one of India's best places to see tigers in the wild — along with a guided tour of Jaipur's highlights.",
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=600&auto=format&fit=crop&q=60",
    includes: ["Hotel accommodation (2 nights)", "Daily breakfast & dinner", "Private AC cab for transfers", "2 jungle safaris in Ranthambore (gypsy)", "Naturalist guide for safaris", "All forest department fees & permits"],
    excludes: ["Flight/train tickets", "Lunch meals", "Jaipur monument entry fees", "Personal expenses", "Camera fees"],
    itinerary: [
      { day: 1, title: "Jaipur → Ranthambore (180 km / 3.5 hrs)", activities: ["Morning drive from Jaipur to Ranthambore", "Check-in at resort/hotel", "Afternoon jungle safari (Zone depends on availability)", "Evening leisure", "Overnight at Ranthambore"] },
      { day: 2, title: "Ranthambore Safari + Jaipur Return", activities: ["Early morning safari (6:00 AM)", "Breakfast at resort", "Visit Ranthambore Fort (optional)", "Afternoon drive back to Jaipur", "Evening check-in Jaipur hotel", "Overnight in Jaipur"] },
      { day: 3, title: "Jaipur Sightseeing + Departure", activities: ["Morning visit Amer Fort", "Visit City Palace & Hawa Mahal", "Afternoon drop at Jaipur airport/station", "Tour ends"] },
    ],
    faqs: [
      { q: "What are the chances of seeing a tiger?", a: "Ranthambore has one of the highest tiger sighting rates in India. During peak season (Oct-Apr), sightings are very common." },
    ],
  },
];

export function getTourPackageBySlug(slug: string) {
  return tourPackages.find((p) => p.slug === slug) || null;
}
