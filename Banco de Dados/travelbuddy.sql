-- --------------------------------------------------------
-- Servidor:                     127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- OS do Servidor:               Win64
-- HeidiSQL Versão:              12.20.0.7320
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Copiando estrutura do banco de dados para travelbuddy
CREATE DATABASE IF NOT EXISTS `travelbuddy` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `travelbuddy`;

-- Copiando estrutura para tabela travelbuddy.destinations
CREATE TABLE IF NOT EXISTS `destinations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `country` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `estimated_cost` decimal(10,2) NOT NULL COMMENT 'Custo estimado por pessoa em R$',
  `climate` varchar(100) DEFAULT NULL,
  `best_season` varchar(100) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `tourist_spots` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de pontos turísticos' CHECK (json_valid(`tourist_spots`)),
  `active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela travelbuddy.destinations: ~12 rows (aproximadamente)
INSERT INTO `destinations` (`id`, `name`, `country`, `state`, `description`, `estimated_cost`, `climate`, `best_season`, `image_url`, `tourist_spots`, `active`, `createdAt`, `updatedAt`) VALUES
	(1, 'Rio de Janeiro', 'Brasil', 'RJ', 'Cidade Maravilhosa com praias famosas, montanhas, vida urbana intensa e pontos turísticos conhecidos no mundo todo.', 2500.00, 'Tropical', 'Abril a outubro', '/destinations/rio-de-janeiro.png', '["Cristo Redentor","Pão de Açúcar","Copacabana","Maracanã","Jardim Botânico"]', 1, '2026-07-01 18:19:23', '2026-07-01 21:25:18'),
	(2, 'Florianópolis', 'Brasil', 'SC', 'Destino com praias, trilhas, lagoas e ótima estrutura para quem procura natureza sem abrir mão de conforto.', 1800.00, 'Subtropical', 'Dezembro a março', '/destinations/florianopolis.png', '["Lagoa da Conceição","Praia do Campeche","Jurerê","Santo Antônio de Lisboa"]', 1, '2026-07-01 18:19:23', '2026-07-01 21:25:18'),
	(3, 'Chapada Diamantina', 'Brasil', 'BA', 'Destino ideal para ecoturismo, trilhas, cachoeiras, grutas e paisagens naturais marcantes.', 1500.00, 'Tropical de altitude', 'Abril a setembro', '/destinations/chapada-diamantina.png', '["Morro do Pai Inácio","Cachoeira da Fumaça","Poço Azul","Gruta da Lapa Doce"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(4, 'Gramado', 'Brasil', 'RS', 'Cidade serrana com clima romântico, gastronomia, arquitetura europeia e atrações para famílias.', 2200.00, 'Frio serrano', 'Maio a agosto', '/destinations/gramado.png', '["Lago Negro","Mini Mundo","Rua Coberta","Snowland"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(5, 'Manaus', 'Brasil', 'AM', 'Porta de entrada para a Amazônia, com cultura, rios, floresta e experiências ligadas à natureza.', 1700.00, 'Equatorial', 'Julho a novembro', '/destinations/manaus.png', '["Teatro Amazonas","Encontro das Águas","MUSA","Mercado Municipal"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(6, 'Praia do Rosa', 'Brasil', 'SC', 'Praia charmosa, boa para descanso, surf, natureza e viagens mais econômicas no litoral sul.', 1400.00, 'Litorâneo', 'Novembro a março', '/destinations/praia-do-rosa.png', '["Lagoa do Meio","Praia Vermelha","Trilha do Rosa","Observação de baleias"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(7, 'Fernando de Noronha', 'Brasil', 'PE', 'Arquipélago paradisíaco com praias preservadas, mergulho, trilhas e paisagens exclusivas.', 5200.00, 'Tropical oceânico', 'Agosto a outubro', '/destinations/fernando-de-noronha.svg', '["Baía do Sancho","Baía dos Porcos","Projeto Tamar","Mirante Dois Irmãos"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(8, 'Bonito', 'Brasil', 'MS', 'Destino de natureza com rios cristalinos, flutuação, grutas e passeios de ecoturismo organizados.', 2600.00, 'Tropical', 'Maio a setembro', '/destinations/bonito-ms.png', '["Rio da Prata","Gruta do Lago Azul","Aquário Natural","Boca da Onça"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(9, 'Foz do Iguaçu', 'Brasil', 'PR', 'Cidade conhecida pelas Cataratas do Iguaçu, parques, compras e atrações de fronteira.', 1900.00, 'Subtropical', 'Março a novembro', '/destinations/foz-do-iguacu.png', '["Cataratas do Iguaçu","Parque das Aves","Itaipu","Marco das Três Fronteiras"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(10, 'Lençóis Maranhenses', 'Brasil', 'MA', 'Paisagem única de dunas e lagoas naturais, excelente para quem busca uma viagem diferente.', 2800.00, 'Tropical', 'Junho a setembro', '/destinations/lencois-maranhenses.png', '["Lagoa Azul","Lagoa Bonita","Atins","Rio Preguiças"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(11, 'Ouro Preto', 'Brasil', 'MG', 'Destino histórico em Minas Gerais, com igrejas, museus, ladeiras e arquitetura colonial.', 900.00, 'Tropical de altitude', 'Abril a setembro', '/destinations/ouro-preto.png', '["Praça Tiradentes","Museu da Inconfidência","Igreja São Francisco","Mina da Passagem"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18'),
	(12, 'São Paulo', 'Brasil', 'SP', 'Grande centro urbano com gastronomia, museus, eventos, compras e vida cultural intensa.', 2100.00, 'Subtropical', 'Março a novembro', '/destinations/sao-paulo.png', '["Avenida Paulista","MASP","Parque Ibirapuera","Mercado Municipal"]', 1, '2026-07-01 18:19:24', '2026-07-01 21:25:18');

-- Copiando estrutura para tabela travelbuddy.favorites
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `destination_id` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `budget_value` decimal(10,2) DEFAULT NULL,
  `budget_days` int(11) DEFAULT NULL,
  `budget_people` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_favorite` (`user_id`,`destination_id`),
  KEY `destination_id` (`destination_id`),
  CONSTRAINT `favorites_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `favorites_ibfk_4` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando estrutura para tabela travelbuddy.itineraries
CREATE TABLE IF NOT EXISTS `itineraries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `destination_id` int(11) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `num_people` int(11) DEFAULT 1,
  `budget` decimal(10,2) NOT NULL,
  `activities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array de atividades por dia' CHECK (json_valid(`activities`)),
  `total_estimated_cost` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_itinerary` (`user_id`,`destination_id`,`duration_days`,`num_people`),
  KEY `destination_id` (`destination_id`),
  CONSTRAINT `itineraries_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `itineraries_ibfk_4` FOREIGN KEY (`destination_id`) REFERENCES `destinations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Copiando dados para a tabela travelbuddy.itineraries: ~0 rows (aproximadamente)

-- Copiando estrutura para tabela travelbuddy.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `plan` enum('free','premium') DEFAULT 'free',
  `last_budget` decimal(10,2) DEFAULT NULL,
  `subscription_expires_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
