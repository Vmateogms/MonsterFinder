package monstermapa.entities;

import java.util.List;
import lombok.*;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data // Genera getters, setters, toString, etc.
@NoArgsConstructor
@Table(name = "monsters")
@AllArgsConstructor
public class Monster {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String nombre;
	//private Double precio;
	private String sabor;
	private String imagenUrl;
	private String descripcion;
}
