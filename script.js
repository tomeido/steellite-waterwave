// ===================================
// Steellite Water Wave Panel
// Interactive JavaScript
// ===================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initLoader();
    initNavigation();
    initHeroVideo(); // Random video Init
    initHeroCanvas();
    initDemoVideo();
    initScrollAnimations();
    initGallery();
    initLightbox();
    initContactForm();
    initCursorLight();
});

// ===================================
// Hero Video - Random Selection
// ===================================
function initHeroVideo() {
    const videoElement = document.getElementById('heroVideo');
    if (!videoElement) return;

    const fixedVideo = 'images/main_video.mp4';

    // Find source element or create if not exists (though HTML has one)
    let sourceElement = videoElement.querySelector('source');
    if (!sourceElement) {
        sourceElement = document.createElement('source');
        sourceElement.type = 'video/mp4';
        videoElement.appendChild(sourceElement);
    }

    sourceElement.src = fixedVideo;
    videoElement.load();
    // Verify play promise to handle potential autoplay policies
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Auto-play was prevented:", error);
            // Fallback UI or muted check could go here
        });
    }
}

// ===================================
// Loader
// ===================================
function initLoader() {
    const loader = document.getElementById('loader');

    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1500);
    });
}

// ===================================
// Navigation
// ===================================
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ===================================
// Hero Canvas - WebGL Water Effect
// ===================================
function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create water surface geometry
    const geometry = new THREE.PlaneGeometry(40, 40, 128, 128);

    // Shader material for water wave effect
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            uLightPosition: { value: new THREE.Vector3(0, 0, 5) },
            uBaseColor: { value: new THREE.Color(0x1a1a1a) },
            uHighlightColor: { value: new THREE.Color(0xd4af37) },
            uSecondaryColor: { value: new THREE.Color(0xc0c0c0) }
        },
        vertexShader: `
            uniform float uTime;
            uniform vec2 uMouse;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vElevation;
            
            // Simplex noise function
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                vec3 i  = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vUv = uv;
                
                vec3 pos = position;
                
                // Multiple wave layers
                float wave1 = snoise(vec3(pos.x * 0.3, pos.y * 0.3, uTime * 0.3)) * 0.5;
                float wave2 = snoise(vec3(pos.x * 0.6 + 100.0, pos.y * 0.6, uTime * 0.4)) * 0.25;
                float wave3 = snoise(vec3(pos.x * 1.2, pos.y * 1.2 + 100.0, uTime * 0.5)) * 0.125;
                
                // Mouse influence
                float mouseDist = distance(uv, uMouse);
                float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.3;
                float mouseWave = sin(mouseDist * 20.0 - uTime * 3.0) * mouseInfluence;
                
                float elevation = wave1 + wave2 + wave3 + mouseWave;
                pos.z += elevation;
                
                vElevation = elevation;
                vPosition = pos;
                
                // Calculate normal
                float delta = 0.01;
                float px = snoise(vec3((pos.x + delta) * 0.3, pos.y * 0.3, uTime * 0.3));
                float nx = snoise(vec3((pos.x - delta) * 0.3, pos.y * 0.3, uTime * 0.3));
                float py = snoise(vec3(pos.x * 0.3, (pos.y + delta) * 0.3, uTime * 0.3));
                float ny = snoise(vec3(pos.x * 0.3, (pos.y - delta) * 0.3, uTime * 0.3));
                
                vec3 tangentX = normalize(vec3(2.0 * delta, 0.0, px - nx));
                vec3 tangentY = normalize(vec3(0.0, 2.0 * delta, py - ny));
                vNormal = normalize(cross(tangentX, tangentY));
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec2 uMouse;
            uniform vec3 uLightPosition;
            uniform vec3 uBaseColor;
            uniform vec3 uHighlightColor;
            uniform vec3 uSecondaryColor;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vPosition;
            varying float vElevation;
            
            void main() {
                // Light direction from mouse position
                vec3 lightPos = vec3((uMouse.x - 0.5) * 20.0, (uMouse.y - 0.5) * 20.0, 8.0);
                vec3 lightDir = normalize(lightPos - vPosition);
                vec3 viewDir = normalize(vec3(0.0, 0.0, 10.0) - vPosition);
                vec3 halfDir = normalize(lightDir + viewDir);
                
                // Specular reflection
                float specularStrength = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
                float specular2 = pow(max(dot(vNormal, halfDir), 0.0), 128.0);
                
                // Fresnel effect
                float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
                
                // Base color with elevation
                vec3 color = uBaseColor;
                color += uHighlightColor * specularStrength * 0.8;
                color += uSecondaryColor * specular2 * 0.5;
                color += uSecondaryColor * fresnel * 0.3;
                
                // Add subtle variation based on position
                color += vec3(0.02) * sin(vUv.x * 50.0 + uTime) * sin(vUv.y * 50.0);
                
                // Vignette effect
                float vignette = 1.0 - distance(vUv, vec2(0.5)) * 0.5;
                color *= vignette;
                
                gl_FragColor = vec4(color, 0.9);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2.5;
    scene.add(mesh);

    camera.position.z = 12;
    camera.position.y = 5;
    camera.lookAt(0, 0, 0);

    // Mouse tracking
    let mouseX = 0.5;
    let mouseY = 0.5;
    let targetMouseX = 0.5;
    let targetMouseY = 0.5;

    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX / window.innerWidth;
        targetMouseY = 1.0 - e.clientY / window.innerHeight;
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        material.uniforms.uTime.value += 0.01;

        // Smooth mouse following
        mouseX += (targetMouseX - mouseX) * 0.05;
        mouseY += (targetMouseY - mouseY) * 0.05;
        material.uniforms.uMouse.value.set(mouseX, mouseY);

        renderer.render(scene, camera);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });
}

// ===================================
// Demo Video - Random Selection
// ===================================
function initDemoVideo() {
    const videoElement = document.getElementById('demoVideo');
    if (!videoElement) return;

    const videos = [
        'data/sub (1).mp4',
        'data/sub (2).mp4',
        'data/sub (3).mp4',
        'data/sub (4).mp4'
    ];

    const randomVideo = videos[Math.floor(Math.random() * videos.length)];

    let sourceElement = videoElement.querySelector('source');
    if (!sourceElement) {
        sourceElement = document.createElement('source');
        sourceElement.type = 'video/mp4';
        videoElement.appendChild(sourceElement);
    }

    sourceElement.src = randomVideo;
    videoElement.load();

    // Attempt play
    const playPromise = videoElement.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Auto-play was prevented:", error);
        });
    }
}

// ===================================
// Scroll Animations
// ===================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.about-text, .about-visual, .gallery-item, .contact-info, .contact-form').forEach(el => {
        observer.observe(el);
    });
}

// ===================================
// Gallery - Random Image Loader
// ===================================
function initGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    if (!galleryGrid) return;

    // Total number of project images available (project-1.jpg to project-318.jpg)
    const TOTAL_IMAGES = 362;
    const DISPLAY_COUNT = 21;

    // Layout patterns for visual variety - repeats a 7-item block that fits the 3-column grid perfectly without holes
    // Block: [Large(2x2), Norm, Norm] (2 rows) + [Wide(2x1), Norm] (1 row) + [Norm, Wide(2x1)] (1 row)
    const patternBlock = ['large', '', '', 'wide', '', '', 'wide'];
    const layoutPatterns = [...patternBlock, ...patternBlock, ...patternBlock];

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Generate array of all image indices and shuffle to pick random ones
    // Filter out known missing images (86-96 based on directory listing)
    const missingImages = [86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96];
    const allIndices = Array.from({ length: TOTAL_IMAGES }, (_, i) => i + 1)
        .filter(index => !missingImages.includes(index));

    const randomIndices = shuffleArray(allIndices).slice(0, DISPLAY_COUNT);

    // Create gallery HTML
    const galleryHTML = randomIndices.map((imageNum, index) => {
        const layoutClass = layoutPatterns[index] || '';
        const filename = `project-${imageNum}.jpg`;
        // Use global imageLocations if available, otherwise fallback
        const locationName = (typeof imageLocations !== 'undefined' && imageLocations[filename])
            ? imageLocations[filename]
            : `시공 사례 #${imageNum}`;

        const subText = (locationName !== `시공 사례 #${imageNum}`)
            ? `Project #${imageNum}`
            : 'Water Wave Panel이 만들어낸 특별한 공간';

        return `
            <div class="gallery-item ${layoutClass}" data-index="${index}">
                <img src="images/project-${imageNum}.jpg" alt="${locationName}" loading="lazy" onerror="this.onerror=null; this.src='images/project-1.jpg';">
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <span class="gallery-tag">Project</span>
                        <h3>${locationName}</h3>
                        <p>${subText}</p>
                    </div>
                    <div class="gallery-zoom">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="M21 21l-4.35-4.35" />
                            <path d="M11 8v6M8 11h6" />
                        </svg>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    galleryGrid.innerHTML = galleryHTML;

    // Apply staggered animation delay to newly created items
    const galleryItems = galleryGrid.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.1}s`;
    });

    // Set up IntersectionObserver for dynamically created gallery items
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    galleryItems.forEach(item => {
        observer.observe(item);
    });
}

// ===================================
// Lightbox
// ===================================
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    const galleryItems = document.querySelectorAll('.gallery-item');

    const images = Array.from(galleryItems).map(item => item.querySelector('img').src);
    let currentIndex = 0;

    function openLightbox(index) {
        currentIndex = index;
        lightboxImage.src = images[currentIndex];
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showPrev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        lightboxImage.src = images[currentIndex];
    }

    function showNext() {
        currentIndex = (currentIndex + 1) % images.length;
        lightboxImage.src = images[currentIndex];
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', showPrev);
    nextBtn.addEventListener('click', showNext);

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') showPrev();
        if (e.key === 'ArrowRight') showNext();
    });
}

// ===================================
// Contact Form
// ===================================
function initContactForm() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Simple validation feedback
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = `
            <span>전송 중...</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
            </svg>
        `;
        submitBtn.disabled = true;

        // Simulate submission
        setTimeout(() => {
            submitBtn.innerHTML = `
                <span>전송 완료!</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                form.reset();
            }, 2000);
        }, 1500);
    });
}

// ===================================
// Cursor Light Effect
// ===================================
function initCursorLight() {
    const cursorLight = document.getElementById('cursorLight');
    let isActive = false;

    document.addEventListener('mousemove', (e) => {
        cursorLight.style.left = e.clientX + 'px';
        cursorLight.style.top = e.clientY + 'px';

        if (!isActive) {
            isActive = true;
            cursorLight.classList.add('active');
        }
    });

    document.addEventListener('mouseleave', () => {
        isActive = false;
        cursorLight.classList.remove('active');
    });
}
