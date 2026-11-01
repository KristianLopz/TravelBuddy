import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import {
  listFavorites,
  removeFavorite,
  type FavoriteItem,
} from "../services/favoriteService";

function moeda(valor: number | string | null | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataPtBr(value?: string) {
  if (!value) return "Não informada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informada";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function calcularValorEstimado(favorite: FavoriteItem) {
  if (favorite.budget_value) return Number(favorite.budget_value);

  const custo = Number(favorite.Destination?.estimated_cost || 0);
  const pessoas = Number(favorite.budget_people || 1);
  return custo * pessoas;
}

export default function Favoritos() {
  const navigate = useNavigate();

  const [favoritos, setFavoritos] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    carregarFavoritos();
  }, []);

  async function carregarFavoritos() {
    try {
      setLoading(true);
      setErro("");
      setMensagem("");

      const token = localStorage.getItem("token") || "";
      const data = await listFavorites(token);
      setFavoritos(data.favorites || []);
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error ? error.message : "Erro ao carregar favoritos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoverFavorito(favoriteId: number) {
    try {
      setRemovendoId(favoriteId);
      setErro("");
      setMensagem("");

      const token = localStorage.getItem("token") || "";
      const data = await removeFavorite(token, favoriteId);

      setFavoritos((atuais) => atuais.filter((item) => item.id !== favoriteId));
      setMensagem(data.message || "Favorito removido com sucesso.");
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error ? error.message : "Erro ao remover favorito.");
    } finally {
      setRemovendoId(null);
    }
  }

  const totalEstimado = useMemo(
    () => favoritos.reduce((total, item) => total + calcularValorEstimado(item), 0),
    [favoritos]
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-lg px-8 py-6 text-center border border-gray-100">
            <div className="h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Carregando favoritos...</h2>
            <p className="text-gray-500 text-sm mt-1">Buscando suas viagens salvas.</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <section className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-100 border-b border-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <button
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-semibold transition-colors"
            >
              ← Voltar
            </button>

            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center">
              <div>
                <span className="inline-block bg-white/80 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full mb-4 shadow-sm">
                  Favoritos
                </span>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                  Minhas viagens favoritas
                </h1>

                <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                  Esta tela reúne todas as viagens marcadas como favoritas para acesso rápido. Assim você consegue voltar nos destinos que combinam com seu orçamento sem precisar procurar tudo novamente.
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/70">
                <p className="text-sm text-gray-500 font-semibold">Resumo dos favoritos</p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <span className="text-3xl font-extrabold text-indigo-600">{favoritos.length}</span>
                    <p className="text-gray-600 text-sm">viagem(ns)</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <span className="text-xl font-extrabold text-purple-700">{moeda(totalEstimado)}</span>
                    <p className="text-gray-600 text-sm">estimado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span>{erro}</span>
              <button
                onClick={carregarFavoritos}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {mensagem && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
              {mensagem}
            </div>
          )}

          {favoritos.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-14 text-center max-w-3xl mx-auto">
              <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center text-5xl shadow-inner">
                ♡
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
                Você ainda não possui viagens favoritas.
              </h2>

              <p className="text-gray-600 text-lg mb-8">
                Marque uma viagem como favorita para encontrá-la aqui.
              </p>

              <button
                onClick={() => navigate("/destinos")}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all hover:-translate-y-0.5 font-bold shadow-md"
              >
                Explorar destinos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {favoritos.map((favorite) => {
                const destino = favorite.Destination;
                const valorEstimado = calcularValorEstimado(favorite);
                const pessoas = favorite.budget_people || 1;
                const dias = favorite.budget_days;

                return (
                  <article
                    key={favorite.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 transition-all hover:-translate-y-1 group"
                  >
                    <div className="relative">
                      <img
                        src={destino.image_url || "/destinations/rio-de-janeiro.png"}
                        alt={destino.name}
                        className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <button
                        onClick={() => handleRemoverFavorito(favorite.id)}
                        disabled={removendoId === favorite.id}
                        className="absolute top-4 right-4 h-12 w-12 rounded-full bg-red-500 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-red-600 hover:scale-105 transition-all disabled:opacity-60"
                        title="Remover dos favoritos"
                      >
                        {removendoId === favorite.id ? "…" : "♥"}
                      </button>

                      <span className="absolute left-4 bottom-4 bg-white/95 text-indigo-700 text-xs font-extrabold px-3 py-1 rounded-full shadow">
                        Favorita
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-extrabold text-gray-900 mb-1">
                        {destino.name}
                      </h3>

                      <p className="text-gray-500 mb-5">
                        {destino.state ? `${destino.state}, ` : ""}{destino.country}
                      </p>

                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between gap-4 bg-indigo-50 rounded-xl p-3">
                          <span className="text-gray-600">Valor estimado</span>
                          <strong className="text-indigo-700">{moeda(valorEstimado)}</strong>
                        </div>

                        <div className="flex justify-between gap-4 bg-gray-50 rounded-xl p-3">
                          <span className="text-gray-600">Data do orçamento</span>
                          <strong className="text-gray-800">{dataPtBr(favorite.createdAt)}</strong>
                        </div>

                        <div className="flex justify-between gap-4 bg-gray-50 rounded-xl p-3">
                          <span className="text-gray-600">Pessoas / dias</span>
                          <strong className="text-gray-800">
                            {pessoas} pessoa(s){dias ? ` • ${dias} dia(s)` : ""}
                          </strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => navigate(`/destino/${destino.id}`)}
                          className="bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-bold"
                        >
                          Ver destino
                        </button>

                        <button
                          onClick={() => navigate(`/roteiro/${destino.id}`)}
                          className="border border-indigo-600 text-indigo-600 py-3 rounded-xl hover:bg-indigo-50 transition-colors font-bold"
                        >
                          Roteiro
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </MainLayout>
  );
}
