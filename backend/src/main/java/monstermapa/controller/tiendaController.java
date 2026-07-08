package monstermapa.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import monstermapa.config.ExperienciaUtils;
import monstermapa.dto.TiendaDto;
import monstermapa.dto.UsuarioDto;
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

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100", "https://monsterfinder.vmateogm.com"}, allowCredentials = "true")
@RestController
@RequestMapping("/api")
public class tiendaController {

	@Autowired
	private tiendaRepository trepo;
	
	@Autowired 
	private tiendaMonsterRepository tmrepo;
	
	@Autowired
	private monsterRepository mrepo;
	
	@Autowired
	private SessionService sessionService;
	
	@Autowired
	private UsuarioService usuarioService;
	
	@Autowired
	private tiendaContribucionRepository contribucionRepository;
	
	@GetMapping("/tiendas")
	public List<Tienda> getTiendasConMonsters() {
		return trepo.findAllWithMonsters();
	}
	
	
	@GetMapping("/tiendas/{id}")
	public ResponseEntity<Tienda> getTiendaById(@PathVariable Long id) {
		Tienda tienda = trepo.findByIdWithMonsters(id)
			.orElseThrow(() -> new RuntimeException("Tienda no encontrada con ID: " + id));
		return ResponseEntity.ok(tienda);
	}	
	
	@PostMapping(value = "/tiendas", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addTienda(@RequestBody TiendaDto tiendaDto) {
        try {
            System.out.println("=== INICIANDO CREACIÓN DE TIENDA ===");
            
            // Convertir DTO a Entity
            Tienda tienda = new Tienda();
            tienda.setNombre(tiendaDto.getNombre());
            tienda.setLatitud(tiendaDto.getLatitud());
            tienda.setLongitud(tiendaDto.getLongitud());
            
            // Obtener usuario creador del DTO o de la sesión actual
            if (tiendaDto.getUsuarioCreador() != null && !tiendaDto.getUsuarioCreador().isEmpty()) {
                tienda.setUsuarioCreador(tiendaDto.getUsuarioCreador());
                System.out.println("Usuario creador desde DTO: " + tienda.getUsuarioCreador());
            } else {
                // Obtener el usuario de la sesión actual
                Long userId = sessionService.getUserIdFromSession();
                if (userId != null) {
                    Usuario usuario = usuarioService.getUserById(userId);
                    if (usuario != null) {
                        tienda.setUsuarioCreador(usuario.getUsername());
                        System.out.println("Usuario creador desde sesión: " + tienda.getUsuarioCreador());
                    }
                }
            }
            
            System.out.println("Tienda a crear: " + tienda.getNombre() + ", creada por: " + 
                               (tienda.getUsuarioCreador() != null ? tienda.getUsuarioCreador() : "desconocido"));
            
            // Guardar la entidad
            tienda = trepo.save(tienda);
            System.out.println("Tienda guardada con ID: " + tienda.getId());

            // Obtener el usuario actual y otorgar experiencia
            Long userId = sessionService.getUserIdFromSession();
            System.out.println("ID de usuario de la sesión: " + userId);
            
            if (userId != null) {
                // Registrar contribución
                Usuario usuario = usuarioService.getUserById(userId);
                System.out.println("Usuario encontrado: " + (usuario != null ? usuario.getUsername() : "NULL"));
                
                if (usuario != null) {
                    // Crear una contribución
                    TiendaContribucion contribucion = new TiendaContribucion();
                    contribucion.setUsuario(usuario);
                    contribucion.setTienda(tienda);
                    contribucion.setTipoContribucion("CREACION");
                    contribucion.setDetalles("Creación de tienda: " + tienda.getNombre());
                    contribucionRepository.save(contribucion);
                    System.out.println("Contribución registrada con ID: " + contribucion.getId());
                    
                    // Otorgar experiencia
                    System.out.println("Llamando a añadirExperiencia con userId=" + userId + 
                                      ", puntosXP=" + ExperienciaUtils.XP_CREAR_TIENDA + 
                                      ", accion=crear una tienda");
                    
                    UsuarioDto.ExperienciaResponse xpResponse = usuarioService.añadirExperiencia(
                            userId, 
                            ExperienciaUtils.XP_CREAR_TIENDA, 
                            "crear una tienda"
                    );
                    System.out.println("Experiencia otorgada. Mensaje: " + xpResponse.getMensaje());
                    
                    // Devolver respuesta con la tienda y la experiencia obtenida
                    System.out.println("Devolviendo respuesta con headers de experiencia");
                    return ResponseEntity.ok()
                            .header("X-Experiencia-Ganada", String.valueOf(ExperienciaUtils.XP_CREAR_TIENDA))
                            .header("X-Mensaje-Experiencia", xpResponse.getMensaje())
                            .body(tienda);
                } else {
                    System.out.println("ERROR: Usuario no encontrado para el ID: " + userId);
                }
            } else {
                System.out.println("ERROR: No hay usuario autenticado en la sesión");
            }
            
            // Si no hay usuario autenticado o no se pudo registrar la contribución
            System.out.println("Devolviendo respuesta sin headers de experiencia");
            return ResponseEntity.ok(tienda);
            
        } catch (Exception e) {
            System.out.println("ERROR procesando creación de tienda: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error al crear la tienda: " + e.getMessage());
        }
    }
}
