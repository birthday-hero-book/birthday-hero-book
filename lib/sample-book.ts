// The example book we publish at /sample-book. Every page of the source PDF is a
// flat image with its story text baked in, so that text can never be selected,
// indexed or read aloud — the alt copy below is the only description a
// non-sighted visitor gets, and every entry was written against the actual page.
//
// Pages live in public/sample-book at screen resolution only. The 300dpi
// print-ready original is deliberately never published: the book is view-only.

export type SampleBookPage = {
  /** 1-based page number as it appears in the book. */
  number: number;
  src: string;
  /** The page's own chapter heading, or its role in the front matter. */
  label: string;
  alt: string;
};

export const sampleBook = {
  title: "Maya and the Seven Birthday Lanterns",
  /** Which edition a buyer would receive if they ordered this exact book. */
  edition: "Standard",
  storyPageCount: 12,
  /** Intrinsic size of the exported page images, used to reserve layout space. */
  pageWidth: 998,
  pageHeight: 1400,
} as const;

const page = (number: number, label: string, alt: string): SampleBookPage => ({
  number,
  label,
  alt,
  src: `/sample-book/page-${String(number).padStart(2, "0")}.jpg`,
});

export const sampleBookPages: SampleBookPage[] = [
  page(1, "Cover",
    "Cover: Maya, a young girl with curly hair and teal glasses, stands in a flying blanket boat beside her curly-haired dog Pip, one hand on a brass telescope, as seven golden lanterns spiral away through a starry night sky. The title reads “Maya and the Seven Birthday Lanterns”."),
  page(2, "Title page",
    "Title page: a brass telescope and a glowing golden envelope rest on a star-patterned quilt, above the title and the line “A personalised Birthday Hero Book created especially for Maya”."),
  page(3, "Dedication",
    "Dedication page: Maya hugs Pip inside a cosy blanket fort, a cinnamon bun beside them. The message reads “For Maya — Happy 7th Birthday, Maya. Keep exploring and being wonderfully you. Love Mum, Dad, Leo and Grandma.” Maya is a character we invented and this dedication was written by us, not by a customer."),
  page(4, "The Night Before Seven",
    "The night before her birthday, Maya kneels in her rooftop blanket fort tilting a telescope towards the moon, Pip sniffing the air beside her, while through the window her family light candles on a cake and hang bunting. A small golden spark falls from the sky."),
  page(5, "Seven Lights Lost",
    "Maya leans over a golden envelope that has unfolded into a glowing map of the night sky, seven small lanterns marked along a winding path across it. Pip watches from the edge of the quilt."),
  page(6, "The Flying Blanket Boat",
    "The blanket fort has lifted into the air as a star-covered flying boat with a billowing red sail, carrying Maya and Pip above the rooftops. Below, her brother Leo reaches up as he throws his rust-red scarf to the mast."),
  page(7, "Through the Moonlit Clouds",
    "The little boat climbs high above the city towards a glowing archway opening in the clouds, trailing a ribbon of gold. Silver paper birds sweep alongside it."),
  page(8, "The Whispering Cloud Garden",
    "In a garden growing on soft blue clouds, Maya reaches up towards two lanterns tangled in silver vines among huge glowing moonflowers, while Pip bounds after her and paper birds circle overhead."),
  page(9, "The Comet Orchard",
    "In an orchard of glowing golden fruit, Maya dives along a spiralling red scarf she has looped into a slide, guiding two racing lanterns down into the waiting boat as Pip grips the far end of the scarf."),
  page(10, "The Whale in the Rainbow Rings",
    "Inside enormous rainbow rings, a young sky whale hangs tangled in fine silvery threads. Maya leans out of the boat to loosen the knots while Pip watches, and a moon-shaped key rises from the whale's spout."),
  page(11, "The Library of Lost Wishes",
    "A library floating among the stars, its shelves stretching into the dark. Maya turns a key in a tall golden cabinet where two fading lanterns sit under glass domes, Pip at her heels."),
  page(12, "Hush and the Last Lantern",
    "Among glittering crystals, Maya and Pip come upon Hush — a small charcoal-grey creature with long ears, wrapped in a starry cape — curled in a hollow holding the final lantern."),
  page(13, "A Light Shared",
    "Maya kneels and sets her cinnamon bun on the ground between herself and Hush, holding out an open hand. The last lantern blazes gold between them as Hush smiles and Pip leans in."),
  page(14, "The Lantern Parade Home",
    "The blanket boat sails home through a sunrise sky with all seven lanterns streaming behind it in a golden arc. Hush sits close beside Pip, paper birds dance alongside, and the sky whale glides overhead."),
  page(15, "Seven Bright Years",
    "At sunrise the whole family — Mum, Dad, Leo and Grandma Nia — gather with Maya, Pip and Hush in the rooftop blanket fort around a birthday cake with seven candles, the seven lanterns strung in a row above them."),
];
