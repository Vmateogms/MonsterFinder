package monstermapa.entities;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Entity
@Data // <- Esto genera los getters/setters
@Table(name = "tienda_monsters")
@NoArgsConstructor
@AllArgsConstructor
public class TiendaMonster {
	@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "tienda_id")
    private Tienda tienda;
    
    @JsonManagedReference
    @ManyToOne
    @JoinColumn(name = "monster_id")
    private Monster monster;
    
    private Double precio;
    
    private Boolean descuento = false;
    
    @Column(name = "precio_descuento", precision = 10, scale = 2)
    private BigDecimal precioDescuento;
    
    @Column(name = "en_nevera", nullable = false)
    private Boolean enNevera = false;
    
    // Métodos getter explícitos
    public Monster getMonster() {
        return this.monster;
    }
    
    public Double getPrecio() {
        return this.precio;
    }
    
    public Boolean getDescuento() {
        return descuento != null ? descuento : false;
    }

    public void setDescuento(Boolean descuento) {
        this.descuento = descuento != null ? descuento : false;
    }
    
    public BigDecimal getPrecioDescuento() {
        return precioDescuento;
    }
    
    public void setPrecioDescuento(BigDecimal precioDescuento) {
        this.precioDescuento = precioDescuento;
    }
    
    // Método setter explícito para tienda
    public void setTienda(Tienda tienda) {
        this.tienda = tienda;
    }
    
    // Método setter explícito para monster
    public void setMonster(Monster monster) {
        this.monster = monster;
    }
    
    // Método setter explícito para precio
    public void setPrecio(Double precio) {
        this.precio = precio;
    }
    
    // Método getter/setter para enNevera
    public Boolean getEnNevera() {
        return this.enNevera != null ? this.enNevera : false;
    }
    
    public void setEnNevera(Boolean enNevera) {
        this.enNevera = enNevera != null ? enNevera : false;
    }
}