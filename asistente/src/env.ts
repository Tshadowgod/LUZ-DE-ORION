export interface Env {
  DB: D1Database;
  AI: Ai;

  ZONA_HORARIA: string;
  HORA_RESUMEN: string;
  AVISO_PREVIO_MIN: string;
  USUARIOS_PERMITIDOS: string;

  // Telegram (secretos)
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_SECRETO?: string;

  // WhatsApp Cloud API (opcional)
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_PLANTILLA: string;
  WHATSAPP_PLANTILLA_IDIOMA: string;
  WHATSAPP_API_VERSION: string;
  WHATSAPP_TOKEN?: string;
  WHATSAPP_APP_SECRET?: string;
  WHATSAPP_VERIFY_TOKEN?: string;

  // Claude (opcional)
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODELO: string;
}
