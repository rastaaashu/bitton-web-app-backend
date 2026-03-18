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
};

export function t(key: string, lang: LangCode): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}
