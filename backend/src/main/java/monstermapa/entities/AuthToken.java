package monstermapa.entities;

import java.time.LocalDateTime;

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

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "auth_tokens")
public class AuthToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime fechaExpiracion;
    
    @Column(nullable = false)
    private Boolean valido = true;
    
    public AuthToken(String token, Usuario usuario, int horasValidez) {
        this.token = token;
        this.usuario = usuario;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaExpiracion = this.fechaCreacion.plusHours(horasValidez);
    }
    
    public boolean isValid() {
        return this.valido && LocalDateTime.now().isBefore(this.fechaExpiracion);
    }
} 