import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Termos de uso | Vemo", description: "Regras de uso da plataforma Vemo." };

// MODELO: revise com um advogado e preencha razão social, CNPJ e contato antes de publicar.
export default function TermsPage() {
  return <LegalPage title="Termos de uso" updated="7 de outubro de 2026">
    <p>Estes termos regulam o uso do Vemo, plataforma on-line de gestão para profissionais autônomos, prestadores de serviços e pequenas empresas. Ao criar uma conta, você declara que leu e concorda com estes termos.</p>
    <h2>1. Quem somos</h2>
    <p>O Vemo é oferecido por [RAZÃO SOCIAL], inscrita no CNPJ [00.000.000/0000-00], com contato pelo e-mail [contato@vemogestao.com].</p>
    <h2>2. O que o Vemo oferece</h2>
    <p>Ferramentas para organizar clientes, orçamentos, agenda, execução de serviços e registros financeiros. O Vemo não é banco, não movimenta dinheiro e não acessa contas bancárias. Os números exibidos representam apenas o que foi registrado na plataforma.</p>
    <h2>3. Conta e acesso</h2>
    <ul><li>Você é responsável pelas informações cadastradas e por manter sua senha em sigilo.</li><li>Na conta Empresa, o responsável define quem pode acessar e com quais permissões.</li><li>É proibido usar o Vemo para atividades ilegais, envio de spam ou para violar direitos de terceiros.</li></ul>
    <h2>4. Teste gratuito e assinatura</h2>
    <p>Novos negócios têm um mês calendário gratuito, sem necessidade de cartão. Após o teste, o uso continua mediante assinatura mensal no valor informado na página de preços. A assinatura renova automaticamente e pode ser cancelada a qualquer momento, mantendo o acesso até o fim do período já pago. Os dados não são apagados ao fim do teste.</p>
    <h2>5. Mensagens e WhatsApp</h2>
    <p>O Vemo prepara textos e abre o seu aplicativo de mensagens. O envio é sempre feito por você, que é responsável pelo conteúdo e pelo consentimento dos seus clientes em receber contato.</p>
    <h2>6. Disponibilidade</h2>
    <p>Trabalhamos para manter o serviço disponível, mas podem ocorrer interrupções para manutenção ou por fatores externos. Recomendamos exportar seus dados periodicamente.</p>
    <h2>7. Responsabilidades</h2>
    <p>O Vemo é uma ferramenta de organização. Decisões comerciais, fiscais e financeiras tomadas com base nos registros são de responsabilidade do usuário. O Vemo não emite nota fiscal.</p>
    <h2>8. Cancelamento e exclusão</h2>
    <p>Você pode cancelar a assinatura quando quiser. Para excluir sua conta e seus dados, entre em contato pelo e-mail informado acima.</p>
    <h2>9. Alterações</h2>
    <p>Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas na plataforma ou por e-mail.</p>
    <h2>10. Foro</h2>
    <p>Fica eleito o foro da comarca de [CIDADE/UF] para resolver eventuais conflitos, respeitados os direitos do consumidor.</p>
  </LegalPage>;
}
