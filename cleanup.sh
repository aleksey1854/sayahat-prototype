#!/usr/bin/env bash
# Очистка проекта перед заливкой на сервер.
#
#   bash cleanup.sh --dry    показать, что удалится
#   bash cleanup.sh          удалить
#
# Ничего из работающего кода не трогает. Удаляются только файлы,
# на которые нет ни одной ссылки в src, prisma и scripts.
#
# ВАЖНО: сначала закоммить текущее состояние, чтобы было куда откатиться.

set -e
DRY=0
[ "$1" = "--dry" ] && DRY=1

drop() {
  [ -e "$1" ] || return 0
  local size
  size=$(du -sh "$1" 2>/dev/null | cut -f1)
  printf '  %-42s %s\n' "$1" "$size"
  [ "$DRY" = "1" ] || rm -rf "$1"
}

echo "Демо-фотографии (51 файл, на сайте не используются):"
drop public/photos/demo

echo
echo "Одиночные демо-снимки в корне photos (23 файла, ссылок нет):"
for f in chernosliv cover electronics finiki fistashki household household-a household-b household-c \
         kuraga lukum meat meat-a meat-b oreh prilavok shoes spices textile textile-a textile-b veg veg-a; do
  drop "public/photos/$f.jpg"
done

echo
echo "Фото удалённого магазина:"
drop public/photos/sladkoejka

echo
echo "Неиспользуемые варианты логотипа:"
drop public/logo.png
drop public/logo-square.webp
drop public/logo-horizontal.webp
drop public/logo-horizontal.png

echo
echo "Скрипты, которые перезаписывают данные демо-набором:"
drop scripts/import-photos.ts
drop scripts/set-covers.ts
drop scripts/import-sladkoejka.ts

echo
echo "Артефакты сборки:"
drop tsconfig.tsbuildinfo

echo
if [ "$DRY" = "1" ]; then
  echo "Это был сухой прогон, ничего не удалено."
  echo "Запустите без --dry, чтобы удалить."
else
  echo "Готово. Проверьте сборку: npx tsc --noEmit && npm run build"
fi
