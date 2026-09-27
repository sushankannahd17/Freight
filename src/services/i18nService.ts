export type Language = 'en' | 'hi';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    navDashboard: 'Dashboard',
    navPlanner: 'Voyage Planner',
    navForecast: 'Freight Forecast',
    navOptimizer: 'Vessel Optimizer',
    navPorts: 'Port & Infrastructure',
    navRisk: 'Risk Management',
    navData: 'Data Management',
    navReports: 'Reports',
    navSettings: 'Settings',

    // Header & Shell
    ministryMain: 'MINISTRY OF STEEL',
    ministrySub: 'Government of India',
    appSlogan: 'Smarter Decisions. Stronger Steel. A Stronger India.',
    heroTagline: 'सुरक्षित आपूर्ति, समृद्ध भारत',
    sihBadge: 'SIH 2026',
    prototypeBadge: 'Prototype Dataset (Illustrative)',
    indiaLabel: 'भारत',
    userRole: 'Analytics User, Ministry of Steel',

    // Sidebar Bottom Banner
    sidebarFooterTitle: 'Efficient Logistics',
    sidebarFooterTagline: '"Atmanirbhar Steel through Intelligent Supply Chains"',

    // Dashboard
    welcomeTitle: 'Welcome to FreightIQ',
    welcomeSubtitle: "Intelligent Freight Forecasting & Vessel Chartering for India's East Coast",
    kpiCostTitle: 'ESTIMATED PROCUREMENT COST',
    kpiCostSub: 'vs Spot Charter (Est. Savings)',
    kpiRateTitle: 'FORECAST FREIGHT RATE',
    kpiRateSub: '6-Month Forecast',
    kpiVesselTitle: 'RECOMMENDED VESSEL',
    kpiVesselSub: 'Suitable for East Coast Ports',
    kpiAlertsTitle: 'ACTIVE ALERTS',
    kpiAlertsSub: 'Action Required',

    // Sections
    chartTitle: 'Freight Rate Trend',
    chartSub: 'Historical vs projected freight rate',
    portsTitle: 'Key East Coast Ports',
    portsSub: 'Major Overseas Origins to East Coast India',
    quickActionsTitle: 'Quick Actions',
    recTableTitle: 'Recent Chartering Recommendations',
    alertsTitle: 'Market & Operational Alerts',

    // Quick Actions
    actPlanVoyage: 'Plan a New Voyage',
    actCompareVessels: 'Compare Vessel Classes',
    actViewPorts: 'View Port Constraints',
    actCheckOutlook: 'Check Market Outlook',
    actGenerateReport: 'Generate Report',

    // Table Headers
    colDate: 'Date',
    colRoute: 'Route',
    colCargo: 'Cargo',
    colQuantity: 'Quantity (MT)',
    colVessel: 'Recommended Vessel',
    colEstRate: 'Est. Rate',
    colTotalCost: 'Total Cost',
    colStatus: 'Status',
    viewAll: 'View All →',

    // Voyage Planner Step Workflow
    step1Title: '1. Cargo Details',
    step2Title: '2. Origin & Destination Ports',
    step3Title: '3. Charter Preferences',
    cargoTypeLabel: 'Cargo Type',
    cargoQtyLabel: 'Cargo Quantity (MT)',
    arrivalDateLabel: 'Required Arrival Date',
    originPortLabel: 'Overseas Origin Port',
    destPortLabel: 'Indian East Coast Discharge Port',
    contractStratLabel: 'Contract Strategy',
    prefVesselLabel: 'Preferred Vessel',

    // Options
    cokingCoalOpt: 'Coking / Thermal Coal',
    ironOreOpt: 'Iron Ore',
    otherBulkOpt: 'Other Bulk Cargo',
    spotOpt: 'Spot Market Charter',
    shortTermOpt: 'Short-Term (3-6 Months)',
    mediumTermOpt: 'Medium-Term (12 Mo COA)',
    anyVesselOpt: 'Any Feasible Class',

    // Common Actions
    planVoyageBtn: 'Plan a Voyage',
    generateRecBtn: 'Generate Chartering Recommendation',
    loadDemoBtn: 'Load Demo Scenario',
  },
  hi: {
    // Navigation
    navDashboard: 'डैशबोर्ड',
    navPlanner: 'यात्रा योजनाकार',
    navForecast: 'मालभाड़ा पूर्वानुमान',
    navOptimizer: 'पोत अनुकूलक',
    navPorts: 'पोर्ट और अवसंरचना',
    navRisk: 'जोखिम प्रबंधन',
    navData: 'डेटा प्रबंधन',
    navReports: 'रिपोर्ट',
    navSettings: 'सेटिंग्स',

    // Header & Shell
    ministryMain: 'इस्पात मंत्रालय',
    ministrySub: 'भारत सरकार',
    appSlogan: 'स्मार्ट निर्णय। मजबूत इस्पात। समृद्ध भारत।',
    heroTagline: 'सुरक्षित आपूर्ति, समृद्ध भारत',
    sihBadge: 'एसआईएच 2026',
    prototypeBadge: 'प्रारूप डेटासेट (चित्रण)',
    indiaLabel: 'भारत',
    userRole: 'विश्लेषण उपयोगकर्ता, इस्पात मंत्रालय',

    // Sidebar Bottom Banner
    sidebarFooterTitle: 'कुशल रसद आपूर्ति',
    sidebarFooterTagline: '"इंटेलिजेंट सप्लाई चैन के माध्यम से आत्मनिर्भर भारत"',

    // Dashboard
    welcomeTitle: 'FreightIQ में आपका स्वागत है',
    welcomeSubtitle: 'भारत के पूर्वी तट के लिए बुद्धिमान मालभाड़ा पूर्वानुमान और पोत चार्टरिंग',
    kpiCostTitle: 'अनुमानित खरीद लागत',
    kpiCostSub: 'स्पॉट की तुलना में (अनुमानित बचत)',
    kpiRateTitle: 'अनुमानित मालभाड़ा दर',
    kpiRateSub: '6-महीने का पूर्वानुमान',
    kpiVesselTitle: 'अनुशंसित पोत श्रेणी',
    kpiVesselSub: 'पूर्वी तट बंदरगाहों के लिए उपयुक्त',
    kpiAlertsTitle: 'सक्रिय चेतावनी',
    kpiAlertsSub: 'कार्रवाई आवश्यक',

    // Sections
    chartTitle: 'मालभाड़ा दर रुझान',
    chartSub: 'ऐतिहासिक बनाम अनुमानित मालभाड़ा दर',
    portsTitle: 'प्रमुख पूर्वी तट बंदरगाह',
    portsSub: 'विदेशी उत्पत्ति स्थल से पूर्वी तट भारत तक',
    quickActionsTitle: 'त्वरित कार्रवाई',
    recTableTitle: 'हाल की चार्टरिंग सिफारिशें',
    alertsTitle: 'बाजार और परिचालन चेतावनी',

    // Quick Actions
    actPlanVoyage: 'नई यात्रा की योजना बनाएं',
    actCompareVessels: 'पोत श्रेणियों की तुलना करें',
    actViewPorts: 'बंदरगाह सीमाओं को देखें',
    actCheckOutlook: 'बाजार दृष्टिकोण देखें',
    actGenerateReport: 'रिपोर्ट तैयार करें',

    // Table Headers
    colDate: 'दिनांक',
    colRoute: 'मार्ग',
    colCargo: 'कार्गो प्रकार',
    colQuantity: 'मात्रा (मीट्रिक टन)',
    colVessel: 'अनुशंसित पोत',
    colEstRate: 'अनुमानित दर',
    colTotalCost: 'कुल लागत',
    colStatus: 'स्थिति',
    viewAll: 'सभी देखें →',

    // Voyage Planner Step Workflow
    step1Title: '1. कार्गो विवरण',
    step2Title: '2. उत्पत्ति और गंतव्य बंदरगाह',
    step3Title: '3. चार्टर प्राथमिकताएं',
    cargoTypeLabel: 'कार्गो प्रकार',
    cargoQtyLabel: 'कार्गो मात्रा (मीट्रिक टन)',
    arrivalDateLabel: 'आवश्यक आगमन तिथि',
    originPortLabel: 'विदेशी उत्पत्ति बंदरगाह',
    destPortLabel: 'भारतीय पूर्वी तट डिस्चार्ज बंदरगाह',
    contractStratLabel: 'अनुबंध रणनीति',
    prefVesselLabel: 'प्राथमिकता पोत श्रेणी',

    // Options
    cokingCoalOpt: 'कोकिंग / थर्मल कोयला',
    ironOreOpt: 'लौह अयस्क',
    otherBulkOpt: 'अन्य थोक कार्गो',
    spotOpt: 'स्पॉट मार्केट चार्टर',
    shortTermOpt: 'अल्पकालिक (3-6 महीने)',
    mediumTermOpt: 'मध्यम अवधि (12 महीने COA)',
    anyVesselOpt: 'कोई भी उपयुक्त श्रेणी',

    // Common Actions
    planVoyageBtn: 'यात्रा की योजना बनाएं',
    generateRecBtn: 'चार्टरिंग सिफारिश उत्पन्न करें',
    loadDemoBtn: 'डेमो परिदृश्य लोड करें',
  },
};

export function t(key: string, lang: Language = 'en'): string {
  if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) {
    return TRANSLATIONS[lang][key];
  }
  return TRANSLATIONS['en'][key] || key;
}
