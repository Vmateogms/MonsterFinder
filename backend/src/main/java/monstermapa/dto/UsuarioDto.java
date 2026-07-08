package monstermapa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UsuarioDto {

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class RequestRegistro {
	
	@NotBlank(message = "El nombre de usuario es obligatorio")
	@Size(min = 3, max = 20, message = "El nombre de usuario debe tener entre 3 y 20 caracteres")
	private String username;
	
	@NotBlank(message = "El email es obligatorio")
	@Email(message = "Formato de email inválido")
	private String email;
	
	@NotBlank(message = "La contraseña es obligatoria")
	@Size(min=6, max=40, message = "La contraseña debe tener entre 6 y 40 caracteres")
	private String password;
	
	@Size(min=3, max=125, message="El nombre tiene que tener al menos 3 letras")
	private String nombreCompleto;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class LoginRequest {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String username;
    
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class AuthResponse {
    private String token;
    private String tipo = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String rol;
    private Integer nivelConfianza;
    private Integer experiencia;
    private Integer nivel;
    private Integer progresoNivel; 
    
    public AuthResponse(String token, Long id, String username, String email, String rol, 
                       Integer nivelConfianza, Integer experiencia, Integer nivel, Integer progresoNivel) {
        this.token = token;
        this.id = id;
        this.username = username;
        this.email = email;
        this.rol = rol;
        this.nivelConfianza = nivelConfianza;
        this.experiencia = experiencia;
        this.nivel = nivel;
        this.progresoNivel = progresoNivel;
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class UserProfileDto {
    private Long id;
    private String username;
    private String email;
    private String nombreCompleto;
    private LocalDateTime fechaRegistro;
    private Integer nivelConfianza;
    private Integer experiencia;
    private Integer nivel;
    private Integer progresoNivel;
    private Integer contribucionesTotales;
    private LocalDateTime ultimoAcceso;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class ChangePasswordRequest {
	@NotBlank(message = "La contraseña actual es obligatoria")
	private String oldPassword;
	
	@NotBlank(message = "La nueva contraseña es obligatoria")
	@Size(min = 6, max = 40, message = "La contraseña debe tener entre 6 y 40 caracteres")
    private String newPassword;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class MessageResponse {
    private String message;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class ExperienciaResponse {
    private Integer experienciaAnterior;
    private Integer experienciaActual;
    private Integer nivelAnterior;
    private Integer nivelActual;
    private Boolean subiNivel;
    private String mensaje;
    
    public String getMensaje() {
        return mensaje;
    }
}
}
