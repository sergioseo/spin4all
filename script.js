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

});
