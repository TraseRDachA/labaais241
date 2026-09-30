-- 1. Все студенты с их группами
SELECT s.studentCardNumber, s.fullName, g.code AS groupCode, g.specialty
  FROM students s
  JOIN groups g ON g.id = s.groupId
 ORDER BY s.fullName;

-- 2. Количество студентов в каждой группе
SELECT g.code, g.specialty, COUNT(s.id) AS studentsCount
  FROM groups g
  LEFT JOIN students s ON s.groupId = g.id
 GROUP BY g.id
 ORDER BY studentsCount DESC;

-- 3. Средний балл по каждой группе 
SELECT g.code, ROUND(AVG(s.gpa), 2) AS avgGpa, COUNT(s.id) AS total
  FROM groups g
  JOIN students s ON s.groupId = g.id
 WHERE s.status = 'Учится'
 GROUP BY g.id
 ORDER BY avgGpa DESC;

-- 4. Топ-5 студентов по среднему баллу 
SELECT fullName, groupCode, gpa
  FROM students
 WHERE status = 'Учится'
 ORDER BY gpa DESC
 LIMIT 5;

-- 5. Должники: студенты с оценкой 2 или Незач по итоговой аттестации
SELECT DISTINCT s.fullName, s.groupCode, d.name AS discipline, gr.exam AS finalGrade
  FROM grades gr
  JOIN students s ON s.id = gr.studentId
  JOIN disciplines d ON d.id = gr.disciplineId
 WHERE gr.exam IN ('2', 'Незач')
 ORDER BY s.fullName;

-- 6. Ведомость: все оценки студентов группы по конкретной дисциплине
SELECT s.fullName, s.studentCardNumber,
       gr.lab1, gr.lab2, gr.lab3, gr.lab4, gr.cw, gr.test, gr.exam,
       gr.finalScore, 
       CASE WHEN gr.isAdmitted = 1 THEN 'Допущен' ELSE 'Не допущен' END AS admission
  FROM grades gr
  JOIN students s ON s.id = gr.studentId
 WHERE gr.semester = 5
   AND gr.groupId = 'g-1'
   AND gr.disciplineId = 'd-1'
 ORDER BY s.fullName;

-- 7. Нагрузка преподавателей: сколько дисциплин ведёт каждый
SELECT t.fullName AS teacher, COUNT(d.id) AS disciplinesCount, SUM(d.hours) AS totalHours
  FROM teachers t
  LEFT JOIN disciplines d ON d.teacherId = t.id
 GROUP BY t.id
 ORDER BY disciplinesCount DESC;

-- 8. Распределение оценок
SELECT
    SUM(CASE WHEN finalScore >= 4.5 THEN 1 ELSE 0 END) AS count5,
    SUM(CASE WHEN finalScore >= 3.5 AND finalScore < 4.5 THEN 1 ELSE 0 END) AS count4,
    SUM(CASE WHEN finalScore >= 2.5 AND finalScore < 3.5 THEN 1 ELSE 0 END) AS count3,
    SUM(CASE WHEN finalScore > 0 AND finalScore < 2.5 THEN 1 ELSE 0 END) AS count2
  FROM grades;

-- 9. Качество знаний
SELECT
    ROUND(100.0 * SUM(CASE WHEN finalScore >= 3.5 THEN 1 ELSE 0 END) / COUNT(*), 2) AS qualityPercent,
    ROUND(100.0 * SUM(CASE WHEN finalScore >= 2.5 THEN 1 ELSE 0 END) / COUNT(*), 2) AS successPercent,
    COUNT(*) AS totalGrades
  FROM grades
 WHERE finalScore > 0;

-- 10. Студенты на бюджете vs контракте
SELECT
    CASE WHEN budget = 1 THEN 'Бюджет' ELSE 'Контракт' END AS financing,
    COUNT(*) AS count
  FROM students
 GROUP BY budget;

-- 11. Успеваемость по семестрам (агрегация)
SELECT semester,
       COUNT(DISTINCT studentId) AS studentsCount,
       COUNT(*) AS gradesCount,
       ROUND(AVG(finalScore), 2) AS avgScore
  FROM grades
 WHERE finalScore > 0
 GROUP BY semester
 ORDER BY semester;

-- 12. Преподаватели, у которых есть студенты-должники
SELECT DISTINCT t.fullName AS teacher, d.name AS discipline
  FROM teachers t
  JOIN disciplines d ON d.teacherId = t.id
  JOIN grades g ON g.disciplineId = d.id
 WHERE g.exam IN ('2', 'Незач')
 ORDER BY t.fullName;

-- 13. Студенты, у которых нет ни одной оценки в 5 семестре
SELECT s.fullName, s.groupCode
  FROM students s
  LEFT JOIN grades g ON g.studentId = s.id AND g.semester = 5
 WHERE g.id IS NULL;

-- 14. Полная карточка студента: все его оценки по всем дисциплинам
SELECT d.name AS discipline, d.semester, d.controlType,
       g.lab1, g.lab2, g.lab3, g.lab4, g.cw, g.test, g.exam,
       g.finalScore, 
       CASE WHEN g.isAdmitted = 1 THEN 'Допущен' ELSE 'Не допущен' END AS admission
  FROM grades g
  JOIN disciplines d ON d.id = g.disciplineId
 WHERE g.studentId = 's-1'
 ORDER BY d.semester, d.code;

-- 15. Статистика по кафедрам: количество дисциплин и средний балл
SELECT d.department, COUNT(DISTINCT d.id) AS disciplines,
       ROUND(AVG(g.finalScore), 2) AS avgScore
  FROM disciplines d
  LEFT JOIN grades g ON g.disciplineId = d.id AND g.finalScore > 0
 GROUP BY d.department
 ORDER BY avgScore DESC;