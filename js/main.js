// js/main.js - Loads navigation and handles its interactions

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const navPath = '_nav.html'; // Adjust path if _nav.html is not in the same directory

    if (navbarPlaceholder) {
        fetch(navPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} loading ${navPath}`);
                }
                return response.text();
            })
            .then(html => {
                navbarPlaceholder.innerHTML = html;
                setActiveNavLink();
                attachNavToggle();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navbarPlaceholder.innerHTML = '<p style="color:red; text-align:center;">Failed to load navigation.</p>';
            });
    }

     // Inject SR-only styles if needed elsewhere (like builder page)
     if (!document.querySelector('style#sr-only-style')) {
        const srOnlyStyle = document.createElement('style');
        srOnlyStyle.id = 'sr-only-style';
        srOnlyStyle.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
        document.head.appendChild(srOnlyStyle);
     }
});

function setActiveNavLink() {
    const navLinks = document.querySelectorAll('#portal-nav-links li a');
    // More robust way to get the filename, handles potential trailing slash
    const pathSegments = window.location.pathname.split('/');
    const currentPageFile = pathSegments[pathSegments.length - 1] || 'index.html'; // Default to index.html if path ends in /

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return; // Skip if no href

        const linkFile = linkHref.split('/').pop();

        // Check if the link file matches the current page file
        if (linkFile === currentPageFile) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}


function attachNavToggle() {
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav');

    if (toggleBtn && navMenu) {
        toggleBtn.addEventListener('click', () => {
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
    }
}