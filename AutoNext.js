// ==UserScript==
// @name         任务点完成后自动点击下一节
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  修复按钮点击无效问题，确保任务点完成后能触发下一节
// @author       luobochuanqi
// @match        https://mooc1.chaoxing.com/mycourse/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('任务点自动下一节脚本已启动');
    
    // 检测任务点完成状态的函数
    function checkTaskCompletion() {
        // 使用更通用的选择器来匹配任务点完成元素
        const completionSelectors = [
            'div.ans-job-icon.ans-job-icon-clear[aria-label="任务点已完成"]',
            'div[aria-label="任务点已完成"]',
            '.ans-job-icon-clear',
            '.ans-job-icon.ans-job-icon-clear'
        ];
        
        let completionElement = null;
        
        // 尝试不同的选择器
        for (const selector of completionSelectors) {
            completionElement = document.querySelector(selector);
            if (completionElement) {
                console.log('检测到任务点完成元素，选择器:', selector);
                break;
            }
        }
        
        if (completionElement) {
            console.log('任务点已完成，准备点击下一节');
            clickNextButton();
            return true;
        }
        
        return false;
    }
    
    // 点击下一节按钮的函数
    function clickNextButton() {
        const nextButtonSelectors = [
            'div#prevNextFocusNext',
            '.prev_next.next',
            '.jb_btn.next'
        ];
        
        let nextButton = null;
        
        // 尝试不同的选择器找到下一节按钮
        for (const selector of nextButtonSelectors) {
            nextButton = document.querySelector(selector);
            if (nextButton) {
                console.log('找到下一节按钮，选择器:', selector);
                break;
            }
        }
        
        if (nextButton) {
            // 检查按钮是否可见
            const style = window.getComputedStyle(nextButton);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                console.log('开始点击下一节按钮');
                
                // 使用多种点击方式确保触发
                try {
                    // 方式1: 直接调用click方法
                    nextButton.click();
                    console.log('方式1: 直接click()执行成功');
                    
                    // 方式2: 使用MouseEvent模拟更真实的点击
                    setTimeout(() => {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        nextButton.dispatchEvent(clickEvent);
                        console.log('方式2: MouseEvent触发成功');
                    }, 100);
                    
                    // 方式3: 如果有onclick属性，直接执行
                    if (nextButton.onclick) {
                        setTimeout(() => {
                            nextButton.onclick();
                            console.log('方式3: 直接执行onclick成功');
                        }, 200);
                    }
                    
                    // 方式4: 尝试触发keydown事件（模拟回车键）
                    setTimeout(() => {
                        const keyEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true,
                            cancelable: true
                        });
                        nextButton.dispatchEvent(keyEvent);
                        console.log('方式4: 回车键事件触发成功');
                    }, 300);
                    
                } catch (error) {
                    console.error('点击过程中发生错误:', error);
                }
            } else {
                console.log('下一节按钮当前不可见');
            }
        } else {
            console.log('未找到下一节按钮');
        }
    }
    
    // 初始检查
    setTimeout(() => {
        if (checkTaskCompletion()) {
            console.log('初始检查: 检测到已完成的任务点');
        } else {
            console.log('初始检查: 未检测到已完成的任务点，开始监听DOM变化');
        }
    }, 2000);
    
    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(function(mutations) {
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                // 检查新增的节点中是否包含任务点完成元素
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 直接检查当前节点或其子节点
                        if (node.matches && (
                            node.matches('div.ans-job-icon.ans-job-icon-clear[aria-label="任务点已完成"]') ||
                            node.matches('div[aria-label="任务点已完成"]') ||
                            node.matches('.ans-job-icon-clear')
                        )) {
                            console.log('DOM变化检测到任务点完成');
                            setTimeout(() => checkTaskCompletion(), 500);
                            return;
                        }
                        
                        // 检查子节点
                        const completionElements = node.querySelectorAll ? node.querySelectorAll(
                            'div.ans-job-icon.ans-job-icon-clear[aria-label="任务点已完成"], div[aria-label="任务点已完成"], .ans-job-icon-clear'
                        ) : [];
                        
                        if (completionElements.length > 0) {
                            console.log('子节点中检测到任务点完成元素');
                            setTimeout(() => checkTaskCompletion(), 500);
                            return;
                        }
                    }
                }
            }
        }
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 定期检查（作为备用方案）
    setInterval(() => {
        checkTaskCompletion();
    }, 5000);
    
    console.log('监听器已启动，正在监控任务点完成状态...');
})();