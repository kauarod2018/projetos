import { BriefcaseBusiness, ChartNoAxesCombined, Landmark, Newspaper, Sparkles, Wrench } from "lucide-react";

import { WorkspaceShell } from "@/components/workspace-shell";
import styles from "@/components/news-workspace.module.css";

const topics = [
  { title: "MEI e formalização", description: "Mudanças, prazos e orientações para quem empreende.", icon: Landmark, color: "lavender" },
  { title: "Gestão e finanças", description: "Ideias práticas para cuidar do dinheiro e do negócio.", icon: ChartNoAxesCombined, color: "mint" },
  { title: "Trabalho e mercado", description: "Tendências e oportunidades para profissionais autônomos.", icon: BriefcaseBusiness, color: "cyan" },
  { title: "Ferramentas e tecnologia", description: "Recursos que podem facilitar o trabalho do dia a dia.", icon: Wrench, color: "amber" },
];

export default function NewsPage() {
  return (
    <WorkspaceShell>
      <main className={`mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-7 sm:px-6 lg:px-8 ${styles.newsPage}`}>
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>JORNAL VEMO</p>
          <h1>Informação útil para o seu trabalho</h1>
          <p>Notícias, mudanças e ideias para quem vive do próprio trabalho.</p>
        </header>

        <section className={styles.feature} aria-labelledby="news-coming-heading">
          <div className={styles.featureCopy}>
            <p className={styles.kicker}><span aria-hidden="true" /> EDIÇÃO EM PREPARAÇÃO</p>
            <h2 id="news-coming-heading">Estamos preparando a redação.</h2>
            <p>Em breve, o Jornal Vemo vai reunir conteúdos relevantes para ajudar você a acompanhar o que acontece no universo de quem trabalha por conta própria.</p>
            <div className={styles.comingSoon} role="status"><Sparkles size={16} aria-hidden="true" /> Conteúdo em breve</div>
          </div>
          <div className={styles.featureArt} aria-hidden="true">
            <div className={styles.paper}><Newspaper /><span /><span /><span /><i /></div>
            <div className={styles.signal}>
              <span className={styles.signalCyan} />
              <span className={styles.signalBlue} />
              <span className={styles.signalMint} />
            </div>
          </div>
        </section>

        <section className={styles.topicsSection} aria-labelledby="news-topics-heading">
          <div className={styles.topicsHeading}>
            <div><p className={styles.eyebrow}>NO RADAR</p><h2 id="news-topics-heading">Temas para o seu dia a dia</h2></div>
            <p>Informação prática, selecionada para profissionais autônomos e pequenos negócios.</p>
          </div>
          <ul className={styles.topicList}>
            {topics.map(({ title, description, icon: Icon, color }) => (
              <li key={title}>
                <span className={`${styles.topicIcon} ${styles[color]}`}><Icon size={19} aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </WorkspaceShell>
  );
}
