package monstermapa.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import monstermapa.entities.AuthToken;
import monstermapa.entities.Usuario;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    
    Optional<AuthToken> findByToken(String token);
    
    List<AuthToken> findByUsuario(Usuario usuario);
    
    @Query("SELECT a FROM AuthToken a WHERE a.usuario.id = :usuarioId AND a.valido = true")
    List<AuthToken> findValidTokensByUsuarioId(Long usuarioId);
    
    @Modifying
    @Transactional
    @Query("UPDATE AuthToken a SET a.valido = false WHERE a.token = :token")
    void invalidarToken(String token);
    
    @Modifying
    @Transactional
    @Query("UPDATE AuthToken a SET a.valido = false WHERE a.usuario.id = :usuarioId")
    void invalidarTokensUsuario(Long usuarioId);
    
    @Modifying
    @Transactional
    @Query("UPDATE AuthToken a SET a.valido = false WHERE a.fechaExpiracion < :ahora")
    void invalidarTokensExpirados(LocalDateTime ahora);
} 