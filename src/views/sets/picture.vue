<template>
  <div class="picture-management">
    <div class="user-profile-card" v-if="imageStore.userProfile">
      <div class="profile-header">
        <el-avatar :size="60" :src="imageStore.userProfile?.avatar || '/default-avatar.png'" />
        <div class="profile-info">
          <h3>{{ imageStore.userProfile?.name || "未设置昵称" }}</h3>
          <p>@{{ imageStore.userProfile?.username }}</p>
          <p class="email">{{ imageStore.userProfile?.email }}</p>
        </div>
        <el-tag type="success" class="profile-status">已认证</el-tag>
      </div>
      <div class="storage-info">
        <div class="storage-progress">
          <div class="progress-header">
            <span>存储空间</span>
            <span>{{ imageStore.storageUsagePercent }}%</span>
          </div>
          <el-progress :percentage="imageStore.storageUsagePercent" :show-text="false" :stroke-width="8" />
          <div class="storage-details">
            <span>已使用: {{ formatStorageSize(imageStore.userProfile?.size) }}</span>
            <span>总容量: {{ formatStorageSize(imageStore.userProfile?.capacity) }}</span>
            <span>剩余: {{ formatStorageSize(imageStore.remainingStorage) }}</span>
          </div>
        </div>
        <div class="stats">
          <div class="stat-item">
            <div class="stat-number">{{ imageStore.userProfile?.image_num || 0 }}</div>
            <div class="stat-label">图片数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ imageStore.userProfile?.album_num || 0 }}</div>
            <div class="stat-label">相册数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ imageStore.albumList.length }}</div>
            <div class="stat-label">相册列表</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="imageStore.loading.profile && !imageStore.userProfile" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="showUploadDialog = true" :disabled="imageStore.isStorageFull" :icon="Plus">
          上传
        </el-button>
        <el-button @click="refreshAlbumList" :loading="imageStore.loading.images" :icon="Refresh">
          刷新
        </el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="imageStore.selectedImages.length === 0"
          :icon="Delete">
          删除 ({{ imageStore.selectedImages.length }})
        </el-button>
      </div>
      <div class="search-filter">
        <el-input v-model="imageStore.searchKeyword" placeholder="搜索..." clearable style="width: 120px"
          @clear="imageStore.handleSearch" @keyup.enter="imageStore.handleSearch">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>
        <el-select v-model="imageStore.filterPermission" placeholder="权限" @change="imageStore.handleSearch" clearable
          style="width: 100px">
          <el-option label="公开" value="public" />
          <el-option label="私有" value="private" />
        </el-select>
      </div>
    </div>

    <div class="filter-toggle" @click="showFilter = !showFilter">
      <span>{{ showFilter ? "收起筛选" : "更多筛选" }}</span>
      <el-icon class="filter-icon">
        <component :is="showFilter ? ArrowUp : ArrowDown" />
      </el-icon>
    </div>

    <div class="expanded-filter" v-if="showFilter">
      <el-select v-model="imageStore.filterAlbum" placeholder="相册筛选" @change="imageStore.handleSearch" clearable
        style="width: 100%; margin-bottom: 10px">
        <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <el-select v-model="imageStore.sortOrder" placeholder="排序方式" @change="imageStore.handleSearch" clearable
        style="width: 100%">
        <el-option label="最新上传" value="newest" />
        <el-option label="最早上传" value="earliest" />
        <el-option label="文件最大" value="utmost" />
        <el-option label="文件最小" value="least" />
      </el-select>
    </div>

    <div class="image-list">
      <div v-if="imageStore.imageList.length === 0 && !imageStore.loading.images" class="empty-state">
        <el-empty description="暂无图片" />
        <el-button type="primary" @click="showUploadDialog = true">上传第一张图片</el-button>
      </div>
      <div v-loading="imageStore.loading.images">
        <el-checkbox-group v-model="imageStore.selectedImages" class="image-grid">
          <div v-for="image in imageStore.imageList" :key="image.key" class="image-item">
            <el-card class="image-card" :body-style="{ padding: '0px' }">
              <div class="image-container">
                <el-checkbox :value="image.key" class="image-checkbox" />
                <el-image :src="image.links?.thumbnail_url || image.links?.url" fit="cover" class="image-preview">
                  <template #error>
                    <div class="image-error">
                      <el-icon>
                        <Picture />
                      </el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                  <template #placeholder>
                    <div class="image-loading">
                      <el-icon class="is-loading">
                        <Loading />
                      </el-icon>
                      <span>加载中...</span>
                    </div>
                  </template>
                </el-image>
                <div class="image-actions">
                  <el-button type="danger" size="small" circle @click="handleDeleteImage(image.key)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                  <el-dropdown trigger="click" @command="(cmd) => handleCopyLink(cmd, image)">
                    <el-button size="small" circle>
                      <el-icon>
                        <More />
                      </el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="url">复制 URL</el-dropdown-item>
                        <el-dropdown-item command="markdown">复制 Markdown</el-dropdown-item>
                        <el-dropdown-item command="bbcode">复制 BBCode</el-dropdown-item>
                        <el-dropdown-item command="markdown_with_link">复制 Markdown(带链接)</el-dropdown-item>
                        <el-dropdown-item command="html">复制 HTML</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="image-overlay">
                  <el-tag :type="image.permission === 1 ? 'success' : 'info'" size="small">
                    {{ image.permission === 1 ? "公开" : "私有" }}
                  </el-tag>
                </div>
              </div>
              <div class="image-info">
                <div class="image-name" :title="image.origin_name">{{ image.origin_name }}</div>
                <div class="image-meta">
                  <span>{{ (image.size / 1024).toFixed(2) }} MB</span>
                  <span v-if="image.width && image.height">{{ image.width }}×{{ image.height }}</span>
                  <span>{{ formatDate(image.date) }}</span>
                </div>
                <div class="image-hash">
                  <el-tooltip :content="image.md5" placement="top">
                    <span class="hash">MD5: {{ shortenHash(image.md5) }}</span>
                  </el-tooltip>
                </div>
              </div>
            </el-card>
          </div>
        </el-checkbox-group>
      </div>

      <div v-if="imageStore.imagePagination.last_page > 1" class="pagination">
        <el-pagination v-model:current-page="imageStore.imagePagination.current_page"
          :page-size="imageStore.imagePagination.per_page" :total="imageStore.imagePagination.total"
          layout="total, prev, pager, next" @current-change="imageStore.handlePageChange" />
      </div>
    </div>

    <el-dialog v-model="showUploadDialog" title="上传图片" width="90%" :before-close="handleUploadDialogClose">
      <el-upload ref="uploadRef" drag multiple :auto-upload="false" :on-change="handleFileChange"
        :on-remove="handleUploadRemove" list-type="picture" accept="image/*">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 jpg、png、gif、webp 格式，单文件不超过 10MB</div>
        </template>
      </el-upload>
      <div class="upload-options" style="margin-top: 20px">
        <el-form :model="uploadForm" label-width="80px">
          <el-form-item label="上传权限">
            <el-radio-group v-model="uploadForm.permission">
              <el-radio :value="1">公开</el-radio>
              <el-radio :value="0">私有</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="选择相册">
            <el-select v-model="uploadForm.album_id" placeholder="选择相册" clearable style="width: 100%"
              @change="handleAlbumChange">
              <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name" :value="album.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="过期时间">
            <el-date-picker v-model="uploadForm.expired_at" type="datetime" placeholder="选择图片过期时间"
              value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="handleUploadDialogClose">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!canUpload" @click="handleManualUpload">
          {{ uploading ? "上传中..." : "开始上传" }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAlbumDialog" title="相册管理" width="90%">
      <div v-loading="imageStore.loading.albums">
        <div class="album-list">
          <div v-for="album in imageStore.albumList" :key="album.id" class="album-item">
            <div class="album-info">
              <h4>{{ album.name }}</h4>
              <p>{{ album.intro || "暂无描述" }}</p>
              <span class="album-stats">{{ album.image_num }} 张图片</span>
            </div>
            <el-button type="danger" size="small" @click="handleDeleteAlbum(album.id)"
              :loading="deletingAlbum === album.id">
              删除
            </el-button>
          </div>
        </div>
        <div v-if="imageStore.albumList.length === 0" class="empty-albums">
          <el-empty description="暂无相册" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showAlbumDialog = false">关闭</el-button>
        <el-button @click="refreshAlbumList">刷新列表</el-button>
      </template>
    </el-dialog>

    <div class="bottom-action-bar">
      <el-button text @click="showAlbumDialog = true">
        <el-icon>
          <Folder />
        </el-icon> 相册 ({{ imageStore.albumList.length }})
      </el-button>
      <div class="bottom-stats">
        <span>共 {{ imageStore.imagePagination.total }} 张</span>
        <el-divider direction="vertical" />
        <span>已选 {{ imageStore.selectedImages.length }} 张</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import {
  Plus, Refresh, Search, Delete, More, Picture,
  UploadFilled, Loading, Folder, ArrowUp, ArrowDown
} from "@element-plus/icons-vue"
import { useImageStore } from "@/store"

const imageStore = useImageStore()

// UI 控制状态
const showUploadDialog = ref(false)
const showAlbumDialog = ref(false)
const showFilter = ref(false)
const uploadRef = ref()
const deletingAlbum = ref(null)
const uploading = ref(false)

// 上传表单
const uploadForm = reactive({
  permission: 1,
  album_id: null,
  expired_at: null
})

const uploadFiles = ref([])

const canUpload = computed(() => {
  return uploadFiles.value.length > 0 && !imageStore.isStorageFull && !uploading.value
})

const formatStorageSize = (sizeInKB) => {
  if (!sizeInKB) return "0.00 MB"
  return `${(sizeInKB / 1024).toFixed(2)} MB`
}

const shortenHash = (hash) => {
  if (!hash) return ""
  return hash.substring(0, 8) + "..." + hash.substring(hash.length - 8)
}

const formatDate = (dateString) => {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("zh-CN")
}

onMounted(() => {
  initData()
})

const initData = async () => {
  await Promise.all([imageStore.fetchProfile(), imageStore.fetchAlbums()])
  await imageStore.fetchImages()
}

const handleDeleteImage = async (key) => {
  try {
    await ElMessageBox.confirm("确定要删除这张图片吗？此操作不可恢复！", "警告", {
      type: "warning",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      confirmButtonClass: "el-button--danger"
    })
    await imageStore.removeImage(key)
    ElMessage.success("删除成功")
  } catch (error) {
    if (error !== "cancel") ElMessage.error("删除失败")
  }
}

const handleBatchDelete = async () => {
  if (imageStore.selectedImages.length === 0) {
    ElMessage.warning("请选择要删除的图片")
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${imageStore.selectedImages.length} 张图片吗？此操作不可恢复！`,
      "批量删除",
      { type: "warning", confirmButtonText: "确定删除", cancelButtonText: "取消", confirmButtonClass: "el-button--danger" }
    )
    await imageStore.removeSelectedImages()
    ElMessage.success(`成功删除 ${imageStore.selectedImages.length} 张图片`)
  } catch (error) {
    if (error !== "cancel") ElMessage.error("批量删除失败")
  }
}

const handleDeleteAlbum = async (albumId) => {
  try {
    await ElMessageBox.confirm("确定要删除这个相册吗？相册内的图片不会被删除。", "删除相册", {
      type: "warning",
      confirmButtonText: "确定删除",
      cancelButtonText: "取消"
    })
    deletingAlbum.value = albumId
    await imageStore.removeAlbum(albumId)
    ElMessage.success("相册删除成功")
  } catch (error) {
    if (error !== "cancel") ElMessage.error("删除相册失败")
  } finally {
    deletingAlbum.value = null
  }
}

const refreshAlbumList = async () => {
  await imageStore.fetchAlbums()
  ElMessage.success("相册列表已刷新")
}

const handleCopyLink = (type, image) => {
  const linkMap = {
    url: image.links?.url,
    markdown: image.links?.markdown,
    bbcode: image.links?.bbcode,
    markdown_with_link: image.links?.markdown_with_link,
    html: image.links?.html
  }
  const link = linkMap[type]
  if (link) {
    navigator.clipboard.writeText(link).then(() => {
      ElMessage.success(`已复制${getLinkTypeName(type)}到剪贴板`)
    }).catch(() => {
      ElMessage.error("复制失败，请手动复制")
    })
  } else {
    ElMessage.error("该链接类型不可用")
  }
}

const getLinkTypeName = (type) => {
  const names = {
    url: "URL",
    markdown: "Markdown",
    bbcode: "BBCode",
    markdown_with_link: "Markdown(带链接)",
    html: "HTML"
  }
  return names[type] || "链接"
}

const handleAlbumChange = (albumId) => {
  if (albumId) {
    const selectedAlbum = imageStore.albumList.find(a => a.id === albumId)
    if (selectedAlbum?.permission !== undefined) {
      uploadForm.permission = selectedAlbum.permission
    }
  }
}

const handleFileChange = (file, fileList) => {
  uploadFiles.value = fileList.filter(f => f.status === "ready").map(f => f.raw)
}
const handleUploadRemove = (file) => {
  uploadFiles.value = uploadFiles.value.filter(f => f.uid !== file.uid)
}

const handleManualUpload = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning("请选择要上传的图片")
    return
  }
  uploading.value = true
  let successCount = 0
  try {
    for (const rawFile of uploadFiles.value) {
      const isImage = rawFile.type.startsWith("image/")
      const isLt10M = rawFile.size / 1024 / 1024 < 10
      if (!isImage) {
        ElMessage.error(`${rawFile.name} 不是图片文件，已跳过`)
        continue
      }
      if (!isLt10M) {
        ElMessage.error(`${rawFile.name} 超过 10MB，已跳过`)
        continue
      }
      try {
        await imageStore.uploadImage(rawFile, {
          permission: uploadForm.permission,
          album_id: uploadForm.album_id,
          expired_at: uploadForm.expired_at
        })
        successCount++
      } catch (err) {
        console.error("上传失败:", rawFile.name, err)
      }
    }
    ElMessage.success(`成功上传 ${successCount} 张图片`)
    if (successCount > 0) {
      imageStore.imagePagination.current_page = 1
      await imageStore.fetchImages()
      await imageStore.fetchProfile()
    }
  } finally {
    uploading.value = false
    showUploadDialog.value = false
    uploadFiles.value = []
    Object.assign(uploadForm, { permission: 1, album_id: null, expired_at: null })
  }
}

const handleUploadDialogClose = () => {
  if (uploadRef.value) uploadRef.value.clearFiles()
  showUploadDialog.value = false
  uploadFiles.value = []
  Object.assign(uploadForm, { permission: 1, album_id: null, expired_at: null })
}
</script>

<style scoped>
.picture-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  /* 使用主题变量 */
  background: var(--bgPrimary);
  color: var(--text);
  transition: background var(--transitionDuration), color var(--transitionDuration);
}

.user-profile-card {
  /* 移除硬编码渐变，改为跟随主题的容器色，或者使用主题定义的 primary 色阶 */
  /* 如果希望保留卡片特色，可以使用主题色变量，例如： */
  background: var(--bgSecondary);
  border: 1px solid var(--border);
  border-radius: var(--borderRadius);
  padding: 24px;
  color: var(--text);
  margin-bottom: 24px;
  box-shadow: var(--boxShadow);
  transition: box-shadow var(--transitionDuration);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.profile-header .el-avatar {
  border: 3px solid var(--borderLighter);
}

.profile-info {
  flex: 1;
  margin-left: 16px;
}

.profile-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
}

.profile-info p {
  margin: 2px 0;
  color: var(--textSecondary);
}

.email {
  font-size: 12px;
  color: var(--textLight);
}

.profile-status {
  margin-left: auto;
}

.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
}

.storage-progress {
  flex: 1;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text);
}

.storage-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--textSecondary);
}

.stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--text);
}

.stat-label {
  font-size: 12px;
  color: var(--textLight);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--bgSecondary);
  padding: 16px;
  border-radius: var(--borderRadius);
  box-shadow: var(--boxShadow);
  border: 1px solid var(--borderExtraLight);
}

.action-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-filter {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-toggle {
  background: var(--bgSecondary);
  padding: 10px 16px;
  border-radius: var(--borderRadius);
  box-shadow: var(--boxShadow);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  border: 1px solid var(--borderExtraLight);
}

.filter-icon {
  transition: transform 0.3s ease;
}

.expanded-filter {
  background: var(--bgSecondary);
  padding: 16px;
  border-radius: var(--borderRadius);
  box-shadow: var(--boxShadow);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--borderExtraLight);
}

.image-list {
  background: var(--bgSecondary);
  border-radius: var(--borderRadius);
  padding: 20px;
  box-shadow: var(--boxShadow);
  margin-bottom: 80px;
  border: 1px solid var(--borderExtraLight);
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.image-item {
  position: relative;
}

.image-card {
  transition: all 0.3s ease;
  border: 1px solid var(--borderLight);
  background-color: var(--bgSecondary);
  border-radius: var(--borderRadius);
  color: var(--text);
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--boxShadowHover);
  border-color: var(--primary-color);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bgDisabled);
}

.image-preview {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.image-error,
.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--textLight);
  font-size: 14px;
}

.image-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.image-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.image-container:hover .image-actions {
  opacity: 1;
}

.image-overlay {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 2;
}

.image-info {
  padding: 12px;
}

.image-name {
  font-weight: 500;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: var(--text);
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--textSecondary);
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 4px;
}

.image-hash {
  font-size: 11px;
  color: var(--textLight);
}

.hash {
  cursor: pointer;
  font-family: monospace;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.upload-options {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--borderLight);
}

.album-list {
  max-height: 400px;
  overflow-y: auto;
}

.album-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--borderLight);
  border-radius: var(--borderRadius);
  margin-bottom: 8px;
  background: var(--bgSecondary);
}

.album-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--text);
}

.album-info p {
  margin: 0 0 4px 0;
  color: var(--textSecondary);
  font-size: 12px;
}

.album-stats {
  font-size: 11px;
  color: var(--textLight);
}

.empty-albums {
  padding: 40px 0;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--footerBg);
  padding: 12px 20px;
  border-top: 1px solid var(--borderLight);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  /* 稍微保留一点阴影用于层级 */
  z-index: 1000;
}

.bottom-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--textSecondary);
  font-size: 14px;
}

.loading-state {
  background: var(--bgSecondary);
  padding: 20px;
  border-radius: var(--borderRadius);
  margin-bottom: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed var(--border);
  background: var(--bgSecondary);
  color: var(--text);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
}

:deep(.el-checkbox-group) {
  width: 100%;
}

@media (max-width: 768px) {
  .picture-management {
    padding: 10px;
  }

  .user-profile-card {
    padding: 16px;
  }

  .profile-header {
    align-items: flex-start;
    gap: 12px;
  }

  .profile-status {
    margin-left: 0;
    margin-top: 8px;
  }

  .storage-info {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }

  .stats {
    justify-content: space-around;
    gap: 10px;
  }

  .stat-number {
    font-size: 20px;
  }

  .action-bar {
    padding: 12px;
  }

  .action-left .el-button span {
    display: none;
  }

  .action-left .el-button {
    padding: 10px;
  }

  .search-filter {
    width: 100%;
    order: 3;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .image-info {
    padding: 8px;
  }

  .image-name {
    font-size: 13px;
  }

  .image-meta {
    font-size: 11px;
  }

  .image-meta span:nth-child(2) {
    display: none;
  }

  .image-hash {
    display: none;
  }

  .bottom-stats {
    font-size: 12px;
  }

  .bottom-stats span:nth-child(3) {
    display: none;
  }

  .el-dialog {
    width: 90% !important;
  }
}
</style>