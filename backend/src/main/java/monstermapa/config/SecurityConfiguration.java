package monstermapa.config;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.provisioning.UserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import static org.springframework.security.config.Customizer.withDefaults;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

	@Autowired
	private CorsFilter corsFilter;
	
	@Autowired
	private JwtTokenFilter jwtTokenFilter;

	@Bean
	UserDetailsManager usersCustom(DataSource dataSource) {
		JdbcUserDetailsManager users = new JdbcUserDetailsManager(dataSource);
		// Consulta para obtener datos del usuario
        users.setUsersByUsernameQuery("SELECT username, password, activo FROM usuarios WHERE username = ?");
        // Consulta para obtener roles
        users.setAuthoritiesByUsernameQuery("SELECT username, rol FROM usuarios WHERE username = ?");
        return users;
	}
	
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
	
	//Config principal (filtros y permisos)
	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
		.addFilterBefore(corsFilter, UsernamePasswordAuthenticationFilter.class)
		.addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class) // Agregar filtro JWT
		.csrf(csrf -> csrf.disable()) // Deshabilitar CSRF para permitir peticiones del front
		.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
		.authorizeHttpRequests(auth -> auth
			// Rutas públicas
			.requestMatchers("/api/usuarios/registro", "/api/usuarios/login", "/api/usuarios/verificar-token").permitAll()
			.requestMatchers("/api/usuarios/recompensa").permitAll()
            .requestMatchers("/api/usuarios/perfil").permitAll()
			.requestMatchers("/api/tiendas/**", "/api/tiendas/cercanas/**", "/api/tiendas/buscar/**").permitAll()
			.requestMatchers("/api/productos/all").permitAll()
			.requestMatchers("/api/monsters/**").permitAll()
			.requestMatchers("/api/tienda-monsters/**").permitAll()
            .requestMatchers("/api/favoritos/**").permitAll()
            .requestMatchers("/error").permitAll()
            .requestMatchers("/actuator/**").permitAll()  // Para endpoints de actuator/health
			// Para el resto de rutas, requerir autenticación
			.anyRequest().permitAll()  // Temporalmente permitimos todo para diagnosticar
		)
		.httpBasic(withDefaults());
		
		return http.build();
	}
}
