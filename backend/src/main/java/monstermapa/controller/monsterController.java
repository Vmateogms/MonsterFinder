package monstermapa.controller;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import monstermapa.dto.MonsterPrecioDto;
import monstermapa.entities.Monster;
import monstermapa.repository.monsterRepository;
import monstermapa.service.MonsterService;

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:8100", "https://monsterfinder.vmateogm.com"}, allowCredentials = "true")
@RestController
@RequestMapping("/api/monsters")
public class monsterController {

	@Autowired
	private monsterRepository mrepo;
	
	@Autowired
	private MonsterService mservice;
	
	@GetMapping("")
	public List<Monster> getAllMonsters(){
		
		return mrepo.findAll();
		
	}
	
	@GetMapping("/filtrar")
	public List<MonsterPrecioDto> filtrarMonster(
			@RequestParam String nombre,
			@RequestParam String ordenPrecio,
	  @RequestParam(required = false, defaultValue = "false") boolean enNevera) {
		return mservice.filtrarPorNombreYPrecio(nombre, ordenPrecio, enNevera);
	}
	
	
	
}
