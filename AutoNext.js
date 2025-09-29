// ==UserScript==
// @name         任务点完成后自动点击下一节
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  修复按钮点击无效问题，确保任务点完成后能触发下一节
// @author       luobochuanqi
// @match        https://mooc1.chaoxing.com/mycourse/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('任务点自动下一节脚本已启动 - 版本1.4');
    let hasClicked = false; // 防止重复点击
    
    // 更全面的任务点完成检测函数
    function checkTaskCompletion() {
        if (hasClicked) {
            return true;
        }
        
        console.log('开始检查任务点完成状态...');
        
        // 多种检测方式
        const detectionMethods = [
            // 方式1: 通过aria-label属性
            () => {
                const elements = document.querySelectorAll('[aria-label="任务点已完成"]');
                console.log('通过aria-label找到元素数量:', elements.length);
                return elements.length > 0 ? elements[0] : null;
            },
            
            // 方式2: 通过类名组合
            () => {
                const elements = document.querySelectorAll('.ans-job-icon.ans-job-icon-clear');
                console.log('通过类名组合找到元素数量:', elements.length);
                return elements.length > 0 ? elements[0] : null;
            },
            
            // 方式3: 通过包含"任务点已完成"文本的元素
            () => {
                const elements = document.querySelectorAll('*');
                for (let el of elements) {
                    if (el.textContent && el.textContent.includes('任务点已完成')) {
                        console.log('通过文本内容找到元素');
                        return el;
                    }
                }
                return null;
            },
            
            // 方式4: 通过特定的类名
            () => {
                const elements = document.querySelectorAll('.ans-job-icon-clear');
                console.log('通过.ans-job-icon-clear找到元素数量:', elements.length);
                return elements.length > 0 ? elements[0] : null;
            },
            
            // 方式5: 查找包含对勾图标的元素
            () => {
                const elements = document.querySelectorAll('.ans-job-icon i');
                for (let el of elements) {
                    const style = window.getComputedStyle(el);
                    if (style.display !== 'none') {
                        console.log('找到可见的图标元素');
                        return el.closest('.ans-job-icon');
                    }
                }
                return null;
            }
        ];
        
        let completionElement = null;
        
        // 尝试所有检测方式
        for (let i = 0; i < detectionMethods.length; i++) {
            completionElement = detectionMethods[i]();
            if (completionElement) {
                console.log(`检测方式${i + 1}成功找到任务点完成元素:`, completionElement);
                console.log('元素详细信息:', {
                    className: completionElement.className,
                    ariaLabel: completionElement.getAttribute('aria-label'),
                    id: completionElement.id,
                    html: completionElement.outerHTML
                });
                break;
            }
        }
        
        if (completionElement) {
            console.log('✓ 确认检测到任务点完成，准备点击下一节');
            setTimeout(() => clickNextButton(), 1000);
            return true;
        } else {
            console.log('✗ 未检测到任务点完成元素');
            // 输出页面中所有相关的ans-job-icon元素用于调试
            const allIcons = document.querySelectorAll('.ans-job-icon');
            console.log('页面中所有.ans-job-icon元素:', allIcons);
            allIcons.forEach((icon, index) => {
                console.log(`图标${index + 1}:`, {
                    className: icon.className,
                    ariaLabel: icon.getAttribute('aria-label'),
                    id: icon.id
                });
            });
            return false;
        }
    }
    
    // 点击下一节按钮的函数
    function clickNextButton() {
        if (hasClicked) {
            console.log('已经点击过下一节，跳过');
            return;
        }
        
        console.log('开始寻找下一节按钮...');
        
        const nextButtonSelectors = [
            '#prevNextFocusNext',
            '.prev_next.next',
            '.jb_btn.next',
            '[onclick*="PCount.next"]',
            '.next.fr',
            'div[onclick*="next"]'
        ];
        
        let nextButton = null;
        
        for (const selector of nextButtonSelectors) {
            const elements = document.querySelectorAll(selector);
            console.log(`选择器 "${selector}" 找到元素数量:`, elements.length);
            if (elements.length > 0) {
                nextButton = elements[0];
                console.log(`使用选择器 "${selector}" 找到按钮:`, nextButton);
                break;
            }
        }
        
        if (nextButton) {
            console.log('找到下一节按钮，详细信息:', {
                text: nextButton.textContent,
                className: nextButton.className,
                id: nextButton.id,
                onclick: nextButton.onclick,
                display: window.getComputedStyle(nextButton).display,
                html: nextButton.outerHTML
            });
            
            const style = window.getComputedStyle(nextButton);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
                console.log('按钮可见，开始点击...');
                hasClicked = true;
                
                // 多种点击方式
                const clickMethods = [
                    {
                        name: '直接click',
                        action: () => nextButton.click()
                    },
                    {
                        name: 'MouseEvent点击',
                        action: () => {
                            const event = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            nextButton.dispatchEvent(event);
                        }
                    },
                    {
                        name: '触发onclick',
                        action: () => {
                            if (nextButton.onclick) nextButton.onclick();
                        }
                    },
                    {
                        name: '模拟回车键',
                        action: () => {
                            const event = new KeyboardEvent('keydown', {
                                key: 'Enter',
                                keyCode: 13,
                                which: 13,
                                bubbles: true
                            });
                            nextButton.dispatchEvent(event);
                        }
                    }
                ];
                
                // 依次执行各种点击方式
                clickMethods.forEach((method, index) => {
                    setTimeout(() => {
                        try {
                            method.action();
                            console.log(`✓ 点击方式 ${index + 1} (${method.name}) 执行成功`);
                        } catch (error) {
                            console.error(`✗ 点击方式 ${index + 1} (${method.name}) 执行失败:`, error);
                        }
                    }, index * 300);
                });
                
            } else {
                console.log('下一节按钮当前不可见');
            }
        } else {
            console.log('未找到下一节按钮');
            // 输出页面中所有可能的按钮用于调试
            const allButtons = document.querySelectorAll('button, div[onclick], .btn, .button');
            console.log('页面中所有可能的按钮:', allButtons);
        }
    }
    
    // 初始检查 - 增加更多检查点
    const initialCheckTimes = [1000, 3000, 5000, 8000, 10000];
    initialCheckTimes.forEach((time, index) => {
        setTimeout(() => {
            console.log(`第${index + 1}次初始检查 (${time}ms)`);
            checkTaskCompletion();
        }, time);
    });
    
    // 使用MutationObserver监听DOM变化
    const observer = new MutationObserver(function(mutations) {
        console.log('检测到DOM变化， mutations数量:', mutations.length);
        
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                console.log('子节点变化，新增节点数量:', mutation.addedNodes.length);
                
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 检查新增元素
                        if (node.matches && (
                            node.matches('[aria-label="任务点已完成"]') ||
                            node.matches('.ans-job-icon-clear') ||
                            node.matches('.ans-job-icon.ans-job-icon-clear')
                        )) {
                            console.log('新增元素检测到任务点完成');
                            setTimeout(() => checkTaskCompletion(), 500);
                            return;
                        }
                        
                        // 检查新增元素的子节点
                        const completionElements = node.querySelectorAll ? node.querySelectorAll(
                            '[aria-label="任务点已完成"], .ans-job-icon-clear, .ans-job-icon.ans-job-icon-clear'
                        ) : [];
                        
                        if (completionElements.length > 0) {
                            console.log('新增元素的子节点中检测到任务点完成');
                            setTimeout(() => checkTaskCompletion(), 500);
                            return;
                        }
                    }
                }
            }
            
            // 监听属性变化
            if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'class' || mutation.attributeName === 'aria-label') {
                    const target = mutation.target;
                    if (target.matches && (
                        target.matches('.ans-job-icon') ||
                        target.getAttribute('aria-label') === '任务点已完成'
                    )) {
                        console.log('属性变化检测到可能的状态改变:', {
                            element: target,
                            attribute: mutation.attributeName,
                            newValue: target.getAttribute(mutation.attributeName)
                        });
                        setTimeout(() => checkTaskCompletion(), 500);
                    }
                }
            }
        }
    });
    
    // 开始观察
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-label']
    });
    
    // 定期检查（作为备用方案）
    const checkInterval = setInterval(() => {
        if (!hasClicked) {
            console.log('定期检查任务点状态...');
            checkTaskCompletion();
        } else {
            console.log('已点击下一节，停止定期检查');
            clearInterval(checkInterval);
        }
    }, 8000);
    
    console.log('监听器已启动，正在监控任务点完成状态...');
})();