const fs = require('fs');

const helpers = `
        const AUTH_USER_KEY = 'identify_auth_user';
        let currentUser = null;

        window.loadAuthUser = function() {
            try {
                const raw = localStorage.getItem(AUTH_USER_KEY);
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return null;
        }

        // We also need loadAuthUser to be available locally in the module scope
        function loadAuthUser() {
            return window.loadAuthUser();
        }

        window.saveAuthUser = function(user) {
            currentUser = user || null;
            if (user) {
                localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
                localStorage.setItem('last_active_time', Date.now());
            } else {
                localStorage.removeItem(AUTH_USER_KEY);
                localStorage.removeItem('last_active_time');
            }
        }

        function saveAuthUser(user) {
            window.saveAuthUser(user);
        }

        window.logoutUser = function() {
            saveAuthUser(null);
            if(window.auth) {
                import("https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js").then(module => {
                    module.getAuth().signOut();
                }).catch(e=>{});
            }
            window.location.replace('index.html');
        }
`;

function injectHelpers(filename) {
    if (!fs.existsSync(filename)) return;
    let html = fs.readFileSync(filename, 'utf8');
    
    // Inject right after: import { firebaseConfig } from "./firebase-env.js";
    const target = 'import { firebaseConfig } from "./firebase-env.js";';
    if (html.includes(target)) {
        if (!html.includes('AUTH_USER_KEY')) {
            html = html.replace(target, target + '\n' + helpers);
            fs.writeFileSync(filename, html);
            console.log("Injected helpers into " + filename);
        } else {
            console.log("Helpers already exist in " + filename);
        }
    } else {
        console.log("Could not find target in " + filename);
    }
}

injectHelpers('Admin_Panel.html');
injectHelpers('School_Panel.html');
