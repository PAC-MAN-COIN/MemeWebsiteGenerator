// js/main.js - Loads navigation and handles its interactions

// Assumes profile-manager.js is loaded first in the HTML:
// <script src="js/profile-manager.js"></script>
// <script src="js/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    // Correct path assuming nav.html is in the root, and main.js is in js/
    const navPath = '../nav.html';

    if (navbarPlaceholder) {
        fetch(navPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} while fetching ${navPath}`);
                return response.text();
            })
            .then(html => {
                navbarPlaceholder.innerHTML = html;

                // --- Initialize and Setup ---
                initProfileManager();   // Initialize profile system (from profile-manager.js)
                setActiveNavLink();     // Highlight correct nav link
                attachNavToggle();      // Make mobile hamburger work
                setupProfileDropdown(); // Setup the profile dropdown UI & functionality
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navbarPlaceholder.innerHTML = '<p style="color:red; text-align:center; padding: 10px;">Error loading navigation bar.</p>';
            });
    }

    // Inject SR-only styles if not already present
    if (!document.querySelector('style#sr-only-style')) {
        const srOnlyStyle = document.createElement('style');
        srOnlyStyle.id = 'sr-only-style';
        srOnlyStyle.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
        document.head.appendChild(srOnlyStyle);
    }
});

// --- Core Navigation Functions ---

function setActiveNavLink() {
    const navLinks = document.querySelectorAll('#portal-nav-links li a');
    if (!navLinks || navLinks.length === 0) return;
    const currentPath = window.location.pathname;
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        const linkFile = linkHref.split('/').pop();
        link.classList.remove('active');
        // Make comparison more robust for root/index
        if (linkFile === currentPageFile || (currentPageFile === 'index.html' && linkFile === '')) {
             // Special check for index.html possibly being '/'
            if(currentPageFile === 'index.html' && linkFile === 'index.html') {
                 link.classList.add('active');
            } else if (currentPageFile !== 'index.html' && linkFile === currentPageFile){
                 link.classList.add('active');
            }
             // If you want home active when on index, add this:
             // else if (currentPageFile === 'index.html' && linkHref === 'index.html') {
             //      link.classList.add('active');
             // }
        }
    });
}

function attachNavToggle() {
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav');
    if (!toggleBtn || !navMenu) {
        if (!toggleBtn) console.error("Nav toggle button not found after loading nav.");
        if (!navMenu) console.error("Nav menu element not found after loading nav.");
        return;
    }

    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        navMenu.classList.toggle('portal-nav-open');
        const isExpanded = navMenu.classList.contains('portal-nav-open');
        toggleBtn.setAttribute('aria-expanded', isExpanded);
    });

    // Close mobile nav when a link is clicked
    navMenu.querySelectorAll('#portal-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('portal-nav-open')) {
                navMenu.classList.remove('portal-nav-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Close mobile nav if clicking outside (including profile dropdown)
    document.addEventListener('click', (event) => {
        const profileDropdownNav = document.getElementById('profileManagerNav'); // The dropdown container in the nav
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickInsideProfile = profileDropdownNav && profileDropdownNav.contains(event.target);

        if (navMenu.classList.contains('portal-nav-open') && !isClickInsideNav && !isClickInsideProfile) {
            navMenu.classList.remove('portal-nav-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });
}


// --- Profile Dropdown & Modal Functions ---

function setupProfileDropdown() {
    const dropdownButton = document.getElementById('profileDropdownButton');
    const dropdownContent = document.getElementById('profileDropdownContent');
    const currentProfileDisplay = document.getElementById('currentProfileDisplay');
    const profileListContainer = document.getElementById('profileListContainer'); // In dropdown
    const createNewProfileBtn = document.getElementById('createNewProfileBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');

    if (!dropdownButton || !dropdownContent || !currentProfileDisplay || !profileListContainer || !createNewProfileBtn || !manageProfilesBtn) {
        console.error("Profile dropdown elements not found! Cannot initialize profile UI.");
        // Optionally disable the feature or show an error
        const profileManagerNav = document.getElementById('profileManagerNav');
        if(profileManagerNav) profileManagerNav.style.display = 'none'; // Hide the feature
        return;
    }

    // Populate Dropdown List (used internally and by modal)
    function populateNavDropdownList() {
        profileListContainer.innerHTML = '';
        const profiles = getProfileNames(); // Assumes from profile-manager.js
        const currentProfile = getCurrentProfile(); // Assumes from profile-manager.js

        currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile";
        currentProfileDisplay.title = currentProfile ? `Current Profile: ${currentProfile}` : "No profile selected"; // Tooltip

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
             if (profiles.length === 1 && currentProfile) {
                 profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Only one profile exists.</span>'; // Show message if only current exists
             } else if (profiles.length > 0 && !profiles.some(name => name !== currentProfile)) {
                  profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Only current profile exists.</span>'; // Edge case safety
             }
        }
    }

    // Event Handler: Switch Profile
    function handleProfileSwitch(event) {
        event.preventDefault();
        const profileName = event.target.dataset.profileName;
        if (profileName && profileName !== getCurrentProfile()) {
            setCurrentProfile(profileName); // From profile-manager.js
            populateNavDropdownList(); // Update display in nav
            dropdownContent.classList.remove('show');
            dropdownButton.setAttribute('aria-expanded', 'false');
            alert(`Switched to profile: ${profileName}. Reloading page.`); // Inform user
            window.location.reload(); // Reload page to apply profile
        }
    }

    // Event Handler: Create New Profile
    createNewProfileBtn.addEventListener('click', (event) => {
        event.preventDefault();
        const newName = prompt("Enter a name for the new profile (e.g., $MyCoin):");
        if (newName && newName.trim()) {
            const profileNameToCreate = newName.trim();
            if (createProfile(profileNameToCreate)) { // From profile-manager.js
                setCurrentProfile(profileNameToCreate); // Switch to the new profile
                populateNavDropdownList(); // Update dropdown
                alert(`Profile "${profileNameToCreate}" created and activated. Reloading page.`);
                window.location.reload(); // Reload to reflect new profile
            }
            // Error alerts handled within createProfile
        }
        dropdownContent.classList.remove('show');
        dropdownButton.setAttribute('aria-expanded', 'false');
    });

    // Event Handler: Manage Profiles Button (Opens Modal)
    manageProfilesBtn.addEventListener('click', (event) => {
        event.preventDefault();
        openManageProfilesModal();
        dropdownContent.classList.remove('show');
        dropdownButton.setAttribute('aria-expanded', 'false');
    });

    // Dropdown Toggle Logic
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation();
        // Populate list fresh each time dropdown is opened
        populateNavDropdownList();
        const isExpanded = dropdownContent.classList.toggle('show');
        dropdownButton.setAttribute('aria-expanded', isExpanded);
    });

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
        const profileManagerNav = document.getElementById('profileManagerNav');
        if (profileManagerNav && !profileManagerNav.contains(event.target)) {
            if (dropdownContent.classList.contains('show')) {
                dropdownContent.classList.remove('show');
                dropdownButton.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Initial Populate on page load
    populateNavDropdownList();
}


// --- Modal Functions ---

function openManageProfilesModal() {
    closeManageProfilesModal(); // Ensure no duplicates

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'manageProfilesModalOverlay';
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeManageProfilesModal(); });

    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';

    const title = document.createElement('h2'); title.textContent = 'Manage Profiles'; modalBox.appendChild(title);
    const closeBtn = document.createElement('button'); closeBtn.className = 'modal-close-btn'; closeBtn.innerHTML = '&times;'; closeBtn.title = 'Close'; closeBtn.onclick = closeManageProfilesModal; modalBox.appendChild(closeBtn);
    const listContainer = document.createElement('ul'); listContainer.className = 'modal-profile-list'; listContainer.id = 'modalProfileList'; modalBox.appendChild(listContainer);

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    populateModalProfileList(listContainer);

    setTimeout(() => overlay.classList.add('show'), 10); // Trigger transition
}

function closeManageProfilesModal() {
    const overlay = document.getElementById('manageProfilesModalOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    }
}

function populateModalProfileList(listElement) {
    listElement.innerHTML = '';
    const profiles = getProfileNames(); // From profile-manager.js

    if (profiles.length === 0) {
        listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>';
        return;
    }

    profiles.forEach(name => {
        const item = document.createElement('li'); item.className = 'modal-profile-item';
        const nameSpan = document.createElement('span'); nameSpan.textContent = name; item.appendChild(nameSpan);
        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'modal-delete-btn'; deleteBtn.dataset.profileName = name;
        deleteBtn.addEventListener('click', handleDeleteProfile); // Add listener
        item.appendChild(deleteBtn);
        listElement.appendChild(item);
    });
}

function handleDeleteProfile(event) {
    const profileNameToDelete = event.target.dataset.profileName;
    if (!profileNameToDelete) return;

    // More specific confirmation
    const currentActiveProfile = getCurrentProfile();
    let confirmMessage = `Delete profile "${profileNameToDelete}" permanently? All associated data (website settings, etc.) will be lost.`;
    if (profileNameToDelete === currentActiveProfile) {
        confirmMessage += "\n\nThis is your currently active profile!";
    }

    if (confirm(confirmMessage)) {
        if (deleteProfile(profileNameToDelete)) { // From profile-manager.js
             console.log(`Profile "${profileNameToDelete}" deleted via modal.`);

             // Refresh the list within the currently open modal
             const modalList = document.getElementById('modalProfileList');
             if (modalList) {
                 populateModalProfileList(modalList);
             }

              // Refresh the main navigation dropdown list as well (since populateList doesn't run automatically)
              setupProfileDropdown(); // Re-run setup to refresh nav list and current profile display

             alert(`Profile "${profileNameToDelete}" deleted.`);

             // If the deleted profile was the active one, the page might need context change
             if (profileNameToDelete === currentActiveProfile) {
                 // initProfileManager() should have cleared or set a new default
                 // Reloading might be the simplest way to ensure tools update state
                 alert("Active profile deleted. Reloading...");
                 window.location.reload();
             }

        } else {
             alert(`Failed to delete profile "${profileNameToDelete}".`);
        }
    }
}