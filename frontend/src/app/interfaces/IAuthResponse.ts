export interface IAuthResponse {
    token: string;
    tipo: string; // Tipo de token (Bearer, etc.)
    id: number;
    username: string;
    email: string;
    rol: string;
    nivelConfianza: number;
    experiencia: number;
    nivel: number;
    progresoNivel: number;
  }
  