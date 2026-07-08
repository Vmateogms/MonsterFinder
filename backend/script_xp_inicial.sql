-- Script para corregir/inicializar experiencia de usuarios

-- Desactivar temporalmente el modo seguro
SET SQL_SAFE_UPDATES = 0;

-- 1. Mostrar usuarios actuales con su experiencia
SELECT id, username, experiencia, nivel FROM usuarios;

-- 2. Actualizar experiencia basada en contribuciones (por si no se ha registrado correctamente)
UPDATE usuarios u
SET experiencia = (
    SELECT COUNT(*) * 1000 
    FROM tiendas_contribuciones c 
    WHERE c.usuario_id = u.id AND c.tipo_contribucion = 'CREACION'
) + (
    SELECT COUNT(*) * 300 
    FROM tiendas_contribuciones c 
    WHERE c.usuario_id = u.id AND c.tipo_contribucion = 'AÑADIR_PRODUCTO'
) + (
    SELECT COUNT(*) * 200 
    FROM tiendas_contribuciones c 
    WHERE c.usuario_id = u.id AND c.tipo_contribucion = 'ACTUALIZACION_PRECIO'
);

-- 3. Actualizar nivel basado en la nueva progresión personalizada
-- Nivel 1: 0-999 XP
UPDATE usuarios SET nivel = 1 WHERE id > 0 AND experiencia < 1000;

-- Nivel 2: 1000-1999 XP
UPDATE usuarios SET nivel = 2 WHERE id > 0 AND experiencia >= 1000 AND experiencia < 2000;

-- Nivel 3: 2000-4999 XP
UPDATE usuarios SET nivel = 3 WHERE id > 0 AND experiencia >= 2000 AND experiencia < 5000;

-- Nivel 4: 5000-7999 XP
UPDATE usuarios SET nivel = 4 WHERE id > 0 AND experiencia >= 5000 AND experiencia < 8000;

-- Nivel 5: 8000-11999 XP
UPDATE usuarios SET nivel = 5 WHERE id > 0 AND experiencia >= 8000 AND experiencia < 12000;

-- Nivel 6: 12000-15999 XP
UPDATE usuarios SET nivel = 6 WHERE id > 0 AND experiencia >= 12000 AND experiencia < 16000;

-- Nivel 7: 16000-19999 XP
UPDATE usuarios SET nivel = 7 WHERE id > 0 AND experiencia >= 16000 AND experiencia < 20000;

-- Nivel 8: 20000-24999 XP
UPDATE usuarios SET nivel = 8 WHERE id > 0 AND experiencia >= 20000 AND experiencia < 25000;

-- Nivel 9: 25000-29999 XP
UPDATE usuarios SET nivel = 9 WHERE id > 0 AND experiencia >= 25000 AND experiencia < 30000;

-- Nivel 10: 30000-39999 XP
UPDATE usuarios SET nivel = 10 WHERE id > 0 AND experiencia >= 30000 AND experiencia < 40000;

-- Nivel 11 en adelante (si hay usuarios con tanta experiencia)
UPDATE usuarios SET nivel = 11 WHERE id > 0 AND experiencia >= 40000 AND experiencia < 50000;
UPDATE usuarios SET nivel = 12 WHERE id > 0 AND experiencia >= 50000 AND experiencia < 60000;
UPDATE usuarios SET nivel = 13 WHERE id > 0 AND experiencia >= 60000 AND experiencia < 70000;
UPDATE usuarios SET nivel = 14 WHERE id > 0 AND experiencia >= 70000 AND experiencia < 85000;
UPDATE usuarios SET nivel = 15 WHERE id > 0 AND experiencia >= 85000 AND experiencia < 100000;
UPDATE usuarios SET nivel = 16 WHERE id > 0 AND experiencia >= 100000 AND experiencia < 120000;
UPDATE usuarios SET nivel = 17 WHERE id > 0 AND experiencia >= 120000 AND experiencia < 140000;
UPDATE usuarios SET nivel = 18 WHERE id > 0 AND experiencia >= 140000 AND experiencia < 165000;
UPDATE usuarios SET nivel = 19 WHERE id > 0 AND experiencia >= 165000 AND experiencia < 195000;
UPDATE usuarios SET nivel = 20 WHERE id > 0 AND experiencia >= 195000;

-- Reactivar el modo seguro
SET SQL_SAFE_UPDATES = 1;

-- 4. Mostrar usuarios después de la actualización
SELECT id, username, experiencia, nivel FROM usuarios; 