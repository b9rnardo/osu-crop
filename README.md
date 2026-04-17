# osu! crop

a tampermonkey userscript that adds a crop/rotate interface right on the account settings page — no external tools needed.

## features

- crop with a square selection (1:1 ratio, matches osu!'s avatar format)
- rotate left/right in 90° steps
- scroll to zoom in/out
- drag to reposition the image

## install

1. install [tampermonkey](https://www.tampermonkey.net/) on chrome
2. click **[install script](https://github.com/b9rnardo/osu-crop/raw/refs/heads/main/osu-crop.user.js)** 
3. go to [osu! account settings](https://osu.ppy.sh/home/account/edit#avatar) and upload an image — the crop window will appear automatically

## how it works

intercepts the file input change event before osu!'s react handlers can process it, shows the crop ui, then re-dispatches the event with the cropped image once you confirm.

## dependencies

- [cropper.js](https://github.com/fengyuanchen/cropperjs) — loaded automatically via cdn, no setup needed
