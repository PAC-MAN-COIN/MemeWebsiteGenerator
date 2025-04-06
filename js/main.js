// js/main.js - Loads navigation and handles its interactions

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    // UPDATED PATH: Use relative path to go up one directory from js/
    const navPath = '../nav.html';

    if (navbarPlaceholder) {
        fetch(navPath) // Fetch the navigation HTML file using the corrected path
            .then(response => {
                if (!response.ok) {
                    // Throw an error with more specific info for debugging
                    throw new Error(`HTTP error! status: ${response.status} while fetching ${navPath}`);
                }
                return response.text(); // Get the HTML as text
            })
            .then(html => {
                navbarPlaceholder.innerHTML = html; // Insert the HTML into the placeholder

                // --- Now that the nav HTML is loaded, attach functionality ---

                // 1. Set Active Link based on current page
                setActiveNavLink();

                // 2. Attach Mobile Toggle Listener
                attachNavToggle();
            })
            .catch(error => {
                // Log the error to the console for easier debugging
                console.error('Error loading navigation:', error);
                // Display a user-friendly error message in the placeholder
                navbarPlaceholder.innerHTML = '<p style="color:red; text-align:center; padding: 10px;">Error loading navigation bar.</p>';
            });
    }

     // Inject SR-only styles if needed (useful for accessibility labels)
     if (!document.querySelector('style#sr-only-style')) {
        const srOnlyStyle = document.createElement('style');
        srOnlyStyle.id = 'sr-only-style';
        srOnlyStyle.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
        document.head.appendChild(srOnlyStyle);
     }
});

function setActiveNavLink() {
    // Find all navigation links within the loaded navigation bar
    const navLinks = document.querySelectorAll('#portal-nav-links li a');
    if (!navLinks || navLinks.length === 0) return; // Exit if no links found

    // Get the current page's filename (e.g., "index.html", "builder.html")
    // Handles cases where URL might end with / or have parameters/hash
    const currentPath = window.location.pathname;
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html'; // Default to index.html if path is just '/'

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return; // Skip links without href

        // Get the filename from the link's href
        const linkFile = linkHref.split('/').pop();

        // Remove active class initially from all links
        link.classList.remove('active');

        // Add active class if the link's filename matches the current page's filename
        if (linkFile === currentPageFile) {
            link.classList.add('active');
        }
        // Special case: If the current page IS index.html, ensure no other link is active
        // (This handles the case where index.html might also be linked as just '/')
        else if (currentPageFile === 'index.html' && (linkFile === '' || linkFile === '/')) {
             link.classList.add('active'); // Or remove if you don't want index active
        }

    });
}


function attachNavToggle() {
    // Select elements within the loaded navigation structure
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav'); // The main <nav> element

    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling if needed
            navMenu.classList.toggle('portal-nav-open');
            const isExpanded = navMenu.classList.contains('portal-nav-open');
            toggleBtn.setAttribute('aria-expanded', isExpanded);
        });

        // Optional: Close mobile nav when a link is clicked
        navMenu.querySelectorAll('#portal-nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('portal-nav-open')) {
                    navMenu.classList.remove('portal-nav-open');
                    toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });

        // Optional: Close mobile nav if clicking outside of it
        document.addEventListener('click', (event) => {
             if (navMenu.classList.contains('portal-nav-open') && !navMenu.contains(event.target)) {
                  navMenu.classList.remove('portal-nav-open');
                  toggleBtn.setAttribute('aria-expanded', 'false');
             }
        });

    } else {
        // Log error if elements aren't found after fetch (helps debugging)
        if (!toggleBtn) console.error("Nav toggle button not found after loading nav.");
        if (!navMenu) console.error("Nav menu element not found after loading nav.");
    }
}