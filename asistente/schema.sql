-- Tablas del asistente. Correr una vez: npm run db:crear

CREATE TABLE IF NOT EXISTS tareas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chat TEXT NOT NULL,                -- tg:<id> o wa:<numero>
  titulo TEXT NOT NULL,
  detalles TEXT,
  vence INTEGER NOT NULL,            -- epoch en ms (UTC)
  aviso_min INTEGER NOT NULL DEFAULT 0,
  repetir TEXT NOT NULL DEFAULT 'no', -- no | diario | semanal | mensual
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | hecha | cancelada
  aviso_previo_enviado INTEGER NOT NULL DEFAULT 0,
  aviso_enviado INTEGER NOT NULL DEFAULT 0,
  creada INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS tareas_por_vencer ON tareas (estado, vence);
CREATE INDEX IF NOT EXISTS tareas_por_chat ON tareas (chat, estado, vence);

-- Estado de la conversación: la actividad a medio armar y los últimos mensajes.
CREATE TABLE IF NOT EXISTS chats (
  chat TEXT PRIMARY KEY,
  borrador TEXT,
  historial TEXT NOT NULL DEFAULT '[]',
  ultimo_resumen TEXT,               -- fecha local (YYYY-MM-DD) del último resumen
  actualizado INTEGER NOT NULL
);
