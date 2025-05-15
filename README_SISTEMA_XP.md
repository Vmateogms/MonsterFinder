# Sistema de Experiencia de MonsterFinder

Este documento explica el sistema de experiencia (XP) implementado en MonsterFinder para prevenir exploits y mantener un progreso equilibrado.

## Recompensas de XP

El sistema otorga puntos de experiencia por las siguientes acciones:

| Acción | XP | Límite |
|--------|-------|-------|
| Crear tienda | 500 XP | 5 tiendas diarias |
| Añadir productos a tienda | 100 XP | Una vez por tienda |
| Actualizar precios | 100 XP | Una vez por sesión de edición |
| Verificar contribución | 50 XP | - |
| Reportar error | 50 XP | - |

## Límites diarios

Para evitar exploits de experiencia infinita, se han implementado los siguientes límites:

- **Límite diario**: Máximo de 1000 XP por día
- **Límite por tienda**: Máximo de 100 XP por edición de tienda
- **Reset diario**: El contador de XP diario se resetea automáticamente a medianoche

## Niveles y progresión

La experiencia requerida para cada nivel sigue una curva de progresión diseñada para que el avance sea sostenido:

| Nivel | XP requerida | XP acumulada |
|-------|-------------|--------------|
| 1 | 0 | 0 |
| 2 | 1000 | 1000 |
| 3 | 2000 | 3000 |
| 4 | 5000 | 8000 |
| 5 | 4000 | 12000 |
| ... | ... | ... |
| 20 | 30000 | 225000 |

## Notificaciones

El sistema muestra notificaciones cuando:
- El usuario gana experiencia
- El usuario sube de nivel
- El usuario alcanza su límite diario de XP

## Implementación técnica

- El backend envía los datos de experiencia como headers HTTP:
  - `X-Experiencia-Ganada`: Cantidad de XP otorgada
  - `X-Mensaje-Experiencia`: Mensaje explicativo para el usuario

- El frontend recibe estos headers y muestra notificaciones visuales

## Beneficios del sistema

- **Equilibrio**: Previene subidas de nivel demasiado rápidas
- **Anti-exploits**: Evita abusos como añadir/quitar productos repetidamente
- **Transparencia**: Informa claramente al usuario sobre el XP ganado y límites
- **Incentivo**: Mantiene la motivación para contribuir regularmente 