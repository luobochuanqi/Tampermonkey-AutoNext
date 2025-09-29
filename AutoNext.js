// ==UserScript==
// @name         视频播放完自动点击下一节
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  当特定视频播放器（id="video_html5_api"）播放结束后，自动点击“下一节”按钮（id="prevNextFocusNext"）
// @author       luobochuanqi
// @match        https://mooc1.chaoxing.com/mycourse/studentstudy?*courseId=*&*chapterId=*
// @grant        none
// @run-at       document-end  // 页面DOM加载完成后执行
// ==/UserScript==

(function() {
    'use strict';

    // -------------------------- 配置参数 --------------------------
    const VIDEO_SELECTOR = '#video_html5_api'; // 视频元素选择器（从提供的HTML中提取）
    const NEXT_BUTTON_SELECTOR = '#prevNextFocusNext'; // 下一节按钮选择器（从提供的HTML中提取）
    const CHECK_INTERVAL = 1000; // 元素检测间隔（毫秒），防止元素动态加载延迟
    const MAX_CHECK_TIMES = 30; // 最大检测次数（避免无限循环）
    // --------------------------------------------------------------

    let checkCount = 0; // 元素检测计数器
    let videoElement = null; // 视频元素缓存
    let nextButtonElement = null; // 下一节按钮缓存

    /**
     * 日志输出函数（带时间戳，方便调试）
     * @param {string} message - 日志内容
     * @param {string} type - 日志类型（info/warn/error）
     */
    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'warn':
                console.warn(`[自动下一节][${timestamp}] ${message}`);
                break;
            case 'error':
                console.error(`[自动下一节][${timestamp}] ${message}`);
                break;
            default:
                console.log(`[自动下一节][${timestamp}] ${message}`);
        }
    }

    /**
     * 检测并获取目标元素
     * @param {string} selector - CSS选择器
     * @param {string} elementName - 元素名称（用于日志）
     * @returns {HTMLElement|null} 找到的元素或null
     */
    function getTargetElement(selector, elementName) {
        const element = document.querySelector(selector);
        if (element) {
            log(`成功找到${elementName}（选择器：${selector}）`);
            return element;
        }
        log(`未找到${elementName}（选择器：${selector}），当前检测次数：${checkCount}/${MAX_CHECK_TIMES}`, 'warn');
        return null;
    }

    /**
     * 初始化元素检测（处理动态加载的元素）
     */
    function initElementDetection() {
        // 定期检测视频元素和按钮元素
        const checkTimer = setInterval(() => {
            checkCount++;

            // 检测视频元素
            if (!videoElement) {
                videoElement = getTargetElement(VIDEO_SELECTOR, '视频播放器');
            }

            // 检测下一节按钮
            if (!nextButtonElement) {
                nextButtonElement = getTargetElement(NEXT_BUTTON_SELECTOR, '下一节按钮');
            }

            // 两个元素都找到，或达到最大检测次数，停止检测
            if ((videoElement && nextButtonElement) || checkCount >= MAX_CHECK_TIMES) {
                clearInterval(checkTimer);

                if (videoElement && nextButtonElement) {
                    log('所有目标元素已就绪，开始监听视频播放状态');
                    initVideoEndListener(); // 初始化视频结束监听
                } else {
                    log('达到最大检测次数，仍未找到所有目标元素，脚本停止', 'error');
                }
            }
        }, CHECK_INTERVAL);
    }

    /**
     * 初始化视频结束事件监听
     */
    function initVideoEndListener() {
        // 监听视频的ended事件（播放结束时触发）
        videoElement.addEventListener('ended', function() {
            log('视频已播放结束，准备点击下一节按钮');
            
            // 再次确认按钮存在且可点击（防止按钮动态消失）
            if (nextButtonElement && !nextButtonElement.disabled) {
                try {
                    // 触发按钮点击（模拟用户手动点击）
                    nextButtonElement.click();
                    log('成功点击下一节按钮');
                } catch (error) {
                    log(`点击下一节按钮失败：${error.message}`, 'error');
                }
            } else {
                log('下一节按钮不存在或不可点击', 'error');
                // 尝试重新获取按钮（应对按钮动态刷新的情况）
                nextButtonElement = getTargetElement(NEXT_BUTTON_SELECTOR, '下一节按钮');
                if (nextButtonElement) {
                    nextButtonElement.click();
                    log('重新获取按钮后点击成功');
                }
            }
        }, { once: false }); // once:false 确保多次播放结束都能触发（如视频重播后）

        log('视频结束事件监听已启用');
    }

    // -------------------------- 脚本入口 --------------------------
    log('脚本开始执行，正在检测目标元素...');
    initElementDetection();

})();