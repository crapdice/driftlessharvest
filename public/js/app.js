import { store } from './store/index.js';
import * as Actions from './modules/actions.js';
import * as Views from './views/index.js';
import * as Layout from './views/layout.js';
import * as Router from './modules/router.js';
import { AB } from './modules/ab_test.js';
import { formatPhoneNumber, showToast } from './utils.js';

// Bind Globals for HTML Event Handlers
window.harvestStore = store;
window.AB = AB;
window.formatPhoneNumber = formatPhoneNumber;
window.showToast = showToast;

// Bind Actions
Object.keys(Actions).forEach(key => {
    window[key] = Actions[key];
});

// Bind Views (Legacy support if needed, but mostly for router)
Object.keys(Views).forEach(key => {
    window[key] = Views[key];
});

// Bind Layout
window.renderHeader = Layout.renderHeader;
window.renderFooter = Layout.renderFooter;
window.renderHeaderCount = Layout.renderHeaderCount;

// Bind Router Utils
window.setView = Router.setView;
window.navigateToSection = Router.navigateToSection;

// Initialize Router Dependencies (Break Circular Dependency)
Router.initRouter(Views, Layout);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    Actions.initApp();

    // Link Interception
    document.body.addEventListener('click', e => {
        if (e.target.matches('[href]')) {
            e.preventDefault();
            Router.navigateTo(e.target.getAttribute('href'));
        }
    });

    // Back Button
    window.onpopstate = () => Router.router();
});
