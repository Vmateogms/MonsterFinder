package monstermapa.config;

public class ExperienciaUtils {

	// Progresión de experiencia personalizada
	private static final int[] XP_POR_NIVEL = {
		0,      // Nivel 0 (no usado)
		1000,   // Nivel 1
		2000,   // Nivel 2
		5000,   // Nivel 3
		8000,   // Nivel 4
		12000,  // Nivel 5
		16000,  // Nivel 6
		20000,  // Nivel 7
		25000,  // Nivel 8
		30000,  // Nivel 9
		40000,  // Nivel 10
		50000,  // Nivel 11
		60000,  // Nivel 12
		70000,  // Nivel 13
		85000,  // Nivel 14
		100000, // Nivel 15
		120000, // Nivel 16
		140000, // Nivel 17
		165000, // Nivel 18
		195000, // Nivel 19
		225000, // Nivel 20
		265000, // Nivel 21
		305000, // Nivel 22
		355000, // Nivel 23
		415000, // Nivel 24
		475000, // Nivel 25
		545000, // Nivel 26
		625000, // Nivel 27
		715000, // Nivel 28
		815000, // Nivel 29
		925000  // Nivel 30
	};
	
	private static final int NIVEL_MAXIMO = 30;
	
	// Recompensas de XP por actividad (ajustadas)
	public static final int XP_CREAR_TIENDA = 500;                // Reducido de 1000
	public static final int XP_AÑADIR_PRODUCTO = 100;             // Valor fijo independiente de cantidad
	public static final int XP_ACTUALIZR_PRECIO = 100;            // Valor fijo por tienda
	public static final int XP_VERIFICAR_CONTRIBUCION = 50;
	public static final int XP_REPORTAR_ERROR = 50;
	
	// Límites diarios de XP
	public static final int LIMITE_DIARIO_XP = 1000;              // Máximo XP por día
	public static final int LIMITE_TIENDA_XP = 100;               // Máximo XP por tienda por edición
	public static final int MAX_TIENDAS_DIARIAS = 5;              // Número máximo de tiendas que dan XP por día
	
	/**
     * Calcula el nivel correspondiente a una cantidad de XP
     * @param xp Experiencia total del usuario
     * @return Nivel calculado
     */
	public static int calcularNivel(int xp) {
		if (xp < XP_POR_NIVEL[1]) {
			return 1; // Si tiene menos del mínimo, es nivel 1
		}
		
		// Buscar en qué nivel se encuentra
		for (int nivel = 1; nivel < NIVEL_MAXIMO; nivel++) {
			if (xp >= XP_POR_NIVEL[nivel] && xp < XP_POR_NIVEL[nivel + 1]) {
				return nivel;
			}
		}
		
		// Si tiene más experiencia que el último nivel, es nivel máximo
		return NIVEL_MAXIMO;
	}
	
    /**
     * Calcula la experiencia necesaria para alcanzar el siguiente nivel
     * @param nivelActual Nivel actual del usuario
     * @return Experiencia necesaria para el siguiente nivel
     */
	public static int xpParaSiguienteNivel(int nivelActual) {
		if (nivelActual < 1) {
			nivelActual = 1;
		}
		
		if (nivelActual >= NIVEL_MAXIMO) {
			return XP_POR_NIVEL[NIVEL_MAXIMO]; // Ya está en nivel máximo
		}
		
		return XP_POR_NIVEL[nivelActual + 1];
	}
	
	/**
     * Calcula el progreso hacia el siguiente nivel (0-100%)
     * @param xpTotal Experiencia total del usuario
     * @param nivelActual Nivel actual del usuario
     * @return Porcentaje de progreso hacia el siguiente nivel
     */
	public static int calcularProgresoNivel(int xpTotal, int nivelActual) {
		if (nivelActual < 1) {
			nivelActual = 1;
		}
		
		if (nivelActual >= NIVEL_MAXIMO) {
			return 100; // Ya está en el nivel máximo
		}
		
		int xpNivelActual = XP_POR_NIVEL[nivelActual];
		int xpSiguienteNivel = XP_POR_NIVEL[nivelActual + 1];
		int xpNecesarios = xpSiguienteNivel - xpNivelActual;
		int xpConseguidos = xpTotal - xpNivelActual;
		
		// Asegurar que el porcentaje esté entre 0 y 100
		int porcentaje = (int) (((double) xpConseguidos / xpNecesarios) * 100);
		return Math.max(0, Math.min(100, porcentaje));
	}
	
	/**
     * Obtiene la experiencia necesaria para un nivel específico
     * @param nivel El nivel para el que se quiere conocer la experiencia necesaria
     * @return Experiencia necesaria para alcanzar ese nivel
     */
    public static int getXpParaNivel(int nivel) {
        if (nivel < 1) {
            return 0;
        }
        
        if (nivel > NIVEL_MAXIMO) {
            return XP_POR_NIVEL[NIVEL_MAXIMO];
        }
        
        return XP_POR_NIVEL[nivel];
    }
}
