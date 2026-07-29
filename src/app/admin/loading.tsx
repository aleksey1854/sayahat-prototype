/**
 * Экран загрузки для всех разделов админки.
 *
 * Лежит в самом сегменте /admin, поэтому шапка панели и боковое меню
 * из layout остаются на месте — подменяется только содержимое справа.
 * Так переход между разделами не выглядит как перезагрузка страницы:
 * меню стоит, подсвеченный пункт уже переключился, а на месте списка
 * идёт заливка.
 *
 * Разметка обобщённая: заголовок, поиск, строки. Она одинаково честно
 * описывает и магазины, и категории, и сотрудников, и отзывы — везде
 * это список строк. Отдельные скелетоны под каждый раздел дали бы
 * точность, которую никто не успевает заметить.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="cab__top" aria-hidden="true">
        <div>
          <div className="sk sk-line" style={{ width: 110, height: 12 }} />
          <div className="sk sk-line" style={{ width: 240, height: 34, marginTop: 12 }} />
        </div>
      </div>

      <div className="sk" style={{ height: 52, borderRadius: 14, marginBottom: 20 }} aria-hidden="true" />

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }} aria-hidden="true">
        <div className="sk" style={{ width: 96, height: 36, borderRadius: 999 }} />
        <div className="sk" style={{ width: 132, height: 36, borderRadius: 999 }} />
        <div className="sk" style={{ width: 168, height: 36, borderRadius: 999 }} />
      </div>

      <div style={{ display: "grid", gap: 8 }} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="sk"
            style={{
              height: 62,
              borderRadius: 14,
              // Строки гаснут к низу: взгляд держится на верхних, а нижние
              // читаются как «дальше ещё есть» и не мельтешат.
              opacity: 1 - i * 0.11,
            }}
          />
        ))}
      </div>
    </div>
  );
}
