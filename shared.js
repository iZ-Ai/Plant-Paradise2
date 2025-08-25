// Plant Data
const plantTypes = {
    daisy: { name: 'Daisy', icon: '🌼', rarity: 'common', color: 'text-white', bgColor: 'bg-gray-400', growthTime: 10000, harvestReward: 15 },
    grass: { name: 'Grass', icon: '🌱', rarity: 'common', color: 'text-white', bgColor: 'bg-gray-500', growthTime: 8000, harvestReward: 12 },
    clover: { name: 'Clover', icon: '🍀', rarity: 'common', color: 'text-white', bgColor: 'bg-gray-600', growthTime: 12000, harvestReward: 20 },
    sunflower: { name: 'Sunflower', icon: '🌻', rarity: 'uncommon', color: 'text-white', bgColor: 'bg-green-500', growthTime: 20000, harvestReward: 50 },
    rose: { name: 'Rose', icon: '🌹', rarity: 'uncommon', color: 'text-white', bgColor: 'bg-green-600', growthTime: 25000, harvestReward: 65 },
    oak: { name: 'Oak Tree', icon: '🌳', rarity: 'rare', color: 'text-white', bgColor: 'bg-blue-500', growthTime: 45000, harvestReward: 180 },
    lotus: { name: 'Lotus', icon: '🪷', rarity: 'rare', color: 'text-white', bgColor: 'bg-blue-600', growthTime: 50000, harvestReward: 220 },
    phoenix: { name: 'Phoenix Flower', icon: '⚡', rarity: 'legendary', color: 'text-white', bgColor: 'bg-purple-600', growthTime: 90000, harvestReward: 500 },
    celestial: { name: 'Celestial Bloom', icon: '✨', rarity: 'mythical', color: 'text-white', bgColor: 'gradient-bg-2', growthTime: 180000, harvestReward: 1500 }
};

const seedPacks = {
    basic: { name: 'Basic Seed Pack', cost: 10, icon: '📦', color: 'text-gray-600', rarityRates: { common: 85, uncommon: 15, rare: 0, legendary: 0, mythical: 0 } },
    premium: { name: 'Premium Seed Pack', cost: 50, icon: '📦', color: 'text-green-600', rarityRates: { common: 60, uncommon: 25, rare: 10, legendary: 4, mythical: 1 } },
    legendary: { name: 'Legendary Seed Pack', cost: 200, icon: '👑', color: 'text-purple-600', rarityRates: { common: 0, uncommon: 25, rare: 50, legendary: 20, mythical: 5 } }
};

const generatorTypes = {
    sprinkler: { name: 'Garden Sprinkler', icon: '💧', description: 'Automatically waters plants for extra nectar', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    greenhouse: { name: 'Mini Greenhouse', icon: '🏠', description: 'Controlled environment boosts nectar production', color: 'text-green-600', bgColor: 'bg-green-100' },
    beehive: { name: 'Magical Beehive', icon: '🐝', description: 'Bees pollinate plants for premium nectar', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    mysticwell: { name: 'Mystic Well', icon: '🔮', description: 'Ancient magic continuously generates pure nectar', color: 'text-purple-600', bgColor: 'bg-purple-100' }
};

const sunlightShop = {
    golden_daisy: { name: 'Golden Daisy', icon: '⭐', rarity: 'legendary', color: 'text-white', bgColor: 'gradient-bg-1', growthTime: 15000, harvestReward: 150, sunlightCost: 5 },
    rainbow_rose: { name: 'Rainbow Rose', icon: '🌈', rarity: 'mythical', color: 'text-white', bgColor: 'gradient-bg-3', growthTime: 45000, harvestReward: 400, sunlightCost: 15 },
    starfruit_tree: { name: 'Starfruit Tree', icon: '👑', rarity: 'mythical', color: 'text-white', bgColor: 'gradient-bg-4', growthTime: 60000, harvestReward: 800, sunlightCost: 25 }
};

const milestones = [
    { plants: 5, sunlight: 1, description: "First Garden" },
    { plants: 10, sunlight: 2, description: "Growing Collection" },
    { plants: 25, sunlight: 5, description: "Plant Enthusiast" },
    { plants: 50, sunlight: 10, description: "Master Gardener" }
];

// Utility Functions
function formatTime(ms) {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

function getRarityColor(rarity) {
    switch (rarity) {
        case 'common': return 'text-gray-600';
        case 'uncommon': return 'text-green-600';
        case 'rare': return 'text-blue-600';
        case 'legendary': return 'text-purple-600';
        case 'mythical': return 'text-yellow-600';
        default: return 'text-gray-600';
    }
}

function getGrowthProgress(slot) {
    if (!slot || !slot.plantedTime) return 0;
    const now = Date.now();
    const elapsed = now - slot.plantedTime;
    const plant = plantTypes[slot.type] || sunlightShop[slot.type];
    return Math.min((elapsed / plant.growthTime) * 100, 100);
}

function isReadyToHarvest(slot) {
    return slot && getGrowthProgress(slot) >= 100;
}

function getRemainingTime(slot) {
    if (!slot || !slot.plantedTime) return 0;
    const now = Date.now();
    const plant = plantTypes[slot.type] || sunlightShop[slot.type];
    const elapsed = now - slot.plantedTime;
    return Math.max(0, plant.growthTime - elapsed);
}

function rollForPlant(rarityRates) {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (const [rarity, rate] of Object.entries(rarityRates)) {
        cumulative += rate;
        if (random <= cumulative) {
            const plantsOfRarity = Object.entries(plantTypes).filter(([_, plant]) => plant.rarity === rarity);
            if (plantsOfRarity.length > 0) {
                const randomPlant = plantsOfRarity[Math.floor(Math.random() * plantsOfRarity.length)];
                return randomPlant[0];
            }
        }
    }
    
    const commonPlants = Object.entries(plantTypes).filter(([_, plant]) => plant.rarity === 'common');
    return commonPlants[0][0];
}

// Navigation helper
function setActiveNav(activePageName) {
    const navLinks = {
        'farm': document.querySelector('a[href="farm.html"]'),
        'generators': document.querySelector('a[href="generators.html"]'),
        'collection': document.querySelector('a[href="collection.html"]'),
        'shop': document.querySelector('a[href="shop.html"]')
    };
    
    Object.entries(navLinks).forEach(([page, link]) => {
        if (link) {
            link.classList.toggle('active', page === activePageName);
        }
    });
}

// Reward notification system
function showReward(rewardType) {
    const popup = document.createElement('div');
    popup.className = 'reward-popup';
    
    const content = document.createElement('div');
    content.className = 'reward-content text-center text-white';
    
    if (rewardType.startsWith('milestone_')) {
        content.className += ' gradient-bg-1';
        content.innerHTML = `
            <div class="text-2xl font-bold mb-2">MILESTONE!</div>
            <div class="text-4xl mb-2">⭐</div>
            <div class="text-xl font-bold">Sunlight Earned!</div>
        `;
    } else if (rewardType.startsWith('harvested_')) {
        const plantType = rewardType.replace('harvested_', '');
        const plant = plantTypes[plantType] || sunlightShop[plantType];
        content.className += ' bg-yellow-500';
        content.innerHTML = `
            <div class="text-2xl font-bold mb-2">HARVESTED!</div>
            <div class="text-4xl mb-2">${plant.icon}</div>
            <div class="text-xl font-bold">+${plant.harvestReward} Nectar</div>
        `;
    } else {
        const plant = plantTypes[rewardType] || sunlightShop[rewardType];
        content.className += ` ${plant.bgColor}`;
        content.innerHTML = `
            <div class="text-2xl font-bold mb-2">NEW PLANT!</div>
            <div class="text-4xl mb-2">${plant.icon}</div>
            <div class="text-xl font-bold">${plant.name}</div>
            <div class="text-sm opacity-90">${plant.rarity.toUpperCase()}</div>
        `;
    }
    
    popup.appendChild(content);
    document.body.appendChild(popup);
    
    setTimeout(() => {
        document.body.removeChild(popup);
    }, 3000);
}

// Common header update function
function updateHeader() {
    const gameState = GameState.get();
    
    const nectarDisplay = document.getElementById('nectarDisplay');
    const sunlightDisplay = document.getElementById('sunlightDisplay');
    const nectarPerSecDisplay = document.getElementById('nectarPerSecDisplay');
    
    if (nectarDisplay) nectarDisplay.textContent = `${Math.floor(gameState.nectar)} Nectar`;
    if (sunlightDisplay) sunlightDisplay.textContent = `${gameState.sunlight} Sunlight`;
    if (nectarPerSecDisplay) nectarPerSecDisplay.textContent = `+${GameState.getTotalNectarPerSecond()}/sec`;
    
    // Update milestone progress if element exists
    const milestoneDiv = document.getElementById('milestoneProgress');
    if (milestoneDiv) {
        const totalPlants = GameState.getTotalPlantsCollected();
        const nextMilestone = milestones.find(m => totalPlants < m.plants);
        
        if (nextMilestone) {
            milestoneDiv.classList.remove('hidden');
            const milestoneText = document.getElementById('milestoneText');
            const milestoneProgressText = document.getElementById('milestoneProgressText');
            const milestoneBar = document.getElementById('milestoneBar');
            
            if (milestoneText) milestoneText.textContent = `Next Milestone: ${nextMilestone.description}`;
            if (milestoneProgressText) milestoneProgressText.textContent = `${totalPlants}/${nextMilestone.plants} plants (+${nextMilestone.sunlight} sunlight)`;
            if (milestoneBar) milestoneBar.style.width = `${Math.min((totalPlants / nextMilestone.plants) * 100, 100)}%`;
        } else {
            milestoneDiv.classList.add('hidden');
        }
    }
}
