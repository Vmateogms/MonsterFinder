-- Script para añadir la columna de usuarioCreador a la tabla de tiendas existente

-- Comprobar si la columna ya existe antes de añadirla
SET @tableName = 'tiendas';
SET @columnName = 'usuario_creador';
SET @columnExists = 0;

SELECT COUNT(*) INTO @columnExists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = @tableName 
  AND COLUMN_NAME = @columnName;

-- Si la columna no existe, añadirla
SET @query = IF(@columnExists = 0,
    CONCAT('ALTER TABLE ', @tableName, ' ADD COLUMN ', @columnName, ' VARCHAR(255) NULL COMMENT "Nombre del usuario que creó la tienda"'),
    'SELECT "La columna ya existe en la tabla"');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Para las tiendas existentes, establecer un valor por defecto
UPDATE tiendas SET usuario_creador = 'admin' WHERE usuario_creador IS NULL;

-- Mostrar estado actual
SELECT id, nombre, usuario_creador FROM tiendas LIMIT 10; 