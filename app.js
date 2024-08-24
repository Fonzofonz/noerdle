const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const wordToGuess = "Biene".toLowerCase();
const maxAttempts = 6;

let attempts = 0;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/guess', (req, res) => {
    const guess = req.body.guess.toLowerCase();

    if (guess.length !== 5) {
        return res.json({ message: "Das Wort muss 5 Buchstaben lang sein!", status: "error" });
    }

    attempts++;
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
        return res.json({ message: "Herzlichen Glückwunsch! Du hast das Wort erraten!", status: "win", result });
    } else if (attempts >= maxAttempts) {
        return res.json({ message: `Leider hast du verloren! Das richtige Wort war "${wordToGuess}".`, status: "lose", result });
    } else {
        return res.json({ message: `Versuche übrig: ${maxAttempts - attempts}`, status: "continue", result });
    }
});

app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
