-- Tabla para guardar las tiendas favoritas de los usuarios

DROP TABLE IF EXISTS `usuario_tiendas_favoritas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_tiendas_favoritas` (
  `usuario_id` bigint NOT NULL,
  `tienda_id` bigint NOT NULL,
  PRIMARY KEY (`usuario_id`, `tienda_id`),
  KEY `FK_tienda_favorita` (`tienda_id`),
  CONSTRAINT `FK_usuario_favorito` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_tienda_favorita` FOREIGN KEY (`tienda_id`) REFERENCES `tiendas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */; 