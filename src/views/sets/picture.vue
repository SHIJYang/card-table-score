<!-- picture.vue -->
<template>
  <div class="picture-management">
    <!-- 顶部用户信息 -->
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
            <span>{{ storageUsagePercent }}%</span>
          </div>
          <el-progress :percentage="storageUsagePercent" :show-text="false" :stroke-width="8" />
          <div class="storage-details">
            <span>已使用: {{ formatStorageSize(imageStore.userProfile?.size) }}</span>
            <span>总容量: {{ formatStorageSize(imageStore.userProfile?.capacity) }}</span>
            <span>剩余: {{ formatStorageSize(remainingStorage) }}</span>
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

    <!-- 加载状态 -->
    <div v-if="imageStore.loading.profile && !imageStore.userProfile" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 操作区域 -->
    <div class="action-bar">
      <div class="action-left">
        <el-button type="primary" @click="showUploadDialog = true" :disabled="imageStore.isStorageFull" :icon="Plus">
          上传
        </el-button>
        <el-button @click="refreshAlbumList" :loading="imageStore.loading.images" :icon="Refresh">刷新</el-button>
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedImages.length === 0" :icon="Delete">
          删除 ({{ selectedImages.length }})
        </el-button>
      </div>
      <div class="search-filter">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索..."
          clearable
          style="width: 120px"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="filterPermission"
          placeholder="权限"
          @change="handleSearch"
          clearable
          style="width: 100px"
        >
          <el-option label="公开" value="public" />
          <el-option label="私有" value="private" />
        </el-select>
      </div>
    </div>

    <!-- 筛选器折叠按钮 -->
    <div class="filter-toggle" @click="showFilter = !showFilter">
      <span>{{ showFilter ? "收起筛选" : "更多筛选" }}</span>
      <el-icon class="filter-icon">
        <component :is="showFilter ? ArrowUp : ArrowDown" />
      </el-icon>
    </div>

    <!-- 展开的筛选器 -->
    <div class="expanded-filter" v-if="showFilter">
      <el-select
        v-model="filterAlbum"
        placeholder="相册筛选"
        @change="handleSearch"
        clearable
        style="width: 100%; margin-bottom: 10px"
      >
        <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name" :value="album.id" />
      </el-select>
      <el-select v-model="sortOrder" placeholder="排序方式" @change="handleSearch" clearable style="width: 100%">
        <el-option label="最新上传" value="newest" />
        <el-option label="最早上传" value="earliest" />
        <el-option label="文件最大" value="utmost" />
        <el-option label="文件最小" value="least" />
      </el-select>
    </div>

    <!-- 图片列表 -->
    <div class="image-list">
      <div v-if="imageStore.imageList.length === 0 && !imageStore.loading.images" class="empty-state">
        <el-empty description="暂无图片" />
        <el-button type="primary" @click="showUploadDialog = true">上传第一张图片</el-button>
      </div>
      <div v-loading="imageStore.loading.images">
        <el-checkbox-group v-model="selectedImages" class="image-grid">
          <div v-for="image in imageStore.imageList" :key="image.key" class="image-item">
            <el-card class="image-card" :body-style="{ padding: '0px' }">
              <div class="image-container">
                <el-checkbox :value="image.key" class="image-checkbox" />
                <el-image
                  :src="image.links?.thumbnail_url || image.links?.url"
                  :preview-src-list="[image.links?.url]"
                  fit="cover"
                  loading="lazy"
                  class="image-preview"
                  :hide-on-click-modal="true"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                  <template #placeholder>
                    <div class="image-loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>加载中...</span>
                    </div>
                  </template>
                </el-image>
                <div class="image-actions">
                  <el-button type="danger" size="small" circle @click="handleDeleteImage(image.key)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                  <el-dropdown trigger="click" @command="(command) => handleCopyLink(command, image)">
                    <el-button size="small" circle>
                      <el-icon><More /></el-icon>
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

      <!-- 分页 -->
      <div v-if="imageStore.imagePagination.last_page > 1" class="pagination">
        <el-pagination
          v-model:current-page="imageStore.imagePagination.current_page"
          :page-size="imageStore.imagePagination.per_page"
          :total="imageStore.imagePagination.total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog v-model="showUploadDialog" title="上传图片" width="90%" :before-close="handleUploadDialogClose">
      <el-upload
        ref="uploadRef"
        drag
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleUploadRemove"
        list-type="picture"
        accept="image/*"
      >
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
            <el-select v-model="uploadForm.album_id" placeholder="选择相册" clearable style="width: 100%">
              <el-option v-for="album in imageStore.albumList" :key="album.id" :label="album.name" :value="album.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="uploadForm.expired_at"
              type="datetime"
              placeholder="选择图片过期时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
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

    <!-- 相册管理对话框 -->
    <el-dialog v-model="showAlbumDialog" title="相册管理" width="90%">
      <div v-loading="imageStore.loading.albums">
        <div class="album-list">
          <div v-for="album in imageStore.albumList" :key="album.id" class="album-item">
            <div class="album-info">
              <h4>{{ album.name }}</h4>
              <p>{{ album.intro || "暂无描述" }}</p>
              <span class="album-stats">{{ album.image_num }} 张图片</span>
            </div>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteAlbum(album.id)"
              :loading="deletingAlbum === album.id"
            >
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

    <!-- 底部操作栏 -->
    <div class="bottom-action-bar">
      <el-button text @click="showAlbumDialog = true">
        <el-icon><Folder /></el-icon> 相册 ({{ imageStore.albumList.length }})
      </el-button>
      <div class="bottom-stats">
        <span>共 {{ imageStore.imagePagination.total }} 张</span>
        <el-divider direction="vertical" />
        <span>已选 {{ selectedImages.length }} 张</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus, Refresh, Search, Delete, More, Picture,
  UploadFilled, Loading, Folder, ArrowUp, ArrowDown
} from "@element-plus/icons-vue";
import { useImageStore } from "@/store";

const imageStore = useImageStore();

// ====== 组件本地状态（必须定义）======
const selectedImages = ref([]);
const showUploadDialog = ref(false);
const uploading = ref(false);
const showAlbumDialog = ref(false);

const searchKeyword = ref("");
const filterPermission = ref("");
const filterAlbum = ref("");
const sortOrder = ref("");
const showFilter = ref(false);

const uploadForm = reactive({
  permission: 1,
  album_id: null,
  expired_at: null,
});
const uploadRef = ref(null);

// ====== 计算属性 ======
const storageUsagePercent = computed(() => {
  const size = imageStore.userProfile?.size || 0;
  const cap = imageStore.userProfile?.capacity || 1;
  return Math.min(100, Math.round((size / cap) * 100));
});

const remainingStorage = computed(() => {
  return (imageStore.userProfile?.capacity || 0) - (imageStore.userProfile?.size || 0);
});

const canUpload = computed(() => {
  return uploadRef.value?.uploadFiles?.length > 0 && !uploading.value && !imageStore.isStorageFull;
});

// ====== 方法（仅调用已有 store 方法）======

// 刷新相册（用已有 fetchAlbums）
const refreshAlbumList = () => {
  imageStore.fetchAlbums(1, 999); // 假设一页拉完所有相册
};

// 批量删除：循环调用 removeImage
const handleBatchDelete = async () => {
  if (selectedImages.value.length === 0) return;

  ElMessageBox.confirm(
    `确定删除选中的 ${selectedImages.value.length} 张图片？`,
    "批量删除",
    { type: "warning" }
  )
    .then(async () => {
      uploading.value = true; // 复用 loading 状态
      try {
        for (const key of [...selectedImages.value]) {
          await imageStore.removeImage(key);
          // 成功后从选中移除（避免重复删）
          const idx = selectedImages.value.indexOf(key);
          if (idx > -1) selectedImages.value.splice(idx, 1);
        }
        ElMessage.success("批量删除成功");
      } catch (err) {
        ElMessage.error("部分图片删除失败");
      } finally {
        uploading.value = false;
      }
    })
    .catch(() => {});
};

// 删除单图
const handleDeleteImage = (key) => {
  ElMessageBox.confirm("确定删除这张图片？", "删除", { type: "warning" })
    .then(() => imageStore.removeImage(key))
    .catch(() => {});
};

// 删除相册
const handleDeleteAlbum = (id) => {
  ElMessageBox.confirm("删除相册将删除其中所有图片，确定？", "删除相册", { type: "error" })
    .then(() => imageStore.removeAlbum(id))
    .catch(() => {});
};

// 复制链接（纯前端）
const handleCopyLink = (command, image) => {
  const url = image.links?.url || "";
  const name = image.origin_name || "image";
  let text = url;
  switch (command) {
    case "markdown": text = `![${name}](${url})`; break;
    case "markdown_with_link": text = `[![${name}](${url})](${url})`; break;
    case "bbcode": text = `[img]${url}[/img]`; break;
    case "html": text = `<img src="${url}" alt="${name}" />`; break;
  }
  navigator.clipboard?.writeText(text).then(() => ElMessage.success("已复制"));
};

// 搜索 & 分页
const handleSearch = () => {
  imageStore.fetchImages({
    keyword: searchKeyword.value || undefined,
    permission: filterPermission.value || undefined,
    album_id: filterAlbum.value || undefined,
    sort: sortOrder.value || undefined,
    page: 1
  });
};

const handlePageChange = (page) => {
  imageStore.fetchImages({
    keyword: searchKeyword.value || undefined,
    permission: filterPermission.value || undefined,
    album_id: filterAlbum.value || undefined,
    sort: sortOrder.value || undefined,
    page
  });
};

// 上传处理：循环调用 uploadImage
const handleManualUpload = async () => {
  const files = uploadRef.value?.uploadFiles || [];
  if (files.length === 0 || uploading.value || imageStore.isStorageFull) return;

  uploading.value = true;
  try {
    for (const fileObj of files) {
      const file = fileObj.raw; // Element Plus 的 File 对象在 raw 中
      await imageStore.uploadImage(file, {
        permission: uploadForm.permission,
        album_id: uploadForm.album_id,
        expired_at: uploadForm.expired_at
      });
    }
    ElMessage.success("全部上传成功");
    showUploadDialog.value = false;
    uploadRef.value.clearFiles();
    Object.assign(uploadForm, { permission: 1, album_id: null, expired_at: null });
  } catch (err) {
    ElMessage.error("上传过程中出错，请重试");
  } finally {
    uploading.value = false;
  }
};

const handleUploadDialogClose = () => {
  if (uploading.value) return ElMessage.warning("正在上传");
  showUploadDialog.value = false;
  nextTick(() => uploadRef.value?.clearFiles());
};

// 工具函数（内联）
const formatStorageSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp * 1000).toLocaleString();
};

const shortenHash = (hash) => hash ? hash.substring(0, 8) + "..." : "";

// 初始化
onMounted(() => {
  imageStore.fetchProfile();
  imageStore.fetchAlbums(1, 999);
  imageStore.fetchImages({ page: 1 });
});
</script>
<style scoped>
.picture-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--el-bg-color-page); /* 使用 Element Plus 页面背景变量 */
}

/* 用户信息卡片：使用柔和卡片样式，不强制渐变 */
.user-profile-card {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 24px;
  color: var(--el-text-color-primary);
  margin-bottom: 24px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.profile-header .el-avatar {
  border: 3px solid var(--el-border-color-light);
}

.profile-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.profile-info p {
  margin: 2px 0;
  color: var(--el-text-color-secondary);
}

.email {
  font-size: 12px;
}

.profile-status {
  flex-shrink: 0;
}

.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
  flex-wrap: wrap;
}

.storage-progress {
  flex: 1;
  min-width: 200px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.storage-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stats {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
  background: var(--el-bg-color);
  padding: 16px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
}

.action-left,
.search-filter {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

/* 筛选器折叠 */
.filter-toggle {
  background: var(--el-bg-color);
  padding: 10px 16px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-light);
  transition: background-color 0.2s;
}

.filter-toggle:hover {
  background: var(--el-fill-color-light);
}

.expanded-filter {
  background: var(--el-bg-color);
  padding: 16px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--el-border-color-light);
}

/* 图片列表 */
.image-list {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  margin-bottom: 80px;
  border: 1px solid var(--el-border-color-light);
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
  border: 1px solid var(--el-border-color-light);
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.image-error,
.image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-placeholder);
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
  color: var(--el-text-color-primary);
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 4px;
}

.image-hash {
  font-size: 11px;
  color: var(--el-text-color-secondary);
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
  border-top: 1px solid var(--el-border-color-light);
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
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  margin-bottom: 8px;
}

.album-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.album-info p {
  margin: 0 0 4px 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.album-stats {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.empty-albums {
  padding: 40px 0;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--el-bg-color);
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottom-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading-state {
  background: var(--el-bg-color);
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-light);
}

:deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed var(--el-border-color-light);
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--el-color-primary);
}

:deep(.el-checkbox-group) {
  width: 100%;
}

/* 响应式 */
@media (max-width: 768px) {
  .picture-management {
    padding: 10px;
  }

  .user-profile-card {
    padding: 16px;
  }

  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .storage-info {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .stats {
    justify-content: space-around;
    width: 100%;
  }

  .action-bar {
    padding: 12px;
  }

  .action-left .el-button span {
    display: none;
  }

  .action-left .el-button {
    padding: 8px;
  }

  .search-filter {
    width: 100%;
    order: 3;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .image-meta span:nth-child(2),
  .image-hash {
    display: none;
  }

  .bottom-stats span:nth-child(3) {
    display: none;
  }

  :deep(.el-dialog) {
    width: 95% !important;
  }
}
</style>