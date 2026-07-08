package monstermapa.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import monstermapa.dto.MonsterPrecioDto;
import monstermapa.repository.tiendaMonsterRepository;

@Service
public class MonsterService {

	@Autowired
	private tiendaMonsterRepository tmrepo;
	
	public List<MonsterPrecioDto> filtrarPorNombreYPrecio (String nombre, String ordenPrecio, boolean enNevera) {
		List<MonsterPrecioDto> resultados;
		
		
		if(ordenPrecio.equals("precioAscendente")) {
			resultados = tmrepo. buscarPorNombreOrdenadoPorPrecioAsc(nombre, enNevera);
		} else  {
			resultados = tmrepo.buscarPorNombreOrdenadoPorPrecioDesc(nombre, enNevera);
		}
		
		return resultados;
	
	}
}
