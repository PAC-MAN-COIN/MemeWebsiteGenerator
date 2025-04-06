// js/main.js - Loads navigation and handles its interactions

// Assumes profile-manager.js is loaded first in the HTML:
// <script src="js/profile-manager.js"></script>
// <script src="js/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const navPath = '../nav.html'; // Adjust path as needed

    if (navbarPlaceholder) {
        fetch(navPath)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status} while fetching ${navPath}`);
                return response.text();
            })
            .then(html => {
                navbarPlaceholder.innerHTML = html;

                // --- Initialize and Setup ---
                initProfileManager();     // Initialize profile system (from profile-manager.js)
                setActiveNavLink();       // Highlight correct nav link
                attachNavToggle();        // Make mobile hamburger work
                setupProfileDropdown();   // Setup the profile dropdown UI & functionality
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
                navbarPlaceholder.innerHTML = '<p style="color:red; text-align:center; padding: 10px;">Error loading navigation bar.</p>';
            });
    }

    // Inject SR-only styles if not already present via CSS file
    if (!document.querySelector('style#sr-only-style') && !document.querySelector('.sr-only')) {
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

    // Get the filename of the current page (e.g., "index.html", "tool.html")
    const currentPath = window.location.pathname;
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html'; // Default to index.html if path ends in /

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return; // Skip if no href

        // Get the filename from the link's href
        const linkFile = linkHref.split('/').pop().split('?')[0].split('#')[0];

        link.classList.remove('active');

        // Check for match: direct filename match OR (current is index and link is index or empty)
        if (linkFile === currentPageFile || (currentPageFile === 'index.html' && (linkFile === '' || linkHref === 'index.html'))) {
            link.classList.add('active');
        }
    });
}

function attachNavToggle() {
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav'); // The main nav container
    const navLinksContainer = document.getElementById('portal-nav-links'); // The UL for main links

    if (!toggleBtn || !navMenu || !navLinksContainer) {
        if (!toggleBtn) console.error("Nav toggle button (#portal-nav-toggle-btn) not found.");
        if (!navMenu) console.error("Nav menu element (#portal-nav) not found.");
        if (!navLinksContainer) console.error("Nav links container (#portal-nav-links) not found.");
        return;
    }

    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click handler from closing immediately
        const isOpen = navMenu.classList.toggle('portal-nav-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);

        // Calculate and set height for positioning profile section below links
        if (isOpen) {
            // Use requestAnimationFrame to ensure styles are applied before measuring
            requestAnimationFrame(() => {
                 const linksHeight = navLinksContainer.offsetHeight;
                 navMenu.style.setProperty('--nav-links-height', `${linksHeight}px`);
                 // console.log('Set --nav-links-height:', linksHeight); // For debugging
            });
        } else {
             navMenu.style.removeProperty('--nav-links-height'); // Clean up CSS variable
             // Also close profile dropdown if open
             const profileDropdownContent = document.getElementById('profileDropdownContent');
             const profileDropdownButton = document.getElementById('profileDropdownButton');
             if (profileDropdownContent && profileDropdownContent.classList.contains('show')) {
                 profileDropdownContent.classList.remove('show');
                 if (profileDropdownButton) profileDropdownButton.setAttribute('aria-expanded', 'false');
             }
        }
    });

    // Close mobile menu if a main navigation link is clicked
    navMenu.querySelectorAll('#portal-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('portal-nav-open')) {
                navMenu.classList.remove('portal-nav-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                navMenu.style.removeProperty('--nav-links-height'); // Clean up
            }
        });
    });

    // Close mobile menu or profile dropdown if clicking outside
    document.addEventListener('click', (event) => {
        const profileManagerNav = document.getElementById('profileManagerNav'); // The container for profile button/dropdown
        const profileDropdownContent = document.getElementById('profileDropdownContent');
        const profileDropdownButton = document.getElementById('profileDropdownButton');

        // Close mobile nav if open and click is outside the entire nav bar
        if (navMenu.classList.contains('portal-nav-open') && !navMenu.contains(event.target)) {
             navMenu.classList.remove('portal-nav-open');
             toggleBtn.setAttribute('aria-expanded', 'false');
             navMenu.style.removeProperty('--nav-links-height'); // Clean up
        }

        // Close profile dropdown if open and click is outside the profile manager container
        if (profileDropdownContent && profileDropdownContent.classList.contains('show')) {
            if (!profileManagerNav || !profileManagerNav.contains(event.target)) {
                profileDropdownContent.classList.remove('show');
                if (profileDropdownButton) profileDropdownButton.setAttribute('aria-expanded', 'false');
            }
        }
    });
}


// --- Profile Dropdown Setup ---
function setupProfileDropdown() {
    const profileManagerNav = document.getElementById('profileManagerNav'); // Container
    const dropdownButton = document.getElementById('profileDropdownButton');
    const dropdownContent = document.getElementById('profileDropdownContent');
    const currentProfileDisplay = document.getElementById('currentProfileDisplay'); // Span in the button
    const profileListContainer = document.getElementById('profileListContainer'); // UL in dropdown
    const createNewProfileBtn = document.getElementById('createNewProfileBtn'); // Link in dropdown
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');     // Link in dropdown

    if (!dropdownButton || !dropdownContent || !currentProfileDisplay || !profileListContainer || !createNewProfileBtn || !manageProfilesBtn) {
        console.error("One or more profile dropdown elements not found! Check IDs: profileDropdownButton, profileDropdownContent, currentProfileDisplay, profileListContainer, createNewProfileBtn, manageProfilesBtn");
        // Optionally hide the whole profile section if elements are missing
        if(profileManagerNav) profileManagerNav.style.display = 'none';
        return;
    }

    // Function to update the list of profiles in the dropdown
    function populateNavDropdownList() {
        profileListContainer.innerHTML = ''; // Clear existing list
        const profiles = getProfileNames();
        const currentProfile = getCurrentProfile();

        // Update the button text
        currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile";
        currentProfileDisplay.title = currentProfile ? `Current Profile: ${currentProfile}` : "No profile selected";

        // Populate the dropdown list
        if (profiles.length === 0) {
            profileListContainer.innerHTML = '<span class="no-profiles">No profiles yet.</span>';
        } else {
            let hasOtherProfiles = false;
            profiles.forEach(name => {
                if (name !== currentProfile) {
                    hasOtherProfiles = true;
                    const link = document.createElement('a');
                    link.href = "#"; // Prevent page jump
                    link.textContent = `${name}`; // Simpler text
                    link.title = `Switch to profile: ${name}`;
                    link.dataset.profileName = name;
                    link.addEventListener('click', handleProfileSwitch);
                    profileListContainer.appendChild(link);
                }
            });
            // Message if only the current profile exists or no profile is selected
            if (!hasOtherProfiles && currentProfile) {
                 // Check if list is empty before adding message
                if (profileListContainer.children.length === 0) {
                    profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Only current profile exists.</span>';
                }
            } else if (profiles.length > 0 && !currentProfile){
                 // List will have profiles, add prompt if needed
                 // profileListContainer.insertAdjacentHTML('afterbegin', '<span class="no-profiles" style="cursor:default;">Select a profile</span><hr>'); // Example prompt
            }
        }
         // Always add Create New and Manage Profiles links if they haven't been added by mistake above
         if (!profileListContainer.querySelector('[data-action="create"]')) {
             const hr = document.createElement('hr');
             profileListContainer.appendChild(hr);

             const createLink = document.createElement('a');
             createLink.href="#";
             createLink.textContent = "Create New Profile";
             createLink.dataset.action = "create";
             createLink.id = 'createNewProfileBtn_dyn'; // Use different ID if needed
             createLink.addEventListener('click', (event) => { event.preventDefault(); openCreateProfileModal(); closeDropdown(); });
             profileListContainer.appendChild(createLink);

             const manageLink = document.createElement('a');
             manageLink.href="#";
             manageLink.textContent = "Manage Profiles";
             manageLink.dataset.action = "manage";
             manageLink.id = 'manageProfilesBtn_dyn'; // Use different ID if needed
             manageLink.addEventListener('click', (event) => { event.preventDefault(); openManageProfilesModal(); closeDropdown(); });
             profileListContainer.appendChild(manageLink);
         }
    }

    // Close dropdown function
    function closeDropdown() {
         if (dropdownContent.classList.contains('show')) {
            dropdownContent.classList.remove('show');
            dropdownButton.setAttribute('aria-expanded', 'false');
         }
    }

    // Switch profile action
    function handleProfileSwitch(event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent closing menu immediately
        const profileName = event.target.dataset.profileName;
        if (profileName && profileName !== getCurrentProfile()) {
            setCurrentProfile(profileName);
            populateNavDropdownList(); // Update display
            closeDropdown();
            window.location.reload(); // Reload page to apply profile changes
        } else {
            closeDropdown(); // Close if clicking current or invalid
        }
    }

    // Add event listeners to static "Create New" and "Manage" buttons (if they exist in HTML)
    // Note: The populate function now dynamically adds these, so these might not be needed if HTML is clean
    createNewProfileBtn.addEventListener('click', (event) => { event.preventDefault(); openCreateProfileModal(); closeDropdown(); });
    manageProfilesBtn.addEventListener('click', (event) => { event.preventDefault(); openManageProfilesModal(); closeDropdown(); });

    // Toggle dropdown visibility
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click handler
        populateNavDropdownList(); // Repopulate before showing
        const isExpanded = dropdownContent.classList.toggle('show');
        dropdownButton.setAttribute('aria-expanded', isExpanded);
    });

    // Initial population of the button text
    populateNavDropdownList();
}


// --- Modal Creation & Handling Functions ---
function createModal(id, titleHtml, contentHtml, buttonsHtml) {
    closeAllModals(); // Close any existing modals first
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    // Close on overlay click
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            closeAllModals();
        }
    });

    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    // Prevent closing when clicking inside the box
    modalBox.addEventListener('click', event => event.stopPropagation());

    // Title
    const title = document.createElement('h2');
    title.innerHTML = titleHtml;
    modalBox.appendChild(title);

    // Close Button (Top Right)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn';
    closeBtn.innerHTML = '&times;'; // '×' symbol
    closeBtn.setAttribute('aria-label', 'Close modal');
    closeBtn.title = 'Close';
    closeBtn.onclick = closeAllModals;
    modalBox.appendChild(closeBtn);

    // Content Area
    const contentDiv = document.createElement('div');
    contentDiv.className = 'modal-content';
    contentDiv.innerHTML = contentHtml;
    modalBox.appendChild(contentDiv);

    // Buttons Area (Optional)
    let buttonsDiv = null;
    if(buttonsHtml){
        buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'modal-buttons';
        buttonsDiv.innerHTML = buttonsHtml;
        modalBox.appendChild(buttonsDiv);
    }

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    // Trigger transition
    setTimeout(() => overlay.classList.add('show'), 10); // Small delay for transition

    return { overlay, modalBox, contentDiv, buttonsDiv };
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.show').forEach(modal => {
        modal.classList.remove('show');
        // Remove from DOM after transition
        modal.addEventListener('transitionend', () => {
             if (!modal.classList.contains('show')) { // Ensure it wasn't reopened quickly
                 modal.remove();
             }
        }, { once: true });
         // Fallback removal if transition doesn't fire (e.g., display: none)
         setTimeout(() => {
             if (!modal.classList.contains('show')) modal.remove();
         }, 500); // Adjust timeout based on transition duration
    });
}


// --- Create Profile Modal ---
function openCreateProfileModal() {
    const modalContent = `
        <div class="control-group">
            <label for="newProfileNameInput">New Profile Name:</label>
            <input type="text" id="newProfileNameInput" placeholder="e.g., $MyAwesomeCoin" required>
            <p id="createProfileError" class="modal-error-message" aria-live="assertive"></p>
        </div>`;
    const modalButtons = `
        <button type="button" class="modal-button-cancel" id="createCancelBtn">Cancel</button>
        <button type="button" class="modal-button-confirm" id="createSaveBtn">Create & Switch</button>`;

    const { contentDiv, buttonsDiv } = createModal('createProfileModalOverlay', 'Create New Profile', modalContent, modalButtons);

    const inputField = contentDiv.querySelector('#newProfileNameInput');
    const errorMsg = contentDiv.querySelector('#createProfileError');
    const saveBtn = buttonsDiv.querySelector('#createSaveBtn');
    const cancelBtn = buttonsDiv.querySelector('#createCancelBtn');

    errorMsg.style.display = 'none'; // Ensure hidden initially
    inputField.focus();

    // Save action
    saveBtn.onclick = () => {
        errorMsg.textContent = ''; // Clear previous error
        errorMsg.style.display = 'none';
        const newName = inputField.value.trim();

        if (!newName) {
            errorMsg.textContent = 'Profile name cannot be empty.';
            errorMsg.style.display = 'block';
            inputField.focus();
            return;
        }

        // Attempt to create profile (assuming createProfile handles uniqueness check & alerts)
        if (createProfile(newName)) {
            setCurrentProfile(newName);
            closeAllModals();
            window.location.reload(); // Reload to apply changes globally
        } else {
            // createProfile should ideally alert or return error message
            // If not, provide a generic error here.
            // errorMsg.textContent = `Failed to create profile "${newName}". It might already exist or be invalid.`;
            // errorMsg.style.display = 'block';
             inputField.focus(); // Keep focus on input if creation fails
        }
    };

    // Allow Enter key to submit
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });

    // Cancel action
    cancelBtn.onclick = closeAllModals;
}


// --- Manage Profiles Modal ---
function openManageProfilesModal() {
    const modalContent = `
        <p>Select a profile to delete it permanently.</p>
        <ul class="modal-profile-list" id="modalProfileList">
            </ul>`;
    const modalButtons = `
        <button type="button" class="modal-button-cancel" id="manageCloseBtn">Close</button>`;

    const { contentDiv, buttonsDiv } = createModal('manageProfilesModalOverlay', 'Manage Profiles', modalContent, modalButtons);

    const listElement = contentDiv.querySelector('#modalProfileList');
    const closeBtn = buttonsDiv.querySelector('#manageCloseBtn');

    populateModalProfileList(listElement); // Populate the list on open

    closeBtn.onclick = closeAllModals;
}

// Populate list inside Manage modal
function populateModalProfileList(listElement) {
    listElement.innerHTML = ''; // Clear existing items
    const profiles = getProfileNames();
    const currentProfile = getCurrentProfile();

    if (profiles.length === 0) {
        listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>';
        return;
    }

    profiles.forEach(name => {
        const item = document.createElement('li');
        item.className = 'modal-profile-item';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        if (name === currentProfile) {
            nameSpan.innerHTML += ' <small>(Active)</small>'; // Indicate active profile
            nameSpan.style.fontWeight = 'bold';
        }
        item.appendChild(nameSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.title = `Delete profile: ${name}`;
        deleteBtn.className = 'modal-delete-btn';
        deleteBtn.dataset.profileName = name;

        deleteBtn.addEventListener('click', () => {
            // Close Manage modal before opening confirm modal might be smoother
            // closeAllModals(); // Optional: close manage modal first
            openConfirmDeleteModal(name, listElement); // Pass listElement to refresh later
        });
        item.appendChild(deleteBtn);

        listElement.appendChild(item);
    });
}

// --- Confirm Delete Profile Modal ---
// Added listElementToRefresh parameter
function openConfirmDeleteModal(profileNameToDelete, listElementToRefresh) {
    const currentActiveProfile = getCurrentProfile();
    let message = `Permanently delete profile "<strong>${profileNameToDelete}</strong>"?<br><br>All associated data will be lost. This cannot be undone.`;
    if (profileNameToDelete === currentActiveProfile) {
        message += "<br><br><strong>Warning: This is your currently active profile!</strong> Deleting it will clear the active profile setting.";
    }

    const modalContent = `
        <p>${message}</p>
        <p id="deleteErrorMsg" class="modal-error-message" aria-live="assertive" style="display:none;"></p>`;
    const modalButtons = `
        <button type="button" class="modal-button-cancel" id="deleteCancelBtn">Cancel</button>
        <button type="button" class="modal-button-delete" id="deleteConfirmBtn">Delete Profile</button>`;

    const { contentDiv, buttonsDiv } = createModal('confirmDeleteModalOverlay', 'Confirm Deletion', modalContent, modalButtons);

    const confirmBtn = buttonsDiv.querySelector('#deleteConfirmBtn');
    const cancelBtn = buttonsDiv.querySelector('#deleteCancelBtn');
    const errorMsg = contentDiv.querySelector('#deleteErrorMsg');

    confirmBtn.onclick = () => {
        errorMsg.style.display = 'none';
        if (deleteProfile(profileNameToDelete)) { // deleteProfile handles logic and localStorage update
            console.log(`Profile "${profileNameToDelete}" deleted via modal confirmation.`);

            closeAllModals(); // Close confirmation modal

            // Refresh the Manage modal list IF it's still somehow open
             const manageModalList = document.getElementById('modalProfileList');
             if (manageModalList) {
                 populateModalProfileList(manageModalList);
             }

            // Refresh the main nav dropdown display
             const dropdownButton = document.getElementById('profileDropdownButton');
             if (dropdownButton) { // Check if nav fully loaded
                 setupProfileDropdown(); // Re-run setup to update button text & list generator
             }


            // Reload the page ONLY if the ACTIVE profile was deleted
            if (profileNameToDelete === currentActiveProfile) {
                // Give a small delay for user to see modal close
                 setTimeout(() => window.location.reload(), 100);
            }

        } else {
            errorMsg.textContent = `Failed to delete profile "${profileNameToDelete}".`;
            errorMsg.style.display = 'block';
        }
    };

    cancelBtn.onclick = closeAllModals;
}