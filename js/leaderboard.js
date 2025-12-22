
const DB_URL = "https://santatracker-5f4e4-default-rtdb.firebaseio.com/scores.json";

export class Leaderboard {
    constructor() {
        this.scores = [];
    }

    async fetchScores() {
        try {
            const res = await fetch(`${DB_URL}?orderBy="score"&limitToLast=10`);
            const data = await res.json();
            if (!data) return [];

            // Convert object to array
            this.scores = Object.values(data).sort((a, b) => b.score - a.score).slice(0, 10);
            return this.scores;
        } catch (e) {
            console.error("Error fetching scores", e);
            return [];
        }
    }

    async submitScore(name, score) {
        try {
            const entry = { name, score, date: Date.now() };
            await fetch(DB_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry)
            });
            return true;
        } catch (e) {
            console.error("Error submitting score", e);
            return false;
        }
    }
}
