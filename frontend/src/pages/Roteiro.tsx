import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { generateItinerary, getLatestItineraryByDestination } from "../services/itineraryService";

interface DiaRoteiro {
  day: number;
  title: string;
  activities: string[];
  estimated_cost_day: number;
}

interface ItineraryView {
  id?: number;
  destination_id?: number;
  destination: string;
  duration_days: number;
  num_people: number;
  total_estimated_cost: number;
  activities: DiaRoteiro[];
}

function lerOrcamentoSalvo() {
  try {
    const orcamentoSalvo = localStorage.getItem("travelbuddy_orcamento");
    return orcamentoSalvo
      ? JSON.parse(orcamentoSalvo)
      : { valor: 0, dias: 3, pessoas: 1 };
  } catch {
    return { valor: 0, dias: 3, pessoas: 1 };
  }
}

function normalizarAtividades(value: unknown): DiaRoteiro[] {
  let atividades = value;

  if (typeof atividades === "string") {
    try {
      atividades = JSON.parse(atividades);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(atividades)) return [];

  return atividades.map((item, index) => {
    const atividadeItem = item as Partial<DiaRoteiro> & { activities?: unknown };
    const listaAtividades = Array.isArray(atividadeItem.activities)
      ? atividadeItem.activities.map(String)
      : ["Dia livre para explorar"];

    return {
      day: Number(atividadeItem.day || index + 1),
      title: String(atividadeItem.title || `Dia ${index + 1}`),
      activities: listaAtividades,
      estimated_cost_day: Number(atividadeItem.estimated_cost_day || 0),
    };
  });
}

function normalizarRoteiro(data: unknown): ItineraryView | null {
  if (!data || typeof data !== "object") return null;

  const raw = data as Record<string, unknown>;
  const activities = normalizarAtividades(raw.activities);

  return {
    id: raw.id ? Number(raw.id) : undefined,
    destination_id: raw.destination_id ? Number(raw.destination_id) : undefined,
    destination: String(raw.destination || "Destino"),
    duration_days: Number(raw.duration_days || activities.length || 1),
    num_people: Number(raw.num_people || 1),
    total_estimated_cost: Number(raw.total_estimated_cost || 0),
    activities,
  };
}

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function Roteiro() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const dadosOrcamento = useMemo(() => lerOrcamentoSalvo(), []);
  const [dias, setDias] = useState(String(dadosOrcamento.dias || 3));
  const [roteiro, setRoteiro] = useState<ItineraryView | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function carregarRoteiroSalvo() {
      if (!id) return;

      try {
        setErro("");
        const token = localStorage.getItem("token") || "";
        const data = await getLatestItineraryByDestination(token, Number(id));
        const roteiroNormalizado = normalizarRoteiro(data?.itinerary);

        if (roteiroNormalizado) {
          setRoteiro(roteiroNormalizado);
          setDias(String(roteiroNormalizado.duration_days || dadosOrcamento.dias || 3));
          setMensagem("Roteiro salvo carregado. Você pode gerar novamente sem duplicar.");
        }
      } catch (error) {
        console.error(error);
        setErro(error instanceof Error ? error.message : "Erro ao carregar roteiro salvo.");
      }
    }

    carregarRoteiroSalvo();
  }, [id, dadosOrcamento.dias]);

  async function gerarRoteiro() {
    if (!id) return;

    const numDias = Number(dias);

    if (!numDias || numDias <= 0) {
      setErro("Informe uma duração válida para gerar o roteiro.");
      return;
    }

    try {
      setLoading(true);
      setErro("");
      setMensagem("");

      const token = localStorage.getItem("token") || "";
      const data = await generateItinerary(token, {
        destination_id: Number(id),
        duration_days: numDias,
        budget: Number(dadosOrcamento.valor || 0),
        num_people: Number(dadosOrcamento.pessoas || 1),
      });

      const roteiroNormalizado = normalizarRoteiro(data.itinerary);

      if (data.warning) {
        setMensagem(data.warning);
      }

      if (roteiroNormalizado) {
        setRoteiro(roteiroNormalizado);
        setMensagem(data.message || "Roteiro gerado e salvo com sucesso!");
      } else if (!data.warning) {
        setErro("Não foi possível montar o roteiro deste destino.");
      }
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao gerar roteiro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          <button
            onClick={() => navigate(`/destino/${id}`)}
            className="mb-5 text-gray-600 hover:text-indigo-600 font-semibold"
          >
            ← Voltar para o destino
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wide">
              Roteiro de Viagem
            </span>

            <h1 className="text-3xl font-bold text-gray-800 mt-2 mb-2">
              Roteiro {roteiro ? `para ${roteiro.destination}` : "personalizado"}
            </h1>

            <p className="text-gray-600 mb-6">
              Informe a duração e clique em gerar. O sistema salva apenas uma versão de roteiro para o mesmo destino, evitando repetição.
            </p>

            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                {mensagem}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-indigo-50 p-4 rounded-xl">
                <span className="text-sm text-gray-500">Orçamento salvo</span>
                <strong className="block text-xl text-indigo-700">
                  {moeda(Number(dadosOrcamento.valor || 0))}
                </strong>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl">
                <span className="text-sm text-gray-500">Pessoas</span>
                <strong className="block text-xl text-purple-700">
                  {Number(dadosOrcamento.pessoas || 1)} pessoa(s)
                </strong>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <span className="text-sm text-gray-500">Duração</span>
                <strong className="block text-xl text-blue-700">
                  {dias || 0} dia(s)
                </strong>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <label className="text-gray-700 font-medium" htmlFor="dias-roteiro">
                Duração da viagem:
              </label>

              <input
                id="dias-roteiro"
                type="number"
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                min="1"
                max="30"
                className="px-4 py-2 border border-gray-300 rounded-lg w-28"
              />

              <span className="text-gray-600">dias</span>

              <button
                onClick={gerarRoteiro}
                disabled={loading}
                className="md:ml-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-bold"
              >
                {loading ? "Gerando..." : roteiro ? "Gerar Novamente" : "Gerar Roteiro"}
              </button>
            </div>

            {roteiro && (
              <div className="bg-indigo-50 p-4 rounded-lg mt-6">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-lg font-semibold text-gray-700">Custo Total Estimado</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {moeda(roteiro.total_estimated_cost)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {roteiro && roteiro.activities.length > 0 && (
            <div className="space-y-6">
              {roteiro.activities.map((diaRoteiro) => (
                <div key={diaRoteiro.day} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">{diaRoteiro.title}</h2>

                  <div className="space-y-3">
                    {diaRoteiro.activities.map((atividade, index) => (
                      <div key={`${diaRoteiro.day}-${index}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <span className="text-indigo-600 font-bold">✓</span>
                        <span className="text-gray-800">{atividade}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <span className="text-gray-700 font-semibold">
                      Estimativa do dia: {moeda(diaRoteiro.estimated_cost_day)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={() => navigate("/favoritos")}
              className="flex-1 bg-indigo-600 text-white py-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium text-lg"
            >
              Ver Roteiros Salvos
            </button>

            <button
              onClick={() => navigate("/destinos")}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
            >
              Buscar Outros Destinos
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
