<template>
    <div class="vr-page">
        <div class="vr-card">
            <div class="vr-icon">🌐</div>
            <h2 class="vr-title">VR 全景</h2>
            <p class="vr-desc">
                该全景页面（vr.justeasy.cn）设置了安全策略，仅允许在其官网内嵌展示，
                无法直接嵌入本站。请点击下方按钮打开。
            </p>
            <button class="vr-btn primary" @click="openNewTab">在新窗口打开 VR 全景</button>
            <button class="vr-btn" @click="openSelf">在本页直接跳转</button>
        </div>
    </div>
</template>

<script setup>
const VR_URL = 'https://vr.justeasy.cn/view/17tf923569in2v56-1792357936.html'

function openNewTab() {
    window.open(VR_URL, '_blank', 'noopener')
}

function openSelf() {
    window.location.href = VR_URL
}
</script>

<style scoped>
.vr-page {
    width: 100vw;
    height: 100vh;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #0f172a 0%, #1e293b 100%);
}

.vr-card {
    text-align: center;
    color: #e2e8f0;
    padding: 48px 56px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    max-width: 480px;
}

.vr-icon {
    font-size: 56px;
    margin-bottom: 16px;
}

.vr-title {
    margin: 0 0 12px;
    font-size: 26px;
}

.vr-desc {
    margin: 0 0 28px;
    font-size: 14px;
    line-height: 1.8;
    color: #94a3b8;
}

.vr-btn {
    display: block;
    width: 100%;
    margin-top: 12px;
    padding: 12px 0;
    font-size: 15px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
}

.vr-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.vr-btn.primary {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
}

.vr-btn.primary:hover {
    background: #2563eb;
}
</style>
