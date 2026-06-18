/**
 * MAIN APP CONTROLLER
 * Coordinates state, fetches JSON data, manages views, filters search,
 * manages the lightbox detailed modal, and synthesizes the Netflix "Ta-dum" sound.
 */

const App = {
  memoriesData: [],
  profilesData: {},
  activeProfileId: null,
  favoritesList: new Set(), // Store user favorited memory IDs
  currentView: 'home', // 'home', 'memories', 'favorites'
  searchQuery: '',
  
  // Hover card state variables
  hoverTimeout: null,
  hideTimeout: null,
  transitionTimeout: null,
  currentHoveredCard: null,

  /**
   * Initializes the application
   */
  async init() {
    this.bindGlobalEvents();
    this.initGlobalHoverCard();
    
    try {
      // Fetch dynamic memory database
      const response = await fetch('data/memories.json');
      const data = await response.json();
      
      this.memoriesData = data.memories || [];
      this.profilesData = data.profiles || {};
      
      // Initialize profiles module
      ProfileManager.init(this.profilesData);
      
      // Run the automated Netflix Intro Strings animation
      this.runNetflixIntro();
      
      // Load favorites from local storage if available
      const savedFavs = localStorage.getItem('memoryFavorites');
      if (savedFavs) {
        this.favoritesList = new Set(JSON.parse(savedFavs));
        // Sync JSON data with local storage favorites
        this.memoriesData.forEach(m => {
          if (this.favoritesList.has(m.id)) {
            m.isFavorite = true;
          }
        });
      }
      
    } catch (error) {
      console.error('Failed to load memory data:', error);
      // Create fallback dummy profiles if JSON fetch fails
      this.loadFallbackData();
      // Run the automated intro even in fallback mode
      this.runNetflixIntro();
    }
  },

  /**
   * Binds layout triggers (Scroll headers, Search bars, Close buttons, and Modals)
   */
  bindGlobalEvents() {
    // 1. Header scroll fade
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
      if (header) {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
      this.hideGlobalHoverCard();
    });

    // Landing Screen triggers are now fully automated

    // 3. Navigation Bar Links
    const logoBtn = document.getElementById('nav-logo-btn');
    if (logoBtn) {
      logoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setView('home');
      });
    }

    const homeBtn = document.getElementById('nav-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setView('home');
      });
    }

    const memoriesBtn = document.getElementById('nav-memories');
    if (memoriesBtn) {
      memoriesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setView('memories');
      });
    }

    const favoritesBtn = document.getElementById('nav-favorites');
    if (favoritesBtn) {
      favoritesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.setView('favorites');
      });
    }

    const aboutBtn = document.getElementById('nav-about');
    if (aboutBtn) {
      aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openAboutModal();
      });
    }

    // About Close bindings
    const aboutCloseBtn = document.getElementById('about-close-btn');
    if (aboutCloseBtn) {
      aboutCloseBtn.addEventListener('click', () => this.closeAboutModal());
    }

    const aboutOkBtn = document.getElementById('about-ok-btn');
    if (aboutOkBtn) {
      aboutOkBtn.addEventListener('click', () => this.closeAboutModal());
    }

    const aboutModal = document.getElementById('about-modal');
    if (aboutModal) {
      aboutModal.addEventListener('click', (e) => {
        if (e.target.id === 'about-modal') this.closeAboutModal();
      });
    }

    // 4. Collapsible Search Bar controls
    const searchToggle = document.getElementById('search-toggle-btn');
    const searchBox = document.getElementById('search-box');
    const searchInput = document.getElementById('search-input');
    
    if (searchToggle && searchBox && searchInput) {
      searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        searchBox.classList.toggle('active');
        if (searchBox.classList.contains('active')) {
          searchInput.focus();
        } else {
          searchInput.value = '';
          this.handleSearch('');
        }
      });

      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });

      // Close search on clicking elsewhere
      document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target) && searchInput.value === '') {
          searchBox.classList.remove('active');
        }
      });
    }

    // 5. Lightbox Modal close handlers
    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeLightbox());
    }

    const lightboxModal = document.getElementById('lightbox-modal');
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox-modal') this.closeLightbox();
      });
    }

    // 6. Navigation Profile dropdown trigger
    const profileDropdown = document.getElementById('profile-dropdown');
    const trigger = document.getElementById('profile-menu-trigger');
    
    if (trigger && profileDropdown) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
      });
      
      document.addEventListener('click', () => {
        profileDropdown.classList.remove('open');
      });
    }

    // Logout Profile Click
    const logoutBtn = document.getElementById('logout-profile-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exitToProfileSelection();
      });
    }
  },

  /**
   * Automates the cinematic Netflix strings zoom-in animation
   */
  runNetflixIntro() {
    // Staggered transition to profile selection screen (at 2.0s after animation finishes)
    setTimeout(() => {
      if (window.landingTransitioned) return;
      window.landingTransitioned = true;
      
      const landing = document.getElementById('landing-screen');
      if (landing) landing.classList.add('fade-out-landing');
      
      const profileScreen = document.getElementById('profile-screen');
      if (profileScreen) profileScreen.classList.remove('hidden');

      // Clean up overlay entirely from DOM after visual fade completes
      setTimeout(() => {
        if (landing) landing.remove();
      }, 400);
    }, 2000);
  },





  /**
   * Called by ProfileManager when a profile is selected.
   * Handles transitioning layout and populating memory grids.
   * @param {string} profileId - ID of selected profile
   */
  onProfileChange(profileId) {
    this.activeProfileId = profileId;
    
    // UI Screen toggles
    document.getElementById('profile-screen').classList.add('hidden');
    document.getElementById('dashboard-screen').classList.remove('hidden');
    
    // Apply per-profile section row titles
    const profile = this.profilesData[profileId];
    if (profile && profile.sections && profile.sections.length === 3) {
      const rowTitles = document.querySelectorAll('.memory-row .row-title');
      rowTitles.forEach((el, i) => {
        if (profile.sections[i]) el.textContent = profile.sections[i];
      });
    }
    
    // Reset views and search input
    const searchInput = document.getElementById('search-input');
    const searchBox = document.getElementById('search-box');
    if (searchInput) searchInput.value = '';
    if (searchBox) searchBox.classList.remove('active');
    this.searchQuery = '';
    
    this.setView('home');
  },

  /**
   * Navigates back to profile choosing interface
   */
  exitToProfileSelection() {
    this.activeProfileId = null;
    SliderManager.stopHeroSlider();
    
    document.getElementById('dashboard-screen').classList.add('hidden');
    document.getElementById('profile-screen').classList.remove('hidden');
  },

  /**
   * Configures active view template displays
   * @param {string} viewName - 'home', 'memories', or 'favorites'
   */
  setView(viewName) {
    this.currentView = viewName;
    
    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    const activeLink = document.getElementById(`nav-${viewName}`);
    if (activeLink) activeLink.classList.add('active');
    
    // Reset search header
    document.getElementById('filter-header').classList.add('hidden');
    
    // Reset view panels depending on active page
    const heroBanner = document.getElementById('hero-banner');
    const homeRows = document.getElementById('home-rows-container');
    const gridView = document.getElementById('grid-view-container');
    
    // Render templates
    if (viewName === 'home') {
      heroBanner.classList.remove('hidden');
      if (homeRows) homeRows.classList.remove('hidden');
      if (gridView) {
        gridView.classList.add('hidden');
        gridView.innerHTML = '';
      }
      this.renderHeroBanner();
      this.renderRowsView();
    } else {
      heroBanner.classList.add('hidden');
      if (homeRows) homeRows.classList.add('hidden');
      if (gridView) gridView.classList.remove('hidden');
      this.renderGridView(viewName);
    }

    // Scroll to top of viewport
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Filters memories for the selected profile that are flagged as featured hero displays
   */
  renderHeroBanner() {
    const container = document.getElementById('hero-slides-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Filter by active profile AND isHero flag
    const heroItems = this.memoriesData.filter(m => m.profileId === this.activeProfileId && m.isHero);
    
    // Fallback: If no hero item exists for this profile, take first 3 memories
    const slides = heroItems.length > 0 ? heroItems : this.memoriesData.filter(m => m.profileId === this.activeProfileId).slice(0, 3);
    
    if (slides.length === 0) {
      container.innerHTML = `<div class="hero-overlay" style="background-color: var(--netflix-black)"></div>`;
      return;
    }
    
    slides.forEach((slide, idx) => {
      const slideEl = document.createElement('div');
      slideEl.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
      slideEl.setAttribute('data-index', idx);
      
      slideEl.innerHTML = `
        <img src="${slide.image}" alt="${slide.title}" class="hero-bg-img" loading="eager">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="hero-subtitle">${slide.subtitle || 'Featured Memory'}</span>
          <h1 class="hero-title">${slide.title}</h1>
          <p class="hero-description">${slide.description}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="App.openLightbox('${slide.id}')">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="margin-bottom: -4px;">
                <path d="M8 5v14l11-7z"/>
              </svg>
              View Memory
            </button>
            <button class="btn btn-secondary hero-fav-btn" data-id="${slide.id}">
              <span class="heart-symbol">${slide.isFavorite ? '❤️' : '♡'}</span>
              <span class="btn-txt">${slide.isFavorite ? 'Favorited' : 'Favorite'}</span>
            </button>
          </div>
        </div>
      `;
      
      // Bind slideshow favorite button click
      const favBtn = slideEl.querySelector('.hero-fav-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(slide.id);
      });
      
      container.appendChild(slideEl);
    });
    
    // Initialise slider loop
    SliderManager.initHeroSlider();
  },

  /**
   * Renders the 3 horizontal rails (Favorites, Best Moments, and Dusk & Dawn Collection)
   */
  renderRowsView() {
    const rowFavorites = document.getElementById('row-rail-favorites');
    const rowBest = document.getElementById('row-rail-best');
    const rowDuskDawn = document.getElementById('row-rail-dusk-dawn');
    
    // Clear rails
    rowFavorites.innerHTML = '';
    rowBest.innerHTML = '';
    rowDuskDawn.innerHTML = '';
    
    // Get all memories for this profile
    const profileMemories = this.memoriesData.filter(m => m.profileId === this.activeProfileId);
    
    // Separate by category
    const favorites = profileMemories.filter(m => m.isFavorite);
    const bestMoments = profileMemories.filter(m => m.category === 'best');
    const duskDawn = profileMemories.filter(m => m.category === 'duskAndDawn');

    // Populate and pad rows (Netflix rows feel better when full of cards, so we pad up to 10 dynamically)
    this.populateRow(rowFavorites, favorites, 'favorite');
    this.populateRow(rowBest, bestMoments, 'best');
    this.populateRow(rowDuskDawn, duskDawn, 'duskAndDawn');
    
    // Show/hide favorites row entirely depending on whether user has favorites
    const favSection = document.getElementById('row-favorites-section');
    if (favorites.length === 0) {
      favSection.classList.add('hidden');
    } else {
      favSection.classList.remove('hidden');
    }

    // Initialize scrolling chevrons and scroll tracking
    SliderManager.initScrollRails();
  },

  /**
   * Injects HTML memory cards into a row rail, adding fallback padding if total cards < 10
   */
  populateRow(railElement, items, category) {
    if (!railElement) return;
    
    let displayItems = [...items];
    
    if (displayItems.length === 0) {
      // If no items exist, generate 10 generic stylized placeholders based on category
      for (let i = 0; i < 10; i++) {
        displayItems.push({
          id: `placeholder-${category}-${i}`,
          title: `Memory Placeholder ${i + 1}`,
          shortDescription: `A beautiful moment waiting to be recorded.`,
          description: `Add descriptions dynamically by editing data/memories.json.`,
          date: `2026-06-${10 + i}`,
          image: `https://images.unsplash.com/photo-${1500000000000 + (i * 2000)}?auto=format&fit=crop&w=600&q=80`,
          category: category,
          isFavorite: false,
          isPlaceholder: true
        });
      }
    }

    displayItems.forEach(item => {
      const card = this.createCardElement(item);
      railElement.appendChild(card);
    });
  },

  /**
   * Generates a reusable HTML DocumentFragment Card Element
   * @param {Object} item - Memory object
   * @returns {HTMLElement} Card Element
   */
  createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card-item';
    card.setAttribute('data-id', item.id);
    
    const formattedDate = this.formatDate(item.date);
    
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img class="card-img" src="${item.image}" alt="${item.title}" loading="lazy">
      </div>
      <div class="card-hover-details">
        <div class="card-action-row">
          <div class="card-action-left">
            <button class="icon-circle-btn heart-btn ${item.isFavorite ? 'active-heart' : ''}" aria-label="Favorite">
              ${item.isFavorite ? '❤️' : '♡'}
            </button>
            <button class="icon-circle-btn expand-btn" aria-label="Expand image">
              &#10064;
            </button>
          </div>
          <button class="icon-circle-btn info-btn" aria-label="View info">
            &#8505;
          </button>
        </div>
        <div class="card-meta-row">
          <span class="card-date">${formattedDate}</span>
          <span class="card-quality-tag">HD</span>
        </div>
        <h3 class="card-title">${item.title}</h3>
        <p class="card-short-desc">${item.shortDescription}</p>
      </div>
    `;

    // Click triggers: Entire card, expand icon, and info icon opens detailed Lightbox
    card.addEventListener('click', (e) => {
      // Prevent card open if user clicks the Favorite Heart icon
      if (e.target.closest('.heart-btn')) return;
      this.openLightbox(item.id);
    });

    // Favorite heart button click handler
    const heartBtn = card.querySelector('.heart-btn');
    heartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(item.id);
    });

    // Hover triggers for global hover card
    card.addEventListener('mouseenter', () => {
      this.handleCardMouseEnter(card, item);
    });

    card.addEventListener('mouseleave', () => {
      this.handleCardMouseLeave(card);
    });

    return card;
  },

  /**
   * Renders the Memories or Favorites pages in a clean, responsive card grid layout
   * @param {string} type - 'memories' or 'favorites'
   */
  renderGridView(type) {
    const gridContainer = document.getElementById('grid-view-container');
    if (!gridContainer) return;
    
    // Hide default rows, inject grid layout
    gridContainer.innerHTML = '';
    
    const filterHeader = document.getElementById('filter-header');
    const filterTitle = document.getElementById('filter-results-title');
    const clearBtn = document.getElementById('clear-filter-btn');
    
    filterHeader.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
    
    let items = [];
    if (type === 'favorites') {
      filterTitle.textContent = 'My Favorites';
      items = this.memoriesData.filter(m => m.profileId === this.activeProfileId && m.isFavorite);
    } else {
      filterTitle.textContent = 'All Memories';
      items = this.memoriesData.filter(m => m.profileId === this.activeProfileId);
    }
    
    if (items.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'empty-grid-msg';
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '5rem 0';
      emptyMsg.style.color = 'var(--text-grey)';
      emptyMsg.innerHTML = `
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No memories here yet</h3>
        <p style="font-size: 0.95rem;">Mark items as favorites or add them to memories.json to populate this list.</p>
      `;
      gridContainer.appendChild(emptyMsg);
      return;
    }
    
    const gridEl = document.createElement('div');
    gridEl.className = 'results-grid';
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    gridEl.style.gap = '2rem 0.5rem';
    gridEl.style.padding = '0 4%';
    
    items.forEach(item => {
      const card = this.createCardElement(item);
      gridEl.appendChild(card);
    });
    
    gridContainer.appendChild(gridEl);
    
    // Clear Filter / Return back button
    clearBtn.onclick = () => this.setView('home');
  },

  /**
   * Filters memories dynamically in real time as the user searches
   * @param {string} query - Search query text
   */
  handleSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    
    const heroBanner = document.getElementById('hero-banner');
    const homeRows = document.getElementById('home-rows-container');
    const gridContainer = document.getElementById('grid-view-container');
    const filterHeader = document.getElementById('filter-header');
    const filterTitle = document.getElementById('filter-results-title');
    const clearBtn = document.getElementById('clear-filter-btn');
    
    if (this.searchQuery === '') {
      if (this.currentView === 'home') {
        this.setView('home');
      } else {
        this.renderGridView(this.currentView);
      }
      return;
    }
    
    // Hide hero slideshow when showing search results
    heroBanner.classList.add('hidden');
    if (homeRows) homeRows.classList.add('hidden');
    if (gridContainer) {
      gridContainer.classList.remove('hidden');
      gridContainer.innerHTML = '';
    }
    
    filterHeader.classList.remove('hidden');
    filterTitle.textContent = `Search results for: "${query}"`;
    clearBtn.classList.remove('hidden');
    
    // Filter active profile's memories matching title, subtitle, description, or date
    const matches = this.memoriesData.filter(m => {
      if (m.profileId !== this.activeProfileId) return false;
      return (
        m.title.toLowerCase().includes(this.searchQuery) ||
        (m.subtitle && m.subtitle.toLowerCase().includes(this.searchQuery)) ||
        m.description.toLowerCase().includes(this.searchQuery) ||
        m.date.includes(this.searchQuery)
      );
    });
    
    if (matches.length === 0) {
      const noResults = document.createElement('div');
      noResults.style.textAlign = 'center';
      noResults.style.padding = '6rem 0';
      noResults.style.color = 'var(--text-grey)';
      noResults.innerHTML = `
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No results found</h3>
        <p style="font-size: 0.95rem;">Try looking for other titles, keywords, or years.</p>
      `;
      if (gridContainer) gridContainer.appendChild(noResults);
      return;
    }
    
    // Render matching cards inside grid
    const gridEl = document.createElement('div');
    gridEl.className = 'results-grid';
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(220px, 1fr))';
    gridEl.style.gap = '2rem 0.5rem';
    gridEl.style.padding = '0 4%';
    
    matches.forEach(item => {
      const card = this.createCardElement(item);
      gridEl.appendChild(card);
    });
    
    if (gridContainer) gridContainer.appendChild(gridEl);
    
    clearBtn.onclick = () => {
      document.getElementById('search-input').value = '';
      document.getElementById('search-box').classList.remove('active');
      this.searchQuery = '';
      this.setView('home');
    };
  },

  /**
   * Toggles the favorite status of a specific memory ID and updates storage
   * @param {string} id - Core ID of memory card (handles padded indices)
   */
  toggleFavorite(id) {
    // Strip cloned suffixes (e.g. "2024-h1-pad-2" -> "2024-h1")
    const cleanId = id.split('-pad-')[0];
    
    const item = this.memoriesData.find(m => m.id === cleanId);
    if (!item) return;
    
    item.isFavorite = !item.isFavorite;
    
    if (item.isFavorite) {
      this.favoritesList.add(cleanId);
    } else {
      this.favoritesList.delete(cleanId);
    }
    
    // Save updated favorites set to localStorage
    localStorage.setItem('memoryFavorites', JSON.stringify(Array.from(this.favoritesList)));
    
    // Proactively sync and reflect this toggled favorite across all views and layouts
    
    // Update card displays on page (sync hearts)
    document.querySelectorAll(`.card-item`).forEach(card => {
      const cardId = card.getAttribute('data-id');
      const cleanCardId = cardId.split('-pad-')[0];
      
      if (cleanCardId === cleanId) {
        const heart = card.querySelector('.heart-btn');
        if (heart) {
          if (item.isFavorite) {
            heart.classList.add('active-heart');
            heart.innerHTML = '❤️';
          } else {
            heart.classList.remove('active-heart');
            heart.innerHTML = '♡';
          }
        }
      }
    });

    // Update Hero slider displays if matching
    document.querySelectorAll('.hero-slide').forEach(slide => {
      const viewBtn = slide.querySelector('.hero-fav-btn');
      if (viewBtn && viewBtn.getAttribute('data-id') === cleanId) {
        const heartSymbol = viewBtn.querySelector('.heart-symbol');
        const btnTxt = viewBtn.querySelector('.btn-txt');
        if (item.isFavorite) {
          heartSymbol.textContent = '❤️';
          btnTxt.textContent = 'Favorited';
        } else {
          heartSymbol.textContent = '♡';
          btnTxt.textContent = 'Favorite';
        }
      }
    });

    // Synchronize Lightbox Modal if active
    const modal = document.getElementById('lightbox-modal');
    if (!modal.classList.contains('hidden')) {
      const favBtn = document.getElementById('modal-favorite-btn');
      if (favBtn && favBtn.getAttribute('data-active-id') === cleanId) {
        const text = document.getElementById('modal-favorite-text');
        const heart = favBtn.querySelector('.heart-icon');
        if (item.isFavorite) {
          heart.textContent = '❤️';
          text.textContent = 'Remove Favorite';
        } else {
          heart.textContent = '♡';
          text.textContent = 'Add to Favorites';
        }
      }
    }
    
    // Update global hover card if active and matching
    const hoverCard = document.getElementById('global-hover-card');
    if (hoverCard && !hoverCard.classList.contains('hidden')) {
      const activeId = hoverCard.getAttribute('data-active-id');
      const cleanActiveId = activeId ? activeId.split('-pad-')[0] : null;
      if (cleanActiveId === cleanId) {
        const hoverAddBtn = document.getElementById('hover-add-btn');
        if (hoverAddBtn) {
          if (item.isFavorite) {
            hoverAddBtn.classList.add('active-add');
            hoverAddBtn.innerHTML = '✓';
            hoverAddBtn.setAttribute('aria-label', 'Remove from Favorites');
          } else {
            hoverAddBtn.classList.remove('active-add');
            hoverAddBtn.innerHTML = '+';
            hoverAddBtn.setAttribute('aria-label', 'Add to Favorites');
          }
        }
      }
    }

    // If viewing Favorites grid tab, reload display instantly
    if (this.currentView === 'favorites' && this.searchQuery === '') {
      this.renderGridView('favorites');
    }
    
    // Reload main rows to handle Favorite row insertion/deletion dynamically
    if (this.currentView === 'home' && this.searchQuery === '') {
      this.renderRowsView();
      // Hide hover card since the hovered card might have been re-rendered or removed from the favorites rail
      this.hideGlobalHoverCard();
    }
  },

  /**
   * Opens the full-screen Detail Lightbox for a given memory card
   * @param {string} id - Core ID of memory card
   */
  openLightbox(id) {
    const cleanId = id.split('-pad-')[0];
    const item = this.memoriesData.find(m => m.id === cleanId);
    if (!item) return;
    
    document.body.classList.add('modal-open');
    
    const modal = document.getElementById('lightbox-modal');
    
    // Inject values
    document.getElementById('modal-img').src = item.image;
    document.getElementById('modal-title').textContent = item.title;
    document.getElementById('modal-subtitle').textContent = item.subtitle || 'Memory Details';
    document.getElementById('modal-date').textContent = this.formatDate(item.date);
    document.getElementById('modal-description').textContent = item.description;
    
    // Categories display strings
    let categoryDisplay = 'Best Moments';
    if (item.category === 'favorite') categoryDisplay = 'Favorite Memories';
    else if (item.category === 'duskAndDawn') categoryDisplay = 'Dusk & Dawn Collection';
    document.getElementById('modal-category-text').textContent = categoryDisplay;
    
    // Profile display badge
    const profileBadge = document.getElementById('modal-profile-badge');
    const profileName = this.profilesData[item.profileId] ? this.profilesData[item.profileId].name : 'Album';
    profileBadge.textContent = profileName;
    
    // Setup favorite button
    const favBtn = document.getElementById('modal-favorite-btn');
    const favText = document.getElementById('modal-favorite-text');
    const heartIcon = favBtn.querySelector('.heart-icon');
    
    favBtn.setAttribute('data-active-id', cleanId);
    
    if (item.isFavorite) {
      heartIcon.textContent = '❤️';
      favText.textContent = 'Remove Favorite';
    } else {
      heartIcon.textContent = '♡';
      favText.textContent = 'Add to Favorites';
    }
    
    // Clear previous event listener mappings to prevent stack overflow leaks
    const newFavBtn = favBtn.cloneNode(true);
    favBtn.parentNode.replaceChild(newFavBtn, favBtn);
    
    newFavBtn.addEventListener('click', () => {
      this.toggleFavorite(cleanId);
    });
    
    modal.classList.remove('hidden');
  },

  /**
   * Closes the detailed Lightbox Modal
   */
  closeLightbox() {
    document.body.classList.remove('modal-open');
    document.getElementById('lightbox-modal').classList.add('hidden');
  },

  /**
   * UI Triggers for opening About modal
   */
  openAboutModal() {
    document.body.classList.add('modal-open');
    document.getElementById('about-modal').classList.remove('hidden');
  },

  /**
   * UI Triggers for closing About modal
   */
  closeAboutModal() {
    document.body.classList.remove('modal-open');
    document.getElementById('about-modal').classList.add('hidden');
  },

  /**
   * Initializes the global hover card events
   */
  initGlobalHoverCard() {
    const hoverCard = document.getElementById('global-hover-card');
    if (!hoverCard) return;

    // Mouse entering the hover card keeps it open
    hoverCard.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });

    // Mouse leaving the hover card starts the hide timer
    hoverCard.addEventListener('mouseleave', () => {
      this.hideTimeout = setTimeout(() => {
        this.hideGlobalHoverCard();
      }, 300);
    });

    // Play button inside global hover card (View Memory)
    const playBtn = document.getElementById('hover-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeId = hoverCard.getAttribute('data-active-id');
        if (activeId) {
          this.hideGlobalHoverCard();
          this.openLightbox(activeId);
        }
      });
    }

    // Add button inside global hover card (Favorite toggle)
    const addBtn = document.getElementById('hover-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeId = hoverCard.getAttribute('data-active-id');
        if (activeId) {
          this.toggleFavorite(activeId);
        }
      });
    }

    // Like button inside global hover card
    const likeBtn = document.getElementById('hover-like-btn');
    if (likeBtn) {
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        likeBtn.classList.toggle('active-like');
      });
    }

    // Expand button (down chevron) inside global hover card
    const expandBtn = document.getElementById('hover-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const activeId = hoverCard.getAttribute('data-active-id');
        if (activeId) {
          this.hideGlobalHoverCard();
          this.openLightbox(activeId);
        }
      });
    }

    // Clicking on the hover card image opens the Lightbox
    const imgWrapper = hoverCard.querySelector('.hover-card-img-wrapper');
    if (imgWrapper) {
      imgWrapper.style.cursor = 'pointer';
      imgWrapper.addEventListener('click', () => {
        const activeId = hoverCard.getAttribute('data-active-id');
        if (activeId) {
          this.hideGlobalHoverCard();
          this.openLightbox(activeId);
        }
      });
    }
  },

  /**
   * Handle mouse enter on a card
   */
  handleCardMouseEnter(cardEl, item) {
    if (window.innerWidth <= 768) return; // Disable hover cards on mobile/tablets
    if (item.isPlaceholder) return; // Don't show hover cards for placeholder slots

    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    this.currentHoveredCard = cardEl;

    // Small delay to make sure the user wants to hover, avoiding erratic pops
    this.hoverTimeout = setTimeout(() => {
      this.showGlobalHoverCard(cardEl, item);
    }, 400);
  },

  /**
   * Handle mouse leave on a card
   */
  handleCardMouseLeave(cardEl) {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    this.hideTimeout = setTimeout(() => {
      this.hideGlobalHoverCard();
    }, 300);
  },

  /**
   * Position and display the global hover card
   */
  showGlobalHoverCard(cardEl, item) {
    const hoverCard = document.getElementById('global-hover-card');
    if (!hoverCard) return;

    // 1. Populate details
    const hoverImg = document.getElementById('hover-img');
    const hoverTitle = document.getElementById('hover-title');
    const hoverDesc = document.getElementById('hover-desc');
    const hoverDate = document.getElementById('hover-date');
    const hoverAddBtn = document.getElementById('hover-add-btn');
    const hoverMatch = document.getElementById('hover-match');
    const hoverProfileTag = document.getElementById('hover-profile-tag');
    const hoverTags = document.getElementById('hover-tags');

    if (hoverImg) hoverImg.src = item.image;
    if (hoverTitle) hoverTitle.textContent = item.title;
    if (hoverDesc) hoverDesc.textContent = item.shortDescription || item.description;

    // Format date as "Month Day" (e.g. "Jul 12")
    if (hoverDate) {
      const dateParts = item.date.split('-');
      if (dateParts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[parseInt(dateParts[1]) - 1];
        const day = parseInt(dateParts[2]);
        hoverDate.textContent = `${month} ${day}`;
      } else {
        hoverDate.textContent = item.date;
      }
    }

    // Sync match score
    if (hoverMatch) {
      let score = 95;
      if (item.isFavorite && item.isHero) {
        score = 99;
      } else if (item.isFavorite) {
        score = 98;
      } else if (item.isHero) {
        score = 96;
      } else {
        score = 90 + (item.title.length % 8);
      }
      hoverMatch.textContent = `${score}% Match`;
    }

    // Profile outline badge
    if (hoverProfileTag) {
      const profileName = this.profilesData[item.profileId] ? this.profilesData[item.profileId].name : 'Album';
      hoverProfileTag.textContent = profileName;
    }

    // Tags list separated by bullets
    if (hoverTags) {
      hoverTags.innerHTML = '';
      
      let tags = [];
      if (item.category === 'favorite') {
        tags = ['Nostalgic', 'Heartwarming', 'Favorites'];
      } else if (item.category === 'best') {
        tags = ['Adventure', 'Happy Moments', 'Best Moments'];
      } else {
        tags = ['Scenic', 'Peaceful', 'Dusk & Dawn'];
      }
      
      tags.forEach((tag, idx) => {
        const tagSpan = document.createElement('span');
        tagSpan.textContent = tag;
        hoverTags.appendChild(tagSpan);
        
        if (idx < tags.length - 1) {
          const bullet = document.createElement('span');
          bullet.className = 'hover-tag-bullet';
          bullet.innerHTML = ' &bull; ';
          hoverTags.appendChild(bullet);
        }
      });
    }

    // Sync favorite checkmark button state
    if (hoverAddBtn) {
      if (item.isFavorite) {
        hoverAddBtn.classList.add('active-add');
        hoverAddBtn.innerHTML = '✓';
        hoverAddBtn.setAttribute('aria-label', 'Remove from Favorites');
      } else {
        hoverAddBtn.classList.remove('active-add');
        hoverAddBtn.innerHTML = '+';
        hoverAddBtn.setAttribute('aria-label', 'Add to Favorites');
      }
    }

    hoverCard.setAttribute('data-active-id', item.id);

    // 2. Position the card precisely over the hovered item
    const rect = cardEl.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Apply exact dimensions of the hovered item
    hoverCard.style.width = `${rect.width}px`;
    hoverCard.style.top = `${rect.top + scrollTop}px`;
    hoverCard.style.left = `${rect.left + scrollLeft}px`;

    // 3. Smart positioning boundaries (avoid clipping at viewport edges)
    const viewportWidth = window.innerWidth;
    const hoverCardScaledWidth = rect.width * 1.35; // scales 1.35x
    const overflowOffset = (hoverCardScaledWidth - rect.width) / 2;

    let transformOrigin = 'center center';
    
    // Check if card is on the left edge or right edge of viewport
    if (rect.left < overflowOffset + 15) {
      transformOrigin = 'left center';
    } else if (viewportWidth - rect.right < overflowOffset + 15) {
      transformOrigin = 'right center';
    }

    hoverCard.style.transformOrigin = transformOrigin;

    // 4. Activate the card
    hoverCard.classList.remove('hidden');
    // Force browser reflow to trigger transition
    hoverCard.offsetHeight; 
    hoverCard.classList.add('active');
  },

  /**
   * Hide the global hover card
   */
  hideGlobalHoverCard() {
    const hoverCard = document.getElementById('global-hover-card');
    if (!hoverCard) return;

    hoverCard.classList.remove('active');
    
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    
    // Hide completely after opacity transition finishes (200ms)
    this.transitionTimeout = setTimeout(() => {
      if (!hoverCard.classList.contains('active')) {
        hoverCard.classList.add('hidden');
      }
      this.transitionTimeout = null;
    }, 200);

    this.currentHoveredCard = null;
  },

  /**
   * Simple helper to format dates from YYYY-MM-DD to "Month Day, Year"
   * @param {string} dateString - "YYYY-MM-DD"
   * @returns {string} Human readable formatted date
   */
  formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    return `${monthNames[monthIndex]} ${day}, ${year}`;
  },

  /**
   * Fallback data in case memories.json is missing or fails compilation
   */
  loadFallbackData() {
    this.profilesData = {
      "2024": { "id": "2024", "name": "2024", "avatar": "assets/profiles/2024.svg", "accentColor": "#e50914" },
      "2025": { "id": "2025", "name": "2025", "avatar": "assets/profiles/2025.svg", "accentColor": "#ff6b6b" },
      "2026": { "id": "2026", "name": "2026", "avatar": "assets/profiles/2026.svg", "accentColor": "#4dadf7" },
      "duskAndDawn": { "id": "duskAndDawn", "name": "Dusk & Dawn", "avatar": "assets/profiles/duskAndDawn.svg", "accentColor": "#fcc419" }
    };
    
    // Basic placeholder memories structure
    this.memoriesData = [];
    Object.keys(this.profilesData).forEach(pId => {
      for (let i = 1; i <= 10; i++) {
        this.memoriesData.push({
          id: `${pId}-${i}`,
          profileId: pId,
          title: `Memory Slide ${i}`,
          subtitle: `Year ${pId} Collection`,
          description: `This is a fallback placeholder entry for your memories.`,
          shortDescription: `Dynamic placeholder memory.`,
          date: `2026-06-${i.toString().padStart(2, '0')}`,
          image: `https://images.unsplash.com/photo-${1500000000000 + (i * 200000)}?auto=format&fit=crop&w=600&q=80`,
          category: i <= 3 ? 'favorite' : (i <= 7 ? 'best' : 'duskAndDawn'),
          isHero: i === 1,
          isFavorite: i === 1
        });
      }
    });
    
    ProfileManager.init(this.profilesData);
  }
};

// Initialize Application once Document Object Model is fully parsed
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
