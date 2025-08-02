// Emoji and GIF Website JavaScript - Complete Functionality
class EmojiGifWebsite {
    constructor() {
        this.selectedItems = new Set();
        this.downloadQueue = [];
        this.currentFilter = 'all';
        this.canvas = null;
        this.ctx = null;
        this.uploadedImage = null;
        this.customEmojiCounter = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
        this.loadDefaultEmojis();
        this.loadDefaultGifs();
        this.updateSelectedCount();
        this.initJoinChannelsFeature();
        this.setupJoinEventListener();
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('emoji-search').addEventListener('input', (e) => {
            this.searchEmojis(e.target.value);
        });

        document.getElementById('gif-search').addEventListener('input', (e) => {
            this.searchGifs(e.target.value);
        });

        // Upload functionality
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('image-upload');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Canvas controls
        document.getElementById('size-slider').addEventListener('input', this.updateCanvasSize.bind(this));
        document.getElementById('border-radius').addEventListener('input', this.updateBorderRadius.bind(this));
        document.getElementById('bg-color').addEventListener('change', this.updateBackgroundColor.bind(this));

        // Smooth scrolling for navigation (only for internal section links)
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href');
            // Only add smooth scroll to internal hash links
            if (href && href.startsWith('#')) {
                link.addEventListener('click', this.smoothScroll.bind(this));
            }
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('emoji-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawDefaultCanvas();
    }

    drawDefaultCanvas() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw placeholder
        this.ctx.fillStyle = '#6366f1';
        this.ctx.font = '24px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Upload an image to start', this.canvas.width/2, this.canvas.height/2);
    }

    loadDefaultEmojis() {
        const emojiData = {
            smileys: [
                { emoji: '😀', name: 'Grinning Face', category: 'smileys' },
                { emoji: '😃', name: 'Grinning Face with Big Eyes', category: 'smileys' },
                { emoji: '😄', name: 'Grinning Face with Smiling Eyes', category: 'smileys' },
                { emoji: '😁', name: 'Beaming Face with Smiling Eyes', category: 'smileys' },
                { emoji: '😆', name: 'Grinning Squinting Face', category: 'smileys' },
                { emoji: '😅', name: 'Grinning Face with Sweat', category: 'smileys' },
                { emoji: '🤣', name: 'Rolling on Floor Laughing', category: 'smileys' },
                { emoji: '😂', name: 'Face with Tears of Joy', category: 'smileys' },
                { emoji: '🙂', name: 'Slightly Smiling Face', category: 'smileys' },
                { emoji: '🙃', name: 'Upside-Down Face', category: 'smileys' },
                { emoji: '😉', name: 'Winking Face', category: 'smileys' },
                { emoji: '😊', name: 'Smiling Face with Smiling Eyes', category: 'smileys' }
            ],
            animals: [
                { emoji: '🐶', name: 'Dog Face', category: 'animals' },
                { emoji: '🐱', name: 'Cat Face', category: 'animals' },
                { emoji: '🐭', name: 'Mouse Face', category: 'animals' },
                { emoji: '🐹', name: 'Hamster', category: 'animals' },
                { emoji: '🐰', name: 'Rabbit Face', category: 'animals' },
                { emoji: '🦊', name: 'Fox', category: 'animals' },
                { emoji: '🐻', name: 'Bear', category: 'animals' },
                { emoji: '🐼', name: 'Panda', category: 'animals' },
                { emoji: '🐨', name: 'Koala', category: 'animals' },
                { emoji: '🐯', name: 'Tiger Face', category: 'animals' },
                { emoji: '🦁', name: 'Lion', category: 'animals' },
                { emoji: '🐮', name: 'Cow Face', category: 'animals' }
            ],
            food: [
                { emoji: '🍕', name: 'Pizza', category: 'food' },
                { emoji: '🍔', name: 'Hamburger', category: 'food' },
                { emoji: '🍟', name: 'French Fries', category: 'food' },
                { emoji: '🌭', name: 'Hot Dog', category: 'food' },
                { emoji: '🥪', name: 'Sandwich', category: 'food' },
                { emoji: '🌮', name: 'Taco', category: 'food' },
                { emoji: '🍎', name: 'Red Apple', category: 'food' },
                { emoji: '🍌', name: 'Banana', category: 'food' },
                { emoji: '🍓', name: 'Strawberry', category: 'food' },
                { emoji: '🍇', name: 'Grapes', category: 'food' },
                { emoji: '🥑', name: 'Avocado', category: 'food' },
                { emoji: '🍉', name: 'Watermelon', category: 'food' }
            ],
            objects: [
                { emoji: '⚽', name: 'Soccer Ball', category: 'objects' },
                { emoji: '🏀', name: 'Basketball', category: 'objects' },
                { emoji: '🏈', name: 'American Football', category: 'objects' },
                { emoji: '⚾', name: 'Baseball', category: 'objects' },
                { emoji: '🎾', name: 'Tennis', category: 'objects' },
                { emoji: '🏐', name: 'Volleyball', category: 'objects' },
                { emoji: '📱', name: 'Mobile Phone', category: 'objects' },
                { emoji: '💻', name: 'Laptop', category: 'objects' },
                { emoji: '🖥️', name: 'Desktop Computer', category: 'objects' },
                { emoji: '📷', name: 'Camera', category: 'objects' },
                { emoji: '🎮', name: 'Video Game', category: 'objects' },
                { emoji: '🎸', name: 'Guitar', category: 'objects' }
            ],
            nature: [
                { emoji: '🌳', name: 'Deciduous Tree', category: 'nature' },
                { emoji: '🌲', name: 'Evergreen Tree', category: 'nature' },
                { emoji: '🌸', name: 'Cherry Blossom', category: 'nature' },
                { emoji: '🌺', name: 'Hibiscus', category: 'nature' },
                { emoji: '🌻', name: 'Sunflower', category: 'nature' },
                { emoji: '🌹', name: 'Rose', category: 'nature' },
                { emoji: '🌿', name: 'Herb', category: 'nature' },
                { emoji: '🍀', name: 'Four Leaf Clover', category: 'nature' },
                { emoji: '🌈', name: 'Rainbow', category: 'nature' },
                { emoji: '⭐', name: 'Star', category: 'nature' },
                { emoji: '🌙', name: 'Crescent Moon', category: 'nature' },
                { emoji: '☀️', name: 'Sun', category: 'nature' }
            ]
        };

        this.allEmojis = Object.values(emojiData).flat();
        this.displayEmojis(this.allEmojis);
    }

    loadDefaultGifs() {
        // Sample GIF data with reliable URLs and fallbacks
        const gifData = [
            { id: 1, title: 'Happy Dance', url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
            { id: 2, title: 'Celebration', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
            { id: 3, title: 'Thumbs Up', url: 'https://media.giphy.com/media/3o7abA4a17Rtllj9ty/giphy.gif' },
            { id: 4, title: 'Clapping', url: 'https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif' },
            { id: 5, title: 'Working Example', url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif' },
            { id: 6, title: 'Another Test', url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif' },
            { id: 7, title: 'Success!', url: 'https://media.giphy.com/media/26gYzIu8vQz5Lk7WE/giphy.gif' },
            { id: 8, title: 'Great!', url: 'https://media.giphy.com/media/l0MYryZTmQgvHI5TG/giphy.gif' }
        ];

        console.log('Loading default GIFs...', gifData.length, 'GIFs');
        this.allGifs = gifData;
        this.displayGifs(this.allGifs);
        
        // Test if the first GIF loads
        setTimeout(() => {
            console.log('Testing first GIF URL:', gifData[0].url);
            const testImg = new Image();
            testImg.onload = () => console.log('✅ First GIF loads successfully');
            testImg.onerror = (err) => console.error('❌ First GIF failed to load:', err);
            testImg.src = gifData[0].url;
        }, 1000);
    }

    displayEmojis(emojis) {
        const emojiGrid = document.getElementById('emoji-grid');
        emojiGrid.innerHTML = '';

        if (emojis.length === 0) {
            emojiGrid.innerHTML = '<div class="loading">No emojis found</div>';
            return;
        }

        emojis.forEach((emojiData, index) => {
            const emojiItem = document.createElement('div');
            emojiItem.className = 'emoji-item fade-in-scale';
            emojiItem.style.animationDelay = `${index * 0.1}s`;
            
            emojiItem.innerHTML = `
                <span class="emoji">${emojiData.emoji}</span>
                <div class="name">${emojiData.name}</div>
                <button class="download-btn" onclick="emojiWebsite.downloadEmoji('${emojiData.emoji}', '${emojiData.name}')">
                    Download
                </button>
            `;

            emojiItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('download-btn')) {
                    this.toggleEmojiSelection(emojiItem, emojiData);
                }
            });

            emojiGrid.appendChild(emojiItem);
        });
    }

    displayGifs(gifs) {
        console.log('displayGifs called with', gifs.length, 'GIFs');
        const gifGrid = document.getElementById('gif-grid');
        
        if (!gifGrid) {
            console.error('gif-grid element not found!');
            return;
        }
        
        gifGrid.innerHTML = '';

        if (gifs.length === 0) {
            gifGrid.innerHTML = '<div class="loading">No GIFs found</div>';
            return;
        }

        gifs.forEach((gifData, index) => {
            const gifItem = document.createElement('div');
            gifItem.className = 'gif-item fade-in-scale';
            gifItem.style.animationDelay = `${index * 0.1}s`;

            // --- Skeleton loader ---
            const skeleton = document.createElement('div');
            skeleton.className = 'gif-skeleton';
            gifItem.appendChild(skeleton);

            const img = document.createElement('img');
            img.src = gifData.url;
            img.alt = gifData.title;
            img.loading = 'lazy';
            img.style.display = 'none';
            img.onerror = function() {
                console.error('Failed to load GIF:', gifData.url);
                this.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
                        <rect width="200" height="200" fill="#f3f4f6"/>
                        <rect x="20" y="20" width="160" height="160" fill="#e5e7eb" rx="10"/>
                        <text x="100" y="80" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">GIF</text>
                        <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">Failed to Load</text>
                        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="10" fill="#d1d5db">${gifData.title}</text>
                    </svg>
                `);
                skeleton.remove();
                this.style.display = '';
            };
            img.onload = function() {
                console.log('Successfully loaded GIF:', gifData.url);
                skeleton.remove();
                this.style.display = '';
            };
            gifItem.appendChild(img);

            const gifInfo = document.createElement('div');
            gifInfo.className = 'gif-info';
            gifInfo.innerHTML = `
                <div class="gif-title">${gifData.title}</div>
                <button class="download-btn" onclick="emojiWebsite.downloadGif('${gifData.url}', '${gifData.title}')">
                    Download
                </button>
            `;
            gifItem.appendChild(gifInfo);

            gifItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('download-btn')) {
                    this.toggleGifSelection(gifItem, gifData);
                }
            });

            gifGrid.appendChild(gifItem);
        });
    }

    toggleEmojiSelection(element, emojiData) {
        element.classList.toggle('selected');
        const itemId = `emoji-${emojiData.emoji}`;
        
        if (element.classList.contains('selected')) {
            this.selectedItems.add(itemId);
            this.addToDownloadQueue({
                id: itemId,
                type: 'emoji',
                content: emojiData.emoji,
                name: emojiData.name
            });
        } else {
            this.selectedItems.delete(itemId);
            this.removeFromDownloadQueue(itemId);
        }
        
        this.updateSelectedCount();
    }

    toggleGifSelection(element, gifData) {
        element.classList.toggle('selected');
        const itemId = `gif-${gifData.id}`;
        
        if (element.classList.contains('selected')) {
            this.selectedItems.add(itemId);
            this.addToDownloadQueue({
                id: itemId,
                type: 'gif',
                content: gifData.url,
                name: gifData.title
            });
        } else {
            this.selectedItems.delete(itemId);
            this.removeFromDownloadQueue(itemId);
        }
        
        this.updateSelectedCount();
    }

    addToDownloadQueue(item) {
        if (!this.downloadQueue.find(queueItem => queueItem.id === item.id)) {
            this.downloadQueue.push(item);
            this.updateDownloadQueue();
        }
    }

    removeFromDownloadQueue(itemId) {
        this.downloadQueue = this.downloadQueue.filter(item => item.id !== itemId);
        this.updateDownloadQueue();
    }

    updateDownloadQueue() {
        const queueContainer = document.getElementById('download-queue');
        queueContainer.innerHTML = '';

        this.downloadQueue.forEach(item => {
            const queueItem = document.createElement('div');
            queueItem.className = 'download-item fade-in-scale';
            
            const preview = item.type === 'emoji' ? item.content : '🎬';
            
            queueItem.innerHTML = `
                <button class="remove-btn" onclick="emojiWebsite.removeFromQueue('${item.id}')">&times;</button>
                <span class="preview">${preview}</span>
                <div class="name">${item.name}</div>
                <input type="checkbox" checked onchange="emojiWebsite.toggleQueueSelection('${item.id}', this.checked)">
            `;

            queueContainer.appendChild(queueItem);
        });
    }

    removeFromQueue(itemId) {
        this.selectedItems.delete(itemId);
        this.removeFromDownloadQueue(itemId);
        this.updateSelectedCount();
        
        // Update UI selection
        const selectedElement = document.querySelector(`.emoji-item.selected, .gif-item.selected`);
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
    }

    toggleQueueSelection(itemId, isSelected) {
        if (isSelected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        document.getElementById('selected-count').textContent = this.selectedItems.size;
    }

    searchEmojis(query = '') {
        const searchTerm = query.toLowerCase().trim();
        const filteredEmojis = this.allEmojis.filter(emoji => {
            const matchesSearch = !searchTerm || emoji.name.toLowerCase().includes(searchTerm);
            const matchesFilter = this.currentFilter === 'all' || emoji.category === this.currentFilter;
            return matchesSearch && matchesFilter;
        });
        
        this.displayEmojis(filteredEmojis);
    }

    searchGifs(query = '') {
        const searchTerm = query.toLowerCase().trim();
        const filteredGifs = this.allGifs.filter(gif => 
            !searchTerm || gif.title.toLowerCase().includes(searchTerm)
        );
        
        this.displayGifs(filteredGifs);
    }

    filterEmojis(category) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        this.currentFilter = category;
        this.searchEmojis(document.getElementById('emoji-search').value);
    }

    downloadEmoji(emoji, name) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw emoji
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
        
        // Download
        const link = document.createElement('a');
        link.download = `${name.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        this.showNotification(`Downloaded ${name}!`);
    }

    downloadGif(url, title) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}.gif`;
        link.target = '_blank';
        link.click();
        
        this.showNotification(`Downloaded ${title}!`);
    }

    downloadSelected() {
        if (this.selectedItems.size === 0) {
            this.showNotification('No items selected for download!', 'error');
            return;
        }

        const selectedItems = this.downloadQueue.filter(item => this.selectedItems.has(item.id));
        
        selectedItems.forEach(item => {
            if (item.type === 'emoji') {
                this.downloadEmoji(item.content, item.name);
            } else if (item.type === 'gif') {
                this.downloadGif(item.content, item.name);
            }
        });
        
        this.showNotification(`Downloaded ${selectedItems.length} items!`);
    }

    clearDownloads() {
        this.selectedItems.clear();
        this.downloadQueue = [];
        this.updateDownloadQueue();
        this.updateSelectedCount();
        
        // Clear selections in UI
        document.querySelectorAll('.emoji-item.selected, .gif-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        this.showNotification('Download queue cleared!');
    }

    // Join Channels functionality
    initJoinChannelsFeature() {
        // Check if user has joined channels and update UI
        this.loadUserChannels();
        
        // Add event listener for join channels button
        const joinBtn = document.getElementById('join-channels-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', this.handleJoinChannelsClick.bind(this));
        }
    }

    async loadUserChannels() {
        // Only call this after successful login
        if (!window.currentUser) {
            console.log('User not logged in, skipping loadUserChannels');
            return;
        }
        try {
            const backendPort = 5000;
            const backendHost = window.location.hostname;
            const apiUrl = `http://${backendHost}:${backendPort}/api/user-channels`;
            const response = await fetch(apiUrl, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateJoinChannelsUI(data.joinedChannels.length);
                }
            }
        } catch (error) {
            console.log('Could not load user channels:', error);
        }
    }

    updateJoinChannelsUI(joinedCount) {
        const joinBtn = document.getElementById('join-channels-btn');
        if (joinBtn && joinedCount > 0) {
            const originalText = joinBtn.textContent;
            joinBtn.innerHTML = `
                <span>${originalText}</span>
                <span class="joined-count" style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.8rem; margin-left: 8px;">
                    ${joinedCount}
                </span>
            `;
        }
    }

    handleJoinChannelsClick(event) {
        // Track analytics
        this.trackChannelPageVisit();
    }

    async trackChannelPageVisit() {
        try {
            await fetch('/api/track-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    event: 'join_channels_page_visit',
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    }

    // Notification system for join events
    showJoinNotification(channelName, platform) {
        const notification = document.createElement('div');
        notification.className = 'channel-join-notification';
        
        const platformIcons = {
            telegram: '📱',
            discord: '🎮',
            whatsapp: '💚',
            custom: '🔗'
        };
        
        notification.innerHTML = `
            <div class="platform-icon">${platformIcons[platform] || platformIcons.custom}</div>
            <div>
                <strong>Successfully joined!</strong><br>
                <small>${channelName || 'Channel'} on ${platform}</small>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutLeft 0.5s ease forwards';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    // Listen for successful joins from the join-channels page
    setupJoinEventListener() {
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'channel-joined') {
                this.showJoinNotification(event.data.channelName, event.data.platform);
                this.loadUserChannels(); // Refresh the join count
            }
        });
    }

    // File upload handlers
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processImageFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processImageFile(file);
        }
    }

    processImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.uploadedImage = img;
                this.drawImageOnCanvas();
                this.showNotification('Image uploaded successfully!');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawImageOnCanvas() {
        if (!this.uploadedImage) return;

        const size = parseInt(document.getElementById('size-slider').value);
        const borderRadius = parseInt(document.getElementById('border-radius').value);
        const bgColor = document.getElementById('bg-color').value;

        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx.clearRect(0, 0, size, size);

        // Animate drawing: scale in image and text
        this.canvas.classList.add('drawing-animate');
        setTimeout(() => this.canvas.classList.remove('drawing-animate'), 700);

        let progress = 0;
        const duration = 400; // ms
        const start = performance.now();
        const drawStep = (now) => {
            progress = Math.min((now - start) / duration, 1);
            this.ctx.save();
            if (borderRadius > 0) {
                this.ctx.beginPath();
                this.ctx.roundRect(0, 0, size, size, borderRadius);
                this.ctx.clip();
            } else {
                this.ctx.fillStyle = bgColor;
                this.ctx.fillRect(0, 0, size, size);
            }
            // Draw image with scale
            const scale = 0.8 + 0.2 * progress;
            const imgW = size * scale;
            const imgH = size * scale;
            const imgX = (size - imgW) / 2;
            const imgY = (size - imgH) / 2;
            this.ctx.drawImage(this.uploadedImage, imgX, imgY, imgW, imgH);
            this.ctx.restore();
            if (progress < 1) {
                requestAnimationFrame(drawStep);
            }
        };
        requestAnimationFrame(drawStep);

        document.getElementById('size-value').textContent = `${size}px`;
        document.getElementById('radius-value').textContent = `${borderRadius}px`;
    }

    updateCanvasSize() {
        this.drawImageOnCanvas();
    }

    updateBorderRadius() {
        this.drawImageOnCanvas();
    }

    updateBackgroundColor() {
        this.drawImageOnCanvas();
    }

    addTextToEmoji() {
        const text = document.getElementById('emoji-text').value.trim();
        if (!text || !this.uploadedImage) {
            this.showNotification('Please upload an image and enter text!', 'error');
            return;
        }
        this.drawImageOnCanvas();
        // Animate text drawing
        const ctx = this.ctx;
        const canvas = this.canvas;
        let progress = 0;
        const duration = 400;
        const x = canvas.width / 2;
        const y = canvas.height - 10;
        ctx.font = `${canvas.width * 0.1}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        function animateTextDraw(now, start) {
            progress = Math.min((now - start) / duration, 1);
            ctx.globalAlpha = progress;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
            ctx.globalAlpha = 1;
            if (progress < 1) {
                requestAnimationFrame((t) => animateTextDraw(t, start));
            }
        }
        requestAnimationFrame((t) => animateTextDraw(t, t));
        this.showNotification('Text added to emoji!');
    }

    resetCanvas() {
        this.uploadedImage = null;
        this.drawDefaultCanvas();
        document.getElementById('emoji-text').value = '';
        document.getElementById('size-slider').value = 300;
        document.getElementById('border-radius').value = 0;
        document.getElementById('bg-color').value = '#ffffff';
        document.getElementById('size-value').textContent = '300px';
        document.getElementById('radius-value').textContent = '0px';
        this.showNotification('Canvas reset!');
    }

    isUserLoggedIn() {
        // Check if user profile exists in navbar (same as updateUserUI logic)
        return !!document.getElementById('nav-user-profile');
    }

    downloadCustomEmoji() {
        if (!this.uploadedImage) {
            this.showNotification('Please upload an image first!', 'error');
            return;
        }

        if (!this.isUserLoggedIn()) {
            // Show login modal if not logged in
            if (typeof showAuthModal === 'function') {
                this.showNotification('Please log in to download custom emojis.', 'error');
                showAuthModal('login');
            } else {
                this.showNotification('Please log in to download custom emojis.', 'error');
            }
            return;
        }

        const link = document.createElement('a');
        link.download = `custom_emoji_${this.customEmojiCounter++}.png`;
        link.href = this.canvas.toDataURL();
        link.click();

        this.showNotification('Custom emoji downloaded!');
    }

    smoothScroll(e) {
        const targetId = e.target.getAttribute('href');
        
        // Don't prevent default for external links, files, or special links
        if (!targetId || !targetId.startsWith('#') || targetId.includes('.html') || targetId.startsWith('http')) {
            return; // Let the browser handle the navigation
        }
        
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const offsetTop = targetElement.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the website
const emojiWebsite = new EmojiGifWebsite();
window.websiteInstance = emojiWebsite; // Make it globally accessible

// Global functions for HTML onclick events
function searchEmojis() {
    const query = document.getElementById('emoji-search').value;
    emojiWebsite.searchEmojis(query);
}

function searchGifs() {
    const query = document.getElementById('gif-search').value;
    emojiWebsite.searchGifs(query);
}

function filterEmojis(category) {
    emojiWebsite.filterEmojis(category);
}

function addTextToEmoji() {
    emojiWebsite.addTextToEmoji();
}

function resetCanvas() {
    emojiWebsite.resetCanvas();
}

function downloadCustomEmoji() {
    emojiWebsite.downloadCustomEmoji();
}

function downloadSelected() {
    emojiWebsite.downloadSelected();
}

function clearDownloads() {
    emojiWebsite.clearDownloads();
}

// Test function for GIF loading
function testGifLoading() {
    console.log('🧪 Testing GIF loading...');
    
    // Check if website instance exists
    if (!window.websiteInstance) {
        console.error('❌ Website instance not found');
        alert('Website not properly initialized!');
        return;
    }
    
    // Check if gif-grid element exists
    const gifGrid = document.getElementById('gif-grid');
    if (!gifGrid) {
        console.error('❌ gif-grid element not found');
        alert('GIF grid element missing!');
        return;
    }
    
    console.log('✅ Website instance found:', window.websiteInstance);
    console.log('✅ gif-grid element found:', gifGrid);
    
    // Check if allGifs is populated
    if (!window.websiteInstance.allGifs || window.websiteInstance.allGifs.length === 0) {
        console.warn('⚠️ No GIFs loaded, trying to reload...');
        window.websiteInstance.loadDefaultGifs();
    } else {
        console.log('✅ GIFs already loaded:', window.websiteInstance.allGifs.length);
        window.websiteInstance.displayGifs(window.websiteInstance.allGifs);
    }
    
    alert(`Test complete! Check console for details. Found ${window.websiteInstance.allGifs?.length || 0} GIFs.`);
}

// Mobile Navigation Functions
function toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const hamburger = document.querySelector('.hamburger');
    
    navMenu.classList.toggle('open');
    hamburger.classList.toggle('open');
}

// Auto-hide navbar on scroll for mobile
let lastScrollTop = 0;
let navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
    if (window.innerWidth <= 768) {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.classList.add('hidden');
        } else {
            // Scrolling up
            navbar.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
    }
});

// Close mobile menu when clicking nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            const navMenu = document.querySelector('.nav-menu');
            const hamburger = document.querySelector('.hamburger');
            navMenu.classList.remove('open');
            hamburger.classList.remove('open');
        }
    });
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                downloadSelected();
                break;
            case 'r':
                e.preventDefault();
                resetCanvas();
                break;
            case 'd':
                e.preventDefault();
                downloadCustomEmoji();
                break;
        }
    }
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, observerOptions);

// Observe all content sections
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section);
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Canvas roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        return this;
    };
}
