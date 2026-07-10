import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aradhana Travel Service",
    short_name: "Aradhana Travel",
    description: "Book premium cabs, tour packages, and airport transfers in Rajasthan with Aradhana Travel.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b91c1c",
    icons: [
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
