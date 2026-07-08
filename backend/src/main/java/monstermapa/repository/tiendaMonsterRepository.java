package monstermapa.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.transaction.Transactional;
import monstermapa.dto.MonsterPrecioDto;
import monstermapa.entities.Tienda;
import monstermapa.entities.TiendaMonster;

public interface tiendaMonsterRepository extends JpaRepository<TiendaMonster, Long>{

	  @Modifying 
	    @Transactional
	@Query("DELETE FROM TiendaMonster tm WHERE tm.tienda.id = :tiendaId")
	void deleteByTiendaId(@Param("tiendaId") Long tiendaId); 
	  						// V MIRAR AQUI ABAJO ES MONSTERFINDER EN EL QUERY?
	  @Query("SELECT new monstermapa.dto.MonsterPrecioDto(" +
	           "m.nombre, m.sabor, tm.precio, t.nombre, t.latitud, t.longitud, " +
	           "CASE WHEN tm.descuento = true THEN tm.precioDescuento ELSE null END, " +
	           "tm.enNevera) " +
	           "FROM TiendaMonster tm " +
	           "JOIN tm.monster m " +
	           "JOIN tm.tienda t " +
	           "WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) " +
	           "AND (:enNevera = false OR tm.enNevera = :enNevera) " +
	           "ORDER BY CASE WHEN tm.descuento = true THEN tm.precioDescuento ELSE tm.precio END ASC")
	List<MonsterPrecioDto> buscarPorNombreOrdenadoPorPrecioAsc(@Param("nombre") String nombre,  @Param("enNevera") boolean enNevera);
	

	  @Query("SELECT new monstermapa.dto.MonsterPrecioDto(" +
	           "m.nombre, m.sabor, tm.precio, t.nombre, t.latitud, t.longitud, " +
	           "CASE WHEN tm.descuento = true THEN tm.precioDescuento ELSE null END, " +
	           "tm.enNevera) " +
	           "FROM TiendaMonster tm " +
	           "JOIN tm.monster m " +
	           "JOIN tm.tienda t " +
	           "WHERE LOWER(m.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) " +
	           "AND (:enNevera = false OR tm.enNevera = :enNevera) " +
	           "ORDER BY CASE WHEN tm.descuento = true THEN tm.precioDescuento ELSE tm.precio END DESC")
	    List<MonsterPrecioDto> buscarPorNombreOrdenadoPorPrecioDesc(@Param("nombre") String nombre,  @Param("enNevera") boolean enNevera);
	    
	    // Contar cuántos productos tiene una tienda
	    @Query("SELECT COUNT(tm) FROM TiendaMonster tm WHERE tm.tienda.id = :tiendaId")
	    int countByTiendaId(@Param("tiendaId") Long tiendaId);
	}
