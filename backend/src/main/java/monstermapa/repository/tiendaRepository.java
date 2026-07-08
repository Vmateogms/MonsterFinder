package monstermapa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import monstermapa.entities.Tienda;

public interface tiendaRepository extends JpaRepository<Tienda, Long>{
	@Query("SELECT t FROM Tienda t LEFT JOIN FETCH t.tiendaMonsters tm LEFT JOIN FETCH tm.monster")
    List<Tienda> findAllWithMonsters();

	@Query("SELECT t FROM Tienda t LEFT JOIN FETCH t.tiendaMonsters tm LEFT JOIN FETCH tm.monster WHERE t.id = :id")
	Optional<Tienda> findByIdWithMonsters(@Param("id") Long id);
	
	@Query("SELECT t FROM Tienda t LEFT JOIN FETCH t.tiendaMonsters WHERE t.id = :id")
    Optional<Tienda> findWithMonstersById(@Param("id") Long id);
}
