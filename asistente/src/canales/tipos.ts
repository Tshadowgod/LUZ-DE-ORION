export interface Boton {
  id: string; // ej. "hecho:12"
  titulo: string;
}

export interface Canal {
  /** Respuesta normal, dentro de una conversación. */
  enviar(destino: string, texto: string, botones?: Boton[]): Promise<void>;
  /** Aviso que sale solo (recordatorio). En WhatsApp puede necesitar plantilla. */
  avisar(destino: string, texto: string, botones?: Boton[]): Promise<void>;
}
