package monstermapa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import monstermapa.entities.Usuario;

@Repository
public interface userRepository extends JpaRepository<Usuario, Long>{

	Optional<Usuario> findByUsername(String username);
	Optional<Usuario> findByEmail(String email);
	Boolean existsByUsername(String username);
	Boolean existsByEmail(String email);
	
	@Query("SELECT u FROM Usuario u WHERE u.tiendasCreadasRecientes > 10")
	List<Usuario> findUsuariosConPuntuacionAlta();
	
	@Query("SELECT u FROM Usuario u WHERE u.marcadoSospechoso = true")
	List<Usuario> findUsuariosSospechosos();
	
	@Query("SELECT u FROM Usuario u WHERE u.activo = true ORDER BY u.nivelConfianza DESC")
	List<Usuario> findContribuidoresTop();
	
}
