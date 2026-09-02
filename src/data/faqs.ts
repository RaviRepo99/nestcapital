export interface FAQItem {
  id: string;
  category: 'getting_started' | 'investments' | 'deposits' | 'withdrawals' | 'referrals' | 'security';
  question: string;
  answer: string;
}

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'getting_started',
    question: 'How do I create an account on CapitalNest Nepal?',
    answer: 'Signing up takes under 60 seconds. Click "Create Account", provide your full legal name, verified email address, and Nepali phone number (+977). Once registered, you will receive instant access to your secure investor dashboard and personalized wallet.',
  },
  {
    id: 'faq-2',
    category: 'investments',
    question: 'How do I make my first investment?',
    answer: '1. Deposit funds into your wallet using eSewa, Khalti, ConnectIPS, or direct Bank Transfer.\n2. Navigate to "Investment Plans" and select the plan matching your financial goals (from Starter NPR 5,000 to Platinum NPR 95,000).\n3. Enter your investment amount, review your estimated daily payout schedule, and click "Confirm Investment". Your investment will immediately activate and start generating returns.',
  },
  {
    id: 'faq-3',
    category: 'withdrawals',
    question: 'How and when can I withdraw my earnings?',
    answer: 'You can request a withdrawal at any time directly from the "Withdraw" section. Enter your desired payout amount (minimum NPR 500) and choose your preferred payout channel—either direct bank account transfer (Nabil, NIC Asia, Global IME, etc.) or digital wallet (eSewa, Khalti). Requests are processed swiftly by our accounts team after routine security verification.',
  },
  {
    id: 'faq-4',
    category: 'investments',
    question: 'What investment plans are available?',
    answer: 'CapitalNest Nepal offers six structured tiers tailored for varying investment horizons:\n• Starter: NPR 5,000+ (5% return, 7 days)\n• Growth: NPR 15,000+ (20% return, 30 days)\n• Premium: NPR 25,000+ (30% return, 45 days)\n• Elite: NPR 35,000+ (40% return, 60 days)\n• Diamond: NPR 50,000+ (60% return, 75 days)\n• Platinum: NPR 95,000+ (80% return, 90 days)\nAll plans credit your daily yield directly into your available balance.',
  },
  {
    id: 'faq-5',
    category: 'referrals',
    question: 'How does the Referral & Affiliate program work?',
    answer: 'Every registered investor receives a unique referral code and tracking link. When friends or colleagues join using your code and activate an investment plan, you earn an instant 5% to 10% referral commission directly credited to your wallet balance, eligible for immediate reinvestment or withdrawal.',
  },
  {
    id: 'faq-6',
    category: 'deposits',
    question: 'How are deposits verified and credited?',
    answer: 'When you submit a deposit request along with your bank transfer/eSewa transaction reference ID and optional receipt screenshot, our treasury department verifies the incoming transaction against our merchant accounts. Upon confirmation, your wallet is immediately credited, and you receive an instant notification.',
  },
  {
    id: 'faq-7',
    category: 'security',
    question: 'How safe is my personal and financial information?',
    answer: 'CapitalNest Nepal employs enterprise-grade 256-bit SSL encryption, isolated vault storage, and secure salted hashing for authentication. We never store raw passwords or unencrypted banking credentials. User funds are segregated in institutional reserve bank accounts.',
  },
  {
    id: 'faq-8',
    category: 'security',
    question: 'What is the mandatory risk disclaimer?',
    answer: 'Investment in financial and market instruments involves market risks. Past performance and configured plan return estimates do not constitute guaranteed financial advice. Investors are encouraged to review our full Terms & Conditions and invest responsibly according to their personal risk tolerance.',
  },
];
