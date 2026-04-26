document.addEventListener('DOMContentLoaded', () => {
  initProductGallery();
  initCartForm();
});

function initProductGallery() {
  const images = document.querySelectorAll('.product__media img');
  if (!images.length) return;

  images.forEach(img => {
    img.addEventListener('click', () => {
      images.forEach(i => i.classList.remove('active'));
      img.classList.add('active');
    });
  });
}

function initCartForm() {
  const cartForm = document.querySelector('form[action="/cart"]');
  if (!cartForm) return;

  cartForm.addEventListener('submit', e => {
    const btn = cartForm.querySelector('[type="submit"]');
    if (btn) btn.textContent = 'Chargement…';
  });
}
