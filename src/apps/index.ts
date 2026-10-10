// index.ts — aiguillage app-id -> composant.
import type { AppId } from "../system/state";
import { WeatherApp } from "./weather";
import { CalendarApp } from "./calendar";
import { PhotosApp } from "./photos";
import { CalculatorApp } from "./calculator";
import { SettingsApp } from "./settings";
import { MapsApp } from "./maps";
import { PhoneApp } from "./phone";
import { MailApp } from "./mail";
import { MessagesApp } from "./messages";
import { MusicApp } from "./music";
import { SafariApp } from "./safari";

const RENDERERS: Record<AppId, () => HTMLElement> = {
  weather: WeatherApp,
  calendar: CalendarApp,
  photos: PhotosApp,
  calculator: CalculatorApp,
  settings: SettingsApp,
  maps: MapsApp,
  phone: PhoneApp,
  mail: MailApp,
  messages: MessagesApp,
  music: MusicApp,
  safari: SafariApp,
};

export function renderApp(id: AppId): HTMLElement {
  return RENDERERS[id]();
}
