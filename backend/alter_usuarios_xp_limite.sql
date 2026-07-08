-- Script para añadir campos de control de límite diario de XP

-- Comprobar si las columnas ya existen antes de añadirlas
SET @tableName = 'usuarios';
SET @columnName1 = 'xp_ganada_hoy';
SET @columnName2 = 'ultimo_dia_actividad';
SET @columnExists1 = 0;
SET @columnExists2 = 0;

-- Verificar si xp_ganada_hoy existe
SELECT COUNT(*) INTO @columnExists1 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = @tableName 
  AND COLUMN_NAME = @columnName1;

-- Verificar si ultimo_dia_actividad existe
SELECT COUNT(*) INTO @columnExists2
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = @tableName 
  AND COLUMN_NAME = @columnName2;

-- Añadir xp_ganada_hoy si no existe
SET @query1 = IF(@columnExists1 = 0,
    CONCAT('ALTER TABLE ', @tableName, ' ADD COLUMN ', @columnName1, ' INT NOT NULL DEFAULT 0 COMMENT "Experiencia ganada en el día actual"'),
    'SELECT "La columna xp_ganada_hoy ya existe en la tabla"');

PREPARE stmt FROM @query1;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Añadir ultimo_dia_actividad si no existe
SET @query2 = IF(@columnExists2 = 0,
    CONCAT('ALTER TABLE ', @tableName, ' ADD COLUMN ', @columnName2, ' DATETIME NULL COMMENT "Último día en que el usuario ganó experiencia"'),
    'SELECT "La columna ultimo_dia_actividad ya existe en la tabla"');

PREPARE stmt FROM @query2;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inicializar las columnas con valores por defecto
UPDATE usuarios SET xp_ganada_hoy = 0 WHERE xp_ganada_hoy IS NULL;
UPDATE usuarios SET ultimo_dia_actividad = NOW() WHERE ultimo_dia_actividad IS NULL;

-- Mostrar estado actual
SELECT id, username, experiencia, nivel, xp_ganada_hoy, ultimo_dia_actividad FROM usuarios LIMIT 10; 