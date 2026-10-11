import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CampusImage from "@/components/CampusImage";

export const metadata: Metadata = {
  title: "Campus Gallery",
  description: "A visual tour of the AIMT campus — academic blocks, entrance, and gardens.",
};

const GALLERY_IMAGES = [
  {
    src: "/images/aimt-campus-main.jpg",
    alt: "Aerial view of the AIMT main academic block, Lucknow",
    caption: "Main Academic Block",
  },
  {
    src: "/images/aimt-campus-reception.jpg",
    alt: "Reception lobby at AIMT Lucknow with the college shield",
    caption: "Reception Lobby",
  },
  {
    src: "/images/aimt-campus-hostel.jpg",
    alt: "Student hostel building at AIMT Lucknow",
    caption: "Student Hostel",
  },
  {
    src: "/images/aimt-campus-library.jpg",
    alt: "Central library stack area at AIMT Lucknow",
    caption: "Central Library",
  },
  {
    src: "/images/aimt-campus-computer-lab.jpg",
    alt: "Students working in the computer laboratory at AIMT Lucknow",
    caption: "Computer Laboratory",
  },
  {
    src: "/images/aimt-campus-classroom.jpg",
    alt: "Lecture classroom session at AIMT Lucknow",
    caption: "Lecture Classroom",
  },
  {
    src: "/images/aimt-campus-cnc-lab.jpg",
    alt: "CNC and advanced manufacturing training lab at AIMT Lucknow",
    caption: "CNC Training Lab",
  },
  {
    src: "/images/aimt-campus-robotics-lab.jpg",
    alt: "Robotics lab with industrial robotic arm at AIMT Lucknow",
    caption: "Robotics Lab",
  },
  {
    src: "/images/aimt-campus-canteen.jpg",
    alt: "Campus canteen building at AIMT Lucknow",
    caption: "Campus Canteen",
  },
];

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-4xl font-extrabold text-white">Campus Gallery</h1>
          <p className="mt-3 max-w-3xl text-white/75">
            A visual tour of the Ambalika Institute of Management and Technology campus in
            Lucknow.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {GALLERY_IMAGES.map(({ src, alt, caption }) => (
            <CampusImage
              key={src}
              src={src}
              alt={alt}
              caption={caption}
              className="w-full overflow-hidden rounded-2xl shadow-md transition hover:shadow-xl"
              imgClassName="aspect-video w-full object-cover"
              overlay
            />
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
