/* =====================================================================
   TGC1HUB NOS — APP LOGIC
   Reads everything from CONFIG (config.js). You shouldn't need to edit
   this file for normal customization — see config.js and styles.css.
   ===================================================================== */

// ---------- helpers ----------
function toIntlPH(local) {
  const digits = String(local).replace(/\D/g, '');
  if (digits.startsWith('0')) return '63' + digits.slice(1);
  if (digits.startsWith('63')) return digits;
  return digits;
}
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}
function getField(row, key) {
  for (const alias of (CONFIG.fieldAliases[key] || [key])) {
    if (row[alias] !== undefined && row[alias] !== null && row[alias] !== '') return row[alias];
  }
  return undefined;
}
function getImageUrl(row) {
  let img = getField(row, 'image');
  if (!img) {
    const itemCode = getField(row, 'itemCode');
    if (itemCode) {
      return CONFIG.r2BaseUrl.replace(/\/+$/, '') + '/' + encodeURIComponent(String(itemCode).trim()) + '/' + CONFIG.r2DefaultImageFile;
    }
    return null;
  }
  img = String(img).trim();
  if (/^https?:\/\//i.test(img)) return img;
  return CONFIG.r2BaseUrl.replace(/\/+$/, '') + '/' + img.replace(/^\/+/, '');
}
function getCompatArray(row) {
  const values = [];
  const modelValue = row.Model ?? row.model ?? getField(row, 'model') ?? null;
  const yearModelValue = row.YearModel ?? row.year_model ?? getField(row, 'year_model') ?? null;

  if (modelValue && yearModelValue) {
    const merged = `${String(modelValue).trim()} ${String(yearModelValue).trim()}`.trim();
    if (merged) values.push(merged);
  } else if (modelValue) {
    values.push(String(modelValue).trim());
  } else if (yearModelValue) {
    values.push(String(yearModelValue).trim());
  }

  return values.filter(value => value && value !== 'undefined' && value !== 'null');
}
function normalizeStatus(row) {
  const raw = getField(row, 'status');
  const rawQty = getField(row, 'qty');
  const qtyNum = rawQty !== undefined && rawQty !== null && rawQty !== ''
    ? Number(String(rawQty).replace(/[^\d.-]/g, ''))
    : undefined;
  const isZeroQty = qtyNum !== undefined && !Number.isNaN(qtyNum) ? qtyNum <= 0 : undefined;

  let statusSaysSold;
  if (raw === undefined) {
    statusSaysSold = undefined;
  } else if (typeof raw === 'boolean') {
    statusSaysSold = !raw;
  } else if (typeof raw === 'number') {
    statusSaysSold = raw <= 0;
  } else {
    const s = String(raw).toLowerCase();
    statusSaysSold = /sold|out of stock|unavailable|no stock|^0$|^no$/.test(s);
  }

  // An item counts as SOLD OUT only when BOTH conditions agree it's gone:
  // status text/flag says "sold" AND qty_on_hand is 0 (when qty data exists).
  // If qty data is missing, fall back to status alone (backwards compatible).
  if (statusSaysSold === true) {
    if (isZeroQty === false) return 'available'; // status says sold but stock remains — trust qty
    return 'sold_out';
  }
  if (isZeroQty === true && statusSaysSold === undefined) return 'sold_out';
  return 'available';
}

function iconSvg(name) {
  const icons = {
    video: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-4v12l-6-4"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 3h16v18l-3-2-2 2-2-2-2 2-2-2-2 2-3-2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    truck: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="7" width="14" height="10" rx="1"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="6" cy="19" r="1.6"/><circle cx="17.5" cy="19" r="1.6"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6L3 22l1.5-4.5A8.46 8.46 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg>',
    box: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z"/></svg>'
  };
  return icons[name] || '';
}

function cardPlaceholderHtml(partNumber) {
  return `<div class="card-img-placeholder">${iconSvg('box')}<div class="card-img-watermark">${escapeHtml(partNumber)}</div></div>`;
}

function handleImageError(img, partNumber) {
  if (!img || !img.parentElement) return;
  img.remove();
  img.parentElement.insertAdjacentHTML('beforeend', cardPlaceholderHtml(partNumber));
}

function resolveRawField(row, key) {
  const value = row[key];
  return (value !== undefined && value !== null && value !== '') ? String(value).trim() : undefined;
}

function formatPeso(value) {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(String(value).replace(/[^\d.-]/g, ''));
  if (Number.isNaN(num)) return `₱ ${escapeHtml(String(value))}`;
  return `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num)}`;
}

function resolveRawImageUrl(raw) {
  if (!raw) return null;
  const image = String(raw).trim();
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  return CONFIG.r2BaseUrl.replace(/\/+$|$/, '') + '/' + image.replace(/^\/+/, '');
}

function getGalleryImageUrls(row) {
  const urls = [];
  const add = src => {
    if (!src) return;
    if (!urls.includes(src)) urls.push(src);
  };

  const mainUrl = getImageUrl(row);
  add(mainUrl);

  const imageKeys = [
    'image1', 'image_1', 'photo1', 'photo_1',
    'image2', 'image_2', 'photo2', 'photo_2',
    'image3', 'image_3', 'photo3', 'photo_3',
    'image4', 'image_4', 'photo4', 'photo_4'
  ];
  for (const key of imageKeys) {
    const raw = resolveRawField(row, key);
    add(resolveRawImageUrl(raw));
  }

  const itemCode = getField(row, 'itemCode');
  if (itemCode) {
    for (let idx = 1; idx <= 4; idx += 1) {
      add(`${CONFIG.r2BaseUrl.replace(/\/+$/, '')}/${encodeURIComponent(String(itemCode).trim())}/IMG_000${idx}.png`);
    }
  }
  return urls.filter(Boolean);
}

function formatProductDetailRow(label, value) {
  return `
    <div class="modal-detail">
      <div class="modal-detail-title">${escapeHtml(label)}</div>
      <div class="modal-detail-value">${escapeHtml(value)}</div>
    </div>`;
}

function buildProductModalHtml(row) {
  const images = getGalleryImageUrls(row);
  const itemCode = escapeHtml(getField(row, 'itemCode') || 'UNKNOWN');
  const modalPartNumber = getField(row, 'PartNum') || getField(row, 'partNumber') || getField(row, 'itemCode') || '-';
  const name = escapeHtml(getField(row, 'name') || 'Unnamed part');
  const details = escapeHtml(getField(row, 'fullDescription') || getField(row, 'description') || 'No details available');
  const category = getField(row, 'category') || '-';
  const compat = getCompatArray(row).join(', ') || '-';
  const brand = getField(row, 'brand') || '-';
  const price = formatPeso(getField(row, 'srp') || getField(row, 'price') || '-');
  const condition = getField(row, 'condition') || '-';
  const remarks = getField(row, 'remarks');
  const fitment = getField(row, 'fitment') || '-';
  const normalizedRemarks = remarks && String(remarks).trim() && String(remarks).trim() !== '-' && String(remarks).trim() !== '—'
    ? String(remarks).trim()
    : 'GOOD';
  const normalizedCondition = condition && String(condition).trim() && String(condition).trim() !== '-' && String(condition).trim() !== '—'
    ? String(condition).trim()
    : 'GOOD';
  const conditionRemarks = [normalizedRemarks, normalizedCondition].join(', ');
  const textualCondition = `Item is ${conditionRemarks}.`;
  const status = normalizeStatus(row);
  const statusLabel = status === 'sold_out' ? 'SOLD OUT' : 'Available';
  const messengerUrl = CONFIG.contact.messengerUrl;

  const imageButtons = images.map((src, idx) => `
      <button type="button" class="gallery-thumb${idx === 0 ? ' active' : ''}" data-index="${idx}">
        <img src="${src}" alt="${itemCode} image ${idx + 1}" loading="lazy">
      </button>`).join('');

  const mainImage = images.length
    ? `<div class="gallery-main" data-zoom>
        <img src="${images[0]}" alt="${itemCode} image 1" loading="lazy">
      </div>`
    : '<div class="gallery-main gallery-empty">No image available</div>';

  return `
    <div class="modal-content">
      <div class="modal-left">
        <div class="modal-gallery">
          ${mainImage}
          <div class="gallery-thumbs">${imageButtons}</div>
          <div class="gallery-note">Tap or click the main image to zoom. Swipe thumbnails to change view.</div>
        </div>
      </div>

      <div class="modal-right">
        <div class="modal-header">
          <span class="pill ${status === 'sold_out' ? 'pill-status-sold' : 'pill-status-avail'}">${statusLabel}</span>
          <h2>${itemCode} — ${name}</h2>
          <p class="modal-subtitle">${escapeHtml(category)}</p>
        </div>

        <div class="modal-body">
          <div class="modal-section">
            <h3>Full details</h3>
            <p>${details}</p>
          </div>

          <div class="modal-grid">
            ${formatProductDetailRow('Brand', brand)}
            ${formatProductDetailRow('Part #', modalPartNumber)}
            ${formatProductDetailRow('Compatibility', compat)}
            ${formatProductDetailRow('Fitment', fitment)}
            ${formatProductDetailRow('Condition / Remarks', textualCondition)}
            ${formatProductDetailRow('Price', price)}
          </div>
        </div>

        <div class="modal-actions">
          <a class="btn btn-messenger" href="${messengerUrl}" target="_blank" rel="noopener">${iconSvg('chat')} Inquire on Messenger</a>
          <button type="button" class="btn btn-outline modal-close-btn">Close</button>
        </div>
      </div>
    </div>`;
}

function setupZoomPan(zoomable) {
  if (!zoomable) return;

  const img = zoomable.querySelector('img');
  if (!img) return;

  let isZoomed = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let lastTapTime = 0;

  const clamp = (value, limit) => Math.max(-limit, Math.min(value, limit));

  function applyTransform() {
    const scale = isZoomed ? 2.2 : 1;
    const maxX = ((img.clientWidth * scale) - img.clientWidth) / 2;
    const maxY = ((img.clientHeight * scale) - img.clientHeight) / 2;
    offsetX = clamp(offsetX, maxX);
    offsetY = clamp(offsetY, maxY);
    img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    img.style.transition = isDragging ? 'none' : 'transform .18s ease';
    img.style.cursor = isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in';
    zoomable.classList.toggle('zoomed', isZoomed);
  }

  function toggleZoom() {
    isZoomed = !isZoomed;
    if (!isZoomed) {
      offsetX = 0;
      offsetY = 0;
    }
    applyTransform();
  }

  img.addEventListener('dblclick', event => {
    event.preventDefault();
    toggleZoom();
  });

  img.addEventListener('touchend', event => {
    const now = Date.now();
    const timeSince = now - lastTapTime;
    if (timeSince < 280 && timeSince > 0) {
      event.preventDefault();
      toggleZoom();
    }
    lastTapTime = now;
  }, { passive: false });

  img.addEventListener('pointerdown', event => {
    if (!isZoomed) return;
    isDragging = true;
    dragStartX = event.clientX - offsetX;
    dragStartY = event.clientY - offsetY;
    img.setPointerCapture(event.pointerId);
    img.style.transition = 'none';
  });

  img.addEventListener('pointermove', event => {
    if (!isDragging || !isZoomed) return;
    const maxX = ((img.clientWidth * 2.2) - img.clientWidth) / 2;
    const maxY = ((img.clientHeight * 2.2) - img.clientHeight) / 2;
    offsetX = clamp(event.clientX - dragStartX, maxX);
    offsetY = clamp(event.clientY - dragStartY, maxY);
    img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(2.2)`;
  });

  img.addEventListener('pointerup', () => {
    isDragging = false;
    applyTransform();
  });

  img.addEventListener('pointerleave', () => {
    if (!isDragging) return;
    isDragging = false;
    applyTransform();
  });

  img.addEventListener('pointercancel', () => {
    isDragging = false;
    applyTransform();
  });

  applyTransform();
}

function openProductModal(row) {
  const modal = document.getElementById('productModal');
  const inner = modal.querySelector('.modal-inner');
  const modalCard = modal.querySelector('.modal-card');
  inner.innerHTML = buildProductModalHtml(row);
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  modalCard.scrollTop = 0;
  modalCard.classList.remove('mobile-details-open');

  const thumbButtons = inner.querySelectorAll('.gallery-thumb');
  const zoomable = inner.querySelector('[data-zoom]');

  thumbButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const selectedSrc = getGalleryImageUrls(row)[index];
      if (!selectedSrc) return;
      const mainImg = inner.querySelector('.gallery-main img');
      if (mainImg) {
        mainImg.src = selectedSrc;
      }
      thumbButtons.forEach(btn => btn.classList.toggle('active', btn === button));
      if (zoomable) {
        const img = zoomable.querySelector('img');
        if (img) {
          img.style.transform = 'translate(0px, 0px) scale(1)';
          img.style.transition = 'transform .18s ease';
          img.style.cursor = 'zoom-in';
        }
        zoomable.classList.remove('zoomed');
      }
    });
  });

  setupZoomPan(zoomable);

  if (window.innerWidth <= 640) {
    modalCard.addEventListener('scroll', () => {
      if (modalCard.scrollTop > 80) {
        modalCard.classList.add('mobile-details-open');
      } else {
        modalCard.classList.remove('mobile-details-open');
      }
    }, { passive: true });
  }
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  const inner = modal.querySelector('.modal-inner');
  inner.innerHTML = '';
}

const WA_INTL = toIntlPH(CONFIG.contact.whatsappNumber);
const VB_INTL = toIntlPH(CONFIG.contact.viberNumber);

// ---------- static content wiring ----------
function wireStaticContent() {
  document.getElementById('tbAddress').textContent = CONFIG.business.addressShort;
  document.getElementById('tbPhone').textContent = CONFIG.business.phoneDisplay;
  document.getElementById('tbHours').textContent = CONFIG.business.hours;

  document.getElementById('brandTag').textContent = CONFIG.business.tagline;
  const headerPhone = document.getElementById('headerPhone');
  headerPhone.href = 'tel:' + CONFIG.business.phoneDial;
  headerPhone.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${CONFIG.business.phoneDisplay}`;
  document.getElementById('headerMessenger').href = CONFIG.contact.messengerUrl;

  document.getElementById('proofTag1').textContent = CONFIG.proof.tag1;
  document.getElementById('proofTag2').textContent = CONFIG.proof.tag2;
  document.getElementById('heroDesc').textContent = CONFIG.proof.description;
  document.getElementById('heroCta').href = CONFIG.contact.messengerUrl;

  // Why section
  document.getElementById('whyEyebrow').textContent = CONFIG.why.eyebrow;
  document.getElementById('whyNote').textContent = CONFIG.why.note;
  document.getElementById('whyGrid').innerHTML = CONFIG.why.cards.map(c => `
    <div class="why-card">
      <div class="why-card-top">
        <span class="why-icon">${iconSvg(c.icon)}</span>
        ${c.badge ? `<span class="pill pill-red tiny">${escapeHtml(c.badge)}</span>` : ''}
      </div>
      <h4>${escapeHtml(c.title)}</h4>
      <p>${escapeHtml(c.desc)}</p>
    </div>`).join('');

  // Footer
  document.getElementById('footAddress').textContent = CONFIG.business.address;
  document.getElementById('footPhone').textContent = CONFIG.business.phoneDisplay;
  const fmh = document.getElementById('footMessengerHandle');
  fmh.textContent = CONFIG.contact.messengerHandleLabel;
  fmh.href = CONFIG.contact.messengerUrl;
  document.getElementById('footMessengerBtn').href = CONFIG.contact.messengerUrl;
  document.getElementById('footFbPage').href = CONFIG.contact.fbPageUrl;

  document.getElementById('orderSteps').innerHTML = CONFIG.orderSteps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  document.getElementById('footerNote').textContent = CONFIG.footerNote;

  document.getElementById('mapAddr').textContent = CONFIG.business.address;
  document.getElementById('mapLink').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.business.address);
  document.getElementById('bodegaStatus').textContent = CONFIG.bodegaStatus;
  document.getElementById('wazeText').textContent = CONFIG.wazeLabel;

  document.getElementById('copyText').textContent =
    `© ${new Date().getFullYear()} ${CONFIG.business.name} • Novaliches QC • NOS Auto Parts | Never Installed • All parts checked sa bodega`;

  // Contact links (Messenger / WhatsApp / Viber)
  document.getElementById('fabMg').href = CONFIG.contact.messengerUrl;
  document.getElementById('fabWa').href = `https://wa.me/${WA_INTL}?text=${encodeURIComponent("Hi! I'd like to ask about your parts on TGC1HUB NOS.")}`;
  document.getElementById('fabVb').href = `viber://chat?number=%2B${VB_INTL}`;
  document.getElementById('waLabel').textContent = CONFIG.contact.whatsappNumber;
  document.getElementById('vbLabel').textContent = CONFIG.contact.viberNumber;

  document.getElementById('fabWrap').addEventListener('click', e => {}); // no-op guard
  document.getElementById('fabToggle').addEventListener('click', () => {
    document.getElementById('fabWrap').classList.toggle('open');
  });

  const modal = document.getElementById('productModal');
  modal.addEventListener('click', e => {
    if (e.target.matches('[data-modal-close]') || e.target.closest('.modal-close') || e.target.matches('.modal-close-btn')) {
      closeProductModal();
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeProductModal();
    }
  });
}

// ---------- hero (proof of legit showcase) ----------
function renderHero(products) {
  const soldOut = products.find(r => normalizeStatus(r) === 'sold_out');
  const featured = CONFIG.proof.useLatestSoldOut ? (soldOut || products[0]) : null;

  const partNumber = featured ? (getField(featured, 'partNumber') || CONFIG.proof.fallbackPartNumber) : CONFIG.proof.fallbackPartNumber;
  const name = featured ? (getField(featured, 'name') || CONFIG.proof.fallbackName) : CONFIG.proof.fallbackName;
  const compat = featured ? getCompatArray(featured) : [];
  const chassisText = compat.length ? compat.join(' / ') : CONFIG.proof.fallbackChassis;
  const status = featured ? normalizeStatus(featured) : 'sold_out';
  const statusLabel = status === 'sold_out' ? 'ALWAYS ON SALE!' : 'AVAILABLE NOW';

  document.getElementById('statusBadge').textContent = statusLabel;
  document.getElementById('statusBadge').className = 'pill ' + (status === 'sold_out' ? 'pill-light' : 'pill-red');
  document.getElementById('heroTitle').innerHTML = 'We Dont Just Sell Parts,<br>We Preserve History.';
  document.getElementById('heroChassis').textContent = 'CHASSIS: ' + chassisText;

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card"><div class="stat-num">${escapeHtml(CONFIG.proof.partsSold)}</div><div class="stat-label">NOS AUTO PARTS</div></div>
    <div class="stat-card"><div class="stat-num">${escapeHtml(CONFIG.proof.fbRating)} ★</div><div class="stat-label">FB RATING</div></div>
    <div class="stat-card"><div class="stat-num">LBC/J&amp;T/Lalamove-QC</div><div class="stat-label">NATIONWIDE</div></div>
  `;

  const recentSoldOut = products.filter(r => normalizeStatus(r) === 'sold_out').slice(0, 3);
  document.getElementById('receiptTitle').textContent = 'Recent Sold Out Items';
  document.getElementById('receiptSub').innerHTML = recentSoldOut.length
    ? recentSoldOut.map(item => `${escapeHtml(getField(item, 'PartNum') || getField(item, 'partNumber') || '—')} • ${escapeHtml(getField(item, 'name') || 'Part')}`).join('<br>')
    : `${escapeHtml(partNumber)} • ${escapeHtml(statusLabel)} • ${escapeHtml(name)}`;

  document.getElementById('proofBadgeFooter').textContent = partNumber + ' PROOF';

  // technical spec watermark, built from the catalog's own chassis codes
  const allCompat = [...new Set(products.flatMap(getCompatArray))].slice(0, 6);
  const specLine2 = allCompat.length ? allCompat.join('_') : 'NCP10_NCP13_AE92_NCP42';
  document.getElementById('heroSpec').textContent =
    `CHASSIS_DB // ${CONFIG.business.name.replace(/\s+/g, '_')}\n${specLine2}`;
}

// ---------- product cards ----------
function productCardHtml(row) {
  const partNumber = escapeHtml(getField(row, 'partNumber') || '—');
  const name = escapeHtml(getField(row, 'name') || 'Unnamed part');
  const details = escapeHtml(getField(row, 'fullDescription') || getField(row, 'description') || 'No details available');
  const category = getField(row, 'category');
  const compat = getCompatArray(row);
  const fitment = getField(row, 'fitment');
  const location = getField(row, 'location') || CONFIG.business.addressShort.replace(/^#\d+\s*/, '').split(',')[0];
  const status = normalizeStatus(row);
  const img = getImageUrl(row);
  const waLink = `https://wa.me/${WA_INTL}?text=${encodeURIComponent(`Hi! Available pa ba ang ${getField(row, 'partNumber') || ''} - ${getField(row, 'name') || 'part'}?`)}`;
  const safePartNumber = String(partNumber).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `
    <div class="card">
      <div class="card-top">
        <div class="card-badges">
          <span class="pill ${status === 'sold_out' ? 'pill-status-sold' : 'pill-status-avail'}">${status === 'sold_out' ? 'SOLD OUT' : 'Available'}</span>
          ${category ? `<span class="pill pill-cat">${escapeHtml(category)}</span>` : ''}
        </div>
        <div class="card-tool">
          <span>NOS</span>
        </div>
      </div>
      <div class="card-img">
        ${img
          ? `<img src="${img}" alt="${name}" loading="lazy" onerror="handleImageError(this,'${safePartNumber}')">`
          : `<div class="card-img-placeholder">${iconSvg('box')}<div class="card-img-watermark">${partNumber}</div></div>`}
      </div>
      <div class="card-body">
        <div class="card-partno">${partNumber}</div>
        <div class="card-name">${name}</div>
        ${details ? `<div class="card-details">${details}</div>` : ''}
        <a class="card-action ${status === 'sold_out' ? 'soldout' : 'available'}" href="${waLink}" target="_blank" rel="noopener">
          ${iconSvg('chat')} ${status === 'sold_out' ? 'Check Similar' : 'Inquire'}
        </a>
      </div>
    </div>`;
}

// ---------- state ----------
let ALL_PRODUCTS = [];
let FILTERS = { category: '', subCategory: '', partName: '' };
let SEARCH_TERM = '';

function normalizeFilterText(value) {
  return String(value ?? '').trim();
}

function getFilterValues(row, aliasKey) {
  const raw = getField(row, aliasKey);
  if (raw === undefined || raw === null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.map(v => normalizeFilterText(v)).filter(Boolean);
  }
  return String(raw).split(/[,/|]/).map(v => normalizeFilterText(v)).filter(Boolean);
}

function matchesFilters(row) {
  const category = normalizeFilterText(getField(row, 'category'));
  const subCategory = normalizeFilterText(getField(row, 'subCategory'));
  const partName = normalizeFilterText(getField(row, 'partName'));

  if (FILTERS.category && category.toLowerCase() !== FILTERS.category.toLowerCase()) return false;
  if (FILTERS.subCategory && subCategory.toLowerCase() !== FILTERS.subCategory.toLowerCase()) return false;
  if (FILTERS.partName && partName.toLowerCase() !== FILTERS.partName.toLowerCase()) return false;
  return true;
}

function matchesSearch(row, term) {
  if (!term) return true;
  const q = term.toLowerCase();
  const hay = [
    getField(row, 'partNumber'),
    getField(row, 'name'),
    getField(row, 'category'),
    getField(row, 'subCategory'),
    getField(row, 'fitment'),
    ...getCompatArray(row)
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q);
}

function render() {
  const grid = document.getElementById('grid');
  const filtered = ALL_PRODUCTS.filter(r => matchesFilters(r) && matchesSearch(r, SEARCH_TERM));

  document.getElementById('countLabel').textContent =
    `Showing ${filtered.length} of ${ALL_PRODUCTS.length} items`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="state">
        <h3>No matching parts</h3>
        <p>Try a different category, sub-category, description, or part number.</p>
      </div>`;
    return;
  }
  grid.innerHTML = filtered.map(productCardHtml).join('');
  [...grid.querySelectorAll('.card')].forEach((el, i) => {
    el.style.animationDelay = (i * 0.03) + 's';
    const row = filtered[i];
    el.addEventListener('click', e => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      openProductModal(row);
    });
  });
}

function collectFilterValues(row, aliasKey) {
  return getFilterValues(row, aliasKey).map(v => normalizeFilterText(v));
}

function buildFilterGroups() {
  const categoryMap = new Map();
  const subCategoryMap = new Map();

  ALL_PRODUCTS.forEach(row => {
    const category = normalizeFilterText(getField(row, 'category'));
    const subCategory = normalizeFilterText(getField(row, 'subCategory'));
    const partName = normalizeFilterText(getField(row, 'partName'));

    if (!category) return;
    if (!categoryMap.has(category)) categoryMap.set(category, new Set());
    if (subCategory) {
      categoryMap.get(category).add(subCategory);
    }

    if (subCategory) {
      if (!subCategoryMap.has(subCategory)) subCategoryMap.set(subCategory, new Set());
      if (partName) {
        subCategoryMap.get(subCategory).add(partName);
      }
    }
  });

  const categoryEntries = [...categoryMap.entries()]
    .map(([category, subs]) => [category, [...subs].sort((a, b) => a.localeCompare(b))])
    .sort(([a], [b]) => a.localeCompare(b));

  const subCategoryEntries = [...subCategoryMap.entries()]
    .map(([subCategory, names]) => [subCategory, [...names].sort((a, b) => a.localeCompare(b))])
    .sort(([a], [b]) => a.localeCompare(b));

  return {
    categories: categoryEntries,
    subCategories: subCategoryEntries
  };
}

function syncDropdownOptions() {
  const categoryEl = document.getElementById('categoryFilter');
  const subCategoryEl = document.getElementById('subCategoryFilter');
  const partNameEl = document.getElementById('partNameFilter');

  const { categories, subCategories } = buildFilterGroups();

  const categoryOptions = categories.map(([category]) => category);
  const subCategoryOptions = FILTERS.category
    ? (categories.find(([category]) => category.toLowerCase() === FILTERS.category.toLowerCase())?.[1] || [])
    : subCategories.map(([subCategory]) => subCategory);

  const partNameOptions = FILTERS.subCategory
    ? (subCategories.find(([subCategory]) => subCategory.toLowerCase() === FILTERS.subCategory.toLowerCase())?.[1] || [])
    : (() => {
        const merged = new Set();
        subCategories.forEach(([, names]) => names.forEach(name => merged.add(name)));
        return [...merged].sort((a, b) => a.localeCompare(b));
      })();

  if (FILTERS.category && !categoryOptions.includes(FILTERS.category)) {
    FILTERS.category = '';
  }
  if (FILTERS.subCategory && !subCategoryOptions.includes(FILTERS.subCategory)) {
    FILTERS.subCategory = '';
  }
  if (FILTERS.partName && !partNameOptions.includes(FILTERS.partName)) {
    FILTERS.partName = '';
  }

  categoryEl.innerHTML = '<option value="">All Categories</option>' +
    categoryOptions.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
  subCategoryEl.innerHTML = '<option value="">All Sub-Categories</option>' +
    (subCategoryOptions.length ? subCategoryOptions.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('') : '');
  partNameEl.innerHTML = '<option value="">All Part Names</option>' +
    (partNameOptions.length ? partNameOptions.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('') : '');

  categoryEl.value = FILTERS.category || '';
  subCategoryEl.value = FILTERS.subCategory || '';
  partNameEl.value = FILTERS.partName || '';
}

function resetFilters() {
  FILTERS = { category: '', subCategory: '', partName: '' };
  syncDropdownOptions();
  render();
}

document.getElementById('searchInput').addEventListener('input', e => {
  SEARCH_TERM = e.target.value.trim();
  render();
});

document.getElementById('categoryFilter').addEventListener('change', e => {
  FILTERS.category = e.target.value;
  FILTERS.subCategory = '';
  FILTERS.partName = '';
  syncDropdownOptions();
  render();
});

document.getElementById('subCategoryFilter').addEventListener('change', e => {
  FILTERS.subCategory = e.target.value;
  FILTERS.partName = '';
  syncDropdownOptions();
  render();
});

document.getElementById('partNameFilter').addEventListener('change', e => {
  FILTERS.partName = e.target.value;
  syncDropdownOptions();
  render();
});

document.getElementById('clearFiltersBtn').addEventListener('click', resetFilters);

function showError(message, detail) {
  document.getElementById('grid').innerHTML = `
    <div class="state">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E0293B" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h3>${escapeHtml(message)}</h3>
      <p>Please check back shortly, or contact us directly using the buttons below.</p>
      ${detail ? `<details class="tech"><summary>Technical details (for site owner)</summary><code>${escapeHtml(detail)}</code></details>` : ''}
    </div>`;
}

function buildSupabaseUrl(orderBy) {
  const base = `${CONFIG.supabase.url}/rest/v1/${CONFIG.supabase.table}?select=*`;
  return orderBy ? `${base}&order=${encodeURIComponent(orderBy)}` : base;
}

async function loadProducts(orderBy = CONFIG.supabase.orderBy) {
  try {
    const url = buildSupabaseUrl(orderBy);
    const res = await fetch(url, {
      headers: {
        apikey: CONFIG.supabase.publishableKey,
        Authorization: `Bearer ${CONFIG.supabase.publishableKey}`
      }
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supabase responded ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Unexpected response shape from Supabase.');
    ALL_PRODUCTS = data;

    renderHero(ALL_PRODUCTS);

    if (ALL_PRODUCTS.length === 0) {
      showError('No parts yet', 'The products table returned 0 rows. Add rows to the table, or check RLS policy allows SELECT for the anon/public role.');
      return;
    }
    syncDropdownOptions();
    render();
  } catch (err) {
    const message = String(err.message || err);
    if (orderBy !== 'ItemCode.asc' && /column .* does not exist|42703/.test(message)) {
      console.warn('Supabase orderBy failed, retrying with ItemCode.asc');
      return loadProducts('ItemCode.asc');
    }
    if (orderBy !== '' && /column .* does not exist|42703/.test(message)) {
      console.warn('Supabase orderBy still failed, retrying without order');
      return loadProducts('');
    }
    console.error('Catalog load error:', err);
    renderHero([]);
    showError(
      "Couldn't load the catalog right now",
      `${message}\n\nCommon causes:\n- Table name "${CONFIG.supabase.table}" doesn't match your Supabase table\n- Row Level Security (RLS) is on but has no SELECT policy for the anon/public role\n- Column names differ from the defaults (edit fieldAliases in config.js)`
    );
  }
}

wireStaticContent();
loadProducts();
