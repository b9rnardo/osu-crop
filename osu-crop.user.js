// ==UserScript==
// @name         osu! crop
// @namespace    https://osu.ppy.sh/
// @version      2.0.0
// @description  Adds crop/resize interface to osu! avatar upload
// @match        https://osu.ppy.sh/home/account/edit*
// @require      https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `

        @keyframes acrop-overlay-in {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        @keyframes acrop-box-in {
            from { opacity: 0; transform: scale(0.92) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes acrop-overlay-out {
            from { opacity: 1; }
            to   { opacity: 0; }
        }
        @keyframes acrop-box-out {
            from { opacity: 1; transform: scale(1) translateY(0); }
            to   { opacity: 0; transform: scale(0.92) translateY(12px); }
        }

        /* ── overlay ── */
        #acrop-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            animation: acrop-overlay-in 0.3s ease-out forwards;
        }
        #acrop-overlay.acrop-closing {
            animation: acrop-overlay-out 0.25s ease-in forwards;
        }

        #acrop-box {
            background: #1e1e2e;
            border-radius: 16px;
            padding: 0;
            display: flex;
            flex-direction: column;
            width: min(680px, 94vw);
            overflow: hidden;
            box-shadow:
                0 0 0 1px rgba(255, 255, 255, 0.08),
                0 24px 64px rgba(0, 0, 0, 0.7);
            animation: acrop-box-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        #acrop-overlay.acrop-closing #acrop-box {
            animation: acrop-box-out 0.25s ease-in forwards;
        }

        #acrop-header {
            background: #2a2a3a;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        #acrop-header-icon {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
        }
        #acrop-header h2 {
            color: #fff;
            margin: 0;
            font-size: 15px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            font-weight: 700;
            letter-spacing: 0.06em;
            position: relative;
            z-index: 1;
            text-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }

        #acrop-body {
            padding: 20px 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        #acrop-hint {
            color: #8888aa;
            font-size: 12px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            margin: 0;
            letter-spacing: 0.02em;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        #acrop-hint svg {
            flex-shrink: 0;
            opacity: 0.6;
        }

        #acrop-wrap {
            width: 100%;
            height: min(420px, 56vh);
            background: #11111b;
            overflow: hidden;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.06);
        }
        #acrop-wrap img {
            display: block;
            max-width: 100%;
        }


        #acrop-bottom {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
        }
        #acrop-bottom .acrop-tool-group {
            display: flex;
            align-items: center;
            gap: 2px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            padding: 4px;
        }
        .acrop-tool-btn {
            background: transparent;
            border: none;
            border-radius: 6px;
            color: #a0a0c0;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            position: relative;
        }
        .acrop-tool-btn svg {
            width: 17px;
            height: 17px;
            pointer-events: none;
        }
        .acrop-tool-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }
        .acrop-tool-btn:active {
            background: rgba(255, 255, 255, 0.15);
            transform: scale(0.92);
        }
        .acrop-tool-btn[data-tooltip]:hover::after {
            content: attr(data-tooltip);
            position: absolute;
            bottom: calc(100% + 6px);
            left: 50%;
            transform: translateX(-50%);
            background: #2a2a3e;
            color: #ccc;
            font-size: 10px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            padding: 4px 8px;
            border-radius: 4px;
            white-space: nowrap;
            pointer-events: none;
            border: 1px solid rgba(255,255,255,0.08);
            z-index: 10;
        }

        #acrop-bottom-spacer { flex: 1; }



        /* ── action buttons ── */
        #acrop-actions {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .acrop-btn {
            border: none;
            border-radius: 24px;
            padding: 10px 28px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Torus', 'Quicksand', sans-serif;
            letter-spacing: 0.05em;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #acrop-cancel {
            background: rgba(255, 255, 255, 0.06);
            color: #a0a0c0;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        #acrop-cancel:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #d0d0e0;
        }
        #acrop-cancel:active { transform: scale(0.96); }
        #acrop-apply {
            background: linear-gradient(135deg, #555, #444);
            color: #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        #acrop-apply:hover {
            background: linear-gradient(135deg, #666, #555);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
            transform: translateY(-1px);
        }
        #acrop-apply:active {
            transform: translateY(0) scale(0.97);
        }

        /* ── cropper overrides ── */
        #acrop-wrap .cropper-view-box {
            outline: 2px solid rgba(255, 255, 255, 0.7);
            outline-offset: -1px;
        }
        #acrop-wrap .cropper-face {
            background-color: rgba(255, 255, 255, 0.03);
        }
        #acrop-wrap .cropper-line {
            background-color: rgba(255, 255, 255, 0.35);
        }
        #acrop-wrap .cropper-point {
            background-color: #fff;
            width: 8px !important;
            height: 8px !important;
            opacity: 0.9;
        }
        #acrop-wrap .cropper-dashed {
            border-color: rgba(255, 255, 255, 0.2);
        }
        #acrop-wrap .cropper-modal {
            background-color: #11111b;
            opacity: 0.7;
        }

        /* ── responsive ── */
        @media (max-width: 480px) {
            #acrop-bottom {
                justify-content: center;
            }
            #acrop-bottom-spacer {
                display: none;
            }
            #acrop-actions {
                width: 100%;
                justify-content: flex-end;
            }
        }
    `;
    document.head.appendChild(style);


    const ICONS = {
        crop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2v6m0 6v8M2 6h6m6 0h8M18 10v12m0-6h4M6 6h12v12H6z"/></svg>`,
        rotateL: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
        rotateR: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
        flipH: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M16 6l4 6-4 6M8 6 4 12l4 6"/></svg>`,
        flipV: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12h20M6 8l6-4 6 4M6 16l6 4 6-4"/></svg>`,
        reset: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 3 6.7L3 21v-6h6"/></svg>`,
        info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>`,
        osu: `<svg viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" fill="none" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="6" fill="none" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" fill="white"/></svg>`,
        check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12l5 5L19 7"/></svg>`,
    };

    let cropperInst = null;
    let targetInput = null;

    function openModal(src) {
        const overlay = document.createElement('div');
        overlay.id = 'acrop-overlay';
        overlay.innerHTML = `
            <div id="acrop-box">
                <div id="acrop-header">
                    <span id="acrop-header-icon">${ICONS.osu}</span>
                    <h2>crop avatar!</h2>
                </div>
                <div id="acrop-body">
                    <p id="acrop-hint">
                        ${ICONS.info}
                        drag to reposition &middot; resize the selection &middot; scroll to zoom
                    </p>
                    <div id="acrop-wrap"><img id="acrop-img" src="${src}" alt=""></div>
                    <div id="acrop-bottom">
                        <div class="acrop-tool-group">
                            <button class="acrop-tool-btn" id="acrop-rot-l" data-tooltip="rotate left">${ICONS.rotateL}</button>
                            <button class="acrop-tool-btn" id="acrop-rot-r" data-tooltip="rotate right">${ICONS.rotateR}</button>
                        </div>
                        <div class="acrop-tool-group">
                            <button class="acrop-tool-btn" id="acrop-flip-h" data-tooltip="flip horizontal">${ICONS.flipH}</button>
                            <button class="acrop-tool-btn" id="acrop-flip-v" data-tooltip="flip vertical">${ICONS.flipV}</button>
                        </div>
                        <div class="acrop-tool-group">
                            <button class="acrop-tool-btn" id="acrop-reset" data-tooltip="reset">${ICONS.reset}</button>
                        </div>
                        <div id="acrop-bottom-spacer"></div>

                        <div id="acrop-actions">
                            <button class="acrop-btn" id="acrop-cancel">cancel</button>
                            <button class="acrop-btn" id="acrop-apply">${ICONS.check} apply</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const img = document.getElementById('acrop-img');
        cropperInst = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.85,
            guides: false,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
        });

        document.getElementById('acrop-apply').onclick = doApply;
        document.getElementById('acrop-cancel').onclick = animateClose;
        document.getElementById('acrop-rot-l').onclick = () => cropperInst.rotate(-90);
        document.getElementById('acrop-rot-r').onclick = () => cropperInst.rotate(90);
        document.getElementById('acrop-flip-h').onclick = () => {
            const d = cropperInst.getData();
            cropperInst.scaleX(d.scaleX === -1 ? 1 : -1);
        };
        document.getElementById('acrop-flip-v').onclick = () => {
            const d = cropperInst.getData();
            cropperInst.scaleY(d.scaleY === -1 ? 1 : -1);
        };
        document.getElementById('acrop-reset').onclick = () => {
            cropperInst.reset();
        };


        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) animateClose();
        });

        overlay._escHandler = (e) => {
            if (e.key === 'Escape') animateClose();
        };
        document.addEventListener('keydown', overlay._escHandler);
    }

    function animateClose() {
        const overlay = document.getElementById('acrop-overlay');
        if (!overlay) return;
        overlay.classList.add('acrop-closing');
        document.removeEventListener('keydown', overlay._escHandler);
        setTimeout(() => {
            cropperInst?.destroy();
            cropperInst = null;
            overlay.remove();
        }, 250);
    }

    function closeModal() {
        cropperInst?.destroy();
        cropperInst = null;
        document.getElementById('acrop-overlay')?.remove();
    }

    function doApply() {
        if (!cropperInst || !targetInput) return;

        const canvas = cropperInst.getCroppedCanvas({ width: 256, height: 256 });
        canvas.toBlob(blob => {
            const dt = new DataTransfer();
            dt.items.add(new File([blob], 'avatar.png', { type: 'image/png' }));
            targetInput.files = dt.files;
            targetInput._skipCrop = true;
            animateClose();
            setTimeout(() => {
                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }, 260);
        }, 'image/png');
    }

    window.addEventListener('change', function (e) {
        const input = e.target;
        if (input.type !== 'file') return;

        if (input._skipCrop) {
            input._skipCrop = false;
            return;
        }

        const file = input.files[0];
        if (!file?.type.startsWith('image/')) return;

        e.stopImmediatePropagation();

        targetInput = input;
        const reader = new FileReader();
        reader.onload = ev => openModal(ev.target.result);
        reader.readAsDataURL(file);
    }, true);

})();
