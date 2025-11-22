Page({
  data: {
    phone: '',
    address: '',
    remark: '',
    // 预设口味标签
    tasteTags: [
      { name: '微辣', selected: false },
      { name: '免辣', selected: false },
      { name: '少盐', selected: false },
      { name: '不要香菜', selected: false },
      { name: '多葱花', selected: false }
    ]
  },

  onLoad() {
    // 1. 读取之前的缓存信息
    const info = wx.getStorageSync('lastOrderInfo') || {}
    
    // 恢复标签选中状态 (如果之前的备注里包含了标签名)
    const tags = this.data.tasteTags.map(tag => {
      if (info.remark && info.remark.includes(tag.name)) {
        tag.selected = true
      }
      return tag
    })

    this.setData({
      phone: info.phone || '',
      address: info.address || '',
      remark: info.remark || '',
      tasteTags: tags
    })
  },

  // 输入监听
  onPhoneInput(e) { this.setData({ phone: e.detail.value }) },
  onAddressInput(e) { this.setData({ address: e.detail.value }) },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }) },

  // 切换标签
  toggleTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.tasteTags
    tags[index].selected = !tags[index].selected
    
    // 自动把标签追加到备注输入框里
    let remark = this.data.remark
    const tagName = tags[index].name
    
    if (tags[index].selected) {
      // 选中：追加文字
      if (!remark.includes(tagName)) {
        remark = remark ? remark + '，' + tagName : tagName
      }
    } else {
      // 取消：移除文字 (简单的字符串替换)
      remark = remark.replace(new RegExp(`，?${tagName}`, 'g'), '')
      // 清理一下可能留下的开头逗号
      if (remark.startsWith('，')) remark = remark.substring(1)
    }

    this.setData({ tasteTags: tags, remark })
  },

  // 保存信息
  saveInfo() {
    const { phone, address, remark } = this.data
    
    if (phone.length < 11) {
      wx.showToast({ title: '手机号格式不对', icon: 'none' })
      return
    }
    if (!address) {
      wx.showToast({ title: '请填写地址', icon: 'none' })
      return
    }

    // 核心：保存到本地缓存，供结算页和下次使用读取
    const userInfo = wx.getStorageSync('lastOrderInfo') || {}
    const newInfo = {
      ...userInfo,
      phone,
      address,
      remark
    }
    
    wx.setStorageSync('lastOrderInfo', newInfo)

    wx.showToast({ title: '保存成功', icon: 'success' })
    
    // 1.5秒后返回上一页
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
