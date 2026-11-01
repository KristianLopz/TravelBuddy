const { Destination } = require('../models/Destination');

const seedDestinations = [
  {
    name: 'Rio de Janeiro',
    country: 'Brasil',
    state: 'RJ',
    description: 'Cidade Maravilhosa com praias famosas, montanhas, vida urbana intensa e pontos turísticos conhecidos no mundo todo.',
    estimated_cost: 2500.00,
    climate: 'Tropical',
    best_season: 'Abril a outubro',
    image_url: '/destinations/rio-de-janeiro.png',
    tourist_spots: ['Cristo Redentor', 'Pão de Açúcar', 'Copacabana', 'Maracanã', 'Jardim Botânico'],
  },
  {
    name: 'Florianópolis',
    country: 'Brasil',
    state: 'SC',
    description: 'Destino com praias, trilhas, lagoas e ótima estrutura para quem procura natureza sem abrir mão de conforto.',
    estimated_cost: 1800.00,
    climate: 'Subtropical',
    best_season: 'Dezembro a março',
    image_url: '/destinations/florianopolis.png',
    tourist_spots: ['Lagoa da Conceição', 'Praia do Campeche', 'Jurerê', 'Santo Antônio de Lisboa'],
  },
  {
    name: 'Chapada Diamantina',
    country: 'Brasil',
    state: 'BA',
    description: 'Destino ideal para ecoturismo, trilhas, cachoeiras, grutas e paisagens naturais marcantes.',
    estimated_cost: 1500.00,
    climate: 'Tropical de altitude',
    best_season: 'Abril a setembro',
    image_url: '/destinations/chapada-diamantina.png',
    tourist_spots: ['Morro do Pai Inácio', 'Cachoeira da Fumaça', 'Poço Azul', 'Gruta da Lapa Doce'],
  },
  {
    name: 'Gramado',
    country: 'Brasil',
    state: 'RS',
    description: 'Cidade serrana com clima romântico, gastronomia, arquitetura europeia e atrações para famílias.',
    estimated_cost: 2200.00,
    climate: 'Frio serrano',
    best_season: 'Maio a agosto',
    image_url: '/destinations/gramado.png',
    tourist_spots: ['Lago Negro', 'Mini Mundo', 'Rua Coberta', 'Snowland'],
  },
  {
    name: 'Manaus',
    country: 'Brasil',
    state: 'AM',
    description: 'Porta de entrada para a Amazônia, com cultura, rios, floresta e experiências ligadas à natureza.',
    estimated_cost: 1700.00,
    climate: 'Equatorial',
    best_season: 'Julho a novembro',
    image_url: '/destinations/manaus.png',
    tourist_spots: ['Teatro Amazonas', 'Encontro das Águas', 'MUSA', 'Mercado Municipal'],
  },
  {
    name: 'Praia do Rosa',
    country: 'Brasil',
    state: 'SC',
    description: 'Praia charmosa, boa para descanso, surf, natureza e viagens mais econômicas no litoral sul.',
    estimated_cost: 1400.00,
    climate: 'Litorâneo',
    best_season: 'Novembro a março',
    image_url: '/destinations/praia-do-rosa.png',
    tourist_spots: ['Lagoa do Meio', 'Praia Vermelha', 'Trilha do Rosa', 'Observação de baleias'],
  },
  {
    name: 'Fernando de Noronha',
    country: 'Brasil',
    state: 'PE',
    description: 'Arquipélago paradisíaco com praias preservadas, mergulho, trilhas e paisagens exclusivas.',
    estimated_cost: 5200.00,
    climate: 'Tropical oceânico',
    best_season: 'Agosto a outubro',
    image_url: '/destinations/fernando-de-noronha.svg',
    tourist_spots: ['Baía do Sancho', 'Baía dos Porcos', 'Projeto Tamar', 'Mirante Dois Irmãos'],
  },
  {
    name: 'Bonito',
    country: 'Brasil',
    state: 'MS',
    description: 'Destino de natureza com rios cristalinos, flutuação, grutas e passeios de ecoturismo organizados.',
    estimated_cost: 2600.00,
    climate: 'Tropical',
    best_season: 'Maio a setembro',
    image_url: '/destinations/bonito-ms.png',
    tourist_spots: ['Rio da Prata', 'Gruta do Lago Azul', 'Aquário Natural', 'Boca da Onça'],
  },
  {
    name: 'Foz do Iguaçu',
    country: 'Brasil',
    state: 'PR',
    description: 'Cidade conhecida pelas Cataratas do Iguaçu, parques, compras e atrações de fronteira.',
    estimated_cost: 1900.00,
    climate: 'Subtropical',
    best_season: 'Março a novembro',
    image_url: '/destinations/foz-do-iguacu.png',
    tourist_spots: ['Cataratas do Iguaçu', 'Parque das Aves', 'Itaipu', 'Marco das Três Fronteiras'],
  },
  {
    name: 'Lençóis Maranhenses',
    country: 'Brasil',
    state: 'MA',
    description: 'Paisagem única de dunas e lagoas naturais, excelente para quem busca uma viagem diferente.',
    estimated_cost: 2800.00,
    climate: 'Tropical',
    best_season: 'Junho a setembro',
    image_url: '/destinations/lencois-maranhenses.png',
    tourist_spots: ['Lagoa Azul', 'Lagoa Bonita', 'Atins', 'Rio Preguiças'],
  },
  {
    name: 'Ouro Preto',
    country: 'Brasil',
    state: 'MG',
    description: 'Destino histórico em Minas Gerais, com igrejas, museus, ladeiras e arquitetura colonial.',
    estimated_cost: 900.00,
    climate: 'Tropical de altitude',
    best_season: 'Abril a setembro',
    image_url: '/destinations/ouro-preto.png',
    tourist_spots: ['Praça Tiradentes', 'Museu da Inconfidência', 'Igreja São Francisco', 'Mina da Passagem'],
  },
  {
    name: 'São Paulo',
    country: 'Brasil',
    state: 'SP',
    description: 'Grande centro urbano com gastronomia, museus, eventos, compras e vida cultural intensa.',
    estimated_cost: 2100.00,
    climate: 'Subtropical',
    best_season: 'Março a novembro',
    image_url: '/destinations/sao-paulo.png',
    tourist_spots: ['Avenida Paulista', 'MASP', 'Parque Ibirapuera', 'Mercado Municipal'],
  },
];

async function ensureSeedDestinations() {
  for (const data of seedDestinations) {
    const existing = await Destination.findFirst({
      where: { name: data.name, country: data.country }
    });

    if (!existing) {
      await Destination.create({ data });
      continue;
    }

    await Destination.update({
      where: { id: existing.id },
      data: {
        ...data,
        active: true
      }
    });
  }
}

module.exports = { ensureSeedDestinations, seedDestinations };
