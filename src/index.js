// получаем доступ к холсту
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');

// размер квадратика
const grid = 32;

// получаем доступ к следующей фигуре
const next = document.getElementById('next');
const contextNext = next.getContext('2d');

// элементы статистики игры
const check = document.getElementById('check');
const record = document.getElementById('record');

// элементы кнопок
const pauseButton = document.querySelector('.pause');

// массив с последовательностями фигур, на старте — пустой
let tetrominoSequence = [];
let tetrominoColorsList = [];

// с помощью двумерного массива следим за тем, что находится в каждой клетке игрового поля
// размер поля — 10 на 20, и несколько строк ещё находится за видимой областью
let playfield = [];

// заполняем сразу массив пустыми ячейками
for (let row = -2; row < 20; row++) {
  playfield[row] = [];

  for (let col = 0; col < 10; col++) {
    playfield[row][col] = { name: 0, color: ''};
  }
}

// задаём формы для каждой фигуры
const tetrominos = {
  'I': [
    [0,0,0,0],
    [1,1,1,1],
    [0,0,0,0],
    [0,0,0,0],
  ],
  'J': [
    [0,0,0,0],
    [0,1,0,0],
    [0,1,1,1],
    [0,0,0,0],
  ],
  'L': [
    [0,0,0,0],
    [0,0,1,0],
    [1,1,1,0],
    [0,0,0,0],
  ],
  'O': [
    [0,0,0,0],
    [0,1,1,0],
    [0,1,1,0],
    [0,0,0,0],
  ],
  'S': [
    [0,0,0,0],
    [0,0,1,1],
    [0,1,1,0],
    [0,0,0,0],
  ],
  'Z': [
    [0,0,0,0],
    [1,1,0,0],
    [0,1,1,0],
    [0,0,0,0],
  ],
  'T': [
    [0,0,0,0],
    [0,0,1,0],
    [0,1,1,1],
    [0,0,0,0],
  ]
};


// текущая фигура в игре
let tetromino = getNextTetromino();
let nextTetromino = getNextTetromino();

// счётчик
let count = 0;
// следим за кадрами анимации, чтобы если что — остановить игру
let rAF = null;  
// флаг конца игры, на старте — неактивный
let gameOver = false;

// Функция возвращает случайное число в заданном диапазоне
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// создаём последовательность цветов, которая появится в игре
function generateColorsList () {
  const colorsList = ['cyan', 'yellow', 'Aquamarine', 'tomato', 'DeepPink', 'mediumSpringGreen', 'red', 'DeepSkyBlue', 'orange', 'lime'];
  while (colorsList.length) {
    // случайным образом берем цвет
    const rand = getRandomInt(0, colorsList.length - 1);
    const name = colorsList.splice(rand, 1)[0];
    // помещаем цвет в игровой массив с последовательностями
    tetrominoColorsList.push(name);
  }

}

// создаём последовательность фигур, которая появится в игре
function generateSequence() {
  // тут — сами фигуры
  const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

  while (sequence.length) {
    // случайным образом находим любую из них
    const rand = getRandomInt(0, sequence.length - 1);
    const name = sequence.splice(rand, 1)[0];
    // помещаем выбранную фигуру в игровой массив с последовательностями
    tetrominoSequence.push(name);
  }
}

// получаем следующую фигуру
function getNextTetromino() { 
  // если следующей нет — генерируем
  if (tetrominoSequence.length === 0) {
    generateSequence();
  }

  const name = tetrominoSequence.pop();
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = -2;
  if (tetrominoColorsList.length === 0) {
    generateColorsList();
  }
  const color = tetrominoColorsList.pop();

  return {
    name: name,      // название фигуры (L, O, и т.д.)
    matrix: matrix,  // матрица с фигурой
    row: row,        // текущая строка (фигуры стартуют за видимой областью холста)
    col: col,         // текущий столбец
    color: color   // цвет данной фигуры
  };
}

// поворачиваем матрицу на 90 градусов
function rotate(matrix) {
  const N = matrix.length - 1;
  const result = matrix.map((row, i) =>
    row.map((val, j) => matrix[N - j][i])
  );
  return result;
}

// проверяем после появления или вращения, может ли матрица (фигура) быть в этом месте поля или она вылезет за его границы
function isValidMove(matrix, cellRow, cellCol) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col]) {
        if (cellCol + col < 0 || 
            cellCol + col >= playfield[0].length || 
            cellRow + row >= playfield.length || 
            playfield[cellRow + row][cellCol + col].name !== 0) {
          return false;
        }
      }
    }
  }
  return true;
}

// функция постановки фигуры на поле
function placeTetromino() {
  // Проверяем, достигла ли фигура верха перед размещением
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col] && tetromino.row + row < 0) {
        return showGameOver();
      }
    }
  }

  // Записываем текущую фигуру в игровое поле
  for (let row = 0; row < tetromino.matrix.length; row++) {
    for (let col = 0; col < tetromino.matrix[row].length; col++) {
      if (tetromino.matrix[row][col]) {
        if (tetromino.row + row < 0) return showGameOver();
        
        // Создаем новый объект для каждой ячейки
        playfield[tetromino.row + row][tetromino.col + col] = {
          name: tetromino.name,
          color: tetromino.color
        };
      }
    }
  }

  // Проверяем заполненные строки снизу вверх
  for (let row = 19; row >= 0; row--) {
    if (playfield[row].every(cell => cell.name !== 0)) {
      // Удаляем заполненную строку
      for (let r = row; r > 0; r--) {
        // Копируем каждую ячейку отдельно, создавая новые объекты
        for (let c = 0; c < playfield[r].length; c++) {
          playfield[r][c] = {
            name: playfield[r-1][c].name,
            color: playfield[r-1][c].color
          };
        }
      }
      
      // Очищаем верхнюю строку
      for (let c = 0; c < playfield[0].length; c++) {
        playfield[0][c] = { name: 0, color: '' };
      }
      
      check.textContent = Number(check.textContent) + 10;
      row++; // Проверяем текущую строку снова
    }
  }
  // Берем следующую фигуру
  tetromino = nextTetromino;
  nextTetromino = getNextTetromino();
  drawNextTetromino();
}

// Функция для отрисовки следующей фигуры
function drawNextTetromino() {
  // Очищаем холст
  contextNext.clearRect(0, 0, next.width, next.height);
  
  // Центрируем фигуру на холсте next
  const offsetX = (next.width - nextTetromino.matrix[0].length * grid) / 2;
  const offsetY = (next.height - nextTetromino.matrix.length * grid) / 2;
  
  // Устанавливаем цвет
  contextNext.fillStyle = nextTetromino.color;
  
  // Отрисовываем фигуру
  for (let row = 0; row < nextTetromino.matrix.length; row++) {
    for (let col = 0; col < nextTetromino.matrix[row].length; col++) {
      if (nextTetromino.matrix[row][col]) {
        contextNext.fillRect(
          col * grid + offsetX, 
          row * grid + offsetY, 
          grid-1, 
          grid-1
        );
      }
    }
  }
}

// функция обработки нажатия кнопки пауза
function pause() {
  // прекращаем всю анимацию игры
  cancelAnimationFrame(rAF);
  // рисуем чёрный прямоугольник посередине поля
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  // пишем надпись белым моноширинным шрифтом по центру
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
}



// показываем надпись Game Over
function showGameOver() {
  // Прекращаем анимацию
  cancelAnimationFrame(rAF);
  rAF = null;
  
  // Устанавливаем флаг окончания
  gameOver = true;
  
  // Рисуем сообщение
  context.fillStyle = 'black';
  context.globalAlpha = 0.75;
  context.fillRect(0, canvas.height / 2 - 30, canvas.width, 60);
  
  // пишем надпись белым моноширинным шрифтом по центру
  context.globalAlpha = 1;
  context.fillStyle = 'white';
  context.font = '36px monospace';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2);
  const checkNumber = Number(check.textContent)
  if (Number(record.textContent) < checkNumber) {
    record.textContent = checkNumber;
    localStorage.setItem("record", checkNumber);
    check.textContent = 0;
  }
}

// pauseButton.addEventListener('click', pause);
pauseButton.onclick = pause;

// следим за нажатиями на клавиши
document.addEventListener('keydown', function(e) {
  // если игра закончилась — сразу выходим
  if (gameOver) return;

  // стрелки влево и вправо
  if (e.which === 37 || e.which === 39) {
    const col = e.which === 37
      // если влево, то уменьшаем индекс в столбце, если вправо — увеличиваем
      ? tetromino.col - 1
      : tetromino.col + 1;

    // если так ходить можно, то запоминаем текущее положение 
    if (isValidMove(tetromino.matrix, tetromino.row, col)) {
      tetromino.col = col;
    }
  }

  // стрелка вверх — поворот
  if (e.which === 38) {
    // поворачиваем фигуру на 90 градусов
    const matrix = rotate(tetromino.matrix);
    // если так ходить можно — запоминаем
    if (isValidMove(matrix, tetromino.row, tetromino.col)) {
      tetromino.matrix = matrix;
    }
  }

  // стрелка вниз — ускорить падение
  if(e.which === 40) {
    // смещаем фигуру на строку вниз
    const row = tetromino.row + 1;
    // если опускаться больше некуда — запоминаем новое положение
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      // ставим на место и смотрим на заполненные ряды
      placeTetromino();
      return;
    }
    // запоминаем строку, куда стала фигура
    tetromino.row = row;
  }
});

// главный цикл игры
function loop() {

  if (gameOver) return; // Не продолжаем, если игра окончена
  // начинаем анимацию
  rAF = requestAnimationFrame(loop);
  // очищаем холст
  context.clearRect(0,0,canvas.width,canvas.height);

  // рисуем игровое поле с учётом заполненных фигур
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (playfield[row][col].name) {
        context.fillStyle = playfield[row][col].color;

        // рисуем всё на один пиксель меньше, чтобы получился эффект «в клетку»
        context.fillRect(col * grid, row * grid, grid-1, grid-1);
      }
    }
  }

  // рисуем текущую фигуру
  if (tetromino) {

    // фигура сдвигается вниз каждые 35 кадров
    if (++count > 35) {
      tetromino.row++;
      count = 0;

      // если движение закончилось — рисуем фигуру в поле и проверяем, можно ли удалить строки
      if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
        tetromino.row--;
        placeTetromino();
      }
    }
    // не забываем про цвет текущей фигуры
    context.fillStyle = tetromino.color;

    // отрисовываем её
    for (let row = 0; row < tetromino.matrix.length; row++) {
      for (let col = 0; col < tetromino.matrix[row].length; col++) {
        if (tetromino.matrix[row][col]) {

          // и снова рисуем на один пиксель меньше
          context.fillRect((tetromino.col + col) * grid, (tetromino.row + row) * grid, grid-1, grid-1);
        }
      }
    }
  }
}

// старт игры
rAF = requestAnimationFrame(loop);
drawNextTetromino();
if (localStorage.getItem("record")) {
  record.textContent = Number(localStorage.getItem("record"));
};