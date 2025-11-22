Page({
  data: {
    // 1. 页面状态
    currentCategory: 0, 
    toView: '',
    
    // 用户菜单相关
    showUserMenu: false,
    userInfo: {},
    
    // 2. 购物车与数据
    cart: {},
     cartList: [], // 【新增】用于渲染购物车详情弹窗的列表
    showCartDetail: false, // 【新增】控制购物车详情弹窗显示
    totalCount: 0,
    totalPrice: 0,
    
    // 3. 滚动联动
    heightArr: [],
    isTap: false,

    // 4. 完整数据 (防止白屏)
    categoryList: [
      {
        id: 1, name: '招牌热菜', count: 0,
        dishes: [
          { id: 101, name: '红烧肉', price: 48, image: 'https://dummyimage.com/200x200/ff9c00/ffffff.png&text=Pork', description: '肥而不腻，入口即化' },
          { id: 102, name: '糖醋排骨', price: 38, image: 'https://dummyimage.com/200x200/ff9c00/ffffff.png&text=Ribs', description: '酸甜可口' },
          { id: 103, name: '宫保鸡丁', price: 28, image: 'https://dummyimage.com/200x200/ff9c00/ffffff.png&text=Chicken' }
        ]
      },
      {
        id: 2, name: '清爽凉菜', count: 0,
        dishes: [
          { id: 201, name: '拍黄瓜', price: 12, image: 'https://dummyimage.com/200x200/90ee90/ffffff.png&text=Cucumber' },
          { id: 202, name: '口水鸡', price: 26, image: 'https://dummyimage.com/200x200/ff9c00/ffffff.png&text=SpicyChicken' }
        ]
      },
      {
        id: 3, name: '营养汤羹', count: 0,
        dishes: [
          { id: 301, name: '玉米排骨汤', price: 38, image: 'https://dummyimage.com/200x200/ffdd00/ffffff.png&text=Soup' },
          { id: 302, name: '西红柿蛋汤', price: 15, image: 'https://dummyimage.com/200x200/ff6347/ffffff.png&text=TomatoSoup' }
        ]
      },
      {
        id: 4, name: '主食点心', count: 0,
        dishes: [
          { id: 401, name: '扬州炒饭', price: 22, image: 'https://dummyimage.com/200x200/f0e68c/ffffff.png&text=Rice' },
          { id: 402, name: '手工水饺', price: 18, image: 'https://dummyimage.com/200x200/ffffff/333333.png&text=Dumplings' }
        ]
      },
      {
        id: 5, name: '饮品甜点', count: 0,
        dishes: [
          { id: 501, name: '可乐', price: 3, image: 'https://dummyimage.com/200x200/000000/ffffff.png&text=Cola' },
          { id: 502, name: '橙汁', price: 8, image: 'https://dummyimage.com/200x200/ffa500/ffffff.png&text=Juice' }
        ]
      }
    ]
  },

  onLoad() {
    // 读取登录页存入的用户信息
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })

    setTimeout(() => {
      this.calculateHeights()
    }, 800)
  },

  // --- 滚动联动逻辑 ---
  calculateHeights() {
    let heightArr = []
    let h = 0
    const query = wx.createSelectorQuery()
    query.selectAll('.category-block').boundingClientRect((rects) => {
      if(!rects.length) return
      rects.forEach((rect) => {
        h += rect.height
        heightArr.push(h)
      })
      this.setData({ heightArr })
    }).exec()
  },

  switchCategory(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentCategory: index,
      toView: `category-${index}`,
      isTap: true
    })
  },

  onRightScroll(e) {
    if (this.data.isTap) {
      clearTimeout(this.tapTimer)
      this.tapTimer = setTimeout(() => { this.setData({ isTap: false }) }, 500)
      return
    }
    const scrollTop = e.detail.scrollTop
    const { heightArr } = this.data
    for (let i = 0; i < heightArr.length; i++) {
      let h0 = i === 0 ? 0 : heightArr[i - 1]
      let h1 = heightArr[i]
      if (scrollTop >= h0 - 50 && scrollTop < h1 - 50) {
        if (this.data.currentCategory !== i) {
          this.setData({ currentCategory: i })
        }
        return 
      }
    }
  },

  // 购物车加减逻辑 (修改版)
  updateCart(e) {
    const { type, id, catIndex } = e.currentTarget.dataset
    const cart = this.data.cart
    let count = cart[id] || 0
    
    if (type === 'add') count++
    else if (type === 'minus' && count > 0) count--
    
    cart[id] = count

    // 更新对应分类的角标
    const categoryList = this.data.categoryList
    // 为了防止 catIndex 在弹窗中传过来是 undefined (弹窗里很难传 index)，我们重新查找一下
    let targetCatIndex = catIndex
    if (targetCatIndex === undefined) {
        targetCatIndex = categoryList.findIndex(cat => cat.dishes.some(d => d.id == id))
    }
    
    if (targetCatIndex !== -1) {
        let catCount = 0
        categoryList[targetCatIndex].dishes.forEach(d => catCount += (cart[d.id] || 0))
        categoryList[targetCatIndex].count = catCount
    }

    this.setData({ cart, categoryList })
    this.calculateTotal()
    
    // 【新增】每次变动都重新生成购物车详情列表，保持数据一致
    this.generateCartList()
    
    // 如果减到0了，自动关闭详情页
    if (this.data.totalCount === 0) {
        this.setData({ showCartDetail: false })
    }
  },

  // 【新增】生成购物车详情数据
  generateCartList() {
    const list = []
    const cart = this.data.cart
    const categoryList = this.data.categoryList
    
    categoryList.forEach((cat, catIdx) => {
        cat.dishes.forEach(dish => {
            if (cart[dish.id] > 0) {
                list.push({
                    ...dish,
                    count: cart[dish.id],
                    catIndex: catIdx // 记录所属分类索引，方便 updateCart 使用
                })
            }
        })
    })
    this.setData({ cartList: list })
  },

  // 计算总价
  calculateTotal() {
    let count = 0, price = 0
    const allDishes = this.data.categoryList.flatMap(c => c.dishes)
    for (let id in this.data.cart) {
      const num = this.data.cart[id]
      if (num > 0) {
        const dish = allDishes.find(d => d.id == id)
        if (dish) {
          count += num
          price += dish.price * num
        }
      }
    }
    this.setData({ totalCount: count, totalPrice: price.toFixed(2) })
  },

  // 【新增】切换购物车详情显示
  toggleCartDetail() {
    if (this.data.totalCount === 0) return // 没东西点不开
    this.setData({
      showCartDetail: !this.data.showCartDetail
    })
  },

  // 【新增】清空购物车
  clearCart() {
    wx.showModal({
        title: '提示',
        content: '确定清空购物车吗？',
        success: (res) => {
            if (res.confirm) {
                this.setData({
                    cart: {},
                    totalCount: 0,
                    totalPrice: 0,
                    cartList: [],
                    showCartDetail: false
                })
                // 同时要清空左侧分类的角标
                const categoryList = this.data.categoryList.map(cat => ({ ...cat, count: 0 }))
                this.setData({ categoryList })
            }
        }
    })
  },

  // --- 用户菜单逻辑 (新功能) ---
  toggleUserMenu() {
    this.setData({ showUserMenu: !this.data.showUserMenu })
  },

  preventBubble() {
    // 阻止点击弹窗内部时关闭弹窗
  },

  handleMenuAction(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ showUserMenu: false }) // 点击后关闭弹窗

    // 这里是可以完善的功能入口
    switch(type) {
      case 'address':
        wx.navigateTo({
          url: '/pages/modify/modify'
        })
        
        break
      case 'feedback':
        wx.navigateTo({
          url: '/pages/feedback/feedback'
        })
        break
      case 'donate':
        wx.showToast({ title: '感谢您的打赏', icon: 'none' })
        break
      case 'order':
        wx.navigateTo({
          url: '/pages/order/order'
        })
        break
    }
  },

  goToOrder() {
    if (this.data.totalCount === 0) {
      wx.showToast({ title: '请先选择菜品', icon: 'none' })
      return
    }
    
    // 1. 准备要传给结算页的数据
    const cartList = [] // 定义变量名为 cartList
    const cart = this.data.cart
    const categoryList = this.data.categoryList
    
    categoryList.forEach(cat => {
      cat.dishes.forEach(dish => {
        if (cart[dish.id] > 0) {
          // ❌ 之前写错了 list.push
          // ✅ 这里改为 cartList.push
          cartList.push({
            id: dish.id,
            name: dish.name,
            price: dish.price,
            image: dish.image,
            count: cart[dish.id]
          })
        }
      })
    })

    // 2. 将选好的菜品存入本地存储
    wx.setStorageSync('checkedDishes', cartList) // 这里用 cartList
    wx.setStorageSync('orderTotalPrice', this.data.totalPrice)
    wx.setStorageSync('orderTotalCount', this.data.totalCount)

    // 3. 跳转到结算页
    wx.navigateTo({
      url: '/pages/settlement/settlement',
      fail: (err) => {
        console.error('跳转失败，请检查 pages/order/settlement 目录是否存在', err)
        wx.showToast({ title: '跳转失败', icon: 'none' })
      }
    })
  }

})
