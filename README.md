# Fucking Stylish Haircut — прототип записи

Сайт: https://websitepreview26.github.io/fhs-barbershop/

Статический HTML/CSS/JavaScript без сборки. Для локального просмотра откройте `index.html`.

Тёмный интерфейс FHS с лаймовыми акцентами, без рекламного баннера и слоганов. Механика записи по YCLIENTS: мастер → услуги → календарь и время → детали записи и контакты. Есть карточки специалистов, данные барбершопа, редактирование выбора, список демо-записей, перенос, отмена и экспорт календаря с выбранным напоминанием.

Все пять специалистов, их фотографии и число отзывов сверены с https://b125329.yclients.com/ 8 ноября 2026. Адрес, контакты и часы работы перенесены со скриншотов. Услуги и прайс Леонида взяты со скриншота; прайс других мастеров демонстрационный и требует уточнения. Фотографии мастеров сохранены локально из публичного виджета. В profiles доступны подборки реальных отзывов и оценок (reviews.js); длинные комментарии приведены короткими отрывками. Полный список доступен по ссылке на профиль специалиста в YCLIENTS. Данные не синхронизируются автоматически. Расписание демонстрационное, начинается с текущего дня в часовом поясе Минска. Длительность услуг учитывается при выборе времени и завершении рабочего дня.

Демо-записи и введённые данные хранятся только в localStorage этого браузера (`fhs-bookings-v2`). Сервер отсутствует, настоящие записи в YCLIENTS не создаются, СМС и письма не отправляются. Старые демо-записи первой версии не переносятся, поскольку изменились мастера и услуги.

Для Telegram Mini App: HTTPS-адрес можно привязать к кнопке бота. Для реальной записи нужны серверная интеграция с YCLIENTS, проверка Telegram initData, реальные расписания, атомарное бронирование и тексты согласий от барбершопа. Секретные ключи нельзя добавлять во фронтенд.

## iOS-style navigation (v4)

Rounded grouped lists, a translucent floating action panel and bottom sheets. The glass-panel and swipe-back patterns were adapted from the local MovieDuo project. Buttons, selection indicators and step labels have no circular outlines.

Swipe right from the first 28 px of the app to go back. The previous screen appears with rear parallax; the commit threshold is 35% of the screen width. Short gestures snap back. Browser Back and the visible back button share the same screen history. Form values and previous scroll positions persist. Vertical scrolling, form controls and multi-touch are not intercepted. Sheets support downward dismissal from the handle and rightward edge dismissal.

Reduced motion, reduced transparency and iPhone safe areas are supported. This is a web approximation, not native UIKit Liquid Glass. Touch behavior still needs a real-device check on iPhone.

## Header safe areas (v5)

The official Telegram WebApp SDK loads in `<head>` before application scripts. It requests native safe areas and maintains its CSS variables when the host reports `safe_area_changed` / `content_safe_area_changed`. No custom polling, device sniffing, guessed toolbar height or resize offset is used.

The header uses `max(browser device inset, Telegram device inset) + Telegram content inset + design spacing`. The device inset is not counted twice. Page gutters and the swipe-preview header use the same variables, including asymmetric horizontal insets in landscape. Breakpoints only change design spacing; they cannot replace the safe-area calculation. Outside Telegram, the variables fall back to the browser's `env(safe-area-inset-*)` values. A host that does not expose Telegram safe areas cannot supply its control dimensions; no guessed fallback height is substituted.

Reference: https://core.telegram.org/bots/webapps#safeareainset
