// --- STATE MANAGEMENT ---
let currentTab = 'dashboard';
let filteredWords = [...dbWords];
let fcIndex = 0;
let quizQuestions = [];
let currentQuizIndex = 0;
let score = 0;
let progressData = JSON.parse(localStorage.getItem('skdProgress')) || { mastered: 0, accuracy: 0, attempts: 0 };

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    loadFlashcards();
});

// --- NAVIGATION ---
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'dashboard') updateDashboard();
    if(tabId === 'flashcard') loadFlashcards();
    if(tabId === 'quiz') resetQuizUI();
}

// --- DASHBOARD LOGIC ---
function updateDashboard() {
    document.getElementById('stat-total').innerText = dbWords.length;
    document.getElementById('stat-mastered').innerText = progressData.mastered;
    document.getElementById('stat-accuracy').innerText = `${progressData.accuracy}%`;
    
    let pct = (progressData.mastered / dbWords.length) * 100;
    if(pct > 100) pct = 100;
    document.getElementById('progress-text').innerText = `${Math.round(pct)}%`;
    document.getElementById('progress-bar').style.width = `${pct}%`;
}

// --- FLASHCARD LOGIC ---
function loadFlashcards() {
    const filter = document.getElementById('fc-filter').value;
    if(filter === 'all') {
        filteredWords = [...dbWords];
    } else {
        filteredWords = dbWords.filter(w => w.level === filter);
    }
    
    // Shuffle flashcards for Active Recall
    filteredWords.sort(() => Math.random() - 0.5);
    fcIndex = 0;
    renderCard();
}

function renderCard() {
    if(filteredWords.length === 0) return;
    const card = document.getElementById('the-card');
    card.classList.remove('flipped'); // reset flip
    
    setTimeout(() => {
        const data = filteredWords[fcIndex];
        document.getElementById('fc-word').innerText = data.word;
        document.getElementById('fc-synonym').innerText = data.synonym;
        document.getElementById('fc-level-front').innerText = data.level;
        document.getElementById('fc-example').innerText = `"${data.word} dapat digunakan dalam konteks kalimat formal."`;
        
        // Color coding based on difficulty
        const badge = document.getElementById('fc-level-front');
        badge.className = "absolute top-4 right-6 text-xs px-3 py-1 rounded-full font-bold";
        if(data.level === 'Mudah') badge.classList.add('bg-green-900', 'text-green-300');
        if(data.level === 'Menengah') badge.classList.add('bg-yellow-900', 'text-yellow-300');
        if(data.level === 'Sulit') badge.classList.add('bg-red-900', 'text-red-300');
    }, 150); // wait for unflip animation
}

function flipCard() {
    document.getElementById('the-card').classList.toggle('flipped');
}

function nextCard() {
    fcIndex = (fcIndex + 1) % filteredWords.length;
    renderCard();
}

function prevCard() {
    fcIndex = (fcIndex - 1 + filteredWords.length) % filteredWords.length;
    renderCard();
}

// --- QUIZ LOGIC (CAT SIMULATOR) ---
function startQuiz() {
    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
    
    // Generate 10 random questions
    let shuffledDb = [...dbWords].sort(() => Math.random() - 0.5);
    quizQuestions = shuffledDb.slice(0, 10);
    currentQuizIndex = 0;
    score = 0;
    
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const qData = quizQuestions[currentQuizIndex];
    document.getElementById('quiz-progress').innerText = `Soal ${currentQuizIndex + 1} / 10`;
    document.getElementById('quiz-question').innerText = qData.word;
    
    // Generate Distractors (4 random wrong answers)
    let distractors = dbWords.filter(w => w.word !== qData.word).sort(() => Math.random() - 0.5).slice(0, 4).map(w => w.synonym);
    
    let options = [qData.synonym, ...distractors];
    options.sort(() => Math.random() - 0.5); // Shuffle A,B,C,D,E
    
    const labels = ['A', 'B', 'C', 'D', 'E'];
    let optionsHtml = '';
    
    options.forEach((opt, idx) => {
        optionsHtml += `
        <div onclick="selectAnswer(this, '${opt === qData.synonym}')" class="quiz-option cursor-pointer bg-slate-700 p-4 rounded-xl border-2 border-slate-600 flex items-center">
            <span class="bg-slate-800 text-slate-300 w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4">${labels[idx]}</span>
            <span class="text-lg font-medium">${opt}</span>
        </div>`;
    });
    
    document.getElementById('quiz-options').innerHTML = optionsHtml;
}

function selectAnswer(el, isCorrect) {
    // Disable all options
    const allOptions = document.querySelectorAll('.quiz-option');
    allOptions.forEach(opt => opt.style.pointerEvents = 'none');
    
    if(isCorrect === 'true') {
        el.classList.add('correct');
        score += 10;
        // Basic spaced repetition logic: count as mastered
        progressData.mastered = Math.min(progressData.mastered + 1, dbWords.length);
    } else {
        el.classList.add('wrong');
        // Highlight correct one
        allOptions.forEach(opt => {
            if(opt.innerHTML.includes(quizQuestions[currentQuizIndex].synonym)) {
                opt.classList.add('correct');
            }
        });
    }
    
    setTimeout(() => {
        currentQuizIndex++;
        if(currentQuizIndex < 10) {
            renderQuizQuestion();
        } else {
            finishQuiz();
        }
    }, 1500);
}

function finishQuiz() {
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    
    document.getElementById('result-score').innerText = score;
    
    let cat = "";
    let aiText = "";
    
    if(score >= 90) { 
        cat = "Sangat Siap SKD"; 
        document.getElementById('result-score').className = "text-6xl font-black my-6 text-green-400";
        aiText = "Luar biasa! Penguasaan kosakatamu sangat solid. Kamu berada di jalur yang sangat tepat untuk meraih passing grade maksimal di TIU. Pertahankan ritme ini.";
    } else if(score >= 80) { 
        cat = "Siap SKD"; 
        document.getElementById('result-score').className = "text-6xl font-black my-6 text-blue-400";
        aiText = "Sangat baik! Kamu sudah familiar dengan sebagian besar pola kata. Coba buka kembali Flashcard mode 'Sulit' untuk memastikan tidak ada celah.";
    } else if(score >= 70) { 
        cat = "Cukup Siap"; 
        document.getElementById('result-score').className = "text-6xl font-black my-6 text-yellow-400";
        aiText = "Kamu memiliki dasar yang bagus, tetapi perlu meningkatkan kecepatan dan akurasi. Fokus pada pengulangan harian agar otakmu terbiasa dengan recall cepat.";
    } else if(score >= 60) { 
        cat = "Perlu Latihan"; 
        document.getElementById('result-score').className = "text-6xl font-black my-6 text-orange-400";
        aiText = "Banyak kata yang masih asing bagimu. Jangan khawatir, ini wajar. Mulailah menghafal dari kategori 'Mudah' di menu Flashcard secara rutin tiap malam.";
    } else { 
        cat = "Perlu Belajar Intensif"; 
        document.getElementById('result-score').className = "text-6xl font-black my-6 text-red-500";
        aiText = "Saatnya fokus total. Kemungkinan kamu sering terkecoh oleh distraktor kata. Kurangi tryout dulu, fokus perbanyak *input* kosakata via Flashcard sebelum lanjut latihan tes.";
    }
    
    document.getElementById('result-category').innerText = cat;
    document.getElementById('ai-evaluation').innerText = aiText;
    
    // Update global accuracy stat
    progressData.attempts += 1;
    progressData.accuracy = Math.round(((progressData.accuracy * (progressData.attempts - 1)) + score) / progressData.attempts);
    localStorage.setItem('skdProgress', JSON.stringify(progressData));
}

function resetQuizUI() {
    document.getElementById('quiz-setup').classList.remove('hidden');
    document.getElementById('quiz-active').classList.add('hidden');
    document.getElementById('quiz-result').classList.add('hidden');
}

function resetQuiz() {
    startQuiz();
}
