const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid'); // Zum Erstellen einer eindeutigen Session-ID

const app = express();
const PORT = process.env.PORT || 3000;

const wordToGuess = "Katze".toLowerCase();
const maxAttempts = 6;

// Hier werden die Spielzustände der Benutzer gespeichert
let sessions = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Middleware zur Verwaltung von Sitzungen
app.use((req, res, next) => {
    // Überprüfen, ob der Benutzer eine Session-ID hat
    let sessionId = req.cookies.sessionId;

    // Wenn nicht, erstellen wir eine neue
    if (!sessionId || !sessions[sessionId]) {
        sessionId = uuidv4();
        res.cookie('sessionId', sessionId, { maxAge: 24 * 60 * 60 * 1000 }); // 1 Tag gültig
        sessions[sessionId] = {
            attempts: 0,
            gameOver: false,
        };
    }

    // Den aktuellen Session-Status an die Anfrage anhängen
    req.session = sessions[sessionId];
    req.sessionId = sessionId;
    next();
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/guess', (req, res) => {
    if (req.session.gameOver) {
        return res.json({ message: `Spiel ist beendet! Das richtige Wort war "${wordToGuess}".`, status: "gameOver" });
    }

    const guess = req.body.guess.toLowerCase();

    if (guess.length !== 5) {
        return res.json({ message: "Das Wort muss 5 Buchstaben lang sein!", status: "error" });
    }

    req.session.attempts++;
    let result = [];

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === wordToGuess[i]) {
            result.push({ letter: guess[i], status: 'correct' });
        } else if (wordToGuess.includes(guess[i])) {
            result.push({ letter: guess[i], status: 'present' });
        } else {
            result.push({ letter: guess[i], status: 'absent' });
        }
    }

    if (guess === wordToGuess) {
        req.session.gameOver = true;
        return res.json({ message: "Herzlichen Glückwunsch! Du hast das Wort erraten!", status: "win", result });
    } else if (req.session.attempts >= maxAttempts) {
        req.session.gameOver = true;
        return res.json({ message: `Leider hast du verloren! Das richtige Wort war "${wordToGuess}".`, status: "lose", result });
    } else {
        return res.json({ message: `Versuche übrig: ${maxAttempts - req.session.attempts}`, status: "continue", result });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
