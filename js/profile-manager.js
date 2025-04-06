// js/profile-manager.js

const PROFILE_STORAGE_KEY = 'memePortalProfiles';
const CURRENT_PROFILE_KEY = 'memePortalCurrentProfile';

/**
 * Initializes the profile system. Creates default structure if none exists.
 * @returns {string|null} The name of the initially active profile.
 */
function initProfileManager() {
    const profiles = getAllProfilesData();
    let currentProfile = localStorage.getItem(CURRENT_PROFILE_KEY);

    if (!currentProfile || !profiles[currentProfile]) {
        // If no valid current profile, try to set the first one or null
        const profileNames = Object.keys(profiles);
        if (profileNames.length > 0) {
            currentProfile = profileNames[0];
            setCurrentProfile(currentProfile);
        } else {
            // No profiles exist yet
            currentProfile = null;
            localStorage.removeItem(CURRENT_PROFILE_KEY);
        }
    }
    console.log("Profile Manager Initialized. Current Profile:", currentProfile);
    return currentProfile;
}

/**
 * Gets the entire profiles object from localStorage.
 * @returns {object} The profiles object, or an empty object if none exists/error.
 */
function getAllProfilesData() {
    try {
        const storedData = localStorage.getItem(PROFILE_STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        console.error("Error reading profiles from localStorage:", e);
        return {}; // Return empty object on error
    }
}

/**
 * Saves the entire profiles object to localStorage.
 * @param {object} profilesData The complete profiles data object.
 * @returns {boolean} True if successful, false otherwise.
 */
function saveAllProfilesData(profilesData) {
    try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profilesData));
        return true;
    } catch (e) {
        console.error("Error saving profiles to localStorage:", e);
        // Potentially notify the user if storage is full
        if (e.name === 'QuotaExceededError') {
            alert("Error: Could not save profile data. Local storage might be full.");
        }
        return false;
    }
}

/**
 * Gets the name of the currently active profile.
 * @returns {string|null} The name of the current profile, or null if none is active.
 */
function getCurrentProfile() {
    return localStorage.getItem(CURRENT_PROFILE_KEY);
}

/**
 * Sets the currently active profile.
 * @param {string|null} profileName The name of the profile to set as active, or null to clear.
 */
function setCurrentProfile(profileName) {
    if (profileName) {
        localStorage.setItem(CURRENT_PROFILE_KEY, profileName);
    } else {
        localStorage.removeItem(CURRENT_PROFILE_KEY);
    }
    console.log("Current profile set to:", profileName);
}

/**
 * Gets a list of all profile names.
 * @returns {string[]} An array of profile names.
 */
function getProfileNames() {
    const profiles = getAllProfilesData();
    return Object.keys(profiles);
}

/**
 * Creates a new profile with default empty data.
 * @param {string} profileName The name for the new profile. Must be unique and non-empty.
 * @returns {boolean} True if successful, false otherwise (e.g., name exists, invalid name).
 */
function createProfile(profileName) {
    if (!profileName || typeof profileName !== 'string' || profileName.trim().length === 0) {
        alert("Profile name cannot be empty.");
        return false;
    }
    profileName = profileName.trim(); // Trim whitespace

    const profiles = getAllProfilesData();
    if (profiles[profileName]) {
        alert(`Profile "${profileName}" already exists.`);
        return false;
    }

    profiles[profileName] = {
        websiteSettings: {}, // Initialize with empty objects/arrays
        resizedImages: [],   // Placeholder for potential future use (metadata, not blobs)
        stickerImages: [],   // Placeholder for potential future use (metadata, not blobs)
        createdAt: new Date().toISOString()
    };

    if (saveAllProfilesData(profiles)) {
        console.log("Profile created:", profileName);
        return true;
    }
    return false;
}

/**
 * Deletes a profile.
 * @param {string} profileName The name of the profile to delete.
 * @returns {boolean} True if successful, false otherwise.
 */
function deleteProfile(profileName) {
    const profiles = getAllProfilesData();
    if (!profiles[profileName]) {
        console.warn(`Profile "${profileName}" not found for deletion.`);
        return false;
    }

    delete profiles[profileName];

    if (saveAllProfilesData(profiles)) {
        console.log("Profile deleted:", profileName);
        // If the deleted profile was the current one, clear the current profile setting
        if (getCurrentProfile() === profileName) {
            setCurrentProfile(null); // Or set to another profile if desired
        }
        return true;
    }
    return false;
}

/**
 * Gets the data object for a specific profile.
 * @param {string} profileName The name of the profile.
 * @returns {object|null} The profile's data object, or null if the profile doesn't exist.
 */
function getProfileData(profileName) {
    if (!profileName) profileName = getCurrentProfile(); // Use current if none specified
    if (!profileName) return null; // No profile active/specified

    const profiles = getAllProfilesData();
    return profiles[profileName] || null;
}

/**
 * Saves specific data under a key for the currently active profile.
 * @param {string} dataKey The key for the data (e.g., 'websiteSettings', 'resizedImages').
 * @param {*} dataValue The data to save.
 * @returns {boolean} True if successful, false otherwise.
 */
function saveDataForCurrentProfile(dataKey, dataValue) {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) {
        console.error("Cannot save data: No active profile selected.");
        alert("Please select or create a profile first.");
        return false;
    }
    return saveDataForProfile(currentProfile, dataKey, dataValue);
}


/**
 * Saves specific data under a key for a specific profile.
 * @param {string} profileName The name of the profile.
 * @param {string} dataKey The key for the data (e.g., 'websiteSettings', 'resizedImages').
 * @param {*} dataValue The data to save.
 * @returns {boolean} True if successful, false otherwise.
 */
function saveDataForProfile(profileName, dataKey, dataValue) {
    const profiles = getAllProfilesData();
    if (!profiles[profileName]) {
        console.error(`Cannot save data: Profile "${profileName}" not found.`);
        return false;
    }

    // Ensure the profile object exists
    if (!profiles[profileName]) {
        profiles[profileName] = {}; // Should not happen if createProfile was used, but safety check
    }

    profiles[profileName][dataKey] = dataValue;

    return saveAllProfilesData(profiles);
}

/**
 * Gets the data object for the currently active profile.
 * @returns {object|null} The current profile's data object, or null if none active.
 */
function getCurrentProfileData() {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) return null;
    return getProfileData(currentProfile); // Uses existing function
}
// Example of how a tool would load its data:
// const currentProfile = getCurrentProfile();
// if (currentProfile) {
//     const profileData = getProfileData(currentProfile);
//     if (profileData && profileData.websiteSettings) {
//         // Load settings...
//         console.log("Loaded website settings for", currentProfile, profileData.websiteSettings);
//     } else {
//         // No settings saved for this profile yet...
//     }
// } else {
//     // No profile selected... prompt user?
// }

// Example of how a tool would save data:
// const settingsToSave = { theme: 'dark', title: 'My Coin' };
// saveDataForCurrentProfile('websiteSettings', settingsToSave);