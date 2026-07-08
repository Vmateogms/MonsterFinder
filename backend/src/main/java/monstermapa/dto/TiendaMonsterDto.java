package monstermapa.dto;

import java.math.BigDecimal;

import lombok.Data;



public class TiendaMonsterDto {

   


	 private Integer monsterId;

    private BigDecimal precio;
    
    private Boolean descuento;
    
    private BigDecimal precioDescuento; 
    
    private Boolean enNevera;
    
    // Getters y setters
    public Integer getMonsterId() {
        return monsterId;
    }

    public void setMonsterId(Integer monsterId) {
        this.monsterId = monsterId;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }
    public Boolean getDescuento() {
        return descuento != null ? descuento : false;
    }

    public void setDescuento(Boolean descuento) {
        this.descuento = descuento;
    }
    public BigDecimal getPrecioDescuento() {
        return precioDescuento;
    }
    
    public void setPrecioDescuento(BigDecimal precioDescuento) {
        if (this.descuento != null && this.descuento) {
            this.precioDescuento = precioDescuento;
        } else {
            this.precioDescuento = null;
        }
    }
}
    
    