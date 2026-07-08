package monstermapa.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data // Genera automáticamente getters, setters, toString, etc.
@NoArgsConstructor // Constructor sin argumentos
@AllArgsConstructor // Constructor con todos los argumentos
public class TiendaDto {
    // ID opcional (por si necesitas manejar actualizaciones)
    private Long id;

    // Nombre de la tienda - obligatorio
    private String nombre;

    // Latitud - obligatorio
    private Double latitud;

    // Longitud - obligatorio
    private Double longitud;

    // Usuario que creó la tienda
    private String usuarioCreador;

    // URL de imagen - opcional
    private String imagenUrl;
    
    // Getters y setters explícitos
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public String getUsuarioCreador() {
        return usuarioCreador;
    }

    public void setUsuarioCreador(String usuarioCreador) {
        this.usuarioCreador = usuarioCreador;
    }

    public String getImagenUrl() {
        return imagenUrl;
    }

    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }
}