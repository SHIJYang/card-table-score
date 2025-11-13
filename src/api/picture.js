import { request } from '@/utils/request'



// 上传
export const upload = (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request.upload('/user/avatar', formData)
}
