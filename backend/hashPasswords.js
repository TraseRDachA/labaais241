import bcrypt from 'bcryptjs';
import { db } from './db.js';

console.log('[hash] Хэшируем...');

const users = db.prepare('SELECT id, username, password FROM users').all();

const updateStmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');

let updated = 0;

for (const user of users) {
  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
    console.log(`[hash] ${user.username}: уже захэширован`);
    continue;
  }

  const hash = bcrypt.hashSync(user.password, 10);
  updateStmt.run(hash, user.id);
  updated++;

  console.log(`[hash] ${user.username}: '${user.password}' → '${hash.slice(0, 20)}...'`);
}

console.log(`[hash] Обновлено: ${updated} из ${users.length}`);
console.log('[hash] Готово!');