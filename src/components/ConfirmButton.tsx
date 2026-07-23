"use client";

import { useFormStatus } from "react-dom";

// Кнопка отправки формы с подтверждением: если пользователь отменяет диалог,
// submit не происходит. Нужна там, где действие необратимо (удаление).
// Пропсы кнопки пробрасываются как есть — в том числе formAction,
// поэтому работает и в формах с несколькими действиями.
// На время выполнения блокируется, чтобы двойной клик не удалил дважды.
type Props = React.ComponentProps<"button"> & { message: string };

export function ConfirmButton({
  message,
  className = "btn btn--ghost btn--danger",
  children,
  onClick,
  disabled = false,
  ...rest
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      className={className}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
