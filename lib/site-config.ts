export const siteConfig = {
  name: "Birthday Hero Book",
  domain: "birthdayherobook.com",
  contactEmail: "hello@birthdayherobook.com",
  foundingDeadline: "21 July at midnight",
  foundingDeadlineISO: "2026-07-21T22:59:59Z",
  deliveryTime: "within five working days",
  checkoutUrls: {
    standardCheckoutUrl: "/personalise?package=standard&demo=1",
    deluxeCheckoutUrl: "/personalise?package=deluxe&demo=1",
    familyCheckoutUrl: "/personalise?package=family&demo=1",
  },
  packages: [
    {
      id: "standard",
      name: "Standard",
      price: 49,
      description: "A beautiful, complete birthday adventure made for one child.",
      features: [
        "12-page personalised illustrated digital storybook",
        "Child’s name, age, appearance and interests included",
        "Choice of three adventure themes",
        "Printable high-resolution PDF",
        "Delivered within five working days",
      ],
    },
    {
      id: "deluxe",
      name: "Deluxe",
      price: 79,
      badge: "Most Popular",
      description: "The fuller birthday moment—with extras made for the big day.",
      features: [
        "Extended 20-page personalised story",
        "Everything included in Standard",
        "Personalised printable birthday card",
        "Three personalised phone wallpapers",
        "Short animated book-reveal video",
      ],
    },
    {
      id: "family",
      name: "Family Edition",
      price: 119,
      description: "A shared adventure for siblings, twins or joint birthdays.",
      features: [
        "Two personalised books, or one story featuring two siblings",
        "All Deluxe bonuses",
        "Made for siblings, twins or joint birthdays",
        "Printable high-resolution PDF",
        "Delivered within five working days",
      ],
    },
  ],
  themes: [
    {
      id: "dinosaur",
      name: "Dinosaur Birthday Adventure",
      shortName: "Dinosaur Adventure",
      description: "A stompingly brilliant journey through fern forests, secret valleys and a prehistoric birthday surprise.",
      example: "Amelia and the Great Dinosaur Birthday",
      image: "/illustrations/adventure-dinosaur.png",
      imageAlt: "A young girl hero meeting a friendly birthday dinosaur in a golden prehistoric valley",
    },
    {
      id: "space",
      name: "Magical Space Adventure",
      shortName: "Space Adventure",
      description: "A star-sailing mission past friendly planets to light the candles on the Birthday Moon.",
      example: "Leo’s Magical Mission to the Birthday Moon",
      image: "/illustrations/adventure-space.png",
      imageAlt: "A young space hero racing along a trail of starlight toward the Birthday Moon",
    },
    {
      id: "mystery",
      name: "The Birthday Mystery",
      shortName: "Birthday Mystery",
      description: "Clues, hidden doors and one very important missing cake—solved by the birthday detective.",
      example: "Maya and the Mystery of the Missing Wish",
      image: "/illustrations/adventure-mystery.png",
      imageAlt: "A young detective hero following golden clues through a candlelit library with a ginger cat",
    },
  ],
} as const;

export type PackageId = (typeof siteConfig.packages)[number]["id"];
export type ThemeId = (typeof siteConfig.themes)[number]["id"];

export const faqs = [
  ["What information do I need to provide?", "You’ll be asked for the child’s first name, age, general appearance, favourite interests and chosen adventure. Family members and pets can also be included."],
  ["Do I need to upload a photograph?", "No. A photograph is optional. You can provide a written description instead."],
  ["When will the book arrive?", "Your finished digital book will be delivered by email within five working days."],
  ["Is it a physical book?", "The founding product is a high-resolution digital PDF, ready to read on a device or print. Physical editions may be added later."],
  ["Can siblings appear together?", "Yes. Choose the Family Edition for a story featuring two children, or for two separate personalised books."],
  ["Can I request corrections?", "Yes. If we made an error in a name or personalisation detail, we’ll make reasonable corrections."],
  ["What ages is it suitable for?", "Our launch stories are designed for children approximately 3–10 years old."],
  ["How are children’s photographs handled?", "Photographs are optional and used only to create the purchased product. Please see the privacy policy for full details."],
] as const;
