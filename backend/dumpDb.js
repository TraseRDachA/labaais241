import { db } from './db.js';
import { writeFileSync } from 'fs';

const tables = ['users', 'groups', 'teachers', 'disciplines', 'students', 'grades', 'auditLogs'];

const lines = [];
lines.push('-- ============================================================');
lines.push('-- ИС «ЕдуСтат» — Дамп данных (DML)');
lines.push('-- СУБД: SQLite 3');
lines.push('-- Сгенерировано: ' + new Date().toISOString());
lines.push('-- ============================================================');
lines.push('');
lines.push('BEGIN TRANSACTION;');
lines.push('');

for (const tbl of tables) {
  const rows = db.prepare(`SELECT * FROM ${tbl}`).all();
  lines.push(`-- ------------------------------------------------------------`);
  lines.push(`-- Таблица: ${tbl} (${rows.length} записей)`);
  lines.push(`-- ------------------------------------------------------------`);

  for (const r of rows) {
    const cols = Object.keys(r).join(', ');
    const vals = Object.values(r)
      .map((v) => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
        return String(v);
      })
      .join(', ');
    lines.push(`INSERT INTO ${tbl} (${cols}) VALUES (${vals});`);
  }
  lines.push('');
}

lines.push('COMMIT;');
lines.push('');

writeFileSync('seed.sql', lines.join('\n'), 'utf-8');

console.log('[dumpDb] ✅ Файл seed.sql создан');
console.log('[dumpDb] Строк:', lines.length);
console.log('[dumpDb] Размер:', (lines.join('\n').length / 1024).toFixed(1) + ' KB');