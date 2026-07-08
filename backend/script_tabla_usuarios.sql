-- Crear la tabla de usuarios

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'ROLE_USER',
  `fecha_registro` datetime NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `nivel_confianza` int DEFAULT '0',
  `experiencia` int NOT NULL DEFAULT '0',
  `nivel` int NOT NULL DEFAULT '1',
  `marcado_sospechoso` tinyint(1) DEFAULT '0',
  `tiendas_creadas_recientes` int DEFAULT '0',
  `ultimo_acceso` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_username` (`username`),
  UNIQUE KEY `UK_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Insertar usuarios de ejemplo (contraseña: 123456 con bcrypt)

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES 
(1, 'admin', 'admin@monstermapa.com', '$2a$10$rJf5YYS2ub8hrI2nrhEpg.zTQJ.eTi6Z.XfLu8qTa7QiKzPzUVjwi', 'Administrador', 'ROLE_ADMIN', '2025-05-06 00:00:00', 1, 100, 50000, 8, 0, 0, NULL),
(2, 'usuario1', 'usuario1@example.com', '$2a$10$rJf5YYS2ub8hrI2nrhEpg.zTQJ.eTi6Z.XfLu8qTa7QiKzPzUVjwi', 'Usuario Uno', 'ROLE_USER', '2025-05-06 00:00:00', 1, 15, 1200, 2, 0, 1, NULL),
(3, 'usuario2', 'usuario2@example.com', '$2a$10$rJf5YYS2ub8hrI2nrhEpg.zTQJ.eTi6Z.XfLu8qTa7QiKzPzUVjwi', 'Usuario Dos', 'ROLE_USER', '2025-05-06 00:00:00', 1, 8, 500, 1, 0, 0, NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;