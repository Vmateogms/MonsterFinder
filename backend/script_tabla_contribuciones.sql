-- Tabla para registrar contribuciones de usuarios (creación/edición de tiendas)

DROP TABLE IF EXISTS `tiendas_contribuciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tiendas_contribuciones` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint NOT NULL,
  `tienda_id` bigint NOT NULL,
  `tipo_contribucion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_contribucion` datetime NOT NULL,
  `detalles` text COLLATE utf8mb4_unicode_ci,
  `reportada` tinyint(1) DEFAULT '0',
  `verificaciones` int DEFAULT '0',
  `rechazos` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `FK_usuario_contribucion` (`usuario_id`),
  KEY `FK_tienda_contribucion` (`tienda_id`),
  CONSTRAINT `FK_usuario_contribucion` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `FK_tienda_contribucion` FOREIGN KEY (`tienda_id`) REFERENCES `tiendas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Insertar algunos datos de ejemplo

LOCK TABLES `tiendas_contribuciones` WRITE;
/*!40000 ALTER TABLE `tiendas_contribuciones` DISABLE KEYS */;
INSERT INTO `tiendas_contribuciones` VALUES 
(1, 1, 1, 'CREACION', '2025-05-01 10:30:00', 'Creación inicial de tienda', 0, 3, 0),
(2, 2, 2, 'CREACION', '2025-05-02 15:45:00', 'Creación inicial de tienda', 0, 2, 0),
(3, 1, 1, 'ACTUALIZACION_PRECIO', '2025-05-03 09:15:00', 'Actualización de precios de Monster', 0, 1, 0);
/*!40000 ALTER TABLE `tiendas_contribuciones` ENABLE KEYS */;
UNLOCK TABLES; 