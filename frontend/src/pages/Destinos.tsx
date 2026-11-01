import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { api } from "../services/api";

interface Destino {
  id: number;
  nome: string;
  pais: string;
  estado: string;
  custoMedio: number;
  imagem: string;
  clima: string;
  melhorEpoca?: string;
  descricao?: string;
}

type ApiDestino = {
  id?: number;
  name?: string;
  nome?: string;
  country?: string;
  pais?: string;
  state?: string;
  estado?: string;
  estimated_cost?: number | string;
  custoMedio?: number | string;
  image_url?: string | null;
  imagem?: string | null;
  climate?: string | null;
  clima?: string | null;
  best_season?: string | null;
  melhorEpoca?: string | null;
  description?: string | null;
  descricao?: string | null;
};

interface ApiListResponse {
  budget?: number;
  num_people?: number;
  total?: number;
  destinations?: ApiDestino[];
  destinos?: ApiDestino[];
  message?: string;
  error?: string;
}

const DESTINOS_PADRAO: ApiDestino[] = [
  { id: 1, name: "Ouro Preto", country: "Brasil", state: "MG", estimated_cost: 900, image_url: "/destinations/ouro-preto.png", climate: "Tropical de altitude", best_season: "Abril a setembro", description: "Cidade histórica mineira com igrejas, museus e arquitetura colonial." },
  { id: 2, name: "Praia do Rosa", country: "Brasil", state: "SC", estimated_cost: 1400, image_url: "/destinations/praia-do-rosa.png", climate: "Litorâneo", best_season: "Novembro a março", description: "Praia charmosa para descanso, surf e natureza." },
  { id: 3, name: "Chapada Diamantina", country: "Brasil", state: "BA", estimated_cost: 1500, image_url: "/destinations/chapada-diamantina.png", climate: "Tropical de altitude", best_season: "Abril a setembro", description: "Trilhas, cachoeiras, grutas e paisagens naturais." },
  { id: 4, name: "Manaus", country: "Brasil", state: "AM", estimated_cost: 1700, image_url: "/destinations/manaus.png", climate: "Equatorial", best_season: "Julho a novembro", description: "Porta de entrada para a Amazônia." },
  { id: 5, name: "Florianópolis", country: "Brasil", state: "SC", estimated_cost: 1800, image_url: "/destinations/florianopolis.png", climate: "Subtropical", best_season: "Dezembro a março", description: "Praias, trilhas e ótima estrutura turística." },
  { id: 6, name: "Foz do Iguaçu", country: "Brasil", state: "PR", estimated_cost: 1900, image_url: "/destinations/foz-do-iguacu.png", climate: "Subtropical", best_season: "Março a novembro", description: "Cataratas do Iguaçu, parques e atrações de fronteira." },
  { id: 7, name: "São Paulo", country: "Brasil", state: "SP", estimated_cost: 2100, image_url: "/destinations/sao-paulo.png", climate: "Subtropical", best_season: "Março a novembro", description: "Centro urbano com gastronomia, cultura e eventos." },
  { id: 8, name: "Gramado", country: "Brasil", state: "RS", estimated_cost: 2200, image_url: "/destinations/gramado.png", climate: "Frio serrano", best_season: "Maio a agosto", description: "Cidade serrana com gastronomia e atrações para famílias." },
  { id: 9, name: "Rio de Janeiro", country: "Brasil", state: "RJ", estimated_cost: 2500, image_url: "/destinations/rio-de-janeiro.png", climate: "Tropical", best_season: "Abril a outubro", description: "Praias famosas, montanhas e pontos turísticos conhecidos." },
  { id: 10, name: "Bonito", country: "Brasil", state: "MS", estimated_cost: 2600, image_url: "/destinations/bonito-ms.png", climate: "Tropical", best_season: "Maio a setembro", description: "Rios cristalinos, grutas e ecoturismo." },
  { id: 11, name: "Lençóis Maranhenses", country: "Brasil", state: "MA", estimated_cost: 2800, image_url: "/destinations/lencois-maranhenses.png", climate: "Tropical", best_season: "Junho a setembro", description: "Dunas e lagoas naturais." },
  { id: 12, name: "Fernando de Noronha", country: "Brasil", state: "PE", estimated_cost: 5200, image_url: "/destinations/fernando-de-noronha.svg", climate: "Tropical oceânico", best_season: "Agosto a outubro", description: "Arquipélago paradisíaco com praias preservadas." },
];

const filtros = [
  { id: "todos", label: "Todos" },
  { id: "economico", label: "Econômico" },
  { id: "moderado", label: "Moderado" },
  { id: "luxo", label: "Luxo" },
];

function converterDestino(d: ApiDestino, index = 0): Destino {
  return {
    id: Number(d.id || index + 1),
    nome: String(d.name || d.nome || "Destino"),
    pais: String(d.country || d.pais || "Brasil"),
    estado: String(d.state || d.estado || ""),
    custoMedio: Number(d.estimated_cost || d.custoMedio || 0),
    imagem: String(d.image_url || d.imagem || "/destinations/rio-de-janeiro.png"),
    clima: String(d.climate || d.clima || "Não informado"),
    melhorEpoca: String(d.best_season || d.melhorEpoca || "Não informada"),
    descricao: String(d.description || d.descricao || ""),
  };
}

function filtrarPorPreco(destinos: Destino[], filtroPreco: string) {
  return destinos.filter((d) => {
    if (filtroPreco === "economico") return d.custoMedio < 1800;
    if (filtroPreco === "moderado") return d.custoMedio >= 1800 && d.custoMedio < 3000;
    if (filtroPreco === "luxo") return d.custoMedio >= 3000;
    return true;
  });
}

function filtrarPorOrcamento(destinos: Destino[], budget: number | null, numPeople: number) {
  if (!budget || budget <= 0) return [];
  const limitePorPessoa = budget / Math.max(numPeople || 1, 1);
  return destinos.filter((destino) => destino.custoMedio <= limitePorPessoa);
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function lerJson(response: Response): Promise<ApiListResponse> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function Destinos() {
  const navigate = useNavigate();

  const [todosDestinos, setTodosDestinos] = useState<Destino[]>([]);
  const [destinosCompativeis, setDestinosCompativeis] = useState<Destino[]>([]);
  const [mensagemCompatibilidade, setMensagemCompatibilidade] = useState("");
  const [aviso, setAviso] = useState("");
  const [orcamento, setOrcamento] = useState<number | null>(null);
  const [pessoas, setPessoas] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [filtroPreco, setFiltroPreco] = useState("todos");

  const carregarDestinos = useCallback(async () => {
    let budgetAtual: number | null = null;
    let pessoasAtuais = 1;
    try {
      const token = localStorage.getItem("token") || "";
      const orcamentoSalvo = localStorage.getItem("travelbuddy_orcamento");
      const dadosOrcamento = orcamentoSalvo ? JSON.parse(orcamentoSalvo) : null;
      const budget = dadosOrcamento?.valor ? Number(dadosOrcamento.valor) : null;
      const numPeople = dadosOrcamento?.pessoas ? Number(dadosOrcamento.pessoas) : 1;
      budgetAtual = budget;
      pessoasAtuais = numPeople || 1;

      const destinosPadraoConvertidos = DESTINOS_PADRAO.map(converterDestino);

      const responseTodos = await api("/destinations", {
        method: "GET",
        token,
      });

      if (responseTodos.status === 401) {
        navigate("/login");
        return;
      }

      setAviso("");
      setMensagemCompatibilidade("");
      setOrcamento(budget);
      setPessoas(numPeople || 1);

      const dataTodos = await lerJson(responseTodos);

      let destinosBase = destinosPadraoConvertidos;

      if (responseTodos.ok) {
        const listaApi = dataTodos.destinations || dataTodos.destinos || [];
        destinosBase = listaApi.length ? listaApi.map(converterDestino) : destinosPadraoConvertidos;
      } else {
        setAviso(
          dataTodos.error ||
            dataTodos.message ||
            "Não foi possível consultar o banco agora. Mostrando os destinos padrão do protótipo."
        );
      }

      setTodosDestinos(destinosBase);

      const params = new URLSearchParams();
      if (budget) params.set("budget", String(budget));
      if (numPeople) params.set("num_people", String(numPeople));

      try {
        const responseCompat = await api(`/destinations/suggestions?${params.toString()}`, {
          method: "GET",
          token,
        });

        if (responseCompat.status === 401) {
          navigate("/login");
          return;
        }

        const dataCompat = await lerJson(responseCompat);

        if (responseCompat.ok) {
          const listaCompat = dataCompat.destinations || dataCompat.destinos || [];
          const compatApi = listaCompat.map(converterDestino);
          setDestinosCompativeis(compatApi.length ? compatApi : filtrarPorOrcamento(destinosBase, budget, numPeople));
          setMensagemCompatibilidade(dataCompat.message || "");
          if (dataCompat.budget) setOrcamento(Number(dataCompat.budget));
          if (dataCompat.num_people) setPessoas(Number(dataCompat.num_people));
        } else {
          setDestinosCompativeis(filtrarPorOrcamento(destinosBase, budget, numPeople));
          setMensagemCompatibilidade(dataCompat.error || dataCompat.message || "Sugestões calculadas localmente.");
        }
      } catch {
        setDestinosCompativeis(filtrarPorOrcamento(destinosBase, budget, numPeople));
        setMensagemCompatibilidade("Sugestões calculadas localmente.");
      }
    } catch (error) {
      console.error(error);
      const destinosPadraoConvertidos = DESTINOS_PADRAO.map(converterDestino);
      setTodosDestinos(destinosPadraoConvertidos);
      setDestinosCompativeis(filtrarPorOrcamento(destinosPadraoConvertidos, budgetAtual, pessoasAtuais));
      setAviso("Não foi possível conectar ao servidor. Mostrando destinos padrão para a tela não ficar travada.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void Promise.resolve().then(carregarDestinos);
  }, [carregarDestinos]);

  const idsCompativeis = useMemo(
    () => new Set(destinosCompativeis.map((destino) => destino.id)),
    [destinosCompativeis]
  );

  const todosFiltrados = useMemo(
    () => filtrarPorPreco(todosDestinos, filtroPreco),
    [todosDestinos, filtroPreco]
  );

  const compativeisFiltrados = useMemo(
    () => filtrarPorPreco(destinosCompativeis, filtroPreco),
    [destinosCompativeis, filtroPreco]
  );

  function CardDestino({ destino, compativel }: { destino: Destino; compativel?: boolean }) {
    return (
      <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-gray-100 group">
        <div className="relative">
          <img
            src={destino.imagem}
            alt={destino.nome}
            className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {compativel && (
            <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              Compatível
            </span>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between gap-3 items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{destino.nome}</h3>
              <p className="text-gray-500 text-sm">
                {destino.estado}, {destino.pais}
              </p>
            </div>

            <span className="text-indigo-600 font-extrabold whitespace-nowrap">
              {moeda(destino.custoMedio)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 my-4 text-sm">
            <div className="bg-indigo-50 rounded-lg p-3">
              <span className="block text-gray-500">Clima</span>
              <strong className="text-gray-800">{destino.clima}</strong>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <span className="block text-gray-500">Melhor época</span>
              <strong className="text-gray-800">{destino.melhorEpoca}</strong>
            </div>
          </div>

          <button
            onClick={() => navigate(`/destino/${destino.id}`)}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
          <h2 className="text-2xl font-semibold text-gray-700">Carregando destinos...</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-indigo-50 to-purple-100 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <span className="text-indigo-600 font-bold text-sm uppercase tracking-wide">
                  Sugestões de Destinos
                </span>
                <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-3">
                  Destinos para você
                </h1>
                <p className="text-gray-600 text-lg max-w-2xl">
                  Veja primeiro os destinos compatíveis com seu orçamento e, logo abaixo, todos os lugares cadastrados no TravelBuddy.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-5 min-w-[280px] border border-white">
                <p className="text-sm text-gray-500">Seu orçamento</p>
                <p className="text-2xl font-extrabold text-indigo-600">
                  {orcamento ? moeda(orcamento) : "Não definido"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {pessoas} pessoa(s)
                </p>
                <button
                  onClick={() => navigate("/orcamento")}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Ajustar orçamento
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {aviso && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
              {aviso}
            </div>
          )}

          <div className="mb-8 flex gap-2 flex-wrap">
            {filtros.map((filtro) => (
              <button
                key={filtro.id}
                onClick={() => setFiltroPreco(filtro.id)}
                className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                  filtroPreco === filtro.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-indigo-50"
                }`}
              >
                {filtro.label}
              </button>
            ))}
          </div>

          <section className="mb-12">
            <div className="flex justify-between items-end gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Compatíveis com meu orçamento
                </h2>
                <p className="text-gray-600">
                  {orcamento
                    ? `${compativeisFiltrados.length} destino(s) dentro do valor informado.`
                    : "Defina um orçamento para ativar a lista compatível."}
                </p>
              </div>
            </div>

            {!orcamento ? (
              <div className="bg-white rounded-2xl shadow-sm border border-dashed border-indigo-200 p-10 text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum orçamento definido ainda</h3>
                <p className="text-gray-600 mb-5">Preencha valor, dias e pessoas para o sistema filtrar os melhores destinos.</p>
                <button
                  onClick={() => navigate("/orcamento")}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 font-semibold"
                >
                  Definir orçamento
                </button>
              </div>
            ) : compativeisFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <p className="text-gray-700 mb-4">
                  {mensagemCompatibilidade || "Nenhum destino encontrado para esse filtro."}
                </p>
                <button
                  onClick={() => navigate("/orcamento")}
                  className="text-indigo-600 hover:text-indigo-700 font-bold"
                >
                  Aumentar ou ajustar orçamento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compativeisFiltrados.map((destino) => (
                  <CardDestino key={destino.id} destino={destino} compativel />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex justify-between items-end gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Todos os destinos cadastrados
                </h2>
                <p className="text-gray-600">
                  Mostrando {todosFiltrados.length} de {todosDestinos.length} destino(s).
                </p>
              </div>
            </div>

            {todosFiltrados.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-gray-600">
                Nenhum destino encontrado nesse filtro.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {todosFiltrados.map((destino) => (
                  <CardDestino
                    key={destino.id}
                    destino={destino}
                    compativel={idsCompativeis.has(destino.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
