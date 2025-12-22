
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, set, onValue, onDisconnect, remove } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

const firebaseConfig = {
    databaseURL: "https://santatracker-5f4e4-default-rtdb.firebaseio.com",
};

export class Multiplayer {
    constructor() {
        this.name = "Anonymous";
        // Shorter ID for less bandwidth? 9 chars is fine.
        this.id = Math.random().toString(36).substr(2, 9);

        // this.players will store the Interpolated State
        // Structure: 
        // id: { 
        //    current: { x, y, angle }, 
        //    target: { x, y, angle }, 
        //    data: { name, level, timestamp } 
        // }
        this.players = {};

        this.lastUpdate = 0;

        try {
            const app = initializeApp(firebaseConfig);
            this.db = getDatabase(app);
            this.playerRef = ref(this.db, 'players/' + this.id);

            onDisconnect(this.playerRef).remove();

            const allPlayersRef = ref(this.db, 'players');
            onValue(allPlayersRef, (snapshot) => {
                this.handleServerUpdate(snapshot.val());
            });

        } catch (e) {
            console.error("Firebase init failed", e);
        }
    }

    setName(name) {
        this.name = name;
    }

    // Called from Game Loop logic
    update(x, y, level, angle) {
        if (!this.playerRef) return;

        const now = Date.now();
        // Send at ~10Hz (100ms)
        if (now - this.lastUpdate < 100) return;
        this.lastUpdate = now;

        set(this.playerRef, {
            name: this.name,
            x: Math.round(x),
            y: Math.round(y),
            angle: parseFloat(angle.toFixed(2)), // optimize size
            level: level,
            timestamp: Date.now()
        });
    }

    handleServerUpdate(serverData) {
        if (!serverData) {
            this.players = {};
            return;
        }

        const now = Date.now();
        const activeIds = new Set(Object.keys(serverData));

        // Update or Create
        activeIds.forEach(id => {
            if (id === this.id) return; // skip self

            const sPlayer = serverData[id];

            // Cleanup very old ghosts (optional, usually server deletes, but filter just in case)
            if (now - sPlayer.timestamp > 10000) return;

            if (!this.players[id]) {
                // New player
                this.players[id] = {
                    current: { x: sPlayer.x, y: sPlayer.y, angle: sPlayer.angle || 0 },
                    target: { x: sPlayer.x, y: sPlayer.y, angle: sPlayer.angle || 0 },
                    data: sPlayer
                };
            } else {
                // Update target
                const p = this.players[id];
                p.target.x = sPlayer.x;
                p.target.y = sPlayer.y;
                p.target.angle = sPlayer.angle || 0;
                p.data = sPlayer; // Refresh metadata like level
            }
        });

        // Remove disconnected
        Object.keys(this.players).forEach(id => {
            if (!activeIds.has(id)) {
                delete this.players[id];
            }
        });

        this.updateUI();
    }

    // Smooth motion
    interpolate(dt) {
        const factor = 10 * dt; // Adjust speed of smoothing (10 is roughly 0.16 per frame at 60fps)

        Object.values(this.players).forEach(p => {
            // Lerp Position
            p.current.x += (p.target.x - p.current.x) * factor;
            p.current.y += (p.target.y - p.current.y) * factor;

            // Lerp Angle (Shortest path)
            let diff = p.target.angle - p.current.angle;
            // Normalize to -PI...PI
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            p.current.angle += diff * factor;
        });
    }

    updateUI() {
        // Just the count of people visible locally
        // We can just count total keys in server data if we want global count, 
        // but this.players is filtered by self.
        const count = Object.keys(this.players).length + 1;
        const el = document.getElementById('online-count');
        if (el) el.innerText = count;
    }

    leave() {
        if (this.playerRef) remove(this.playerRef);
    }

    getRenderablePlayers(currentLevel) {
        // Return interpolated states valid for rendering
        const renderList = [];
        Object.values(this.players).forEach(p => {
            if (p.data.level === currentLevel) {
                renderList.push({
                    name: p.data.name,
                    x: p.current.x,
                    y: p.current.y,
                    angle: p.current.angle
                });
            }
        });
        return renderList;
    }
}
