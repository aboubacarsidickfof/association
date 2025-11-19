(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.associationTheme = {
    attach: function (context, settings) {
      
      // Menu mobile toggle
      $('.menu-toggle', context).once('menuToggle').on('click', function() {
        $('.primary-menu').toggleClass('active');
        $(this).toggleClass('active');
      });
      
      // Smooth scroll pour liens ancres
      $('a[href^="#"]', context).once('smoothScroll').on('click', function(e) {
        var target = $(this.hash);
        if (target.length) {
          e.preventDefault();
          $('html, body').animate({
            scrollTop: target.offset().top - 80
          }, 800);
        }
      });
      
      // Animation au scroll (cards apparaissent progressivement)
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('fade-in');
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1
        });
        
        $('.card', context).once('fadeIn').each(function() {
          observer.observe(this);
        });
      }
      
      // Compteur animé pour statistiques
      $('.stat-number', context).once('counterAnim').each(function() {
        var $this = $(this);
        var countTo = parseInt($this.text().replace(/\D/g, ''));
        
        if (countTo > 0) {
          $({ countNum: 0 }).animate({
            countNum: countTo
          }, {
            duration: 2000,
            easing: 'swing',
            step: function() {
              $this.text(Math.floor(this.countNum).toLocaleString());
            },
            complete: function() {
              $this.text(countTo.toLocaleString());
            }
          });
        }
      });
      
      // Validation formulaire de don
      $('.donation-form', context).once('donationValidation').on('submit', function(e) {
        var amount = $(this).find('input[name="amount"]').val();
        if (!amount || parseFloat(amount) <= 0) {
          e.preventDefault();
          alert('Veuillez entrer un montant valide.');
          return false;
        }
      });
      
      // Alert auto-dismiss
      $('.alert', context).once('autoDismiss').each(function() {
        var $alert = $(this);
        setTimeout(function() {
          $alert.fadeOut(500, function() {
            $(this).remove();
          });
        }, 5000);
      });
    }
  };

  // CSS pour animation fade-in
  var style = document.createElement('style');
  style.textContent = `
    .card {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .card.fade-in {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

})(jQuery, Drupal);
