import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, 'data');
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, 'app.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    fullName    TEXT NOT NULL,
    role        TEXT NOT NULL,
    roleName    TEXT,
    email       TEXT,
    avatar      TEXT,
    department  TEXT,
    teacherId   TEXT,
    studentId   TEXT,
    groupCode   TEXT,
    createdAt   TEXT
  );

  CREATE TABLE IF NOT EXISTS groups (
    id           TEXT PRIMARY KEY,
    code         TEXT UNIQUE NOT NULL,
    course       INTEGER NOT NULL,
    faculty      TEXT,
    specialty    TEXT,
    curator      TEXT,
    studentCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS teachers (
    id         TEXT PRIMARY KEY,
    fullName   TEXT NOT NULL,
    degree     TEXT,
    department TEXT,
    email      TEXT,
    phone      TEXT
  );

  CREATE TABLE IF NOT EXISTS disciplines (
    id          TEXT PRIMARY KEY,
    code        TEXT NOT NULL,
    name        TEXT NOT NULL,
    semester    INTEGER NOT NULL,
    hours       INTEGER DEFAULT 144,
    controlType TEXT NOT NULL,
    department  TEXT,
    teacherId   TEXT REFERENCES teachers(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id                TEXT PRIMARY KEY,
    fullName          TEXT NOT NULL,
    groupId           TEXT REFERENCES groups(id) ON DELETE SET NULL,
    groupCode         TEXT,
    studentCardNumber TEXT,
    email             TEXT,
    phone             TEXT,
    status            TEXT DEFAULT 'Учится',
    budget            INTEGER DEFAULT 1,
    gpa               REAL DEFAULT 0
  );

  -- Оценки: одна строка = одна ячейка журнала
  -- semester/groupId/disciplineId/studentId + поле (lab1..exam)
  CREATE TABLE IF NOT EXISTS grades (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    semester     INTEGER NOT NULL,
    groupId      TEXT NOT NULL,
    disciplineId TEXT NOT NULL,
    studentId    TEXT NOT NULL,
    lab1         TEXT DEFAULT '',
    lab2         TEXT DEFAULT '',
    lab3         TEXT DEFAULT '',
    lab4         TEXT DEFAULT '',
    cw           TEXT DEFAULT '',
    test         TEXT DEFAULT '',
    exam         TEXT DEFAULT '',
    finalScore   REAL DEFAULT 0,
    isAdmitted   INTEGER DEFAULT 0,
    UNIQUE(semester, groupId, disciplineId, studentId)
  );

  CREATE TABLE IF NOT EXISTS auditLogs (
    id        TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    userId    TEXT,
    userName  TEXT,
    role      TEXT,
    action    TEXT NOT NULL,
    details   TEXT,
    ipAddress TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_grades_key ON grades(semester, groupId, disciplineId);
  CREATE INDEX IF NOT EXISTS idx_students_group ON students(groupId);
  CREATE INDEX IF NOT EXISTS idx_disciplines_sem ON disciplines(semester);
`);

console.log('[db] SQLite готова:', dbPath);