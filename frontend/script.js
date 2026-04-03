// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    
    // Intersection Observer for Scroll Reveal Animations
    const reveals = document.querySelectorAll('.reveal');

    // Setup options for the observer
    const revealOptions = {
        root: null,
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    };

    // Create the observer
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Once an element is intersecting, add the 'active' class to trigger CSS transition
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Unobserve if you only want the animation to happen once
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    // Attach observer to all reveal elements
    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });

    // FAQ Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Toggle active class on header
            header.classList.toggle('active');
            
            // Get the content element
            const content = header.nextElementSibling;
            
            // Toggle max-height for animation
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = 0;
            }
        });
    });

    // Lightbox Logic
    window.openLightbox = function(src, alt) {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCaption = document.getElementById('lightbox-caption');
        
        lightboxImg.src = src;
        lightboxImg.alt = alt;
        lightboxCaption.textContent = alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    };

    window.closeLightbox = function() {
        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto'; // Restore scroll
    };

    // MOBILE MENU LOGIC
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavClose = document.getElementById('mobileNavClose');
    const mobileLinks = document.querySelectorAll('.mobile-nav-content a');

    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });

        const closeMenu = () => {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (mobileNavClose) mobileNavClose.addEventListener('click', closeMenu);

        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    // --- CARROSSEL UNIVERSE (Reusable Logic) ---
    const initCarousel = (carouselId, prevBtnId, nextBtnId) => {
        const carousel = document.getElementById(carouselId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (carousel && prevBtn && nextBtn) {
            const scrollAmount = 320; // Valor dinâmico baseado no card + gap

            nextBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });

            prevBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });

            // Lógica de Visibilidade das Setas (Feedback Visual BOLT)
            const handleArrows = () => {
                const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 15;
                const isAtStart = carousel.scrollLeft <= 15;
                
                prevBtn.style.opacity = isAtStart ? '0.3' : '1';
                nextBtn.style.opacity = isAtEnd ? '0.3' : '1';
                prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
                nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
            };

            carousel.addEventListener('scroll', handleArrows);
            window.addEventListener('resize', handleArrows);
            handleArrows(); // Inicializa o estado
        }
    };

    // Inicialização BOLT (Fotos e Vídeos)
    initCarousel('galleryCarousel', 'prevBtn', 'nextBtn');
    initCarousel('videoCarousel', 'videoPrevBtn', 'videoNextBtn');

});
