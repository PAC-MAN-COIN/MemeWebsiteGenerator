// js/main.js - Loads navigation and handles its interactions

// Assumes profile-manager.js is loaded first in the HTML:
// <script src="js/profile-manager.js"></script>
// <script src="js/main.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    const navPath = '../nav.html'; // Relative path

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

    // Inject SR-only styles
    if (!document.querySelector('style#sr-only-style')) {
        const srOnlyStyle = document.createElement('style');
        srOnlyStyle.id = 'sr-only-style';
        srOnlyStyle.textContent = `.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }`;
        document.head.appendChild(srOnlyStyle);
    }
});

// --- Core Navigation Functions ---
function setActiveNavLink() { const navLinks=document.querySelectorAll('#portal-nav-links li a'); if (!navLinks || navLinks.length===0) return; const currentPath=window.location.pathname; const currentPageFile=currentPath.substring(currentPath.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || 'index.html'; navLinks.forEach(link => { const linkHref=link.getAttribute('href'); if (!linkHref) return; const linkFile=linkHref.split('/').pop().split('?')[0].split('#')[0]; link.classList.remove('active'); if ((linkFile===currentPageFile) || (currentPageFile==='index.html' && (linkFile==='' || linkHref==='index.html'))) { link.classList.add('active'); } }); }
function attachNavToggle() { const toggleBtn=document.getElementById('portal-nav-toggle-btn'); const navMenu=document.getElementById('portal-nav'); if (!toggleBtn || !navMenu) { if (!toggleBtn) console.error("Nav toggle button not found."); if (!navMenu) console.error("Nav menu element not found."); return; } toggleBtn.addEventListener('click', (event) => { event.stopPropagation(); navMenu.classList.toggle('portal-nav-open'); const isExpanded=navMenu.classList.contains('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', isExpanded); }); navMenu.querySelectorAll('#portal-nav-links a').forEach(link => { link.addEventListener('click', () => { if (navMenu.classList.contains('portal-nav-open')) { navMenu.classList.remove('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', 'false'); } }); }); document.addEventListener('click', (event) => { const profileDropdownNav=document.getElementById('profileManagerNav'); let isClickInsideNav=navMenu.contains(event.target); let isClickInsideProfile=profileDropdownNav && profileDropdownNav.contains(event.target); if (navMenu.classList.contains('portal-nav-open') && !isClickInsideNav && !isClickInsideProfile) { navMenu.classList.remove('portal-nav-open'); toggleBtn.setAttribute('aria-expanded', 'false'); } }); }

// --- Profile Dropdown Setup ---
function setupProfileDropdown() {
    const dropdownButton = document.getElementById('profileDropdownButton');
    const dropdownContent = document.getElementById('profileDropdownContent');
    const currentProfileDisplay = document.getElementById('currentProfileDisplay');
    const profileListContainer = document.getElementById('profileListContainer');
    const createNewProfileBtn = document.getElementById('createNewProfileBtn');
    const manageProfilesBtn = document.getElementById('manageProfilesBtn');

    if (!dropdownButton || !dropdownContent || !currentProfileDisplay || !profileListContainer || !createNewProfileBtn || !manageProfilesBtn) { console.error("Profile dropdown elements not found!"); const profileManagerNav = document.getElementById('profileManagerNav'); if(profileManagerNav) profileManagerNav.style.display = 'none'; return; }

    function populateNavDropdownList() { profileListContainer.innerHTML = ''; const profiles = getProfileNames(); const currentProfile = getCurrentProfile(); currentProfileDisplay.textContent = currentProfile ? currentProfile : "No Profile"; currentProfileDisplay.title = currentProfile ? `Current Profile: ${currentProfile}` : "No profile selected"; if (profiles.length === 0) { profileListContainer.innerHTML = '<span class="no-profiles">No profiles yet.</span>'; } else { let hasOtherProfiles = false; profiles.forEach(name => { if (name !== currentProfile) { hasOtherProfiles = true; const link = document.createElement('a'); link.href = "#"; link.textContent = `Switch to ${name}`; link.dataset.profileName = name; link.addEventListener('click', handleProfileSwitch); profileListContainer.appendChild(link); } }); if (!hasOtherProfiles && currentProfile) { profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Only current profile exists.</span>'; } else if (profiles.length > 0 && !currentProfile){ profileListContainer.innerHTML = '<span class="no-profiles" style="cursor:default;">Select a profile</span>'; } } }
    function handleProfileSwitch(event) { event.preventDefault(); const profileName=event.target.dataset.profileName; if (profileName && profileName!==getCurrentProfile()) { setCurrentProfile(profileName); populateNavDropdownList(); dropdownContent.classList.remove('show'); dropdownButton.setAttribute('aria-expanded', 'false'); /* REMOVED alert */ window.location.reload(); } }
    createNewProfileBtn.addEventListener('click', (event) => { event.preventDefault(); openCreateProfileModal(); dropdownContent.classList.remove('show'); dropdownButton.setAttribute('aria-expanded', 'false'); });
    manageProfilesBtn.addEventListener('click', (event) => { event.preventDefault(); openManageProfilesModal(); dropdownContent.classList.remove('show'); dropdownButton.setAttribute('aria-expanded', 'false'); });
    dropdownButton.addEventListener('click', (event) => { event.stopPropagation(); populateNavDropdownList(); const isExpanded = dropdownContent.classList.toggle('show'); dropdownButton.setAttribute('aria-expanded', isExpanded); });
    document.addEventListener('click', (event) => { const profileManagerNav = document.getElementById('profileManagerNav'); if (profileManagerNav && !profileManagerNav.contains(event.target)) { if (dropdownContent.classList.contains('show')) { dropdownContent.classList.remove('show'); dropdownButton.setAttribute('aria-expanded', 'false'); } } });

    populateNavDropdownList(); // Initial populate
}

// --- Modal Creation & Handling Functions ---
function createModal(id, titleHtml, contentHtml, buttonsHtml) { closeAllModals(); const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.id = id; overlay.addEventListener('click', (event) => { if (event.target === overlay) closeAllModals(); }); const modalBox = document.createElement('div'); modalBox.className = 'modal-box'; modalBox.addEventListener('click', event => event.stopPropagation()); const title = document.createElement('h2'); title.innerHTML = titleHtml; modalBox.appendChild(title); const closeBtn = document.createElement('button'); closeBtn.className = 'modal-close-btn'; closeBtn.innerHTML = '&times;'; closeBtn.title = 'Close'; closeBtn.onclick = closeAllModals; modalBox.appendChild(closeBtn); const contentDiv = document.createElement('div'); contentDiv.className = 'modal-content'; contentDiv.innerHTML = contentHtml; modalBox.appendChild(contentDiv); let buttonsDiv = null; if(buttonsHtml){ buttonsDiv = document.createElement('div'); buttonsDiv.className = 'modal-buttons'; buttonsDiv.innerHTML = buttonsHtml; modalBox.appendChild(buttonsDiv); } overlay.appendChild(modalBox); document.body.appendChild(overlay); setTimeout(() => overlay.classList.add('show'), 10); return { overlay, modalBox, contentDiv, buttonsDiv }; }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(modal => { modal.classList.remove('show'); modal.addEventListener('transitionend', () => modal.remove(), { once: true }); }); }

// --- Create Profile Modal ---
function openCreateProfileModal() {
    const modalContent = `<div class="control-group"><label for="newProfileNameInput">New Profile Name:</label><input type="text" id="newProfileNameInput" placeholder="e.g., $MyAwesomeCoin" required><p id="createProfileError" class="modal-error-message" style="display:none;"></p></div>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="createCancelBtn">Cancel</button><button type="button" class="modal-button-confirm" id="createSaveBtn">Create & Switch</button>`;
    const { contentDiv, buttonsDiv } = createModal('createProfileModalOverlay', 'Create New Profile', modalContent, modalButtons);
    const inputField = contentDiv.querySelector('#newProfileNameInput'); const errorMsg = contentDiv.querySelector('#createProfileError'); const saveBtn = buttonsDiv.querySelector('#createSaveBtn'); const cancelBtn = buttonsDiv.querySelector('#createCancelBtn');
    inputField.focus();
    saveBtn.onclick = () => { errorMsg.textContent = ''; errorMsg.style.display = 'none'; const newName = inputField.value.trim(); if (!newName) { errorMsg.textContent = 'Profile name cannot be empty.'; errorMsg.style.display = 'block'; return; } if (createProfile(newName)) { setCurrentProfile(newName); /* REMOVED alert */ closeAllModals(); window.location.reload(); } else { errorMsg.textContent = `Failed to create profile "${newName}". It might already exist or be invalid.`; errorMsg.style.display = 'block'; } };
    inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') saveBtn.click(); });
    cancelBtn.onclick = closeAllModals;
}

// --- Manage Profiles Modal ---
function openManageProfilesModal() {
    const modalContent = `<p>Select a profile to delete it permanently.</p><ul class="modal-profile-list" id="modalProfileList"></ul>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="manageCloseBtn">Close</button>`;
    const { contentDiv, buttonsDiv } = createModal('manageProfilesModalOverlay', 'Manage Profiles', modalContent, modalButtons);
    const listElement = contentDiv.querySelector('#modalProfileList'); const closeBtn = buttonsDiv.querySelector('#manageCloseBtn');
    populateModalProfileList(listElement);
    closeBtn.onclick = closeAllModals;
}

// Populate list inside Manage modal
function populateModalProfileList(listElement) {
    listElement.innerHTML = ''; const profiles = getProfileNames();
    if (profiles.length === 0) { listElement.innerHTML = '<li class="no-profiles-message">No profiles to manage.</li>'; return; }
    profiles.forEach(name => { const item = document.createElement('li'); item.className = 'modal-profile-item'; const nameSpan = document.createElement('span'); nameSpan.textContent = name; item.appendChild(nameSpan); const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'modal-delete-btn'; deleteBtn.dataset.profileName = name; deleteBtn.addEventListener('click', () => { openConfirmDeleteModal(name); }); item.appendChild(deleteBtn); listElement.appendChild(item); });
}

// --- Confirm Delete Profile Modal ---
function openConfirmDeleteModal(profileNameToDelete) {
    const currentActiveProfile = getCurrentProfile();
    let message = `Permanently delete profile "<strong>${profileNameToDelete}</strong>"?<br><br>All associated data (website settings, etc.) will be lost. This cannot be undone.`;
     if (profileNameToDelete === currentActiveProfile) { message += "<br><br><strong>Warning: This is your currently active profile!</strong>"; }
    const modalContent = `<p>${message}</p><p id="deleteErrorMsg" class="modal-error-message" style="display:none;"></p>`;
    const modalButtons = `<button type="button" class="modal-button-cancel" id="deleteCancelBtn">Cancel</button><button type="button" class="modal-button-delete" id="deleteConfirmBtn">Delete Profile</button>`;
    const { contentDiv, buttonsDiv } = createModal('confirmDeleteModalOverlay', 'Confirm Deletion', modalContent, modalButtons);
    const confirmBtn = buttonsDiv.querySelector('#deleteConfirmBtn'); const cancelBtn = buttonsDiv.querySelector('#deleteCancelBtn'); const errorMsg = contentDiv.querySelector('#deleteErrorMsg');

    confirmBtn.onclick = () => {
        errorMsg.style.display = 'none';
         if (deleteProfile(profileNameToDelete)) {
             console.log(`Profile "${profileNameToDelete}" deleted via modal confirmation.`);
             // Refresh the Manage modal list IF it's still open (it will be closed by closeAllModals)
             // Instead, just refresh the main nav dropdown
             setupProfileDropdown();
             closeAllModals(); // Close this confirmation modal
             /* REMOVED alert */
             if (profileNameToDelete === currentActiveProfile) { window.location.reload(); } // Still reload if active deleted
         } else {
              errorMsg.textContent = `Failed to delete profile "${profileNameToDelete}".`;
              errorMsg.style.display = 'block';
         }
    };
    cancelBtn.onclick = closeAllModals;
}