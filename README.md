# MonsterFinder
URL = (https://monsterfinder.vmateogm.com/) 

## Introducción
MonsterFinder es una webapp diseñada por V.Mateo GM, como proyecto para solventar el
problema económico que genera la adicción a las energéticas en su grupo de amigos. En
MonsterFinder podrás encontrar las Monster Energy mas baratas en tu zona o tiendas que
frecuentas.


## Lógica
Se plantea que el usuario sea el que añada las tiendas y actualice tanto los productos de
la tienda como los precios para el beneficio común de los usuarios, esto favorece la
escalabilidad mientras que el poder de administración sea limitado.


#### Herramientas
El frontend se ha confeccionado usando Angular, y el Backend con Spring Boot y base de
datos en MySQL.


## Modo de uso

#### Añadir tiendas
El mapa (https://leafletjs.com/) tiene un botón arriba a la derecha "Añadir tienda" por el
que, el usuario será capaz de añadir tiendas al mapa, un pequeño formulario preguntando
por; Nombre del negocio, Latitud, Longitud, Url de imagen. Una vez presionado el botón de
guardar solo será necesario Refrescar la pagina y la tienda aparecerá en el mapa.

### Configurar productos y precio
Al hacer click en cualquier pin del mapa aparecerá la tienda seleccionada, aquí se
mostraran una vista simple de los productos que tiene la tienda y debajo tres opciones;
**Editar | Ver | Cancelar.** El propósito de estas es **Editar:** El usuario se encontrara con fotos
de los productos y al lado un checkbox, para confirmar que un producto esta en la tienda
solamente haga click en el checkbox y aparecerá inmediatamente un input donde
introducir el precio, presione guardar y la tienda será actualizada en base a la información
que usted a propuesto. **Ver:** Como bien indica el nombre la función de este botón será
permitir ver al usuario los productos distribuidos en columnas con cards, donde se vera el
nombre, sabor, descripción y precio.

## Problemas conocidos
Durante el desarrollo de esta pagina se ha encontrado una serie de problemas, que se
espera solventar en futuras actualizaciones: **Spam de tiendas y mal uso de la edición
de estas**: Tanto lo que hace a la pagina escalable como lo que crea su mayor debilidad es
el mal uso intencionado de la creación de tiendas y modificación de los productos. La
solución propuesta es crear usuarios con los que se registra su uso de la pagina, si un
usuario, pongamos, crea 10 tiendas en fila en el mar, se podrá vetar la cuenta de este
usuario y automáticamente borrar toda participación de esta en la pagina.


<img src="resourcesGit/monsteramigos.png" width="50%" />

**Futuras Updates**

**Publicación:** 4 de abril  
**Futuras Actualizaciones:** TBD  

---

**Abril-Mayo**  
- Añadir Geolocalización  
- Filtros por rango de productos  
- Más Productos  
- Productos del tiempo o fríos  

---

**Mayo-Junio**  
- Mejorar estética  
- Fotos de los productos mejores  
- Optimización  
- Seguridad  
- Usuarios  

---

**Junio-???**  
- ElasticSearch en el backend  
- Overhaul de la página  
- Adición de otro tipo de productos  
=======
