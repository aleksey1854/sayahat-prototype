// Демо-обложки из public/photos — чтобы каталог не выглядел пустым на показе.
// Где точного кадра под категорию нет, берём ближайший по духу: для непродуктовых
// точек это снимок торгового зала. Всё перекроется, когда арендаторы зальют свои фото.
// Используется и сидом, и скриптом scripts/set-covers.ts.
export const DEMO_PHOTOS: Record<string, string[]> = {
  meat: ["meat.jpg", "meat-a.jpg", "meat-b.jpg"],
  sweets: ["lukum.jpg", "kuraga.jpg", "chernosliv.jpg", "finiki.jpg", "oreh.jpg", "fistashki.jpg"],
  veg: ["veg.jpg", "veg-a.jpg"],
  cloth: ["textile.jpg", "textile-a.jpg", "textile-b.jpg", "household-a.jpg"],
  shoe: ["shoes.jpg"],
  bags: ["textile-b.jpg"],
  tea: ["spices.jpg"],
  tech: ["electronics.jpg"],
  home: ["household.jpg", "household-b.jpg"],
  kids: ["household-a.jpg", "household-c.jpg"],
  beauty: ["household-b.jpg", "household-c.jpg"],
  optics: ["household-c.jpg"],
  pets: ["household-a.jpg"],
  flowers: ["veg-a.jpg"],
  handmade: ["prilavok.jpg", "cover.jpg"],
};

export const FALLBACK_PHOTO = "cover.jpg";
