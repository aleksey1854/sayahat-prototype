export const site = {
  name: "Саяхат",
  sub: "базар · Костанай",
  city: "Костанай",
  cityKz: "Қостанай",
  hours: "Пн–Вс, 8:00–19:00",
  hoursKz: "Дс–Жс, 8:00–19:00",
};

export function waLink(number: string, text?: string) {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
