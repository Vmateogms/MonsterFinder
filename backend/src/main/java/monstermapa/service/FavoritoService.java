package monstermapa.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import monstermapa.dto.FavoritoDto;
import monstermapa.entities.Tienda;
import monstermapa.entities.Usuario;
import monstermapa.repository.tiendaRepository;
import monstermapa.repository.userRepository;

@Service
public class FavoritoService {

    @Autowired
    private userRepository usuarioRepository;
    
    @Autowired
    private tiendaRepository tiendaRepository;
    
    @Autowired
    private SessionService sessionService;
    
    /**
     * Obtiene todas las tiendas favoritas del usuario actual
     */
    public FavoritoDto.ListaFavoritosResponse obtenerFavoritos(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        List<FavoritoDto.TiendaFavoritaDto> favoritos = usuario.getTiendasFavoritas().stream()
                .map(tienda -> new FavoritoDto.TiendaFavoritaDto(
                        tienda.getId(),
                        tienda.getNombre(),
                        tienda.getLatitud(),
                        tienda.getLongitud()
                ))
                .collect(Collectors.toList());
        
        return new FavoritoDto.ListaFavoritosResponse(favoritos, favoritos.size());
    }
    
    /**
     * Agrega una tienda a favoritos
     */
    @Transactional
    public FavoritoDto.FavoritoResponse agregarFavorito(Long userId, Long tiendaId) {
        try {
            System.out.println("=== AÑADIENDO FAVORITO ===");
            System.out.println("userId: " + userId + ", tiendaId: " + tiendaId);
            
            if (userId == null) {
                System.out.println("ERROR: userId es null");
                throw new RuntimeException("ID de usuario no proporcionado");
            }
            
            if (tiendaId == null) {
                System.out.println("ERROR: tiendaId es null");
                throw new RuntimeException("ID de tienda no proporcionado");
            }
            
        Usuario usuario = usuarioRepository.findById(userId)
                    .orElseThrow(() -> {
                        System.out.println("ERROR: Usuario no encontrado con ID: " + userId);
                        return new RuntimeException("Usuario no encontrado con ID: " + userId);
                    });
            
            System.out.println("Usuario encontrado: " + usuario.getUsername());
        
        Tienda tienda = tiendaRepository.findById(tiendaId)
                    .orElseThrow(() -> {
                        System.out.println("ERROR: Tienda no encontrada con ID: " + tiendaId);
                        return new RuntimeException("Tienda no encontrada con ID: " + tiendaId);
                    });
            
            System.out.println("Tienda encontrada: " + tienda.getNombre());
        
        // Verificar si la tienda ya está en favoritos
        if (usuario.esTiendaFavorita(tiendaId)) {
                System.out.println("Tienda ya estaba en favoritos");
            return new FavoritoDto.FavoritoResponse("La tienda ya está en favoritos", false);
        }
        
        usuario.agregarTiendaFavorita(tienda);
        usuarioRepository.save(usuario);
            System.out.println("Tienda agregada a favoritos correctamente");
        
        return new FavoritoDto.FavoritoResponse("Tienda agregada a favoritos", true);
        } catch (Exception e) {
            System.out.println("ERROR al agregar favorito: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Elimina una tienda de favoritos
     */
    @Transactional
    public FavoritoDto.FavoritoResponse eliminarFavorito(Long userId, Long tiendaId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Tienda tienda = tiendaRepository.findById(tiendaId)
                .orElseThrow(() -> new RuntimeException("Tienda no encontrada"));
        
        // Verificar si la tienda está en favoritos
        if (!usuario.esTiendaFavorita(tiendaId)) {
            return new FavoritoDto.FavoritoResponse("La tienda no está en favoritos", false);
        }
        
        usuario.eliminarTiendaFavorita(tienda);
        usuarioRepository.save(usuario);
        
        return new FavoritoDto.FavoritoResponse("Tienda eliminada de favoritos", true);
    }
    
    /**
     * Verifica si una tienda está en favoritos
     */
    public boolean esFavorito(Long userId, Long tiendaId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        return usuario.esTiendaFavorita(tiendaId);
    }
} 