const QUIZ_MODULES = {
    multiplication: {
        title: 'Times Table Practice',
        icon: '✖️',
        maxProblems: 10,
        timeLimit: 30,
        inputType: 'number',
        generateProblem(moduleState) {
            const factors = Array.from({ length: 11 }, (_, index) => index + 2);
            const availableFactors = factors.filter(factor =>
                ![10, 11].includes(factor) || !moduleState.usedRestrictedFactors.has(factor)
            );
            const left = randomItem(availableFactors);
            const rightChoices = [10, 11].includes(left)
                ? availableFactors.filter(factor => factor !== left)
                : availableFactors;
            const right = randomItem(rightChoices);

            if ([10, 11].includes(left)) moduleState.usedRestrictedFactors.add(left);
            if ([10, 11].includes(right)) moduleState.usedRestrictedFactors.add(right);
            return {
                answer: left * right,
                answerLabel: String(left * right),
                questionText: `${left} × ${right} = ?`,
                promptHtml: `<div class="problem arithmetic-problem"><span>${left}</span> × <span>${right}</span> = ?</div>`
            };
        }
    },
    fluency: {
        title: 'Fluency Sprint',
        icon: '⚡',
        maxProblems: 12,
        timeLimit: 15,
        inputType: 'number',
        generateProblem() {
            const left = randomInt(2, 12);
            const right = randomInt(2, 12);
            const isDivision = Math.random() < 0.5;

            if (isDivision) {
                const dividend = left * right;
                return {
                    answer: left,
                    answerLabel: String(left),
                    questionText: `${dividend} ÷ ${right} = ?`,
                    promptHtml: `<p class="problem-instruction">Recall the related fact—no remainder here.</p><div class="problem arithmetic-problem"><span>${dividend}</span> ÷ <span>${right}</span> = ?</div>`
                };
            }

            return {
                answer: left * right,
                answerLabel: String(left * right),
                questionText: `${left} × ${right} = ?`,
                promptHtml: `<p class="problem-instruction">Answer from memory if you can.</p><div class="problem arithmetic-problem"><span>${left}</span> × <span>${right}</span> = ?</div>`
            };
        }
    },
    fractions: {
        title: 'Fraction Equivalence Lab',
        icon: '🟰',
        maxProblems: 8,
        timeLimit: null,
        inputType: 'choice',
        generateProblem() {
            return generateFractionProblem();
        }
    },
    decimals: {
        title: 'Place Value & Rounding',
        icon: '🔢',
        maxProblems: 20,
        timeLimit: null,
        overallTimeLimit: 180,
        inputType: 'choice',
        generateProblem(moduleState) {
            if (!moduleState.deck) moduleState.deck = buildDecimalDeck();
            const question = moduleState.deck.shift();
            return question.kind === 'place-value'
                ? generatePlaceValueProblem(question.type)
                : generateRoundingProblem(question.roundTo);
        }
    },
    geometry: {
        title: 'Geometry Lab',
        icon: '📐',
        maxProblems: 10,
        timeLimit: null,
        overallTimeLimit: 180,
        inputType: 'choice',
        generateProblem(moduleState) {
            if (!moduleState.deck) moduleState.deck = shuffle(GEOMETRY_QUESTIONS);
            return generateGeometryProblem(moduleState.deck.shift());
        }
    }
};

const FRACTION_SEEDS = [
    [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5]
];

const CORRECT_FEEDBACK = {
    multiplication: [
        'Super! You nailed it. 🎉',
        'Fantastic! That fact is getting strong. 💪',
        'Yes! Beautiful multiplication. ⭐',
        'The Force is strong with you. 🌌'
    ],
    fluency: [
        'Super! That fact came back fast. ⚡',
        'Boom! Instant recall. 🚀',
        'Excellent! Your math brain is flying. 🌟'
    ],
    fractions: [
        'Super! Those fractions show the same amount. 🌟',
        'Exactly! Different pieces, equal amount. 🎯',
        'Wonderful! You saw the equivalence. ✨'
    ],
    decimals: [
        'Super! You found the right place. 🔢',
        'Exactly right—beautiful number sense! 🎯',
        'Nice rounding! That number landed perfectly. ⭐'
    ],
    geometry: [
        'Super! Your geometry vision is sharp. 📐',
        'Exactly! You saw the shape of the idea. ✨',
        'Great work—geometry power unlocked! 🟢'
    ]
};

class ResultsLogger {
    constructor(endpoint) {
        this.endpoint = endpoint?.trim() || '';
        this.storageKey = 'math-practice-pending-results';
        if (this.endpoint) void this.flushPending();
    }

    getPending() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch {
            return [];
        }
    }

    savePending(results) {
        localStorage.setItem(this.storageKey, JSON.stringify(results.slice(-25)));
    }

    async send(result) {
        const playerName = result.playerName || result.player || result.name || result.studentName || '';
        const compatibleResult = {
            ...result,
            playerName,
            name: playerName,
            player: playerName,
            studentName: playerName
        };
        await fetch(this.endpoint, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-store',
            keepalive: true,
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(compatibleResult)
        });
    }

    async log(result) {
        const pending = [...this.getPending(), result];
        this.savePending(pending);

        if (!this.endpoint) {
            console.info('Quiz result saved locally. Add the Google Sheets endpoint in config.js to send it.');
            return;
        }

        try {
            await this.send(result);
            this.savePending(this.getPending().filter(item => item.sessionId !== result.sessionId));
        } catch (error) {
            console.warn('Could not send quiz result; it will be retried next time.', error);
        }
    }

    async flushPending() {
        const pending = this.getPending();
        for (const result of pending) {
            try {
                await this.send(result);
                this.savePending(this.getPending().filter(item => item.sessionId !== result.sessionId));
            } catch (error) {
                console.warn('A queued quiz result is still waiting to be sent.', error);
                break;
            }
        }
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(items) {
    return items[randomInt(0, items.length - 1)];
}

function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index--) {
        const target = Math.floor(Math.random() * (index + 1));
        [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
}

function fractionKey(numerator, denominator) {
    return `${numerator}/${denominator}`;
}

function fractionBar(numerator, denominator, compact = false) {
    const segments = Array.from({ length: denominator }, (_, index) =>
        `<span class="fraction-segment${index < numerator ? ' shaded' : ''}"></span>`
    ).join('');
    return `<span class="fraction-bar${compact ? ' compact' : ''}" aria-label="${numerator} out of ${denominator} equal parts shaded">${segments}</span>`;
}

function numberLine(numerator, denominator) {
    const ticks = Array.from({ length: denominator + 1 }, (_, index) => {
        const label = index === 0 ? '0' : index === denominator ? '1' : '';
        return `<span class="number-line-tick${index === numerator ? ' active' : ''}"><span>${label}</span></span>`;
    }).join('');
    return `<div class="number-line" aria-label="Point at ${numerator} over ${denominator} on a number line">${ticks}</div>`;
}

function generateFractionProblem() {
    const [numerator, denominator] = FRACTION_SEEDS[randomInt(0, FRACTION_SEEDS.length - 1)];
    const maxMultiplier = Math.max(2, Math.min(4, Math.floor(12 / denominator)));
    const multiplier = randomInt(2, maxMultiplier);
    const equivalent = [numerator * multiplier, denominator * multiplier];
    const correctKey = fractionKey(...equivalent);
    const distractorCandidates = [
        [equivalent[0] + 1, equivalent[1]],
        [Math.max(1, equivalent[0] - 1), equivalent[1]],
        [numerator + multiplier, denominator + multiplier],
        [numerator, denominator * multiplier],
        [Math.min(equivalent[1] - 1, equivalent[0] + 2), equivalent[1]],
        [equivalent[0], equivalent[1] + 1],
        [equivalent[0] + 1, equivalent[1] + 1]
    ];
    const seen = new Set([correctKey]);
    const distractors = [];

    for (const fraction of shuffle(distractorCandidates)) {
        const key = fractionKey(...fraction);
        if (fraction[0] > 0 && fraction[0] < fraction[1] && !seen.has(key)) {
            seen.add(key);
            distractors.push(fraction);
        }
        if (distractors.length === 3) break;
    }

    const choices = shuffle([equivalent, ...distractors]).map(([choiceNumerator, choiceDenominator]) => ({
        value: fractionKey(choiceNumerator, choiceDenominator),
        label: `${choiceNumerator}/${choiceDenominator}`,
        html: `${fractionBar(choiceNumerator, choiceDenominator, true)}<span class="fraction-label"><span>${choiceNumerator}</span><span>${choiceDenominator}</span></span>`
    }));
    const useNumberLine = Math.random() < 0.5;
    const visual = useNumberLine
        ? numberLine(numerator, denominator)
        : fractionBar(numerator, denominator);
    const modelName = useNumberLine ? 'number line' : 'shaded bar';

    return {
        answer: correctKey,
        answerLabel: `${equivalent[0]}/${equivalent[1]}`,
        questionText: `Which fraction is equivalent to ${numerator}/${denominator}?`,
        choices,
        promptHtml: `
            <p class="problem-instruction">Which fraction names the same amount as this ${modelName}?</p>
            <div class="fraction-model">
                ${visual}
                <span class="fraction-label large"><span>${numerator}</span><span>${denominator}</span></span>
            </div>
            <p class="visual-hint">Look at the amount shown, not only the numbers.</p>
        `
    };
}

const PLACE_VALUE_TYPES = [
    'Millions', 'Hundred-Thousands', 'Ten-Thousands', 'Thousands', 'Hundreds',
    'Tens', 'Ones', 'Tenths', 'Hundredths', 'Thousandths'
];

const WHOLE_ONLY_PLACE_VALUES = new Set([
    'Millions', 'Hundred-Thousands', 'Ten-Thousands', 'Thousands'
]);

const MIN_DIGITS_FOR_PLACE = {
    Millions: 7,
    'Hundred-Thousands': 6,
    'Ten-Thousands': 5,
    Thousands: 4,
    Hundreds: 3,
    Tens: 2,
    Ones: 1,
    Tenths: 1,
    Hundredths: 1,
    Thousandths: 1
};

const SHAPE_SVGS = {
    Triangle: '<svg width="58" height="54" viewBox="0 0 58 54" aria-hidden="true"><polygon points="29,4 54,50 4,50" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    Square: '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true"><rect x="4" y="4" width="46" height="46" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    Pentagon: '<svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true"><polygon points="29,4 53,21 44,50 14,50 5,21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
    Hexagon: '<svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true"><polygon points="29,4 51,17 51,43 29,56 7,43 7,17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>'
};

const GEO_DIAGRAM_1 = `<svg class="geometry-diagram" viewBox="0 0 220 135" role="img" aria-label="Points A, B, and C on a segment; line D E through B; and ray B F">
    <defs>
        <marker id="d1-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="currentColor"/></marker>
        <marker id="d1-arrR" markerWidth="8" markerHeight="8" refX="1" refY="3" orient="auto-start-reverse"><path d="M0,0 L0,6 L8,3 z" fill="currentColor"/></marker>
    </defs>
    <line x1="18" y1="80" x2="196" y2="80" stroke="currentColor" stroke-width="2.5"/>
    <line x1="110" y1="128" x2="110" y2="8" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1-arr)" marker-start="url(#d1-arrR)"/>
    <line x1="110" y1="80" x2="46" y2="18" stroke="currentColor" stroke-width="2.5" marker-end="url(#d1-arr)"/>
    <circle cx="18" cy="80" r="4" fill="currentColor"/><circle cx="110" cy="80" r="4" fill="currentColor"/><circle cx="196" cy="80" r="4" fill="currentColor"/>
    <text x="18" y="100">A</text><text x="110" y="100">B</text><text x="196" y="100">C</text><text x="40" y="16">F</text><text x="122" y="12">E</text><text x="122" y="133">D</text>
</svg>`;

const GEO_DIAGRAM_2 = `<svg class="geometry-diagram" viewBox="0 0 210 125" role="img" aria-label="Ray P Q, line R S, and segment T V">
    <defs>
        <marker id="d2-arr" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="currentColor"/></marker>
        <marker id="d2-arrR" markerWidth="8" markerHeight="8" refX="1" refY="3" orient="auto-start-reverse"><path d="M0,0 L0,6 L8,3 z" fill="currentColor"/></marker>
    </defs>
    <line x1="20" y1="28" x2="190" y2="28" stroke="currentColor" stroke-width="2.5" marker-end="url(#d2-arr)"/><circle cx="20" cy="28" r="4" fill="currentColor"/>
    <text x="20" y="20">P</text><text x="196" y="20">Q</text>
    <line x1="8" y1="68" x2="202" y2="68" stroke="currentColor" stroke-width="2.5" marker-start="url(#d2-arrR)" marker-end="url(#d2-arr)"/>
    <circle cx="62" cy="68" r="4" fill="currentColor"/><circle cx="148" cy="68" r="4" fill="currentColor"/><text x="62" y="60">R</text><text x="148" y="60">S</text>
    <line x1="28" y1="108" x2="182" y2="108" stroke="currentColor" stroke-width="2.5"/><circle cx="28" cy="108" r="4" fill="currentColor"/><circle cx="182" cy="108" r="4" fill="currentColor"/>
    <text x="28" y="100">T</text><text x="182" y="100">V</text>
</svg>`;

const GEOMETRY_QUESTIONS = [
    { type: 'shape', question: 'Which shape below has exactly 5 line segments?', choices: ['Triangle', 'Square', 'Pentagon', 'Hexagon'], correct: 'Pentagon' },
    { type: 'shape', question: 'Which shape below has exactly 4 line segments?', choices: ['Triangle', 'Square', 'Pentagon', 'Hexagon'], correct: 'Square' },
    { question: 'Which of the following statements is true?', choices: ['A line segment has no endpoints.', 'A line has 2 endpoints.', 'A ray has one endpoint.', 'A line segment has one endpoint.'], correct: 'A ray has one endpoint.' },
    { question: 'Which of the following statements is true?', choices: ['A line extends in only one direction.', 'A ray has two endpoints.', 'A line segment has exactly two endpoints.', 'A point has length and width.'], correct: 'A line segment has exactly two endpoints.' },
    { question: 'Challenge: Which of the following statements is true?', choices: ['The capital letter V contains two angles.', 'The capital letter W contains two angles.', 'The capital letter V contains one angle.', 'The capital letter I contains one angle.'], correct: 'The capital letter V contains one angle.' },
    { question: 'Challenge: Which of the following statements is true?', choices: ['The capital letter W contains one angle.', 'The capital letter V contains three angles.', 'The capital letter Z contains three angles.', 'The capital letter W contains three angles.'], correct: 'The capital letter W contains three angles.' },
    { question: 'Use the diagram to answer: which of the following is a ray?', diagram: GEO_DIAGRAM_1, choices: ['Ray BF', 'Ray B', 'Ray DE', 'Ray DCB'], correct: 'Ray BF' },
    { question: 'Use the diagram to answer: which of the following is a line segment?', diagram: GEO_DIAGRAM_1, choices: ['Line segment FB', 'Line segment AF', 'Line segment AC', 'Line segment DE'], correct: 'Line segment AC' },
    { question: 'Use the diagram to answer: which of the following is a ray?', diagram: GEO_DIAGRAM_2, choices: ['Ray PQ', 'Ray RS', 'Ray TV', 'Ray QP'], correct: 'Ray PQ' },
    { question: 'Use the diagram to answer: which of the following is a line segment?', diagram: GEO_DIAGRAM_2, choices: ['Line segment PQ', 'Line segment RS', 'Line segment TV', 'Line segment RV'], correct: 'Line segment TV' }
];

function buildDecimalDeck() {
    const roundingTargets = [
        ...Array(4).fill('whole number'),
        ...Array(3).fill('tenth'),
        ...Array(3).fill('hundredth')
    ];
    return shuffle([
        ...PLACE_VALUE_TYPES.map(type => ({ kind: 'place-value', type })),
        ...roundingTargets.map(roundTo => ({ kind: 'rounding', roundTo }))
    ]);
}

function formatNumberWithTarget(fullString, targetIndex) {
    const decimalIndex = fullString.indexOf('.') === -1 ? fullString.length : fullString.indexOf('.');
    let html = '';
    let plain = '';
    for (let index = 0; index < fullString.length; index++) {
        const character = fullString[index];
        if (index > 0 && index < decimalIndex && (decimalIndex - index) % 3 === 0) {
            html += ',';
            plain += ',';
        }
        html += index === targetIndex ? `<span class="target-digit">${character}</span>` : character;
        plain += character;
    }
    return { html, plain };
}

function generatePlaceValueProblem(targetType) {
    const isWholeOnly = WHOLE_ONLY_PLACE_VALUES.has(targetType);
    const minimumDigits = MIN_DIGITS_FOR_PLACE[targetType] || 1;
    const wholeLength = Math.min(minimumDigits + randomInt(0, 2), 7);
    let wholePart = String(randomInt(1, 9));
    for (let index = 1; index < wholeLength; index++) wholePart += randomInt(0, 9);

    let fullString = wholePart;
    if (!isWholeOnly) {
        fullString += `.${randomInt(0, 9)}${randomInt(0, 9)}${randomInt(0, 9)}`;
    }
    const decimalIndex = fullString.indexOf('.') === -1 ? fullString.length : fullString.indexOf('.');
    const offsets = {
        Ones: -1, Tens: -2, Hundreds: -3, Thousands: -4,
        'Ten-Thousands': -5, 'Hundred-Thousands': -6, Millions: -7,
        Tenths: 1, Hundredths: 2, Thousandths: 3
    };
    const targetIndex = decimalIndex + offsets[targetType];
    const display = formatNumberWithTarget(fullString, targetIndex);
    const choices = shuffle([
        targetType,
        ...shuffle(PLACE_VALUE_TYPES.filter(type => type !== targetType)).slice(0, 3)
    ]).map(label => ({ value: label, label }));

    return {
        answer: targetType,
        answerLabel: targetType,
        questionText: `What is the place value of the digit ${fullString[targetIndex]} in ${display.plain}?`,
        choices,
        promptHtml: `<div class="legacy-question-panel decimal-panel"><span class="question-badge place-value-badge">Place Value</span><p class="problem-instruction">What is the place value of the underlined digit?</p><div class="decimal-number">${display.html}</div></div>`
    };
}

function generateRoundingNumber() {
    const digits = randomInt(1, 3);
    const whole = digits === 1 ? randomInt(1, 9) : digits === 2 ? randomInt(10, 99) : randomInt(100, 999);
    return { whole, d1: randomInt(0, 9), d2: randomInt(0, 9), d3: randomInt(1, 9) };
}

function computeRounded({ whole, d1, d2, d3 }, roundTo) {
    const thousandths = whole * 1000 + d1 * 100 + d2 * 10 + d3;
    if (roundTo === 'whole number') {
        return String(Math.floor(thousandths / 1000) + (thousandths % 1000 >= 500 ? 1 : 0));
    }
    if (roundTo === 'tenth') {
        const tenths = Math.floor(thousandths / 100) + (thousandths % 100 >= 50 ? 1 : 0);
        return `${Math.floor(tenths / 10)}.${tenths % 10}`;
    }
    const hundredths = Math.floor(thousandths / 10) + (thousandths % 10 >= 5 ? 1 : 0);
    return `${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
}

function generateWrongRoundingAnswers(correct, roundTo) {
    const correctNumber = Number(correct);
    const step = roundTo === 'whole number' ? 1 : roundTo === 'tenth' ? 0.1 : 0.01;
    const decimals = roundTo === 'whole number' ? 0 : roundTo === 'tenth' ? 1 : 2;
    const wrongs = [];
    for (const multiplier of [1, -1, 2, -2, 3, -3]) {
        const candidate = correctNumber + (step * multiplier);
        if (candidate < 0) continue;
        const label = candidate.toFixed(decimals);
        if (label !== correct && !wrongs.includes(label)) wrongs.push(label);
        if (wrongs.length === 3) break;
    }
    return wrongs;
}

function generateRoundingProblem(roundTo) {
    const number = generateRoundingNumber();
    const numberString = `${number.whole}.${number.d1}${number.d2}${number.d3}`;
    const correct = computeRounded(number, roundTo);
    const targetLabel = roundTo === 'whole number' ? 'nearest whole number' : `nearest ${roundTo}`;
    const choices = shuffle([correct, ...generateWrongRoundingAnswers(correct, roundTo)])
        .map(label => ({ value: label, label }));
    return {
        answer: correct,
        answerLabel: correct,
        questionText: `Round ${numberString} to the ${targetLabel}.`,
        choices,
        promptHtml: `<div class="legacy-question-panel decimal-panel"><span class="question-badge rounding-badge">Rounding</span><p class="problem-instruction">Round this number to the <strong>${targetLabel}</strong>.</p><div class="decimal-number">${numberString}</div></div>`
    };
}

function generateGeometryProblem(question) {
    const choices = shuffle(question.choices).map(label => ({
        value: label,
        label,
        html: question.type === 'shape' ? `${SHAPE_SVGS[label]}<span>${label}</span>` : null
    }));
    return {
        answer: question.correct,
        answerLabel: question.correct,
        questionText: question.question,
        choices,
        choiceLayout: question.type === 'shape' ? 'shape-grid' : 'single-column',
        promptHtml: `<div class="legacy-question-panel geometry-panel"><span class="question-badge geometry-badge">Geometry</span><p class="geometry-question-text">${question.question}</p>${question.diagram || ''}</div>`
    };
}

class MathGame {
    constructor() {
        this.selectedModuleId = 'multiplication';
        this.nextProblemTimeout = null;
        this.fireworksTimeout = null;
        this.resultsLogger = new ResultsLogger(window.MATH_GAME_CONFIG?.googleSheetsEndpoint);
        this.initializeElements();
        this.bindEvents();
        this.resetGame();
        this.selectModule(this.selectedModuleId);
    }

    initializeElements() {
        this.startBtn = document.getElementById('start-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.finishBtn = document.getElementById('finish-btn');
        this.moduleCards = [...document.querySelectorAll('.module-card')];
        this.answerInput = document.getElementById('answer-input');
        this.numericAnswerSection = document.getElementById('numeric-answer-section');
        this.choiceAnswerSection = document.getElementById('choice-answer-section');
        this.problemContent = document.getElementById('problem-content');
        this.timeLeftElement = document.getElementById('time-left');
        this.timerDisplay = document.getElementById('timer-display');
        this.scoreElement = document.getElementById('score');
        this.feedbackElement = document.getElementById('feedback');
        this.playerNameInput = document.getElementById('player-name');
        this.playerDisplayElement = document.getElementById('player-display');
        this.finalPlayerNameElement = document.getElementById('final-player-name');
        this.currentProblemElement = document.getElementById('current-problem');
        this.maxProblemsElement = document.getElementById('max-problems');
        this.moduleTitleElement = document.getElementById('module-title');
        this.moduleIconElement = document.getElementById('module-icon');
        this.finalModuleNameElement = document.getElementById('final-module-name');
        this.finalScoreElement = document.getElementById('final-score');
        this.problemsSolvedElement = document.getElementById('problems-solved');
        this.accuracyElement = document.getElementById('accuracy');
        this.resultTitleElement = document.getElementById('result-title');
        this.resultMessageElement = document.getElementById('result-message');
        this.resultIconElement = document.getElementById('result-icon');
        this.totalTimeElement = document.getElementById('total-time');
        this.averageTimeElement = document.getElementById('average-time');
        this.answerReviewListElement = document.getElementById('answer-review-list');
        this.poopProgressElement = document.getElementById('poop-progress');
        this.poopMascotElement = document.getElementById('poop-mascot');
        this.poopMessageElement = document.getElementById('poop-message');
        this.fireworksElement = document.getElementById('fireworks');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.submitBtn.addEventListener('click', () => this.checkAnswer());
        this.playAgainBtn.addEventListener('click', () => this.startGame());
        this.backToMenuBtn.addEventListener('click', () => this.showStartScreen());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.finishBtn.addEventListener('click', () => this.finishGame());
        this.moduleCards.forEach(card => card.addEventListener('click', () => this.selectModule(card.dataset.module)));

        this.answerInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') this.checkAnswer();
        });
        this.playerNameInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') this.startGame();
        });
    }

    get module() {
        return QUIZ_MODULES[this.selectedModuleId];
    }

    selectModule(moduleId) {
        if (!QUIZ_MODULES[moduleId]) return;
        this.selectedModuleId = moduleId;
        this.moduleCards.forEach(card => {
            const isSelected = card.dataset.module === moduleId;
            card.classList.toggle('selected', isSelected);
            card.setAttribute('aria-pressed', String(isSelected));
        });
        this.startBtn.textContent = `Start ${this.module.title}`;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showStartScreen() {
        this.resetGame();
        this.showScreen('start-screen');
    }

    startGame() {
        const nameInput = this.playerNameInput.value.trim();
        if (!nameInput) {
            alert('Please enter a name to start practicing!');
            this.playerNameInput.focus();
            return;
        }

        this.resetGame();
        this.playerName = nameInput;
        this.gameActive = true;
        this.sessionId = typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.startTime = Date.now();
        this.moduleTitleElement.textContent = this.module.title;
        this.moduleIconElement.textContent = this.module.icon;
        this.maxProblemsElement.textContent = this.module.maxProblems;
        this.updatePlayerDisplay();
        this.showScreen('game-screen');
        this.generateNewProblem();
    }

    resetGame() {
        this.score = 0;
        this.problemsSolved = 0;
        this.totalAttempts = 0;
        this.currentProblem = null;
        this.currentProblemNumber = 1;
        this.timeLeft = this.module?.overallTimeLimit || this.module?.timeLimit || 0;
        this.gameActive = false;
        this.isPaused = false;
        this.playerName = this.playerName || '';
        this.startTime = null;
        this.endTime = null;
        this.problemStartTime = null;
        this.problemTimes = [];
        this.answerHistory = [];
        this.moduleState = { usedRestrictedFactors: new Set() };
        this.sessionId = null;
        this.clearScheduledWork();
        this.clearFireworks();
        this.updateScore();
        this.updateTimer();
        this.updateProblemCounter();
        this.clearFeedback();
        this.answerInput.value = '';
        this.setAnswerControlsDisabled(false);
        this.pauseBtn.textContent = '⏸️ Pause';
        this.pauseBtn.disabled = false;
        this.finishBtn.disabled = false;
        this.problemContent.innerHTML = '';
        this.choiceAnswerSection.innerHTML = '';
        this.updatePoopProgress();
    }

    clearScheduledWork() {
        if (this.timer) clearInterval(this.timer);
        if (this.nextProblemTimeout) clearTimeout(this.nextProblemTimeout);
        this.timer = null;
        this.nextProblemTimeout = null;
    }

    generateNewProblem() {
        if (!this.gameActive || this.isPaused) return;
        this.currentProblem = this.module.generateProblem(this.moduleState);
        this.problemContent.innerHTML = this.currentProblem.promptHtml;
        this.renderAnswerControls();
        this.problemStartTime = Date.now();
        this.clearFeedback();
        if (!this.module.overallTimeLimit) this.timeLeft = this.module.timeLimit || 0;
        this.updateTimer();
        if (!this.timer) this.startTimer();
    }

    renderAnswerControls() {
        const usesChoices = this.module.inputType === 'choice';
        this.numericAnswerSection.hidden = usesChoices;
        this.choiceAnswerSection.hidden = !usesChoices;
        this.answerInput.value = '';
        this.choiceAnswerSection.innerHTML = '';
        this.choiceAnswerSection.className = 'choice-grid';
        if (this.currentProblem.choiceLayout) {
            this.choiceAnswerSection.classList.add(this.currentProblem.choiceLayout);
        }

        if (usesChoices) {
            this.currentProblem.choices.forEach(choice => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'answer-choice';
                button.dataset.value = choice.value;
                button.setAttribute('aria-label', choice.label);
                if (choice.html) button.innerHTML = choice.html;
                else button.textContent = choice.label;
                button.addEventListener('click', () => this.checkAnswer(choice.value));
                this.choiceAnswerSection.appendChild(button);
            });
        } else {
            this.answerInput.focus();
        }
    }

    checkAnswer(choiceValue = null) {
        if (!this.gameActive || !this.currentProblem || this.isPaused) return;
        const rawAnswer = choiceValue ?? this.answerInput.value;
        if (rawAnswer === '') {
            this.showFeedback('Enter an answer first.', 'paused');
            this.answerInput.focus();
            return;
        }
        const userAnswer = this.module.inputType === 'number' ? Number(rawAnswer) : rawAnswer;
        this.completeProblem(userAnswer === this.currentProblem.answer, false, userAnswer);
    }

    completeProblem(isCorrect, timedOut = false, userAnswer = null) {
        if (!this.gameActive || !this.currentProblem) return;
        if (!this.module.overallTimeLimit) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.totalAttempts++;
        this.recordProblemTime();
        this.setAnswerControlsDisabled(true);
        this.pauseBtn.disabled = true;
        this.updatePoopProgress();
        this.answerHistory.push({
            questionNumber: this.currentProblemNumber,
            question: this.currentProblem.questionText,
            correctAnswer: this.currentProblem.answerLabel,
            chosenAnswer: timedOut ? 'No answer (time expired)' : String(userAnswer),
            isCorrect
        });

        if (isCorrect) {
            this.score += 10;
            this.problemsSolved++;
            this.showFeedback(this.getCorrectFeedback(), 'correct');
        } else if (timedOut) {
            this.showFeedback(`Time’s up. The answer was ${this.currentProblem.answerLabel}.`, 'incorrect');
        } else {
            this.showFeedback(`Not quite. The answer was ${this.currentProblem.answerLabel}.`, 'incorrect');
        }

        this.updateScore();
        const delay = isCorrect ? 1000 : 1800;
        this.nextProblemTimeout = setTimeout(() => this.advanceProblem(), delay);
    }

    advanceProblem() {
        this.nextProblemTimeout = null;
        if (!this.gameActive) return;
        if (this.currentProblemNumber >= this.module.maxProblems) {
            this.endGame();
            return;
        }
        this.currentProblemNumber++;
        this.updateProblemCounter();
        this.updatePoopProgress();
        this.pauseBtn.disabled = false;
        this.setAnswerControlsDisabled(false);
        this.generateNewProblem();
    }

    recordProblemTime() {
        if (this.problemStartTime) {
            this.problemTimes.push((Date.now() - this.problemStartTime) / 1000);
        }
        this.problemStartTime = null;
    }

    startTimer() {
        clearInterval(this.timer);
        if (!this.module.timeLimit && !this.module.overallTimeLimit) return;
        this.timer = setInterval(() => {
            if (this.isPaused) return;
            this.timeLeft--;
            this.updateTimer();
            if (this.timeLeft <= 0) {
                if (this.module.overallTimeLimit) this.endGame();
                else this.completeProblem(false, true, null);
            }
        }, 1000);
    }

    setAnswerControlsDisabled(disabled) {
        this.answerInput.disabled = disabled;
        this.submitBtn.disabled = disabled;
        this.choiceAnswerSection.querySelectorAll('button').forEach(button => {
            button.disabled = disabled;
        });
    }

    togglePause() {
        if (!this.gameActive) return;
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        this.setAnswerControlsDisabled(this.isPaused);
        this.problemContent.classList.toggle('paused-content', this.isPaused);

        if (this.isPaused) {
            this.showFeedback('Practice paused', 'paused');
        } else {
            this.clearFeedback();
            if (this.module.inputType === 'number') this.answerInput.focus();
        }
    }

    finishGame() {
        if (this.gameActive && confirm('Finish this practice session early?')) this.endGame();
    }

    endGame() {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.clearScheduledWork();
        this.endTime = Date.now();
        this.setAnswerControlsDisabled(true);

        const accuracy = this.totalAttempts ? Math.round((this.problemsSolved / this.totalAttempts) * 100) : 0;
        const totalTime = this.startTime ? (this.endTime - this.startTime) / 1000 : 0;
        const averageTime = this.problemTimes.length
            ? this.problemTimes.reduce((sum, time) => sum + time, 0) / this.problemTimes.length
            : 0;

        this.updatePlayerDisplay();
        this.finalModuleNameElement.textContent = this.module.title;
        this.finalScoreElement.textContent = this.score;
        this.problemsSolvedElement.textContent = `${this.problemsSolved}/${this.totalAttempts}`;
        this.accuracyElement.textContent = `${accuracy}%`;
        this.totalTimeElement.textContent = `${totalTime.toFixed(1)}s`;
        this.averageTimeElement.textContent = `${averageTime.toFixed(1)}s`;
        this.setResultMessage(accuracy);
        this.renderAnswerReview();
        this.showScreen('result-screen');
        this.launchFireworks();
        void this.resultsLogger.log({
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            playerName: this.playerName,
            name: this.playerName,
            player: this.playerName,
            studentName: this.playerName,
            moduleId: this.selectedModuleId,
            moduleName: this.module.title,
            score: this.score,
            correctAnswers: this.problemsSolved,
            questionsAnswered: this.totalAttempts,
            totalQuestions: this.module.maxProblems,
            accuracy,
            totalTimeSeconds: Number(totalTime.toFixed(1)),
            averageTimeSeconds: Number(averageTime.toFixed(1)),
            completedModule: this.totalAttempts >= this.module.maxProblems,
            answers: this.answerHistory
        });
    }

    renderAnswerReview() {
        this.answerReviewListElement.innerHTML = '';

        if (!this.answerHistory.length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'review-empty';
            emptyMessage.textContent = 'No questions were answered in this session.';
            this.answerReviewListElement.appendChild(emptyMessage);
            return;
        }

        this.answerHistory.forEach(answer => {
            const item = document.createElement('article');
            item.className = `review-item ${answer.isCorrect ? 'review-correct' : 'review-incorrect'}`;

            const topLine = document.createElement('div');
            topLine.className = 'review-top-line';

            const questionNumber = document.createElement('span');
            questionNumber.className = 'review-number';
            questionNumber.textContent = `Question ${answer.questionNumber}`;

            const status = document.createElement('span');
            status.className = 'review-status';
            status.textContent = answer.isCorrect ? '✓ Correct' : '✗ Try again next time';
            topLine.append(questionNumber, status);

            const question = document.createElement('p');
            question.className = 'review-question';
            question.textContent = answer.question;

            const answers = document.createElement('div');
            answers.className = 'review-answers';

            const correctAnswer = document.createElement('span');
            correctAnswer.innerHTML = '<strong>Correct answer:</strong> ';
            correctAnswer.append(document.createTextNode(answer.correctAnswer));
            answers.appendChild(correctAnswer);

            if (!answer.isCorrect) {
                const chosenAnswer = document.createElement('span');
                chosenAnswer.innerHTML = '<strong>Your answer:</strong> ';
                chosenAnswer.append(document.createTextNode(answer.chosenAnswer));
                answers.appendChild(chosenAnswer);
            }

            item.append(topLine, question, answers);
            this.answerReviewListElement.appendChild(item);
        });
    }

    getCorrectFeedback() {
        const messages = CORRECT_FEEDBACK[this.selectedModuleId];
        return messages[randomInt(0, messages.length - 1)];
    }

    updatePoopProgress() {
        const total = this.module?.maxProblems || 1;
        const progress = Math.min(this.totalAttempts / total, 1);
        const questionNumber = this.currentProblemNumber;
        const percent = progress === 0 ? 3 : 3 + (progress * 94);
        const progressPercent = Math.round(progress * 100);

        this.poopProgressElement.style.setProperty('--poop-progress', `${percent}%`);
        this.poopProgressElement.setAttribute('aria-valuenow', String(progressPercent));
        this.poopMascotElement.className = 'poop-mascot';
        this.poopMascotElement.textContent = '💩';

        if (progress >= 1) {
            this.poopMascotElement.textContent = '🧠';
            this.poopMascotElement.classList.add('brain-finale');
            this.poopMessageElement.textContent = 'MAXIMUM BRAIN POWER!';
        } else if (questionNumber >= 8) {
            this.poopMascotElement.classList.add('poop-hearts');
            this.poopMessageElement.textContent = 'So close—the poop loves this!';
        } else if (progress >= 0.5) {
            this.poopMascotElement.classList.add('poop-bounce');
            this.poopMessageElement.textContent = 'Halfway! Poop power is rising!';
        } else if (questionNumber >= 2) {
            this.poopMascotElement.classList.add('poop-stars');
            this.poopMessageElement.textContent = 'Star-powered poop is on the move!';
        } else {
            this.poopMessageElement.textContent = 'Ready to roll!';
        }
    }

    launchFireworks() {
        this.clearFireworks();
        const colors = ['#ffcf48', '#ff5c8a', '#5de2d6', '#9b8cff', '#ffffff'];
        const bursts = [
            [12, 24], [30, 38], [50, 18], [68, 35], [86, 22], [22, 62], [76, 65]
        ];

        bursts.forEach(([left, top], index) => {
            const firework = document.createElement('span');
            firework.className = 'firework';
            firework.style.left = `${left}%`;
            firework.style.top = `${top}%`;
            firework.style.color = colors[index % colors.length];
            firework.style.animationDelay = `${index * 0.28}s`;
            this.fireworksElement.appendChild(firework);
        });
        this.fireworksElement.classList.add('active');
        this.fireworksTimeout = setTimeout(() => this.clearFireworks(), 4200);
    }

    clearFireworks() {
        if (this.fireworksTimeout) clearTimeout(this.fireworksTimeout);
        this.fireworksTimeout = null;
        if (!this.fireworksElement) return;
        this.fireworksElement.classList.remove('active');
        this.fireworksElement.innerHTML = '';
    }

    setResultMessage(accuracy) {
        if (accuracy >= 90) {
            this.resultIconElement.textContent = '🏆';
            this.resultTitleElement.textContent = 'Excellent Work!';
            this.resultMessageElement.textContent = 'Those ideas are becoming strong and automatic.';
        } else if (accuracy >= 70) {
            this.resultIconElement.textContent = '🌟';
            this.resultTitleElement.textContent = 'Good Progress!';
            this.resultMessageElement.textContent = 'You are building a sturdy foundation—keep going.';
        } else {
            this.resultIconElement.textContent = '🌱';
            this.resultTitleElement.textContent = 'Practice Makes Pathways!';
            this.resultMessageElement.textContent = 'Mistakes show us exactly what to practice next.';
        }
    }

    showFeedback(message, type) {
        this.feedbackElement.textContent = message;
        this.feedbackElement.className = `feedback ${type}`;
    }

    clearFeedback() {
        this.feedbackElement.textContent = '';
        this.feedbackElement.className = 'feedback';
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateTimer() {
        const isTimed = Boolean(this.module?.timeLimit || this.module?.overallTimeLimit);
        const isOverallTimer = Boolean(this.module?.overallTimeLimit);
        this.timerDisplay.hidden = !isTimed;
        this.timeLeftElement.textContent = isOverallTimer
            ? `${Math.floor(this.timeLeft / 60)}:${String(this.timeLeft % 60).padStart(2, '0')}`
            : `${this.timeLeft}s`;
        this.timerDisplay.classList.toggle('warning', isTimed && this.timeLeft <= (isOverallTimer ? 20 : 5));
    }

    updatePlayerDisplay() {
        const displayName = this.playerName || 'Player';
        this.playerDisplayElement.textContent = displayName;
        this.finalPlayerNameElement.textContent = displayName;
    }

    updateProblemCounter() {
        this.currentProblemElement.textContent = this.currentProblemNumber;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mathGame = new MathGame();
});
