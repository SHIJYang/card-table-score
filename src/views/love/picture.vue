<template>
  <div class="picture-management">
    <!-- 其他模板代码保持不变 -->

    <!-- 上传对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传图片"
      width="600px"
      :before-close="handleUploadDialogClose"
    >
      <el-upload
        ref="uploadRef"
        drag
        multiple
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="uploadData"
        :before-upload="beforeUpload"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :on-change="handleUploadChange"
        :on-remove="handleUploadRemove"
        list-type="picture"
        :auto-upload="false"
        accept="image/*"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持 jpg、png、gif、webp 格式，单文件不超过 10MB
          </div>
        </template>
      </el-upload>

      <div class="upload-options">
        <el-form :model="uploadForm" label-width="80px">
          <el-form-item label="上传权限">
            <el-radio-group v-model="uploadForm.permission">
              <el-radio :value="1">公开</el-radio>
              <el-radio :value="0">私有</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="选择相册">
            <el-select
              v-model="uploadForm.album_id"
              placeholder="选择相册"
              clearable
              style="width: 200px"
              @change="handleAlbumChange"
            >
              <el-option
                v-for="album in imageStore.albumList"
                :key="album.id"
                :label="album.name"
                :value="album.id"
              />
            </el-select>
            <el-button
              text
              type="primary"
              @click="refreshAlbumList"
              style="margin-left: 10px"
            >
              <el-icon><Refresh /></el-icon>
              刷新相册
            </el-button>
          </el-form-item>

          <el-form-item label="过期时间">
            <el-date-picker
              v-model="uploadForm.expired_at"
              type="datetime"
              placeholder="选择图片过期时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 200px"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="handleUploadDialogClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleUploadSubmit"
          :loading="imageStore.loading.upload"
        >
          开始上传 ({{ fileCount }}个文件)
        </el-button>
      </template>
    </el-dialog>

    <!-- 其他模板代码保持不变 -->
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Refresh,
  Search,
  Delete,
  More,
  Picture,
  UploadFilled,
  Loading,
  Folder,
} from "@element-plus/icons-vue";
import { useImageStore } from "@/store";
import {
  uploadImage,
  getImageList,
  deleteImage,
  getAlbumList,
  deleteAlbum,
  getStrategyList,
  getUserProfile,
} from "@/api/picture";

const imageStore = useImageStore();

// 响应式数据
const showUploadDialog = ref(false);
const showAlbumDialog = ref(false);
const searchKeyword = ref("");
const filterPermission = ref("");
const filterAlbum = ref("");
const sortOrder = ref("newest");
const selectedImages = ref([]);
const uploadRef = ref();
const deletingAlbum = ref(null);
const fileCount = ref(0);
const uploadFiles = ref([]); // 新增：直接跟踪上传文件列表

// 上传表单
const uploadForm = reactive({
  permission: 1,
  album_id: null,
  expired_at: null,
});

// 计算属性
const uploadAction = computed(() => {
  return "/api/v1/upload";
});

const uploadHeaders = computed(() => {
  const token = localStorage.getItem("token") || "";
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Requested-With": "XMLHttpRequest",
  };
});

const uploadData = computed(() => {
  return {
    permission: uploadForm.permission,
    album_id: uploadForm.album_id,
    expired_at: uploadForm.expired_at,
  };
});

// 修复：直接使用响应式变量跟踪文件数量
const updateFileCount = () => {
  // 方法1：使用 uploadRef
  if (uploadRef.value) {
    const files = uploadRef.value.uploadFiles || [];
    fileCount.value = files.length;
    uploadFiles.value = files; // 同步更新
  }
  // 方法2：使用 uploadFiles 响应式变量
  else {
    fileCount.value = uploadFiles.value.length;
  }
};

// 生命周期
onMounted(() => {
  initData();
});

// 方法
const initData = async () => {
  try {
    await fetchData();
  } catch (error) {
    console.error("初始化数据失败:", error);
    ElMessage.error("初始化数据失败");
  }
};

const fetchData = async () => {
  try {
    await Promise.all([
      fetchUserProfile(),
      fetchImageList(getImageParams()),
      fetchAlbumList(),
    ]);
  } catch (error) {
    console.error("获取数据失败:", error);
    ElMessage.error("获取数据失败");
  }
};

// API 调用方法（保持不变）
const fetchUserProfile = async () => {
  imageStore.setLoading("profile", true);
  imageStore.clearError();
  try {
    const response = await getUserProfile();
    if (response?.status) {
      imageStore.setUserProfile(response.data);
    }
    return response;
  } catch (error) {
    imageStore.setError(error.message);
    throw error;
  } finally {
    imageStore.setLoading("profile", false);
  }
};

const fetchImageList = async (params = {}) => {
  imageStore.setLoading("images", true);
  imageStore.clearError();
  try {
    const response = await getImageList(params);
    if (response?.status) {
      imageStore.setImageList(response.data.data || []);
      imageStore.setImagePagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        per_page: response.data.per_page || 20,
        total: response.data.total || 0,
      });
    }
    return response;
  } catch (error) {
    imageStore.setError(error.message);
    throw error;
  } finally {
    imageStore.setLoading("images", false);
  }
};

const fetchAlbumList = async (params = {}) => {
  imageStore.setLoading("albums", true);
  imageStore.clearError();
  try {
    const response = await getAlbumList(params);
    if (response?.status) {
      imageStore.setAlbumList(response.data.data || []);
      imageStore.setAlbumPagination({
        current_page: response.data.current_page || 1,
        last_page: response.data.last_page || 1,
        per_page: response.data.per_page || 20,
        total: response.data.total || 0,
      });
    }
    return response;
  } catch (error) {
    imageStore.setError(error.message);
    throw error;
  } finally {
    imageStore.setLoading("albums", false);
  }
};

const deleteImageFromStore = async (key) => {
  imageStore.clearError();
  try {
    const response = await deleteImage(key);
    if (response?.status) {
      imageStore.removeImage(key);
      await fetchUserProfile();
    }
    return response;
  } catch (error) {
    imageStore.setError(error.message);
    throw error;
  }
};

const deleteAlbumFromStore = async (id) => {
  imageStore.clearError();
  try {
    const response = await deleteAlbum(id);
    if (response?.status) {
      imageStore.removeAlbum(id);
    }
    return response;
  } catch (error) {
    imageStore.setError(error.message);
    throw error;
  }
};

const batchDeleteImagesFromStore = async (keys) => {
  const results = [];
  for (const key of keys) {
    try {
      const result = await deleteImageFromStore(key);
      results.push({ key, success: true, result });
    } catch (error) {
      results.push({ key, success: false, error: error.message });
    }
  }

  if (
    imageStore.imageList.length === 0 &&
    imageStore.imagePagination.current_page > 1
  ) {
    imageStore.imagePagination.current_page -= 1;
  }

  return results;
};

const refreshAlbumList = async () => {
  try {
    await fetchAlbumList();
    ElMessage.success("相册列表已刷新");
  } catch (error) {
    console.error("刷新相册列表失败:", error);
    ElMessage.error("刷新相册列表失败");
  }
};

const getImageParams = () => {
  return {
    page: imageStore.imagePagination.current_page,
    per_page: imageStore.imagePagination.per_page,
    q: searchKeyword.value,
    permission: filterPermission.value,
    album_id: filterAlbum.value,
    order: sortOrder.value,
  };
};

const handleSearch = () => {
  imageStore.imagePagination.current_page = 1;
  fetchImageList(getImageParams());
};

const handlePageChange = (page) => {
  imageStore.imagePagination.current_page = page;
  fetchImageList(getImageParams());
};

const handleSizeChange = (size) => {
  imageStore.imagePagination.per_page = size;
  imageStore.imagePagination.current_page = 1;
  fetchImageList(getImageParams());
};

const handleDeleteImage = async (key) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这张图片吗？此操作不可恢复！",
      "警告",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      }
    );

    await deleteImageFromStore(key);
    ElMessage.success("删除成功");
    selectedImages.value = selectedImages.value.filter((k) => k !== key);
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

const handleBatchDelete = async () => {
  if (selectedImages.value.length === 0) {
    ElMessage.warning("请选择要删除的图片");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedImages.value.length} 张图片吗？此操作不可恢复！`,
      "批量删除",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger",
      }
    );

    const results = await batchDeleteImagesFromStore(selectedImages.value);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      ElMessage.success(`成功删除 ${successCount} 张图片`);
    }
    if (failCount > 0) {
      ElMessage.error(`${failCount} 张图片删除失败`);
    }

    selectedImages.value = [];
    fetchImageList(getImageParams());
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除失败:", error);
      ElMessage.error("批量删除失败");
    }
  }
};

const handleDeleteAlbum = async (albumId) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个相册吗？相册内的图片不会被删除。",
      "删除相册",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
      }
    );

    deletingAlbum.value = albumId;
    await deleteAlbumFromStore(albumId);
    ElMessage.success("相册删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除相册失败:", error);
      ElMessage.error("删除相册失败");
    }
  } finally {
    deletingAlbum.value = null;
  }
};

const handleCopyLink = (type, image) => {
  const linkMap = {
    url: image.links?.url,
    markdown: image.links?.markdown,
    bbcode: image.links?.bbcode,
    markdown_with_link: image.links?.markdown_with_link,
    html: image.links?.html,
  };

  const link = linkMap[type];
  if (link) {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        ElMessage.success(`已复制${getLinkTypeName(type)}到剪贴板`);
      })
      .catch(() => {
        ElMessage.error("复制失败，请手动复制");
      });
  } else {
    ElMessage.error("该链接类型不可用");
  }
};

const getLinkTypeName = (type) => {
  const names = {
    url: "URL",
    markdown: "Markdown",
    bbcode: "BBCode",
    markdown_with_link: "Markdown(带链接)",
    html: "HTML",
  };
  return names[type] || "链接";
};

const shortenHash = (hash) => {
  if (!hash) return "";
  return hash.substring(0, 8) + "..." + hash.substring(hash.length - 8);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("zh-CN");
};

const handleAlbumChange = (albumId) => {
  if (albumId) {
    const selectedAlbum = imageStore.albumList.find(
      (album) => album.id === albumId
    );
    if (selectedAlbum && selectedAlbum.permission !== undefined) {
      uploadForm.permission = selectedAlbum.permission;
    }
  }
};

// 修复：上传相关方法
const handleUploadChange = (file, fileList) => {
  uploadFiles.value = fileList;
  fileCount.value = fileList.length;
};

const handleUploadRemove = (file, fileList) => {
  uploadFiles.value = fileList;
  fileCount.value = fileList.length;
};

const beforeUpload = (rawFile) => {
  const isImage = rawFile.type.startsWith("image/");
  const isLt10M = rawFile.size / 1024 / 1024 < 10;
  if (!isImage) {
    ElMessage.error("只能上传图片文件!");
    return false;
  }
  if (!isLt10M) {
    ElMessage.error("图片大小不能超过 10MB!");
    return false;
  }
  return true;
};

const handleUploadSuccess = (response, file) => {
  if (response?.status) {
    ElMessage.success(`${file.name} 上传成功`);
    file.status = "success";
  } else {
    const msg = response?.message || "未知错误";
    ElMessage.error(`${file.name} 上传失败: ${msg}`);
    file.status = "fail";
  }
  checkAllUploadsCompleted();
};

const handleUploadError = (error, file) => {
  console.error("上传失败:", file.name, error);
  const msg = error?.message || "网络错误";
  ElMessage.error(`${file.name} 上传失败: ${msg}`);
  file.status = "fail";
  checkAllUploadsCompleted();
};

const checkAllUploadsCompleted = () => {
  const files = uploadFiles.value;
  if (files.length === 0) return;

  const allDone = files.every(
    (file) => file.status === "success" || file.status === "fail"
  );

  if (allDone) {
    setTimeout(() => {
      showUploadDialog.value = false;
      fetchData();
      // 清空文件列表
      if (uploadRef.value) {
        uploadRef.value.clearFiles();
      }
      uploadFiles.value = [];
      fileCount.value = 0;
      Object.assign(uploadForm, {
        permission: 1,
        album_id: null,
        expired_at: null,
      });
    }, 800);
  }
};

const handleUploadSubmit = () => {
  const files = uploadFiles.value;
  if (files.length === 0) {
    ElMessage.warning("请选择要上传的图片");
    return;
  }

  const pendingFiles = files.filter((f) => !f.status);
  if (pendingFiles.length === 0) {
    ElMessage.warning("没有待上传的文件");
    return;
  }

  // 设置上传loading状态
  imageStore.setLoading("upload", true);

  // 手动触发上传
  if (uploadRef.value) {
    uploadRef.value.submit();
  }
};

const handleUploadDialogClose = () => {
  if (imageStore.loading.upload) {
    ElMessage.info("上传进行中，请等待完成");
    return;
  }

  // 清空文件列表
  if (uploadRef.value) {
    uploadRef.value.clearFiles();
  }
  uploadFiles.value = [];
  fileCount.value = 0;
  showUploadDialog.value = false;
  Object.assign(uploadForm, {
    permission: 1,
    album_id: null,
    expired_at: null,
  });
};
</script>

<style scoped>
/* 样式部分保持不变 */
.picture-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f5f7fa;
}

.user-profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.profile-header .el-avatar {
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.profile-info {
  flex: 1;
  margin-left: 16px;
}

.profile-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.profile-info p {
  margin: 2px 0;
  opacity: 0.9;
}

.email {
  font-size: 12px;
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
}

.storage-details {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.9;
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
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.image-list {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 80px;
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
  border: 1px solid #e4e7ed;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #fafafa;
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
  color: #999;
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
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  flex-wrap: wrap;
  gap: 4px;
}

.image-hash {
  font-size: 11px;
  color: #999;
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
  border-top: 1px solid #eee;
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
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
}

.album-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.album-info p {
  margin: 0 0 4px 0;
  color: #666;
  font-size: 12px;
}

.album-stats {
  font-size: 11px;
  color: #999;
}

.empty-albums {
  padding: 40px 0;
}

.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottom-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.loading-state {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

:deep(.el-upload-dragger) {
  width: 100%;
  border: 2px dashed #dcdfe6;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
}

:deep(.el-checkbox-group) {
  width: 100%;
}
</style>
