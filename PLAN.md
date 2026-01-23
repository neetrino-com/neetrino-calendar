# PLAN.md — Calendar + Daily Schedule Module

## Общее описание проекта

Модуль календаря для админ-панели с поддержкой:
- **Встреч (Meetings)** — события с участниками
- **Дедлайнов (Deadlines)** — важные даты с ответственными
- **Графика смен (Schedule)** — простой список "кто когда работает" на день

### Ключевые особенности:
- 3 режима просмотра: Месяц / Неделя / День
- Панель расписания справа — показывает график на выбранную дату
- Админ может управлять всем, пользователь — только просмотр

---

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Database | SQLite (Prisma) — легко мигрировать на PostgreSQL |
| ORM | Prisma |
| UI Library | shadcn/ui + Tailwind CSS |
| Calendar | FullCalendar (React) |
| Validation | Zod |
| Auth | Минимальная role-based (ADMIN/USER) |
| State | React Query (TanStack Query) |

---

## Архитектура проекта

```
c:\AI\calendar\
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts (или простой session)
│   │       ├── calendar/
│   │       │   └── items/
│   │       │       ├── route.ts (GET, POST)
│   │       │       └── [id]/route.ts (PATCH, DELETE)
│   │       └── schedule/
│   │           ├── route.ts (GET, POST)
│   │           └── [id]/route.ts (PATCH, DELETE)
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── common/
│   │       ├── Avatar.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── features/
│   │   ├── calendar/
│   │   │   ├── components/
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   ├── CalendarToolbar.tsx
│   │   │   │   ├── EventModal.tsx
│   │   │   │   └── EventForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useCalendarItems.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── schedule/
│   │       ├── components/
│   │       │   ├── SchedulePanel.tsx
│   │       │   ├── ScheduleList.tsx
│   │       │   ├── ScheduleEntry.tsx
│   │       │   └── ScheduleForm.tsx
│   │       ├── hooks/
│   │       │   └── useSchedule.ts
│   │       ├── types.ts
│   │       └── utils.ts
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── auth.ts                # Auth utilities
│   │   ├── validations/
│   │   │   ├── calendar.ts        # Zod schemas
│   │   │   └── schedule.ts
│   │   └── utils.ts               # Common utilities
│   └── types/
│       └── index.ts               # Global types
├── public/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── PLAN.md
├── PROGRESS.md
└── README.md
```

---

## Модель данных (Prisma Schema)

### User
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  createdItems      CalendarItem[]
  participations    CalendarItemParticipant[]
  scheduleEntries   ScheduleEntry[]
  createdSchedules  ScheduleEntry[] @relation("ScheduleCreator")
}

enum Role {
  ADMIN
  USER
}
```

### CalendarItem (Meetings + Deadlines)
```prisma
model CalendarItem {
  id          String           @id @default(cuid())
  type        CalendarItemType
  title       String
  description String?
  startAt     DateTime
  endAt       DateTime?
  allDay      Boolean          @default(false)
  status      ItemStatus       @default(DRAFT)
  location    String?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  // Relations
  createdById  String
  createdBy    User @relation(fields: [createdById], references: [id])
  participants CalendarItemParticipant[]

  @@index([startAt, endAt])
  @@index([type])
}

enum CalendarItemType {
  MEETING
  DEADLINE
}

enum ItemStatus {
  DRAFT
  CONFIRMED
  DONE
  CANCELED
}
```

### CalendarItemParticipant
```prisma
model CalendarItemParticipant {
  id     String          @id @default(cuid())
  role   ParticipantRole @default(PARTICIPANT)
  rsvp   RsvpStatus?

  // Relations
  itemId String
  item   CalendarItem @relation(fields: [itemId], references: [id], onDelete: Cascade)
  userId String
  user   User         @relation(fields: [userId], references: [id])

  @@unique([itemId, userId])
}

enum ParticipantRole {
  OWNER
  PARTICIPANT
  RESPONSIBLE
}

enum RsvpStatus {
  YES
  NO
  MAYBE
}
```

### ScheduleEntry (Daily shifts)
```prisma
model ScheduleEntry {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  startTime Int      // Minutes from midnight (0-1439)
  endTime   Int      // Minutes from midnight (0-1439)
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId      String
  user        User   @relation(fields: [userId], references: [id])
  createdById String
  createdBy   User   @relation("ScheduleCreator", fields: [createdById], references: [id])

  @@unique([date, userId])
  @@index([date])
}
```

**Примечание:** `startTime` и `endTime` хранятся как минуты от полуночи (0-1439). Например:
- 10:00 = 600 минут
- 18:30 = 1110 минут

---

## API Endpoints

### Calendar Items

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/calendar/items` | Список событий (с фильтрами) | All |
| POST | `/api/calendar/items` | Создать событие | Admin |
| PATCH | `/api/calendar/items/:id` | Обновить событие | Admin |
| DELETE | `/api/calendar/items/:id` | Удалить событие | Admin |

**Query params для GET:**
- `from` (ISO date) — начало периода
- `to` (ISO date) — конец периода  
- `type` (MEETING | DEADLINE) — фильтр по типу

### Schedule

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/schedule` | Список смен на дату | All |
| POST | `/api/schedule` | Добавить смену | Admin |
| PATCH | `/api/schedule/:id` | Изменить смену | Admin |
| DELETE | `/api/schedule/:id` | Удалить смену | Admin |

**Query params для GET:**
- `date` (YYYY-MM-DD) — дата

---

## Этапы разработки

### Этап 1: Инициализация проекта
- [ ] Создать Next.js проект с TypeScript
- [ ] Настроить Tailwind CSS
- [ ] Установить и настроить Prisma + SQLite
- [ ] Установить shadcn/ui
- [ ] Создать структуру папок
- [ ] Настроить ESLint + Prettier

### Этап 2: База данных
- [ ] Написать Prisma schema
- [ ] Создать миграцию
- [ ] Написать seed script с демо-данными
- [ ] Создать Prisma client singleton

### Этап 3: Аутентификация (минимальная)
- [ ] Создать middleware для проверки роли
- [ ] Реализовать простую сессию (mock или cookie-based)
- [ ] Helper функции для проверки доступа

### Этап 4: API для Calendar Items
- [ ] Zod схемы валидации
- [ ] GET /api/calendar/items (с фильтрами)
- [ ] POST /api/calendar/items
- [ ] PATCH /api/calendar/items/:id
- [ ] DELETE /api/calendar/items/:id
- [ ] Логирование всех операций

### Этап 5: API для Schedule
- [ ] Zod схемы валидации
- [ ] GET /api/schedule
- [ ] POST /api/schedule
- [ ] PATCH /api/schedule/:id
- [ ] DELETE /api/schedule/:id
- [ ] Валидация: endTime > startTime

### Этап 6: UI — Основной layout
- [ ] Layout с Header
- [ ] Настройка темы (светлая)
- [ ] Toast notifications (sonner)
- [ ] Базовые компоненты

### Этап 7: UI — Календарь
- [ ] Интеграция FullCalendar
- [ ] Переключатель Month/Week/Day
- [ ] Фильтры (тип, статус, поиск)
- [ ] Отображение событий с цветовой кодировкой
- [ ] Клик на событие — модальное окно

### Этап 8: UI — Schedule Panel
- [ ] Панель справа (или снизу на мобильных)
- [ ] Список смен на выбранную дату
- [ ] Аватары + имена + время
- [ ] Сортировка по времени начала
- [ ] Кнопка "Добавить" для админа
- [ ] Редактирование/удаление записей

### Этап 9: UI — Формы и модалы
- [ ] Форма создания/редактирования события
- [ ] Форма добавления/редактирования смены
- [ ] Выбор пользователя (searchable select)
- [ ] Time pickers
- [ ] Валидация на клиенте

### Этап 10: Интеграция и тестирование
- [ ] Связать календарь с панелью расписания
- [ ] React Query для кэширования
- [ ] Оптимистичные обновления
- [ ] Обработка ошибок
- [ ] Тестирование всех сценариев

### Этап 11: Финализация
- [ ] README с инструкциями
- [ ] Проверка responsive дизайна
- [ ] Код-ревью и рефакторинг
- [ ] Обновить PROGRESS.md

---

## Возможные риски и нюансы

| Риск | Решение |
|------|---------|
| FullCalendar тяжёлый | Lazy loading, динамический импорт |
| SQLite не поддерживает DATE тип | Использовать DateTime, парсить на уровне приложения |
| Timezone issues | Все даты в UTC, конвертация на клиенте |
| Конфликты смен (один человек дважды) | Unique constraint + валидация в API |
| Много участников в событии | Пагинация в модальном окне |

---

## UI/UX Решения

### Цветовая схема
- **Primary:** Синий (#3B82F6)
- **Meeting:** Зелёный (#22C55E)
- **Deadline:** Красный (#EF4444)
- **Background:** Белый (#FFFFFF)
- **Text:** Тёмно-серый (#1F2937)

### Компоненты
- Сегментированный контрол для переключения видов
- Cards для записей расписания
- Модальные окна для форм
- Toast уведомления (sonner)

---

## Команды для запуска

```bash
# Установка зависимостей
npm install

# Настройка БД
npx prisma migrate dev --name init
npx prisma db seed

# Запуск dev сервера
npm run dev

# Открыть http://localhost:3000
```

---

## Статус

**Текущий этап:** Ожидание утверждения плана

---

*Создано: 22.01.2026*
*Последнее обновление: 22.01.2026*
