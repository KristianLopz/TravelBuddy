import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  cancelPremium,
  getSubscriptionStatus,
  subscribePremium,
  type PaymentMethod,
} from "../services/subscriptionService";
import { useAuth } from "../hooks/useAuth";

const beneficios = [
  {
    nome: "Orçamentos ilimitados",
    gratuito: "Limitado",
    premium: "Ilimitado",
  },
  {
    nome: "Recomendações personalizadas",
    gratuito: "Básicas",
    premium: "Avançadas",
  },
  {
    nome: "Planejamento inteligente de viagens",
    gratuito: "Não incluso",
    premium: "Incluso",
  },
  {
    nome: "Alertas de promoções",
    gratuito: "Não incluso",
    premium: "Incluso",
  },
  {
    nome: "Acesso antecipado a novos recursos",
    gratuito: "Não incluso",
    premium: "Incluso",
  },
  {
    nome: "Remoção de limitações da versão gratuita",
    gratuito: "Não incluso",
    premium: "Incluso",
  },
];

function somenteNumeros(value: string) {
  return value.replace(/\D/g, "");
}

export function Premium() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [planoAtivo, setPlanoAtivo] = useState(localStorage.getItem("plano") || "free");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>("cartao");
  const [ciclo, setCiclo] = useState<"mensal" | "anual">("mensal");
  const [formPagamento, setFormPagamento] = useState({
    nomeCartao: "",
    numeroCartao: "",
    validade: "",
    cvv: "",
    pixCpf: "",
    boletoNome: "",
    boletoCpf: "",
    boletoEmail: "",
  });

  useEffect(() => {
    async function carregarPlano() {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        setLoadingPlano(false);
        return;
      }

      try {
        const data = await getSubscriptionStatus(token);
        const plano = data.plan || "free";
        setPlanoAtivo(plano);
        localStorage.setItem("plano", plano);
        updateUser({ plan: plano });
      } catch (error) {
        console.error(error);
        setErro("Não foi possível consultar sua assinatura agora.");
      } finally {
        setLoadingPlano(false);
      }
    }

    carregarPlano();
  }, [updateUser]);

  const valorPlano = useMemo(() => {
    if (ciclo === "anual") return { label: "R$ 299,90", detalhe: "por ano", total: "R$ 299,90/ano" };
    return { label: "R$ 29,90", detalhe: "por mês", total: "R$ 29,90/mês" };
  }, [ciclo]);

  function validarPagamento() {
    if (formaPagamento === "cartao") {
      if (!formPagamento.nomeCartao.trim()) return "Informe o nome impresso no cartão.";
      if (somenteNumeros(formPagamento.numeroCartao).length < 13) return "Informe um número de cartão válido.";
      if (!/^\d{2}\/\d{2}$/.test(formPagamento.validade.trim())) return "Informe a validade no formato MM/AA.";
      if (somenteNumeros(formPagamento.cvv).length < 3) return "Informe um CVV válido.";
    }

    if (formaPagamento === "pix") {
      if (somenteNumeros(formPagamento.pixCpf).length < 11) return "Informe um CPF válido para gerar o PIX.";
    }

    if (formaPagamento === "boleto") {
      if (!formPagamento.boletoNome.trim()) return "Informe o nome do pagador.";
      if (somenteNumeros(formPagamento.boletoCpf).length < 11) return "Informe um CPF válido para o boleto.";
      if (!formPagamento.boletoEmail.includes("@")) return "Informe um e-mail válido para receber o boleto.";
    }

    return "";
  }

  async function processarPagamento(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    const erroValidacao = validarPagamento();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    const token = localStorage.getItem("token") || "";

    try {
      setLoadingPagamento(true);

      const data = await subscribePremium(token, {
        payment_method: formaPagamento,
        billing_cycle: ciclo,
        card_holder: formPagamento.nomeCartao,
        card_number: formPagamento.numeroCartao,
        card_expiry: formPagamento.validade,
        card_cvv: formPagamento.cvv,
        pix_cpf: formPagamento.pixCpf,
        boleto_name: formPagamento.boletoNome,
        boleto_cpf: formPagamento.boletoCpf,
        boleto_email: formPagamento.boletoEmail,
      });

      localStorage.setItem("plano", "premium");
      localStorage.setItem("dataAssinatura", new Date().toISOString());
      updateUser({ plan: "premium" });
      setPlanoAtivo("premium");
      setMensagem(data.message || "Assinatura Premium ativada com sucesso!");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao assinar Premium.");
    } finally {
      setLoadingPagamento(false);
    }
  }

  async function cancelarAssinatura() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura Premium?")) return;

    const token = localStorage.getItem("token") || "";

    try {
      setLoadingPagamento(true);
      setErro("");
      setMensagem("");

      const data = await cancelPremium(token);

      localStorage.setItem("plano", "free");
      updateUser({ plan: "free" });
      setPlanoAtivo("free");
      setMensagem(data.message || "Assinatura cancelada com sucesso.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao cancelar assinatura.");
    } finally {
      setLoadingPagamento(false);
    }
  }

  function renderCampoPagamento() {
    if (formaPagamento === "pix") {
      return (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-100 text-green-800 rounded-xl p-4">
            A cobrança será simulada. Após confirmar, o sistema ativa o Premium como se o PIX tivesse sido aprovado.
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">CPF para PIX</label>
            <input
              type="text"
              value={formPagamento.pixCpf}
              onChange={(e) => setFormPagamento({ ...formPagamento, pixCpf: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="000.000.000-00"
            />
          </div>
        </div>
      );
    }

    if (formaPagamento === "boleto") {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-xl p-4">
            O boleto é simulado para o protótipo. Ao confirmar, o plano Premium será ativado para teste.
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nome do pagador</label>
            <input
              type="text"
              value={formPagamento.boletoNome}
              onChange={(e) => setFormPagamento({ ...formPagamento, boletoNome: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Nome completo"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
              <input
                type="text"
                value={formPagamento.boletoCpf}
                onChange={(e) => setFormPagamento({ ...formPagamento, boletoCpf: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={formPagamento.boletoEmail}
                onChange={(e) => setFormPagamento({ ...formPagamento, boletoEmail: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nome no cartão</label>
          <input
            type="text"
            value={formPagamento.nomeCartao}
            onChange={(e) => setFormPagamento({ ...formPagamento, nomeCartao: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="João Silva"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Número do cartão</label>
          <input
            type="text"
            value={formPagamento.numeroCartao}
            onChange={(e) => setFormPagamento({ ...formPagamento, numeroCartao: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="1234 5678 9012 3456"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Validade</label>
            <input
              type="text"
              value={formPagamento.validade}
              onChange={(e) => setFormPagamento({ ...formPagamento, validade: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="MM/AA"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">CVV</label>
            <input
              type="text"
              value={formPagamento.cvv}
              onChange={(e) => setFormPagamento({ ...formPagamento, cvv: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="123"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <button
              onClick={() => navigate(-1)}
              className="mb-8 inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold transition-colors"
            >
              ← Voltar
            </button>

            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <span className="inline-block bg-white/15 border border-white/20 px-3 py-1 rounded-full text-xs font-extrabold mb-4">
                  Premium
                </span>

                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
                  Planeje melhor com o TravelBuddy Premium
                </h1>

                <p className="text-white/85 text-lg leading-relaxed max-w-3xl">
                  O plano Premium libera recursos avançados para quem quer montar viagens com mais liberdade: orçamentos ilimitados, recomendações personalizadas, alertas de promoções e planejamento inteligente em uma experiência mais completa.
                </p>
              </div>

              <div className="bg-white/15 border border-white/20 rounded-3xl p-6 shadow-2xl backdrop-blur">
                <p className="text-white/80 font-semibold">Plano Premium</p>
                <div className="flex items-end gap-2 mt-2">
                  <span className="text-5xl font-extrabold">{valorPlano.label}</span>
                  <span className="text-white/80 mb-2">{valorPlano.detalhe}</span>
                </div>
                <p className="text-white/80 text-sm mt-3">
                  {ciclo === "anual" ? "Economize assinando anualmente." : "Cancele quando quiser durante o protótipo."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {loadingPlano && (
            <div className="bg-white rounded-2xl shadow p-5 border border-gray-100 text-gray-700">
              Consultando sua assinatura...
            </div>
          )}

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl">
              {mensagem}
            </div>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Plano Gratuito</h2>
                  <p className="text-gray-500 mt-1">Para começar a explorar destinos.</p>
                </div>
                <span className="text-3xl font-extrabold text-gray-900">R$ 0</span>
              </div>

              <ul className="space-y-3">
                <li className="flex gap-3"><span className="text-green-500 font-bold">✓</span><span>Buscar destinos por orçamento</span></li>
                <li className="flex gap-3"><span className="text-green-500 font-bold">✓</span><span>Visualizar informações básicas</span></li>
                <li className="flex gap-3"><span className="text-green-500 font-bold">✓</span><span>Favoritos limitados</span></li>
                <li className="flex gap-3 text-gray-400"><span>✕</span><span>Sem alertas de promoções</span></li>
                <li className="flex gap-3 text-gray-400"><span>✕</span><span>Sem planejamento inteligente avançado</span></li>
              </ul>

              {planoAtivo !== "premium" && (
                <div className="mt-8 bg-gray-100 text-gray-700 py-3 rounded-xl text-center font-bold">
                  Plano atual
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-xl border border-indigo-500 p-6 sm:p-8 text-white relative overflow-hidden hover:shadow-2xl transition-shadow">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex justify-between items-start gap-4 mb-6">
                  <div>
                    <span className="inline-block bg-yellow-300 text-gray-900 px-3 py-1 rounded-full text-xs font-extrabold mb-3">
                      MAIS COMPLETO
                    </span>
                    <h2 className="text-2xl font-extrabold">Plano Premium</h2>
                    <p className="text-white/80 mt-1">Para planejar viagens sem limitações.</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-3xl font-extrabold">{valorPlano.label}</span>
                    <span className="text-white/80 text-sm">{valorPlano.detalhe}</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex gap-3"><span className="text-yellow-300 font-bold">✓</span><span>Orçamentos ilimitados</span></li>
                  <li className="flex gap-3"><span className="text-yellow-300 font-bold">✓</span><span>Recomendações personalizadas</span></li>
                  <li className="flex gap-3"><span className="text-yellow-300 font-bold">✓</span><span>Planejamento inteligente de viagens</span></li>
                  <li className="flex gap-3"><span className="text-yellow-300 font-bold">✓</span><span>Alertas de promoções</span></li>
                  <li className="flex gap-3"><span className="text-yellow-300 font-bold">✓</span><span>Acesso antecipado a novos recursos</span></li>
                </ul>

                {planoAtivo === "premium" ? (
                  <div className="mt-8 grid gap-3">
                    <div className="bg-white/20 py-3 rounded-xl text-center font-bold">
                      Você já está no Premium
                    </div>
                    <button
                      onClick={cancelarAssinatura}
                      disabled={loadingPagamento}
                      className="bg-white/10 border border-white/30 py-3 rounded-xl hover:bg-white/20 transition-colors font-bold disabled:opacity-60"
                    >
                      {loadingPagamento ? "Processando..." : "Cancelar assinatura"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => document.getElementById("contratar-premium")?.scrollIntoView({ behavior: "smooth" })}
                    className="mt-8 w-full bg-white text-indigo-700 py-4 rounded-xl hover:bg-indigo-50 transition-all hover:-translate-y-0.5 font-extrabold shadow-lg"
                  >
                    Assinar Premium
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900">Comparação dos planos</h2>
              <p className="text-gray-600 mt-1">Veja rapidamente a diferença entre o plano gratuito e o Premium.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-4">Recurso</th>
                    <th className="px-6 py-4">Gratuito</th>
                    <th className="px-6 py-4 text-indigo-700">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {beneficios.map((beneficio) => (
                    <tr key={beneficio.nome} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{beneficio.nome}</td>
                      <td className="px-6 py-4 text-gray-600">{beneficio.gratuito}</td>
                      <td className="px-6 py-4 text-indigo-700 font-bold">{beneficio.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="contratar-premium" className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Contratação</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Escolha a forma de pagamento e confirme a assinatura. O pagamento é simulado no protótipo, mas a ativação do plano fica integrada ao usuário logado.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ciclo da assinatura</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["mensal", "anual"] as const).map((opcao) => (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => setCiclo(opcao)}
                        className={`py-3 rounded-xl border font-bold transition-all ${
                          ciclo === opcao
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50"
                        }`}
                      >
                        {opcao === "mensal" ? "Mensal" : "Anual"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Forma de pagamento</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {([
                      { id: "cartao", label: "Cartão" },
                      { id: "pix", label: "PIX" },
                      { id: "boleto", label: "Boleto" },
                    ] as { id: PaymentMethod; label: string }[]).map((opcao) => (
                      <button
                        key={opcao.id}
                        type="button"
                        onClick={() => setFormaPagamento(opcao.id)}
                        className={`py-3 rounded-xl border font-bold transition-all ${
                          formaPagamento === opcao.id
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50"
                        }`}
                      >
                        {opcao.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={processarPagamento} className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900">Finalizar assinatura</h3>
                  <p className="text-gray-600 mt-1">Plano Premium • {valorPlano.total}</p>
                </div>

                <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-extrabold text-sm">
                  {formaPagamento.toUpperCase()}
                </span>
              </div>

              {renderCampoPagamento()}

              <div className="bg-indigo-50 p-5 rounded-2xl mt-6 border border-indigo-100">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Plano Premium</span>
                  <span className="font-bold">{valorPlano.label}</span>
                </div>
                <div className="border-t border-indigo-200 pt-3 flex justify-between">
                  <span className="font-extrabold">Total</span>
                  <span className="font-extrabold text-indigo-700">{valorPlano.total}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingPagamento || planoAtivo === "premium"}
                className="mt-6 w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 transition-all hover:-translate-y-0.5 disabled:bg-gray-400 disabled:hover:translate-y-0 font-extrabold shadow-md"
              >
                {planoAtivo === "premium"
                  ? "Premium já ativo"
                  : loadingPagamento
                    ? "Processando pagamento..."
                    : "Assinar Premium"}
              </button>
            </form>
          </section>
        </main>
      </div>
    </MainLayout>
  );
}
