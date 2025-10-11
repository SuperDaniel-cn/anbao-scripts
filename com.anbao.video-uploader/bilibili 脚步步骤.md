上传文件用这个 input
<input accept=".mp4,.flv,.avi,.wmv,.mov,.webm,.mpeg4,.ts,.mpg,.rm,.rmvb,.mkv,.m4v,.vob,.swf,.3gp,.mts,.m2v,.m2ts,.f4v,.m2t,.3g2,.asf" multiple="multiple" type="file" style="display: none;">
等待页面出现这个
getByText('上传完成').nth(1)
指定封面可以用这个
getByText('更换封面')
输入标题用这个
getByText('更换封面')
类型用这个
getByText('自制').first() getByText('转载').first()
分区用这个
locator('.select-controller').first()
getByTitle('知识')
可选分区有：影视、娱乐、音乐、舞蹈、动画、绘画、鬼畜、游戏、资讯、知识、人工智能、科技数码、汽车、时尚美妆、家装房产、户外潮流、健身、体育运动、手工、美食、小剧场、旅游出行、三农、动物、亲子、健康、情感、vlog、生活兴趣、生活经验
输入标签首先定位这个
getByRole('textbox', { name: '按回车键Enter创建标签' })
通过这个判断页面目前有几个标签，总数为 10 个
getByText('还可以添加7个标签')
然后模拟物理按键 backspace 删除多余标签
接着模拟文本输入
然后模拟物理按键回车键
继续通过getByText('还可以添加7个标签')判断添加的标签是否成功
激活简介输入框
await page1.locator('.ql-editor').first().click();
定时发布开关
locator('.switch-container').first()
这个class选择日期date-picker-date
<div data-v-f4ddae68="" class="date-picker-date"><p data-v-f4ddae68="" class="date-show">2025-10-11</p><i data-v-f4ddae68="" class="date-show-icon bcc-iconfont bcc-icon-ic_drop-down"></i></div>
这个 class 选择时间 time-picker-time
<div data-v-f4ddae68="" class="date-picker-timer"><p data-v-f4ddae68="" class="date-show">12:13</p><i data-v-f4ddae68="" class="date-show-icon bcc-iconfont bcc-icon-ic_drop-down dropped"></i></div>
意图选择在这个页面行不通，直接改元素吧
可以存草稿
getByText('存草稿')
可以立即投稿
getByText('立即投稿')

以上需要用户输入的内容，全部做到 schema 里读取用户参数。