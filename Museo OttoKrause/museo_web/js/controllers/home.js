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
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
});

// --- ANIMACIÓN DE CONTADORES NUMÉRICOS (STATS) ---
  const counters = document.querySelectorAll('.stat-counter');
  const animationDuration = 3500; // Duración total de la animación en milisegundos (2 segundos)

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