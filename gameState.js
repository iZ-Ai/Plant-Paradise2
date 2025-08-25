// Game State Management
const GameState = {
    // Default state
    defaultState: {
        nectar: 50,
        sunlight: 0,
        plantCollection: {},
        activeSlots: {},
        openingPack: null,
        lastReward: null,
        lastMilestoneReached: 0,
        generators: {
            sprinkler: { level: 0, cost: 100, baseNectar: 2 },
            greenhouse: { level: 0, cost: 500, baseNectar: 8 },
            beehive: { level: 0, cost: 2000, baseNectar: 25 },
            mysticwell: { level: 0, cost: 10000, baseNectar: 75 }
        }
    },

    // Get current state from localStorage or return default
    get() {
        const saved = localStorage.getItem('plantParadiseGame');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure all required properties exist
                return { ...this.defaultState, ...parsed };
            } catch (e) {
                console.warn('Could not parse saved game state, using default');
                return { ...this.defaultState };
            }
        }
        return { ...this.defaultState };
    },

    // Save current state to localStorage
    save(state) {
        try {
            localStorage.setItem('plantParadiseGame', JSON.stringify(state));
        } catch (e) {
            console.warn('Could not save game state');
        }
    },

    // Update specific properties and save
    update(updates) {
        const currentState = this.get();
        const newState = { ...currentState, ...updates };
        this.save(newState);
        return newState;
    },

    // Helper methods
    getTotalPlantsCollected() {
        const state = this.get();
        return Object.values(state.plantCollection).reduce((sum, count) => sum + count, 0);
    },

    getTotalNectarPerSecond() {
        const state = this.get();
        let total = 0;
        
        // Nectar from active plant slots
        Object.keys(state.activeSlots).forEach(slotId => {
            const slot = state.activeSlots[slotId];
            if (slot && (plantTypes[slot.type] || sunlightShop[slot.type])) {
                const plant = plantTypes[slot.type] || sunlightShop[slot.type];
                total += Math.floor(plant.harvestReward * 0.1 / 60);
            }
        });
        
        // Nectar from generators
        Object.entries(state.generators).forEach(([genType, gen]) => {
            if (gen.level > 0) {
                total += gen.baseNectar * gen.level;
            }
        });
        
        return total;
    },

    checkMilestones(totalPlants) {
        const state = this.get();
        const unlockedMilestones = milestones.filter(m => totalPlants >= m.plants);
        const highestUnlocked = unlockedMilestones[unlockedMilestones.length - 1];
        
        if (highestUnlocked && highestUnlocked.plants > state.lastMilestoneReached) {
            const newSunlight = unlockedMilestones
                .filter(m => m.plants > state.lastMilestoneReached)
                .reduce((sum, m) => sum + m.sunlight, 0);
            
            const newState = this.update({
                sunlight: state.sunlight + newSunlight,
                lastMilestoneReached: highestUnlocked.plants
            });
            
            showReward(`milestone_${highestUnlocked.plants}`);
            return newState;
        }
        return state;
    },

    // Game Actions
    openSeedPack(packType) {
        const pack = seedPacks[packType];
        const state = this.get();
        
        if (state.nectar < pack.cost || state.openingPack) return false;

        this.update({
            nectar: state.nectar - pack.cost,
            openingPack: packType
        });

        setTimeout(() => {
            const newPlant = rollForPlant(pack.rarityRates);
            const emptySlots = Array.from({length: 12}, (_, i) => i + 1).filter(id => !state.activeSlots[id]);
            
            const updates = {
                openingPack: null,
                plantCollection: {
                    ...state.plantCollection,
                    [newPlant]: (state.plantCollection[newPlant] || 0) + 1
                }
            };

            if (emptySlots.length > 0) {
                const slotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
                updates.activeSlots = {
                    ...state.activeSlots,
                    [slotId]: { type: newPlant, plantedTime: Date.now() }
                };
            }

            this.update(updates);
            const totalPlants = this.getTotalPlantsCollected();
            setTimeout(() => this.checkMilestones(totalPlants), 100);

            showReward(newPlant);
            updateHeader();
        }, 1500);

        return true;
    },

    buySunlightPlant(plantKey) {
        const plant = sunlightShop[plantKey];
        const state = this.get();
        
        if (state.sunlight < plant.sunlightCost) return false;

        const emptySlots = Array.from({length: 12}, (_, i) => i + 1).filter(id => !state.activeSlots[id]);
        if (emptySlots.length === 0) return false;

        const slotId = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        
        this.update({
            sunlight: state.sunlight - plant.sunlightCost,
            activeSlots: {
                ...state.activeSlots,
                [slotId]: { type: plantKey, plantedTime: Date.now() }
            },
            plantCollection: {
                ...state.plantCollection,
                [plantKey]: (state.plantCollection[plantKey] || 0) + 1
            }
        });

        const totalPlants = this.getTotalPlantsCollected();
        setTimeout(() => this.checkMilestones(totalPlants), 100);

        showReward(plantKey);
        return true;
    },

    buyGenerator(genType) {
        const state = this.get();
        const gen = state.generators[genType];
        const currentCost = Math.floor(gen.cost * Math.pow(1.15, gen.level));
        
        if (state.nectar < currentCost) return false;
        
        this.update({
            nectar: state.nectar - currentCost,
            generators: {
                ...state.generators,
                [genType]: {
                    ...gen,
                    level: gen.level + 1
                }
            }
        });

        return true;
    },

    harvestPlant(slotId) {
        const state = this.get();
        const slot = state.activeSlots[slotId];
        
        if (!slot || !isReadyToHarvest(slot)) return false;

        const plant = plantTypes[slot.type] || sunlightShop[slot.type];
        
        const newActiveSlots = { ...state.activeSlots };
        delete newActiveSlots[slotId];
        
        this.update({
            nectar: state.nectar + plant.harvestReward,
            activeSlots: newActiveSlots
        });

        showReward(`harvested_${slot.type}`);
        return true;
    },

    harvestAll() {
        const state = this.get();
        let harvested = 0;
        
        Object.entries(state.activeSlots).forEach(([slotId, slot]) => {
            if (isReadyToHarvest(slot)) {
                if (this.harvestPlant(slotId)) {
                    harvested++;
                }
            }
        });
        
        return harvested;
    },

    // Auto-save and nectar generation
    startAutoSave() {
        setInterval(() => {
            const nectarGain = this.getTotalNectarPerSecond();
            if (nectarGain > 0) {
                const state = this.get();
                this.update({ nectar: state.nectar + nectarGain });
                updateHeader();
            }
        }, 1000);
    },

    // Reset game (for testing or new game)
    reset() {
        localStorage.removeItem('plantParadiseGame');
        return this.get();
    }
};
