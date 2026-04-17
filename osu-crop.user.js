// ==UserScript==
// @name         osu! crop
// @namespace    https://osu.ppy.sh/
// @version      1.1.0
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
        #acrop-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
        }
        #acrop-box {
            background: #272536;
            border-radius: 8px;
            padding: 0;
            display: flex;
            flex-direction: column;
            width: min(640px, 94vw);
            overflow: hidden;
            box-shadow: 0 16px 48px rgba(0,0,0,0.6);
        }
        #acrop-header {
            background: #3d3963;
            padding: 14px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #acrop-header h2 {
            color: #fff;
            margin: 0;
            font-size: 14px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        #acrop-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        #acrop-hint {
            color: #8c85a8;
            font-size: 12px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            margin: 0;
            letter-spacing: 0.01em;
        }
        #acrop-wrap {
            width: 100%;
            height: min(420px, 56vh);
            background: #1a1825;
            overflow: hidden;
            border-radius: 4px;
        }
        #acrop-wrap img {
            display: block;
            max-width: 100%;
        }
        #acrop-toolbar {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        #acrop-toolbar span {
            color: #8c85a8;
            font-size: 11px;
            font-family: 'Torus', 'Quicksand', sans-serif;
            letter-spacing: 0.08em;
            font-weight: 700;
            margin-right: 2px;
        }
        .acrop-tool-btn {
            background: #3d3963;
            border: none;
            border-radius: 4px;
            color: #c8c0e0;
            padding: 7px 16px;
            font-size: 17px;
            cursor: pointer;
            line-height: 1;
            transition: filter 0.1s;
        }
        .acrop-tool-btn:hover  { filter: brightness(1.25); }
        .acrop-tool-btn:active { filter: brightness(0.85); }
        #acrop-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            padding-top: 4px;
        }
.acrop-btn {
            border: none;
            border-radius: 4px;
            padding: 10px 24px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Torus', 'Quicksand', sans-serif;
            letter-spacing: 0.04em;
            transition: filter 0.1s;
        }
        .acrop-btn:hover { filter: brightness(1.15); }
        .acrop-btn:active { filter: brightness(0.9); }
        #acrop-cancel { background: #4a4565; color: #c8c0e0; }
        #acrop-apply  { background: #7047eb; color: #fff; }

        #acrop-wrap .cropper-view-box {
            outline-color: #7047eb;
        }
        #acrop-wrap .cropper-line,
        #acrop-wrap .cropper-point {
            background-color: #7047eb;
        }
    `;
    document.head.appendChild(style);

    let cropperInst = null;
    let targetInput = null;

    function openModal(src) {
        const overlay = document.createElement('div');
        overlay.id = 'acrop-overlay';
        overlay.innerHTML = `
            <div id="acrop-box">
                <div id="acrop-header">
                    <h2>crop avatar</h2>
                </div>
                <div id="acrop-body">
                    <p id="acrop-hint">drag to reposition &middot; resize the selection &middot; scroll to zoom</p>
                    <div id="acrop-wrap"><img id="acrop-img" src="${src}" alt=""></div>
                    <div id="acrop-toolbar">
                        <span>rotate</span>
                        <button class="acrop-tool-btn" id="acrop-rot-l" title="rotate left">&#x21BA;</button>
                        <button class="acrop-tool-btn" id="acrop-rot-r" title="rotate right">&#x21BB;</button>
                    </div>
                    <div id="acrop-actions">
                        <button class="acrop-btn" id="acrop-cancel">cancel</button>
                        <button class="acrop-btn" id="acrop-apply">apply crop</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        cropperInst = new Cropper(document.getElementById('acrop-img'), {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.9,
            guides: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
        });

        document.getElementById('acrop-apply').onclick = doApply;
        document.getElementById('acrop-cancel').onclick = closeModal;
        document.getElementById('acrop-rot-l').onclick = () => cropperInst.rotate(-90);
        document.getElementById('acrop-rot-r').onclick = () => cropperInst.rotate(90);
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
            closeModal();
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
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
