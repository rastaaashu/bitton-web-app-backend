import type { LangCode } from "@/contexts/LanguageContext";

const translations: Record<string, Record<LangCode, string>> = {
  // ─── Nav / Sidebar ───
  "nav.dashboard": {
    en: "Dashboard", "zh-CN": "仪表板", "zh-TW": "儀表板", es: "Panel", fr: "Tableau de bord",
    de: "Dashboard", ru: "Панель", ko: "대시보드", ja: "ダッシュボード", ar: "لوحة القيادة", pt: "Painel", hi: "डैशबोर्ड",
  },
  "nav.staking": {
    en: "Staking", "zh-CN": "质押", "zh-TW": "質押", es: "Staking", fr: "Staking",
    de: "Staking", ru: "Стейкинг", ko: "스테이킹", ja: "ステーキング", ar: "التخزين", pt: "Staking", hi: "स्टेकिंग",
  },
  "nav.vault": {
    en: "Vault", "zh-CN": "金库", "zh-TW": "金庫", es: "Bóveda", fr: "Coffre",
    de: "Tresor", ru: "Хранилище", ko: "볼트", ja: "ボールト", ar: "الخزنة", pt: "Cofre", hi: "वॉल्ट",
  },
  "nav.rewards": {
    en: "Rewards", "zh-CN": "奖励", "zh-TW": "獎勵", es: "Recompensas", fr: "Récompenses",
    de: "Belohnungen", ru: "Награды", ko: "보상", ja: "リワード", ar: "المكافآت", pt: "Recompensas", hi: "पुरस्कार",
  },
  "nav.vesting": {
    en: "Vesting", "zh-CN": "归属", "zh-TW": "歸屬", es: "Vesting", fr: "Vesting",
    de: "Vesting", ru: "Вестинг", ko: "베스팅", ja: "ベスティング", ar: "الاستحقاق", pt: "Vesting", hi: "वेस्टिंग",
  },
  "nav.withdraw": {
    en: "Withdraw", "zh-CN": "提现", "zh-TW": "提現", es: "Retirar", fr: "Retirer",
    de: "Abheben", ru: "Вывод", ko: "출금", ja: "出金", ar: "سحب", pt: "Sacar", hi: "निकासी",
  },
  "nav.referrals": {
    en: "Referrals", "zh-CN": "推荐", "zh-TW": "推薦", es: "Referidos", fr: "Parrainages",
    de: "Empfehlungen", ru: "Рефералы", ko: "추천", ja: "紹介", ar: "الإحالات", pt: "Indicações", hi: "रेफरल",
  },
  "nav.history": {
    en: "History", "zh-CN": "历史", "zh-TW": "歷史", es: "Historial", fr: "Historique",
    de: "Verlauf", ru: "История", ko: "기록", ja: "履歴", ar: "السجل", pt: "Histórico", hi: "इतिहास",
  },
  "nav.settings": {
    en: "Settings", "zh-CN": "设置", "zh-TW": "設置", es: "Configuración", fr: "Paramètres",
    de: "Einstellungen", ru: "Настройки", ko: "설정", ja: "設定", ar: "الإعدادات", pt: "Configurações", hi: "सेटिंग्स",
  },
  "nav.admin": {
    en: "Admin", "zh-CN": "管理", "zh-TW": "管理", es: "Admin", fr: "Admin",
    de: "Admin", ru: "Админ", ko: "관리자", ja: "管理", ar: "الإدارة", pt: "Admin", hi: "एडमिन",
  },

  // ─── Auth ───
  "auth.welcome": {
    en: "Welcome to BitTON.AI", "zh-CN": "欢迎来到 BitTON.AI", "zh-TW": "歡迎來到 BitTON.AI",
    es: "Bienvenido a BitTON.AI", fr: "Bienvenue sur BitTON.AI", de: "Willkommen bei BitTON.AI",
    ru: "Добро пожаловать в BitTON.AI", ko: "BitTON.AI에 오신 것을 환영합니다", ja: "BitTON.AIへようこそ",
    ar: "مرحباً بك في BitTON.AI", pt: "Bem-vindo ao BitTON.AI", hi: "BitTON.AI में आपका स्वागत है",
  },
  "auth.signIn": {
    en: "Sign in to your account", "zh-CN": "登录您的账户", "zh-TW": "登入您的帳戶",
    es: "Inicia sesión en tu cuenta", fr: "Connectez-vous à votre compte", de: "Melden Sie sich an",
    ru: "Войдите в свой аккаунт", ko: "계정에 로그인하세요", ja: "アカウントにサインイン",
    ar: "تسجيل الدخول إلى حسابك", pt: "Entre na sua conta", hi: "अपने खाते में साइन इन करें",
  },
  "auth.createAccount": {
    en: "Create Account", "zh-CN": "创建账户", "zh-TW": "建立帳戶",
    es: "Crear cuenta", fr: "Créer un compte", de: "Konto erstellen",
    ru: "Создать аккаунт", ko: "계정 만들기", ja: "アカウント作成",
    ar: "إنشاء حساب", pt: "Criar conta", hi: "खाता बनाएं",
  },
  "auth.register": {
    en: "Register to start using BitTON.AI", "zh-CN": "注册开始使用 BitTON.AI", "zh-TW": "註冊開始使用 BitTON.AI",
    es: "Regístrate para empezar", fr: "Inscrivez-vous pour commencer", de: "Registrieren Sie sich",
    ru: "Зарегистрируйтесь", ko: "BitTON.AI 사용을 시작하세요", ja: "BitTON.AIの利用を開始",
    ar: "سجل لبدء استخدام BitTON.AI", pt: "Registre-se para começar", hi: "उपयोग शुरू करने के लिए रजिस्टर करें",
  },
  "auth.logout": {
    en: "Logout", "zh-CN": "退出", "zh-TW": "登出", es: "Cerrar sesión", fr: "Déconnexion",
    de: "Abmelden", ru: "Выход", ko: "로그아웃", ja: "ログアウト", ar: "تسجيل الخروج", pt: "Sair", hi: "लॉगआउट",
  },
  "auth.login": {
    en: "Login", "zh-CN": "登录", "zh-TW": "登入", es: "Iniciar sesión", fr: "Connexion",
    de: "Anmelden", ru: "Войти", ko: "로그인", ja: "ログイン", ar: "تسجيل الدخول", pt: "Entrar", hi: "लॉगिन",
  },
  "auth.evmWallet": {
    en: "EVM Wallet", "zh-CN": "EVM 钱包", "zh-TW": "EVM 錢包", es: "Billetera EVM", fr: "Portefeuille EVM",
    de: "EVM-Wallet", ru: "EVM Кошелёк", ko: "EVM 지갑", ja: "EVMウォレット", ar: "محفظة EVM", pt: "Carteira EVM", hi: "EVM वॉलेट",
  },
  "auth.email": {
    en: "Email", "zh-CN": "电子邮件", "zh-TW": "電子郵件", es: "Correo", fr: "E-mail",
    de: "E-Mail", ru: "Почта", ko: "이메일", ja: "メール", ar: "البريد الإلكتروني", pt: "E-mail", hi: "ईमेल",
  },
  "auth.telegram": {
    en: "Telegram", "zh-CN": "Telegram", "zh-TW": "Telegram", es: "Telegram", fr: "Telegram",
    de: "Telegram", ru: "Telegram", ko: "텔레그램", ja: "テレグラム", ar: "تيليجرام", pt: "Telegram", hi: "टेलीग्राम",
  },
  "auth.connectWallet": {
    en: "Connect Wallet", "zh-CN": "连接钱包", "zh-TW": "連接錢包", es: "Conectar billetera", fr: "Connecter portefeuille",
    de: "Wallet verbinden", ru: "Подключить кошелёк", ko: "지갑 연결", ja: "ウォレット接続",
    ar: "توصيل المحفظة", pt: "Conectar carteira", hi: "वॉलेट कनेक्ट करें",
  },
  "auth.noAccount": {
    en: "Don't have an account?", "zh-CN": "没有账户？", "zh-TW": "沒有帳戶？",
    es: "¿No tienes cuenta?", fr: "Pas de compte ?", de: "Kein Konto?",
    ru: "Нет аккаунта?", ko: "계정이 없으신가요?", ja: "アカウントをお持ちでない方",
    ar: "ليس لديك حساب؟", pt: "Não tem conta?", hi: "खाता नहीं है?",
  },
  "auth.haveAccount": {
    en: "Already have an account?", "zh-CN": "已有账户？", "zh-TW": "已有帳戶？",
    es: "¿Ya tienes cuenta?", fr: "Déjà un compte ?", de: "Bereits ein Konto?",
    ru: "Уже есть аккаунт?", ko: "이미 계정이 있으신가요?", ja: "アカウントをお持ちの方",
    ar: "لديك حساب بالفعل؟", pt: "Já tem conta?", hi: "पहले से खाता है?",
  },

  // ─── Dashboard ───
  "dashboard.title": {
    en: "Dashboard", "zh-CN": "仪表板", "zh-TW": "儀表板", es: "Panel", fr: "Tableau de bord",
    de: "Dashboard", ru: "Панель", ko: "대시보드", ja: "ダッシュボード", ar: "لوحة القيادة", pt: "Painel", hi: "डैशबोर्ड",
  },
  "dashboard.walletBalance": {
    en: "Wallet Balance", "zh-CN": "钱包余额", "zh-TW": "錢包餘額", es: "Saldo", fr: "Solde",
    de: "Guthaben", ru: "Баланс", ko: "지갑 잔액", ja: "ウォレット残高", ar: "رصيد المحفظة", pt: "Saldo", hi: "वॉलेट बैलेंस",
  },
  "dashboard.totalStaked": {
    en: "Total Staked", "zh-CN": "总质押", "zh-TW": "總質押", es: "Total en staking", fr: "Total staké",
    de: "Gesamt gestaked", ru: "Всего стейк", ko: "총 스테이킹", ja: "ステーキング合計", ar: "إجمالي التخزين", pt: "Total em staking", hi: "कुल स्टेक",
  },
  "dashboard.vestingLocked": {
    en: "Vesting Locked", "zh-CN": "归属锁定", "zh-TW": "歸屬鎖定", es: "Bloqueado", fr: "Verrouillé",
    de: "Gesperrt", ru: "Заблокировано", ko: "베스팅 잠금", ja: "ロック中", ar: "مقفل", pt: "Bloqueado", hi: "लॉक्ड",
  },
  "dashboard.withdrawable": {
    en: "Withdrawable", "zh-CN": "可提现", "zh-TW": "可提現", es: "Retirable", fr: "Retirable",
    de: "Abhebbar", ru: "Доступно", ko: "출금 가능", ja: "出金可能", ar: "قابل للسحب", pt: "Disponível", hi: "निकासी योग्य",
  },
  "dashboard.pendingRewards": {
    en: "Pending Rewards", "zh-CN": "待领奖励", "zh-TW": "待領獎勵", es: "Recompensas pendientes", fr: "Récompenses en attente",
    de: "Ausstehende Belohnungen", ru: "Ожидающие награды", ko: "대기 보상", ja: "保留リワード",
    ar: "مكافآت معلقة", pt: "Recompensas pendentes", hi: "लंबित पुरस्कार",
  },
  "dashboard.vaultTier": {
    en: "Vault Tier", "zh-CN": "金库等级", "zh-TW": "金庫等級", es: "Nivel de bóveda", fr: "Niveau coffre",
    de: "Tresor-Stufe", ru: "Уровень хранилища", ko: "볼트 등급", ja: "ボールトティア",
    ar: "مستوى الخزنة", pt: "Nível do cofre", hi: "वॉल्ट टियर",
  },
  "dashboard.activeStakes": {
    en: "Active Stakes", "zh-CN": "活跃质押", "zh-TW": "活躍質押", es: "Stakes activos", fr: "Stakes actifs",
    de: "Aktive Stakes", ru: "Активные стейки", ko: "활성 스테이킹", ja: "アクティブステーク",
    ar: "التخزينات النشطة", pt: "Stakes ativos", hi: "सक्रिय स्टेक",
  },

  // ─── Common ───
  "common.connectWalletPrompt": {
    en: "Connect your wallet to access your dashboard, stake BTN tokens, and earn rewards.",
    "zh-CN": "连接钱包访问仪表板、质押 BTN 代币并赚取奖励。",
    "zh-TW": "連接錢包以訪問儀表板、質押 BTN 代幣並賺取獎勵。",
    es: "Conecta tu billetera para acceder al panel, hacer staking y ganar recompensas.",
    fr: "Connectez votre portefeuille pour accéder au tableau de bord et gagner des récompenses.",
    de: "Verbinden Sie Ihre Wallet, um auf das Dashboard zuzugreifen und Belohnungen zu verdienen.",
    ru: "Подключите кошелёк для доступа к панели и получения наград.",
    ko: "지갑을 연결하여 대시보드에 접근하고 보상을 받으세요.",
    ja: "ウォレットを接続してダッシュボードにアクセスし、報酬を獲得しましょう。",
    ar: "قم بتوصيل محفظتك للوصول إلى لوحة القيادة وكسب المكافآت.",
    pt: "Conecte sua carteira para acessar o painel e ganhar recompensas.",
    hi: "डैशबोर्ड एक्सेस करने और पुरस्कार अर्जित करने के लिए वॉलेट कनेक्ट करें।",
  },
  // ─── Risk Disclaimer ───
  "auth.riskDisclaimer": {
    en: "Risk Disclaimer:",
    "zh-CN": "风险声明：", "zh-TW": "風險聲明：", es: "Advertencia de riesgo:", fr: "Avertissement de risque :",
    de: "Risikohinweis:", ru: "Предупреждение о рисках:", ko: "위험 고지:",
    ja: "リスク免責事項：", ar: "إخلاء المسؤولية عن المخاطر:", pt: "Aviso de risco:", hi: "जोखिम अस्वीकरण:",
  },
  "auth.riskText": {
    en: "Digital assets and blockchain-based products involve significant risk and may result in the loss of all invested funds. Past performance does not guarantee future results. BitTON.AI does not provide financial, investment, or legal advice. Users are solely responsible for their decisions and should carefully evaluate all risks before participating.",
    "zh-CN": "数字资产和基于区块链的产品涉及重大风险，可能导致所有投资资金损失。过去的表现不保证未来的结果。BitTON.AI 不提供财务、投资或法律建议。用户对其决定承担全部责任，应在参与之前仔细评估所有风险。",
    "zh-TW": "數位資產和基於區塊鏈的產品涉及重大風險，可能導致所有投資資金損失。過去的表現不保證未來的結果。BitTON.AI 不提供財務、投資或法律建議。使用者對其決定承擔全部責任，應在參與之前仔細評估所有風險。",
    es: "Los activos digitales y los productos basados en blockchain implican un riesgo significativo y pueden resultar en la pérdida total de los fondos invertidos. El rendimiento pasado no garantiza resultados futuros. BitTON.AI no proporciona asesoramiento financiero, de inversión ni legal.",
    fr: "Les actifs numériques et les produits basés sur la blockchain comportent des risques importants et peuvent entraîner la perte de tous les fonds investis. Les performances passées ne garantissent pas les résultats futurs. BitTON.AI ne fournit pas de conseils financiers, d'investissement ou juridiques.",
    de: "Digitale Vermögenswerte und Blockchain-Produkte bergen erhebliche Risiken und können zum Verlust aller investierten Mittel führen. Vergangene Ergebnisse garantieren keine zukünftigen Erträge. BitTON.AI bietet keine Finanz-, Anlage- oder Rechtsberatung.",
    ru: "Цифровые активы и продукты на основе блокчейна сопряжены со значительными рисками и могут привести к потере всех вложенных средств. Прошлые результаты не гарантируют будущих. BitTON.AI не предоставляет финансовых, инвестиционных или юридических консультаций.",
    ko: "디지털 자산과 블록체인 기반 상품은 상당한 위험을 수반하며 투자 자금 전액 손실로 이어질 수 있습니다. 과거 성과가 미래 결과를 보장하지 않습니다. BitTON.AI는 재무, 투자 또는 법률 자문을 제공하지 않습니다.",
    ja: "デジタル資産およびブロックチェーンベースの製品には重大なリスクが伴い、投資資金の全額を失う可能性があります。過去の実績は将来の結果を保証するものではありません。BitTON.AIは金融、投資、法的助言を提供しません。",
    ar: "الأصول الرقمية والمنتجات القائمة على البلوكتشين تنطوي على مخاطر كبيرة وقد تؤدي إلى خسارة جميع الأموال المستثمرة. الأداء السابق لا يضمن النتائج المستقبلية. لا يقدم BitTON.AI استشارات مالية أو استثمارية أو قانونية.",
    pt: "Ativos digitais e produtos baseados em blockchain envolvem riscos significativos e podem resultar na perda total dos fundos investidos. Desempenho passado não garante resultados futuros. O BitTON.AI não fornece aconselhamento financeiro, de investimento ou jurídico.",
    hi: "डिजिटल संपत्ति और ब्लॉकचेन-आधारित उत्पादों में महत्वपूर्ण जोखिम शामिल हैं और इससे सभी निवेशित धनराशि का नुकसान हो सकता है। पिछला प्रदर्शन भविष्य के परिणामों की गारंटी नहीं देता। BitTON.AI वित्तीय, निवेश या कानूनी सलाह प्रदान नहीं करता है।",
  },

  // ─── Auth Extra ───
  "auth.signRegister": {
    en: "Sign & Register", "zh-CN": "签名并注册", "zh-TW": "簽名並註冊", es: "Firmar y registrar", fr: "Signer et s'inscrire",
    de: "Signieren & Registrieren", ru: "Подписать и зарегистрироваться", ko: "서명 및 등록", ja: "署名して登録",
    ar: "التوقيع والتسجيل", pt: "Assinar e registrar", hi: "साइन और रजिस्टर",
  },
  "auth.connectWalletCreate": {
    en: "Connect your EVM wallet to create an account.", "zh-CN": "连接您的 EVM 钱包以创建账户。", "zh-TW": "連接您的 EVM 錢包以建立帳戶。",
    es: "Conecta tu billetera EVM para crear una cuenta.", fr: "Connectez votre portefeuille EVM pour créer un compte.",
    de: "Verbinden Sie Ihre EVM-Wallet, um ein Konto zu erstellen.", ru: "Подключите EVM-кошелёк для создания аккаунта.",
    ko: "EVM 지갑을 연결하여 계정을 만드세요.", ja: "EVMウォレットを接続してアカウントを作成してください。",
    ar: "قم بتوصيل محفظة EVM الخاصة بك لإنشاء حساب.", pt: "Conecte sua carteira EVM para criar uma conta.", hi: "खाता बनाने के लिए अपना EVM वॉलेट कनेक्ट करें।",
  },
  "auth.referralCode": {
    en: "Referral Code", "zh-CN": "推荐码", "zh-TW": "推薦碼", es: "Código de referido", fr: "Code de parrainage",
    de: "Empfehlungscode", ru: "Реферальный код", ko: "추천 코드", ja: "紹介コード",
    ar: "رمز الإحالة", pt: "Código de indicação", hi: "रेफरल कोड",
  },
  "auth.enterReferral": {
    en: "Enter referral code or wallet address", "zh-CN": "输入推荐码或钱包地址", "zh-TW": "輸入推薦碼或錢包地址",
    es: "Ingresa código de referido o dirección", fr: "Entrez le code de parrainage ou l'adresse",
    de: "Empfehlungscode oder Wallet-Adresse eingeben", ru: "Введите реферальный код или адрес кошелька",
    ko: "추천 코드 또는 지갑 주소 입력", ja: "紹介コードまたはウォレットアドレスを入力",
    ar: "أدخل رمز الإحالة أو عنوان المحفظة", pt: "Digite o código de indicação ou endereço", hi: "रेफरल कोड या वॉलेट पता दर्ज करें",
  },
  "auth.sendCode": {
    en: "Send Code", "zh-CN": "发送验证码", "zh-TW": "發送驗證碼", es: "Enviar código", fr: "Envoyer le code",
    de: "Code senden", ru: "Отправить код", ko: "코드 전송", ja: "コードを送信",
    ar: "إرسال الرمز", pt: "Enviar código", hi: "कोड भेजें",
  },
  "auth.verifyLogin": {
    en: "Verify & Login", "zh-CN": "验证并登录", "zh-TW": "驗證並登入", es: "Verificar e iniciar sesión", fr: "Vérifier et se connecter",
    de: "Verifizieren & Anmelden", ru: "Подтвердить и войти", ko: "확인 및 로그인", ja: "確認してログイン",
    ar: "التحقق وتسجيل الدخول", pt: "Verificar e entrar", hi: "सत्यापित करें और लॉगिन करें",
  },
  "auth.resendCode": {
    en: "Resend code", "zh-CN": "重新发送", "zh-TW": "重新發送", es: "Reenviar código", fr: "Renvoyer le code",
    de: "Code erneut senden", ru: "Отправить повторно", ko: "코드 재전송", ja: "コードを再送信",
    ar: "إعادة إرسال الرمز", pt: "Reenviar código", hi: "कोड पुनः भेजें",
  },
  "auth.telegramLogin": {
    en: "Log in with your Telegram account.", "zh-CN": "使用 Telegram 账户登录。", "zh-TW": "使用 Telegram 帳戶登入。",
    es: "Inicia sesión con tu cuenta de Telegram.", fr: "Connectez-vous avec votre compte Telegram.",
    de: "Mit Ihrem Telegram-Konto anmelden.", ru: "Войдите через Telegram.",
    ko: "텔레그램 계정으로 로그인하세요.", ja: "Telegramアカウントでログインしてください。",
    ar: "تسجيل الدخول بحساب تيليجرام.", pt: "Entre com sua conta do Telegram.", hi: "अपने टेलीग्राम खाते से लॉगिन करें।",
  },

  // ─── Staking ───
  "staking.title": {
    en: "Staking", "zh-CN": "质押", "zh-TW": "質押", es: "Staking", fr: "Staking",
    de: "Staking", ru: "Стейкинг", ko: "스테이킹", ja: "ステーキング", ar: "التخزين", pt: "Staking", hi: "स्टेकिंग",
  },
  "staking.newStake": {
    en: "New Stake", "zh-CN": "新质押", "zh-TW": "新質押", es: "Nuevo stake", fr: "Nouveau stake",
    de: "Neuer Stake", ru: "Новый стейк", ko: "새 스테이킹", ja: "新規ステーク",
    ar: "تخزين جديد", pt: "Novo stake", hi: "नया स्टेक",
  },
  "staking.yourStakes": {
    en: "Your Stakes", "zh-CN": "您的质押", "zh-TW": "您的質押", es: "Tus stakes", fr: "Vos stakes",
    de: "Ihre Stakes", ru: "Ваши стейки", ko: "내 스테이킹", ja: "あなたのステーク",
    ar: "تخزيناتك", pt: "Seus stakes", hi: "आपके स्टेक",
  },
  "staking.productDetails": {
    en: "Product Details", "zh-CN": "产品详情", "zh-TW": "產品詳情", es: "Detalles del producto", fr: "Détails du produit",
    de: "Produktdetails", ru: "Детали продукта", ko: "상품 상세", ja: "商品詳細",
    ar: "تفاصيل المنتج", pt: "Detalhes do produto", hi: "उत्पाद विवरण",
  },

  // ─── Vault ───
  "vault.notActivated": {
    en: "Vault Not Activated", "zh-CN": "金库未激活", "zh-TW": "金庫未激活", es: "Bóveda no activada", fr: "Coffre non activé",
    de: "Tresor nicht aktiviert", ru: "Хранилище не активировано", ko: "볼트 미활성화", ja: "ボールト未有効化",
    ar: "الخزنة غير مفعلة", pt: "Cofre não ativado", hi: "वॉल्ट सक्रिय नहीं",
  },
  "vault.activateNow": {
    en: "Activate Now", "zh-CN": "立即激活", "zh-TW": "立即啟用", es: "Activar ahora", fr: "Activer maintenant",
    de: "Jetzt aktivieren", ru: "Активировать", ko: "지금 활성화", ja: "今すぐ有効化",
    ar: "تفعيل الآن", pt: "Ativar agora", hi: "अभी सक्रिय करें",
  },
  "vault.activateDescription": {
    en: "Activate your vault to start earning staking rewards and bonuses.",
    "zh-CN": "激活金库以开始赚取质押奖励和奖金。", "zh-TW": "啟用金庫以開始賺取質押獎勵和獎金。",
    es: "Activa tu bóveda para empezar a ganar recompensas.", fr: "Activez votre coffre pour commencer à gagner des récompenses.",
    de: "Aktivieren Sie Ihren Tresor, um Belohnungen zu verdienen.", ru: "Активируйте хранилище, чтобы начать получать награды.",
    ko: "볼트를 활성화하여 스테이킹 보상을 받으세요.", ja: "ボールトを有効化してステーキング報酬を獲得しましょう。",
    ar: "قم بتفعيل خزنتك لبدء كسب المكافآت.", pt: "Ative seu cofre para começar a ganhar recompensas.", hi: "पुरस्कार प्राप्त करने के लिए अपना वॉल्ट सक्रिय करें।",
  },

  // ─── Network ───
  "network.wrong": {
    en: "Wrong network detected. Please switch to Base Sepolia.",
    "zh-CN": "检测到错误网络。请切换到 Base Sepolia。", "zh-TW": "偵測到錯誤網路。請切換到 Base Sepolia。",
    es: "Red incorrecta detectada. Cambia a Base Sepolia.", fr: "Mauvais réseau détecté. Veuillez passer à Base Sepolia.",
    de: "Falsches Netzwerk erkannt. Bitte zu Base Sepolia wechseln.", ru: "Обнаружена неверная сеть. Переключитесь на Base Sepolia.",
    ko: "잘못된 네트워크가 감지되었습니다. Base Sepolia로 전환하세요.", ja: "間違ったネットワークが検出されました。Base Sepoliaに切り替えてください。",
    ar: "تم اكتشاف شبكة خاطئة. يرجى التبديل إلى Base Sepolia.", pt: "Rede incorreta detectada. Mude para Base Sepolia.", hi: "गलत नेटवर्क पाया गया। कृपया Base Sepolia पर स्विच करें।",
  },
  "network.switch": {
    en: "Switch Network", "zh-CN": "切换网络", "zh-TW": "切換網路", es: "Cambiar red", fr: "Changer de réseau",
    de: "Netzwerk wechseln", ru: "Сменить сеть", ko: "네트워크 전환", ja: "ネットワーク切替",
    ar: "تبديل الشبكة", pt: "Trocar rede", hi: "नेटवर्क बदलें",
  },

  // ─── Rewards / Vesting / Withdraw ───
  "rewards.title": {
    en: "Rewards & Settlement", "zh-CN": "奖励与结算", "zh-TW": "獎勵與結算", es: "Recompensas y liquidación", fr: "Récompenses et règlement",
    de: "Belohnungen & Abrechnung", ru: "Награды и расчёт", ko: "보상 및 정산", ja: "リワード＆決済",
    ar: "المكافآت والتسوية", pt: "Recompensas e liquidação", hi: "पुरस्कार और निपटान",
  },
  "vesting.title": {
    en: "Vesting Pool", "zh-CN": "归属池", "zh-TW": "歸屬池", es: "Pool de vesting", fr: "Pool de vesting",
    de: "Vesting-Pool", ru: "Вестинг-пул", ko: "베스팅 풀", ja: "ベスティングプール",
    ar: "مجمع الاستحقاق", pt: "Pool de vesting", hi: "वेस्टिंग पूल",
  },
  "withdraw.title": {
    en: "Withdrawal Wallet", "zh-CN": "提现钱包", "zh-TW": "提現錢包", es: "Billetera de retiro", fr: "Portefeuille de retrait",
    de: "Auszahlungs-Wallet", ru: "Кошелёк для вывода", ko: "출금 지갑", ja: "出金ウォレット",
    ar: "محفظة السحب", pt: "Carteira de saque", hi: "निकासी वॉलेट",
  },
  "referrals.title": {
    en: "Referrals & Bonuses", "zh-CN": "推荐与奖金", "zh-TW": "推薦與獎金", es: "Referidos y bonos", fr: "Parrainages et bonus",
    de: "Empfehlungen & Boni", ru: "Рефералы и бонусы", ko: "추천 및 보너스", ja: "紹介＆ボーナス",
    ar: "الإحالات والمكافآت", pt: "Indicações e bônus", hi: "रेफरल और बोनस",
  },
};

export function t(key: string, lang: LangCode): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}
