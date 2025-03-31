// ==UserScript==
// @name        Smart eye filter
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @version     1.1
// @author      someone_there
// @description Automatic adjustment of screen brightness and temperature
// @icon        https://i.imgur.com/7W8Q0D2.png
// ==/UserScript==

(function() {
    'use strict';
    
    // constants
    const DEFAULT_SETTINGS = {
        brightness_day: 90,
        sepia_day: 40,
        brightness_night: 40,
        sepia_night: 60,
        day_start: '7:30',
        day_end: '18:30',
        update_interval: 30 // minutes
    };

    // initialization
    function initSettings() {
        let needUpdate = false;
        Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
            if (GM_getValue(key) === undefined) {
                GM_setValue(key, value);
                needUpdate = true;
            }
        });
        return needUpdate;
    }

    // checking the time of day
    function isDaytime() {
        const now = new Date();
        const [startH, startM] = GM_getValue('day_start').split(':').map(Number);
        const [endH, endM] = GM_getValue('day_end').split(':').map(Number);
        
        const start = new Date();
        start.setHours(startH, startM, 0);
        
        const end = new Date();
        end.setHours(endH, endM, 0);
        
        return now >= start && now < end;
    }

    // applying a filter
    function applyFilter() {
        const isDay = isDaytime();
        const brightness = isDay ? GM_getValue('brightness_day') : GM_getValue('brightness_night');
        const sepia = isDay ? GM_getValue('sepia_day') : GM_getValue('sepia_night');
        
        const styleId = 'EyeProtectionFilter';
        let style = document.getElementById(styleId);
        
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        
        style.textContent = `html {
            filter: brightness(${brightness}%) sepia(${sepia}%) !important;
            transition: filter 0.5s ease-in-out !important;
        }`;
    }

    // setup menu
    function setupMenu() {
        GM_registerMenuCommand('⚙️ filter settings', showSettings);
        GM_registerMenuCommand('🔄 update now', applyFilter);
    }

    function showSettings() {
        const currentSettings = {
            brightness_day: GM_getValue('brightness_day'),
            sepia_day: GM_getValue('sepia_day'),
            brightness_night: GM_getValue('brightness_night'),
            sepia_night: GM_getValue('sepia_night'),
            day_start: GM_getValue('day_start'),
            day_end: GM_getValue('day_end'),
            update_interval: GM_getValue('update_interval')
        };
        
        const newSettings = {
            brightness_day: prompt('day brightness (%):', currentSettings.brightness_day),
            sepia_day: prompt('day temperature (%):', currentSettings.sepia_day),
            brightness_night: prompt('night brightness (%):', currentSettings.brightness_night),
            sepia_night: prompt('night temperature (%):', currentSettings.sepia_night),
            day_start: prompt('start of the day (HH:ММ):', currentSettings.day_start),
            day_end: prompt('end of the day (HH:ММ):', currentSettings.day_end),
            update_interval: prompt('update interval (min):', currentSettings.update_interval)
        };
        
        Object.entries(newSettings).forEach(([key, value]) => {
            if (value !== null) GM_setValue(key, value);
        });
        
        applyFilter();
        setupAutoUpdate();
    }

    // auto-update setting
    function setupAutoUpdate() {
        const intervalMinutes = GM_getValue('update_interval') || 30;
        const intervalMs = intervalMinutes * 60 * 1000;
        
        if (window.updateTimer) clearInterval(window.updateTimer);
        window.updateTimer = setInterval(applyFilter, intervalMs);
    }

    // initialization
    if (initSettings()) console.log('Настройки инициализированы');
    setupMenu();
    applyFilter();
    setupAutoUpdate();
    
    // additional update triggers
    window.addEventListener('focus', applyFilter);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) applyFilter();
    });
})();