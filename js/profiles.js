/**
 * PROFILE MANAGER
 * Handles rendering the profiles grid, selecting profiles, and toggling active profiles.
 */

const ProfileManager = {
  activeProfile: null,
  profilesData: {},

  /**
   * Initializes profiles list and displays profile selection screen
   * @param {Object} profiles - Profiles object from memories.json
   */
  init(profiles) {
    this.profilesData = profiles;
    this.renderProfileChooser();
    this.renderHeaderDropdown();
  },

  /**
   * Renders profiles inside the profile selection screen
   */
  renderProfileChooser() {
    const grid = document.getElementById('profile-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    Object.values(this.profilesData).forEach(profile => {
      const card = document.createElement('div');
      card.className = 'profile-card';
      card.setAttribute('data-id', profile.id);
      
      card.innerHTML = `
        <div class="profile-avatar-container" style="box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);">
          <!-- Dynamic SVG/Image Load -->
          <img src="${profile.avatar}" alt="${profile.name}" class="profile-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%23e50914\\'/><text x=\\'50%\\' y=\\'55%\\' font-size=\\'40\\' fill=\\'white\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\'>M</text></svg>'">
        </div>
        <span class="profile-name">${profile.name}</span>
      `;
      
      card.addEventListener('click', () => {
        this.selectProfile(profile.id);
      });
      
      grid.appendChild(card);
    });
  },

  /**
   * Renders the profiles list inside the navigation bar dropdown
   */
  renderHeaderDropdown() {
    const dropdownList = document.getElementById('dropdown-profile-list');
    if (!dropdownList) return;
    
    dropdownList.innerHTML = '';
    
    Object.values(this.profilesData).forEach(profile => {
      // Don't show currently active profile in list (optional, but standard Netflix has switcher)
      const item = document.createElement('a');
      item.href = '#';
      item.className = 'dropdown-item';
      item.setAttribute('data-id', profile.id);
      
      item.innerHTML = `
        <img src="${profile.avatar}" alt="${profile.name}" class="dropdown-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><rect width=\\'100\\' height=\\'100\\' fill=\\'%23e50914\\'/><text x=\\'50%\\' y=\\'55%\\' font-size=\\'40\\' fill=\\'white\\' text-anchor=\\'middle\\' font-family=\\'sans-serif\\'>M</text></svg>'">
        <span>${profile.name}</span>
      `;
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.selectProfile(profile.id);
        // Close dropdown
        document.getElementById('profile-dropdown').classList.remove('open');
      });
      
      dropdownList.appendChild(item);
    });
  },

  /**
   * Selects a profile and transition to the main dashboard
   * @param {string} profileId - ID of selected profile
   */
  selectProfile(profileId) {
    const profile = this.profilesData[profileId];
    if (!profile) return;
    
    this.activeProfile = profile;
    
    // Save to localStorage so it is remembered (optional)
    localStorage.setItem('activeProfileId', profileId);
    
    // Update navbar avatar
    const navAvatar = document.getElementById('nav-profile-avatar');
    if (navAvatar) {
      navAvatar.src = profile.avatar;
      navAvatar.alt = profile.name;
    }
    
    // Dynamic Accent Color (e.g. Red, Cyan, Yellow, etc.)
    document.documentElement.style.setProperty('--netflix-red', profile.accentColor || '#e50914');
    document.documentElement.style.setProperty('--netflix-red-hover', this.lightenDarkenColor(profile.accentColor || '#e50914', -30));

    // Notify main app that a profile was selected
    if (typeof App !== 'undefined' && App.onProfileChange) {
      App.onProfileChange(profileId);
    }
  },

  /**
   * Helper function to darken/lighten Hex color dynamically
   */
  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] == "#") {
      col = col.slice(1);
      usePound = true;
    }
    let num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }
};
