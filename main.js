function initDynamicCurrentYear() {  
  const currentYear = new Date().getFullYear();
  const currentYearElements = document.querySelectorAll('[data-current-year]');
  currentYearElements.forEach(currentYearElement => {
    currentYearElement.textContent = currentYear;
  });
}

function initCSSMarquee() {
  const pixelsPerSecond = 75; // Set the marquee speed (pixels per second)
  const marquees = document.querySelectorAll('[data-css-marquee]');
  
  // Duplicate each [data-css-marquee-list] element inside its container
  marquees.forEach(marquee => {
    marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
      const duplicate = list.cloneNode(true);
      marquee.appendChild(duplicate);
    });
  });

  // Create an IntersectionObserver to check if the marquee container is in view
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.querySelectorAll('[data-css-marquee-list]').forEach(list => 
        list.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused'
      );
    });
  }, { threshold: 0 });
  
  // Calculate the width and set the animation duration accordingly
  marquees.forEach(marquee => {
    marquee.querySelectorAll('[data-css-marquee-list]').forEach(list => {
      list.style.animationDuration = (list.offsetWidth / pixelsPerSecond) + 's';
      list.style.animationPlayState = 'paused';
    });
    observer.observe(marquee);
  });
}

function initAccordionCSS() {
  document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    accordion.addEventListener('click', (event) => {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return; // Exit if the clicked element is not a toggle

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return; // Exit if no accordion container is found

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');
      
      // When [data-accordion-close-siblings="true"]
      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    });
  });
}

function initSwiperSlider() {
  const swiperSliderGroups = document.querySelectorAll('[data-swiper-group]');

  // Breakpoints: base (mobile), then min-widths. Suffixes match the attribute names
  const breakpoints = [
    { suffix: '', minWidth: 0 },
    { suffix: '-tablet', minWidth: 480 },
    { suffix: '-desktop', minWidth: 992 }
  ];

  // Converts "24", "24px" or "1.5rem" into pixels for Swiper's spaceBetween
  const toPx = (value) => {
    if (value.endsWith('rem')) {
      return parseFloat(value) * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    return parseFloat(value) || 0;
  };

  // Settings that can be set per slider, with the current defaults as fallbacks
  const settings = {
    slidesPerView: {
      attr: 'data-swiper-slides',
      parse: (v) => (v === 'auto' ? 'auto' : parseFloat(v)),
      fallback: [1.2, 1.8, 3.5]
    },
    spaceBetween: {
      attr: 'data-swiper-gap',
      parse: toPx,
      fallback: [0, 0, 0]
    },
    centeredSlides: {
      attr: 'data-swiper-centered',
      parse: (v) => v === 'true',
      fallback: [false, false, false]
    }
  };

  swiperSliderGroups.forEach((swiperGroup) => {
    const swiperSliderWrap = swiperGroup.querySelector('[data-swiper-wrap]');
    if (!swiperSliderWrap) return;

    const prevButton = swiperGroup.querySelector('[data-swiper-prev]');
    const nextButton = swiperGroup.querySelector('[data-swiper-next]');
    const paginationEl = swiperGroup.querySelector('.swiper-pagination');

    // Build the options for each breakpoint.
    // A breakpoint you don't set inherits from the one below it (desktop → tablet → base)
    const config = breakpoints.map(() => ({}));

    Object.entries(settings).forEach(([option, { attr, parse, fallback }]) => {
      let inherited = null;

      breakpoints.forEach(({ suffix }, i) => {
        const raw = swiperGroup.getAttribute(attr + suffix);
        const hasValue = raw !== null && raw.trim() !== '';
        const value = hasValue ? parse(raw.trim()) : (inherited !== null ? inherited : fallback[i]);

        if (hasValue) inherited = value;
        config[i][option] = value;
      });
    });

    const [base, tablet, desktop] = config;
    const speed = parseFloat(swiperGroup.getAttribute('data-swiper-speed')) || 600;
    
    // Remove Webflow's CMS list role so Swiper's carousel roles are valid
    const listWrapper = swiperSliderWrap.querySelector('.swiper-wrapper');
    if (listWrapper) {
      listWrapper.removeAttribute('role');
      listWrapper.querySelectorAll(':scope > [role="listitem"]').forEach((slide) => {
        slide.removeAttribute('role');
      });
    }

    // Infinite loop: data-swiper-loop="true"
    const loop = swiperGroup.getAttribute('data-swiper-loop') === 'true';

    // Starting slide: data-swiper-start="2" (counts from 1, like you'd read it in Webflow)
    const startSlide = Math.max(0, (parseInt(swiperGroup.getAttribute('data-swiper-start'), 10) || 1) - 1);

    // Loop mode needs more slides than are visible at once. If there aren't enough,
    // duplicate the full set (keeping the order) until there are
    if (loop) {
      const wrapper = swiperSliderWrap.querySelector('.swiper-wrapper');
      const originals = Array.from(wrapper.children);
      const maxPerView = Math.max(
        ...config.map((c) => (c.slidesPerView === 'auto' ? originals.length : Math.ceil(c.slidesPerView)))
      );
      const needed = maxPerView * 2 + (config.some((c) => c.centeredSlides) ? 1 : 0);

      while (originals.length && wrapper.children.length < needed) {
        originals.forEach((slide) => {
          const clone = slide.cloneNode(true);
          clone.setAttribute('data-swiper-duplicate', '');
          wrapper.appendChild(clone);
        });
      }
    }

    const swiper = new Swiper(swiperSliderWrap, {
      ...base,
      speed,
      loop,
      initialSlide: startSlide,
      //mousewheel: true,
      grabCursor: true,
      breakpoints: {
        // when window width is >= 480px
        480: tablet,
        // when window width is >= 992px
        992: desktop
      },
      navigation: {
        nextEl: nextButton,
        prevEl: prevButton,
      },
      pagination: paginationEl ? {
        el: paginationEl,
        type: 'bullets',
        clickable: true
      } : false,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
    });
  });
}

function initFilterBasic() {
  const groups = document.querySelectorAll('[data-filter-group]');

  groups.forEach((group) => {
    const buttons = group.querySelectorAll('[data-filter-target]');
    const items = Array.from(group.querySelectorAll('[data-filter-name]'));
    const transitionDelay = 300;

    // Pagination (optional): add data-filter-per-page="9" to the group to enable
    const perPage = parseInt(group.getAttribute('data-filter-per-page'), 10) || 0;
    const pagination = group.querySelector('[data-filter-pagination]');
    const prevBtn = pagination?.querySelector('[data-filter-prev]');
    const nextBtn = pagination?.querySelector('[data-filter-next]');
    const pageList = pagination?.querySelector('[data-filter-pages]');
    const pageTemplate = pageList?.querySelector('[data-filter-page]');
    if (pageTemplate) pageTemplate.remove();

    const activeButton = group.querySelector('[data-filter-target][data-filter-status="active"]');
    let currentFilter = activeButton ? activeButton.getAttribute('data-filter-target') : 'all';
    let currentPage = 1;
    let totalPages = 1;

    const updateStatus = (element, shouldBeActive) => {
      element.setAttribute('data-filter-status', shouldBeActive ? 'active' : 'not-active');
      element.setAttribute('aria-hidden', shouldBeActive ? 'false' : 'true');
    };

    const getMatches = () =>
      items.filter((item) => currentFilter === 'all' || item.getAttribute('data-filter-name') === currentFilter);

    const setNavState = (el, isDisabled) => {
      if (!el) return;
      el.setAttribute('data-filter-status', isDisabled ? 'disabled' : 'enabled');
      el.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
      if ('disabled' in el) el.disabled = isDisabled;
    };

    const renderPagination = () => {
      if (!pagination) return;
      pagination.setAttribute('data-filter-pagination', totalPages > 1 ? 'active' : 'hidden');

      if (pageList && pageTemplate) {
        pageList.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
          const pageBtn = pageTemplate.cloneNode(true);
          const label = pageBtn.querySelector('[data-filter-page-number]') || pageBtn;
          label.textContent = i;
          pageBtn.setAttribute('data-filter-page', i);
          pageBtn.setAttribute('data-filter-status', i === currentPage ? 'active' : 'not-active');
          pageBtn.setAttribute('aria-label', `Page ${i}`);
          if (i === currentPage) pageBtn.setAttribute('aria-current', 'page');
          else pageBtn.removeAttribute('aria-current');
          pageList.appendChild(pageBtn);
        }
      }

      setNavState(prevBtn, currentPage <= 1);
      setNavState(nextBtn, currentPage >= totalPages);
    };

    const render = (animate = true) => {
      const matches = getMatches();
      totalPages = perPage ? Math.max(1, Math.ceil(matches.length / perPage)) : 1;
      currentPage = Math.min(currentPage, totalPages);

      const start = (currentPage - 1) * perPage;
      const visible = new Set(perPage ? matches.slice(start, start + perPage) : matches);

      items.forEach((item) => {
        const shouldBeActive = visible.has(item);
        if (!animate) return updateStatus(item, shouldBeActive);
        if (item.getAttribute('data-filter-status') === 'active') {
          item.setAttribute('data-filter-status', 'transition-out');
        }
        setTimeout(() => updateStatus(item, shouldBeActive), transitionDelay);
      });

      buttons.forEach((button) => {
        const isActive = button.getAttribute('data-filter-target') === currentFilter;
        button.setAttribute('data-filter-status', isActive ? 'active' : 'not-active');
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      renderPagination();
    };

    const goToPage = (page) => {
      if (page < 1 || page > totalPages || page === currentPage) return;
      currentPage = page;
      render();
      // Bring the top of the list back into view if the user has scrolled past it
      if (group.getBoundingClientRect().top < 0) {
        group.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    // Filter buttons
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (button.getAttribute('data-filter-status') === 'active') return;
        currentFilter = button.getAttribute('data-filter-target');
        currentPage = 1;
        render();
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    });

    // Pagination controls
    prevBtn?.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn?.addEventListener('click', () => goToPage(currentPage + 1));
    pageList?.addEventListener('click', (event) => {
      const pageBtn = event.target.closest('[data-filter-page]');
      if (pageBtn) goToPage(parseInt(pageBtn.getAttribute('data-filter-page'), 10));
    });

    // Initial state, no animation
    render(false);
  });
}

function initAnimateSVG() {
  const svgs = document.querySelectorAll('[data-animate-svg]');
  if (!svgs.length) return;

  // Fallback: if plugins are missing, just show the SVGs
  if (typeof DrawSVGPlugin === 'undefined' || typeof ScrollTrigger === 'undefined') {
    gsap.set(svgs, { autoAlpha: 1 });
    return;
  }

  const SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';
  const IGNORE = 'defs, clipPath, mask, symbol, pattern, marker';

  // Allows 0 as a valid value
  const getNum = (el, attr, fallback) => {
    const v = parseFloat(el.getAttribute(attr));
    return Number.isFinite(v) ? v : fallback;
  };

  // Thin rects used as divider lines: drawing 0% to 50% of their outline
  // traces one long edge, so they draw like a line instead of going there and back
  const getDrawnState = (el) => {
    if (el.tagName.toLowerCase() !== 'rect') return '100%';
    const box = el.getBBox();
    return Math.min(box.width, box.height) < 2 ? '0% 50%' : '100%';
  };

  gsap.matchMedia().add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduced: '(prefers-reduced-motion: reduce)'
  }, (context) => {
    const { reduced } = context.conditions;

    svgs.forEach((svg) => {
      // Reveal first so nothing can get stuck hidden
      gsap.set(svg, { autoAlpha: 1 });

      const shapes = [...svg.querySelectorAll(SHAPES)].filter((el) => !el.closest(IGNORE));
      if (!shapes.length) return;

      // Reduced motion: show the finished lines straight away
      if (reduced) {
        gsap.set(shapes, { drawSVG: (i, shape) => getDrawnState(shape) });
        return;
      }

      const duration = getNum(svg, 'data-animate-svg-duration', 1.6);
      const stagger = getNum(svg, 'data-animate-svg-stagger', 0.2);
      const start = svg.getAttribute('data-animate-svg-start') || 'top 75%';

      gsap.set(shapes, { drawSVG: '0%' });

      gsap.to(shapes, {
        drawSVG: (i, shape) => getDrawnState(shape),
        duration,
        stagger,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: svg, start, once: true }
      });
    });
  });
}

function initFooterParallax(){
  document.querySelectorAll('[data-footer-parallax]').forEach(el => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true
      }
    });
  
    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark  = el.querySelector('[data-footer-parallax-dark]');
  
    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: 'linear'
      });
    }
  
    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: 'linear'
      }, '<');
    }
  });
}

function initGlobalParallax() {
  const mm = gsap.matchMedia();

  mm.add({
    isMobile: '(max-width: 479px)',
    isMobileLandscape: '(max-width: 767px)',
    isTablet: '(max-width: 991px)',
    isDesktop: '(min-width: 992px)'
  }, (context) => {
    const { isMobile, isMobileLandscape, isTablet } = context.conditions;

    const ctx = gsap.context(() => {
      document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
        const disable = trigger.getAttribute('data-parallax-disable');

        if (
          (disable === 'mobile' && isMobile) ||
          (disable === 'mobileLandscape' && isMobileLandscape) ||
          (disable === 'tablet' && isTablet)
        ) return;

        const target = trigger.querySelector('[data-parallax="target"]') || trigger;
        const direction = trigger.getAttribute('data-parallax-direction') || 'vertical';
        const prop = direction === 'horizontal' ? 'xPercent' : 'yPercent';

        const scrubAttr = trigger.getAttribute('data-parallax-scrub');
        const startAttr = trigger.getAttribute('data-parallax-start');
        const endAttr = trigger.getAttribute('data-parallax-end');

        const scrub = scrubAttr !== null ? parseFloat(scrubAttr) : true;
        const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
        const endVal = endAttr !== null ? parseFloat(endAttr) : -20;

        const scrollStart = `clamp(${trigger.getAttribute('data-parallax-scroll-start') || 'top bottom'})`;
        const scrollEnd = `clamp(${trigger.getAttribute('data-parallax-scroll-end') || 'bottom top'})`;

        gsap.fromTo(target, {
          [prop]: startVal
        }, {
          [prop]: endVal,
          ease: 'none',
          scrollTrigger: {
            trigger,
            start: scrollStart,
            end: scrollEnd,
            scrub
          }
        });
      });
    });

    return () => ctx.revert();
  });
}

const splitConfig = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.6, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 }
}
function initMaskTextScrollReveal() {
  document.querySelectorAll('[data-split="heading"]').forEach(heading => {
    // Find the split type, the default is 'lines'
    const type = heading.dataset.splitReveal || 'lines'
    const typesToSplit =
      type === 'lines' ? ['lines'] :
      type === 'words' ? ['lines','words'] :
      ['lines','words','chars']
    
    // Split the text
    SplitText.create(heading, {
      type: typesToSplit.join(', '), // split into required elements
      mask: 'lines', // wrap each line in an overflow:hidden div
      autoSplit: true,
      linesClass: 'line',
      wordsClass: 'word',
      charsClass: 'letter',
      onSplit: function(instance) {
        const targets = instance[type] // Register animation targets
        const config = splitConfig[type] // Find matching duration and stagger from our splitConfig
        
        return gsap.from(targets, {
          yPercent: 110,
          duration: config.duration,
          stagger: config.stagger,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: heading,
            start: 'top 85%',
            once: true
          }
        });
      }
    })
  })

}


document.addEventListener("DOMContentLoaded", () => {
  let headings = document.querySelectorAll('[data-split="heading"]')
  headings.forEach(heading => {
    gsap.set(heading,{ autoAlpha:1 })
  });
  initDynamicCurrentYear();
  initCSSMarquee();
  initAccordionCSS();
  initSwiperSlider();
  initFilterBasic();
  initAnimateSVG();
  initFooterParallax();
  initGlobalParallax();
  console.log("%cBuilt byFriday", "background:black;color:white;padding: 8px;");
});

document.fonts.ready.then(function () {
  initMaskTextScrollReveal();
});