// js/main.js - Loads navigation and handles its interactions

// Assumes profile-manager.js is loaded first in the HTML:
// <script src="js/profile-manager.js"></script>
// <script src="js/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    // Correct path assuming nav.html is in the root, and main.js is in js/
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

                // --- Initialize and Setup ---
                initProfileManager();   // Initialize profile system (from profile-manager.js)
                setActiveNavLink();     // Highlight correct nav link
                attachNavToggle();      // Make mobile hamburger work
                setupProfileDropdown(); // Setup the profile dropdown UI & functionality
            })
            .catch(error => {
                // Log the error to the console for easier debugging
                console.error('Error loading navigation:', error);
                // Display a user-friendly error message in the placeholder
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
    // More robust filename extraction
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html';

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        const linkFile = linkHref.split('/').pop().split('?')[0].split('#')[0];
        link.classList.remove('active');
        // Match specific file or index case
        if ((linkFile === currentPageFile) || (currentPageFile === 'index.html' && (linkFile === '' || linkHref === 'index.html'))) {
             link.classList.add('active');
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
        const profileDropdownNav = document.getElementById('profileManagerNav');
        const isClickInsideNav = navMenu.contains(event.target);
        // Check if click is inside the main nav container OR the profile dropdown
        const isClickInsideRelevantArea = isClickInsideNav || (profileDropdownNav && profileDropdownNav.contains(event.target));

        if (navMenu.classList.contains('portal-nav-open') && !isClickInsideRelevantArea) {
            navMenu.classList.remove('portal-nav-open');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });
}


// --- Profile Dropdown Setup ---
function setupProfileDropdown() {
    const dropdownButton = document.getElementById('profileDropdownButton');
    const dropdownContent = document.getElementById('profileDropdownContent');
    const currentProfileDisplay = document.getElementById('currentProfileDisplay');
    const profileListContainer = document.getElementById('profileListContainer'); // In dropdown
    const createNewProfileBtn = document.getElementById('createNewProfileBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');

    if (!dropdownButton || !dropdownContent || !currentProfileDisplay || !profileListContainer || !createNewProfileBtn || !manageProfilesBtn) {
        console.error("Profile dropdown elements not found! Cannot initialize profile UI.");
        const profileManagerNav = document.getElementById('profileManagerNav');
        if(profileManagerNav) profileManagerNav.style.display = 'none';
        return;
    }

    // Populate Dropdown List
    function populateNavDropdownList() {
        profileListContainer.innerHTML = '';
        const profiles = getProfileNames();
        const currentProfile = getCurrentProfile();
        currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile";
        currentProfileDisplay.title = currentProfile ? `Current Profile: ${currentProfile}` : "No profile selected";

        if (profiles.length === 0) {
            profileListContainer.innerHTML = '<span class="no-profiles">No profiles yet.</span>';
        } else {
            let hasOtherProfiles = false;
            profiles.forEach(name => {
                if (name !== currentProfile) {
                    hasOtherProfiles = true;
                    const link = document.createElement('a'); link.href = "#"; link.textContent = `Switch to ${name}`; link.dataset.profileName = name;
                    link.addEventListener('click', handleProfileSwitch);
                    profileListContainer.appendChild(link);
                }
            });
            if (!hasOtherProfiles && currentProfile) {
                 profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Only current profile exists.</span>';
            } else if (profiles.length > 0 && !currentProfile){
                profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Select a profile</span>'; // Prompt selection if none active
            }
        }
    }

    // Event Handler: Switch Profile
    function handleProfileSwitch(event) {
        event.preventDefault();
        const profileName = event.target.dataset.profileName;
        if (profileName && profileName !== getCurrentProfile()) {
            setCurrentProfile(profileName);
            populateNavDropdownList();
            dropdownContent.classList.remove('show');
            dropdownButton.setAttribute('aria-expanded', 'false');
            alert(`Switched to profile: ${profileName}. Reloading page.`);
            window.location.reload();
        }
    }

    // Event Handler: Create New Profile Button (Opens Modal)
    createNewProfileBtn.addEventListener('click', (event) => {
        event.preventDefault();
        openCreateProfileModal(); // Open the modal instead of prompt
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
        populateNavDropdownList(); // Refresh list on open
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


// --- Modal Creation & Handling Functions ---

// Generic function to create the modal structure
function createModal(id, titleHtml, contentHtml, buttonsHtml) {
    closeAllModals(); // Close any other open modals first

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    // Close on overlay click
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeAllModals(); });

    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    // Prevent clicks inside the box from closing the modal
    modalBox.addEventListener('click', event => event.stopPropagation());

    const title = document.createElement('h2'); title.innerHTML = titleHtml; modalBox.appendChild(title);
    const closeBtn = document.createElement('button'); closeBtn.className = 'modal-close-btn'; closeBtn.innerHTML = '&times;'; closeBtn.title = 'Close'; closeBtn.onclick = closeAllModals; modalBox.appendChild(closeBtn);
    const contentDiv = document.createElement('div'); contentDiv.className = 'modal-content'; contentDiv.innerHTML = contentHtml; modalBox.appendChild(contentDiv);
    if(buttonsHtml){ // Only add buttons div if HTML is provided
        const buttonsDiv = document.createElement('div'); buttonsDiv.className = 'modal-buttons'; buttonsDiv.innerHTML = buttonsHtml; modalBox.appendChild(buttonsDiv);
    }


    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    // Show with transition
    setTimeout(() => overlay.classList.add('show'), 10);
    return { overlay, modalBox, contentDiv, buttonsDiv: modalBox.querySelector('.modal-buttons') }; // Return reference to buttonsDiv if created
}

// Function to close any open modal
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('show');
        modal.addEventListener('transitionend', () => modal.remove(), { once: true });
    });
}

// --- Create Profile Modal ---
function openCreateProfileModal() {
    const modalContent = `
        <div class="control-group">
            <label for="newProfileNameInput">New Profile Name:</label>
            <input type="text" id="newProfileNameInput" placeholder="e.g., $MyAwesomeCoin" required>
            <p id="createProfileError" class="modal-error-message" style="display:none;"></p>
        </div>
    `;
    const modalButtons = `
        <button type="button" class="modal-button-cancel" id="createCancelBtn">Cancel</button>
        <button type="button" class="modal-button-confirm" id="createSaveBtn">Create & Switch</button>
    `;
    const { contentDiv, buttonsDiv } = createModal('createProfileModalOverlay', 'Create New Profile', modalContent, modalButtons);

    const inputField = contentDiv.querySelector('#newProfileNameInput');
    const errorMsg = contentDiv.querySelector('#createProfileError');
    const saveBtn = buttonsDiv.querySelector('#createSaveBtn');
    const cancelBtn = buttonsDiv.querySelector('#createCancelBtn');

    inputField.focus();

    saveBtn.onclick = () => {
        errorMsg.textContent = ''; // Clear previous error
        errorMsg.style.display = 'none';
        const newName = inputField.value.trim();
        if (!newName) {
             errorMsg.textContent = 'Profile name cannot be empty.';
             errorMsg.style.display = 'block';
             return;
        }
        // Use profile-manager function (assuming it returns true/false and handles alerts for duplicates)
        if (createProfile(newName)) {
            setCurrentProfile(newName);
            alert(`Profile "${newName}" created and activated. Reloading page.`);
            closeAllModals();
            window.location.reload();
        } else {
             // Alert might be shown by createProfile, show msg in modal too
             errorMsg.textContent = `Failed to create profile "${newName}". It might already exist or be invalid.`;
             errorMsg.style.display = 'block';
        }
    };

    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveBtn.click(); });
    cancelBtn.onclick = closeAllModals;
}

// --- Manage Profiles Modal ---
function openManageProfilesModal() {
    const modalContent = `<p>Select a profile to delete it permanently.</p><ul class="modal-profile-list" id="modalProfileList"></ul>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="manageCloseBtn">Close</button>`;

    const { contentDiv, buttonsDiv } = createModal('manageProfilesModalOverlay', 'Manage Profiles', modalContent, modalButtons);

    const listElement = contentDiv.querySelector('#modalProfileList');
    const closeBtn = buttonsDiv.querySelector('#manageCloseBtn');

    populateModalProfileList(listElement); // Populate the list on open

    closeBtn.onclick = closeAllModals;
}

// Populate list inside Manage modal
function populateModalProfileList(listElement) {
    listElement.innerHTML = '';
    const profiles = getProfileNames();

    if (profiles.length === 0) {
        listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>';
        return;
    }

    profiles.forEach(name => {
        const item = document.createElement('li'); item.className = 'modal-profile-item';
        const nameSpan = document.createElement('span'); nameSpan.textContent = name; item.appendChild(nameSpan);
        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'modal-delete-btn'; deleteBtn.dataset.profileName = name;
        // Attach listener to open CONFIRM modal
        deleteBtn.addEventListener('click', () => {
             openConfirmDeleteModal(name); // Open confirmation modal
        });
        item.appendChild(deleteBtn);
        listElement.appendChild(item);
    });
}

// --- Confirm Delete Profile Modal ---
function openConfirmDeleteModal(profileNameToDelete) {
    const currentActiveProfile = getCurrentProfile();
    let message = `Permanently delete profile "<strong>${profileNameToDelete}</strong>"?<br><br>All associated data (website settings, etc.) will be lost. This cannot be undone.`;
     if (profileNameToDelete === currentActiveProfile) {
        message += "<br><br><strong>Warning: This is your currently active profile!</strong> Deleting it will require you to select or create a new profile.";
    }

    const modalContent = `<p>${message}</p><p id="deleteErrorMsg" class="modal-error-message" style="display:none;"></p>`;
    const modalButtons = `
        <button type="button" class="modal-button-cancel" id="deleteCancelBtn">Cancel</button>
        <button type="button" class="modal-button-delete" id="deleteConfirmBtn">Delete Profile</button>
    `;
    // Create modal but don't close underlying manage modal yet
    const { contentDiv, buttonsDiv } = createModal('confirmDeleteModalOverlay', 'Confirm Deletion', modalContent, modalButtons);

    const confirmBtn = buttonsDiv.querySelector('#deleteConfirmBtn');
    const cancelBtn = buttonsDiv.querySelector('#deleteCancelBtn');
    const errorMsg = contentDiv.querySelector('#deleteErrorMsg');


    confirmBtn.onclick = () => {
        errorMsg.style.display = 'none';
         if (deleteProfile(profileNameToDelete)) { // Function from profile-manager.js
             console.log(`Profile "${profileNameToDelete}" deleted via modal confirmation.`);

             // Refresh the list in the Manage Profiles modal (if it still exists)
             const manageList = document.getElementById('modalProfileList');
             if (manageList) {
                 populateModalProfileList(manageList);
             }
             // Refresh the main navigation dropdown display
             setupProfileDropdown();

             alert(`Profile "${profileNameToDelete}" deleted.`);
             closeAllModals(); // Close the confirmation modal

             // Reload if the active profile was deleted (initProfileManager will handle selecting next)
             if (profileNameToDelete === currentActiveProfile) {
                 window.location.reload();
             }

         } else {
             errorMsg.textContent = `Failed to delete profile "${profileNameToDelete}".`;
             errorMsg.style.display = 'block';
              // Optionally close modal on failure too after a delay, or keep it open
              // closeAllModals();
         }
    };

    cancelBtn.onclick = closeAllModals; // Close only the confirmation modal
}