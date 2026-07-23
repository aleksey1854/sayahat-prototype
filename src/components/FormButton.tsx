"use client";

import { useFormStatus } from "react-dom";

// Кнопка формы, которая блокируется на время выполнения server action.
// Без этого быстрый двойной клик по «↑» или «Закрепить» отправлял бы
// действие дважды. В отличие от SubmitButton не подменяет содержимое
// (для стрелок это лишнее) и уважает внешний disabled (края групп).
export function FormButton({
  children,
  className = "btn btn--ghost",
  disabled = false,
  ...rest
}: React.ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return (
    <button {...rest} className={className} type="submit" disabled={disabled || pending} aria-busy={pending}>
      {children}
    </button>
  );
}
