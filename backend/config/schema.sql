CREATE DATABASE IF NOT EXISTS travelbuddy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travelbuddy;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  plan ENUM('free', 'premium') DEFAULT 'free',
  last_budget DECIMAL(10,2) NULL,
  subscription_expires_at DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS destinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NULL,
  description TEXT NULL,
  estimated_cost DECIMAL(10,2) NOT NULL COMMENT 'Custo estimado por pessoa em R$',
  climate VARCHAR(100) NULL,
  best_season VARCHAR(100) NULL,
  image_url VARCHAR(500) NULL,
  tourist_spots JSON NULL COMMENT 'Array de pontos turísticos',
  active TINYINT(1) DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT NOT NULL,
  notes TEXT NULL,
  budget_value DECIMAL(10,2) NULL,
  budget_days INT NULL,
  budget_people INT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, destination_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS itineraries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  destination_id INT NOT NULL,
  duration_days INT NOT NULL,
  num_people INT DEFAULT 1,
  budget DECIMAL(10,2) NOT NULL,
  activities JSON NULL COMMENT 'Array de atividades por dia',
  total_estimated_cost DECIMAL(10,2) NULL,
  UNIQUE KEY unique_itinerary (user_id, destination_id, duration_days, num_people),
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE
);

-- Destinos iniciais com imagens locais servidas pelo frontend em /public/destinations.
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Rio de Janeiro', 'Brasil', 'RJ', 'Cidade Maravilhosa com praias famosas, montanhas, vida urbana intensa e pontos turísticos conhecidos no mundo todo.', 2500.00, 'Tropical', 'Abril a outubro', '/destinations/rio-de-janeiro.png', JSON_ARRAY('Cristo Redentor', 'Pão de Açúcar', 'Copacabana', 'Maracanã', 'Jardim Botânico')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Rio de Janeiro');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Florianópolis', 'Brasil', 'SC', 'Destino com praias, trilhas, lagoas e ótima estrutura para quem procura natureza sem abrir mão de conforto.', 1800.00, 'Subtropical', 'Dezembro a março', '/destinations/florianopolis.png', JSON_ARRAY('Lagoa da Conceição', 'Praia do Campeche', 'Jurerê', 'Santo Antônio de Lisboa')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Florianópolis');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Chapada Diamantina', 'Brasil', 'BA', 'Destino ideal para ecoturismo, trilhas, cachoeiras, grutas e paisagens naturais marcantes.', 1500.00, 'Tropical de altitude', 'Abril a setembro', '/destinations/chapada-diamantina.png', JSON_ARRAY('Morro do Pai Inácio', 'Cachoeira da Fumaça', 'Poço Azul', 'Gruta da Lapa Doce')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Chapada Diamantina');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Gramado', 'Brasil', 'RS', 'Cidade serrana com clima romântico, gastronomia, arquitetura europeia e atrações para famílias.', 2200.00, 'Frio serrano', 'Maio a agosto', '/destinations/gramado.png', JSON_ARRAY('Lago Negro', 'Mini Mundo', 'Rua Coberta', 'Snowland')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Gramado');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Manaus', 'Brasil', 'AM', 'Porta de entrada para a Amazônia, com cultura, rios, floresta e experiências ligadas à natureza.', 1700.00, 'Equatorial', 'Julho a novembro', '/destinations/manaus.png', JSON_ARRAY('Teatro Amazonas', 'Encontro das Águas', 'MUSA', 'Mercado Municipal')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Manaus');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Praia do Rosa', 'Brasil', 'SC', 'Praia charmosa, boa para descanso, surf, natureza e viagens mais econômicas no litoral sul.', 1400.00, 'Litorâneo', 'Novembro a março', '/destinations/praia-do-rosa.png', JSON_ARRAY('Lagoa do Meio', 'Praia Vermelha', 'Trilha do Rosa', 'Observação de baleias')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Praia do Rosa');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Fernando de Noronha', 'Brasil', 'PE', 'Arquipélago paradisíaco com praias preservadas, mergulho, trilhas e paisagens exclusivas.', 5200.00, 'Tropical oceânico', 'Agosto a outubro', '/destinations/fernando-de-noronha.svg', JSON_ARRAY('Baía do Sancho', 'Baía dos Porcos', 'Projeto Tamar', 'Mirante Dois Irmãos')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Fernando de Noronha');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Bonito', 'Brasil', 'MS', 'Destino de natureza com rios cristalinos, flutuação, grutas e passeios de ecoturismo organizados.', 2600.00, 'Tropical', 'Maio a setembro', '/destinations/bonito-ms.png', JSON_ARRAY('Rio da Prata', 'Gruta do Lago Azul', 'Aquário Natural', 'Boca da Onça')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Bonito');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Foz do Iguaçu', 'Brasil', 'PR', 'Cidade conhecida pelas Cataratas do Iguaçu, parques, compras e atrações de fronteira.', 1900.00, 'Subtropical', 'Março a novembro', '/destinations/foz-do-iguacu.png', JSON_ARRAY('Cataratas do Iguaçu', 'Parque das Aves', 'Itaipu', 'Marco das Três Fronteiras')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Foz do Iguaçu');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Lençóis Maranhenses', 'Brasil', 'MA', 'Paisagem única de dunas e lagoas naturais, excelente para quem busca uma viagem diferente.', 2800.00, 'Tropical', 'Junho a setembro', '/destinations/lencois-maranhenses.png', JSON_ARRAY('Lagoa Azul', 'Lagoa Bonita', 'Atins', 'Rio Preguiças')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Lençóis Maranhenses');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'Ouro Preto', 'Brasil', 'MG', 'Destino histórico em Minas Gerais, com igrejas, museus, ladeiras e arquitetura colonial.', 900.00, 'Tropical de altitude', 'Abril a setembro', '/destinations/ouro-preto.png', JSON_ARRAY('Praça Tiradentes', 'Museu da Inconfidência', 'Igreja São Francisco', 'Mina da Passagem')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'Ouro Preto');
INSERT INTO destinations (name, country, state, description, estimated_cost, climate, best_season, image_url, tourist_spots)
SELECT 'São Paulo', 'Brasil', 'SP', 'Grande centro urbano com gastronomia, museus, eventos, compras e vida cultural intensa.', 2100.00, 'Subtropical', 'Março a novembro', '/destinations/sao-paulo.png', JSON_ARRAY('Avenida Paulista', 'MASP', 'Parque Ibirapuera', 'Mercado Municipal')
WHERE NOT EXISTS (SELECT 1 FROM destinations WHERE name = 'São Paulo');

UPDATE destinations SET image_url = '/destinations/rio-de-janeiro.png' WHERE name = 'Rio de Janeiro';
UPDATE destinations SET image_url = '/destinations/florianopolis.png' WHERE name = 'Florianópolis';
UPDATE destinations SET image_url = '/destinations/chapada-diamantina.png' WHERE name = 'Chapada Diamantina';
UPDATE destinations SET image_url = '/destinations/gramado.png' WHERE name = 'Gramado';
UPDATE destinations SET image_url = '/destinations/manaus.png' WHERE name = 'Manaus';
UPDATE destinations SET image_url = '/destinations/praia-do-rosa.png' WHERE name = 'Praia do Rosa';
UPDATE destinations SET image_url = '/destinations/bonito-ms.png' WHERE name = 'Bonito';
UPDATE destinations SET image_url = '/destinations/foz-do-iguacu.png' WHERE name = 'Foz do Iguaçu';
UPDATE destinations SET image_url = '/destinations/lencois-maranhenses.png' WHERE name = 'Lençóis Maranhenses';
UPDATE destinations SET image_url = '/destinations/ouro-preto.png' WHERE name = 'Ouro Preto';
UPDATE destinations SET image_url = '/destinations/sao-paulo.png' WHERE name = 'São Paulo';
