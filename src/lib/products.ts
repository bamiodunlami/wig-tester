// Product catalog. Every product currently reuses the hero photo shoot as
// placeholder imagery — swap in each wig's own photos and regenerate its
// overlay with `node scripts/build-overlay.mjs` once they are available.

export type Point = [x: number, y: number];

export type OverlayAnchors = {
  width: number;
  height: number;
  leftEye: Point;
  rightEye: Point;
  forehead: Point;
  chin: Point;
};

export type Wig = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  badge?: string;
  description: string;
  length: string;
  texture: string;
  lace: string;
  density: string;
  colors: string[];
  capSizes: string[];
  images: { src: string; alt: string }[];
  /** Transparent hair cut-out for the instant try-on, plus where the eyes sit on it. */
  overlay: { src: string; anchors: OverlayAnchors };
  /** Front-facing photo sent to the AI model as the style reference. */
  aiReference: string;
  /** Extra description of the style for the AI model. */
  aiStyle: string;
};

const shoot = {
  front: { src: "/hero/front.jpg", alt: "Model wearing the wig, front view" },
  threeQuarterLeft: { src: "/hero/three-quarter-left.jpg", alt: "Model wearing the wig, three-quarter view" },
  threeQuarterRight: { src: "/hero/three-quarter-right.jpg", alt: "Model wearing the wig, turned to the side" },
  profileLeft: { src: "/hero/profile-left.jpg", alt: "Side profile showing the wig's length" },
  profileRight: { src: "/hero/profile-right.jpg", alt: "Side profile showing the wig's waves" },
  topDown: { src: "/hero/top-down.jpg", alt: "View from above showing the parting and lace" },
};

const bodyWaveOverlay = {
  src: "/wigs/body-wave-overlay.png",
  anchors: {
    width: 768,
    height: 1376,
    leftEye: [292, 381],
    rightEye: [475, 380],
    forehead: [381, 274],
    chin: [387, 603],
  },
} satisfies Wig["overlay"];

const capSizes = ['Small (21")', 'Medium (22.5")', 'Large (23.5")'];

export const products: Wig[] = [
  {
    slug: "signature-body-wave-26",
    name: "Signature Body Wave",
    price: 289,
    compareAt: 340,
    badge: "Best seller",
    description:
      "Soft, glossy body waves with a natural middle part. Pre-plucked HD lace melts into every skin tone for an undetectable hairline.",
    length: '26"',
    texture: "Body wave",
    lace: "13×4 HD lace front",
    density: "180%",
    colors: ["Natural black", "Dark brown"],
    capSizes,
    images: [shoot.front, shoot.threeQuarterLeft, shoot.profileRight, shoot.topDown],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "26-inch natural black body wave lace front wig with a middle part",
  },
  {
    slug: "loose-wave-hd-24",
    name: "Loose Wave HD Lace",
    price: 259,
    badge: "New",
    description: "Relaxed, bouncy waves that hold their shape all day. Lightweight cap for comfortable everyday wear.",
    length: '24"',
    texture: "Loose wave",
    lace: "13×4 HD lace front",
    density: "180%",
    colors: ["Natural black"],
    capSizes,
    images: [shoot.threeQuarterLeft, shoot.front, shoot.profileLeft, shoot.topDown],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "24-inch natural black loose wave lace front wig with a middle part",
  },
  {
    slug: "glueless-wave-22",
    name: "Glueless Wear & Go",
    price: 229,
    description: "Pre-cut lace and an adjustable band so you can put it on in minutes — no glue, no fuss.",
    length: '22"',
    texture: "Body wave",
    lace: "5×5 glueless closure",
    density: "150%",
    colors: ["Natural black", "Dark brown"],
    capSizes,
    images: [shoot.threeQuarterRight, shoot.front, shoot.profileRight, shoot.topDown],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "22-inch natural black glueless body wave wig with a middle part",
  },
  {
    slug: "middle-part-wave-28",
    name: "Statement Wave",
    price: 319,
    badge: "Limited",
    description:
      "Extra length and full volume for a red-carpet finish. Hand-tied parting that looks like it grows from your scalp.",
    length: '28"',
    texture: "Body wave",
    lace: "13×6 HD lace front",
    density: "200%",
    colors: ["Natural black"],
    capSizes,
    images: [shoot.profileRight, shoot.front, shoot.threeQuarterLeft, shoot.topDown],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "28-inch voluminous natural black body wave lace front wig with a middle part",
  },
  {
    slug: "everyday-wave-20",
    name: "Everyday Wave",
    price: 199,
    description: "A shoulder-grazing wave that's easy to style and easy to live in. The perfect first wig.",
    length: '20"',
    texture: "Body wave",
    lace: "4×4 lace closure",
    density: "150%",
    colors: ["Natural black", "Dark brown"],
    capSizes,
    images: [shoot.topDown, shoot.front, shoot.threeQuarterRight, shoot.profileLeft],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "20-inch natural black body wave wig with a middle part",
  },
  {
    slug: "luxe-wave-30",
    name: "Luxe Wave 30",
    price: 359,
    description: "Our longest wave, made from single-donor hair for unmatched softness and shine.",
    length: '30"',
    texture: "Body wave",
    lace: "13×4 HD lace front",
    density: "200%",
    colors: ["Natural black"],
    capSizes,
    images: [shoot.profileLeft, shoot.front, shoot.threeQuarterRight, shoot.topDown],
    overlay: bodyWaveOverlay,
    aiReference: shoot.front.src,
    aiStyle: "30-inch natural black body wave lace front wig with a middle part",
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}
