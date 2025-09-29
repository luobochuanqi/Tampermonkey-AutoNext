// ==UserScript==
// @name         任务点完成后自动点击下一节（修复版）
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  修复按钮点击无效问题，确保任务点完成后能触发下一节
// @author       luobochuanqi
// @match        https://mooc1.chaoxing.com/mycourse/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 配置参数
    const TASK_COMPLETE_SELECTOR = '.ans-job-icon.ans-job-icon-clear[id^="ext-gen"]';
    const TASK_COMPLETE_LABEL = "任务点已完成";
    const NEXT_BUTTON_SELECTOR = '#prevNextFocusNext';
    const CHECK_INTERVAL = 3000;
    const MAX_CHECK_TIMES = 0;

    let checkCount = 0;
    let nextButtonElement = null;
    let checkTimer = null;

    // 日志输出
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

    // 检查任务点是否已完成
    function isTaskCompleted() {
        const taskElements = document.querySelectorAll(TASK_COMPLETE_SELECTOR);
        for (let element of taskElements) {
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel && ariaLabel.includes(TASK_COMPLETE_LABEL)) {
                log(`检测到任务点已完成元素: ${element.id}`);
                return true;
            }
        }
        return false;
    }

    // 获取下一节按钮（增加重试机制）
    function getNextButton() {
        // 每次检查都重新获取按钮（防止按钮动态刷新后失效）
        nextButtonElement = document.querySelector(NEXT_BUTTON_SELECTOR);
        if (nextButtonElement) {
            log(`找到下一节按钮，ID: ${nextButtonElement.id}`);
            // 额外检查按钮的onclick事件是否存在
            if (nextButtonElement.onclick) {
                log(`按钮绑定的点击事件: ${nextButtonElement.onclick.toString().substring(0, 50)}...`);
            } else {
                log('按钮未绑定onclick事件', 'warn');
            }
        } else {
            log('未找到下一节按钮', 'warn');
        }
        return nextButtonElement;
    }

    // 模拟真实点击（核心修复：替代直接click()）
    function simulateClick(element) {
        try {
            // 1. 先尝试直接调用onclick绑定的函数（针对你的按钮特殊处理）
            if (element.onclick) {
                log('尝试直接调用onclick函数');
                element.onclick(); // 直接执行按钮绑定的PCount.next()
                return true;
            }

            // 2. 如果onclick调用失败，模拟真实鼠标事件（兼容性更强）
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0, // 左键点击
                detail: 1 // 点击次数
            });
            const success = element.dispatchEvent(clickEvent);
            if (success) {
                log('模拟鼠标点击事件成功');
                return true;
            } else {
                log('模拟鼠标点击事件被阻止', 'warn');
                return false;
            }
        } catch (error) {
            log(`点击模拟失败: ${error.message}`, 'error');
            return false;
        }
    }

    // 尝试点击下一节按钮（使用新的模拟点击方法）
    function tryClickNextButton() {
        const nextButton = getNextButton();
        if (nextButton) {
            try {
                // 检查按钮可见性（你的按钮style是display: block，这里会通过）
                const isVisible = window.getComputedStyle(nextButton).display !== 'none';
                const isDisabled = nextButton.disabled;
                
                if (isVisible && !isDisabled) {
                    log('按钮可见且可点击，准备触发点击');
                    return simulateClick(nextButton); // 使用新的模拟点击函数
                } else {
                    log(`按钮状态异常: 可见=${isVisible}, 禁用=${isDisabled}`, 'warn');
                }
            } catch (error) {
                log(`点击处理出错: ${error.message}`, 'error');
            }
        }
        return false;
    }

    // 定期检查任务点状态
    function checkTaskStatus() {
        checkCount++;
        if (MAX_CHECK_TIMES > 0 && checkCount >= MAX_CHECK_TIMES) {
            log(`已达到最大检测次数(${MAX_CHECK_TIMES})，停止检测`, 'warn');
            clearInterval(checkTimer);
            return;
        }
        
        log(`正在检查任务点状态 (第${checkCount}次)`);
        
        if (isTaskCompleted()) {
            if (tryClickNextButton()) {
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

    // 初始化脚本（增加延迟启动，确保页面完全加载）
    function init() {
        log('脚本开始执行，2秒后开始检查（等待页面完全加载）');
        // 延迟2秒启动，避免页面未完全渲染导致元素获取失败
        setTimeout(() => {
            checkTaskStatus();
            checkTimer = setInterval(checkTaskStatus, CHECK_INTERVAL);
        }, 2000);
    }

    init();

})();
