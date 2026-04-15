/**
 * 场景热区坐标转换工具
 *
 * 所有子场景的热区坐标使用"图片内容坐标系"（相对于图片本身的百分比 0~1），
 * 运行时通过此函数转换为场景容器坐标系，兼容 PC 和移动端不同宽高比。
 *
 * 适用于 object-fit:cover / object-fit:contain / object-position:center 的场景图片。
 */

/**
 * 将图片内容坐标系百分比转换为容器坐标系百分比字符串。
 *
 * @param {HTMLElement} container  场景容器元素（热区的 offsetParent）
 * @param {number} imgW  图片原始宽度（px）
 * @param {number} imgH  图片原始高度（px）
 * @param {number} ix    热区左边 x（0~1，相对于图片宽度）
 * @param {number} iy    热区顶边 y（0~1，相对于图片高度）
 * @param {number} iw    热区宽度（0~1，相对于图片宽度）
 * @param {number} ih    热区高度（0~1，相对于图片高度）
 * @param {string} [fit='cover']  'cover' 或 'contain'
 * @returns {{ left: string, top: string, width: string, height: string }}
 */
export function imgCoordsToContainer(container, imgW, imgH, ix, iy, iw, ih, fit = 'cover') {
    const cw = container.offsetWidth  || window.innerWidth;
    const ch = container.offsetHeight || window.innerHeight;

    // cover: 取较大缩放比使图片完全覆盖容器（居中裁剪）
    // contain: 取较小缩放比使图片完整显示在容器内（居中留边）
    const scale = fit === 'contain'
        ? Math.min(cw / imgW, ch / imgH)
        : Math.max(cw / imgW, ch / imgH);

    const renderedW = imgW * scale;
    const renderedH = imgH * scale;
    const offsetX = (cw - renderedW) / 2;
    const offsetY = (ch - renderedH) / 2;

    const left   = (offsetX + ix * renderedW) / cw * 100;
    const top    = (offsetY + iy * renderedH) / ch * 100;
    const width  = iw * renderedW / cw * 100;
    const height = ih * renderedH / ch * 100;

    return {
        left:   left   + '%',
        top:    top    + '%',
        width:  width  + '%',
        height: height + '%',
    };
}

/** 解析百分比字符串为 0~1 小数，例如 "34.5%" → 0.345 */
export function parsePct(s) {
    return parseFloat(s) / 100;
}
