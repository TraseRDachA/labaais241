import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { authRouter } from './routes/auth.js';
import { studentsRouter } from './routes/students.js';
import { groupsRouter } from './routes/groups.js';
import { disciplinesRouter } from './routes/disciplines.js';
import { teachersRouter } from './routes/teachers.js';
import { gradesRouter } from './routes/grades.js';
import { studentPerformanceRouter } from './routes/studentPerformance.js';
import { reportsRouter } from './routes/reports.js';
import { adminRouter } from './routes/admin.js';
import { attachUser } from './middleware/auth.js';

const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(attachUser); 

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/disciplines', disciplinesRouter);
app.use('/api/v1/teachers', teachersRouter);
app.use('/api/v1/grades', gradesRouter);
app.use('/api/v1/student', studentPerformanceRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/admin', adminRouter);

// хпчек
app.get('/api/v1/health', (req, res) => {
  const counts = {
    users:       db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
    groups:      db.prepare('SELECT COUNT(*) AS c FROM groups').get().c,
    teachers:    db.prepare('SELECT COUNT(*) AS c FROM teachers').get().c,
    disciplines: db.prepare('SELECT COUNT(*) AS c FROM disciplines').get().c,
    students:    db.prepare('SELECT COUNT(*) AS c FROM students').get().c,
    grades:      db.prepare('SELECT COUNT(*) AS c FROM grades').get().c,
    auditLogs:   db.prepare('SELECT COUNT(*) AS c FROM auditLogs').get().c
  };

  res.json({
    success: true,
    data: { status: 'ok', counts },
    errors: [],
    message: null
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    errors: ['Маршрут не найден'],
    message: `Не найдено: ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({
    success: false,
    data: null,
    errors: [err.message || 'Внутренняя ошибка сервера'],
    message: err.message || 'Внутренняя ошибка сервера'
  });
});

app.listen(PORT, () => {
  console.log(`\n Бэкенд http://localhost:${PORT}`);
  console.log(`   Health-check:   http://localhost:${PORT}/api/v1/health\n`);
});