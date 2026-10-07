import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.APP_URL?.replace(/\/$/, "") || "https://vemogestao.com";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/aprovar/", "/hoje", "/clientes", "/agenda", "/financas", "/orcamentos", "/novo-orcamento", "/servicos", "/funcionarios", "/configuracoes", "/meu-trabalho", "/atendimento", "/noticias", "/dashboard", "/home"] }], sitemap: `${origin}/sitemap.xml` };
}
