package monstermapa.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import monstermapa.config.ExperienciaUtils;
import monstermapa.dto.UsuarioDto;
import monstermapa.entities.AuthToken;
import monstermapa.entities.Usuario;
import monstermapa.repository.AuthTokenRepository;
import monstermapa.repository.tiendaContribucionRepository;
import monstermapa.repository.userRepository;



@Service
public class UsuarioService {

	@Autowired
	private userRepository uRepo;
	
	@Autowired
	private tiendaContribucionRepository tcRepo;
	
	@Autowired
	private PasswordEncoder passwordEncoder;
	
	@Autowired
	@Lazy
	private SessionService sessionService;
	
	@Autowired
	private AuthTokenRepository tokenRepository;
	
	@Value("${app.jwt.token-validity:1440}")
	private int tokenValidityMinutes;
	
	@Value("${app.jwt.store-in-db:true}")
	private boolean storeTokenInDb;
	
	private final Map<String, UserTokenInfo> tokenStore = new HashMap<>();
    
    
    
    //registrar un nuevo user
    @Transactional
    public UsuarioDto.MessageResponse registrarUsuario(UsuarioDto.RequestRegistro request) {
    	
    	//validamos si ya existe el username
    	if(uRepo.existsByUsername(request.getUsername())) {
    		return new UsuarioDto.MessageResponse("Error: El nombre de usuario ya esta en uso");
    	}
    	
    	if(uRepo.existsByEmail(request.getEmail())) {
    		return new UsuarioDto.MessageResponse("Error: El email ya está en uso");
    	}
    	
    	Usuario usuario = new Usuario(
    			request.getUsername(),
    			request.getEmail(),
    			passwordEncoder.encode(request.getPassword()),
    			request.getNombreCompleto()
    	);
    	
    	uRepo.save(usuario);
    	return new UsuarioDto.MessageResponse("Usuario registrado correctamente");
    }
    
    //Autentica un usuario y genera un token de sesion
    public UsuarioDto.AuthResponse authenticateUsuario(UsuarioDto.LoginRequest loginRequest) {
        try {
            System.out.println("=== AUTENTICANDO USUARIO ===");
            System.out.println("Username: " + loginRequest.getUsername());
            
            Optional<Usuario> usuarioOpt = uRepo.findByUsername(loginRequest.getUsername());
            
            if (!usuarioOpt.isPresent()) {
                System.out.println("ERROR: Usuario no encontrado: " + loginRequest.getUsername());
                throw new RuntimeException("Usuario no encontrado");
            }
            
            Usuario usuario = usuarioOpt.get();
            System.out.println("Usuario encontrado: " + usuario.getUsername());
            
            //verificar contraseña
            if (!passwordEncoder.matches(loginRequest.getPassword(), usuario.getPassword())) {
                System.out.println("ERROR: Contraseña incorrecta para: " + usuario.getUsername());
                throw new RuntimeException("Contraseña incorrecta");
            }
            
            System.out.println("Contraseña verificada correctamente");
            
            //Actualizar ultimo acceso
            usuario.setUltimoAcceso(LocalDateTime.now());
            uRepo.save(usuario);
            System.out.println("Último acceso actualizado");
            
            //Generar token simple 
            String token = generateSessionToken(usuario);
            System.out.println("Token generado: " + token.substring(0, 8) + "...");
            
            //Calcular progreso para siguiente nivel
            int progresoNivel = ExperienciaUtils.calcularProgresoNivel(usuario.getExperiencia(), usuario.getNivel());
            System.out.println("Progreso de nivel calculado: " + progresoNivel + "%");
            
            UsuarioDto.AuthResponse response = new UsuarioDto.AuthResponse(
                token,
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.getNivelConfianza(),
                usuario.getExperiencia(),
                usuario.getNivel(),
                progresoNivel
            );
            
            System.out.println("Respuesta de autenticación creada");
            return response;
        } catch (Exception e) {
            System.out.println("ERROR en authenticateUsuario: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    //Obtiene perfil de un usuario
    public UsuarioDto.UserProfileDto obtenerPerfilUsuario(Long userId) {
    	Usuario usuario = uRepo.findById(userId)
    	    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    	 
    	//Contar contribuciones totales
    	int contribucionesTotales = tcRepo.contarContribucionesHechasPorUsuariodesde(userId, LocalDateTime.of(2000, 1, 1, 0, 0));
    	 
    	//Calcular progreso para el siguiente nivel
    	int progresoNivel = ExperienciaUtils.calcularProgresoNivel(usuario.getExperiencia(), usuario.getNivel());
    	 
    	UsuarioDto.UserProfileDto perfil = new UsuarioDto.UserProfileDto();
    	perfil.setId(usuario.getId());
    	perfil.setUsername(usuario.getUsername());
    	perfil.setEmail(usuario.getEmail());
    	perfil.setNombreCompleto(usuario.getNombreCompleto());
    	perfil.setFechaRegistro(usuario.getFechaRegistro());
    	perfil.setNivelConfianza(usuario.getNivelConfianza());
        perfil.setExperiencia(usuario.getExperiencia());
        perfil.setNivel(usuario.getNivel());
        perfil.setProgresoNivel(progresoNivel);
        perfil.setContribucionesTotales(contribucionesTotales);
        perfil.setUltimoAcceso(usuario.getUltimoAcceso());
         
        return perfil;
    }
    
    //Añade experiencia a un usuario y actualiza su nivel si es necesario
    @Transactional
    public UsuarioDto.ExperienciaResponse añadirExperiencia(Long userId, int cantidadXp, String accion) {
        try {
            System.out.println("=== AÑADIENDO EXPERIENCIA ===");
            System.out.println("userId: " + userId + ", cantidadXp: " + cantidadXp + ", acción: " + accion);
            
            if (userId == null) {
                System.out.println("ERROR: userId es null");
                throw new RuntimeException("ID de usuario no proporcionado");
            }
            
            if (cantidadXp <= 0) {
                System.out.println("ERROR: La cantidad de XP debe ser positiva: " + cantidadXp);
                throw new RuntimeException("La cantidad de XP debe ser positiva");
            }
            
            Usuario usuario = uRepo.findById(userId)
                .orElseThrow(() -> {
                    System.out.println("ERROR: Usuario no encontrado con ID: " + userId);
                    return new RuntimeException("Usuario no encontrado con ID: " + userId);
                });
            
            System.out.println("Usuario encontrado: " + usuario.getUsername());
            int xpAnterior = usuario.getExperiencia();
            int nivelAnterior = usuario.getNivel();
            
            System.out.println("XP anterior: " + xpAnterior + ", Nivel anterior: " + nivelAnterior);
            
            // Comprobar límite diario de XP
            usuario.resetearXpDiariaSiNecesario(); // Resetear XP diaria si es un nuevo día
            
            // Verificar si el usuario ya ha alcanzado el límite diario
            int xpGanadaHoy = usuario.getXpGanadaHoy() != null ? usuario.getXpGanadaHoy() : 0;
            System.out.println("XP ganada hoy antes: " + xpGanadaHoy);
            
            // Aplicar el límite diario
            int xpDisponible = ExperienciaUtils.LIMITE_DIARIO_XP - xpGanadaHoy;
            int xpReal = Math.min(cantidadXp, xpDisponible);
            
            if (xpReal <= 0) {
                System.out.println("Límite diario de XP alcanzado. No se otorga experiencia.");
                return new UsuarioDto.ExperienciaResponse(
                    xpAnterior,
                    xpAnterior,
                    nivelAnterior,
                    nivelAnterior,
                    false,
                    "Has alcanzado el límite diario de XP (" + ExperienciaUtils.LIMITE_DIARIO_XP + " XP)"
                );
            }
            
            // Actualizar experiencia
            usuario.setExperiencia(xpAnterior + xpReal);
            usuario.setXpGanadaHoy(xpGanadaHoy + xpReal);
            usuario.setUltimoDiaActividad(LocalDateTime.now());
            
            System.out.println("XP añadida: " + xpReal + " (solicitada: " + cantidadXp + ")");
            System.out.println("Nueva XP ganada hoy: " + usuario.getXpGanadaHoy());
            
            // Recalcular nivel
            int nuevoNivel = ExperienciaUtils.calcularNivel(usuario.getExperiencia());
            usuario.setNivel(nuevoNivel);
            
            System.out.println("Nuevo XP: " + usuario.getExperiencia() + ", Nuevo nivel: " + nuevoNivel);
            
            // Guardar cambios
            usuario = uRepo.save(usuario);
            System.out.println("Usuario guardado correctamente con nueva experiencia");
        
            boolean subiNivel = nivelAnterior < nuevoNivel;
            String mensaje = subiNivel 
                    ? "¡Enhorabuena! Has subido al nivel " + nuevoNivel
                    : "Has ganado " + xpReal + " XP por " + accion;
                    
            if (xpReal < cantidadXp) {
                mensaje += " (Límite diario alcanzado: " + usuario.getXpGanadaHoy() + "/" + ExperienciaUtils.LIMITE_DIARIO_XP + " XP)";
            }
            
            System.out.println("Resultado: " + mensaje);
            return new UsuarioDto.ExperienciaResponse(
                xpAnterior,
                usuario.getExperiencia(),
                nivelAnterior,
                nuevoNivel,
                subiNivel,
                mensaje
            );
        } catch (Exception e) {
            System.out.println("ERROR al añadir experiencia: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-lanzamos la excepción para que se maneje en el controlador
        }
    }
    
    //Cambiar la contraseña de un usuario
    @Transactional
    public UsuarioDto.MessageResponse cambiarContraseña(Long userId, UsuarioDto.ChangePasswordRequest request) {
    	Usuario usuario = uRepo.findById(userId)
    		.orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    		 
    	//verificar contraseña actual
    	if (!passwordEncoder.matches(request.getOldPassword(), usuario.getPassword())) {
    	    return new UsuarioDto.MessageResponse("Error: La contraseña actual es incorrecta");
    	}
    		 
    	//Actualizar contraseña
    	usuario.setPassword(passwordEncoder.encode(request.getNewPassword()));
    	uRepo.save(usuario);
    		 
    	return new UsuarioDto.MessageResponse("Contraseña actualizada correctamente");
    }
    	 
    //Genera un token de sesion simple para el usuario
    private String generateSessionToken(Usuario usuario) {
    	String token = UUID.randomUUID().toString();
    	
    	// Guardamos en la memoria para compatibilidad hacia atrás
    	tokenStore.put(token, new UserTokenInfo(usuario.getUsername()));
        
        // Guardar también en la base de datos si está habilitado
        if (storeTokenInDb) {
            try {
                AuthToken authToken = new AuthToken(token, usuario, tokenValidityMinutes / 60);
                tokenRepository.save(authToken);
                System.out.println("Token guardado en base de datos para usuario: " + usuario.getUsername());
            } catch (Exception e) {
                System.out.println("ERROR guardando token en base de datos: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        System.out.println("Token generado para usuario: " + usuario.getUsername());
    	return token;
    }
    	 
    //valida un token de sesion
    public boolean validarToken(String token) {
        if (token == null) {
            System.out.println("Token nulo, no válido");
            return false;
        }
        
        // Primero intentamos validar en la base de datos
        if (storeTokenInDb) {
            try {
                Optional<AuthToken> authTokenOpt = tokenRepository.findByToken(token);
                if (authTokenOpt.isPresent()) {
                    AuthToken authToken = authTokenOpt.get();
                    boolean isValid = authToken.isValid();
                    System.out.println("Token encontrado en base de datos para: " + 
                            authToken.getUsuario().getUsername() + ", es válido: " + isValid);
                    return isValid;
                } else {
                    System.out.println("Token no encontrado en base de datos");
                }
            } catch (Exception e) {
                System.out.println("ERROR consultando token en base de datos: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Fallback al almacén en memoria
        if (!tokenStore.containsKey(token)) {
            System.out.println("Token no encontrado en el store: " + token);
            return false;
        }
        
        UserTokenInfo info = tokenStore.get(token);
        if (!info.isValid()) {
            System.out.println("Token expirado para: " + info.username);
            // Eliminar token expirado
            tokenStore.remove(token);
            return false;
        }
        
        System.out.println("Token válido para: " + info.username);
        return true;
    }
    
    //verifica token y devuelve información básica del usuario para el cliente
    public UsuarioDto.AuthResponse verificarToken(String token) {
        if (!validarToken(token)) {
            throw new RuntimeException("Token inválido o expirado");
        }
        
        Usuario usuario = getUserFromToken(token);
        if (usuario == null) {
            throw new RuntimeException("Usuario no encontrado para el token proporcionado");
        }
        
        int progresoNivel = ExperienciaUtils.calcularProgresoNivel(usuario.getExperiencia(), usuario.getNivel());
        
        return new UsuarioDto.AuthResponse(
            token,
            usuario.getId(),
            usuario.getUsername(),
            usuario.getEmail(),
            usuario.getRol(),
            usuario.getNivelConfianza(),
            usuario.getExperiencia(),
            usuario.getNivel(),
            progresoNivel
        );
    }
    
    //obtiene el user por su token de sesion
    public Usuario getUserFromToken(String token) {
    	if (token == null) {
    	    return null;
    	}
    	
    	// Primero intentamos obtener de la base de datos
        if (storeTokenInDb) {
            try {
                Optional<AuthToken> authTokenOpt = tokenRepository.findByToken(token);
                if (authTokenOpt.isPresent()) {
                    AuthToken authToken = authTokenOpt.get();
                    if (authToken.isValid()) {
                        return authToken.getUsuario();
                    } else {
                        System.out.println("Token en base de datos ya no es válido");
                        return null;
                    }
                }
            } catch (Exception e) {
                System.out.println("ERROR obteniendo usuario de token en base de datos: " + e.getMessage());
                e.printStackTrace();
            }
        }
    	
    	// Fallback a la memoria
    	if (!tokenStore.containsKey(token)) {
    	    return null;
    	}
    	
    	UserTokenInfo info = tokenStore.get(token);
    	if (!info.isValid()) {
    	    tokenStore.remove(token);
    	    return null;
    	}
    	
    	return uRepo.findByUsername(info.username).orElse(null);
    }
    
    //Cierra la sesion de usuario
    public void cerrarSesion(String token) {
        if (token == null) {
            System.out.println("Intento de cerrar sesión con token nulo");
            return;
        }
        
        // Invalidar en base de datos
        if (storeTokenInDb) {
            try {
                tokenRepository.invalidarToken(token);
                System.out.println("Token invalidado en base de datos");
            } catch (Exception e) {
                System.out.println("ERROR invalidando token en base de datos: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        // Eliminar de la memoria
        if (tokenStore.containsKey(token)) {
            UserTokenInfo info = tokenStore.get(token);
            System.out.println("Cerrando sesión para usuario: " + info.username);
            tokenStore.remove(token);
        } else {
            System.out.println("Intento de cerrar sesión con token inválido: " + token);
        }
    }
    
    //Obtiene un usuario por su ID
    public Usuario getUserById(Long userId) {
        return uRepo.findById(userId).orElse(null);
    }
    
    // Tarea programada para limpiar tokens expirados
    @Transactional
    public void limpiarTokensExpirados() {
        if (storeTokenInDb) {
            try {
                LocalDateTime ahora = LocalDateTime.now();
                tokenRepository.invalidarTokensExpirados(ahora);
                System.out.println("Tokens expirados invalidados correctamente");
            } catch (Exception e) {
                System.out.println("ERROR limpiando tokens expirados: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        
    }
    
    private class UserTokenInfo {
    	private final String username; 
    	private final LocalDateTime expiracion;
    	
    	public UserTokenInfo(String username) {
    		this.username = username;
    		this.expiracion = LocalDateTime.now().plusMinutes(tokenValidityMinutes);
    	}
    	
    	public boolean isValid() {
    		return LocalDateTime.now().isBefore(expiracion);
    	}
    }

}
