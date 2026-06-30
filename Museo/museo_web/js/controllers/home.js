// home.js
// Controlador de la página de inicio. Maneja el carrusel y el efecto de scroll del header.

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  const btnNext = document.querySelector('.button-right');
  const btnPrev = document.querySelector('.button-left');
  let currentSlide = 0;
  let slideInterval = setInterval(nextSlide, 4000); //ajustar el intervalo a el tiempo de lectura

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');
    currentSlide = (n + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  btnNext.addEventListener('click', () => {
    nextSlide();
    resetInterval();
  });

  btnPrev.addEventListener('click', () => {
    prevSlide();
    resetInterval();
  });

  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => {
      goToSlide(idx);
      resetInterval();
    });
  });

  function resetInterval() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 6000);
  }

  const header = document.querySelector('.main-header');
  const featuredCarousel = document.querySelector('.patrimonio-carousel');

  function scrollFeaturedCarousel() {
    if (!featuredCarousel) return;
    const card = featuredCarousel.querySelector('.patrimonio-coll-card');
    const cardWidth = card ? card.offsetWidth : featuredCarousel.clientWidth * 0.8;
    const gap = 18;
    const maxScroll = featuredCarousel.scrollWidth - featuredCarousel.clientWidth;

    if (featuredCarousel.scrollLeft >= maxScroll - 5) {
      featuredCarousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      featuredCarousel.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    }
  }

  if (featuredCarousel) {
    setInterval(scrollFeaturedCarousel, 2000);
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Scroll Spy for navbar items
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const headerHeight = header ? header.offsetHeight : 72;
      
      if (window.scrollY >= sectionTop - headerHeight - 150) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (current && link.getAttribute('href').includes(current)) {
        link.classList.add('active');
      }
    });
  });
});

// --- ANIMACIÓN DE CONTADORES NUMÉRICOS (STATS) ---
const counters = document.querySelectorAll('.stat-counter');
const animationDuration = 1000; // Duración total de la animación en milisegundos (2 segundos)

function startCountAnimation(counterElement) {
  const target = +counterElement.getAttribute('data-target');
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / animationDuration, 1);

    // Función de aceleración/desaceleración suave (Ease-Out)
    const easeOutProgress = 1 - Math.pow(1 - progress, 3);

    const currentValue = Math.floor(easeOutProgress * target);
    counterElement.innerText = currentValue;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      counterElement.innerText = target; // Asegura que termine exactamente en el valor objetivo
    }
  }

  requestAnimationFrame(updateNumber);
}

// Intersection Observer para disparar la animación solo cuando es visible en pantalla
const statsObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counterElement = entry.target;
      startCountAnimation(counterElement);
      observer.unobserve(counterElement); // Deja de observar una vez ejecutado
    }
  });
}, {
  threshold: 0.2 // Se dispara cuando el 20% del elemento entra en la pantalla
});

counters.forEach(counter => statsObserver.observe(counter));

// --- FALLBACK PARA ANCLAS CON NAVBAR DINÁMICO ---
(function () {
  function isSamePageHash(anchor) {
    return anchor.hash && (anchor.pathname === location.pathname || anchor.pathname === '') && anchor.hash.startsWith('#');
  }

  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a || !isSamePageHash(a)) return;

    const id = a.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    const header = document.querySelector('.main-header');
    const headerHeight = header ? header.offsetHeight : 0;

    e.preventDefault();

    const targetY = window.scrollY + target.getBoundingClientRect().top - headerHeight;

    window.scrollTo({
      top: Math.max(0, Math.floor(targetY)),
      behavior: 'smooth'
    });

    history.pushState(null, '', '#' + id);
  });

  // Si la página carga con hash en la URL, ajustar posición inicial
  window.addEventListener('load', function () {
    if (location.hash) {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      const header = document.querySelector('.main-header');
      if (target) {
        const headerHeight = header ? header.offsetHeight : 0;
        const targetY = window.scrollY + target.getBoundingClientRect().top - headerHeight;
        window.scrollTo({ top: Math.max(0, Math.floor(targetY)), behavior: 'auto' });
      }
    }
  });
})();