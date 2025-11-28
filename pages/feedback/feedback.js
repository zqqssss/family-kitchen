const API_BASE_URL = 'https://7song.xyz/api'

Page({
  data: {
    feedbackTypes: ['口味问题', '分量问题', '服务态度', '环境卫生', '新菜建议', '其他'],
    currentType: 0,
    content: '',
    contentLength: 0,
    phone: '',
    images: []
  },

  // 选择反馈类型
  selectType(e) {
    this.setData({ currentType: e.currentTarget.dataset.index })
  },

  // 输入内容监听
  onContentInput(e) {
    const value = e.detail.value
    this.setData({
      content: value,
      contentLength: value.length
    })
  },

  // 电话输入监听
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles
        const newImages = tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: this.data.images.concat(newImages)
        })
      }
    })
  },

  // 提交反馈
  async submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    try {
      // 1. 先上传图片（如果有）
      let imageUrls = []
      if (this.data.images.length > 0) {
        imageUrls = await this.uploadImages()
      }

      // 2. 获取用户信息
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo) {
        wx.hideLoading()
        wx.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      // 3. 构建提交给后端的数据
      const feedbackData = {

        type: this.data.feedbackTypes[this.data.currentType],
        content: this.data.content,
        contact: this.data.phone || null,
        images: imageUrls.length > 0 ? imageUrls : null
      }

      console.log('提交反馈:', feedbackData)

      // 4. 发送请求到后端
      wx.request({
        url: `${API_BASE_URL}/feedback/submit`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: feedbackData,
        success: (res) => {
          wx.hideLoading()

          if (res.data.code === 200) {
            wx.showToast({ title: '感谢您的反馈', icon: 'success' })

            // 延迟返回
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          } else {
            wx.showToast({
              title: res.data.message || '提交失败',
              icon: 'none'
            })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('提交失败:', err)
          wx.showToast({ title: '网络异常，请重试', icon: 'none' })
        }
      })

    } catch (error) {
      wx.hideLoading()
      console.error('提交流程错误:', error)
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  },

  // 上传图片到后端（新增辅助方法）
  uploadImages() {
    return new Promise((resolve, reject) => {
      const uploadPromises = this.data.images.map(imagePath => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${API_BASE_URL}/feedback/uploadImage`,
            filePath: imagePath,
            name: 'image',
            success: (res) => {
              try {
                const data = JSON.parse(res.data)
                if (data.code === 200) {
                  resolve(data.data) // 返回图片URL
                } else {
                  reject(new Error(data.message || '上传失败'))
                }
              } catch (e) {
                reject(new Error('响应解析失败'))
              }
            },
            fail: reject
          })
        })
      })

      Promise.all(uploadPromises)
        .then(resolve)
        .catch(reject)
    })
  }
})