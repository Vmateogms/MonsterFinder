package monstermapa.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonsterPrecioDto {
    private String nombreMonster;
    private String sabor;
    private Double precio;  // Cambiado de BigDecimal a Double
    private String nombreTienda;
    private Double latitudTienda;  // Cambiado de BigDecimal a Double
    private Double longitudTienda;  // Cambiado de BigDecimal a Double
    private BigDecimal precioDescuento;
    private Boolean enNevera;
}
