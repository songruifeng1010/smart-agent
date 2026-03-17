const https = require('https');
const { getRandomResponse, detectEmotion, respondToEmotion, handleCalculation, handleUnitConversion, handleWeatherQuery, handleNewsQuery, handleDateCalculation, generateChatResponse, getFallbackResponse, extractLearningKeyword, calculateMatchScore } = require('./utils.js');

class SmartAgent {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'your_openai_api_key_here';
    this.name = config.name || 'SmartAgent';
    this.version = config.version || '1.0.0';
    this.logLevel = config.logLevel || 'info';
    
    // 优化缓存管理
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 默认1小时
    this.cacheSizeLimit = 1000; // 缓存大小限制
    this.cacheAccessCount = new Map(); // 记录缓存访问次数
    
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    
    this.userName = null;
    this.lastTopic = null;
    
    // 对话模式
    this.chatMode = 'default'; // default, friendly, professional, casual
    this.chatModes = {
      default: {
        name: '默认模式',
        prefix: '',
        suffix: ''
      },
      friendly: {
        name: '友好模式',
        prefix: '😊 ',
        suffix: ' 希望能帮到你！'
      },
      professional: {
        name: '专业模式',
        prefix: '',
        suffix: ''
      },
      casual: {
        name: ' casual模式',
        prefix: '嘿！',
        suffix: ' 咋样？'
      }
    };
    
    // 自学习功能
    this.learningEnabled = true;
  }
  
  log(level, ...args) {
    if (['debug', 'info', 'error'].indexOf(level) >= ['debug', 'info', 'error'].indexOf(this.logLevel)) {
      console.log(`[${level.toUpperCase()}]`, ...args);
    }
  }



  getKnowledgeResponse(cleanPrompt) {
    // 检测对话模式切换
    if (cleanPrompt.includes('切换到') && (cleanPrompt.includes('模式') || cleanPrompt.includes('mode'))) {
      if (cleanPrompt.includes('友好')) {
        return { response: this.setChatMode('friendly'), skipCache: false };
      } else if (cleanPrompt.includes('专业')) {
        return { response: this.setChatMode('professional'), skipCache: false };
      } else if (cleanPrompt.includes('casual')) {
        return { response: this.setChatMode('casual'), skipCache: false };
      } else if (cleanPrompt.includes('默认')) {
        return { response: this.setChatMode('default'), skipCache: false };
      }
    }
    
    // 检测自学习指令
    if (this.learningEnabled && (cleanPrompt.includes('记住') || cleanPrompt.includes('学习') || cleanPrompt.includes('添加知识') || cleanPrompt.includes('应该知道'))) {
      const learnResult = this.learnFromUser(cleanPrompt);
      if (learnResult) {
        return { response: learnResult, skipCache: false };
      }
    }
    
    // 首先检查动态学习的知识库
    if (this.knowledge) {
      // 优化匹配算法：计算匹配度，选择最相关的结果
      let bestMatch = null;
      let highestScore = 0;
      
      for (const [cat, data] of Object.entries(this.knowledge)) {
        // 确保data和data.keywords存在
        if (data && data.keywords) {
          const score = calculateMatchScore(cleanPrompt, data.keywords);
          
          if (score > highestScore) {
            highestScore = score;
            bestMatch = data;
          }
        }
      }
      
      if (bestMatch) {
        const response = getRandomResponse(bestMatch.responses);
        return { response, skipCache: false };
      }
    }
    
    // 基础知识库
    const baseKnowledge = {
      greetings: {
        keywords: ['你好', '您好', 'hi', 'hello', '早上好', '下午好', '晚上好', '嗨'],
        responses: [
          '你好呀！很高兴见到你 😊 有什么我可以帮你的吗？',
          '嗨！今天过得怎么样？',
          '你好！我是SmartAgent，随时为你服务～',
          this.userName ? `${this.userName}你好！今天想聊点什么？` : '你好！想聊点什么吗？'
        ]
      },
      selfIntro: {
        keywords: ['你是谁', '介绍一下你自己', '你叫什么', 'what is your name'],
        responses: [
          `我是${this.name}，一个智能对话助手。我可以陪你聊天、帮你计算、转换单位，还能回答一些问题！`,
          `我叫${this.name}，是你的AI小伙伴！我能做很多事情呢，要不要试试看？`
        ]
      },
      capabilities: {
        keywords: ['你能做什么', '功能', '能力', 'help', '帮助', '你会什么'],
        responses: [
          '我可以做很多事情哦：\n• 陪你聊天\n• 简单的数学计算\n• 单位转换\n• 讲笑话\n• 回答一些常见问题\n想试试哪个？',
          '我的能力包括：聊天、计算、单位转换、讲笑话...你想让我做什么呢？'
        ]
      },
      thanks: {
        keywords: ['谢谢', '感谢', 'thanks', 'thank you', '多谢', '3q'],
        responses: [
          '不客气！能帮到你我很开心 😊',
          '不用谢～随时为你服务！',
          '太客气啦！还有其他需要吗？'
        ]
      },
      goodbye: {
        keywords: ['再见', '拜拜', 'bye', 'goodbye', '回见', '下次见'],
        responses: [
          '再见！期待下次聊天～ 👋',
          '拜拜！照顾好自己哦！',
          '下次见！祝你有美好的一天！'
        ]
      },
      time: {
        keywords: ['几点', '现在时间', '时间是多少', 'what time'],
        responses: [
          () => { const now = new Date(); return `现在是 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} 哦～`; }
        ]
      },
      date: {
        keywords: ['今天几号', '今天星期几', 'what date', '今天是'],
        responses: [
          () => { 
            const now = new Date(); 
            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            return `今天是 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日，${days[now.getDay()]}`; 
          }
        ]
      },
      jokes: {
        keywords: ['笑话', 'joke', '讲个笑话', '逗我笑', '讲笑话'],
        responses: [
          '好的，给你讲个笑话：程序员的女朋友问："你能给我写首诗吗？" 程序员回答："01001000 01100101 01101100 01101100 01101111"（这是二进制的Hello）',
          '程序员最讨厌的三件事：1. 数数；2. 数组下标从0开始；3. 数数；4. 数组下标从1开始',
          '问：为什么程序员总是分不清万圣节和圣诞节？答：因为 Oct 31 = Dec 25（八进制31等于十进制25）',
          '生活就像编程，充满了bug，但我们可以不断调试优化！💪'
        ],
        skipCache: true
      },
      aiKnowledge: {
        keywords: ['人工智能', 'ai', 'AI', '什么是人工智能'],
        responses: [
          '人工智能（AI）是计算机科学的重要分支，旨在创建能模拟人类智能的系统。现在AI已经应用在很多领域啦，比如语音识别、自动驾驶等等！',
          '人工智能是研究如何让计算机去做过去只有人类才能做的事情。它包括机器学习、深度学习、自然语言处理、计算机视觉等多个子领域。',
          'AI正在改变我们的世界！从智能手机上的语音助手，到电商网站的个性化推荐，从医疗诊断到自动驾驶，AI的应用越来越广泛。'
        ]
      },
      chatMode: {
        keywords: ['对话模式', '切换模式', '友好模式', '专业模式', 'casual模式', '默认模式'],
        responses: [
          '我支持多种对话模式：默认模式、友好模式、专业模式、casual模式。你可以说"切换到友好模式"来改变我的对话风格！',
          '想切换对话模式吗？试试说"切换到专业模式"或"切换到casual模式"！',
          '当前对话模式：{{chatMode}}。你可以随时切换其他模式哦！'
        ]
      },
      earth: {
        keywords: ['地球', '地球是圆的', '地球是什么', '地球形状'],
        responses: [
          '地球是我们赖以生存的家园！它是一个两极稍扁、赤道略鼓的不规则球体。地球的直径约12742公里，表面积约5.1亿平方公里，其中71%是海洋，29%是陆地。',
          '地球是太阳系八大行星之一，按离太阳由近及远的次序排为第三颗。它是我们人类的家园，已经存在了约45亿年！',
          '地球是圆的！更准确地说，是一个扁球体。从太空中看，地球呈现出美丽的蓝色，因为大部分表面被海洋覆盖。'
        ]
      },
      blackhole: {
        keywords: ['黑洞', '什么是黑洞', 'black hole'],
        responses: [
          '黑洞是宇宙中一种极其神秘的天体！它的引力强大到连光都无法逃脱，所以我们无法直接看到它。黑洞是由大质量恒星死亡后坍缩形成的。',
          '黑洞是时空的一个区域，其引力如此强大，以至于任何东西——甚至光——都无法从它里面逃逸出来。黑洞的边界称为"事件视界"。',
          '黑洞听起来很可怕，但其实它们是宇宙演化的重要组成部分。我们的银河系中心就有一个超大质量黑洞，质量相当于太阳的400万倍！'
        ]
      },
      universe: {
        keywords: ['宇宙', '什么是宇宙', '宇宙有多大', 'universe'],
        responses: [
          '宇宙是一切时间、空间、物质和能量的总和！它包含了数十亿个星系，每个星系又包含数十亿颗恒星。宇宙的年龄大约是138亿年。',
          '宇宙真的非常浩瀚！可观测宇宙的直径约930亿光年，但这可能只是整个宇宙的一小部分。宇宙还在不断膨胀中呢！',
          '宇宙是万物的总称。从最小的原子到最大的星系团，都包含在宇宙中。关于宇宙的起源，最广为接受的理论是"大爆炸理论"。'
        ]
      },
      sun: {
        keywords: ['太阳', '什么是太阳', 'sun', '恒星'],
        responses: [
          '太阳是我们太阳系的中心恒星！它是一颗黄矮星，直径约139万公里，是地球直径的109倍。太阳的质量占整个太阳系的99.86%！',
          '太阳是地球上生命的能量来源！它通过核聚变反应将氢转化为氦，释放出巨大的能量。阳光到达地球大约需要8分钟。',
          '太阳已经存在了约46亿年，正值中年。它还会继续稳定燃烧约50亿年，然后变成一颗红巨星，最后成为白矮星。'
        ]
      },
      moon: {
        keywords: ['月亮', '月球', '什么是月亮', 'moon'],
        responses: [
          '月球是地球唯一的天然卫星！它的直径约3474公里，是地球直径的1/4多一点。月球距离地球约38万公里，是离我们最近的天体。',
          '月球上没有空气和水，昼夜温差极大！白天可以达到127°C，夜晚则降至-173°C。月球的引力只有地球的1/6。',
          '月球总是以同一面朝向地球，因为它的自转周期和公转周期相同。1969年，人类首次登上月球，阿姆斯特朗成为第一个踏上月球的人。'
        ]
      },
      water: {
        keywords: ['水', '什么是水', 'water', 'H2O'],
        responses: [
          '水是生命之源！它的化学式是H₂O，由两个氢原子和一个氧原子组成。水在常温常压下是无色无味的液体，在0°C结冰，100°C沸腾。',
          '地球表面约71%被水覆盖，但其中97.5%是海水，淡水只占2.5%。而在淡水中，又有大部分冻结在冰川和冰盖中。',
          '水是一种非常神奇的物质！它的固态（冰）密度比液态小，所以冰会浮在水面上。这对水生生物来说非常重要，因为冰层可以保温。'
        ]
      },
      air: {
        keywords: ['空气', '什么是空气', 'air', '大气'],
        responses: [
          '空气是地球大气层中的气体混合物！主要成分是氮气（约78%）和氧气（约21%），还有少量的二氧化碳、稀有气体和水蒸气。',
          '空气对我们至关重要！我们呼吸的氧气就来自空气。空气还能吸收有害的紫外线，保持地球表面温暖，这就是温室效应。',
          '大气层厚度约1000公里，但大部分空气都集中在距离地面10公里以内的对流层。天气现象主要发生在这一层。'
        ]
      },
      tree: {
        keywords: ['树', '什么是树', '树木', 'tree', '植物'],
        responses: [
          '树是地球上最重要的生物之一！它们通过光合作用吸收二氧化碳，释放氧气，为我们提供清新的空气。树木还能提供木材、水果、药材等资源。',
          '一棵树可以活很久！世界上最古老的树有5000多岁了。树木通过年轮记录它们的生长历史，每一圈代表一年。',
          '森林被称为"地球之肺"。一棵成年树每天可以吸收约22公斤二氧化碳，释放约16公斤氧气。植树造林对保护环境非常重要！'
        ]
      },
      animal: {
        keywords: ['动物', '什么是动物', 'animal', '生物'],
        responses: [
          '动物是生物界的一大类！目前已知的动物种类超过150万种，分布在地球的各个角落。动物不能自己制造食物，需要以其他生物为食。',
          '动物界非常丰富多彩！从微小的草履虫到巨大的蓝鲸，从天空的飞鸟到深海的鱼类，动物们以各种方式适应着环境。',
          '人类也是动物的一种，属于哺乳动物、灵长目。我们应该尊重和保护所有动物，因为每一个物种都在生态系统中扮演着重要角色。'
        ]
      },
      human: {
        keywords: ['人类', '什么是人类', 'human', '人'],
        responses: [
          '人类是地球上最智慧的物种！我们的学名是智人（Homo sapiens），大约在20万年前出现在非洲。人类拥有复杂的语言、抽象思维和创造能力。',
          '人类的身体非常神奇！我们的大脑有约860亿个神经元，心脏每天跳动约10万次，全身的血管连起来可以绕地球两圈半。',
          '人类创造了灿烂的文明！从古老的金字塔到现代的互联网，从文字的发明到太空探索，人类不断地探索和创新，改变着世界。'
        ]
      },
      timeConcept: {
        keywords: ['时间', '什么是时间', 'time', '时光'],
        responses: [
          '时间是一个既熟悉又神秘的概念！我们用它来衡量事件的先后顺序和持续时长。时间是一维的，总是从过去流向未来，不可逆转。',
          '在物理学中，时间是时空的一个维度。根据爱因斯坦的相对论，时间的流逝速度会受到引力和运动速度的影响。这就是著名的"时间膨胀"效应。',
          '时间对我们每个人来说都是宝贵的财富！正如古人所说："一寸光阴一寸金，寸金难买寸光阴。"珍惜时间，让生命更有意义！'
        ]
      },
      life: {
        keywords: ['生命', '什么是生命', 'life', '人生'],
        responses: [
          '生命是宇宙中最神奇的现象！关于生命的定义，科学家们还在争论，但一般认为生命需要具备这些特征：由细胞组成、能繁殖、能生长、能新陈代谢、能适应环境等。',
          '地球上的生命至少有35亿年的历史了！从最早的单细胞生物到今天丰富多彩的生命世界，生命经历了漫长的进化过程。',
          '生命的意义是一个永恒的哲学问题。每个人都可以有自己的答案。或许，生命的意义就在于体验、成长、爱与被爱，以及为这个世界带来一些美好。'
        ]
      },
      love: {
        keywords: ['爱', '什么是爱', 'love', '爱情'],
        responses: [
          '爱是人类最美好的情感之一！它有很多种形式：亲情之爱、友情之爱、爱情之爱、对生活的热爱、对世界的大爱。爱让我们的生命更有意义。',
          '爱情是一种强烈的情感体验，它让人感到幸福、甜蜜，有时也会让人受伤。但无论如何，爱都是值得追求的，因为它让我们成长。',
          '爱不仅是一种感觉，更是一种行动。真正的爱包含着理解、尊重、包容、责任和付出。爱是需要学习和经营的。'
        ]
      },
      dream: {
        keywords: ['梦想', '什么是梦想', 'dream', '理想'],
        responses: [
          '梦想是人生的航标！它是我们内心深处的渴望，是我们想要实现的目标。有梦想的人生是充实的，因为我们知道自己要往哪里去。',
          '实现梦想需要勇气、坚持和努力。正如马云所说："梦想还是要有的，万一实现了呢？"即使梦想没有完全实现，追求梦想的过程本身也会让我们成长。',
          '梦想不分大小。它可以是成为一名科学家，也可以是拥有一个温馨的家；它可以是环游世界，也可以是做好每一件小事。重要的是，它让你的生命有了方向。'
        ]
      },
      happiness: {
        keywords: ['幸福', '什么是幸福', 'happiness', '快乐'],
        responses: [
          '幸福是一种内心的感受！它不一定取决于外在的物质条件，更多地取决于我们的心态和看待事物的方式。幸福可以很简单，可能是家人的陪伴、朋友的问候，或是一顿美食。',
          '心理学家研究发现，幸福有三个主要来源：人际关系、做有意义的事，以及成长和进步。财富对幸福的影响是有限的，超过一定水平后，更多的钱并不能带来更多的幸福。',
          '幸福是一种能力，是可以学习和培养的。感恩、活在当下、帮助他人、保持健康的生活方式，这些都能帮助我们感受到更多的幸福。'
        ]
      },
      success: {
        keywords: ['成功', '什么是成功', 'success', '成就'],
        responses: [
          '成功的定义因人而异！对有些人来说，成功可能是名利双收；对另一些人来说，成功可能是家庭幸福、身体健康，或是做自己喜欢的事。重要的是找到自己内心真正认同的成功标准。',
          '成功没有捷径，但有一些共同的要素：明确的目标、持续的努力、从失败中学习的能力，以及一点点运气。爱迪生发明电灯失败了1000多次，但他说："我没有失败，我只是发现了1000种不能成功的方法。"',
          '成功不是终点，而是一个旅程。比成功更重要的是成长。即使没有达到目标，只要我们在过程中变得更好、更强大，那就是一种成功。'
        ]
      },
      python: {
        keywords: ['python', 'Python', '什么是python', 'python介绍'],
        responses: [
          'Python是一门超棒的编程语言！它语法简洁，特别适合初学者，而且在数据科学、Web开发等领域都用得很多～',
          'Python由荷兰程序员Guido van Rossum在1991年创造。它的设计哲学强调代码的可读性，用"优雅"、"明确"、"简单"来形容它最合适不过了。',
          'Python的生态系统非常丰富！有Numpy、Pandas用于数据分析，TensorFlow、PyTorch用于机器学习，Django、Flask用于Web开发，应有尽有。'
        ]
      },
      javascript: {
        keywords: ['javascript', 'JavaScript', 'JS', 'js', '什么是javascript'],
        responses: [
          'JavaScript是Web开发的核心语言！网页上的交互效果大多都是用它做的，现在还能用来做后端和移动端开发呢！',
          'JavaScript诞生于1995年，最初只是为了给网页添加一些简单的交互。但现在它已经发展成了一门全栈语言，几乎无所不能！',
          'JS有庞大的生态系统！前端有React、Vue、Angular三大框架，后端有Node.js，还有npm这个世界上最大的软件包仓库。'
        ]
      },
      programming: {
        keywords: ['学习编程', '怎么学编程', '编程入门', '如何开始编程'],
        responses: [
          '学习编程的话，我推荐从Python开始！先学基础语法，然后多写小项目练习，慢慢就上手啦～',
          '学习编程最重要的是实践！不要只看书或看视频，一定要动手写代码。从简单的"Hello World"开始，然后逐步做一些小项目。',
          '编程学习路径建议：1. 选一门语言（推荐Python）；2. 学习基础语法；3. 做小项目；4. 学习数据结构和算法；5. 参与开源项目。'
        ]
      },
      weather: {
        keywords: ['天气', 'temperature', '气温', '今天天气'],
        responses: [
          '抱歉呀，我没法实时看天气～你可以用天气APP查查，比如天气网、墨迹天气都可以！',
          '我没办法直接获取实时天气数据，但你可以查看天气预报APP或者天气网站来了解最新天气情况。'
        ]
      },
      chatgpt: {
        keywords: ['chatgpt', 'ChatGPT', 'gpt', 'GPT', 'openai'],
        responses: [
          'ChatGPT是OpenAI开发的AI模型，很厉害的！我现在是模拟模式，如果有真实API密钥，就能体验真正的AI能力啦！',
          'ChatGPT是GPT（Generative Pre-trained Transformer）系列模型的产品。它能够理解和生成人类语言，可以进行对话、回答问题、写文章等。'
        ]
      },
      deepseek: {
        keywords: ['deepseek', 'DeepSeek', '深度求索'],
        responses: [
          'DeepSeek是中国的AI公司，专注于大语言模型～我这个项目就是受它启发做的！',
          'DeepSeek（深度求索）是一家成立于2023年的中国人工智能公司，专注于大语言模型的研发和应用。'
        ]
      },
      vscode: {
        keywords: ['vscode', 'VSCode', '编辑器', '代码编辑器'],
        responses: [
          'VS Code超好用的！微软出的免费编辑器，插件很多，写代码必备！',
          'VS Code（Visual Studio Code）是微软开发的免费开源代码编辑器。它轻量、强大，支持几乎所有编程语言，拥有丰富的插件生态。'
        ]
      },
      math: {
        keywords: ['数学', 'math', '数学题', '计算'],
        responses: [
          '数学题呀！直接把算式发给我吧，比如 "123 + 456"，我来帮你算！',
          '数学是一门基础学科，被称为"科学的皇后"。它是我们理解世界的重要工具，从日常生活到尖端科技都离不开数学。'
        ]
      },
      unitConversion: {
        keywords: ['单位转换', '换算', '转换单位'],
        responses: [
          '我支持这些单位转换哦：长度（厘米↔米、公里↔英里）、重量（克↔千克）、温度（摄氏度↔华氏度），想转换什么？',
          '单位转换在生活中很常用！不同国家和地区使用不同的单位，所以需要转换。我可以帮你进行常见的单位转换。'
        ]
      },
      computer: {
        keywords: ['电脑', '计算机', '什么是电脑', 'computer'],
        responses: [
          '计算机是20世纪最伟大的发明之一！它由硬件和软件组成，能够按照程序自动、高速地处理海量数据。',
          '第一台电子计算机ENIAC诞生于1946年，重达27吨。而现在我们手中的智能手机，计算能力已经远超当年的巨型计算机了！',
          '计算机主要由CPU、内存、硬盘、输入输出设备等组成。它使用二进制（0和1）来存储和处理所有信息。'
        ]
      },
      internet: {
        keywords: ['互联网', '什么是互联网', 'internet', '网络'],
        responses: [
          '互联网是一个连接全球数十亿台计算机的巨大网络！它让信息的获取和交流变得前所未有的便捷，彻底改变了我们的生活方式。',
          '互联网始于20世纪60年代美国国防部的ARPANET项目。经过几十年的发展，它已经成为人类社会最重要的基础设施之一。',
          'WWW（万维网）和互联网是两个不同的概念！互联网是基础设施，而WWW是运行在互联网上的应用，只是互联网众多用途中的一种。'
        ]
      },
      robot: {
        keywords: ['机器人', '什么是机器人', 'robot', '机械'],
        responses: [
          '机器人是能够自动执行任务的机器！它们可以由计算机控制，也可以由人直接控制。机器人广泛应用于制造业、医疗、服务业、探索等领域。',
          '工业机器人已经在工厂中使用了几十年，它们不知疲倦地重复着精确的工作。而现在，服务机器人、家用机器人也越来越多地走进我们的生活。',
          '机器人学是一门交叉学科，结合了机械工程、电子工程、计算机科学、人工智能等多个领域的知识。'
        ]
      },
      space: {
        keywords: ['太空', '宇宙探索', '航天', 'space'],
        responses: [
          '太空探索是人类最伟大的冒险之一！从1957年第一颗人造卫星发射，到1969年人类登月，再到今天的火星探测，我们一直在探索宇宙的奥秘。',
          '太空是极其恶劣的环境：高真空、极端温度、强烈的辐射。但人类还是克服了重重困难，走向了星辰大海。',
          '国际空间站是人类在太空中的"家"！宇航员在那里进行科学实验，长期驻留，为未来的深空探索做准备。'
        ]
      },
      food: {
        keywords: ['食物', '什么是食物', 'food', '美食'],
        responses: [
          '食物是维持生命的能量来源！我们通过食物获取蛋白质、碳水化合物、脂肪、维生素、矿物质等营养素。健康的饮食习惯对身体非常重要。',
          '中国有博大精深的饮食文化！八大菜系各有特色，从川菜的麻辣到粤菜的清淡，从面食到米饭，每一种都有独特的风味。',
          '食物不仅是生存的需要，也是文化的载体、情感的寄托。一道家常菜，可能承载着家乡的味道、童年的记忆、家人的爱。'
        ]
      },
      music: {
        keywords: ['音乐', '什么是音乐', 'music', '歌曲'],
        responses: [
          '音乐是人类灵魂的语言！它用声音和节奏来表达情感，不分国界、不分种族，能够直接触动人心。音乐是人类最古老的艺术形式之一。',
          '音乐有很多类型：古典、摇滚、流行、爵士、民谣、电子、说唱等等。每个人都可以找到自己喜欢的音乐类型。',
          '听音乐对身心健康有很多好处！它可以缓解压力、改善情绪、促进睡眠、增强记忆力。让音乐成为生活的一部分吧！'
        ]
      },
      book: {
        keywords: ['书', '书籍', '什么是书', 'book', '阅读'],
        responses: [
          '书籍是人类进步的阶梯！通过读书，我们可以跨越时空，与伟大的心灵对话，学习前人的智慧，体验不同的人生。',
          '读书可以开阔视野、增长见识、提升思维能力。正如古人所说："读万卷书，行万里路。"书籍是最便宜的奢侈品。',
          '选择一本好书，就像交了一个好朋友。不同的书有不同的收获：小说让我们体验人生，历史让我们知兴替，哲学让我们思考生命，科学让我们理解世界。'
        ]
      },
      sport: {
        keywords: ['运动', '体育', '什么是运动', 'sport', '锻炼'],
        responses: [
          '生命在于运动！适当的体育锻炼可以增强体质、预防疾病、改善心情、提高免疫力。每周进行3-5次、每次30分钟以上的中等强度运动，对健康非常有益。',
          '运动有很多种形式：跑步、游泳、健身、瑜伽、球类运动等等。选择自己喜欢的运动，更容易坚持下去。',
          '运动不仅是身体的锻炼，也是意志的磨练。在运动中，我们学会坚持、学会挑战自我、学会面对失败。这些品质在生活中同样重要。'
        ]
      },
      sleep: {
        keywords: ['睡觉', '睡眠', '什么是睡眠', 'sleep', '休息'],
        responses: [
          '睡眠是生命必需的生理过程！我们一生中约有三分之一的时间在睡眠中度过。睡眠时，身体在修复、大脑在整理记忆，良好的睡眠对身心健康至关重要。',
          '成年人每天需要7-9小时的睡眠。长期睡眠不足会导致免疫力下降、记忆力减退、情绪不稳定、肥胖等问题。',
          '好的睡眠习惯包括：保持规律的作息、创造舒适的睡眠环境、睡前避免使用电子产品、避免咖啡和酒精等。'
        ]
      },
      health: {
        keywords: ['健康', '什么是健康', 'health', '养生'],
        responses: [
          '健康是人生最宝贵的财富！世界卫生组织对健康的定义是："健康不仅是没有疾病或虚弱，而且是身体、心理和社会适应的完好状态。"',
          '健康的四大基石是：合理饮食、适量运动、戒烟限酒、心理平衡。这四点看起来简单，但真正做到并不容易。',
          '投资健康，是最有价值的投资。从年轻时就养成健康的生活习惯，才能在年老时享受高品质的生活。'
        ]
      },
      friendship: {
        keywords: ['朋友', '友谊', '什么是朋友', 'friend', '友情'],
        responses: [
          '朋友是我们自己选择的家人！真正的友谊建立在信任、理解、支持和真诚的基础上。朋友会在我们快乐时分享喜悦，在我们困难时伸出援手。',
          '人生得一知己足矣。真正的朋友不需要天天见面，不需要刻意维系，但在需要的时候，他们一定会在。',
          '友谊也需要经营。保持联系、互相尊重、懂得感恩、在朋友需要时陪伴左右，这些都能让友谊更长久。'
        ]
      },
      family: {
        keywords: ['家庭', '家人', '什么是家庭', 'family', '亲情'],
        responses: [
          '家庭是我们人生的第一所学校，也是最温暖的港湾。家人之间的爱是无私的、不求回报的。无论我们走多远，家永远是我们的归宿。',
          '家庭对每个人的影响都是深远的。我们的性格、价值观、行为习惯，都在家庭中形成。一个幸福的家庭，是我们一生的财富。',
          '家不是讲理的地方，而是讲爱的地方。家人之间难免有摩擦，但多一些理解、多一些包容、多一些沟通，家庭就会更和睦。'
        ]
      }
    };

    // 优化基础知识库匹配算法：计算匹配度，选择最相关的结果
    let bestBaseMatch = null;
    let highestBaseScore = 0;
    
    for (const [cat, data] of Object.entries(baseKnowledge)) {
      const score = calculateMatchScore(cleanPrompt, data.keywords);
      
      if (score > highestBaseScore) {
        highestBaseScore = score;
        bestBaseMatch = { cat, data };
      }
    }
    
    if (bestBaseMatch) {
      let response;
      if (typeof bestBaseMatch.data.responses[0] === 'function') {
        response = bestBaseMatch.data.responses[0]();
      } else {
        response = getRandomResponse(bestBaseMatch.data.responses);
      }
      // 替换占位符
      if (response.includes('{{chatMode}}')) {
        response = response.replace('{{chatMode}}', this.getChatMode());
      }
      return { response, skipCache: bestBaseMatch.data.skipCache || false };
    }
    
    return null;
  }

  getFallbackResponse() {
    return getFallbackResponse();
  }

  addToHistory(userMessage, botResponse) {
    this.conversationHistory.push({ user: userMessage, bot: botResponse });
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  setChatMode(mode) {
    if (this.chatModes[mode]) {
      this.chatMode = mode;
      return `已切换到${this.chatModes[mode].name}！`;
    } else {
      return `不支持的对话模式。支持的模式：${Object.keys(this.chatModes).join('、')}`;
    }
  }

  getChatMode() {
    return this.chatModes[this.chatMode].name;
  }

  applyChatMode(response) {
    const mode = this.chatModes[this.chatMode];
    return mode.prefix + response + mode.suffix;
  }
  
  learnFromUser(prompt) {
    // 解析用户输入，提取知识点和回答
    // 格式示例: "记住，苹果是红色的"
    // 格式示例: "学习，地球是圆的"
    
    const cleanPrompt = prompt.toLowerCase();
    let keyword = '';
    let answer = '';
    
    // 提取关键字和回答
    if (cleanPrompt.includes('记住') || cleanPrompt.includes('学习') || cleanPrompt.includes('添加知识') || cleanPrompt.includes('应该知道')) {
      // 移除学习指令词
      let content = prompt.replace(/记住|学习|添加知识|应该知道/gi, '').trim();
      
      // 移除开头的标点符号
      content = content.replace(/^[，,]/, '').trim();
      
      // 提取关键字
      keyword = extractLearningKeyword(content);
      
      answer = content;
    }
    
    if (keyword && answer) {
      // 检查知识库中是否已有该类别
      const categoryKey = keyword.toLowerCase();
      
      // 动态添加到知识库
      if (!this.knowledge) {
        this.knowledge = {};
      }
      
      // 确保keywords是数组
      if (!this.knowledge[categoryKey]) {
        this.knowledge[categoryKey] = {
          keywords: [keyword],
          responses: [answer]
        };
      } else {
        // 如果已有该类别，添加新的回答
        if (!this.knowledge[categoryKey].responses.includes(answer)) {
          this.knowledge[categoryKey].responses.push(answer);
        }
      }
      
      // 清除相关缓存，确保下次查询时使用新学习的知识
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.includes(keyword.toLowerCase())) {
          this.cache.delete(cacheKey);
        }
      }
      
      this.log('info', `学习成功: ${keyword} -> ${answer}`);
      return `好的，我已经记住了：${answer}`;
    }
    
    return null;
  }

  // 优化缓存管理：检查缓存大小并清理
  manageCache() {
    if (this.cache.size >= this.cacheSizeLimit) {
      // 找出访问次数最少的缓存项
      let leastAccessedKey = null;
      let leastAccessCount = Infinity;
      
      for (const [key, count] of this.cacheAccessCount.entries()) {
        if (count < leastAccessCount) {
          leastAccessCount = count;
          leastAccessedKey = key;
        }
      }
      
      // 删除访问次数最少的缓存项
      if (leastAccessedKey) {
        this.cache.delete(leastAccessedKey);
        this.cacheAccessCount.delete(leastAccessedKey);
        this.log('debug', `缓存清理: 删除访问次数最少的项: ${leastAccessedKey}`);
      }
    }
  }

  generateResponse(prompt) {
    return new Promise((resolve, reject) => {
      try {
        const cacheKey = prompt.trim().toLowerCase();
        if (this.cache.has(cacheKey)) {
          const cachedData = this.cache.get(cacheKey);
          if (Date.now() - cachedData.timestamp < this.cacheExpiry) {
            // 更新缓存访问次数
            const currentCount = this.cacheAccessCount.get(cacheKey) || 0;
            this.cacheAccessCount.set(cacheKey, currentCount + 1);
            this.log('info', `从缓存获取响应: ${cacheKey}`);
            resolve(cachedData.response);
            return;
          } else {
            // 删除过期缓存
            this.cache.delete(cacheKey);
            this.cacheAccessCount.delete(cacheKey);
            this.log('debug', `缓存过期: ${cacheKey}`);
          }
        }
        
        this.log('info', '正在调用OpenAI API...');
        this.log('debug', 'API密钥:', this.apiKey ? '已设置' : '未设置');
        
        if (this.apiKey === 'your_openai_api_key_here') {
          this.log('info', '使用模拟响应模式');
          const cleanPrompt = prompt.toLowerCase().trim();
          let mockResponse = '';
          let skipCache = false;
          
          const knowledgeResult = this.getKnowledgeResponse(cleanPrompt);
          if (knowledgeResult) {
            mockResponse = knowledgeResult.response;
            skipCache = knowledgeResult.skipCache;
          } else {
            const calcResult = handleCalculation(cleanPrompt);
            if (calcResult) {
              mockResponse = calcResult;
            } else {
              const unitResult = handleUnitConversion(cleanPrompt, prompt);
              if (unitResult) {
                mockResponse = unitResult;
              } else {
                const weatherResult = handleWeatherQuery(cleanPrompt);
                if (weatherResult) {
                  mockResponse = weatherResult;
                } else {
                  const newsResult = handleNewsQuery(cleanPrompt);
                  if (newsResult) {
                    mockResponse = newsResult;
                  } else {
                    const dateResult = handleDateCalculation(cleanPrompt);
                    if (dateResult) {
                      mockResponse = dateResult;
                    } else {
                      if (cleanPrompt.length < 15 || 
                          cleanPrompt.includes('嗯') || 
                          cleanPrompt.includes('哦') || 
                          cleanPrompt.includes('啊') ||
                          cleanPrompt.includes('哈')) {
                        mockResponse = generateChatResponse(prompt, cleanPrompt, this.userName);
                      } else {
                        mockResponse = this.getFallbackResponse();
                      }
                    }
                  }
                }
              }
            }
          }
          
          this.log('debug', '模拟响应:', mockResponse);
          
          if (!skipCache) {
            // 管理缓存大小
            this.manageCache();
            
            // 设置缓存，初始化访问次数
            this.cache.set(cacheKey, {
              response: mockResponse,
              timestamp: Date.now()
            });
            this.cacheAccessCount.set(cacheKey, 1);
            this.log('debug', `缓存设置: ${cacheKey}`);
          } else {
            this.log('debug', '跳过缓存');
          }
          
          const finalResponse = this.applyChatMode(mockResponse);
          this.addToHistory(prompt, finalResponse);
          resolve(finalResponse);
          return;
        }
        
        const postData = JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `你是${this.name}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        const options = {
          hostname: 'api.openai.com',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        this.log('debug', '正在发送请求到:', options.hostname + options.path);
        
        const req = https.request(options, (res) => {
          this.log('info', 'API响应状态:', res.statusCode);
          
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const responseData = JSON.parse(data);
              if (res.statusCode !== 200) {
                this.log('error', 'API错误:', responseData);
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                const response = responseData.choices[0].message.content;
                this.cache.set(cacheKey, {
                  response: response,
                  timestamp: Date.now()
                });
                const finalResponse = this.applyChatMode(response);
                this.addToHistory(prompt, finalResponse);
                resolve(finalResponse);
              }
            } catch (parseError) {
              this.log('error', '解析响应失败:', parseError);
              resolve('抱歉，我在处理您的请求时遇到了问题。');
            }
          });
        });

        req.on('error', (error) => {
          this.log('error', '请求错误:', error.message);
          resolve('抱歉，我在处理您的请求时遇到了问题。');
        });

        req.on('timeout', () => {
          this.log('error', '请求超时');
          req.destroy();
          resolve('抱歉，请求超时，请稍后再试。');
        });

        req.setTimeout(30000);
        req.write(postData);
        req.end();
      } catch (error) {
        this.log('error', 'Error generating response:', error.message);
        resolve('抱歉，我在处理您的请求时遇到了问题。');
      }
    });
  }

  async processMessage(message) {
    this.log('info', `[${this.name}] 收到消息: ${message}`);
    const response = await this.generateResponse(message);
    this.log('info', `[${this.name}] 回复: ${response}`);
    return response;
  }
}

module.exports = SmartAgent;
