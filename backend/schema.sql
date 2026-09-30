-- ============================================================
-- ИС «ЕдуСтат» — Схема базы данных (DDL)
-- СУБД: SQLite 3
-- Назначение: учёт успеваемости студентов
-- Нормализация: 3НФ
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Таблица: users — учётные записи пользователей системы
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,              -- "u-1"
    username    TEXT UNIQUE NOT NULL,          -- логин
    password    TEXT NOT NULL,                 -- пароль (в открытом виде для учебного проекта)
    fullName    TEXT NOT NULL,                 -- ФИО
    role        TEXT NOT NULL,                 -- "admin" | "dean" | "teacher" | "student"
    roleName    TEXT,                          -- "Системный администратор" и т.д.
    email       TEXT,
    avatar      TEXT,                          -- URL аватара
    department  TEXT,                          -- подразделение/кафедра
    teacherId   TEXT,                          -- FK на teachers (для преподавателей)
    studentId   TEXT,                          -- FK на students (для студентов)
    groupCode   TEXT,                          -- шифр группы (для студентов)
    createdAt   TEXT                           -- ISO 8601
);

-- ------------------------------------------------------------
-- Таблица: groups — академические группы
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS groups (
    id           TEXT PRIMARY KEY,             -- "g-1"
    code         TEXT UNIQUE NOT NULL,         -- "ПИ-21"
    course       INTEGER NOT NULL,             -- 1..6
    faculty      TEXT,                         -- "ФИТ"
    specialty    TEXT,                         -- "09.03.04 Программная инженерия"
    curator      TEXT,                         -- куратор группы
    studentCount INTEGER DEFAULT 0             -- денормализованный счётчик
);

-- ------------------------------------------------------------
-- Таблица: teachers — преподаватели
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teachers (
    id         TEXT PRIMARY KEY,               -- "t-1"
    fullName   TEXT NOT NULL,                  -- ФИО
    degree     TEXT,                           -- учёная степень / должность
    department TEXT,                           -- кафедра
    email      TEXT,
    phone      TEXT
);

-- ------------------------------------------------------------
-- Таблица: disciplines — учебные дисциплины
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disciplines (
    id          TEXT PRIMARY KEY,              -- "d-1"
    code        TEXT NOT NULL,                 -- "SE-301"
    name        TEXT NOT NULL,                 -- название
    semester    INTEGER NOT NULL,              -- 1..8
    hours       INTEGER DEFAULT 144,           -- академические часы
    controlType TEXT NOT NULL,                 -- "Экзамен" | "Зачет" | "Диф. зачет"
    department  TEXT,                          -- кафедра
    teacherId   TEXT REFERENCES teachers(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Таблица: students — студенты
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id                TEXT PRIMARY KEY,        -- "s-1"
    fullName          TEXT NOT NULL,           -- ФИО
    groupId           TEXT REFERENCES groups(id) ON DELETE SET NULL,
    groupCode         TEXT,                    -- денормализация для быстрого поиска
    studentCardNumber TEXT,                    -- номер зачётки
    email             TEXT,
    phone             TEXT,
    status            TEXT DEFAULT 'Учится',   -- "Учится" | "Академический отпуск" | "Отчислен"
    budget            INTEGER DEFAULT 1,       -- 1 = бюджет, 0 = контракт
    gpa               REAL DEFAULT 0           -- средний балл (денормализация)
);

-- ------------------------------------------------------------
-- Таблица: grades — оценки студентов
-- Одна строка = один студент × одна дисциплина × один семестр
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grades (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    semester     INTEGER NOT NULL,
    groupId      TEXT NOT NULL,
    disciplineId TEXT NOT NULL,
    studentId    TEXT NOT NULL,
    lab1         TEXT DEFAULT '',              -- оценка за лабу 1 (число как строка, "Зач", "Незач", "")
    lab2         TEXT DEFAULT '',
    lab3         TEXT DEFAULT '',
    lab4         TEXT DEFAULT '',
    cw           TEXT DEFAULT '',              -- курсовая работа
    test         TEXT DEFAULT '',              -- рубежный тест
    exam         TEXT DEFAULT '',              -- итоговая аттестация
    finalScore   REAL DEFAULT 0,               -- средний балл (вычисляется)
    isAdmitted   INTEGER DEFAULT 0,            -- 1 = допущен, 0 = нет
    UNIQUE(semester, groupId, disciplineId, studentId)
);

-- ------------------------------------------------------------
-- Таблица: auditLogs — журнал действий пользователей
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditLogs (
    id        TEXT PRIMARY KEY,                -- "log-..."
    timestamp TEXT NOT NULL,                   -- ISO 8601
    userId    TEXT,                            -- FK на users (или NULL)
    userName  TEXT,                            -- ФИО (денормализация)
    role      TEXT,                            -- роль пользователя
    action    TEXT NOT NULL,                   -- "Создание студента", "Выставление оценки" и т.д.
    details   TEXT,                            -- детали операции
    ipAddress TEXT                             -- IP-адрес
);

-- ------------------------------------------------------------
-- Индексы для оптимизации запросов
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_grades_key
    ON grades(semester, groupId, disciplineId);

CREATE INDEX IF NOT EXISTS idx_grades_student
    ON grades(studentId, semester);

CREATE INDEX IF NOT EXISTS idx_students_group
    ON students(groupId);

CREATE INDEX IF NOT EXISTS idx_students_status
    ON students(status);

CREATE INDEX IF NOT EXISTS idx_disciplines_semester
    ON disciplines(semester);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp
    ON auditLogs(timestamp DESC);