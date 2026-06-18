/**
 * SLIDER & SCROLL RAIL MANAGER
 * Handles the Hero Banner slideshow and the horizontal card rails.
 */

const SliderManager = {
  // Hero Banner Interval
  heroInterval: null,
  heroCurrentSlide: 0,
  heroAutoPlayDuration: 6000, // 6 seconds

  /**
   * Initializes the Hero Banner Slideshow
   */
  initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('hero-nav-dots');
    
    if (slides.length === 0) return;
    
    // Clear any existing slideshow
    this.stopHeroSlider();
    dotsContainer.innerHTML = '';
    this.heroCurrentSlide = 0;
    
    // Create dots indicator
    slides.forEach((_, idx) => {
      const dot = document.createElement('button');
      dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
      dot.addEventListener('click', () => {
        this.goToHeroSlide(idx);
      });
      dotsContainer.appendChild(dot);
    });

    // Start auto-play
    this.startHeroSlider();
  },

  /**
   * Starts the automatic rotation of hero slides
   */
  startHeroSlider() {
    this.heroInterval = setInterval(() => {
      const slides = document.querySelectorAll('.hero-slide');
      if (slides.length === 0) return;
      
      let nextSlide = this.heroCurrentSlide + 1;
      if (nextSlide >= slides.length) {
        nextSlide = 0;
      }
      this.goToHeroSlide(nextSlide);
    }, this.heroAutoPlayDuration);
  },

  /**
   * Stops the slideshow autoplay
   */
  stopHeroSlider() {
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
      this.heroInterval = null;
    }
  },

  /**
   * Transitions to a specific slide by index
   * @param {number} index - Index of slide to show
   */
  goToHeroSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    
    if (slides.length === 0 || !slides[index]) return;
    
    // Remove active class
    slides[this.heroCurrentSlide].classList.remove('active');
    if (dots[this.heroCurrentSlide]) {
      dots[this.heroCurrentSlide].classList.remove('active');
    }
    
    // Update index
    this.heroCurrentSlide = index;
    
    // Add active class
    slides[this.heroCurrentSlide].classList.add('active');
    if (dots[this.heroCurrentSlide]) {
      dots[this.heroCurrentSlide].classList.add('active');
    }
  },

  /**
   * Attaches event listeners for horizontal card rail scroll buttons
   */
  initScrollRails() {
    const rows = document.querySelectorAll('.memory-row');
    
    rows.forEach(row => {
      const rail = row.querySelector('.row-rail');
      const leftArrow = row.querySelector('.left-arrow');
      const rightArrow = row.querySelector('.right-arrow');
      
      if (!rail || !leftArrow || !rightArrow) return;
      
      // Right Scroll Click
      rightArrow.addEventListener('click', () => {
        const scrollAmount = rail.clientWidth * 0.75; // Scroll 75% of the visible container width
        rail.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      });
      
      // Left Scroll Click
      leftArrow.addEventListener('click', () => {
        const scrollAmount = rail.clientWidth * 0.75;
        rail.scrollBy({
          left: -scrollAmount,
          behavior: 'smooth'
        });
      });

      // Show/Hide arrows depending on scroll boundaries (optional touch of class)
      const toggleArrows = () => {
        const isScrollable = rail.scrollWidth > rail.clientWidth;
        
        if (!isScrollable) {
          leftArrow.style.display = 'none';
          rightArrow.style.display = 'none';
          return;
        } else {
          leftArrow.style.display = '';
          rightArrow.style.display = '';
        }

        // Hide left arrow if at the very start
        if (rail.scrollLeft <= 5) {
          leftArrow.style.opacity = '0';
          leftArrow.style.pointerEvents = 'none';
        } else {
          leftArrow.style.opacity = '';
          leftArrow.style.pointerEvents = '';
        }

        // Hide right arrow if at the very end
        const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 5;
        if (atEnd) {
          rightArrow.style.opacity = '0';
          rightArrow.style.pointerEvents = 'none';
        } else {
          rightArrow.style.opacity = '';
          rightArrow.style.pointerEvents = '';
        }
      };

      // Register scroll listeners
      rail.addEventListener('scroll', () => {
        toggleArrows();
        if (typeof App !== 'undefined' && App.hideGlobalHoverCard) {
          App.hideGlobalHoverCard();
        }
      });
      window.addEventListener('resize', () => {
        toggleArrows();
        if (typeof App !== 'undefined' && App.hideGlobalHoverCard) {
          App.hideGlobalHoverCard();
        }
      });
      
      // Call once initially to set starting state
      // Timeout ensures flex contents have fully rendered
      setTimeout(toggleArrows, 100);
    });
  }
};
