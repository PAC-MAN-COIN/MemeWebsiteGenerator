// js/main.js - Loads navigation and handles its interactions

// Make sure profile-manager.js is loaded BEFORE main.js in your HTML
// <script src="js/profile-manager.js"></script>
// <script src="js/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const navPath = 'nav.html'; // Assuming nav.html is in the root

    if (navbarPlaceholder) {
        fetch(navPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} while fetching ${navPath}`);
                return response.text();
            })
            .then(html => {
                navbarPlaceholder.innerHTML = html;

                // --- Standard Nav Functionality ---
                setActiveNavLink();
                attachNavToggle();

                // --- NEW: Profile Manager Nav Functionality ---
                initProfileManager(); // Initialize profile system from profile-manager.js
                setupProfileDropdown(); // Setup the dropdown UI
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navbarPlaceholder.innerHTML = '<p style="color:red; text-align:center; padding: 10px;">Error loading navigation bar.</p>';
            });
    }

    // Inject SR-only styles
    if (!document.querySelector('style#sr-only-style')) {
        const srOnlyStyle = document.createElement('style');
        srOnlyStyle.id = 'sr-only-style';
        srOnlyStyle.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
        document.head.appendChild(srOnlyStyle);
    }
});

function setActiveNavLink() { /* (Keep existing function as provided previously) */ const navLinks=document.querySelectorAll('#portal-nav-links li a'); if (!navLinks || navLinks.length===0) return; const currentPath=window.location.pathname; const currentPageFile=currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html'; navLinks.forEach(link => { const linkHref=link.getAttribute('href'); if (!linkHref) return; const linkFile=linkHref.split('/').pop(); link.classList.remove('active'); if (linkFile===currentPageFile) { link.classList.add('active'); } else if (currentPageFile==='index.html' && (linkFile==='' || linkFile==='/')) { link.classList.add('active'); } }); }
function attachNavToggle() { /* (Keep existing function as provided previously) */ const toggleBtn=document.getElementById('portal-nav-toggle-btn'); const navMenu=document.getElementById('portal-nav'); if (toggleBtn && navMenu) { toggleBtn.addEventListener('click', (event) => { event.stopPropagation(); navMenu.classList.toggle('portal-nav-open'); const isExpanded=navMenu.classList.contains('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', isExpanded); }); navMenu.querySelectorAll('#portal-nav-links a').forEach(link => { link.addEventListener('click', () => { if (navMenu.classList.contains('portal-nav-open')) { navMenu.classList.remove('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', 'false'); } }); }); document.addEventListener('click', (event) => { const profileDropdown=document.getElementById('profileManagerNav'); let isClickInsideNav=navMenu.contains(event.target); let isClickInsideProfileDropdown=profileDropdown && profileDropdown.contains(event.target); if (navMenu.classList.contains('portal-nav-open') && !isClickInsideNav && !isClickInsideProfileDropdown) { navMenu.classList.remove('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', 'false'); } }); } else { if (!toggleBtn) console.error("Nav toggle button not found."); if (!navMenu) console.error("Nav menu element not found."); } }

// --- NEW: Profile Dropdown Functions ---

function setupProfileDropdown() {
    const dropdownButton = document.getElementById('profileDropdownButton');
    const dropdownContent = document.getElementById('profileDropdownContent');
    const currentProfileDisplay = document.getElementById('currentProfileDisplay');
    const profileListContainer = document.getElementById('profileListContainer');
    const createNewProfileBtn = document.getElementById('createNewProfileBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn'); // Added for future use

    if (!dropdownButton || !dropdownContent || !currentProfileDisplay || !profileListContainer || !createNewProfileBtn || !manageProfilesBtn) {
        console.error("Profile dropdown elements not found!");
        return;
    }

    // --- Populate Dropdown ---
    function populateList() {
        profileListContainer.innerHTML = ''; // Clear existing items
        const profiles = getProfileNames(); // From profile-manager.js
        const currentProfile = getCurrentProfile(); // From profile-manager.js

        // Update current profile display
        currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile";

        if (profiles.length === 0) {
            profileListContainer.innerHTML = '<span class="no-profiles">No profiles yet.</span>';
        } else {
            profiles.forEach(name => {
                if (name !== currentProfile) { // Don't list the current one as switchable
                    const link = document.createElement('a');
                    link.href = "#";
                    link.textContent = `Switch to ${name}`;
                    link.dataset.profileName = name;
                    link.addEventListener('click', handleProfileSwitch);
                    profileListContainer.appendChild(link);
                }
            });
        }
    }

    // --- Event Handlers ---
    function handleProfileSwitch(event) {
        event.preventDefault();
        const profileName = event.target.dataset.profileName;
        if (profileName) {
            setCurrentProfile(profileName); // From profile-manager.js
            populateList(); // Update display
            dropdownContent.classList.remove('show'); // Close dropdown
            dropdownButton.setAttribute('aria-expanded', 'false');
            // Reload page to apply profile changes to the current tool
            // Consider more sophisticated state management later if needed
            window.location.reload();
        }
    }

    createNewProfileBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const newName = prompt("Enter a name for the new profile (e.g., $MyCoin):");
        if (newName && newName.trim()) {
            if (createProfile(newName.trim())) { // From profile-manager.js
                setCurrentProfile(newName.trim()); // Switch to the new profile
                populateList(); // Update dropdown
                dropdownContent.classList.remove('show');
                dropdownButton.setAttribute('aria-expanded', 'false');
                window.location.reload(); // Reload to reflect new profile
            }
            // Error alerts handled within createProfile
        }
    });

    manageProfilesBtn.addEventListener('click', (event) => {
        event.preventDefault();
        // TODO: Implement profile management UI (e.g., modal or separate page)
        // For now, we can list profiles and add delete buttons
        const profiles = getProfileNames();
        if (profiles.length === 0) {
            alert("No profiles to manage.");
            return;
        }

        let message = "Manage Profiles:\n";
        profiles.forEach((name, index) => {
            message += `${index + 1}. ${name}\n`;
        });
        message += "\nEnter the number of the profile to DELETE (or Cancel):";

        const choice = prompt(message);
        if (choice !== null) {
            const indexToDelete = parseInt(choice, 10) - 1;
            if (!isNaN(indexToDelete) && indexToDelete >= 0 && indexToDelete < profiles.length) {
                const nameToDelete = profiles[indexToDelete];
                if (confirm(`Are you sure you want to permanently delete the profile "${nameToDelete}" and all its associated data?`)) {
                    if (deleteProfile(nameToDelete)) { // From profile-manager.js
                         // If current profile was deleted, init will clear it or pick another
                         initProfileManager(); // Re-initialize to potentially clear current profile
                         populateList(); // Refresh dropdown
                         alert(`Profile "${nameToDelete}" deleted.`);
                         // Optionally reload if the deleted profile was active
                         if (getCurrentProfile() === null) {
                            window.location.reload();
                         }
                    } else {
                         alert(`Failed to delete profile "${nameToDelete}".`);
                    }
                }
            } else {
                alert("Invalid selection.");
            }
        }
         dropdownContent.classList.remove('show');
         dropdownButton.setAttribute('aria-expanded', 'false');
    });

    // --- Dropdown Toggle Logic ---
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click listener from closing immediately
        const isExpanded = dropdownContent.classList.toggle('show');
        dropdownButton.setAttribute('aria-expanded', isExpanded);
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        if (!dropdownButton.contains(event.target) && !dropdownContent.contains(event.target)) {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
                dropdownButton.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // --- Initial Populate ---
    populateList();
}