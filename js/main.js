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

                // --- Create Mobile Nav Content Wrapper (if it doesn't exist in nav.html) ---
                let mobileNavContent = document.getElementById('mobile-nav-content');
                if (!mobileNavContent) {
                    const portalNav = document.getElementById('portal-nav');
                    if(portalNav) {
                        mobileNavContent = document.createElement('div');
                        mobileNavContent.id = 'mobile-nav-content';
                        // Move existing links and profile manager into the wrapper
                        const links = document.getElementById('portal-nav-links');
                        const profileMgr = document.getElementById('profileManagerNav');
                        if(links) mobileNavContent.appendChild(links);
                        if(profileMgr) mobileNavContent.appendChild(profileMgr);
                        // Insert wrapper into the main nav element
                        portalNav.appendChild(mobileNavContent);
                    } else {
                         console.error("#portal-nav not found, cannot create #mobile-nav-content wrapper.");
                    }
                }


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
    const currentPath = window.location.pathname;
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html';

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        const linkFile = linkHref.split('/').pop().split('?')[0].split('#')[0];
        link.classList.remove('active');
        if (linkFile === currentPageFile || (currentPageFile === 'index.html' && (linkFile === '' || linkHref === 'index.html'))) {
            link.classList.add('active');
        }
    });
}

function attachNavToggle() {
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav'); // The main nav element
    const mobileNavContent = document.getElementById('mobile-nav-content'); // The wrapper for mobile content

    if (!toggleBtn || !navMenu || !mobileNavContent) {
        if (!toggleBtn) console.error("Nav toggle button (#portal-nav-toggle-btn) not found.");
        if (!navMenu) console.error("Nav menu element (#portal-nav) not found.");
        if (!mobileNavContent) console.error("Mobile nav content wrapper (#mobile-nav-content) not found.");
        return;
    }

    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = navMenu.classList.toggle('portal-nav-open');
        toggleBtn.setAttribute('aria-expanded', isOpen);

        if (!isOpen) {
             // If closing main menu, also close profile dropdown if it's open
             const profileDropdownContent = document.getElementById('profileDropdownContent');
             const profileDropdownButton = document.getElementById('profileDropdownButton');
             if (profileDropdownContent && profileDropdownContent.classList.contains('show')) {
                 profileDropdownContent.classList.remove('show');
                 if (profileDropdownButton) profileDropdownButton.setAttribute('aria-expanded', 'false');
             }
        }
    });

    // Close mobile menu if a main navigation link is clicked
    mobileNavContent.querySelectorAll('#portal-nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('portal-nav-open')) {
                navMenu.classList.remove('portal-nav-open');
                toggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Close mobile menu or profile dropdown if clicking outside
    document.addEventListener('click', (event) => {
        const profileManagerNav = document.getElementById('profileManagerNav'); // Profile section container
        const profileDropdownContent = document.getElementById('profileDropdownContent');
        const profileDropdownButton = document.getElementById('profileDropdownButton');

        // Close mobile nav if open and click is outside the main nav element
        if (navMenu.classList.contains('portal-nav-open') && !navMenu.contains(event.target)) {
             navMenu.classList.remove('portal-nav-open');
             toggleBtn.setAttribute('aria-expanded', 'false');
        }

        // Close profile dropdown (desktop or mobile) if open and click is outside its container
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
    const dropdownContent = document.getElementById('profileDropdownContent'); // The UL/Div holding the items
    const currentProfileDisplay = document.getElementById('currentProfileDisplay'); // Span in the button

    // Check essential elements
    if (!profileManagerNav || !dropdownButton || !dropdownContent || !currentProfileDisplay) {
         console.error("Profile dropdown core elements missing (profileManagerNav, profileDropdownButton, profileDropdownContent, or currentProfileDisplay). Aborting setup.");
         if(profileManagerNav) profileManagerNav.style.display = 'none'; // Hide section if broken
         return;
    }

    // Function to update the list of profiles in the dropdown
    function populateNavDropdownList() {
        // Use dropdownContent directly as the container
        dropdownContent.innerHTML = ''; // Clear existing dynamic items only
        const profiles = getProfileNames();
        const currentProfile = getCurrentProfile();

        // Update the button text
        currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile";
        currentProfileDisplay.title = currentProfile ? `Current Profile: ${currentProfile}` : "No profile selected";

        // Add "Switch to" links
        let hasOtherProfiles = false;
        profiles.forEach(name => {
            if (name !== currentProfile) {
                hasOtherProfiles = true;
                const link = document.createElement('a');
                link.href = "#";
                link.textContent = name; // Just the name for switching
                link.title = `Switch to profile: ${name}`;
                link.dataset.profileName = name; // Identify action
                link.addEventListener('click', handleProfileSwitch);
                dropdownContent.appendChild(link);
            }
        });

        // Add messages if needed
        if (profiles.length === 0) {
             dropdownContent.insertAdjacentHTML('beforeend', '<span class="no-profiles">No profiles yet.</span>');
        } else if (!hasOtherProfiles && currentProfile) {
             // Only show this message if the list is truly empty (no switch links added)
             if(dropdownContent.children.length === 0) {
                 dropdownContent.insertAdjacentHTML('beforeend', '<span class="no-profiles" style="cursor:default;">Only current profile exists.</span>');
             }
        }

        // Add Separator
        if(dropdownContent.children.length > 0) { // Add HR only if there were items before it
             const hr = document.createElement('hr');
             dropdownContent.appendChild(hr);
        }


        // Add "Create New Profile" Link
        const createLink = document.createElement('a');
        createLink.href="#";
        createLink.id = 'createProfileDropdownLink'; // Specific ID
        createLink.textContent = "Create New Profile";
        createLink.addEventListener('click', (event) => {
             event.preventDefault();
             event.stopPropagation(); // Prevent closing immediately
             openCreateProfileModal();
             closeDropdown();
        });
        dropdownContent.appendChild(createLink);

        // Add "Manage Profiles" Link
        const manageLink = document.createElement('a');
        manageLink.href="#";
        manageLink.id = 'manageProfilesDropdownLink'; // Specific ID
        manageLink.textContent = "Manage Profiles";
        manageLink.addEventListener('click', (event) => {
             event.preventDefault();
             event.stopPropagation(); // Prevent closing immediately
             openManageProfilesModal();
             closeDropdown();
        });
        dropdownContent.appendChild(manageLink);
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
        event.stopPropagation();
        const profileName = event.target.dataset.profileName;
        if (profileName && profileName !== getCurrentProfile()) {
            setCurrentProfile(profileName);
            // No need to populate here, page reload handles it
            closeDropdown();
            window.location.reload();
        } else {
            closeDropdown();
        }
    }

    // Toggle dropdown visibility
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log("Profile dropdown button clicked"); // DEBUG LOG
        populateNavDropdownList(); // Always repopulate before showing/toggling
        const isCurrentlyShown = dropdownContent.classList.contains('show');
        const isExpanded = dropdownContent.classList.toggle('show');
        dropdownButton.setAttribute('aria-expanded', isExpanded);
        console.log("Dropdown 'show' class toggled. Is now shown:", isExpanded); // DEBUG LOG

        // Debug mobile issue: check parent visibility
        if (window.innerWidth <= 768 && document.getElementById('portal-nav').classList.contains('portal-nav-open')) {
            console.log("Mobile nav open, checking parent visibility:", dropdownContent.offsetParent !== null);
        }
    });

    // Initial population of the button text (doesn't populate dropdown list yet)
     const initialProfile = getCurrentProfile();
     currentProfileDisplay.textContent = initialProfile ? initialProfile : "No Profile";
     currentProfileDisplay.title = initialProfile ? `Current Profile: ${initialProfile}` : "No profile selected";
}


// --- Modal Creation & Handling Functions --- (Unchanged from previous version)
function createModal(id, titleHtml, contentHtml, buttonsHtml) {
    closeAllModals();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeAllModals(); });
    const modalBox = document.createElement('div');
    modalBox.className = 'modal-box';
    modalBox.addEventListener('click', event => event.stopPropagation());
    const title = document.createElement('h2');
    title.innerHTML = titleHtml; modalBox.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn'; closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close modal'); closeBtn.title = 'Close';
    closeBtn.onclick = closeAllModals; modalBox.appendChild(closeBtn);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'modal-content'; contentDiv.innerHTML = contentHtml;
    modalBox.appendChild(contentDiv);
    let buttonsDiv = null;
    if(buttonsHtml){ buttonsDiv = document.createElement('div'); buttonsDiv.className = 'modal-buttons'; buttonsDiv.innerHTML = buttonsHtml; modalBox.appendChild(buttonsDiv); }
    overlay.appendChild(modalBox); document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    return { overlay, modalBox, contentDiv, buttonsDiv };
}
function closeAllModals() {
    document.querySelectorAll('.modal-overlay.show').forEach(modal => {
        modal.classList.remove('show');
        modal.addEventListener('transitionend', () => { if (!modal.classList.contains('show')) modal.remove(); }, { once: true });
        setTimeout(() => { if (!modal.classList.contains('show')) modal.remove(); }, 500);
    });
}
// --- Create Profile Modal --- (Unchanged from previous version)
function openCreateProfileModal() {
    const modalContent = `<div class="control-group"><label for="newProfileNameInput">New Profile Name:</label><input type="text" id="newProfileNameInput" placeholder="e.g., $MyAwesomeCoin" required><p id="createProfileError" class="modal-error-message" aria-live="assertive"></p></div>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="createCancelBtn">Cancel</button><button type="button" class="modal-button-confirm" id="createSaveBtn">Create & Switch</button>`;
    const { contentDiv, buttonsDiv } = createModal('createProfileModalOverlay', 'Create New Profile', modalContent, modalButtons);
    const inputField = contentDiv.querySelector('#newProfileNameInput'); const errorMsg = contentDiv.querySelector('#createProfileError'); const saveBtn = buttonsDiv.querySelector('#createSaveBtn'); const cancelBtn = buttonsDiv.querySelector('#createCancelBtn');
    errorMsg.style.display = 'none'; inputField.focus();
    saveBtn.onclick = () => { errorMsg.textContent = ''; errorMsg.style.display = 'none'; const newName = inputField.value.trim(); if (!newName) { errorMsg.textContent = 'Profile name cannot be empty.'; errorMsg.style.display = 'block'; inputField.focus(); return; } if (createProfile(newName)) { setCurrentProfile(newName); closeAllModals(); window.location.reload(); } else { inputField.focus(); } };
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveBtn.click(); });
    cancelBtn.onclick = closeAllModals;
}
// --- Manage Profiles Modal --- (Unchanged from previous version)
function openManageProfilesModal() {
    const modalContent = `<p>Select a profile to delete it permanently.</p><ul class="modal-profile-list" id="modalProfileList"></ul>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="manageCloseBtn">Close</button>`;
    const { contentDiv, buttonsDiv } = createModal('manageProfilesModalOverlay', 'Manage Profiles', modalContent, modalButtons);
    const listElement = contentDiv.querySelector('#modalProfileList'); const closeBtn = buttonsDiv.querySelector('#manageCloseBtn');
    populateModalProfileList(listElement); closeBtn.onclick = closeAllModals;
}
// --- Populate list inside Manage modal --- (Unchanged from previous version)
function populateModalProfileList(listElement) {
    listElement.innerHTML = ''; const profiles = getProfileNames(); const currentProfile = getCurrentProfile();
    if (profiles.length === 0) { listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>'; return; }
    profiles.forEach(name => { const item = document.createElement('li'); item.className = 'modal-profile-item'; const nameSpan = document.createElement('span'); nameSpan.textContent = name; if (name === currentProfile) { nameSpan.innerHTML += ' <small>(Active)</small>'; nameSpan.style.fontWeight = 'bold'; } item.appendChild(nameSpan); const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.title = `Delete profile: ${name}`; deleteBtn.className = 'modal-delete-btn'; deleteBtn.dataset.profileName = name; deleteBtn.addEventListener('click', () => { openConfirmDeleteModal(name, listElement); }); item.appendChild(deleteBtn); listElement.appendChild(item); });
}
// --- Confirm Delete Profile Modal --- (Unchanged from previous version)
function openConfirmDeleteModal(profileNameToDelete, listElementToRefresh) {
    const currentActiveProfile = getCurrentProfile(); let message = `Permanently delete profile "<strong>${profileNameToDelete}</strong>"?<br><br>All associated data will be lost. This cannot be undone.`; if (profileNameToDelete === currentActiveProfile) { message += "<br><br><strong>Warning: This is your currently active profile!</strong> Deleting it will clear the active profile setting."; }
    const modalContent = `<p>${message}</p><p id="deleteErrorMsg" class="modal-error-message" aria-live="assertive" style="display:none;"></p>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="deleteCancelBtn">Cancel</button><button type="button" class="modal-button-delete" id="deleteConfirmBtn">Delete Profile</button>`;
    const { contentDiv, buttonsDiv } = createModal('confirmDeleteModalOverlay', 'Confirm Deletion', modalContent, modalButtons);
    const confirmBtn = buttonsDiv.querySelector('#deleteConfirmBtn'); const cancelBtn = buttonsDiv.querySelector('#deleteCancelBtn'); const errorMsg = contentDiv.querySelector('#deleteErrorMsg');
    confirmBtn.onclick = () => { errorMsg.style.display = 'none'; if (deleteProfile(profileNameToDelete)) { console.log(`Profile "${profileNameToDelete}" deleted via modal confirmation.`); closeAllModals(); const manageModalList = document.getElementById('modalProfileList'); if (manageModalList) { populateModalProfileList(manageModalList); } const dropdownButton = document.getElementById('profileDropdownButton'); if (dropdownButton) { setupProfileDropdown(); } if (profileNameToDelete === currentActiveProfile) { setTimeout(() => window.location.reload(), 100); } } else { errorMsg.textContent = `Failed to delete profile "${profileNameToDelete}".`; errorMsg.style.display = 'block'; } };
    cancelBtn.onclick = closeAllModals;
}