package monstermapa.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class FavoritoDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoritoRequest {
        private Long tiendaId;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FavoritoResponse {
        private String message;
        private boolean success;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TiendaFavoritaDto {
        private Long id;
        private String nombre;
        private Double latitud;
        private Double longitud;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ListaFavoritosResponse {
        private List<TiendaFavoritaDto> favoritos;
        private int total;
    }
} 