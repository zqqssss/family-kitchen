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
  submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请填写详细描述', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    // 模拟网络请求延迟
    setTimeout(() => {
      wx.hideLoading()
      
      // 构建提交给后端的数据
      const feedbackData = {
        type: this.data.feedbackTypes[this.data.currentType],
        content: this.data.content,
        phone: this.data.phone,
        // 实际开发中需要先上传图片获得URL
        images: this.data.images 
      }
      console.log('提交反馈:', feedbackData)

      wx.showToast({ title: '感谢您的反馈', icon: 'success' })

      // 延迟返回
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }, 1000)
  }
})
