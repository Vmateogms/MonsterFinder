package monstermapa.entities;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "usuarios")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    private String nombreCompleto;
	
    @Column(columnDefinition = "VARCHAR(255) DEFAULT 'ROLE_USER'" )
    private String rol = "ROLE_USER";
    
    @Column(nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();
    
    @Column(nullable = false)
    private Boolean activo = true;
    
    private Integer nivelConfianza = 0;  // 0-100, aumenta con buenas acciones, disminuye con reportes
  
    //Sistema de XP y niveles
    
    @Column(nullable = false)
    private Integer experiencia = 0;
    
    @Column(nullable = false)
    private Integer nivel = 1;
    
    // Control de límite diario de XP
    @Column(name = "xp_ganada_hoy", nullable = false)
    private Integer xpGanadaHoy = 0;
    
    @Column(name = "ultimo_dia_actividad")
    private LocalDateTime ultimoDiaActividad;
    
    // Flag para identificar cuentas sospechosas o maliciosas
    private Boolean marcadoSospechoso = false;
    
    // Contador para tiendas creadas recientemente (reset periódico)
    private Integer tiendasCreadasRecientes = 0;
    
    // Último login
    private LocalDateTime ultimoAcceso;
    
    // Tiendas favoritas del usuario
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "usuario_tiendas_favoritas",
        joinColumns = @JoinColumn(name = "usuario_id"),
        inverseJoinColumns = @JoinColumn(name = "tienda_id")
    )
    private Set<Tienda> tiendasFavoritas = new HashSet<>();
    
    // Constructor simplificado para registro
    public Usuario(String username, String email, String password, String nombreCompleto) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.nombreCompleto = nombreCompleto;
    }
	
    // Métodos para gestionar tiendas favoritas
    public void agregarTiendaFavorita(Tienda tienda) {
        this.tiendasFavoritas.add(tienda);
    }
    
    public void eliminarTiendaFavorita(Tienda tienda) {
        this.tiendasFavoritas.remove(tienda);
    }
    
    public boolean esTiendaFavorita(Long tiendaId) {
        return this.tiendasFavoritas.stream()
            .anyMatch(tienda -> tienda.getId().equals(tiendaId));
    }
    
    // Getters explícitos para asegurar compatibilidad
    public Long getId() {
        return this.id;
    }
    
    public String getUsername() {
        return this.username;
    }
    
    public String getEmail() {
        return this.email;
    }
    
    public String getPassword() {
        return this.password;
    }
    
    public String getRol() {
        return this.rol;
    }
    
    public Integer getNivelConfianza() {
        return this.nivelConfianza;
    }
    
    public Integer getExperiencia() {
        return this.experiencia;
    }
    
    public Integer getNivel() {
        return this.nivel;
    }
    
    public String getNombreCompleto() {
        return this.nombreCompleto;
    }
    
    public LocalDateTime getFechaRegistro() {
        return this.fechaRegistro;
    }
    
    public LocalDateTime getUltimoAcceso() {
        return this.ultimoAcceso;
    }
    
    public Set<Tienda> getTiendasFavoritas() {
        return this.tiendasFavoritas;
    }
    
    // Setters explícitos para métodos que se usan en los servicios
    public void setUltimoAcceso(LocalDateTime ultimoAcceso) {
        this.ultimoAcceso = ultimoAcceso;
    }
    
    public void setExperiencia(Integer experiencia) {
        this.experiencia = experiencia;
    }
    
    public void setNivel(Integer nivel) {
        this.nivel = nivel;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    // Getters y setters para control de límite diario
    public Integer getXpGanadaHoy() {
        return this.xpGanadaHoy;
    }
    
    public void setXpGanadaHoy(Integer xpGanadaHoy) {
        this.xpGanadaHoy = xpGanadaHoy;
    }
    
    public LocalDateTime getUltimoDiaActividad() {
        return this.ultimoDiaActividad;
    }
    
    public void setUltimoDiaActividad(LocalDateTime ultimoDiaActividad) {
        this.ultimoDiaActividad = ultimoDiaActividad;
    }
    
    // Método para resetear XP diaria si es un nuevo día
    public boolean resetearXpDiariaSiNecesario() {
        LocalDateTime hoy = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        
        if (this.ultimoDiaActividad == null || 
            this.ultimoDiaActividad.withHour(0).withMinute(0).withSecond(0).withNano(0).isBefore(hoy)) {
            this.xpGanadaHoy = 0;
            this.ultimoDiaActividad = LocalDateTime.now();
            return true;
        }
        
        return false;
    }
}
