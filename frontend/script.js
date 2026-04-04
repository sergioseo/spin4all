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
            const scrollAmount = 350; // Valor dinâmico baseado no card + gap

            nextBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });

            prevBtn.addEventListener('click', () => {
                carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });

            const handleArrows = () => {
                const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 15;
                const isAtStart = carousel.scrollLeft <= 15;
                
                prevBtn.style.opacity = isAtStart ? '0.2' : '1';
                nextBtn.style.opacity = isAtEnd ? '0.2' : '1';
                prevBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
                nextBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
            };

            carousel.addEventListener('scroll', handleArrows);
            window.addEventListener('resize', handleArrows);
            handleArrows(); 
            return handleArrows; // Retorna para atualização manual se necessário
        }
    };

    // --- CARREGAMENTO DINÂMICO DE VÍDEOS (BOLT Protocol) ---
    async function loadVideos() {
        const videoTrack = document.getElementById('videoTrack');
        if (!videoTrack) return;

        try {
            const response = await fetch('/api/videos');
            const data = await response.json();

            if (data.success && data.videos.length > 0) {
                videoTrack.innerHTML = ''; // Limpa o spinner
                
                data.videos.forEach(video => {
                    const videoCard = `
                        <div class="video-card">
                            <div class="video-container">
                                <video controls poster="${video.dsc_thumb_url || ''}" preload="metadata">
                                    <source src="${video.dsc_video_url}" type="video/mp4">
                                    Seu navegador não suporta vídeos.
                                </video>
                            </div>
                            <div class="video-info">
                                <h4 class="video-title">${video.dsc_titulo}</h4>
                                <span style="font-size: 0.7rem; color: rgba(255,255,255,0.4);">
                                    ${new Date(video.dt_registro).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    `;
                    videoTrack.innerHTML += videoCard;
                });

                // Re-inicializa ou atualiza as setas após o carregamento
                const updateArrows = initCarousel('videoCarousel', 'videoPrevBtn', 'videoNextBtn');
                if (updateArrows) setTimeout(updateArrows, 100);
            } else {
                videoTrack.innerHTML = '<p style="color: #64748b; padding: 20px;">Nenhum vídeo disponível no momento.</p>';
            }
        } catch (err) {
            console.error('Erro ao buscar vídeos:', err);
            videoTrack.innerHTML = '<p style="color: #f43f5e; padding: 20px;">Erro ao carregar vídeos.</p>';
        }
    }

    // Inicialização BOLT (Fotos e Vídeos)
    initCarousel('galleryCarousel', 'prevBtn', 'nextBtn');
    loadVideos();

});
