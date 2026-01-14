
import { setView } from '../modules/router.js';

// Wizard State
export const wizardState = {
    step: 1,
    data: {
        household: '1-2',
        diet: [],
        avoid: []
    }
};

export function setWizardStep(n) {
    wizardState.step = n;
    setView('wizard');
}

export function updateWizardData(key, value) {
    if (key === 'diet' || key === 'avoid') {
        // Toggle array
        const idx = wizardState.data[key].indexOf(value);
        if (idx > -1) wizardState.data[key].splice(idx, 1);
        else wizardState.data[key].push(value);
    } else {
        wizardState.data[key] = value;
    }
    setView('wizard');
}

export function completeWizard() {
    // Save preferences
    localStorage.setItem('harvest_preferences', JSON.stringify(wizardState.data));
    if (window.showToast) window.showToast('Preferences saved! Building your box...');
    // Logic to generate custom box would go here
    setTimeout(() => setView('boxes'), 1000);
}

export function renderWizard() {
    const { step, data } = wizardState;

    // Progress Bar
    const progress = (step / 3) * 100;

    let content = '';

    if (step === 1) {
        content = `
      <h2 class="text-3xl font-serif font-bold text-loam text-center mb-8">Who are we feeding?</h2>
      <div class="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        <button onclick="updateWizardData('household', '1-2')" 
          class="p-8 border-2 rounded-xl transition-all ${data.household === '1-2' ? 'border-kale bg-kale/5' : 'border-stone-200 hover:border-kale/50'}">
          <div class="text-4xl mb-4">👥</div>
          <div class="font-serif font-bold text-lg text-loam">1-2 People</div>
        </button>
        <button onclick="updateWizardData('household', '3-4')" 
          class="p-8 border-2 rounded-xl transition-all ${data.household === '3-4' ? 'border-kale bg-kale/5' : 'border-stone-200 hover:border-kale/50'}">
          <div class="text-4xl mb-4">👨‍👩‍👧‍👦</div>
          <div class="font-serif font-bold text-lg text-loam">3-4 People</div>
        </button>
      </div>
      <div class="mt-12 text-center">
        <button onclick="setWizardStep(2)" class="bg-root text-paper px-10 py-4 rounded-full text-lg font-serif font-medium hover:bg-loam transition shadow-sm">Next Step →</button>
      </div>
    `;
    } else if (step === 2) {
        const diets = ['Organic Focus', 'Vegetarian', 'Paleo', 'Gluten Free'];
        content = `
      <h2 class="text-3xl font-serif font-bold text-loam text-center mb-8">Any dietary preferences?</h2>
      <div class="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
        ${diets.map(d => `
          <button onclick="updateWizardData('diet', '${d}')" 
            class="px-6 py-3 rounded-full border-2 text-lg font-medium font-serif transition-all
            ${data.diet.includes(d) ? 'bg-kale border-kale text-paper' : 'border-stone-200 text-charcoal/70 hover:border-kale/50'}">
            ${d}
          </button>
        `).join('')}
      </div>
      <div class="mt-12 text-center space-x-6">
        <button onclick="setWizardStep(1)" class="text-stone-400 font-medium hover:text-charcoal transition-colors">Back</button>
        <button onclick="setWizardStep(3)" class="bg-root text-paper px-10 py-4 rounded-full text-lg font-serif font-medium hover:bg-loam transition shadow-sm">Next Step →</button>
      </div>
    `;
    } else if (step === 3) {
        const avoids = ['Cilantro', 'Mushrooms', 'Peanuts', 'Dairy'];
        content = `
      <h2 class="text-3xl font-serif font-bold text-loam text-center mb-4">Is there anything you avoid?</h2>
      <p class="text-center text-stone-500 mb-8 font-sans">We'll do our best to swap these out.</p>
      <div class="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
        ${avoids.map(a => `
          <button onclick="updateWizardData('avoid', '${a}')" 
            class="px-6 py-3 rounded-full border-2 text-lg font-medium font-serif transition-all
            ${data.avoid.includes(a) ? 'bg-root/10 border-root text-root' : 'border-stone-200 text-charcoal/70 hover:border-root/50'}">
            🚫 ${a}
          </button>
        `).join('')}
      </div>
      <div class="mt-12 text-center space-x-6">
        <button onclick="setWizardStep(2)" class="text-stone-400 font-medium hover:text-charcoal transition-colors">Back</button>
        <button onclick="completeWizard()" class="bg-kale text-paper px-10 py-4 rounded-full text-lg font-serif font-medium hover:bg-loam transition shadow-lg transform hover:scale-105">Build My Box 🎉</button>
      </div>
    `;
    }

    return `
    <div class="min-h-screen bg-paper pt-20 pb-20">
        <div class="max-w-4xl mx-auto px-6">
          <!-- Progress -->
          <div class="w-full bg-stone h-2 rounded-full mb-12 overflow-hidden">
            <div class="bg-kale h-2 transition-all duration-500" style="width: ${progress}%"></div>
          </div>

          <!-- Content -->
          <div class="bg-white p-10 rounded-2xl shadow-sm border border-clay min-h-[400px] flex flex-col justify-center">
            ${content}
          </div>
        </div>
    </div>
      `;
}
