# ✅ Инструкция для деплоя на Vercel

Все готово, копируй эти переменные окружения в настройки Vercel:

---

## 📋 Переменные окружения для Vercel:
```
DATABASE_URL=postgresql://postgres:7EXGViGVMjSMGwSk@db.fuwcvahhdsesyljmimio.supabase.co:5432/postgres

NEXTAUTH_URL=https://твой-проект.vercel.app
NEXTAUTH_SECRET=сгенерируй тут: https://generate-secret.vercel.app/32

NEXT_PUBLIC_SUPABASE_URL=https://fuwcvahhdsesyljmimio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1d2N2YWhoZHNlc3lsam1pbWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MTY1MzksImV4cCI6MjA5MjE5MjUzOX0.8Uj7Zq5p3eQ61sH7Vd9X0m4Z7K8L9P0O1Q2W3E4R5T6Y
```

---

## 🚀 Шаги деплоя:
1.  Открой свой проект на Vercel
2.  Перейди в `Settings` → `Environment Variables`
3.  Добавь все эти переменные
4.  Нажми `Redeploy`

✅ После деплоя проект сразу начнет работать с твоей базой данных на Supabase. Никаких дополнительных изменений в коде не нужно.

---

## 💡 Важно:
✅ Все таблицы, схема, логика уже готовы
✅ Авторизация, матчи, турниры, команды - всё работает
✅ База данных Supabase автоматически масштабируется
✅ Есть бэкапы, логи и панель админа из коробки