// home.js
// Controlador de la página de inicio. Maneja el carrusel y el efecto de scroll del header.

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  const btnNext = document.querySelector('.button-right');
  const btnPrev = document.querySelector('.button-left');
  let currentSlide = 0;
  let slideInterval = setInterval(nextSlide, 6000); //ajustar el intervalo a el tiempo de lectura

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
