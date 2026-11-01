import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Destino {
  id: number;
  nome: string;
  pais: string;
  estado: string;
  custoMedio: number;
  clima: string;
  melhorEpoca: string;
  pontosTuristicos: string;
  ativo: boolean;
}

interface ApiDestino {
  id: number;
  name: string;
  country: string;
  state: string | null;
  estimated_cost: number | string;
  climate: string | null;
  best_season: string | null;
  tourist_spots: string[] | string | null;
  active: boolean | null;
}

function converterDestino(destino: ApiDestino): Destino {
  let spots: string[] = [];
  if (Array.isArray(destino.tourist_spots)) {
    spots = destino.tourist_spots.map(String);
  } else if (typeof destino.tourist_spots === 'string') {
    try {
      const parsed: unknown = JSON.parse(destino.tourist_spots);
      spots = Array.isArray(parsed) ? parsed.map(String) : [destino.tourist_spots];
    } catch {
      spots = [destino.tourist_spots];
    }
  }

  return {
    id: destino.id,
    nome: destino.name,
    pais: destino.country,
    estado: destino.state || '',
    custoMedio: Number(destino.estimated_cost),
    clima: destino.climate || '',
    melhorEpoca: destino.best_season || '',
    pontosTuristicos: spots.join(', '),
    ativo: destino.active ?? true
  };
}

export function AdminDestinos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [destinoEditando, setDestinoEditando] = useState<Destino | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    pais: '',
    estado: '',
    custoMedio: '',
    clima: '',
    melhorEpoca: '',
    pontosTuristicos: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/destinos', { replace: true });
      return;
    }

    void (async () => {
      try {
        const response = await api('/admin/destinations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível carregar os destinos.');
        }
        setDestinos((data.destinations as ApiDestino[]).map(converterDestino));
      } catch (error) {
        console.error(error);
        setErro(error instanceof Error ? error.message : 'Erro ao carregar destinos.');
      } finally {
        setCarregando(false);
      }
    })();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      const token = localStorage.getItem('token') || '';
      const payload = {
        name: formData.nome.trim(),
        country: formData.pais.trim(),
        state: formData.estado.trim(),
        estimated_cost: Number(formData.custoMedio),
        climate: formData.clima.trim(),
        best_season: formData.melhorEpoca.trim(),
        tourist_spots: formData.pontosTuristicos.split(',').map((spot) => spot.trim()).filter(Boolean)
      };
      const response = await api(
        destinoEditando ? `/admin/destinations/${destinoEditando.id}` : '/admin/destinations',
        {
          method: destinoEditando ? 'PUT' : 'POST',
          token,
          body: JSON.stringify(payload)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível salvar o destino.');
      }

      const destinoSalvo = converterDestino(data.destination as ApiDestino);
      setDestinos((current) => destinoEditando
        ? current.map((destino) => destino.id === destinoSalvo.id ? destinoSalvo : destino)
        : [...current, destinoSalvo]);
      resetForm();
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error ? error.message : 'Erro ao salvar destino.');
    }
  };

  const editarDestino = (destino: Destino) => {
    setDestinoEditando(destino);
    setFormData({
      nome: destino.nome,
      pais: destino.pais,
      estado: destino.estado,
      custoMedio: destino.custoMedio.toString(),
      clima: destino.clima,
      melhorEpoca: destino.melhorEpoca,
      pontosTuristicos: destino.pontosTuristicos
    });
    setModoEdicao(true);
  };

  const alternarDestino = async (destino: Destino) => {
    setErro('');
    try {
      const response = await api(`/admin/destinations/${destino.id}/toggle`, {
        method: 'PATCH',
        token: localStorage.getItem('token') || ''
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível alterar o status do destino.');
      }
      const atualizado = converterDestino(data.destination as ApiDestino);
      setDestinos((current) => current.map((item) => item.id === atualizado.id ? atualizado : item));
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error ? error.message : 'Erro ao alterar status do destino.');
    }
  };

  const excluirDestino = (destino: Destino) => {
    const acao = destino.ativo ? 'desativar' : 'reativar';
    if (confirm(`Tem certeza que deseja ${acao} este destino?`)) {
      void alternarDestino(destino);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      pais: '',
      estado: '',
      custoMedio: '',
      clima: '',
      melhorEpoca: '',
      pontosTuristicos: ''
    });
    setDestinoEditando(null);
    setModoEdicao(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TravelBuddy Admin</h1>
          <button onClick={() => navigate('/orcamento')} className="hover:text-indigo-200">
            Sair do Admin
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {erro && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {erro}
          </div>
        )}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Gerenciar Destinos</h2>
            <p className="text-gray-600">Cadastre e gerencie destinos turísticos</p>
          </div>
          <button
            onClick={() => setModoEdicao(!modoEdicao)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium"
          >
            {modoEdicao ? 'Cancelar' : '+ Novo Destino'}
          </button>
        </div>

        {modoEdicao && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              {destinoEditando ? 'Editar Destino' : 'Cadastrar Novo Destino'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Destino *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País *
                </label>
                <input
                  type="text"
                  value={formData.pais}
                  onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo Médio (R$) *
                </label>
                <input
                  type="number"
                  value={formData.custoMedio}
                  onChange={(e) => setFormData({ ...formData, custoMedio: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clima *
                </label>
                <input
                  type="text"
                  value={formData.clima}
                  onChange={(e) => setFormData({ ...formData, clima: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Melhor Época *
                </label>
                <input
                  type="text"
                  value={formData.melhorEpoca}
                  onChange={(e) => setFormData({ ...formData, melhorEpoca: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pontos Turísticos (separados por vírgula) *
                </label>
                <textarea
                  value={formData.pontosTuristicos}
                  onChange={(e) => setFormData({ ...formData, pontosTuristicos: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              <div className="col-span-2 flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
                >
                  {destinoEditando ? 'Atualizar Destino' : 'Cadastrar Destino'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Localização</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Custo Médio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Clima</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {destinos.map((destino) => (
                <tr key={destino.id} className={`hover:bg-gray-50 ${destino.ativo ? '' : 'opacity-60'}`}>
                  <td className="px-6 py-4 text-gray-800 font-medium">{destino.nome}</td>
                  <td className="px-6 py-4 text-gray-600">{destino.estado}, {destino.pais}</td>
                  <td className="px-6 py-4 text-gray-800">R$ {destino.custoMedio.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-gray-600">{destino.clima}</td>
                  <td className="px-6 py-4 text-gray-600">{destino.ativo ? 'Ativo' : 'Inativo'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarDestino(destino)}
                        className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => excluirDestino(destino)}
                        className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                      >
                        {destino.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!carregando && destinos.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum destino cadastrado ainda
            </div>
          )}
          {carregando && <div className="text-center py-12 text-gray-500">Carregando destinos...</div>}
        </div>
      </div>
    </div>
  );
}
