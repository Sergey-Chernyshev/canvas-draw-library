import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasSettings } from './models/canvasSettings.interface';

@Injectable({
  providedIn: 'root',
})
export class CanvasSettingsService {
  // Дефолтные настройки с типизацией CanvasSettings
  private defaultSettings: CanvasSettings = {
    canvasBackgroundColor: "#353535",
    panEnabled: true,
    zoomEnabled: true,
    zoomSpeed: 1.1,
    defaultColor: '#0000FF',
    lineWidth: 2,
  };

  // Хранение текущих настроек
  #settings: CanvasSettings = { ...this.defaultSettings };

  // Subject для отслеживания изменений настроек
  #settingsSubject = new BehaviorSubject<CanvasSettings>(this.#settings);

  // Observable для подписки на изменения настроек
  settings$: Observable<CanvasSettings> = this.#settingsSubject.asObservable();

  // Метод для получения текущих настроек
  getSettings(): CanvasSettings {
    return { ...this.#settings };
  }

  // Метод для получения определённой настройки по ключу
  getSetting<T extends keyof CanvasSettings>(key: T): CanvasSettings[T] {
    return this.#settings[key];
  }

  // Метод для изменения настроек путем передачи частичного объекта настроек
  updateSettings(newSettings: Partial<CanvasSettings>): void {
    this.#settings = { ...this.#settings, ...newSettings };
    this.#settingsSubject.next(this.#settings); // Отправляем обновления подписчикам
  }

  // Метод для сброса настроек к значениям по умолчанию
  resetSettings(): void {
    this.#settings = { ...this.defaultSettings };
    this.#settingsSubject.next(this.#settings); // Отправляем обновления подписчикам
  }

  // Метод для подписки на изменения конкретной настройки
  onSettingChange<T extends keyof CanvasSettings>(key: T): Observable<CanvasSettings[T]> {
    return new Observable(observer => {
      this.#settingsSubject.subscribe(currentSettings => {
        observer.next(currentSettings[key]);
      });
    });
  }
}
