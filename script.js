document.addEventListener('DOMContentLoaded', () => {
    createParticles();

    // Check URL params to auto-open overlays
    const params = new URLSearchParams(window.location.search);
    if (params.get('show') === 'writing') {
        document.getElementById('overlay-writing').classList.add('open');
        document.body.classList.add('has-overlay');
    }

    // Interactive desk items → open overlays
    document.querySelectorAll('.interactive').forEach(item => {
        item.addEventListener('click', () => openOverlay(item.dataset.target));
        item.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openOverlay(item.dataset.target);
            }
        });
    });

    // Close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeAll);
    });

    // Backdrop click closes
    document.querySelectorAll('.overlay').forEach(ov => {
        ov.addEventListener('click', e => { if (e.target === ov) closeAll(); });
    });

    // Escape key
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

    // === Sound Effects ===
    // File-based sounds (more realistic)
    const sfxCat = new Audio('sfx/sfx_cat.wav');
    const sfxPaper = new Audio('sfx/sfx_paper.wav');
    const sfxPhone = new Audio('sfx/sfx_phone.wav');
    sfxCat.volume = 0.6;
    sfxPaper.volume = 0.7;
    sfxPhone.volume = 0.5;

    function playSfx(audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }

    // Web Audio synth for remaining sounds
    let audioCtx;
    function getAudioCtx() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    // Wood knock sound
    function playWoodSound() {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.07);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        // Add a noise burst for wood texture
        const bufLen = ctx.sampleRate * 0.03;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * (1 - i/bufLen);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const nGain = ctx.createGain();
        nGain.gain.value = 0.3;
        noise.connect(nGain).connect(ctx.destination);
        noise.start();
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    }

    // Leaves rustle sound
    function playLeavesSound() {
        const ctx = getAudioCtx();
        const bufferSize = ctx.sampleRate * 0.45;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            const env = Math.sin(t * Math.PI);
            data[i] = (Math.random() * 2 - 1) * env * 0.25;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1800;
        const gain = ctx.createGain();
        gain.gain.value = 0.4;
        source.connect(filter).connect(gain).connect(ctx.destination);
        source.start();
    }

    // Computer chime sound
    function playChimeSound() {
        const ctx = getAudioCtx();
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 880;
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 1320;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime + 0.1);
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.4);
    }

    // Attach hover sounds
    const docsEl = document.querySelector('.documents');
    if (docsEl) docsEl.addEventListener('mouseenter', () => playSfx(sfxPaper));

    const frameEl = document.querySelector('.frame');
    if (frameEl) frameEl.addEventListener('mouseenter', playWoodSound);

    const laptopEl = document.querySelector('.laptop-group');
    if (laptopEl) laptopEl.addEventListener('mouseenter', playChimeSound);

    const phoneEl = document.querySelector('.phone');
    if (phoneEl) phoneEl.addEventListener('mouseenter', () => playSfx(sfxPhone));

    // Cat hover → speech bubble + sound
    const cat = document.getElementById('desk-cat');
    const bubble = document.getElementById('catBubble');
    if (cat && bubble) {
        cat.addEventListener('mouseenter', () => { bubble.classList.add('show'); playSfx(sfxCat); });
        cat.addEventListener('mouseleave', () => bubble.classList.remove('show'));
    }

    // Poster hover → speech bubble
    const poster = document.getElementById('wall-poster');
    const posterBubble = document.getElementById('posterBubble');
    if (poster && posterBubble) {
        poster.addEventListener('mouseenter', () => posterBubble.classList.add('show'));
        poster.addEventListener('mouseleave', () => posterBubble.classList.remove('show'));
    }

    // Plant hover → butterfly flies out + leaves sound
    const plant = document.getElementById('floor-plant');
    const butterfly = document.getElementById('butterfly');
    if (plant && butterfly) {
        plant.addEventListener('mouseenter', () => {
            butterfly.classList.remove('fly');
            void butterfly.offsetWidth;
            butterfly.classList.add('fly');
            playLeavesSound();
        });
    }

    // Speaker → BGM control
    const audio = document.getElementById('bgmAudio');
    const playBtn = document.getElementById('spPlayBtn');
    const volumeSlider = document.getElementById('spVolume');
    const speakerPanel = document.getElementById('speakerPanel');
    const speakerEl = document.getElementById('desk-speaker');
    if (audio && playBtn && volumeSlider && speakerEl) {
        audio.volume = 0.5;

        // Autoplay on first user interaction (browsers block autoplay without gesture)
        function tryAutoplay() {
            audio.play().then(() => {
                playBtn.textContent = '\u275A\u275A';
                playBtn.classList.add('playing');
            }).catch(() => {
                // Autoplay blocked, wait for user gesture
                const startOnGesture = () => {
                    audio.play().then(() => {
                        playBtn.textContent = '\u275A\u275A';
                        playBtn.classList.add('playing');
                    });
                    document.removeEventListener('click', startOnGesture);
                    document.removeEventListener('keydown', startOnGesture);
                };
                document.addEventListener('click', startOnGesture);
                document.addEventListener('keydown', startOnGesture);
            });
        }
        tryAutoplay();

        // Keep panel visible while interacting
        let panelTimeout;
        speakerEl.addEventListener('mouseenter', () => {
            clearTimeout(panelTimeout);
            speakerPanel.classList.add('active');
        });
        speakerEl.addEventListener('mouseleave', () => {
            panelTimeout = setTimeout(() => {
                speakerPanel.classList.remove('active');
            }, 300);
        });
        speakerPanel.addEventListener('mouseenter', () => {
            clearTimeout(panelTimeout);
            speakerPanel.classList.add('active');
        });
        speakerPanel.addEventListener('mouseleave', () => {
            panelTimeout = setTimeout(() => {
                speakerPanel.classList.remove('active');
            }, 300);
        });

        // Play/pause button
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (audio.paused) {
                audio.play();
                playBtn.textContent = '\u275A\u275A';
                playBtn.classList.add('playing');
            } else {
                audio.pause();
                playBtn.textContent = '\u25B6';
                playBtn.classList.remove('playing');
            }
        });

        // Volume slider
        volumeSlider.addEventListener('input', (e) => {
            e.stopPropagation();
            audio.volume = e.target.value / 100;
        });
        volumeSlider.addEventListener('click', (e) => e.stopPropagation());
    }

    // Hide hint on first click
    document.querySelectorAll('.interactive').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('hint').classList.add('gone');
        }, { once: true });
    });
});

function openOverlay(name) {
    const ov = document.getElementById('overlay-' + name);
    if (!ov) return;
    ov.classList.add('open');
    document.body.classList.add('has-overlay');
    const btn = ov.querySelector('.close-btn');
    if (btn) setTimeout(() => btn.focus(), 120);
}

function closeAll() {
    document.querySelectorAll('.overlay').forEach(ov => ov.classList.remove('open'));
    document.body.classList.remove('has-overlay');
}

function showVideoWorks() {
    // Close portfolio overlay, open video works
    document.getElementById('overlay-portfolio').classList.remove('open');
    const vov = document.getElementById('overlay-videos');
    vov.classList.add('open');
    document.body.classList.add('has-overlay');
}

function closeVideos() {
    document.getElementById('overlay-videos').classList.remove('open');
    document.body.classList.remove('has-overlay');
}

function backToPortfolio() {
    document.getElementById('overlay-videos').classList.remove('open');
    document.getElementById('overlay-portfolio').classList.add('open');
}

// === Writing Works ===
function showWritingWorks() {
    document.getElementById('overlay-portfolio').classList.remove('open');
    document.getElementById('overlay-writing').classList.add('open');
    document.body.classList.add('has-overlay');
}

function closeWriting() {
    document.getElementById('overlay-writing').classList.remove('open');
    document.body.classList.remove('has-overlay');
}

function backToPortfolioFromWriting() {
    document.getElementById('overlay-writing').classList.remove('open');
    document.getElementById('overlay-portfolio').classList.add('open');
}

// === Photo Gallery ===
function showPhotoWorks() {
    document.getElementById('overlay-portfolio').classList.remove('open');
    document.getElementById('overlay-photos').classList.add('open');
    document.body.classList.add('has-overlay');
}

function closePhotos() {
    document.getElementById('overlay-photos').classList.remove('open');
    document.body.classList.remove('has-overlay');
}

function backToPortfolioFromPhotos() {
    document.getElementById('overlay-photos').classList.remove('open');
    document.getElementById('overlay-portfolio').classList.add('open');
}

// Lightbox
const photoSources = [
    'photos/photo_01.jpg','photos/photo_02.jpg','photos/photo_03.jpg','photos/photo_04.jpg',
    'photos/photo_05.jpg','photos/photo_06.jpg','photos/photo_07.jpg','photos/photo_08.jpg',
    'photos/photo_09.jpg','photos/photo_10.jpg','photos/photo_11.jpg'
];
const photoCaptions = [
    { title: '小黄遇上小黄', meta: '2025 | 苏州', lines: ['西园寺又称猫猫寺', '到了冬天猫咪们会很聪明地躺在阳光下，美美睡上半晌午觉'] },
    { title: '佛堂外的小男孩', meta: '2023 | 新加坡', lines: ['大一的暑假，仲思睿去新加坡研学，经过牛车水', '恰好遇见一个男孩坐在佛堂前'] },
    { title: '广陵一隅', meta: '2023 | 扬州', lines: ['旅行途中偶然发现了一个充满广陵气质的小角落'] },
    { title: '东方之门', meta: '2024 | 苏州', lines: ['这是苏州工业园区的地标建筑之一——东方之门', '天晴时，电子幕墙就变成了天空的镜子'] },
    { title: '工人', meta: '2020 | 苏州', lines: ['那天仲思睿走在大街上，无意间一抬头——', '因为很喜欢这样的色彩对比，于是拍下了这张照片'] },
    { title: '雨夜的公交车', meta: '2025 | 苏州', lines: ['"当107路再次经过~时间是带走~青春的列车~"🎵', '——赵雷《鼓楼》'] },
    { title: '摩登叔叔', meta: '2026 | 苏州', lines: ['西园寺门前总是停着一长溜的等着接客的电动三轮车', '照片里的叔叔是这么多司机中最摩登的一位😎'] },
    { title: '泡泡公主', meta: '2026 | 苏州', lines: ['小朋友的笑容就是很有感染力呀~'] },
    { title: '雨夜竞速', meta: '2026 | 苏州', lines: ['照片拍摄于苏州春天的一个雨夜', '城市的霓虹灯、商场的电子大屏、车身的反光、以及地面积水，交相辉映', '"苏州果然是繁华又宜居的城市啊"'] },
    { title: '三个“小蓝”', meta: '2026 | 苏州', lines: ['那天仲思睿找朋友一起出去玩，经过苏州大学门口的天桥', '偶然往下一瞥，发现三个“小蓝”排成了一列往前开', 'A lovely coincidence'] },
    { title: '雨伞的助攻', meta: '2026 | 苏州', lines: ['小小的雨伞是最强的助攻', '不动声色就拉近了情侣的距离😄'] }
];
let currentPhotoIndex = 0;

function openLightbox(index) {
    currentPhotoIndex = index;
    const lb = document.getElementById('lightbox');
    document.getElementById('lightboxImg').src = photoSources[index];
    renderCaption(index);
    lb.classList.add('open');
}

function renderCaption(index) {
    const cap = document.getElementById('lightboxCaption');
    const data = photoCaptions[index];
    if (!data) { cap.innerHTML = ''; return; }
    let html = `<strong class="lb-title">${data.title}</strong>`;
    html += `<span class="lb-meta">${data.meta}</span>`;
    html += `<span class="lb-lines">`;
    data.lines.forEach(l => { html += `<span class="lb-line">${l}</span>`; });
    html += `</span>`;
    cap.innerHTML = html;
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
}

function nextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photoSources.length;
    document.getElementById('lightboxImg').src = photoSources[currentPhotoIndex];
    renderCaption(currentPhotoIndex);
}

function prevPhoto() {
    currentPhotoIndex = (currentPhotoIndex - 1 + photoSources.length) % photoSources.length;
    document.getElementById('lightboxImg').src = photoSources[currentPhotoIndex];
    renderCaption(currentPhotoIndex);
}

// Attach click events to photo items + gallery scrolling
document.addEventListener('DOMContentLoaded', () => {
    // Gallery: auto-scroll + trackpad/touch + infinite loop
    const gallery = document.getElementById('photoGallery');
    if (gallery) {
        const autoScrollSpeed = 0.3; // px per frame (slower)
        let userInteracting = false;
        let interactionTimer = null;
        let isDragging = false;
        let dragMoved = false;
        let startX, scrollStart;

        // Duplicate items for seamless infinite loop
        const originalHTML = gallery.innerHTML;
        gallery.innerHTML = originalHTML + originalHTML;

        // Auto-scroll via requestAnimationFrame
        function tick() {
            if (!userInteracting) {
                gallery.scrollLeft += autoScrollSpeed;
                // Seamless loop: when scrolled past first set, jump back
                const halfWidth = gallery.scrollWidth / 2;
                if (gallery.scrollLeft >= halfWidth) {
                    gallery.scrollLeft -= halfWidth;
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Temporarily pause auto-scroll, resume after idle
        function pauseAuto() {
            userInteracting = true;
            clearTimeout(interactionTimer);
            interactionTimer = setTimeout(() => {
                userInteracting = false;
            }, 4000);
        }

        // Trackpad & mouse wheel: translate any scroll into horizontal
        gallery.addEventListener('wheel', (e) => {
            e.preventDefault();
            // Use deltaX if available (trackpad horizontal), else deltaY
            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            gallery.scrollLeft += delta;
            pauseAuto();
        }, { passive: false });

        // Touch: swipe left/right
        let touchStartX = 0;
        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            pauseAuto();
        }, { passive: true });
        gallery.addEventListener('touchmove', (e) => {
            const dx = touchStartX - e.touches[0].clientX;
            gallery.scrollLeft += dx;
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        // Mouse drag
        gallery.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragMoved = false;
            startX = e.pageX;
            scrollStart = gallery.scrollLeft;
            gallery.style.cursor = 'grabbing';
            pauseAuto();
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.pageX - startX;
            if (Math.abs(dx) > 3) dragMoved = true;
            gallery.scrollLeft = scrollStart - dx;
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (gallery) gallery.style.cursor = 'grab';
        });

        // Click on photo items (including duplicates)
        gallery.querySelectorAll('.photo-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (dragMoved) { e.preventDefault(); e.stopPropagation(); return; }
                openLightbox(parseInt(item.dataset.index));
            });
        });
    }

    // Escape / Arrow keys for lightbox
    document.addEventListener('keydown', e => {
        const lb = document.getElementById('lightbox');
        if (!lb || !lb.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
    });
});

function createParticles() {
    const box = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'dot';
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 8) + 's';
        p.style.animationDuration = (5 + Math.random() * 5) + 's';
        const size = 2 + Math.random() * 2;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        box.appendChild(p);
    }
}
