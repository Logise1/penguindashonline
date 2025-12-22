export const ASSETS = {
    penguin: 'img/sprite-penguin.png',
    ice: 'img/element-ice1.png',
    bg: 'img/element-iceberg.png',
    present: 'img/element-present1.png',
    presentStacked: 'img/element-presentStacked.png',
    snowman: 'img/element-snowman.png',
    start: 'img/element-start.png',
    finish: 'img/element-finish.png',
    tree: 'img/element-tree1.png',
    coal: 'img/element-coal1.png',
    snow: 'img/element-snow1.png'
};

export const AUDIO_ASSETS = {
    bg_game: 'audio/music_game.ogg',
    bg_menu: 'audio/music_menu.ogg',
    bg_over: 'audio/music_game_over.ogg',
    glide: 'audio/glide.ogg',
    crash: 'audio/crash.ogg',
    die: 'audio/die.ogg',
    collect: 'audio/collect.ogg',
    level_complete: 'audio/level_complete.ogg',
    win: 'audio/win.ogg'
};

export class AssetLoader {
    constructor() {
        this.images = {};
        this.audio = {};
        this.loadedCount = 0;
        this.totalCount = Object.keys(ASSETS).length + Object.keys(AUDIO_ASSETS).length;
    }

    async loadAll() {
        const imagePromises = Object.entries(ASSETS).map(([key, src]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    this.images[key] = img;
                    this.loadedCount++;
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error(`Failed to load image: ${src}`, e);
                    resolve(null);
                };
            });
        });

        const audioPromises = Object.entries(AUDIO_ASSETS).map(([key, src]) => {
            return new Promise((resolve) => {
                const audio = new Audio();
                audio.src = src;
                // Preload can be 'auto' or 'metadata'
                audio.preload = 'auto';
                audio.oncanplaythrough = () => {
                    this.audio[key] = audio;
                    this.loadedCount++;
                    resolve(audio);
                };
                audio.onerror = (e) => {
                    console.warn(`Failed to load audio: ${src}`, e);
                    // Create a dummy audio object so we don't crash
                    this.audio[key] = { play: () => { }, pause: () => { }, currentTime: 0, loop: false };
                    resolve(null);
                };
                // Fallback if event never fires (sometimes happens with cached/small files or browser policies)
                setTimeout(() => resolve(audio), 2000);
            });
        });

        await Promise.all([...imagePromises, ...audioPromises]);
        return { images: this.images, audio: this.audio };
    }

    get(key) {
        return this.images[key];
    }

    getAudio(key) {
        return this.audio[key];
    }

    play(key, loop = false, volume = 1.0, restart = true) {
        const sound = this.audio[key];
        if (sound) {
            if (!restart && !sound.paused) {
                // Already playing, just ensure volume/loop correct? 
                sound.loop = loop;
                sound.volume = volume;
                return sound;
            }
            sound.currentTime = 0;
            sound.loop = loop;
            sound.volume = volume;
            // Handle promise rejection (e.g. user hasn't interacted yet)
            sound.play().catch(e => console.log("Audio play suppressed:", e));
        }
        return sound;
    }

    stop(key) {
        const sound = this.audio[key];
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }
}
