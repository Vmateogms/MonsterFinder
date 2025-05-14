export interface IUsuario {
    id: number;
    username: string;
    email: string;
    nombreCompleto?: string;
    rol: string;
    nivelConfianza: number;
    experiencia: number;
    nivel: number;
    progresoNivel: number;
  }