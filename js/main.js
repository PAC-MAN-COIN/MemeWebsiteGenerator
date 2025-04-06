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

                // --- Create Mobile Nav Content Wrapper ONLY if mobile toggle is VISIBLE ---
                // This prevents restructuring the HTML on desktop views.
                const toggleBtn = document.getElementById('portal-nav-toggle-btn');
                let mobileNavContent = document.getElementById('mobile-nav-content'); // Check if it exists in nav.html first
                let shouldSetupMobileWrapper = false;

                if (toggleBtn) {
                    // Check the computed style AFTER HTML is potentially rendered
                    const toggleBtnStyle = window.getComputedStyle(toggleBtn);
                    if (toggleBtnStyle.display !== 'none') {
                        shouldSetupMobileWrapper = true;
                        console.log("Toggle button is VISIBLE (display != none), setting up mobile wrapper."); // Debug log
                    } else {
                        console.log("Toggle button exists but is HIDDEN (display: none), assuming desktop. Skipping wrapper."); // Debug log
                    }
                } else {
                     console.log("Toggle button not found, assuming desktop. Skipping wrapper."); // Debug log
                }


                if (shouldSetupMobileWrapper && !mobileNavContent) { // Only create if needed AND wrapper not already in HTML
                    const portalNav = document.getElementById('portal-nav');
                    if(portalNav) {
                        console.log("Creating #mobile-nav-content wrapper via JS.");
                        mobileNavContent = document.createElement('div');
                        mobileNavContent.id = 'mobile-nav-content';
                        // Move existing links and profile manager into the wrapper
                        const links = document.getElementById('portal-nav-links');
                        const profileMgr = document.getElementById('profileManagerNav');
                        // Check if elements exist before appending
                        if(links) mobileNavContent.appendChild(links);
                        if(profileMgr) mobileNavContent.appendChild(profileMgr);
                        portalNav.appendChild(mobileNavContent); // Append wrapper to #portal-nav
                    } else {
                         console.error("#portal-nav not found, cannot create #mobile-nav-content wrapper.");
                    }
                } else if (shouldSetupMobileWrapper && mobileNavContent) {
                     console.log("#mobile-nav-content wrapper already exists in nav.html.");
                }
                // --- End Mobile Wrapper Logic ---


                // --- Initialize and Setup ---
                initProfileManager();     // Initialize profile system (from profile-manager.js)
                setActiveNavLink();       // Highlight correct nav link
                attachNavToggle();        // Make mobile hamburger work (will do nothing if toggleBtn not found)
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
    // Use #portal-nav-links specifically, in case other links exist elsewhere
    const navLinks = document.querySelectorAll('#portal-nav #portal-nav-links li a');
    if (!navLinks || navLinks.length === 0) return;

    const currentPath = window.location.pathname;
    const currentPageFile = currentPath.substring(currentPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html';

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) return;
        // Handle relative paths potentially starting with ../ or ./
        const linkPath = new URL(linkHref, window.location.href).pathname;
        const linkFile = linkPath.substring(linkPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html';

        link.classList.remove('active');

        if (linkFile === currentPageFile || (currentPageFile === 'index.html' && (linkFile === '' || linkHref === 'index.html' || linkHref === './'))) {
            link.classList.add('active');
        }
    });
}


function attachNavToggle() {
    const toggleBtn = document.getElementById('portal-nav-toggle-btn');
    const navMenu = document.getElementById('portal-nav'); // The main nav element
    // Mobile content wrapper might or might not exist depending on view/HTML structure
    const mobileNavContent = document.getElementById('mobile-nav-content');

    // Only proceed if the toggle button exists AND is visible
    if (!toggleBtn || !navMenu || window.getComputedStyle(toggleBtn).display === 'none') {
        // No error needed, just don't attach listeners if not relevant
        return;
    }

    console.log("Attaching mobile nav toggle listener."); // Debug log

    toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click handler from closing immediately
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

    // Use navMenu to find links container, as mobileNavContent might not exist if built into nav.html
    const linksContainer = navMenu.querySelector('#portal-nav-links');
    if (linksContainer) {
        // Close mobile menu if a main navigation link is clicked
        linksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                // Check if we are actually in the open mobile state before closing
                if (navMenu.classList.contains('portal-nav-open')) {
                    navMenu.classList.remove('portal-nav-open');
                    // Ensure the button state is also updated
                    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }


    // Close mobile menu or profile dropdown if clicking outside
    document.addEventListener('click', (event) => {
        // Check if the toggle button exists and is visible before running outside click logic
        if (!toggleBtn || window.getComputedStyle(toggleBtn).display === 'none') return;

        const profileManagerNav = document.getElementById('profileManagerNav');
        const profileDropdownContent = document.getElementById('profileDropdownContent');
        const profileDropdownButton = document.getElementById('profileDropdownButton');

        // Close mobile nav if open and click is outside the main nav element
        // Make sure the click wasn't on the toggle button itself
        if (navMenu.classList.contains('portal-nav-open') && !navMenu.contains(event.target) && event.target !== toggleBtn) {
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

        // Add Separator (only if switch links or messages were added)
        if(dropdownContent.children.length > 0) {
             const hr = document.createElement('hr');
             dropdownContent.appendChild(hr);
        }


        // Add "Create New Profile" Link Dynamically
        const createLink = document.createElement('a');
        createLink.href="#";
        createLink.id = 'createProfileDropdownLink'; // Specific ID
        createLink.textContent = "Create New Profile";
        createLink.addEventListener('click', (event) => {
             event.preventDefault();
             event.stopPropagation();
             openCreateProfileModal();
             closeDropdown();
        });
        dropdownContent.appendChild(createLink);

        // Add "Manage Profiles" Link Dynamically
        const manageLink = document.createElement('a');
        manageLink.href="#";
        manageLink.id = 'manageProfilesDropdownLink'; // Specific ID
        manageLink.textContent = "Manage Profiles";
        manageLink.addEventListener('click', (event) => {
             event.preventDefault();
             event.stopPropagation();
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
            closeDropdown();
            window.location.reload();
        } else {
            closeDropdown();
        }
    }

    // Toggle dropdown visibility
    dropdownButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent document click handler
        // console.log("Profile dropdown button clicked"); // DEBUG LOG

        populateNavDropdownList(); // Repopulate before showing/toggling
        const isCurrentlyShown = dropdownContent.classList.contains('show');
        const isExpanded = dropdownContent.classList.toggle('show');
        dropdownButton.setAttribute('aria-expanded', isExpanded);
        // console.log(`Dropdown toggled. Was shown: ${isCurrentlyShown}, Is now shown: ${isExpanded}`); // DEBUG LOG

    });

    // Initial population of the button text
     const initialProfile = getCurrentProfile();
     currentProfileDisplay.textContent = initialProfile ? initialProfile : "No Profile";
     currentProfileDisplay.title = initialProfile ? `Current Profile: ${initialProfile}` : "No profile selected";
}


// --- Modal Creation & Handling Functions --- (Unchanged)
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
// --- Create Profile Modal --- (Unchanged)
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
// --- Manage Profiles Modal --- (Unchanged)
function openManageProfilesModal() {
    const modalContent = `<p>Select a profile to delete it permanently.</p><ul class="modal-profile-list" id="modalProfileList"></ul>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="manageCloseBtn">Close</button>`;
    const { contentDiv, buttonsDiv } = createModal('manageProfilesModalOverlay', 'Manage Profiles', modalContent, modalButtons);
    const listElement = contentDiv.querySelector('#modalProfileList'); const closeBtn = buttonsDiv.querySelector('#manageCloseBtn');
    populateModalProfileList(listElement); closeBtn.onclick = closeAllModals;
}
// --- Populate list inside Manage modal --- (Unchanged)
function populateModalProfileList(listElement) {
    listElement.innerHTML = ''; const profiles = getProfileNames(); const currentProfile = getCurrentProfile();
    if (profiles.length === 0) { listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>'; return; }
    profiles.forEach(name => { const item = document.createElement('li'); item.className = 'modal-profile-item'; const nameSpan = document.createElement('span'); nameSpan.textContent = name; if (name === currentProfile) { nameSpan.innerHTML += ' <small>(Active)</small>'; nameSpan.style.fontWeight = 'bold'; } item.appendChild(nameSpan); const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.title = `Delete profile: ${name}`; deleteBtn.className = 'modal-delete-btn'; deleteBtn.dataset.profileName = name; deleteBtn.addEventListener('click', () => { openConfirmDeleteModal(name, listElement); }); item.appendChild(deleteBtn); listElement.appendChild(item); });
}
// --- Confirm Delete Profile Modal --- (Unchanged)
function openConfirmDeleteModal(profileNameToDelete, listElementToRefresh) {
    const currentActiveProfile = getCurrentProfile(); let message = `Permanently delete profile "<strong>${profileNameToDelete}</strong>"?<br><br>All associated data will be lost. This cannot be undone.`; if (profileNameToDelete === currentActiveProfile) { message += "<br><br><strong>Warning: This is your currently active profile!</strong> Deleting it will clear the active profile setting."; }
    const modalContent = `<p>${message}</p><p id="deleteErrorMsg" class="modal-error-message" aria-live="assertive" style="display:none;"></p>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="deleteCancelBtn">Cancel</button><button type="button" class="modal-button-delete" id="deleteConfirmBtn">Delete Profile</button>`;
    const { contentDiv, buttonsDiv } = createModal('confirmDeleteModalOverlay', 'Confirm Deletion', modalContent, modalButtons);
    const confirmBtn = buttonsDiv.querySelector('#deleteConfirmBtn'); const cancelBtn = buttonsDiv.querySelector('#deleteCancelBtn'); const errorMsg = contentDiv.querySelector('#deleteErrorMsg');
    confirmBtn.onclick = () => { errorMsg.style.display = 'none'; if (deleteProfile(profileNameToDelete)) { console.log(`Profile "${profileNameToDelete}" deleted via modal confirmation.`); closeAllModals(); const manageModalList = document.getElementById('modalProfileList'); if (manageModalList) { populateModalProfileList(manageModalList); } const dropdownButton = document.getElementById('profileDropdownButton'); if (dropdownButton) { setupProfileDropdown(); } if (profileNameToDelete === currentActiveProfile) { setTimeout(() => window.location.reload(), 100); } } else { errorMsg.textContent = `Failed to delete profile "${profileNameToDelete}".`; errorMsg.style.display = 'block'; } };
    cancelBtn.onclick = closeAllModals;
}