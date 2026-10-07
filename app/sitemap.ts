import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.APP_URL?.replace(/\/$/, "") || "https://vemogestao.com";
  return [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/termos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
