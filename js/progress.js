
export const SKINS = [
    { id: 'default', name: 'Original', price: 0, tint: '#ffffff' },
    { id: 'red', name: 'Red Scarf', price: 50, tint: '#ffaaaa' }, // Light red tint
    { id: 'gold', name: 'Gold Member', price: 100, tint: '#ffd700' },
    { id: 'shadow', name: 'Shadow', price: 200, tint: '#888888' },
    { id: 'emerald', name: 'Emerald', price: 150, tint: '#88ff88' },
    { id: 'ice', name: 'Ice Cold', price: 75, tint: '#aaddff' },
    { id: 'pink', name: 'Fabulous', price: 120, tint: '#ffccff' }
];

const STORAGE_KEY = 'penguin_dash_save_v1';

class ProgressSystem {
    constructor() {
        this.data = this.load();
    }

    load() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
        return {
            presents: 0,
            unlockedSkins: ['default'],
            selectedSkin: 'default',
            maxLevel: 0 // 0-based index of highest unlocked/completed level
        };
    }

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    }

    completeLevel(index) {
        if (index >= this.data.maxLevel) {
            this.data.maxLevel = index + 1;
            this.save();
        }
    }

    getMaxLevel() {
        return this.data.maxLevel || 0;
    }

    getPresents() {
        return this.data.presents;
    }

    addPresents(amount) {
        this.data.presents += amount;
        this.save();
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('presents-updated', { detail: this.data.presents }));
    }

    spendPresents(amount) {
        if (this.data.presents >= amount) {
            this.data.presents -= amount;
            this.save();
            window.dispatchEvent(new CustomEvent('presents-updated', { detail: this.data.presents }));
            return true;
        }
        return false;
    }

    hasSkin(id) {
        return this.data.unlockedSkins.includes(id);
    }

    buySkin(id) {
        const skin = SKINS.find(s => s.id === id);
        if (!skin) return false;
        if (this.hasSkin(id)) return true; // Already own

        if (this.data.presents >= skin.price) {
            this.data.presents -= skin.price;
            this.data.unlockedSkins.push(id);
            this.save();
            window.dispatchEvent(new CustomEvent('presents-updated', { detail: this.data.presents }));
            return true;
        }
        return false;
    }

    equipSkin(id) {
        if (this.hasSkin(id)) {
            this.data.selectedSkin = id;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedSkin() {
        return SKINS.find(s => s.id === this.data.selectedSkin) || SKINS[0];
    }
}

export const Progress = new ProgressSystem();
