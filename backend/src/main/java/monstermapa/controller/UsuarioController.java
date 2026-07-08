package monstermapa.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import monstermapa.dto.UsuarioDto;
import monstermapa.entities.Usuario;
import monstermapa.service.SessionService;
import monstermapa.service.UsuarioService;
import monstermapa.config.ExperienciaUtils;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100", "https://monsterfinder.vmateogm.com"}, allowCredentials = "true")
public class UsuarioController {

	@Autowired
	private UsuarioService uService;
	
	@Autowired
	private SessionService sService;
	
	@PostMapping("/registro")
	public ResponseEntity<?> registrarUsuario(@Valid @RequestBody UsuarioDto.RequestRegistro requestRegistro ) {
		try {
			UsuarioDto.MessageResponse response = uService.registrarUsuario(requestRegistro);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@PostMapping("/login")
	public ResponseEntity<?> autenticarUsuario(@Valid @RequestBody UsuarioDto.LoginRequest loginResquest) {
		try {
			UsuarioDto.AuthResponse response = uService.authenticateUsuario(loginResquest);
			sService.setUseridInSession(response.getId());
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@PostMapping("/logout")
	public ResponseEntity<?> cerrarSesion(HttpServletRequest request) {
		try {
			String token = sService.extractTokenFromRequest(request);
			if (token != null ) {
				uService.cerrarSesion(token);
			}
			sService.invalidateSession();
			return ResponseEntity.ok(new UsuarioDto.MessageResponse("Sesión cerrada correctamente"));
		} catch(Exception e) {
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@GetMapping("/verificar-token")
	public ResponseEntity<?> verificarToken(HttpServletRequest request) {
		try {
			String token = sService.extractTokenFromRequest(request);
			if (token == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("Token no proporcionado"));
			}
			
			UsuarioDto.AuthResponse response = uService.verificarToken(token);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@PostMapping("/cambiar-password")
	public ResponseEntity<?> cambiarPassword(@Valid @RequestBody UsuarioDto.ChangePasswordRequest request) {
		try {
			Long userId = sService.getUserIdFromSession();
			if (userId == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
			}
			
			UsuarioDto.MessageResponse response = uService.cambiarContraseña(userId, request);
			return ResponseEntity.ok(response);
			} catch (Exception e) {
				return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
			}
	}
	
	@GetMapping("/perfil")
	public ResponseEntity<?> obtenerPerfil(HttpServletRequest request) {
		try {
			System.out.println("=== OBTENIENDO PERFIL DE USUARIO ===");
            System.out.println("Path: " + request.getRequestURI());
            System.out.println("Method: " + request.getMethod());
            
			Long userId = sService.getUserIdFromSession();
			System.out.println("ID de usuario obtenido: " + userId);
			
			if (userId == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
			}
			
			UsuarioDto.UserProfileDto perfil = uService.obtenerPerfilUsuario(userId);
			System.out.println("Perfil obtenido para usuario con ID: " + userId);
			return ResponseEntity.ok(perfil);
		} catch (Exception e) {
			System.out.println("Error al obtener perfil: " + e.getMessage());
            e.printStackTrace();
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	// Este endpoint solo para pruebas
	@GetMapping("/xp/{cantidad}")
	public ResponseEntity<?> probarGanasXp(@PathVariable int cantidad ){
		try {
			Long userId = sService.getUserIdFromSession();
			if (userId == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
			}
			
			UsuarioDto.ExperienciaResponse response = uService.añadirExperiencia(userId, cantidad, "prueba de sistema");
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@GetMapping("/diagnostico-xp")
	public ResponseEntity<?> diagnosticoXp() {
		try {
			System.out.println("=== DIAGNÓSTICO DE SISTEMA DE EXPERIENCIA ===");
			
			// Obtener ID de usuario
			Long userId = sService.getUserIdFromSession();
			System.out.println("ID de usuario obtenido: " + userId);
			
			if (userId == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado - No se pudo obtener ID de usuario"));
			}
			
			// Verificar que el usuario existe
			Usuario usuario = uService.getUserById(userId);
			if (usuario == null) {
				return ResponseEntity.status(404).body(new UsuarioDto.MessageResponse("Usuario no encontrado en la base de datos"));
			}
			
			System.out.println("Usuario encontrado: " + usuario.getUsername());
			System.out.println("XP actual: " + usuario.getExperiencia());
			System.out.println("Nivel actual: " + usuario.getNivel());
			
			// Otorgar una pequeña cantidad de XP para probar el sistema
			int puntosXP = 10;
			
			try {
				UsuarioDto.ExperienciaResponse response = uService.añadirExperiencia(userId, puntosXP, "diagnóstico del sistema");
				System.out.println("Experiencia otorgada correctamente");
				return ResponseEntity.ok(response);
			} catch (Exception e) {
				System.out.println("Error al otorgar experiencia: " + e.getMessage());
				e.printStackTrace();
				return ResponseEntity.status(500).body(new UsuarioDto.MessageResponse("Error al otorgar experiencia: " + e.getMessage()));
			}
			
		} catch (Exception e) {
			System.out.println("Error general en diagnóstico: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
		}
	}
	
	@PostMapping("/recompensa")
	public ResponseEntity<?> procesarRecompensa(@RequestBody Map<String, Object> request) {
		try {
			System.out.println("=== PROCESANDO RECOMPENSA DE EXPERIENCIA ===");
			
			// Obtener ID de usuario
			Long userId = sService.getUserIdFromSession();
			System.out.println("ID de usuario obtenido: " + userId);
			
			if (userId == null) {
				return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado - No se pudo obtener ID de usuario"));
			}
			
			// Obtener datos de la recompensa
			String accion = (String) request.getOrDefault("accion", "acción no especificada");
			Integer cantidad = 0;
			
			if (request.containsKey("cantidad")) {
				try {
					cantidad = Integer.parseInt(request.get("cantidad").toString());
				} catch (NumberFormatException e) {
					System.out.println("Error al parsear cantidad: " + e.getMessage());
				}
			}
			
			if (cantidad <= 0) {
				// Determinar cantidad basada en acción
				if ("crear_tienda".equals(accion)) {
					cantidad = ExperienciaUtils.XP_CREAR_TIENDA;
				} else if ("añadir_producto".equals(accion)) {
					cantidad = ExperienciaUtils.XP_AÑADIR_PRODUCTO;
				} else if ("actualizar_precio".equals(accion)) {
					cantidad = ExperienciaUtils.XP_ACTUALIZR_PRECIO;
				} else {
					cantidad = 100; // Valor por defecto
				}
			}
			
			System.out.println("Recompensa solicitada: " + cantidad + " XP por " + accion);
			
			// Verificar que el usuario existe
			Usuario usuario = uService.getUserById(userId);
			if (usuario == null) {
				return ResponseEntity.status(404).body(new UsuarioDto.MessageResponse("Usuario no encontrado en la base de datos"));
			}
			
			System.out.println("Usuario encontrado: " + usuario.getUsername());
			System.out.println("XP actual: " + usuario.getExperiencia());
			System.out.println("Nivel actual: " + usuario.getNivel());
			
			// Otorgar la experiencia
			UsuarioDto.ExperienciaResponse response = uService.añadirExperiencia(userId, cantidad, accion);
			System.out.println("Experiencia otorgada correctamente");
			return ResponseEntity.ok(response);
			
		} catch (Exception e) {
			System.out.println("Error al procesar recompensa: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500).body(new UsuarioDto.MessageResponse("Error al procesar recompensa: " + e.getMessage()));
		}
	}
	
	// Endpoint de diagnóstico para verificar estado del servidor
    @GetMapping("/diagnostico")
    public ResponseEntity<?> diagnostico(HttpServletRequest request) {
        Map<String, Object> info = new HashMap<>();
        info.put("estado", "ok");
        info.put("endpoint", "/api/usuarios/diagnostico");
        info.put("metodo", request.getMethod());
        info.put("uri", request.getRequestURI());
        
        // Información sobre cabeceras
        Map<String, String> headers = new HashMap<>();
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            headers.put(headerName, request.getHeader(headerName));
        }
        info.put("cabeceras", headers);
        
        return ResponseEntity.ok(info);
    }
}
