package monstermapa.entities;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.*;
import jakarta.persistence.*;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "tiendas")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Tienda {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private Double latitud;
    private Double longitud;
    private String usuarioCreador;
    
    @JsonManagedReference
    @OneToMany(mappedBy = "tienda", cascade = CascadeType.ALL)
    private List<TiendaMonster> tiendaMonsters = new ArrayList<>();
    
    // Método getter explícito para id
    public Long getId() {
        return this.id;
    }
    
    // Métodos getter explícitos para las propiedades básicas
    public String getNombre() {
        return this.nombre;
    }
    
    public Double getLatitud() {
        return this.latitud;
    }
    
    public Double getLongitud() {
        return this.longitud;
    }
    
    // Getter y setter para el nuevo campo usuarioCreador
    public String getUsuarioCreador() {
        return this.usuarioCreador;
    }
    
    public void setUsuarioCreador(String usuarioCreador) {
        this.usuarioCreador = usuarioCreador;
    }
    
    // Métodos setter explícitos
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }
    
    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
    
    public List<MonsterPrecio> getMonsters() {
        if (tiendaMonsters == null) {
            return new ArrayList<>();
        }
        
        List<MonsterPrecio> result = new ArrayList<>();
        
        for (TiendaMonster tm : tiendaMonsters) {
            Boolean discount = tm.getDescuento() != null ? tm.getDescuento() : false;
            BigDecimal discountPrice = null;
            if (discount && tm.getPrecioDescuento() != null) {
                discountPrice = tm.getPrecioDescuento();
            }
            
            MonsterPrecio mp = new MonsterPrecio();
            mp.setMonster(tm.getMonster());
            mp.setPrecio(tm.getPrecio());
            mp.setDescuento(discount);
            mp.setPrecioDescuento(discountPrice);
            mp.setEnNevera(tm.getEnNevera());
            result.add(mp);
        }
        
        return result;
    }

    // Clase interna para representar un Monster con su precio en la tienda
    public static class MonsterPrecio {
        private Monster monster;
        private Double precio;
        private Boolean descuento;
        private BigDecimal precioDescuento;
        private Boolean enNevera;
        
        // Constructor vacío
        public MonsterPrecio() {
        }
        
        // Constructor con todos los parámetros
        public MonsterPrecio(Monster monster, Double precio, Boolean descuento, BigDecimal precioDescuento) {
            this.monster = monster;
            this.precio = precio;
            this.descuento = descuento;
            this.precioDescuento = precioDescuento;
            this.enNevera=enNevera;
            
        }
        
        // Getters
        public Monster getMonster() {
            return monster;
        }
        
        public Double getPrecio() {
            return precio;
        }
        
        public Boolean getDescuento() {
            return descuento;
        }
        
        public BigDecimal getPrecioDescuento() {
            return precioDescuento;
        }
        public Boolean getEnNevera() {
            return enNevera;
        }
        
        // Setters
        public void setMonster(Monster monster) {
            this.monster = monster;
        }
        
        public void setPrecio(Double precio) {
            this.precio = precio;
        }
        
        public void setDescuento(Boolean descuento) {
            this.descuento = descuento;
        }
        
        public void setPrecioDescuento(BigDecimal precioDescuento) {
            this.precioDescuento = precioDescuento;
        }
        public void setEnNevera(Boolean enNevera) { // Added
            this.enNevera = enNevera;
        }
    }
}
