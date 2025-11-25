Page({
  data: {
    // 1. 页面状态
    currentCategory: 0,
    toView: '',
    
    // 2. 用户信息
    showUserMenu: false,
    userInfo: {},
    
    // 3. 购物车相关
    cart: {},                    // { dishId: count }
    cartList: [],                // 购物车详情列表
    showCartDetail: false,       // 购物车弹窗
    totalCount: 0,               // 总数量
    totalPrice: 0,               // 总价格
    
    // 4. 菜单数据
    categoryList: [],            // 从后端加载
    heightArr: [],               // 滚动高度数组
    isTap: false,                // 是否点击切换分类
    
    // 5. 加载状态
    loading: true
  },

  // ==================== 生命周期 ====================
  
  onLoad() {
    this.loadUserInfo()
    this.loadMenuData()
  },

  onShow() {
    // 每次显示页面时重新计算高度(防止页面返回后错位)
    if (this.data.categoryList.length > 0) {
      setTimeout(() => this.calculateHeights(), 500)
    }
  },

  // ==================== 数据加载 ====================
  
  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })
  },

  /**
   * 从后端加载菜单数据
   */
  loadMenuData() {
    wx.showLoading({ title: '加载菜单...' })
    
    wx.request({
      url: 'http://localhost:8080/api/recipe/menu',
      method: 'GET',
      success: (res) => {
        console.log('菜单数据:', res.data)
        
        if (res.data.code === 200) {
          const categoryList = res.data.data.map(cat => ({
            ...cat,
            count: 0  // 初始化分类角标为0
          }))
          
          this.setData({ 
            categoryList,
            loading: false
          })
          
          // 数据加载完成后计算高度
          setTimeout(() => this.calculateHeights(), 800)
        } else {
          this.handleLoadError('加载失败: ' + res.data.message)
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        this.handleLoadError('网络错误，请检查后端是否启动')
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  /**
   * 加载失败处理
   */
  handleLoadError(message) {
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      success: () => {
        // 使用默认数据
        this.setData({ 
          categoryList: this.getDefaultData(),
          loading: false
        })
      }
    })
  },

  /**
   * 默认数据(防止白屏)
   */
  getDefaultData() {
    return [
      {
        id: 1, name: '招牌热菜', count: 0,
        dishes: [
          { id: 101, name: '红烧肉', price: 48, image: 'https://dummyimage.com/100x100/ff9c00/fff.png&text=Dish', description: '肥而不腻' }
        ]
      }
    ]
  },

  // ==================== 滚动联动 ====================
  
  /**
   * 计算每个分类的高度
   */
  calculateHeights() {
    const query = wx.createSelectorQuery()
    query.selectAll('.category-block').boundingClientRect((rects) => {
      if (!rects || rects.length === 0) {
        console.warn('未找到分类块元素')
        return
      }
      
      let heightArr = []
      let totalHeight = 0
      
      rects.forEach((rect) => {
        totalHeight += rect.height
        heightArr.push(totalHeight)
      })
      
      this.setData({ heightArr })
      console.log('高度数组:', heightArr)
    }).exec()
  },

  /**
   * 点击左侧分类切换
   */
  switchCategory(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentCategory: index,
      toView: `category-${index}`,
      isTap: true
    })
    
    // 500ms后取消点击标记
    clearTimeout(this.tapTimer)
    this.tapTimer = setTimeout(() => {
      this.setData({ isTap: false })
    }, 500)
  },

  /**
   * 右侧滚动时联动左侧分类
   */
  onRightScroll(e) {
    // 如果是点击切换的，不触发滚动联动
    if (this.data.isTap) return
    
    const scrollTop = e.detail.scrollTop
    const { heightArr } = this.data
    
    for (let i = 0; i < heightArr.length; i++) {
      const prevHeight = i === 0 ? 0 : heightArr[i - 1]
      const currHeight = heightArr[i]
      
      // 滚动到某个分类区域时高亮对应分类
      if (scrollTop >= prevHeight - 50 && scrollTop < currHeight - 50) {
        if (this.data.currentCategory !== i) {
          this.setData({ currentCategory: i })
        }
        break
      }
    }
  },

  // ==================== 购物车逻辑 ====================
  
  /**
   * 更新购物车(加减菜品)
   */
  updateCart(e) {
    const { type, id, catIndex } = e.currentTarget.dataset
    const cart = { ...this.data.cart }
    let count = cart[id] || 0
    
    // 加减逻辑
    if (type === 'add') {
      count++
    } else if (type === 'minus' && count > 0) {
      count--
    }
    
    // 更新购物车
    if (count > 0) {
      cart[id] = count
    } else {
      delete cart[id]  // 数量为0时删除
    }
    
    this.setData({ cart })
    
    // 更新分类角标
    this.updateCategoryBadge()
    
    // 重新计算总价
    this.calculateTotal()
    
    // 更新购物车详情列表
    this.generateCartList()
    
    // 购物车空了自动关闭详情
    if (this.data.totalCount === 0) {
      this.setData({ showCartDetail: false })
    }
  },

  /**
   * 更新分类角标
   */
  updateCategoryBadge() {
    const { cart, categoryList } = this.data
    
    const newCategoryList = categoryList.map(category => {
      let count = 0
      category.dishes.forEach(dish => {
        count += (cart[dish.id] || 0)
      })
      return { ...category, count }
    })
    
    this.setData({ categoryList: newCategoryList })
  },

  /**
   * 计算购物车总价和总数量
   */
  calculateTotal() {
    const { cart, categoryList } = this.data
    let totalCount = 0
    let totalPrice = 0
    
    // 遍历所有菜品
    categoryList.forEach(category => {
      category.dishes.forEach(dish => {
        const count = cart[dish.id] || 0
        if (count > 0) {
          totalCount += count
          totalPrice += dish.price * count
        }
      })
    })
    
    this.setData({
      totalCount,
      totalPrice: totalPrice.toFixed(2)
    })
  },

  /**
   * 生成购物车详情列表
   */
  generateCartList() {
    const { cart, categoryList } = this.data
    const cartList = []
    
    categoryList.forEach((category, catIndex) => {
      category.dishes.forEach(dish => {
        const count = cart[dish.id]
        if (count > 0) {
          cartList.push({
            ...dish,
            count,
            catIndex  // 记录分类索引(用于加减操作)
          })
        }
      })
    })
    
    this.setData({ cartList })
  },

  /**
   * 切换购物车详情显示
   */
  toggleCartDetail() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '购物车是空的', icon: 'none' })
      return
    }
    this.setData({ showCartDetail: !this.data.showCartDetail })
  },

  /**
   * 清空购物车
   */
  clearCart() {
    wx.showModal({
      title: '提示',
      content: '确定清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            cart: {},
            cartList: [],
            totalCount: 0,
            totalPrice: 0,
            showCartDetail: false
          })
          
          // 清空分类角标
          const categoryList = this.data.categoryList.map(cat => ({
            ...cat,
            count: 0
          }))
          this.setData({ categoryList })
          
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  // ==================== 用户菜单 ====================
  
  /**
   * 切换用户菜单显示
   */
  toggleUserMenu() {
    this.setData({ showUserMenu: !this.data.showUserMenu })
  },

  /**
   * 阻止事件冒泡
   */
  preventBubble() {},

  /**
   * 处理菜单操作
   */
  handleMenuAction(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ showUserMenu: false })
    
    const actions = {
      address: () => wx.navigateTo({ url: '/pages/modify/modify' }),
      feedback: () => wx.navigateTo({ url: '/pages/feedback/feedback' }),
      donate: () => wx.showToast({ title: '感谢您的打赏', icon: 'none' }),
      order: () => wx.navigateTo({ url: '/pages/order/order' })
    }
    
    actions[type] && actions[type]()
  },

  // ==================== 跳转结算页 ====================
  
  /**
   * 去结算
   */
  goToOrder() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' })
      return
    }
    
    // 保存购物车数据到本地存储
    wx.setStorageSync('checkedDishes', this.data.cartList)
    wx.setStorageSync('orderTotalPrice', this.data.totalPrice)
    wx.setStorageSync('orderTotalCount', this.data.totalCount)
    
    // 跳转到结算页
    wx.navigateTo({
      url: '/pages/settlement/settlement',
      fail: (err) => {
        console.error('跳转失败:', err)
        wx.showToast({ title: '页面跳转失败', icon: 'none' })
      }
    })
  }
})
