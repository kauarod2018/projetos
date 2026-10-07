import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Política de privacidade | Vemo", description: "Como o Vemo trata os seus dados pessoais, conforme a LGPD." };

// MODELO: revise com um advogado e preencha razão social, CNPJ e contato antes de publicar.
export default function PrivacyPage() {
  return <LegalPage title="Política de privacidade" updated="7 de outubro de 2026">
    <p>Esta política explica como o Vemo coleta, usa e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</p>
    <h2>1. Controlador</h2>
    <p>[RAZÃO SOCIAL], CNPJ [00.000.000/0000-00]. Contato do encarregado de dados: [privacidade@vemogestao.com].</p>
    <h2>2. Dados que coletamos</h2>
    <ul><li><strong>Da sua conta:</strong> nome, e-mail, telefone, nome da empresa e senha (guardada de forma criptografada).</li><li><strong>Do seu negócio:</strong> clientes, orçamentos, agenda, relatórios, fotos, logo e lançamentos financeiros que você cadastrar.</li><li><strong>De uso:</strong> registros técnicos de acesso e de ações, para segurança e histórico.</li></ul>
    <h2>3. Para que usamos</h2>
    <ul><li>Prestar o serviço contratado e manter sua conta funcionando.</li><li>Enviar e-mails essenciais, como confirmação de conta e recuperação de senha.</li><li>Cobrar a assinatura, quando aplicável.</li><li>Garantir a segurança e prevenir fraudes.</li></ul>
    <h2>4. Dados dos seus clientes</h2>
    <p>Os dados que você cadastra sobre seus clientes pertencem ao seu negócio. Nesse caso, você é o controlador e o Vemo atua como operador, tratando esses dados apenas para prestar o serviço.</p>
    <h2>5. Compartilhamento</h2>
    <p>Não vendemos dados. Compartilhamos apenas com fornecedores necessários ao funcionamento (hospedagem, envio de e-mail e processamento de pagamento), sob obrigação de confidencialidade.</p>
    <h2>6. Armazenamento e segurança</h2>
    <p>Os dados ficam em servidores com acesso restrito e conexão protegida. Cada empresa tem seus dados isolados das demais.</p>
    <h2>7. Seus direitos</h2>
    <p>Você pode solicitar confirmação, acesso, correção, portabilidade e exclusão dos seus dados, além de revogar consentimentos, pelo e-mail do encarregado.</p>
    <h2>8. Cookies</h2>
    <p>Usamos apenas cookies essenciais para manter você conectado. Não usamos cookies de publicidade.</p>
    <h2>9. Retenção</h2>
    <p>Mantemos os dados enquanto a conta estiver ativa ou pelo prazo exigido por lei. Após o pedido de exclusão, os dados são removidos, salvo obrigação legal de guarda.</p>
    <h2>10. Alterações</h2>
    <p>Esta política pode ser atualizada. A data no topo indica a versão vigente.</p>
  </LegalPage>;
}
