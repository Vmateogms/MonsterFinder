package monstermapa.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import monstermapa.entities.Usuario;
import monstermapa.repository.userRepository;

/**
 * Servicio para manejar la sesión del usuario
 * Esta implementación utiliza sesiones HTTP en lugar de JWT para mayor simplicidad
 */
@Service
public class SessionService {

	@Autowired
	private userRepository uRepo;
	
	@Autowired
	@Lazy
	private UsuarioService usuarioService;
	
	private static final String AUTH_HEADER = "Authorization";
	private static final String BEARER_PREFIX = "Bearer ";
	private static final String USER_ID_ATTR = "USER_ID";
	
	
	//Establece el ID del usuario en la sesion actual
	public void setUseridInSession(Long userId) {
		 HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
	     HttpSession session = request.getSession(true);
	     session.setAttribute(USER_ID_ATTR, userId);
	     System.out.println("ID de usuario establecido en sesión: " + userId);
	}
	
	//Obtiene el id del usuario en la sesion actual
	public Long getUserIdFromSession() {
		try {
		 HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
	        System.out.println("=== OBTENIENDO ID DE USUARIO ===");
			System.out.println("URL solicitada: " + request.getRequestURI());
            System.out.println("Método HTTP: " + request.getMethod());
            // Imprimir todas las cabeceras para diagnóstico
            java.util.Enumeration<String> headerNames = request.getHeaderNames();
            System.out.println("Cabeceras de la solicitud:");
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                System.out.println(headerName + ": " + request.getHeader(headerName));
            }
			
		 	// Primero intentamos obtener de la sesión HTTP
	        HttpSession session = request.getSession(false);
	        if (session != null && session.getAttribute(USER_ID_ATTR) != null) {
	        	Long userId = (Long) session.getAttribute(USER_ID_ATTR);
	        	System.out.println("ID de usuario obtenido de la sesión HTTP: " + userId);
	            return userId;
	        } else {
				System.out.println("No se encontró ID de usuario en la sesión HTTP");
			}
	        
	        // Si no está en la sesión, intentamos obtenerlo del token
	        String token = extractTokenFromRequest(request);
			System.out.println("Token extraído: " + (token != null ? token.substring(0, Math.min(10, token.length())) + "..." : "null"));
			
	        if (token != null) {
				boolean tokenValido = usuarioService.validarToken(token);
				System.out.println("¿Token válido? " + tokenValido);
				
				if (tokenValido) {
					Usuario usuario = usuarioService.getUserFromToken(token);
					System.out.println("Usuario del token: " + (usuario != null ? usuario.getUsername() : "NULL"));
					
					if (usuario != null) {
						Long userId = usuario.getId();
						System.out.println("ID de usuario obtenido del token: " + userId);
						
						// Establecemos en la sesión para futuras peticiones
						setUseridInSession(userId);
						
						return userId;
					} else {
						System.out.println("No se encontró usuario para el token proporcionado");
					}
				}
	        } else {
				System.out.println("No se encontró token en la solicitud");
			}
	        
	        System.out.println("No se pudo obtener ID de usuario ni de la sesión ni del token");
		} catch (Exception e) {
			System.out.println("Error al obtener ID de usuario: " + e.getMessage());
			e.printStackTrace();
	        }
	        
	        return null;
	}
	
	//Obtiene el usuario de la sesion actual
	public Usuario getCurrentUser() {
        Long userId = getUserIdFromSession();
        if (userId == null) {
            return null;
        }
        
        return uRepo.findById(userId).orElse(null);
    }
	
	//Invalida la sesion actual
	
	public void invalidateSession() {
		 HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
	        HttpSession session = request.getSession(false);
	        
	        if (session != null) {
	            session.invalidate();
	        }
	}
	
	//Extraer el tokem del header authorizationm
	 public String extractTokenFromRequest(HttpServletRequest request) {
	        String authHeader = request.getHeader(AUTH_HEADER);
			System.out.println("Cabecera Authorization: " + authHeader);
	        
	        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
	            return authHeader.substring(BEARER_PREFIX.length());
	        }
	        
	        return null;
	    }
	
	
}
