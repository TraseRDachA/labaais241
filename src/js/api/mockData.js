// Инициализационные моковые данные (соответствие DTO ASP.NET Core .NET 8)

export const initialMockData = {
  users: [
    {
      id: "u-1",
      username: "admin",
      password: "123",
      fullName: "Иванов Алексей Петрович",
      role: "admin",
      roleName: "Системный администратор",
      email: "admin@university.edu",
      avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
      department: "Отдел IT и администрирования",
      createdAt: "2024-01-10T08:00:00Z"
    },
    {
      id: "u-2",
      username: "dean",
      password: "123",
      fullName: "Смирнова Елена Васильевна",
      role: "dean",
      roleName: "Сотрудник деканата",
      email: "dean.fit@university.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
      department: "Деканат ФИТ",
      createdAt: "2024-01-12T09:30:00Z"
    },
    {
      id: "u-3",
      username: "teacher",
      password: "123",
      fullName: "Кузнецов Дмитрий Сергеевич",
      role: "teacher",
      roleName: "Преподаватель",
      teacherId: "t-1",
      email: "kuznetsov.ds@university.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry",
      department: "Кафедра Программной инженерии",
      createdAt: "2024-02-01T10:00:00Z"
    },
    {
      id: "u-4",
      username: "student",
      password: "123",
      fullName: "Морозов Артём Денисович",
      role: "student",
      roleName: "Студент",
      studentId: "s-1",
      groupCode: "ПИ-21",
      email: "morozov.ad@stud.university.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Artem",
      department: "Факультет Информационных Технологий",
      createdAt: "2024-09-01T07:00:00Z"
    }
  ],

  groups: [
    { id: "g-1", code: "ПИ-21", course: 3, faculty: "ФИТ", specialty: "09.03.04 Программная инженерия", curator: "Кузнецов Д.С.", studentCount: 6 },
    { id: "g-2", code: "ПИ-22", course: 2, faculty: "ФИТ", specialty: "09.03.04 Программная инженерия", curator: "Волков А.Н.", studentCount: 5 },
    { id: "g-3", code: "ИВТ-21", course: 3, faculty: "ФИТ", specialty: "09.03.01 Информатика и ВТ", curator: "Соколова М.И.", studentCount: 5 },
    { id: "g-4", code: "ИС-20", course: 4, faculty: "ФИТ", specialty: "09.03.02 Информационные системы", curator: "Морозов В.П.", studentCount: 5 },
    { id: "g-5", code: "ПМИ-23", course: 1, faculty: "ФИТ", specialty: "01.03.02 Прикладная математика", curator: "Белов К.С.", studentCount: 5 }
  ],

  teachers: [
    { id: "t-1", fullName: "Кузнецов Дмитрий Сергеевич", degree: "к.т.н., доцент", department: "Программная инженерия", email: "kuznetsov.ds@university.edu", phone: "+7 (911) 234-56-78", disciplines: ["d-1", "d-2", "d-8"] },
    { id: "t-2", fullName: "Волков Александр Николаевич", degree: "д.т.н., профессор", department: "Программная инженерия", email: "volkov.an@university.edu", phone: "+7 (911) 345-67-89", disciplines: ["d-3", "d-4"] },
    { id: "t-3", fullName: "Соколова Мария Игоревна", degree: "к.т.н., доцент", department: "Информатика и ВТ", email: "sokolova.mi@university.edu", phone: "+7 (911) 456-78-90", disciplines: ["d-5", "d-6"] },
    { id: "t-4", fullName: "Морозов Виктор Павлович", degree: "к.ф.-м.н., доцент", department: "Высшая математика", email: "morozov.vp@university.edu", phone: "+7 (911) 567-89-01", disciplines: ["d-9", "d-10"] },
    { id: "t-5", fullName: "Белов Константин Сергеевич", degree: "старший преподаватель", department: "Информационная безопасность", email: "belov.ks@university.edu", phone: "+7 (911) 678-90-12", disciplines: ["d-13"] },
    { id: "t-6", fullName: "Федорова Анна Борисовна", degree: "к.т.н., доцент", department: "Программная инженерия", email: "fedorova.ab@university.edu", phone: "+7 (911) 789-01-23", disciplines: ["d-11", "d-12"] },
    { id: "t-7", fullName: "Григорьев Роман Олегович", degree: "к.т.н.", department: "Информатика и ВТ", email: "grigoriev.ro@university.edu", phone: "+7 (911) 890-12-34", disciplines: ["d-7"] },
    { id: "t-8", fullName: "Новикова Татьяна Юрьевна", degree: "доцент", department: "Информационные системы", email: "novikova.ty@university.edu", phone: "+7 (911) 901-23-45", disciplines: ["d-14"] },
    { id: "t-9", fullName: "Павлов Сергей Леонидович", degree: "к.т.н., доцент", department: "Интеллектуальные системы", email: "pavlov.sl@university.edu", phone: "+7 (911) 012-34-56", disciplines: ["d-15"] },
    { id: "t-10", fullName: "Ковалева Ольга Андреевна", degree: "ассистент", department: "Программная инженерия", email: "kovaleva.oa@university.edu", phone: "+7 (911) 123-45-67", disciplines: ["d-2", "d-11"] }
  ],

  disciplines: [
    { id: "d-1", code: "SE-301", name: "Программная инженерия", semester: 5, hours: 144, controlType: "Экзамен", department: "Программная инженерия", teacherId: "t-1" },
    { id: "d-2", code: "WEB-302", name: "Разработка веб-приложений", semester: 5, hours: 108, controlType: "Диф. зачет", department: "Программная инженерия", teacherId: "t-1" },
    { id: "d-3", code: "DB-303", name: "Базы данных и СУБД", semester: 5, hours: 144, controlType: "Экзамен", department: "Программная инженерия", teacherId: "t-2" },
    { id: "d-4", code: "ARC-304", name: "Архитектура программных систем", semester: 6, hours: 144, controlType: "Экзамен", department: "Программная инженерия", teacherId: "t-2" },
    { id: "d-5", code: "ALG-201", name: "Алгоритмы и структуры данных", semester: 3, hours: 180, controlType: "Экзамен", department: "Информатика и ВТ", teacherId: "t-3" },
    { id: "d-6", code: "OOP-202", name: "Объектно-ориентированное программирование", semester: 4, hours: 144, controlType: "Экзамен", department: "Информатика и ВТ", teacherId: "t-3" },
    { id: "d-7", code: "NET-305", name: "Компьютерные сети", semester: 5, hours: 108, controlType: "Зачет", department: "Информатика и ВТ", teacherId: "t-7" },
    { id: "d-8", code: "OS-306", name: "Операционные системы", semester: 5, hours: 144, controlType: "Экзамен", department: "Программная инженерия", teacherId: "t-1" },
    { id: "d-9", code: "MATH-101", name: "Математический анализ", semester: 1, hours: 216, controlType: "Экзамен", department: "Высшая математика", teacherId: "t-4" },
    { id: "d-10", code: "DM-102", name: "Дискретная математика", semester: 2, hours: 144, controlType: "Экзамен", department: "Высшая математика", teacherId: "t-4" },
    { id: "d-11", code: "TEST-401", name: "Тестирование и верификация ПО", semester: 6, hours: 108, controlType: "Диф. зачет", department: "Программная инженерия", teacherId: "t-6" },
    { id: "d-12", code: "PM-402", name: "Управление IT-проектами", semester: 7, hours: 108, controlType: "Зачет", department: "Программная инженерия", teacherId: "t-6" },
    { id: "d-13", code: "SEC-307", name: "Информационная безопасность", semester: 6, hours: 144, controlType: "Экзамен", department: "Информационная безопасность", teacherId: "t-5" },
    { id: "d-14", code: "PROB-203", name: "Теория вероятностей и статистика", semester: 3, hours: 144, controlType: "Экзамен", department: "Информационные системы", teacherId: "t-8" },
    { id: "d-15", code: "AI-403", name: "Методы искусственного интеллекта", semester: 7, hours: 144, controlType: "Экзамен", department: "Интеллектуальные системы", teacherId: "t-9" }
  ],

  students: [
    // Группа ПИ-21 (6 студентов)
    { id: "s-1", fullName: "Морозов Артём Денисович", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-041", email: "morozov.ad@stud.university.edu", phone: "+7 (921) 111-22-33", status: "Учится", budget: true, gpa: 4.8 },
    { id: "s-2", fullName: "Васильев Кирилл Романович", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-042", email: "vasiliev.kr@stud.university.edu", phone: "+7 (921) 111-22-34", status: "Учится", budget: true, gpa: 4.5 },
    { id: "s-3", fullName: "Зайцева Полина Максимовна", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-043", email: "zaitseva.pm@stud.university.edu", phone: "+7 (921) 111-22-35", status: "Учится", budget: true, gpa: 5.0 },
    { id: "s-4", fullName: "Козлов Никита Александрович", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-044", email: "kozlov.na@stud.university.edu", phone: "+7 (921) 111-22-36", status: "Учится", budget: false, gpa: 3.2 },
    { id: "s-5", fullName: "Лебедева София Ильинична", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-045", email: "lebedeva.si@stud.university.edu", phone: "+7 (921) 111-22-37", status: "Академический отпуск", budget: true, gpa: 3.8 },
    { id: "s-6", fullName: "Семёнов Даниил Егорович", groupCode: "ПИ-21", groupId: "g-1", studentCardNumber: "21-ПИ-046", email: "semenov.de@stud.university.edu", phone: "+7 (921) 111-22-38", status: "Учится", budget: false, gpa: 2.8 },

    // Группа ПИ-22 (5 студентов)
    { id: "s-7", fullName: "Богданов Илья Сергеевич", groupCode: "ПИ-22", groupId: "g-2", studentCardNumber: "22-ПИ-011", email: "bogdanov.is@stud.university.edu", phone: "+7 (921) 222-33-01", status: "Учится", budget: true, gpa: 4.6 },
    { id: "s-8", fullName: "Виноградова Дарья Олеговна", groupCode: "ПИ-22", groupId: "g-2", studentCardNumber: "22-ПИ-012", email: "vinogradova.do@stud.university.edu", phone: "+7 (921) 222-33-02", status: "Учится", budget: true, gpa: 4.9 },
    { id: "s-9", fullName: "Гордеев Владислав Викторович", groupCode: "ПИ-22", groupId: "g-2", studentCardNumber: "22-ПИ-013", email: "gordeev.vv@stud.university.edu", phone: "+7 (921) 222-33-03", status: "Учится", budget: false, gpa: 3.7 },
    { id: "s-10", fullName: "Дмитриева Анна Юрьевна", groupCode: "ПИ-22", groupId: "g-2", studentCardNumber: "22-ПИ-014", email: "dmitrieva.ay@stud.university.edu", phone: "+7 (921) 222-33-04", status: "Отчислен", budget: false, gpa: 2.1 },
    { id: "s-11", fullName: "Ершов Михаил Владимирович", groupCode: "ПИ-22", groupId: "g-2", studentCardNumber: "22-ПИ-015", email: "ershov.mv@stud.university.edu", phone: "+7 (921) 222-33-05", status: "Учится", budget: true, gpa: 4.2 },

    // Группа ИВТ-21 (5 студентов)
    { id: "s-12", fullName: "Жуков Тимофей Андреевич", groupCode: "ИВТ-21", groupId: "g-3", studentCardNumber: "21-ИВ-021", email: "zhukov.ta@stud.university.edu", phone: "+7 (921) 333-44-01", status: "Учится", budget: true, gpa: 4.4 },
    { id: "s-13", fullName: "Ильина Мария Артемовна", groupCode: "ИВТ-21", groupId: "g-3", studentCardNumber: "21-ИВ-022", email: "ilina.ma@stud.university.edu", phone: "+7 (921) 333-44-02", status: "Учится", budget: true, gpa: 4.7 },
    { id: "s-14", fullName: "Калинин Георгий Дмитриевич", groupCode: "ИВТ-21", groupId: "g-3", studentCardNumber: "21-ИВ-023", email: "kalinin.gd@stud.university.edu", phone: "+7 (921) 333-44-03", status: "Учится", budget: false, gpa: 3.5 },
    { id: "s-15", fullName: "Лазарева Ксения Павловна", groupCode: "ИВТ-21", groupId: "g-3", studentCardNumber: "21-ИВ-024", email: "lazareva.kp@stud.university.edu", phone: "+7 (921) 333-44-04", status: "Учится", budget: true, gpa: 4.1 },
    { id: "s-16", fullName: "Мельников Марк Романович", groupCode: "ИВТ-21", groupId: "g-3", studentCardNumber: "21-ИВ-025", email: "melnikov.mr@stud.university.edu", phone: "+7 (921) 333-44-05", status: "Учится", budget: false, gpa: 3.0 },

    // Группа ИС-20 (5 студентов)
    { id: "s-17", fullName: "Николаев Ярослав Игоревич", groupCode: "ИС-20", groupId: "g-4", studentCardNumber: "20-ИС-001", email: "nikolaev.yi@stud.university.edu", phone: "+7 (921) 444-55-01", status: "Учится", budget: true, gpa: 4.8 },
    { id: "s-18", fullName: "Орлова Вероника Кирилловна", groupCode: "ИС-20", groupId: "g-4", studentCardNumber: "20-ИС-002", email: "orlova.vk@stud.university.edu", phone: "+7 (921) 444-55-02", status: "Учится", budget: true, gpa: 4.9 },
    { id: "s-19", fullName: "Попов Денис Станиславович", groupCode: "ИС-20", groupId: "g-4", studentCardNumber: "20-ИС-003", email: "popov.ds@stud.university.edu", phone: "+7 (921) 444-55-03", status: "Учится", budget: false, gpa: 3.9 },
    { id: "s-20", fullName: "Романова Алина Тимуровна", groupCode: "ИС-20", groupId: "g-4", studentCardNumber: "20-ИС-004", email: "romanova.at@stud.university.edu", phone: "+7 (921) 444-55-04", status: "Учится", budget: true, gpa: 4.3 },
    { id: "s-21", fullName: "Савельев Глеб Артурович", groupCode: "ИС-20", groupId: "g-4", studentCardNumber: "20-ИС-005", email: "saveliev.ga@stud.university.edu", phone: "+7 (921) 444-55-05", status: "Академический отпуск", budget: false, gpa: 3.1 },

    // Группа ПМИ-23 (5 студентов)
    { id: "s-22", fullName: "Тарасов Матвей Вадимович", groupCode: "ПМИ-23", groupId: "g-5", studentCardNumber: "23-ПМ-001", email: "tarasov.mv@stud.university.edu", phone: "+7 (921) 555-66-01", status: "Учится", budget: true, gpa: 4.5 },
    { id: "s-23", fullName: "Ульянова Валерия Богдановна", groupCode: "ПМИ-23", groupId: "g-5", studentCardNumber: "23-ПМ-002", email: "ulyanova.vb@stud.university.edu", phone: "+7 (921) 555-66-02", status: "Учится", budget: true, gpa: 4.6 },
    { id: "s-24", fullName: "Филиппов Егор Максимович", groupCode: "ПМИ-23", groupId: "g-5", studentCardNumber: "23-ПМ-003", email: "filippov.em@stud.university.edu", phone: "+7 (921) 555-66-03", status: "Учится", budget: false, gpa: 3.4 },
    { id: "s-25", fullName: "Харитонова Елизавета Ильинична", groupCode: "ПМИ-23", groupId: "g-5", studentCardNumber: "23-ПМ-004", email: "haritonova.ei@stud.university.edu", phone: "+7 (921) 555-66-04", status: "Учится", budget: true, gpa: 4.8 },
    { id: "s-26", fullName: "Цветков Руслан Денисович", groupCode: "ПМИ-23", groupId: "g-5", studentCardNumber: "23-ПМ-005", email: "tsvetkov.rd@stud.university.edu", phone: "+7 (921) 555-66-05", status: "Отчислен", budget: false, gpa: 2.2 }
  ],

  // Матрица оценок журнала: ключ "semester_groupId_disciplineId"
  grades: {
    // 5 семестр, ПИ-21, Программная инженерия (d-1)
    "5_g-1_d-1": [
      { studentId: "s-1", lab1: 5, lab2: 5, lab3: 4, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 4.86 },
      { studentId: "s-2", lab1: 4, lab2: 5, lab3: 4, lab4: 4, cw: 5, test: 4, exam: 4, isAdmitted: true, finalScore: 4.29 },
      { studentId: "s-3", lab1: 5, lab2: 5, lab3: 5, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 5.00 },
      { studentId: "s-4", lab1: 3, lab2: 3, lab3: 4, lab4: 3, cw: 3, test: 3, exam: 3, isAdmitted: true, finalScore: 3.14 },
      { studentId: "s-5", lab1: 4, lab2: 4, lab3: "", lab4: "", cw: "", test: "", exam: "", isAdmitted: false, finalScore: 4.00 },
      { studentId: "s-6", lab1: 2, lab2: 3, lab3: 2, lab4: "", cw: 2, test: 2, exam: 2, isAdmitted: false, finalScore: 2.17 }
    ],

    // 5 семестр, ПИ-21, Разработка веб-приложений (d-2)
    "5_g-1_d-2": [
      { studentId: "s-1", lab1: 5, lab2: 5, lab3: 5, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 5.00 },
      { studentId: "s-2", lab1: 5, lab2: 4, lab3: 5, lab4: 4, cw: 4, test: 5, exam: 5, isAdmitted: true, finalScore: 4.57 },
      { studentId: "s-3", lab1: 5, lab2: 5, lab3: 5, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 5.00 },
      { studentId: "s-4", lab1: 4, lab2: 3, lab3: 3, lab4: 4, cw: 3, test: 4, exam: 3, isAdmitted: true, finalScore: 3.43 },
      { studentId: "s-5", lab1: 3, lab2: 3, lab3: "", lab4: "", cw: "", test: "", exam: "", isAdmitted: false, finalScore: 3.00 },
      { studentId: "s-6", lab1: 2, lab2: 2, lab3: 3, lab4: 2, cw: 2, test: 2, exam: 2, isAdmitted: false, finalScore: 2.14 }
    ],

    // 5 семестр, ПИ-21, Базы данных (d-3)
    "5_g-1_d-3": [
      { studentId: "s-1", lab1: 5, lab2: 4, lab3: 5, lab4: 5, cw: 5, test: 4, exam: 5, isAdmitted: true, finalScore: 4.71 },
      { studentId: "s-2", lab1: 4, lab2: 4, lab3: 4, lab4: 4, cw: 4, test: 4, exam: 4, isAdmitted: true, finalScore: 4.00 },
      { studentId: "s-3", lab1: 5, lab2: 5, lab3: 5, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 5.00 },
      { studentId: "s-4", lab1: 3, lab2: 3, lab3: 2, lab4: 3, cw: 3, test: 3, exam: 3, isAdmitted: true, finalScore: 2.86 },
      { studentId: "s-5", lab1: 4, lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: "", isAdmitted: false, finalScore: 4.00 },
      { studentId: "s-6", lab1: 2, lab2: 2, lab3: 2, lab4: 2, cw: "", test: 2, exam: 2, isAdmitted: false, finalScore: 2.00 }
    ],

    // 5 семестр, ПИ-21, Компьютерные сети (d-7)
    "5_g-1_d-7": [
      { studentId: "s-1", lab1: "Зач", lab2: "Зач", lab3: "Зач", lab4: "Зач", cw: "Зач", test: "Зач", exam: "Зач", isAdmitted: true, finalScore: 5.0 },
      { studentId: "s-2", lab1: "Зач", lab2: "Зач", lab3: "Зач", lab4: "Зач", cw: "Зач", test: "Зач", exam: "Зач", isAdmitted: true, finalScore: 5.0 },
      { studentId: "s-3", lab1: "Зач", lab2: "Зач", lab3: "Зач", lab4: "Зач", cw: "Зач", test: "Зач", exam: "Зач", isAdmitted: true, finalScore: 5.0 },
      { studentId: "s-4", lab1: "Зач", lab2: "Зач", lab3: "Зач", lab4: "Зач", cw: "Зач", test: "Зач", exam: "Зач", isAdmitted: true, finalScore: 5.0 },
      { studentId: "s-5", lab1: "Зач", lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: "Незач", isAdmitted: false, finalScore: 2.0 },
      { studentId: "s-6", lab1: "Незач", lab2: "Незач", lab3: "", lab4: "", cw: "", test: "", exam: "Незач", isAdmitted: false, finalScore: 2.0 }
    ],

    // 3 семестр, ПИ-22, Алгоритмы (d-5)
    "3_g-2_d-5": [
      { studentId: "s-7", lab1: 5, lab2: 4, lab3: 5, lab4: 5, cw: 5, test: 4, exam: 5, isAdmitted: true, finalScore: 4.71 },
      { studentId: "s-8", lab1: 5, lab2: 5, lab3: 5, lab4: 5, cw: 5, test: 5, exam: 5, isAdmitted: true, finalScore: 5.00 },
      { studentId: "s-9", lab1: 4, lab2: 3, lab3: 4, lab4: 3, cw: 4, test: 4, exam: 4, isAdmitted: true, finalScore: 3.71 },
      { studentId: "s-10", lab1: 2, lab2: 2, lab3: "", lab4: "", cw: "", test: 2, exam: 2, isAdmitted: false, finalScore: 2.00 },
      { studentId: "s-11", lab1: 4, lab2: 4, lab3: 4, lab4: 4, cw: 4, test: 4, exam: 4, isAdmitted: true, finalScore: 4.00 }
    ]
  },

  auditLogs: [
    { id: "log-1", timestamp: "2026-09-29T18:14:22Z", userId: "u-3", userName: "Кузнецов Д.С.", role: "teacher", action: "Выставление оценки", details: "Лаб 4, студент Морозов А.Д. (оценка 5)", ipAddress: "192.168.1.45" },
    { id: "log-2", timestamp: "2026-09-29T17:50:10Z", userId: "u-2", userName: "Смирнова Е.В.", role: "dean", action: "Редактирование студента", details: "Смена статуса Лебедева С.И. -> Академический отпуск", ipAddress: "192.168.1.12" },
    { id: "log-3", timestamp: "2026-09-29T16:30:05Z", userId: "u-1", userName: "Иванов А.П.", role: "admin", action: "Настройка прав доступа", details: "Обновлена роль преподавателя Кузнецов Д.С.", ipAddress: "192.168.1.2" },
    { id: "log-4", timestamp: "2026-09-29T14:10:00Z", userId: "u-3", userName: "Кузнецов Д.С.", role: "teacher", action: "Формирование ведомости", details: "Дисциплина 'Программная инженерия', группа ПИ-21", ipAddress: "192.168.1.45" },
    { id: "log-5", timestamp: "2026-09-29T11:05:43Z", userId: "u-2", userName: "Смирнова Е.В.", role: "dean", action: "Добавление дисциплины", details: "Новая дисциплина 'Методы искусственного интеллекта'", ipAddress: "192.168.1.12" }
  ]
};
