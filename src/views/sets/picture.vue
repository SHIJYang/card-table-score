<template>
  <div class="picture-management">
    <div class="user-profile-card" v-if="imageStore.userProfile">
      <div class="profile-header">
        <el-avatar :size="isMobile ? 50 : 60" :src="imageStore.userProfile?.avatar || '/default-avatar.png'"
          class="profile-avatar" />
        <div class="profile-info">
          <div class="info-top">
            <h3>{{ imageStore.userProfile?.name || "未设置昵称" }}</h3>
            <el-tag type="success" effect="dark" size="small" round class="profile-status">已认证</el-tag>
          </div>
          <p class="username">@{{ imageStore.userProfile?.username }}</p>
        </div>
      </div>

      <div class="storage-info">
        <div class="storage-progress">
          <div class="progress-header">
            <span>存储空间</span>
            <span :class="{ 'text-warning': imageStore.storageUsagePercent > 80 }">
              {{ imageStore.storageUsagePercent }}%
            </span>
          </div>
          <el-progress :percentage="imageStore.storageUsagePercent" :show-text="false" :stroke-width="6"
            :status="imageStore.storageUsagePercent > 90 ? 'exception' : ''" />
          <div class="storage-details">
            <span>{{ formatStorageSize(imageStore.userProfile?.size) }} / {{
              formatStorageSize(imageStore.userProfile?.capacity) }}</span>
          </div>
        </div>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">{{ imageStore.userProfile?.image_num || 0 }}</div>
            <div class="stat-label">图片</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ imageStore.userProfile?.album_num || 0 }}</div>
            <div class="stat-label">相册</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="imageStore.loading.profile && !imageStore.userProfile" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <div class="action-bar sticky-header">
      <div class="search-filter">
        <el-input v-model="imageStore.searchKeyword" placeholder="搜索..." clearable class="search-input"
          @clear="imageStore.handleSearch" @keyup.enter="imageStore.handleSearch">
          <template #prefix><el-icon>
              <Search />
            </el-icon></template>
        </el-input>
      </div>

      <div class="action-buttons">
        <el-button type="primary" @click="showUploadDialog = true" :disabled="imageStore.isStorageFull" :icon="Plus"
          circle />
        <el-button @click="refreshList" :loading="imageStore.loading.images" :icon="Refresh" circle />
        <transition name="el-zoom-in-center">
          <el-button v-if="imageStore.selectedImages.length > 0" type="danger" @click="handleBatchDelete" :icon="Delete"
            circle />
        </transition>
        <el-button @click="showFilter = !showFilter" :type="showFilter ? 'primary' : ''" plain circle>
          <el-icon>
            <component :is="showFilter ? ArrowUp : ArrowDown" />
          </el-icon>
        </el-button>
      </div>
    </div>

    <el-collapse-transition>
      <div class="expanded-filter" v-show="showFilter">
        <el-row :gutter="10">
          <el-col :span="12" class="mb-2">
            <el-select v-model="imageStore.filterPermission" placeholder="权限" @change="imageStore.handleSearch"
              clearable size="small" style="width: 100%">
              <el-option label="公开" value="public" />
              <el-option label="私有" value="private" />
            </el-select>
          </el-col>
          <el-col :span="12" class="mb-2">
            <el-select v-model="imageStore.filterAlbum" placeholder="相册" @change="imageStore.handleSearch" clearable
              size="small" style="width: 100%">
              <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name" :value="album.id" />
            </el-select>
          </el-col>
          <el-col :span="24">
            <el-select v-model="imageStore.sortOrder" placeholder="排序方式" @change="imageStore.handleSearch" clearable
              size="small" style="width: 100%">
              <el-option label="最新上传" value="newest" />
              <el-option label="最早上传" value="earliest" />
              <el-option label="文件最大" value="utmost" />
              <el-option label="文件最小" value="least" />
            </el-select>
          </el-col>
        </el-row>
      </div>
    </el-collapse-transition>

    <div class="image-list-wrapper" v-loading="imageStore.loading.images">
      <div v-if="imageStore.imageList.length === 0 && !imageStore.loading.images" class="empty-state">
        <el-empty description="暂无图片" :image-size="80" />
        <el-button type="primary" @click="showUploadDialog = true">上传图片</el-button>
      </div>

      <div v-else>
        <el-checkbox-group v-model="imageStore.selectedImages">
          <div class="image-grid">
            <div v-for="image in imageStore.imageList" :key="image.key" class="image-item">
              <div class="image-card" :class="{ 'is-selected': imageStore.selectedImages.includes(image.key) }">

                <div class="image-container" @click="handlePreview(image)">
                  <div class="checkbox-wrapper" @click.stop>
                    <el-checkbox :value="image.key" class="image-checkbox" />
                  </div>

                  <el-image :src="image.links?.thumbnail_url || image.links?.url" fit="cover" class="image-preview"
                    loading="lazy">
                    <template #error>
                      <div class="image-slot error"><el-icon>
                          <Picture />
                        </el-icon></div>
                    </template>
                    <template #placeholder>
                      <div class="image-slot loading"><el-icon class="is-loading">
                          <Loading />
                        </el-icon></div>
                    </template>
                  </el-image>

                  <div class="image-actions" @click.stop>
                    <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, image)">
                      <div class="action-btn-wrapper">
                        <el-icon>
                          <MoreFilled />
                        </el-icon>
                      </div>
                      <template #dropdown>
                        <el-dropdown-menu class="mobile-dropdown">
                          <el-dropdown-item command="url">复制链接</el-dropdown-item>
                          <el-dropdown-item command="markdown">复制 Markdown</el-dropdown-item>
                          <el-dropdown-item command="delete" divided
                            style="color: var(--el-color-danger)">删除</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>

                  <div class="image-overlay">
                    <span v-if="image.permission !== 1" class="lock-icon">
                      <el-icon>
                        <Lock />
                      </el-icon>
                    </span>
                  </div>
                </div>

                <div class="image-info desktop-only">
                  <div class="image-name">{{ image.origin_name }}</div>
                  <div class="image-meta">
                    <span>{{ (image.size / 1024).toFixed(0) }}KB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-checkbox-group>
      </div>

      <div v-if="imageStore.imagePagination.total > 0" class="pagination">
        <el-pagination v-model:current-page="imageStore.imagePagination.current_page"
          :page-size="imageStore.imagePagination.per_page" :total="imageStore.imagePagination.total"
          layout="prev, pager, next" :pager-count="5" @current-change="imageStore.handlePageChange" background small />
      </div>
    </div>

    <el-image-viewer v-if="showImageViewer" @close="showImageViewer = false" :url-list="previewList"
      :initial-index="previewIndex" hide-on-click-modal />

    <el-dialog v-model="showUploadDialog" title="上传图片" :width="dialogWidth" :before-close="handleUploadDialogClose"
      append-to-body align-center>
      <el-upload ref="uploadRef" drag multiple :auto-upload="false" :on-change="handleFileChange"
        :on-remove="handleUploadRemove" list-type="picture" accept="image/*" class="upload-area">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽或<em>点击上传</em></div>
      </el-upload>

      <div class="upload-options">
        <el-form :model="uploadForm" label-position="top" size="small">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-form-item label="权限">
                <el-radio-group v-model="uploadForm.permission">
                  <el-radio :value="1">公开</el-radio>
                  <el-radio :value="0">私有</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="相册">
                <el-select v-model="uploadForm.album_id" placeholder="默认" clearable>
                  <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name"
                    :value="album.id" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="handleUploadDialogClose">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!canUpload" @click="handleManualUpload">
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAlbumDialog" title="相册管理" :width="dialogWidth" append-to-body align-center>
      <div v-loading="imageStore.loading.albums" class="album-container">
        <div v-if="imageStore.albumList.length === 0" class="empty-albums">
          <el-empty description="暂无相册" :image-size="60" />
        </div>
        <div v-else class="album-list">
          <div v-for="album in imageStore.albumList" :key="album.id" class="album-item">
            <div class="album-info">
              <h4>{{ album.name }}</h4>
              <span class="album-stats">{{ album.image_num }} 张</span>
            </div>
            <el-button type="danger" link :icon="Delete" @click="handleDeleteAlbum(album.id)"
              :loading="deletingAlbum === album.id"></el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="refreshAlbumList">刷新</el-button>
        <el-button type="primary" @click="showAlbumDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <div class="bottom-action-bar safe-area-bottom">
      <div class="left-action" @click="showAlbumDialog = true">
        <el-icon>
          <Folder />
        </el-icon>
        <span>相册 ({{ imageStore.albumList.length }})</span>
      </div>
      <div class="right-stats">
        <span v-if="imageStore.selectedImages.length > 0">已选 {{ imageStore.selectedImages.length }} 张</span>
        <span v-else>共 {{ imageStore.imagePagination.total }} 张</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, onUnmounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Plus, Refresh, Search, Delete, MoreFilled, Picture,
  UploadFilled, Loading, Folder, ArrowUp, ArrowDown, Lock
} from "@element-plus/icons-vue"
import type { Action } from 'element-plus'
import { useImageStore } from "@/store"

const imageStore = useImageStore()

// 响应式判断
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const dialogWidth = computed(() => isMobile.value ? '85%' : '480px')

const updateWidth = () => windowWidth.value = window.innerWidth
onMounted(() => window.addEventListener('resize', updateWidth))
onUnmounted(() => window.removeEventListener('resize', updateWidth))

// 状态
const showUploadDialog = ref(false)
const showAlbumDialog = ref(false)
const showFilter = ref(false)
const showImageViewer = ref(false)
const previewList = ref([])
const previewIndex = ref(0)
const uploadRef = ref()
const deletingAlbum = ref(null)
const uploading = ref(false)
const uploadFiles = ref([])

// 表单
const uploadForm = reactive({
  permission: 1,
  album_id: null,
})

const canUpload = computed(() => uploadFiles.value.length > 0 && !imageStore.isStorageFull && !uploading.value)

// 工具函数
const formatStorageSize = (size) => {
  if (!size) return "0MB";
  return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}GB` : `${(size / 1024).toFixed(1)}MB`
}

onMounted(async () => {
  await Promise.all([imageStore.fetchProfile(), imageStore.fetchAlbums()])
  await imageStore.fetchImages()
})

const refreshList = () => {
  imageStore.fetchImages()
  ElMessage.success("已刷新")
}

// 预览逻辑
const handlePreview = (image) => {
  // 生成预览列表
  const list = imageStore.imageList.map(img => img.links?.url)
  const index = imageStore.imageList.findIndex(img => img.key === image.key)
  previewList.value = list
  previewIndex.value = index
  showImageViewer.value = true
}

// 菜单命令
const handleCommand = (command, image) => {
  if (command === 'delete') {
    handleDeleteImage(image.key)


  } else {
    handleCopyLink(command, image)
  }
}

const handleDeleteImage = (key) => {
  ElMessageBox.confirm
    ('确定永久删除这张图片吗？', '删除确认', {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',

      center: true,
    }
    )
    .then(() => {
      if (action === 'confirm') {
        try {
          imageStore.removeImage(key)
          ElMessage.success("删除成功")

        } catch (error) {
          console.error(error)
        }
      }
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })

}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${imageStore.selectedImages.length} 张图片？`,
      "批量删除",
      {
        confirmButtonText: '全部删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
        center: true,
        customClass: 'mobile-delete-confirm'
      }
    )
    await imageStore.removeSelectedImages()
    imageStore.selectedImages = []
    ElMessage.success("批量删除成功")
  } catch { }
}

// 上传 & 相册逻辑 (保持原有逻辑)
const handleFileChange = (file, list) => {
  uploadFiles.value = list.filter(f => f.status === "ready").map(f => f.raw)
}
const handleUploadRemove = (file) => {
  uploadFiles.value = uploadFiles.value.filter(f => f.uid !== file.uid)
}

const handleManualUpload = async () => {
  uploading.value = true
  let successCount = 0
  const tasks = uploadFiles.value.map(async (file) => {
    if (!file.type.startsWith("image/")) return
    if (file.size / 1024 / 1024 > 10) return
    try {
      await imageStore.uploadImage(file, { ...uploadForm })
      successCount++
    } catch (e) { console.error(e) }
  })
  await Promise.allSettled(tasks)
  uploading.value = false
  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 张`)
    showUploadDialog.value = false
    uploadRef.value?.clearFiles()
    uploadFiles.value = []
    refreshList()
    imageStore.fetchProfile()
  } else {
    ElMessage.warning("上传部分失败")
  }
}

const handleUploadDialogClose = () => {
  uploadRef.value?.clearFiles()
  uploadFiles.value = []
  showUploadDialog.value = false
}

const handleCopyLink = (type, img) => {
  const txt = img.links?.[type] || img.links?.url
  if (txt) navigator.clipboard.writeText(txt).then(() => ElMessage.success("已复制"))
}

const handleDeleteAlbum = async (id) => {
  try {
    await ElMessageBox.confirm("删除相册将把图片移入默认相册", "注意", {
      type: 'warning',
      center: true,
      customClass: 'mobile-delete-confirm'
    })
    deletingAlbum.value = id
    await imageStore.removeAlbum(id)
    ElMessage.success("删除成功")
    refreshAlbumList()
  } catch { } finally { deletingAlbum.value = null }
}

const refreshAlbumList = async () => {
  await imageStore.fetchAlbums()
}
</script>

<style scoped>
/* 基础变量 */
:root {
  --app-bg: var(--el-bg-color-page);
  --card-bg: var(--el-bg-color);
}

.picture-management {
  padding: 10px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  padding-bottom: 70px;
  /* 底部留白 */
  background-color: var(--app-bg);
}

/* 1. 用户卡片 */
.user-profile-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.profile-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.profile-info {
  margin-left: 12px;
  flex: 1;
}

.info-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.username {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 2px 0 0;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.storage-details {
  text-align: right;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.stats {
  display: flex;
  gap: 24px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-number {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 2. 操作栏 */
.action-bar {
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 90;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

html.dark .action-bar {
  background: rgba(0, 0, 0, 0.8);
}

.search-filter {
  flex: 1;
  margin-right: 10px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.expanded-filter {
  background: var(--card-bg);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.mb-2 {
  margin-bottom: 8px;
}

/* 3. 图片网格 (核心优化) */
.image-list-wrapper {
  margin-bottom: 10px;
}

.image-grid {
  display: grid;
  /* PC端默认 */
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.image-card {
  border-radius: 8px;
  overflow: hidden;
  background: var(--card-bg);
  position: relative;
  transition: all 0.2s;
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  background: var(--el-fill-color-light);
  cursor: pointer;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: block;
}

/* 遮罩层与Checkbox */
.checkbox-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  padding: 6px;
  z-index: 5;
}

.image-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 5;
}

.action-btn-wrapper {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: #333;
}

.image-overlay {
  position: absolute;
  bottom: 4px;
  right: 4px;
  z-index: 4;
}

.lock-icon {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 2px;
  font-size: 12px;
  display: flex;
}

/* PC端显示的底部信息 */
.image-info {
  padding: 8px;
}

.image-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

/* === 移动端特别适配 (Max Width 768px) === */
@media (max-width: 768px) {

  /* 布局改为 3 列 */
  .image-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    /* 极窄间距，最大化图片 */
  }

  /* 移除卡片圆角和阴影，打造纯相册感 */
  .image-card {
    border-radius: 0;
    box-shadow: none;
  }

  /* 隐藏底部文字信息，只看图 */
  .desktop-only {
    display: none;
  }

  /* 调整 Checkbox 样式，使其不那么突兀 */
  .checkbox-wrapper {
    padding: 4px;
  }

  /* 选中状态给个遮罩，而不是边框 */
  .image-card.is-selected .image-preview {
    opacity: 0.6;
  }
}

/* 4. 底部栏 */
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-top: 1px solid var(--el-border-color-light);
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
}

.left-action {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 14px;
}

.right-stats {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 占位图居中 */
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-placeholder);
}
</style>

<style>
/* 移动端删除弹窗优化 - 必须放在无 scoped 的 style 中 */
@media (max-width: 768px) {
  .mobile-delete-confirm {
    width: 80% !important;
    max-width: 320px;
    padding-bottom: 20px;

    /* === 核心修复：强制加上背景色和边框 === */
    background-color: var(--el-bg-color-overlay) !important;
    /* 使用弹窗专用背景变量 */
    border: 1px solid var(--el-border-color-lighter) !important;
    border-radius: 12px !important;
    /* 更圆润的角 */
    box-shadow: var(--el-box-shadow) !important;
    overflow: hidden;
    /* 防止子元素溢出圆角 */
  }

  /* 修复头部样式，避免太拥挤 */
  .mobile-delete-confirm .el-message-box__header {
    padding: 10px 10px;
  }

  /* 修复内容区域 */
  .mobile-delete-confirm .el-message-box__content {
    padding: 10px 10px;
  }

  /* 让按钮更容易点 */
  .mobile-delete-confirm .el-button {
    padding: 8px 20px;
    margin-left: 10px;
  }
}
</style>