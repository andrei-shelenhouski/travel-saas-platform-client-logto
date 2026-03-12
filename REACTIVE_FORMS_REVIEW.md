# Код-ревью: использование реактивных форм в Angular

## Контекст ревью
Проверен проект на корректность использования **Reactive Forms** (`ReactiveFormsModule`, `FormGroup`, `FormControl`, `FormBuilder`, `Validators`, `formControlName`, `[formGroup]`).

## Общий вывод
В текущем коде реактивные формы **не используются**. В большинстве экранов применяются шаблонные формы (`FormsModule` + `[(ngModel)]`), что для простых сценариев допустимо, но для доменных CRUD-форм в этом проекте приводит к:

- разрозненной и дублируемой валидации;
- ручному преобразованию/нормализации данных перед отправкой;
- отсутствию единообразной модели `valid/invalid/pending` на уровне формы;
- усложнению тестирования и масштабирования форм.

## Найденные проблемы

### 1) Отсутствие Reactive Forms в проекте (High)
По поиску в `src/app` не найдено `ReactiveFormsModule`, `FormGroup`, `FormBuilder`, `formControlName`.

**Риск:** нет централизованной декларативной схемы валидации и типизированной модели формы.

---

### 2) Смешение нативной и ручной валидации вместо формальной модели формы (High)
В шаблонах стоят `required/min/type`, но в `onSubmit()` одновременно реализуются ручные `if`-проверки строк/чисел.

Примеры:
- `create-request` — ручная проверка обязательных полей и дат в `onSubmit()`;
- `create-client` — проверка `name.trim()`;
- `create-offer` — проверка `selectedRequestId`.

**Риск:** рассинхронизация UI-валидации и бизнес-валидации при изменениях.

---

### 3) Валидация форм не связана с состоянием submit-кнопки через `form.valid` (Medium)
Кнопки блокируются через отдельные выражения (`!name.trim()`, `!selectedRequestId`, `saving()`), а не через единый статус формы.

**Риск:** сложно поддерживать консистентность при добавлении новых правил.

---

### 4) Ручное преобразование типов перед отправкой (Medium)
Числовые поля и необязательные значения преобразуются вручную (например, `Number(this.adults) || 1`).

**Риск:** скрытые ошибки и неочевидные fallback-значения при edge-case вводе.

---

### 5) Edit-сценарии также построены без FormGroup (Medium)
`invoice-detail` и `offer-edit` используют отдельные переменные для каждого поля и ручной save-flow.

**Риск:** сложно добавлять cross-field validation, async validators и состояние `dirty/touched`.

## Рекомендации

1. Для всех CRUD-форм перейти на `ReactiveFormsModule` + типизированные `FormGroup`.
2. Валидацию перенести в `Validators` (required, email, min, pattern), убрать дублирующие `if` из `onSubmit()`.
3. Submit-кнопки завязать на `form.invalid || form.pending || saving()`.
4. Для редактирования (`offer-edit`, `invoice-detail`) использовать `patchValue` и единый `form.value` -> DTO mapper.
5. Для сложных правил добавить cross-field validators (например, `startDate <= endDate`).

## Приоритет миграции
1. `create-request`, `create-offer`, `offer-edit` (максимальный объём бизнес-данных).
2. `create-client`, `create-lead`, `create-invoice`.
3. Локальные/вспомогательные формы-компоненты (`comment`, `tag-selector`) — по необходимости.

## Быстрый целевой стандарт
Для каждой формы:
- типизированный `FormGroup`;
- все обязательные/форматные проверки в `Validators`;
- отображение ошибок по `control.errors` и `touched/dirty`;
- submit только при `form.valid`;
- единый mapper из `form.getRawValue()` в DTO.
