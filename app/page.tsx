import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowRight, BellRing, CalendarDays, Check, CircleDollarSign, ClipboardCheck, FileText, MessageCircle, ShieldCheck, Smartphone, Sparkles, Users, Wallet, Zap, Snowflake, Droplets, PaintRoller, HardHat, Hammer, SprayCan, Trees, Bug, Laptop, Cctv, KeyRound, Car, Camera } from "lucide-react";
import { VemoWordmark } from "@/components/vemo-brand";
import styles from "@/components/landing.module.css";

export const metadata: Metadata = {
  title: "Vemo | Gestão simples para quem presta serviços",
  description: "Clientes, orçamentos, agenda com WhatsApp e financeiro em um só lugar. Feito para eletricistas, técnicos, instaladores e pequenas equipes. Teste grátis por um mês, sem cartão.",
  openGraph: {
    title: "Vemo | Gestão simples para quem presta serviços",
    description: "Orçamentos, agenda e financeiro em um só lugar, com uma assistente que organiza o seu dia.",
    type: "website",
    locale: "pt_BR",
  },
};

const audiences = [
  { label: "Eletricistas", icon: Zap },
  { label: "Ar-condicionado e refrigeração", icon: Snowflake },
  { label: "Encanadores", icon: Droplets },
  { label: "Pintores", icon: PaintRoller },
  { label: "Reformas e construção", icon: HardHat },
  { label: "Marceneiros e montadores", icon: Hammer },
  { label: "Limpeza e diaristas", icon: SprayCan },
  { label: "Jardinagem e paisagismo", icon: Trees },
  { label: "Dedetização", icon: Bug },
  { label: "Conserto de celulares e eletrônicos", icon: Smartphone },
  { label: "Técnicos de informática", icon: Laptop },
  { label: "Câmeras e segurança", icon: Cctv },
  { label: "Chaveiros", icon: KeyRound },
  { label: "Mecânica e autoelétrica", icon: Car },
  { label: "Fotografia e eventos", icon: Camera },
];

const benefits = [
  { icon: FileText, tone: "blue", title: "Orçamentos profissionais", text: "Monte em minutos, com sua logo, e envie um link para o cliente aprovar pelo celular." },
  { icon: CalendarDays, tone: "violet", title: "Agenda sem conflito", text: "Veja a semana inteira, evite horários duplicados e distribua atendimentos na equipe." },
  { icon: MessageCircle, tone: "green", title: "WhatsApp a um toque", text: "Mensagens prontas para confirmar horário, lembrar o cliente ou avisar que está a caminho." },
  { icon: Wallet, tone: "amber", title: "Dinheiro organizado", text: "Saiba o que entrou, o que saiu e quem ainda falta pagar, sem planilha e sem termos difíceis." },
  { icon: ClipboardCheck, tone: "cyan", title: "Relatório do serviço", text: "Checklist, fotos e resumo do atendimento para compartilhar com o cliente." },
  { icon: Users, tone: "pink", title: "Equipe com permissões", text: "Cada funcionário vê só o próprio trabalho. O financeiro fica com você." },
];

const steps = [
  { title: "Cadastre seus serviços e clientes", text: "Em poucos minutos o Vemo já sabe o que você faz e para quem." },
  { title: "Envie o orçamento", text: "O cliente recebe pelo WhatsApp, aprova pelo link e você agenda o serviço." },
  { title: "Execute e receba", text: "Registre o atendimento, o recebimento e acompanhe tudo na tela Hoje." },
];

const faq = [
  { q: "Preciso instalar alguma coisa?", a: "Não. O Vemo funciona no navegador do celular e do computador. Basta criar a conta e entrar." },
  { q: "O teste grátis pede cartão de crédito?", a: "Não. Você usa por um mês sem informar cartão. No fim do teste, escolhe se quer continuar. Seus dados ficam guardados." },
  { q: "O Vemo envia mensagens no WhatsApp sozinho?", a: "Não. O Vemo prepara a mensagem com os dados do atendimento e abre o seu WhatsApp. Você revisa e envia. Assim o contato continua sendo seu." },
  { q: "Serve para quem trabalha sozinho?", a: "Sim. Na conta Individual você tem clientes, orçamentos, agenda e financeiro. Na conta Empresa, também cadastra funcionários e define o que cada um pode ver." },
  { q: "O financeiro substitui minha conta no banco?", a: "Não. O Vemo organiza o que você registra: entradas, saídas, contas a pagar e a receber. Ele não acessa sua conta bancária." },
  { q: "Posso cancelar quando quiser?", a: "Pode. Não existe fidelidade. Se cancelar, você continua com acesso até o fim do período já pago." },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" aria-label="Vemo, página inicial"><VemoWordmark className="h-9 w-28" /></Link>
          <nav aria-label="Seções" className={styles.navLinks}>
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#preco">Preço</a>
            <a href="#duvidas">Dúvidas</a>
          </nav>
          <div className={styles.navActions}>
            <Link href="/entrar" className={styles.navLogin}>Entrar</Link>
            <Link href="/cadastro" className={styles.navCta}>Testar grátis</Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroText}>
            <span className={styles.badge}><Sparkles aria-hidden="true" />Agora com assistente e lembretes no WhatsApp</span>
            <h1>Seu negócio de serviços <span className={styles.highlight}>organizado</span> do orçamento ao pagamento.</h1>
            <p>Clientes, orçamentos, agenda e financeiro em um só lugar. Menos papel, menos conversa perdida no WhatsApp e mais tempo para trabalhar.</p>
            <div className={styles.heroActions}>
              <Link href="/cadastro" className={styles.primary}>Testar grátis por 1 mês<ArrowRight aria-hidden="true" /></Link>
              <a href="#como-funciona" className={styles.secondary}>Ver como funciona</a>
            </div>
            <p className={styles.trust}><Check aria-hidden="true" />Sem cartão de crédito <Check aria-hidden="true" />Funciona no celular <Check aria-hidden="true" />Cancele quando quiser</p>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.window}>
              <div className={styles.windowBar}><i /><i /><i /><span>vemogestao.com/hoje</span></div>
              <div className={styles.mockHero}>
                <div className={styles.mockOrb} />
                <strong>Bom dia, Carlos.</strong>
                <p>Hoje você tem 3 atendimentos. O próximo é às 09:00, com Ana Paula. Há R$ 1.250,00 para receber.</p>
                <div className={styles.mockPulse}><span><small>Atendimentos</small>3</span><span><small>Entrou hoje</small>R$ 520</span><span><small>A receber</small>R$ 1.250</span></div>
              </div>
              <div className={styles.mockRows}>
                <div><b>09:00</b><span>Instalação de tomadas e luminárias<small>Ana Paula Lima</small></span><em>Próximo</em></div>
                <div><b>14:00</b><span>Pintura de sala<small>Roberto Mendes</small></span></div>
                <div><b>16:30</b><span>Conserto de notebook<small>Studio Bella</small></span></div>
              </div>
            </div>
            <div className={styles.phone}>
              <div className={styles.phoneHead}><MessageCircle />WhatsApp</div>
              <p className={styles.bubble}>Olá, Ana! Podemos confirmar o atendimento de amanhã às 09:00? Responda com SIM. 🙂</p>
              <p className={`${styles.bubble} ${styles.bubbleIn}`}>SIM! Até amanhã 👍</p>
            </div>
            <div className={styles.floatCard}><ArrowDownLeft /><span><small>Pagamento recebido</small>+ R$ 450,00</span></div>
          </div>
        </section>

        <section className={styles.audience} aria-label="Para quem é o Vemo">
          <p>Para quem atende clientes, faz orçamento e trabalha com horário marcado</p>
          <ul>{audiences.map(({ label, icon: Icon }) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}</ul>
        </section>

        <section className={styles.problem}>
          <div className={styles.sectionHead}>
            <span>O problema</span>
            <h2>Informação espalhada custa dinheiro</h2>
            <p>Orçamento no caderno, horário no WhatsApp, pagamento na cabeça. Uma hora alguma coisa escapa.</p>
          </div>
          <div className={styles.compare}>
            <div className={styles.before}>
              <h3>Sem o Vemo</h3>
              <ul>
                <li>Orçamentos esquecidos sem resposta</li>
                <li>Cliente que não lembra do horário</li>
                <li>Não saber quem ainda falta pagar</li>
                <li>Fim do mês sem saber quanto sobrou</li>
              </ul>
            </div>
            <div className={styles.after}>
              <h3>Com o Vemo</h3>
              <ul>
                <li>Aviso de orçamento parado há 3 dias</li>
                <li>Lembrete pronto no WhatsApp</li>
                <li>Lista de quem deve, com valor e vencimento</li>
                <li>Saldo do mês em uma tela, sem planilha</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="recursos" className={styles.benefits}>
          <div className={styles.sectionHead}>
            <span>Recursos</span>
            <h2>Tudo o que o seu dia de trabalho precisa</h2>
            <p>Cada parte conversa com a outra: o orçamento vira agendamento, que vira atendimento, que vira recebimento.</p>
          </div>
          <div className={styles.benefitGrid}>
            {benefits.map(({ icon: Icon, tone, title, text }) => <article key={title} data-tone={tone}><span><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>)}
          </div>
        </section>

        <section id="como-funciona" className={styles.steps}>
          <div className={styles.sectionHead}>
            <span>Como funciona</span>
            <h2>Comece hoje, em três passos</h2>
          </div>
          <ol>
            {steps.map((step, index) => <li key={step.title}><b>{index + 1}</b><h3>{step.title}</h3><p>{step.text}</p></li>)}
          </ol>
          <div className={styles.center}><Link href="/cadastro" className={styles.primary}>Criar minha conta grátis<ArrowRight aria-hidden="true" /></Link></div>
        </section>

        <section className={styles.demo}>
          <div className={styles.demoRow}>
            <div className={styles.demoText}>
              <span className={styles.kicker}><Sparkles aria-hidden="true" />Tela Hoje</span>
              <h2>Uma assistente que organiza o seu dia</h2>
              <p>Ao abrir o Vemo, você vê um resumo escrito do dia: próximos atendimentos, o que entrou, o que está atrasado e quais orçamentos precisam de atenção.</p>
              <ul><li><Check aria-hidden="true" />Bom dia, boa tarde ou boa noite, conforme o horário</li><li><Check aria-hidden="true" />Sugestões do que fazer primeiro</li><li><Check aria-hidden="true" />Pergunte à assistente sobre agenda e valores</li></ul>
            </div>
            <div className={styles.demoCard} data-variant="dark" aria-hidden="true">
              <div className={styles.mockOrb} />
              <strong>Boa tarde, Carlos.</strong>
              <p>2 orçamentos estão sem resposta há mais de 3 dias. Que tal mandar um lembrete?</p>
              <div className={styles.chipsMock}><span>Novo orçamento</span><span>Agendar</span><span>Perguntar à Vemo</span></div>
            </div>
          </div>
          <div className={`${styles.demoRow} ${styles.reverse}`}>
            <div className={styles.demoText}>
              <span className={styles.kicker}><CircleDollarSign aria-hidden="true" />Financeiro</span>
              <h2>Seu dinheiro como num app de banco</h2>
              <p>Extrato por dia, quanto sobrou no mês, para onde foi o dinheiro e contas com vencimento. Tudo com palavras simples.</p>
              <ul><li><Check aria-hidden="true" />Entradas e saídas com categoria</li><li><Check aria-hidden="true" />Contas parceladas a pagar e a receber</li><li><Check aria-hidden="true" />Planilha para o contador em um clique</li></ul>
            </div>
            <div className={styles.demoCard} data-variant="bank" aria-hidden="true">
              <small>Sobrou em outubro</small>
              <strong>R$ 4.380,00</strong>
              <span className={styles.up}>▲ 12% em relação a setembro</span>
              <div className={styles.bankSplit}><span><small>Entrou</small>R$ 7.900,00</span><span><small>Saiu</small>R$ 3.520,00</span></div>
            </div>
          </div>
          <div className={styles.demoRow}>
            <div className={styles.demoText}>
              <span className={styles.kicker}><BellRing aria-hidden="true" />Agenda + WhatsApp</span>
              <h2>Menos faltas, mais clientes confirmados</h2>
              <p>Na véspera, abra a lista de atendimentos de amanhã e envie a confirmação para cada cliente com um toque.</p>
              <ul><li><Check aria-hidden="true" />Mensagens prontas e editáveis</li><li><Check aria-hidden="true" />“Estou a caminho” e agradecimento pós-serviço</li><li><Check aria-hidden="true" />Agenda por funcionário na conta Empresa</li></ul>
            </div>
            <div className={styles.demoCard} data-variant="agenda" aria-hidden="true">
              <div className={styles.week}>{["Seg", "Ter", "Qua", "Qui", "Sex"].map((day, index) => <span key={day} data-active={index === 1 || undefined}><small>{day}</small>{12 + index}</span>)}</div>
              <div className={styles.reminderMock}><b>09:00</b><span>Ana Paula Lima<small>Instalação elétrica</small></span><em><MessageCircle />Enviar</em></div>
              <div className={styles.reminderMock}><b>14:00</b><span>Roberto Mendes<small>Jardinagem</small></span><em data-done="true"><Check />Enviado</em></div>
            </div>
          </div>
        </section>

        <section id="preco" className={styles.pricing}>
          <div className={styles.sectionHead}>
            <span>Preço</span>
            <h2>Um plano simples, com tudo incluído</h2>
            <p>Sem taxa de adesão e sem fidelidade.</p>
          </div>
          <div className={styles.priceCard}>
            <span className={styles.priceBadge}>1º mês grátis</span>
            <h3>Plano Vemo</h3>
            <p className={styles.price}><b>R$ 49,90</b><span>/mês por empresa</span></p>
            <ul>
              {["Clientes e orçamentos ilimitados", "Orçamento com sua logo e aprovação por link", "Agenda com lembretes no WhatsApp", "Financeiro completo e contas a pagar/receber", "Relatório de serviço com fotos", "Funcionários com permissões (conta Empresa)", "Assistente Vemo"].map(item => <li key={item}><Check aria-hidden="true" />{item}</li>)}
            </ul>
            <Link href="/cadastro" className={styles.primary}>Começar teste grátis<ArrowRight aria-hidden="true" /></Link>
            <small className={styles.priceNote}>Teste de um mês sem cartão. Seus dados ficam guardados quando o teste termina.</small>
          </div>
        </section>

        <section id="duvidas" className={styles.faq}>
          <div className={styles.sectionHead}>
            <span>Dúvidas</span>
            <h2>Perguntas frequentes</h2>
          </div>
          <div className={styles.faqList}>
            {faq.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}
          </div>
        </section>

        <section className={styles.final}>
          <div className={styles.finalGlow} aria-hidden="true" />
          <h2>Pronto para organizar o seu negócio?</h2>
          <p>Crie sua conta em menos de 2 minutos e use grátis durante um mês.</p>
          <Link href="/cadastro" className={styles.finalCta}>Testar grátis agora<ArrowRight aria-hidden="true" /></Link>
          <div className={styles.finalTrust}><span><ShieldCheck aria-hidden="true" />Dados protegidos</span><span><Smartphone aria-hidden="true" />Celular e computador</span><span><Zap aria-hidden="true" />Sem instalação</span></div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div>
          <VemoWordmark className="h-9 w-28" />
          <p>Gestão simples para quem presta serviços.</p>
        </div>
        <nav aria-label="Links do rodapé">
          <Link href="/entrar">Entrar</Link>
          <Link href="/cadastro">Criar conta</Link>
          <Link href="/termos">Termos de uso</Link>
          <Link href="/privacidade">Política de privacidade</Link>
        </nav>
        <p className={styles.copy}>© {new Date().getFullYear()} Vemo. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
