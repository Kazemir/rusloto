// Данные тиража №1711
const lotteryData = [
    { tour: 1, numbers: [22, 50, 32, 64, 66, 33, 16], winners: 2, prize: 50000 },
    { tour: 2, numbers: [49, 27, 71, 59, 25, 7, 4, 65, 78, 19, 12, 86, 74, 75, 43, 88, 72, 45, 37, 85, 48, 56, 39, 55, 44, 21, 18], winners: 1, prize: 1000000 },
    { tour: 3, numbers: [3, 38, 20, 90, 82, 11, 68, 13, 26, 23, 1, 60, 73, 67, 57, 15, 52, 40, 10, 77, 62, 9, 61, 2, 8, 28, 47, 41, 30, 53], winners: 2, prize: 50000 },
    { tour: 4, numbers: [79], winners: 2, prize: 12000 },
    { tour: 5, numbers: [84], winners: 6, prize: 12000 },
    { tour: 6, numbers: [76], winners: 6, prize: 12000 },
    { tour: 7, numbers: [29], winners: 8, prize: 12000 },
    { tour: 8, numbers: [89], winners: 25, prize: 12000 },
    { tour: 9, numbers: [81], winners: 33, prize: 7000 },
    { tour: 10, numbers: [35], winners: 66, prize: 7000 },
    { tour: 11, numbers: [83], winners: 104, prize: 7000 },
    { tour: 12, numbers: [87], winners: 152, prize: 1500 },
    { tour: 13, numbers: [54], winners: 296, prize: 1500 },
    { tour: 14, numbers: [69], winners: 411, prize: 1500 },
    { tour: 15, numbers: [17], winners: 727, prize: 700 },
    { tour: 16, numbers: [46], winners: 1018, prize: 700 },
    { tour: 17, numbers: [63], winners: 1445, prize: 700 },
    { tour: 18, numbers: [58], winners: 2513, prize: 250 },
    { tour: 19, numbers: [24], winners: 3545, prize: 250 },
    { tour: 20, numbers: [36], winners: 7110, prize: 200 },
    { tour: 21, numbers: [14], winners: 9279, prize: 200 },
    { tour: 22, numbers: [80], winners: 13617, prize: 170 },
    { tour: 23, numbers: [6], winners: 24036, prize: 170 },
    { tour: 24, numbers: [70], winners: 32708, prize: 150 },
    { tour: 25, numbers: [5], winners: 49349, prize: 150 }
];

// Глобальная конфигурация текущего тиража
let currentDrawConfig = {
    number: 1711,
    date: new Date('2026-01-14T18:00:00'),
    ticketsSold: 782854,
    prizeFund: 58714050,
    superprize: 900000000,
    toursData: lotteryData  // Ссылка на массив туров
};

// Правила туров для модального окна
const tourRules = {
    1: {
        image: 'rules_tour_1.svg',
        title: 'Первый тур',
        description: 'В первом туре выигрывают билеты, в которых раньше, чем в других совпали 5 чисел в любой горизонтальной строке. Как только появляется победитель или победители, тур закончен.'
    },
    2: {
        image: 'rules_tour_2.svg',
        title: 'Второй тур',
        description: 'Во втором туре выигрывают билеты, в которых все 15 чисел в одном из полей (верхнем или нижнем) раньше других совпали с номерами бочонков или шаров. Если все 15 чисел в одном из полей совпали на 15-м ходу - участник выигрывает Джекпот.'
    },
    3: {
        image: 'rules_tour_3.svg',
        title: 'Третий и последующие туры',
        description: 'В третьем и последующих турах выигрывают билеты, в которых все 30 чисел раньше, чем в других билетах совпали с номерами бочонков или шаров.'
    }
};

// Парсим все числа из тиража
function parseNumbers() {
    const allNumbers = [];
    lotteryData.forEach(tour => {
        tour.numbers.forEach(number => {
            allNumbers.push({ tour: tour.tour, number: number });
        });
    });
    return allNumbers;
}

// Парсинг данных с сайта stoloto.ru
async function loadDrawData(drawNumber) {
    // Используем CORS proxy для обхода ограничений
    const targetUrl = `https://www.stoloto.ru/ruslotto/archive/${drawNumber}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Тираж №${drawNumber} не найден`);
        }

        const html = await response.text();

        // Извлекаем JSON из <script id="__NEXT_DATA__">
        const scriptMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/);
        if (!scriptMatch) {
            throw new Error('Тираж №${drawNumber} не найден');
        }

        const jsonData = JSON.parse(scriptMatch[1]);

        // Проверяем наличие всех необходимых полей
        if (!jsonData.props || !jsonData.props.pageProps || !jsonData.props.pageProps.dehydratedState) {
            throw new Error(`Тираж №${drawNumber} не найден`);
        }

        const queries = jsonData.props.pageProps.dehydratedState.queries;
        if (!queries || !queries[0] || !queries[0].state || !queries[0].state.data) {
            throw new Error(`Тираж №${drawNumber} не найден`);
        }

        const draw = queries[0].state.data.draw;

        if (!draw) {
            throw new Error(`Тираж №${drawNumber} не найден`);
        }

        // Проверяем, прошёл ли розыгрыш (есть ли данные о турах)
        if (!draw.winCategories || draw.winCategories.length === 0) {
            throw new Error(`Розыгрыш тиража №${drawNumber} ещё не прошёл`);
        }

        // Преобразуем данные в наш формат
        const parsedData = {
            number: draw.number,
            date: new Date(draw.date),
            ticketsSold: draw.ticketCount || draw.betsCount,
            prizeFund: draw.summPayed,
            superprize: draw.superPrize,
            toursData: draw.winCategories.map(tour => ({
                tour: tour.number,
                numbers: Array.isArray(tour.numbers) ? tour.numbers : [tour.numbers],
                winners: tour.participants,
                prize: tour.amount
            }))
        };

        return parsedData;

    } catch (error) {
        console.error('Ошибка загрузки тиража:', error);
        throw error;
    }
}

// Обновление UI с новыми данными тиража
function updateDrawUI(drawData) {
    // Обновляем глобальную конфигурацию
    currentDrawConfig = drawData;

    // Заменяем lotteryData
    lotteryData.length = 0;  // Очищаем массив
    lotteryData.push(...drawData.toursData);  // Заполняем новыми данными

    // Форматируем дату
    const dateStr = formatDrawDate(drawData.date);

    // Обновляем title
    document.title = `Русское лото - Тираж №${drawData.number}`;

    // Обновляем header
    document.getElementById('lottery-number').textContent = drawData.number;
    document.getElementById('lottery-date').textContent = dateStr;

    // Обновляем статистику
    document.getElementById('tickets-sold').textContent = formatNumber(drawData.ticketsSold);
    document.getElementById('prize-fund').textContent = formatNumber(drawData.prizeFund) + ' ₽';
    document.getElementById('superprize-amount').textContent = formatNumber(drawData.superprize) + ' ₽';

    // Обновляем результаты (если они видны)
    document.getElementById('results-lottery-number').textContent = drawData.number;
    document.getElementById('results-lottery-date').textContent = dateStr;

    // Пересоздаём gameState
    gameState.allNumbers = parseNumbers();
    gameState.currentIndex = 0;
    gameState.drawnNumbers = [];

    // Показываем кнопку "Другой тираж" обратно (загрузка происходит на стартовом экране)
    document.getElementById('change-draw-btn').style.visibility = 'visible';
}

// Форматирование даты в "14 января 2026 18:00"
function formatDrawDate(date) {
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
}

// Игровое состояние
const gameState = {
    allNumbers: parseNumbers(),
    currentIndex: 0,
    isAnimating: false,
    drawnNumbers: []
};

// Three.js сцена
let scene, camera, renderer, barrel, barrelGroup;
let animationId = null;

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a472a);

    // Камера
    camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.5);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);

    // Создаём группу для бочонка
    barrelGroup = new THREE.Group();
    scene.add(barrelGroup);

    createBarrel();

    // Анимационный луп
    animate();

    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);
}

function createBarrel(number = '?') {
    // Очищаем предыдущий бочонок
    while (barrelGroup.children.length > 0) {
        barrelGroup.remove(barrelGroup.children[0]);
    }

    // Создаём цилиндр (бочонок)
    const geometry = new THREE.CylinderGeometry(0.8, 0.9, 1.5, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0x8B4513,
        shininess: 30
    });
    barrel = new THREE.Mesh(geometry, material);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    barrelGroup.add(barrel);

    // Добавляем ободки
    const rimGeometry = new THREE.TorusGeometry(0.85, 0.08, 16, 32);
    const rimMaterial = new THREE.MeshPhongMaterial({ color: 0x654321 });

    const topRim = new THREE.Mesh(rimGeometry, rimMaterial);
    topRim.position.y = 0.6;
    topRim.rotation.x = Math.PI / 2;
    barrelGroup.add(topRim);

    const bottomRim = new THREE.Mesh(rimGeometry, rimMaterial);
    bottomRim.position.y = -0.6;
    bottomRim.rotation.x = Math.PI / 2;
    barrelGroup.add(bottomRim);

    // Добавляем текст с номером
    createNumberText(number.toString());

    // Начальная позиция
    barrelGroup.position.set(0, -5, 0);
    barrelGroup.rotation.set(0, 0, 0);
}

function createNumberText(number) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;

    // Белый круг фон
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(128, 128, 100, 0, Math.PI * 2);
    context.fill();

    // Чёрный текст
    context.fillStyle = '#000000';
    context.font = 'bold 120px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(number, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });

    const planeGeometry = new THREE.PlaneGeometry(1.2, 1.2);
    const plane = new THREE.Mesh(planeGeometry, material);
    plane.position.set(0, 0, 0.91);
    barrelGroup.add(plane);

    // Задняя сторона
    const planeBack = new THREE.Mesh(planeGeometry, material.clone());
    planeBack.position.set(0, 0, -0.91);
    planeBack.rotation.y = Math.PI;
    barrelGroup.add(planeBack);
}

function animate() {
    animationId = requestAnimationFrame(animate);

    // Лёгкое вращение бочонка если не анимируется
    if (!gameState.isAnimating) {
        barrelGroup.rotation.y += 0.01;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Анимация доставания бочонка
function animateBarrelDraw(number, callback) {
    gameState.isAnimating = true;

    const duration = 2000;
    const startTime = Date.now();
    const startY = -5;
    const endY = 0;
    const startRotation = 0;
    const endRotation = Math.PI * 4;

    function animateStep() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        barrelGroup.position.y = startY + (endY - startY) * eased;
        barrelGroup.rotation.x = startRotation + (endRotation - startRotation) * eased;
        barrelGroup.rotation.y += 0.05;

        if (progress < 1) {
            requestAnimationFrame(animateStep);
        } else {
            gameState.isAnimating = false;
            if (callback) callback();
        }
    }

    createBarrel(number);
    animateStep();
}

// Форматирование чисел с разделителями
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Основная игровая логика
function drawNextNumber() {
    if (gameState.currentIndex >= gameState.allNumbers.length) {
        endGame();
        return;
    }

    const drawButton = document.getElementById('draw-button');
    drawButton.disabled = true;

    const currentDraw = gameState.allNumbers[gameState.currentIndex];
    const number = currentDraw.number;
    const tour = currentDraw.tour;

    // Обновляем текущий тур
    document.getElementById('current-tour').textContent = tour;

    // Анимация
    animateBarrelDraw(number, () => {
        // После анимации обновляем UI
        document.getElementById('current-number').textContent = number;

        gameState.drawnNumbers.push(number);
        updateDrawnNumbers();

        gameState.currentIndex++;

        // Проверяем, закончилась ли игра
        if (gameState.currentIndex >= gameState.allNumbers.length) {
            endGame();
            return;
        }

        // Проверяем предвыигрышную ситуацию
        checkPreWinSituation(tour);

        // Проверяем, закончился ли тур
        const nextDraw = gameState.allNumbers[gameState.currentIndex];
        if (!nextDraw || nextDraw.tour !== tour) {
            // Тур закончился, показываем выигрыш
            showWinInfo(tour);
        } else {
            // Прячем информацию о выигрыше
            document.getElementById('win-info').style.display = 'none';
        }

        drawButton.disabled = false;
    });
}

function showWinInfo(tour) {
    const tourData = lotteryData.find(t => t.tour === tour);
    if (tourData) {
        document.getElementById('win-amount').textContent = formatNumber(tourData.prize) + ' ₽';
        document.getElementById('win-tickets').textContent = formatNumber(tourData.winners);
        document.getElementById('win-info').style.display = 'block';
    }
}

// Проверка и отображение предвыигрышной ситуации
function checkPreWinSituation(currentTour) {
    const preWinAlert = document.getElementById('pre-win-alert');

    // Подсчитываем сколько чисел выпало в текущем туре
    let numbersInCurrentTour = 0;
    for (let i = 0; i < gameState.currentIndex; i++) {
        if (gameState.allNumbers[i] && gameState.allNumbers[i].tour === currentTour) {
            numbersInCurrentTour++;
        }
    }

    // Получаем общее количество чисел в туре
    const tourData = lotteryData.find(t => t.tour === currentTour);
    if (!tourData) return;

    const totalNumbersInTour = tourData.numbers.length;

    // Проверяем условия предвыигрышной ситуации
    let shouldShow = false;

    if (currentTour === 1 && numbersInCurrentTour >= 4 && numbersInCurrentTour < totalNumbersInTour) {
        shouldShow = true;
    } else if (currentTour === 2 && numbersInCurrentTour >= 14 && numbersInCurrentTour < totalNumbersInTour) {
        shouldShow = true;
    } else if (currentTour === 3 && numbersInCurrentTour >= 29 && numbersInCurrentTour < totalNumbersInTour) {
        shouldShow = true;
    }

    // Показываем/скрываем индикатор
    if (shouldShow) {
        preWinAlert.style.display = 'block';
    } else {
        preWinAlert.style.display = 'none';
    }
}

function updateDrawnNumbers() {
    const numbersList = document.getElementById('numbers-list');
    numbersList.innerHTML = gameState.drawnNumbers
        .map(n => `<span class="number-badge">${n}</span>`)
        .join('');

    // Автоматически прокручиваем вниз к последним числам
    numbersList.scrollTop = numbersList.scrollHeight;
}

function endGame() {
    // Меняем текст и обработчик кнопки
    const drawButton = document.getElementById('draw-button');
    drawButton.textContent = 'Показать невыпавшие числа';
    drawButton.onclick = showResults;
    drawButton.style.display = 'block';
}

function showResults() {
    // Скрываем игровой экран
    document.getElementById('game-screen').style.display = 'none';

    // Показываем "Тираж завершён"
    document.getElementById('game-over').style.display = 'block';

    // Вычисляем и показываем невыпавшие бочонки
    const drawnSet = new Set(gameState.drawnNumbers);
    const remaining = [];
    for (let i = 1; i <= 90; i++) {
        if (!drawnSet.has(i)) {
            remaining.push(i);
        }
    }

    const remainingList = document.getElementById('remaining-list');
    remainingList.innerHTML = remaining
        .map(n => `<span class="number-badge remaining">${n}</span>`)
        .join('');

    document.getElementById('remaining-barrels').style.display = 'block';

    // Генерируем таблицу результатов
    generateResultsTable();
    document.getElementById('results-table').style.display = 'block';
}

function generateResultsTable() {
    const tbody = document.getElementById('results-table-body');

    const rows = lotteryData.map(tour => {
        // Форматируем числа: соединяем массив в строку
        const numbersStr = tour.numbers
            .map(n => `<span class="number-badge-remaining">${n}</span>`)
            .join('');

        return `
            <tr>
                <td>${tour.tour}</td>
                <td class="numbers-list">${numbersStr}</td>
                <td>${formatNumber(tour.winners)}</td>
                <td>${formatNumber(tour.prize)}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

// Переключение полноэкранного режима
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Ошибка при попытке включить полноэкранный режим: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Открыть модальное окно с правилами тура
function openRulesModal() {
    const currentTour = parseInt(document.getElementById('current-tour').textContent);

    // Если игра ещё не началась (тур = "-"), не открываем модальное окно
    if (isNaN(currentTour)) return;

    // Для туров 3 и выше используем правила тура 3
    const ruleKey = currentTour <= 2 ? currentTour : 3;
    const rules = tourRules[ruleKey];

    // Обновляем содержимое модального окна
    document.getElementById('rules-image').src = rules.image;
    document.getElementById('rules-title').textContent = rules.title;
    document.getElementById('rules-description').textContent = rules.description;

    // Показываем модальное окно (display: flex для центрирования)
    document.getElementById('rules-modal').style.display = 'flex';
}

// Закрыть модальное окно
function closeRulesModal() {
    document.getElementById('rules-modal').style.display = 'none';
}

// Закрыть модальное окно при клике на затемнённый фон
function handleModalBackdropClick(event) {
    if (event.target.id === 'rules-modal') {
        closeRulesModal();
    }
}

// Открыть попап загрузки тиража
function openLoadDrawModal() {
    document.getElementById('load-draw-modal').style.display = 'flex';
    document.getElementById('draw-number-input').value = '';
    document.getElementById('load-error').style.display = 'none';
}

// Закрыть попап загрузки тиража
function closeLoadDrawModal() {
    document.getElementById('load-draw-modal').style.display = 'none';
}

// Обработчик загрузки тиража
async function handleLoadDraw() {
    const input = document.getElementById('draw-number-input');
    const drawNumber = parseInt(input.value);

    if (!drawNumber || drawNumber < 1) {
        showLoadError('Введите корректный номер тиража');
        return;
    }

    // Показываем спиннер
    const btn = document.getElementById('load-draw-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnSpinner = btn.querySelector('.btn-spinner');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    document.getElementById('load-error').style.display = 'none';

    try {
        const drawData = await loadDrawData(drawNumber);
        updateDrawUI(drawData);
        closeLoadDrawModal();

    } catch (error) {
        showLoadError(error.message || 'Не удалось загрузить данные тиража');

    } finally {
        // Скрываем спиннер
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

// Показать сообщение об ошибке
function showLoadError(message) {
    const errorDiv = document.getElementById('load-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Закрытие по клику на фон
function handleLoadDrawBackdropClick(event) {
    if (event.target.id === 'load-draw-modal') {
        closeLoadDrawModal();
    }
}

// Инициализация игры
function init() {
    // Обработчик для кнопки "Начать игру"
    document.getElementById('start-game-button').addEventListener('click', startGame);

    // Обработчик для кнопки полноэкранного режима
    document.getElementById('fullscreen-button').addEventListener('click', toggleFullscreen);

    // Обработчик для кнопки информации
    document.getElementById('tour-info-btn').addEventListener('click', openRulesModal);

    // Обработчик для кнопки "Хорошо"
    document.getElementById('close-rules').addEventListener('click', closeRulesModal);

    // Закрытие по клику на фон
    document.getElementById('rules-modal').addEventListener('click', handleModalBackdropClick);

    // Обработчик для кнопки "Другой тираж"
    document.getElementById('change-draw-btn').addEventListener('click', openLoadDrawModal);

    // Обработчики для попапа загрузки
    document.getElementById('cancel-load-btn').addEventListener('click', closeLoadDrawModal);
    document.getElementById('load-draw-btn').addEventListener('click', handleLoadDraw);
    document.getElementById('load-draw-modal').addEventListener('click', handleLoadDrawBackdropClick);

    // Enter в поле ввода = загрузить
    document.getElementById('draw-number-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleLoadDraw();
        }
    });

    // Закрытие по клавише ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const rulesModal = document.getElementById('rules-modal');
            const loadModal = document.getElementById('load-draw-modal');

            if (rulesModal.style.display === 'flex') {
                closeRulesModal();
            } else if (loadModal.style.display === 'flex') {
                closeLoadDrawModal();
            }
        }
    });
}

// Запуск игры
function startGame() {
    // Скрываем стартовый экран
    document.getElementById('start-screen').style.display = 'none';

    // Скрываем кнопку "Другой тираж"
    document.getElementById('change-draw-btn').style.visibility = 'hidden';

    // Показываем игровой экран
    document.getElementById('game-screen').style.display = 'grid';

    // Инициализируем Three.js и игру
    initThreeJS();

    document.getElementById('draw-button').addEventListener('click', drawNextNumber);
    document.getElementById('current-tour').textContent = '1';
}

// Запуск при загрузке страницы
window.addEventListener('DOMContentLoaded', init);
