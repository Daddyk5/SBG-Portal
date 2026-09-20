/**
 * Gallery photos, shown on /gallery (and a few on the home page).
 *
 * To add a photo: put the file in /public/gallery, then add an entry here.
 * See docs/content-guide.md. Kept in code (not the database) because there is no
 * gallery admin screen yet.
 */
export type GalleryItem = {
  src: string; // path under /public, e.g. "/gallery/gallery-01.jpg"
  alt: string; // describes the photo for screen readers — say what is visible
  caption?: string;
  width: number;
  height: number;
};

export const GALLERY: GalleryItem[] = [
  {
    src: "/gallery/gallery-02.jpg",
    alt: "Two young girls practising a seated guard position on gray training mats while other students move in the background.",
    caption: "Youth training",
    width: 1440,
    height: 810,
  },
  {
    src: "/gallery/gallery-09.jpg",
    alt: "A coach in a black gi and brown belt presents a Saved By Grace certificate to a smiling student in front of a Tom DeBlass Jiu-Jitsu banner.",
    caption: "Certificate presentation",
    width: 1440,
    height: 1440,
  },
  {
    src: "/gallery/gallery-01.jpg",
    alt: "A large group of students and coaches posing on blue mats, above four photos of partners drilling grappling techniques.",
    caption: "Team photo and drilling",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-03.jpg",
    alt: "Two group photos of students and coaches in gis and rash guards, seated and standing in front of a Saved By Grace banner.",
    caption: "Group photos after class",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-04.jpg",
    alt: "Kids and adults kneeling together on blue mats, above four photos of partners practising grappling drills.",
    caption: "Kids and adults training together",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-05.jpg",
    alt: "A smiling group of students in gis and rash guards, above three photos of drilling in front of Tom DeBlass Jiu-Jitsu banners.",
    caption: "Class photo and technique practice",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-06.jpg",
    alt: "A close group selfie of smiling students and a coach, above three photos of grappling drills in a bright room.",
    caption: "Good times at training",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-07.jpg",
    alt: "A big group posing on blue mats, above four photos of coaches demonstrating standing and ground techniques.",
    caption: "Technique demonstrations",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-08.jpg",
    alt: "A group selfie of students and coaches, above three photos of students practising a floor movement drill.",
    caption: "Warm-ups and movement drills",
    width: 1440,
    height: 1152,
  },
  {
    src: "/gallery/gallery-10.jpg",
    alt: "A group of students on blue mats, above four photos of an instructor demonstrating ground techniques to a seated class.",
    caption: "Instructor demonstration",
    width: 1440,
    height: 1152,
  },
];
