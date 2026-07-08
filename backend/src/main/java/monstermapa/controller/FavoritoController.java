package monstermapa.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import monstermapa.dto.FavoritoDto;
import monstermapa.dto.UsuarioDto;
import monstermapa.entities.Usuario;
import monstermapa.service.FavoritoService;
import monstermapa.service.SessionService;

@RestController
@RequestMapping("/api/favoritos")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100", "https://monsterfinder.vmateogm.com"}, allowCredentials = "true")
public class FavoritoController {

    @Autowired
    private FavoritoService favoritoService;
    
    @Autowired
    private SessionService sessionService;
    
    /**
     * Obtiene todas las tiendas favoritas del usuario actual
     */
    @GetMapping
    public ResponseEntity<?> obtenerFavoritos() {
        try {
            Long userId = sessionService.getUserIdFromSession();
            if (userId == null) {
                return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
            }
            
            FavoritoDto.ListaFavoritosResponse favoritos = favoritoService.obtenerFavoritos(userId);
            return ResponseEntity.ok(favoritos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Agrega una tienda a favoritos
     */
    @PostMapping("/agregar")
    public ResponseEntity<?> agregarFavorito(@RequestBody FavoritoDto.FavoritoRequest request) {
        try {
            Long userId = sessionService.getUserIdFromSession();
            if (userId == null) {
                return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
            }
            
            FavoritoDto.FavoritoResponse respuesta = favoritoService.agregarFavorito(userId, request.getTiendaId());
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Elimina una tienda de favoritos
     */
    @DeleteMapping("/{tiendaId}")
    public ResponseEntity<?> eliminarFavorito(@PathVariable Long tiendaId) {
        try {
            Long userId = sessionService.getUserIdFromSession();
            if (userId == null) {
                return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
            }
            
            FavoritoDto.FavoritoResponse respuesta = favoritoService.eliminarFavorito(userId, tiendaId);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Verifica si una tienda está en favoritos
     */
    @GetMapping("/check/{tiendaId}")
    public ResponseEntity<?> esFavorito(@PathVariable Long tiendaId) {
        try {
            Long userId = sessionService.getUserIdFromSession();
            if (userId == null) {
                return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse("No autenticado"));
            }
            
            boolean esFavorito = favoritoService.esFavorito(userId, tiendaId);
            return ResponseEntity.ok(new FavoritoDto.FavoritoResponse("OK", esFavorito));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new UsuarioDto.MessageResponse(e.getMessage()));
        }
    }
    
    /**
     * Endpoint de diagnóstico para favoritos
     */
    @GetMapping("/diagnostico")
    public ResponseEntity<?> diagnosticoFavoritos() {
        try {
            System.out.println("=== DIAGNÓSTICO DE SISTEMA DE FAVORITOS ===");
            
            // Verificar estado de autenticación
            Long userId = sessionService.getUserIdFromSession();
            System.out.println("ID de usuario obtenido: " + userId);
            
            if (userId == null) {
                return ResponseEntity.status(401).body(new UsuarioDto.MessageResponse(
                    "No autenticado - No se pudo obtener ID de usuario para diagnóstico de favoritos"));
            }
            
            // Verificar que el usuario existe
            Usuario usuario = sessionService.getCurrentUser();
            if (usuario == null) {
                return ResponseEntity.status(404).body(new UsuarioDto.MessageResponse(
                    "Usuario no encontrado en la base de datos: " + userId));
            }
            
            System.out.println("Usuario encontrado: " + usuario.getUsername());
            System.out.println("Favoritos actuales: " + usuario.getTiendasFavoritas().size());
            
            // Información de diagnóstico
            StringBuilder info = new StringBuilder();
            info.append("Usuario: ").append(usuario.getUsername()).append("\n");
            info.append("ID: ").append(usuario.getId()).append("\n");
            info.append("Tiendas favoritas: ").append(usuario.getTiendasFavoritas().size()).append("\n");
            
            if (usuario.getTiendasFavoritas().size() > 0) {
                info.append("Listado de favoritos:\n");
                usuario.getTiendasFavoritas().forEach(tienda -> {
                    info.append("- ID: ").append(tienda.getId())
                        .append(", Nombre: ").append(tienda.getNombre())
                        .append(", Coord: ").append(tienda.getLatitud())
                        .append(",").append(tienda.getLongitud())
                        .append("\n");
                });
            } else {
                info.append("No tiene tiendas favoritas registradas\n");
            }
            
            return ResponseEntity.ok(info.toString());
            
        } catch (Exception e) {
            System.out.println("Error en diagnóstico de favoritos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error en diagnóstico: " + e.getMessage());
        }
    }
} 