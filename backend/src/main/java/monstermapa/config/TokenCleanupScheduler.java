package monstermapa.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import monstermapa.service.UsuarioService;

@Configuration
@EnableScheduling
public class TokenCleanupScheduler {

    @Autowired
    private UsuarioService usuarioService;
    
    // Programar limpieza de tokens cada 1 hora
    @Scheduled(fixedRate = 3600000)
    public void limpiarTokensExpirados() {
        usuarioService.limpiarTokensExpirados();
    }
} 