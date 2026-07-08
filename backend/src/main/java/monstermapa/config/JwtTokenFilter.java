package monstermapa.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import monstermapa.entities.Usuario;
import monstermapa.service.SessionService;
import monstermapa.service.UsuarioService;

@Component
public class JwtTokenFilter extends OncePerRequestFilter {

    @Autowired
    @Lazy
    private UsuarioService usuarioService;
    
    @Autowired
    private SessionService sessionService;

    @Autowired
    @Lazy
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // Log para diagnóstico
            logger.info("=== Procesando solicitud en JwtTokenFilter ===");
            logger.info("URL solicitada: " + request.getRequestURI());
            logger.info("Método: " + request.getMethod());
            
            // Gestionar solicitud OPTIONS (preflight CORS)
            if (request.getMethod().equals("OPTIONS")) {
                configureCorsHeaders(request, response);
                response.setStatus(HttpServletResponse.SC_OK);
                logger.info("Solicitud OPTIONS procesada, respondiendo con 200 OK");
                return;
            }
            
            // Configurar cabeceras CORS para todas las solicitudes
            configureCorsHeaders(request, response);
            
            // Procesar token JWT
            String token = sessionService.extractTokenFromRequest(request);
            logger.info("Token extraído: " + (token != null ? token.substring(0, Math.min(10, token.length())) + "..." : "null"));
            
            if (token != null && usuarioService.validarToken(token)) {
                logger.info("Token válido encontrado");
                // Obtener el usuario asociado al token
                Usuario usuario = usuarioService.getUserFromToken(token);
                
                if (usuario != null) {
                    logger.info("Usuario encontrado: " + usuario.getUsername());
                    // Establecer el ID del usuario en la sesión
                    sessionService.setUseridInSession(usuario.getId());
                    
                    // Crear autoridades según el rol del usuario
                    UserDetails userDetails = userDetailsService.loadUserByUsername(usuario.getUsername());
                    
                    // Crear token de autenticación de Spring Security
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Establecer la autenticación en el contexto de seguridad
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Autenticación establecida para usuario: " + usuario.getUsername());
                } else {
                    logger.warn("No se encontró usuario para el token proporcionado");
                }
            } else {
                logger.warn("Token no válido o no proporcionado");
            }
        } catch (Exception e) {
            logger.error("No se pudo establecer la autenticación del usuario", e);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private void configureCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        logger.info("Origen de la solicitud: " + origin);
        
        // Solo permitir orígenes específicos
        if (origin != null) {
            if (origin.equals("http://localhost:4200") || 
                origin.equals("http://localhost:8100") || 
                origin.equals("https://monsterfinder.vmateogm.com")) {
                response.setHeader("Access-Control-Allow-Origin", origin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
                response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With");
                response.setHeader("Access-Control-Expose-Headers", "X-Experiencia-Ganada, X-Mensaje-Experiencia");
                response.setHeader("Access-Control-Max-Age", "3600");
                logger.info("Cabeceras CORS configuradas para origen: " + origin);
            } else {
                logger.warn("Origen no permitido: " + origin);
            }
        } else {
            logger.warn("No se pudo determinar el origen de la solicitud");
        }
    }
} 