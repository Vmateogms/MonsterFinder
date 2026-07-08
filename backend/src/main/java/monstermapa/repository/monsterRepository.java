package monstermapa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import monstermapa.entities.Monster;
import monstermapa.entities.Tienda;

public interface monsterRepository extends JpaRepository<Monster, Integer>{

	Optional<Monster> findById(long longValue);
	List<Monster> findAll(); 
	

}
