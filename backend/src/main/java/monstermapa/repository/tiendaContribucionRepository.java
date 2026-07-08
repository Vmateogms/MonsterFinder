package monstermapa.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import monstermapa.entities.Tienda;
import monstermapa.entities.TiendaContribucion;
import monstermapa.entities.Usuario;

@Repository
public interface tiendaContribucionRepository extends JpaRepository<TiendaContribucion, Long> {
    
    List<TiendaContribucion> findByUsuario(Usuario usuario);
    
    List<TiendaContribucion> findByTienda(Tienda tienda);
    
    @Query("SELECT tc FROM TiendaContribucion tc WHERE tc.fechaContribucion >= :desde ORDER BY tc.fechaContribucion DESC")
    List<TiendaContribucion> findContribucionesRecientes(LocalDateTime desde);
    
    @Query("SELECT tc FROM TiendaContribucion tc WHERE tc.reportada = true ORDER BY tc.fechaContribucion DESC")
    List<TiendaContribucion> findContribucionesReportadas();
    
    @Query("SELECT tc FROM TiendaContribucion tc WHERE tc.usuario.id = :usuarioId AND tc.tipoContribucion = 'CREACION' AND tc.fechaContribucion >= :desde")
    List<TiendaContribucion> findCreacionesRecientesByUsuario(Long usuarioId, LocalDateTime desde);
    
    @Query("SELECT COUNT(tc) FROM TiendaContribucion tc WHERE tc.usuario.id = :usuarioId AND tc.fechaContribucion >= :desde")
    Integer contarContribucionesHechasPorUsuariodesde(Long usuarioId, LocalDateTime desde);

}
