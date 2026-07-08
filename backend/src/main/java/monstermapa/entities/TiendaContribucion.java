package monstermapa.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tiendas_contribuciones")
public class TiendaContribucion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tienda_id", nullable = false)
    private Tienda tienda;
    
    // Tipo de contribución: CREACION, EDICION_PRECIO, AÑADIR_PRODUCTO, etc.
    @Column(nullable = false)
    private String tipoContribucion;
    
    @Column(nullable = false)
    private LocalDateTime fechaContribucion = LocalDateTime.now();
    
    // Detalles adicionales en formato JSON si es necesario
    @Column(columnDefinition = "TEXT")
    private String detalles;
    
    // Si la contribución ha sido reportada
    private Boolean reportada = false;
    
    // Si la contribución ha sido verificada por otros usuarios
    private Integer verificaciones = 0;
    
    // Si la contribución ha sido rechazada/marcada como incorrecta
    private Integer rechazos = 0;
    
    // Métodos explícitos para establecer valores
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
    
    public void setTienda(Tienda tienda) {
        this.tienda = tienda;
    }
    
    public void setTipoContribucion(String tipoContribucion) {
        this.tipoContribucion = tipoContribucion;
    }
    
    public void setDetalles(String detalles) {
        this.detalles = detalles;
    }
    
    public Usuario getUsuario() {
        return usuario;
    }
    
    public Tienda getTienda() {
        return tienda;
    }
    
    public String getTipoContribucion() {
        return tipoContribucion;
    }
    
    public LocalDateTime getFechaContribucion() {
        return fechaContribucion;
    }
    
    public String getDetalles() {
        return detalles;
    }
    
    public Boolean getReportada() {
        return reportada;
    }
    
    public Integer getVerificaciones() {
        return verificaciones;
    }
    
    public Integer getRechazos() {
        return rechazos;
    }
    
    public Long getId() {
        return id;
    }
}
