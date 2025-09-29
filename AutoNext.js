// ==UserScript==
// @name         任务点完成后自动点击下一节
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  当检测到任务点已完成元素时，自动点击下一节按钮
// @author       luobochuanqi
// @match        https://mooc1.chaoxing.com/mycourse/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // -------------------------- 配置参数 --------------------------
    // 任务点已完成元素选择器
    const TASK_COMPLETE_SELECTOR = '.ans-job-icon.ans-job-icon-clear[id^="ext-gen"]';
    // 任务点已完成的标识文本
    const TASK_COMPLETE_LABEL = "任务点已完成";
    // 下一节按钮选择器
    const NEXT_BUTTON_SELECTOR = '#prevNextFocusNext';
    // 状态检测间隔（毫秒）
    const CHECK_INTERVAL = 3000;
    // 最大检测次数（防止无限循环，0表示不限制）
    const MAX_CHECK_TIMES = 0;
    // --------------------------------------------------------------

    let checkCount = 0;
    let nextButtonElement = null;
    let checkTimer = null;

    /**
     * 带时间戳的日志输出
     */
    function log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'warn':
                console.warn(`[任务点自动下一节][${timestamp}] ${message}`);
                break;
            case 'error':
                console.error(`[任务点自动下一节][${timestamp}] ${message}`);
                break;
            default:
                console.log(`[任务点自动下一节][${timestamp}] ${message}`);
        }
    }

    /**
     * 检查任务点是否已完成
     */
    function isTaskCompleted() {
        const taskElements = document.querySelectorAll(TASK_COMPLETE_SELECTOR);
        
        for (let element of taskElements) {
            // 检查元素是否包含任务点已完成的标识
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.includes(TASK_COMPLETE_LABEL)) {
                log(`检测到任务点已完成元素: ${element.id}`);
                return true;
            }
        }
        
        return false;
    }

    /**
     * 获取下一节按钮元素
     */
    function getNextButton() {
        if (!nextButtonElement) {
            nextButtonElement = document.querySelector(NEXT_BUTTON_SELECTOR);
            if (nextButtonElement) {
                log('找到下一节按钮');
            }
        }
        return nextButtonElement;
    }

    /**
     * 尝试点击下一节按钮
     */
    function tryClickNextButton() {
        const nextButton = getNextButton();
        if (nextButton) {
            try {
                // 检查按钮是否可见且可点击
                const isVisible = window.getComputedStyle(nextButton).display !== 'none';
                if (isVisible && !nextButton.disabled) {
                    nextButton.click();
                    log('已自动点击下一节按钮');
                    return true;
                } else {
                    log('下一节按钮不可见或不可点击', 'warn');
                }
            } catch (error) {
                log(`点击下一节按钮时出错: ${error.message}`, 'error');
            }
        } else {
            log('未找到下一节按钮', 'warn');
        }
        return false;
    }

    /**
     * 定期检查任务点状态
     */
    function checkTaskStatus() {
        checkCount++;
        
        // 检查是否达到最大检测次数
        if (MAX_CHECK_TIMES > 0 && checkCount >= MAX_CHECK_TIMES) {
            log(`已达到最大检测次数(${MAX_CHECK_TIMES})，停止检测`, 'warn');
            clearInterval(checkTimer);
            return;
        }
        
        log(`正在检查任务点状态 (第${checkCount}次)`);
        
        // 检查任务点是否已完成
        if (isTaskCompleted()) {
            // 尝试点击下一节按钮
            if (tryClickNextButton()) {
                // 点击成功后，延迟一段时间再继续检测（防止重复点击）
                clearInterval(checkTimer);
                setTimeout(() => {
                    log('重新开始检测任务点状态');
                    checkTimer = setInterval(checkTaskStatus, CHECK_INTERVAL);
                }, 10000);
            }
        } else {
            log('任务点尚未完成，将继续检查');
        }
    }

    /**
     * 初始化脚本
     */
    function init() {
        log('脚本开始执行，将定期检查任务点状态');
        // 立即执行一次检查
        checkTaskStatus();
        // 设置定时检查
        checkTimer = setInterval(checkTaskStatus, CHECK_INTERVAL);
    }

    // 启动脚本
    init();

})();
