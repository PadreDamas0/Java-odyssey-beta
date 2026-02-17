/* ============================================
   JAVA ODYSSEY - Audio System
   Handles background music, sound effects, and videos
   ============================================ */

const Audio = {
    // Current audio tracks
    bgmTrack: null,
    currentBgmKey: null,
    sfxTracks: {},
    videoElement: null,
    
    // Volume settings
    bgmVolume: 0.7,
    sfxVolume: 0.8,
    
    /**
     * Initialize audio system with HTML5 Audio elements
     */
    init() {
        // Create background music audio element
        this.bgmTrack = new window.Audio();
        this.bgmTrack.loop = true;
        this.bgmTrack.volume = this.bgmVolume;
        
        // Create video element for cutscenes
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
    },
    
    /**
     * Play background music
     * @param {string} bgmKey - Key to the BGM in Assets.sounds.bgm
     * @param {boolean} fade - Whether to fade in
     */
    playBgm(bgmKey, fade = false) {
        if (!Assets.sounds.bgm[bgmKey]) {
            console.warn(`BGM key not found: ${bgmKey}`);
            return;
        }
        
        // Don't restart if same track is already playing
        if (this.currentBgmKey === bgmKey && !this.bgmTrack.paused) {
            return;
        }
        
        // Stop current track
        if (this.bgmTrack) {
            this.bgmTrack.pause();
            this.bgmTrack.currentTime = 0;
        }
        
        // Load and play new track
        const bgmPath = Assets.sounds.bgm[bgmKey];
        this.bgmTrack.src = bgmPath;
        this.currentBgmKey = bgmKey;
        
        if (fade) {
            this.bgmTrack.volume = 0;
            this.bgmTrack.play();
            // Fade in over 1 second
            let volume = 0;
            const fadeInterval = setInterval(() => {
                volume = Math.min(volume + 0.05, this.bgmVolume);
                this.bgmTrack.volume = volume;
                if (volume >= this.bgmVolume) clearInterval(fadeInterval);
            }, 50);
        } else {
            this.bgmTrack.volume = this.bgmVolume;
            this.bgmTrack.play();
        }
    },
    
    /**
     * Stop background music
     * @param {boolean} fade - Whether to fade out
     */
    stopBgm(fade = false) {
        if (!this.bgmTrack) return;
        
        if (fade) {
            let volume = this.bgmTrack.volume;
            const fadeInterval = setInterval(() => {
                volume = Math.max(volume - 0.05, 0);
                this.bgmTrack.volume = volume;
                if (volume <= 0) {
                    this.bgmTrack.pause();
                    this.bgmTrack.currentTime = 0;
                    clearInterval(fadeInterval);
                }
            }, 50);
        } else {
            this.bgmTrack.pause();
            this.bgmTrack.currentTime = 0;
        }
        
        this.currentBgmKey = null;
    },
    
    /**
     * Play a sound effect
     * @param {string} sfxKey - Key to the SFX in Assets.sounds.sfx
     */
    playSfx(sfxKey) {
        if (!Assets.sounds.sfx[sfxKey]) {
            console.warn(`SFX key not found: ${sfxKey}`);
            return;
        }
        
        const sfxPath = Assets.sounds.sfx[sfxKey];
        const sfx = new window.Audio();
        sfx.src = sfxPath;
        sfx.volume = this.sfxVolume;
        sfx.play();
        
        // Clean up after playing
        sfx.onended = () => {
            sfx.src = '';
        };
    },
    
    /**
     * Play a video
     * @param {string} videoKey - Key to the video in Assets.videos
     * @param {Object} options - { loop, autoplay, onEnd, onError }
     */
    async playVideo(videoKey, options = {}) {
        return new Promise((resolve, reject) => {
            if (!Assets.videos[videoKey]) {
                console.warn(`Video key not found: ${videoKey}`);
                reject(new Error(`Video not found: ${videoKey}`));
                return;
            }
            
            const videoPath = Assets.videos[videoKey];
            console.log('Playing video:', videoPath);
            
            // Create fresh video element for each playback
            const videoElem = document.createElement('video');
            videoElem.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 9999 !important;
                background: #000 !important;
                object-fit: contain !important;
                display: block !important;
            `;
            videoElem.loop = options.loop || false;
            videoElem.muted = false;
            videoElem.controls = false;
            videoElem.src = videoPath;
            
            // Add to body
            document.body.appendChild(videoElem);
            
            // Handle video end
            const handleVideoEnd = () => {
                console.log('Video ended');
                videoElem.remove();
                videoElem.removeEventListener('ended', handleVideoEnd);
                if (options.onEnd) options.onEnd();
                resolve();
            };
            
            // Handle errors
            const handleError = (e) => {
                console.error('Video playback error:', e);
                videoElem.remove();
                videoElem.removeEventListener('error', handleError);
                if (options.onError) options.onError(e);
                reject(e);
            };
            
            videoElem.addEventListener('ended', handleVideoEnd);
            videoElem.addEventListener('error', handleError);
            
            // Wait for video to be playable
            const handleCanPlay = () => {
                console.log('Video can play');
                videoElem.removeEventListener('canplay', handleCanPlay);
                const playPromise = videoElem.play();
                if (playPromise !== undefined) {
                    playPromise.catch(err => {
                        console.error('Video play failed:', err);
                        handleError(err);
                    });
                }
            };
            
            videoElem.addEventListener('canplay', handleCanPlay);
            
            // Timeout in case video never loads
            setTimeout(() => {
                if (videoElem.parentNode) {
                    console.warn('Video timeout');
                    handleError(new Error('Video load timeout'));
                }
            }, 5000);
        });
    },
    
    /**
     * Stop video playback
     */
    stopVideo() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.currentTime = 0;
            this.videoElement.style.display = 'none';
            this.videoElement.src = '';
        }
    },
    
    /**
     * Set BGM volume (0-1)
     */
    setBgmVolume(vol) {
        this.bgmVolume = Math.max(0, Math.min(vol, 1));
        if (this.bgmTrack) {
            this.bgmTrack.volume = this.bgmVolume;
        }
    },
    
    /**
     * Set SFX volume (0-1)
     */
    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(vol, 1));
    },
    
    /**
     * Pause BGM
     */
    pauseBgm() {
        if (this.bgmTrack) {
            this.bgmTrack.pause();
        }
    },
    
    /**
     * Resume BGM
     */
    resumeBgm() {
        if (this.bgmTrack && this.currentBgmKey) {
            this.bgmTrack.play();
        }
    },
    
    /**
     * Check if BGM is playing
     */
    isBgmPlaying() {
        return this.bgmTrack && !this.bgmTrack.paused;
    }
};

// Initialize audio system when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Audio.init());
} else {
    Audio.init();
}
