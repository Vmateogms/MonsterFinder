package monstermapa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Permitir credenciales
        config.setAllowCredentials(true);
        
        // Orígenes permitidos
        config.addAllowedOrigin("http://localhost:4200");
        config.addAllowedOrigin("http://localhost:8100");
        config.addAllowedOrigin("https://monsterfinder.vmateogm.com");
        
        // Permitir todos los headers y métodos
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        
        // Exponer headers específicos al frontend
        config.setExposedHeaders(Arrays.asList("X-Experiencia-Ganada", "X-Mensaje-Experiencia", "Authorization"));
        
        // Tiempo máximo de cache para preflight
        config.setMaxAge(3600L);
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
} 