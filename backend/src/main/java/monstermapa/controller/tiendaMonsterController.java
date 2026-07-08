package monstermapa.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import monstermapa.config.ExperienciaUtils;
import monstermapa.dto.UsuarioDto;
import monstermapa.entities.Monster;
import monstermapa.entities.Tienda;
import monstermapa.entities.TiendaContribucion;
import monstermapa.entities.TiendaMonster;
import monstermapa.entities.Usuario;
import monstermapa.repository.monsterRepository;
import monstermapa.repository.tiendaContribucionRepository;
import monstermapa.repository.tiendaMonsterRepository;
import monstermapa.repository.tiendaRepository;
import monstermapa.service.SessionService;
import monstermapa.service.UsuarioService;


@RestController
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100", "https://monsterfinder.vmateogm.com"}, allowCredentials = "true")
@RequestMapping("/api/tienda-monsters")
public class tiendaMonsterController {

	@Autowired
    private tiendaMonsterRepository tiendaMonsterRepository;
	
	@Autowired
	private tiendaRepository trepo;
	
	@Autowired
	private monsterRepository mrepo;
	
	@Autowired
	private UsuarioService usuarioService;
	
	@Autowired
	private SessionService sessionService;
	
	@Autowired
	private tiendaContribucionRepository contribucionRepository;
	

	@PostMapping("/{tiendaId}/update")
	@Transactional 
	public ResponseEntity<?> updateTiendaMonster(
	        @PathVariable Long tiendaId,
	        @RequestBody List<Map<String, Object>> updates) {
		
		try {
			System.out.println("=== INICIANDO ACTUALIZACIÓN DE TIENDA ===");
			
		    // Obtener la tienda antes de actualizar
		    Tienda tienda = trepo.findById(tiendaId)
		            .orElseThrow(() -> new RuntimeException("Tienda no encontrada con ID: " + tiendaId));
		    
			System.out.println("Tienda encontrada: " + tienda.getNombre() + " (ID: " + tienda.getId() + ")");

	    // 1. Eliminar relaciones existentes
	        int productosPrevios = tiendaMonsterRepository.countByTiendaId(tiendaId);
			System.out.println("Productos previos en la tienda: " + productosPrevios);
			
	    tiendaMonsterRepository.deleteByTiendaId(tiendaId);
			System.out.println("Productos eliminados de la tienda");

	    // 2. Crear nuevas relaciones
	    List<TiendaMonster> newTiendaMonsters = updates.stream()
	        .map(update -> {
	            // Obtener valores del Map usando las claves correctas
	            Integer monsterId = (Integer) update.get("monsterId");
	            Monster monster = mrepo.findById(monsterId.longValue())
	                .orElseThrow(() -> new RuntimeException("Monster no encontrado"));

	            TiendaMonster tm = new TiendaMonster();
	            tm.setTienda(trepo.getReferenceById(tiendaId));
	            tm.setMonster(monster);

	            // Obtener precio como Number y convertir a Double
	            Number precio = (Number) update.get("precio");
	            tm.setPrecio(precio != null ? precio.doubleValue() : 0.0);

	            // Obtener descuento como Boolean
	            Boolean descuento = (Boolean) update.get("descuento");
	            tm.setDescuento(descuento != null ? descuento : false);

	            Boolean enNevera = (Boolean) update.get("enNevera");
	            tm.setEnNevera(enNevera != null ? enNevera : false);
	            
	            // Manejar precioDescuento
	            Number precioDescuento = (Number) update.get("precioDescuento");
	            if (tm.getDescuento() && precioDescuento != null) {
	                tm.setPrecioDescuento(BigDecimal.valueOf(precioDescuento.doubleValue()));
	                System.out.println("Descuento aplicado: " + tm.getPrecioDescuento());
	            } else {
	                tm.setPrecioDescuento(null);
	            }

	            return tm;
	        })
	        .collect(Collectors.toList());
	
			System.out.println("Nuevos productos creados: " + newTiendaMonsters.size());

	    // 3. Guardar en batch
	    tiendaMonsterRepository.saveAll(newTiendaMonsters);
			System.out.println("Productos guardados en la base de datos");

	    // 4. Recargar la tienda
	    Tienda tiendaActualizada = trepo.findWithMonstersById(tiendaId)
	        .orElseThrow(() -> new RuntimeException("Error recargando tienda"));

			System.out.println("Tienda recargada correctamente");
			
	        // 5. Obtener usuario actual y recompensar con experiencia
	        Long userId = sessionService.getUserIdFromSession();
			System.out.println("ID de usuario de la sesión: " + userId);
			
	        if (userId != null) {
	            Usuario usuario = usuarioService.getUserById(userId);
				System.out.println("Usuario encontrado: " + (usuario != null ? usuario.getUsername() : "NULL"));
				
	            if (usuario != null) {
	                // Determinar el tipo de contribución y puntos XP a otorgar
	                String tipoContribucion;
	                int puntosXP;
	                String accionMensaje;
	                
	                if (productosPrevios == 0 && !newTiendaMonsters.isEmpty()) {
	                    // Se están añadiendo productos por primera vez
	                    tipoContribucion = "AÑADIR_PRODUCTO";
	                    // Otorgar XP fijo por añadir productos, independientemente de la cantidad
	                    puntosXP = ExperienciaUtils.XP_AÑADIR_PRODUCTO;
	                    accionMensaje = "añadir productos";
	                    System.out.println("Acción: Añadiendo productos por primera vez. XP a otorgar: " + puntosXP);
	                } else {
	                    // Se están actualizando productos existentes
	                    tipoContribucion = "ACTUALIZACION_PRECIO";
	                    puntosXP = ExperienciaUtils.XP_ACTUALIZR_PRECIO;
	                    accionMensaje = "actualizar precios";
	                    System.out.println("Acción: Actualizando productos existentes. XP a otorgar: " + puntosXP);
	                }
	                
	                // Registrar contribución
	                TiendaContribucion contribucion = new TiendaContribucion();
	                contribucion.setUsuario(usuario);
	                contribucion.setTienda(tiendaActualizada);
	                contribucion.setTipoContribucion(tipoContribucion);
	                contribucion.setDetalles("Actualización de " + newTiendaMonsters.size() + " productos en " + tienda.getNombre());
	                contribucionRepository.save(contribucion);
					System.out.println("Contribución registrada con ID: " + contribucion.getId());
	                
	                // Otorgar experiencia
					System.out.println("Llamando a añadirExperiencia con userId=" + userId + ", puntosXP=" + puntosXP + ", accion=" + accionMensaje);
	                UsuarioDto.ExperienciaResponse xpResponse = usuarioService.añadirExperiencia(
	                        userId, 
	                        puntosXP, 
	                        accionMensaje
	                );
					System.out.println("Experiencia otorgada. Mensaje: " + xpResponse.getMensaje());
	                
	                // Devolver respuesta con la tienda actualizada y experiencia obtenida
					System.out.println("Devolviendo respuesta con headers de experiencia");
	                return ResponseEntity.ok()
	                        .header("X-Experiencia-Ganada", String.valueOf(puntosXP))
	                        .header("X-Mensaje-Experiencia", xpResponse.getMensaje())
	                        .body(tiendaActualizada);
	            } else {
					System.out.println("ERROR: Usuario no encontrado para el ID: " + userId);
				}
	        } else {
				System.out.println("ERROR: No hay usuario autenticado en la sesión");
			}
	        
			System.out.println("Devolviendo respuesta sin headers de experiencia");
	    return ResponseEntity.ok(tiendaActualizada);
	        
		} catch (Exception e) {
			System.out.println("ERROR procesando actualización: " + e.getMessage());
			e.printStackTrace();
		    return ResponseEntity.badRequest().body("Error al actualizar productos: " + e.getMessage());
		}
	}
}