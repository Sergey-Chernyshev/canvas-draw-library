import { AfterViewInit, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

// Декоратор @Component определяет метаданные компонента
@Component({
  selector: 'app-canvas', // Селектор компонента, используемый в шаблонах
  standalone: true, // Указывает, что компонент является Standalone (без необходимости в NgModule)
  imports: [CommonModule], // Модули, импортируемые в компонент
  templateUrl: './canvas.component.html', // Путь к HTML-шаблону компонента
  styleUrls: ['./canvas.component.less'], // Путь к стилям компонента
})
export class CanvasComponent implements AfterViewInit {
  // Получение ссылки на элемент <canvas> в шаблоне
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  // Контекст рисования на канвасе
  private ctx!: CanvasRenderingContext2D;

  // Масштабирование канваса
  private scale = 1; // Текущий масштаб
  private scaleFactor = 1.1; // Фактор масштабирования при зуме

  // Смещение канваса для панорамирования
  private offsetX = 0; // Смещение по оси X
  private offsetY = 0; // Смещение по оси Y

  // Флаги для отслеживания различных состояний взаимодействия
  private isPanning = false; // Активно ли панорамирование канваса
  private isDraggingVertex = false; // Активно ли перетаскивание вершины полигона
  private isDraggingPolygon = false; // Активно ли перетаскивание всего полигона

  // Информация о перетаскиваемой вершине
  private draggedVertex: { polygonIndex: number; vertexIndex: number } | null = null;

  // Индекс перетаскиваемого полигона
  private draggedPolygonIndex: number | null = null;

  // Последние координаты мыши при взаимодействии
  private lastX = 0; // Последняя координата X мыши
  private lastY = 0; // Последняя координата Y мыши

  // Массив точек текущего рисуемого полигона
  private currentPolygon: { x: number; y: number }[] = [];

  // Массив всех завершённых полигонов
  private polygons: { x: number; y: number }[][] = [];

  // Индекс выбранного полигона
  private selectedPolygonIndex: number | null = null;

  // Флаг наведения курсора на вершину
  private isHoveringVertex: boolean = false;

  // Флаг, указывающий, было ли перетаскивание
  private hasDragged: boolean = false;

  // Текущая позиция мыши для отображения превью линии
  private currentMousePos: { x: number; y: number } | null = null;

  // Порог перемещения для определения перетаскивания
  private readonly dragThreshold = 5;

  // Флаг для переключения режимов работы
  public isDrawingMode = true; // true - режим рисования, false - режим выделения

  // Флаг для предотвращения добавления точки после перетаскивания
  private preventClick = false;

  // Метод, вызываемый после инициализации компонента
  ngAfterViewInit(): void {
    this.resizeCanvas(); // Настройка размеров канваса
    this.initializeZoomAndPan(); // Инициализация зума и панорамирования
    this.redraw(); // Перерисовка канваса
  }

  // Метод для переключения в режим рисования
  setDrawingMode(): void {
    this.isDrawingMode = true; // Устанавливаем режим рисования
    this.selectedPolygonIndex = null; // Снимаем выделение полигона при переключении режима
    this.draggedVertex = null; // Сбрасываем информацию о перетаскиваемой вершине
    this.draggedPolygonIndex = null; // Сбрасываем информацию о перетаскиваемом полигоне
    this.redraw(); // Перерисовываем канвас
  }

  // Метод для переключения в режим выделения
  setSelectionMode(): void {
    this.isDrawingMode = false; // Устанавливаем режим выделения
    this.currentPolygon = []; // Отменяем текущий рисуемый полигон при переключении режима
    this.draggedVertex = null; // Сбрасываем информацию о перетаскиваемой вершине
    this.draggedPolygonIndex = null; // Сбрасываем информацию о перетаскиваемом полигоне
    this.redraw(); // Перерисовываем канвас
  }

  // Метод инициализации зума и панорамирования
  private initializeZoomAndPan(): void {
    const canvas = this.canvasRef.nativeElement; // Получаем элемент <canvas>

    // Добавляем обработчик события колесика мыши для зума
    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault(); // Предотвращаем стандартное поведение прокрутки
      const mouseX = event.offsetX; // Получаем координату X курсора относительно канваса
      const mouseY = event.offsetY; // Получаем координату Y курсора относительно канваса
      const zoomFactor = event.deltaY < 0 ? this.scaleFactor : 1 / this.scaleFactor; // Определяем направление зума
      const newScale = this.scale * zoomFactor; // Вычисляем новый масштаб

      // Обновляем смещения для зума относительно позиции курсора
      this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
      this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);

      this.scale = newScale; // Обновляем текущий масштаб
      this.redraw(); // Перерисовываем канвас с новым масштабом
    });

    // Добавляем обработчик события нажатия кнопки мыши
    canvas.addEventListener('mousedown', (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect(); // Получаем размеры и позицию канваса относительно окна
      const x = (event.clientX - rect.left - this.offsetX) / this.scale; // Вычисляем координату X относительно канваса
      const y = (event.clientY - rect.top - this.offsetY) / this.scale; // Вычисляем координату Y относительно канваса

      if (!this.isDrawingMode && this.selectedPolygonIndex !== null) { // Если не в режиме рисования и выбран полигон
        const polygon = this.polygons[this.selectedPolygonIndex]; // Получаем выбранный полигон
        const vertexIndex = this.getVertexAtPosition(x, y, polygon); // Проверяем, находится ли клик на вершине полигона
        if (vertexIndex !== null) { // Если клик на вершине
          // Начинаем перетаскивание вершины
          this.draggedVertex = { polygonIndex: this.selectedPolygonIndex, vertexIndex };
          this.isDraggingVertex = true; // Устанавливаем флаг перетаскивания вершины
          this.lastX = event.clientX; // Сохраняем текущую координату X мыши
          this.lastY = event.clientY; // Сохраняем текущую координату Y мыши
          this.preventClick = false; // Сбрасываем флаг предотвращения клика
          return; // Прерываем обработку, чтобы избежать панорамирования
        }

        // Если клик не на вершине, проверяем, находится ли он внутри полигона
        if (this.isPointInPolygon(x, y, polygon)) { // Если клик внутри полигона
          // Начинаем перетаскивание всего полигона
          this.isDraggingPolygon = true; // Устанавливаем флаг перетаскивания полигона
          this.draggedPolygonIndex = this.selectedPolygonIndex; // Запоминаем индекс перетаскиваемого полигона
          this.lastX = event.clientX; // Сохраняем текущую координату X мыши
          this.lastY = event.clientY; // Сохраняем текущую координату Y мыши
          this.preventClick = false; // Сбрасываем флаг предотвращения клика
          return; // Прерываем обработку, чтобы избежать панорамирования
        }
      }

      // Если не происходит перетаскивание вершины или полигона, начинаем панорамирование канваса
      this.isPanning = true; // Устанавливаем флаг панорамирования
      this.hasDragged = false; // Сбрасываем флаг, указывающий на то, было ли перетаскивание
      this.preventClick = false; // Сбрасываем флаг предотвращения клика
      this.lastX = event.clientX; // Сохраняем текущую координату X мыши
      this.lastY = event.clientY; // Сохраняем текущую координату Y мыши
    });

    // Добавляем обработчик события перемещения мыши
    window.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect(); // Получаем размеры и позицию канваса
      const x = (event.clientX - rect.left - this.offsetX) / this.scale; // Вычисляем координату X относительно канваса
      const y = (event.clientY - rect.top - this.offsetY) / this.scale; // Вычисляем координату Y относительно канваса

      if (this.isDraggingVertex && this.draggedVertex) { // Если происходит перетаскивание вершины
        const { polygonIndex, vertexIndex } = this.draggedVertex; // Получаем индексы полигона и вершины
        this.polygons[polygonIndex][vertexIndex] = { x, y }; // Обновляем координаты вершины
        this.redraw(); // Перерисовываем канвас
        return; // Прерываем дальнейшую обработку
      }

      if (this.isDraggingPolygon && this.draggedPolygonIndex !== null) { // Если происходит перетаскивание полигона
        const dx = event.clientX - this.lastX; // Вычисляем смещение по оси X
        const dy = event.clientY - this.lastY; // Вычисляем смещение по оси Y

        this.lastX = event.clientX; // Обновляем последние координаты мыши
        this.lastY = event.clientY;

        // Обновляем все вершины полигона на основе смещения
        this.polygons[this.draggedPolygonIndex].forEach(point => {
          point.x += dx / this.scale; // Смещаем координату X вершины
          point.y += dy / this.scale; // Смещаем координату Y вершины
        });
        this.redraw(); // Перерисовываем канвас
        return; // Прерываем дальнейшую обработку
      }

      if (this.isPanning) { // Если происходит панорамирование
        const dx = event.clientX - this.lastX; // Вычисляем смещение по оси X
        const dy = event.clientY - this.lastY; // Вычисляем смещение по оси Y

        this.lastX = event.clientX; // Обновляем последние координаты мыши
        this.lastY = event.clientY;

        this.offsetX += dx; // Обновляем смещение по оси X
        this.offsetY += dy; // Обновляем смещение по оси Y
        this.redraw(); // Перерисовываем канвас

        if (!this.hasDragged) { // Если еще не превышен порог перетаскивания
          const distance = Math.sqrt(dx * dx + dy * dy); // Вычисляем пройденное расстояние
          if (distance > this.dragThreshold) { // Если расстояние превышает порог
            this.hasDragged = true; // Устанавливаем флаг перетаскивания
            this.preventClick = true; // Устанавливаем флаг предотвращения клика
          }
        }
      } else if (this.isDrawingMode && this.currentPolygon.length > 0) { // Если в режиме рисования и есть текущий полигон
        this.currentMousePos = { x, y }; // Обновляем текущую позицию мыши для отображения превью линии
        this.redraw(); // Перерисовываем канвас
      } else if (!this.isDrawingMode) { // Если в режиме выделения
        const polygon = this.selectedPolygonIndex !== null ? this.polygons[this.selectedPolygonIndex] : null; // Получаем выбранный полигон
        if (polygon) { // Если выбран полигон
          const vertexIndex = this.getVertexAtPosition(x, y, polygon); // Проверяем, находится ли курсор над вершиной
          const isHovering = vertexIndex !== null; // Определяем, наведён ли курсор на вершину
          if (isHovering !== this.isHoveringVertex) { // Если состояние наведения изменилось
            this.isHoveringVertex = isHovering; // Обновляем флаг наведения
            this.canvasRef.nativeElement.style.cursor = isHovering ? 'pointer' : 'default'; // Меняем стиль курсора
          }
        }
      }
    });

    // Добавляем обработчик события отпускания кнопки мыши
    window.addEventListener('mouseup', () => {
      if (this.isDraggingVertex) { // Если происходило перетаскивание вершины
        this.isDraggingVertex = false; // Сбрасываем флаг
        this.draggedVertex = null; // Сбрасываем информацию о перетаскиваемой вершине
      }

      if (this.isDraggingPolygon) { // Если происходило перетаскивание полигона
        this.isDraggingPolygon = false; // Сбрасываем флаг
        this.draggedPolygonIndex = null; // Сбрасываем информацию о перетаскиваемом полигоне
      }

      if (this.isPanning) { // Если происходило панорамирование
        this.isPanning = false; // Сбрасываем флаг панорамирования
        if (this.hasDragged) { // Если было перетаскивание
          this.preventClick = true; // Устанавливаем флаг предотвращения клика
        }
      }

      this.hasDragged = false; // Сбрасываем флаг перетаскивания
      this.currentMousePos = null; // Сбрасываем текущую позицию мыши
      this.redraw(); // Перерисовываем канвас
    });

    // Добавляем декоратор для обработки изменения размера окна
  }

  // Декоратор @HostListener для обработки события изменения размера окна
  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement; // Получаем элемент <canvas>
    const dpr = window.devicePixelRatio || 1; // Получаем коэффициент плотности пикселей устройства

    // Устанавливаем CSS-ширину и высоту канваса
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Устанавливаем фактическую ширину и высоту канваса с учетом плотности пикселей
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    this.ctx = canvas.getContext('2d')!; // Получаем контекст рисования 2D
    this.ctx.scale(dpr, dpr); // Масштабируем контекст для учета плотности пикселей
    this.redraw(); // Перерисовываем канвас с новыми размерами
  }

  // Декоратор @HostListener для обработки события клика мыши
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.preventClick) { // Если установлен флаг предотвращения клика
      this.preventClick = false; // Сбрасываем флаг
      return; // Прерываем обработку клика
    }

    const canvas = this.canvasRef.nativeElement; // Получаем элемент <canvas>
    const rect = canvas.getBoundingClientRect(); // Получаем размеры и позицию канваса
    const x = (event.clientX - rect.left - this.offsetX) / this.scale; // Вычисляем координату X относительно канваса
    const y = (event.clientY - rect.top - this.offsetY) / this.scale; // Вычисляем координату Y относительно канваса

    if (this.isDrawingMode) { // Если в режиме рисования
      // Проверяем, близко ли кликнутая точка к началу текущего полигона для замыкания
      if (this.currentPolygon.length > 0 && this.isCloseToStart(x, y)) {
        this.completePolygon(); // Завершаем рисование полигона
      } else {
        this.currentPolygon.push({ x, y }); // Добавляем новую точку в текущий полигон
        this.redraw(); // Перерисовываем канвас
      }
    } else { // Если в режиме выделения
      this.selectPolygon(x, y); // Выбираем полигон по клику
    }
  }

  // Декоратор @HostListener для обработки события нажатия клавиши
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') { // Если нажата клавиша Escape
      this.cancelCurrentPolygon(); // Отменяем текущее рисование полигона
    }
  }

  // Метод для отмены текущего рисования полигона
  private cancelCurrentPolygon(): void {
    if (this.currentPolygon.length > 0) { // Если есть текущий рисуемый полигон
      this.currentPolygon = []; // Сбрасываем массив точек текущего полигона
      this.currentMousePos = null; // Сбрасываем текущую позицию мыши
      this.redraw(); // Перерисовываем канвас
    }
  }

  // Метод для проверки, находится ли точка близко к началу полигона
  private isCloseToStart(x: number, y: number): boolean {
    if (this.currentPolygon.length === 0) return false; // Если полигон пустой, возвращаем false
    const start = this.currentPolygon[0]; // Получаем первую точку полигона
    const dx = x - start.x; // Вычисляем разницу по оси X
    const dy = y - start.y; // Вычисляем разницу по оси Y
    const distance = Math.sqrt(dx * dx + dy * dy); // Вычисляем расстояние между точками
    return distance < 10; // Возвращаем true, если расстояние меньше 10 пикселей
  }

  // Метод для завершения рисования полигона
  private completePolygon(): void {
    this.polygons.push([...this.currentPolygon]); // Добавляем копию текущего полигона в массив завершённых полигонов
    this.currentPolygon = []; // Сбрасываем текущий полигон
    this.currentMousePos = null; // Сбрасываем текущую позицию мыши
    this.redraw(); // Перерисовываем канвас
  }

  // Метод для выбора полигона по координатам клика
  private selectPolygon(x: number, y: number): void {
    this.selectedPolygonIndex = null; // Сбрасываем текущий выбранный полигон

    for (let index = 0; index < this.polygons.length; index++) { // Проходим по всем полигонам
      const polygon = this.polygons[index]; // Получаем текущий полигон
      if (this.isPointInPolygon(x, y, polygon)) { // Проверяем, находится ли точка внутри полигона
        this.selectedPolygonIndex = index; // Устанавливаем индекс выбранного полигона
        break; // Прерываем цикл после нахождения первого подходящего полигона
      }
    }
    this.redraw(); // Перерисовываем канвас с выделенным полигоном
  }

  // Метод для проверки, находится ли точка внутри полигона (алгоритм лучевого пересечения)
  private isPointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
    let inside = false; // Флаг внутри ли точка полигона
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { // Проходим по всем ребрам полигона
      const xi = polygon[i].x, yi = polygon[i].y; // Координаты текущей точки ребра
      const xj = polygon[j].x, yj = polygon[j].y; // Координаты предыдущей точки ребра

      // Проверяем пересечение луча, исходящего из точки, с текущим ребром полигона
      const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside; // Меняем состояние флага при пересечении
    }
    return inside; // Возвращаем результат
  }

  // Метод для получения индекса вершины, если точка находится рядом с ней
  private getVertexAtPosition(x: number, y: number, polygon: { x: number; y: number }[]): number | null {
    const radius = 5; // Радиус области обнаружения вершины
    for (let i = 0; i < polygon.length; i++) { // Проходим по всем вершинам полигона
      const vertex = polygon[i]; // Получаем текущую вершину
      const dx = x - vertex.x; // Вычисляем разницу по оси X
      const dy = y - vertex.y; // Вычисляем разницу по оси Y
      const distance = Math.sqrt(dx * dx + dy * dy); // Вычисляем расстояние между точкой и вершиной
      if (distance <= radius) { // Если расстояние меньше или равно радиусу
        return i; // Возвращаем индекс вершины
      }
    }
    return null; // Если ни одна вершина не была найдена, возвращаем null
  }

  // Метод для отрисовки всех форм на канвасе
  private drawShapes(): void {
    if (!this.ctx) return; // Если контекст не инициализирован, выходим из метода

    this.ctx.save(); // Сохраняем текущие настройки контекста
    this.ctx.translate(this.offsetX, this.offsetY); // Применяем смещение для панорамирования
    this.ctx.scale(this.scale, this.scale); // Применяем масштабирование

    // Рисуем все полигоны
    this.polygons.forEach((polygon, index) => {
      this.drawPolygon(polygon, true); // Рисуем полигон с заливкой

      // Если полигон выбран, подсвечиваем его и рисуем вершины
      if (this.selectedPolygonIndex === index) {
        this.ctx.strokeStyle = 'orange'; // Устанавливаем цвет обводки
        this.ctx.lineWidth = 2; // Устанавливаем толщину линии
        this.ctx.stroke(); // Перерисовываем контур полигона с новым стилем
        this.drawVertices(polygon, 'orange'); // Рисуем вершины полигона оранжевым цветом
      }
    });

    // Рисуем текущий рисуемый полигон в режиме рисования
    if (this.isDrawingMode && this.currentPolygon.length > 0) {
      this.drawPolygon(this.currentPolygon, false); // Рисуем текущий полигон без заливки
      this.drawVertices(this.currentPolygon); // Рисуем вершины текущего полигона

      // Рисуем превью линии от последней точки к текущей позиции мыши
      if (this.currentMousePos) {
        const lastPoint = this.currentPolygon[this.currentPolygon.length - 1]; // Получаем последнюю точку полигона
        this.ctx.beginPath(); // Начинаем новый путь
        this.ctx.moveTo(lastPoint.x, lastPoint.y); // Перемещаемся к последней точке
        this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y); // Рисуем линию к текущей позиции мыши
        this.ctx.strokeStyle = 'gray'; // Устанавливаем цвет линии
        this.ctx.lineWidth = 1; // Устанавливаем толщину линии
        this.ctx.setLineDash([5, 3]); // Устанавливаем пунктирную линию для превью
        this.ctx.stroke(); // Рисуем линию
        this.ctx.setLineDash([]); // Сбрасываем пунктирную линию
        this.ctx.closePath(); // Закрываем путь
      }
    }

    this.ctx.restore(); // Восстанавливаем сохраненные настройки контекста
  }

  // Метод для рисования отдельного полигона
  private drawPolygon(polygon: { x: number; y: number }[], fill: boolean): void {
    if (polygon.length === 0) return; // Если полигон пустой, выходим из метода

    this.ctx.beginPath(); // Начинаем новый путь
    this.ctx.moveTo(polygon[0].x, polygon[0].y); // Перемещаемся к первой точке полигона
    for (let i = 1; i < polygon.length; i++) { // Проходим по всем точкам полигона
      this.ctx.lineTo(polygon[i].x, polygon[i].y); // Рисуем линию к каждой следующей точке
    }
    if (fill) { // Если нужно залить полигон
      this.ctx.closePath(); // Закрываем путь полигона
      this.ctx.fillStyle = 'rgba(0, 128, 255, 0.5)'; // Устанавливаем цвет заливки с прозрачностью
      this.ctx.fill(); // Заполняем полигон цветом
    }

    this.ctx.strokeStyle = 'black'; // Устанавливаем цвет обводки
    this.ctx.lineWidth = 2; // Устанавливаем толщину линии
    this.ctx.stroke(); // Рисуем обводку полигона
  }

  // Метод для рисования вершин полигона
  private drawVertices(polygon: { x: number; y: number }[], color: string = 'black'): void {
    polygon.forEach((point) => { // Проходим по всем точкам полигона
      this.ctx.beginPath(); // Начинаем новый путь для вершины
      this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2); // Рисуем окружность вокруг вершины
      this.ctx.fillStyle = color; // Устанавливаем цвет заливки вершины
      this.ctx.fill(); // Заполняем окружность цветом
      this.ctx.closePath(); // Закрываем путь
    });
  }

  // Метод для перерисовки канваса
  private redraw(): void {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height); // Очищаем канвас
    this.drawShapes(); // Рисуем все формы заново
  }
}
