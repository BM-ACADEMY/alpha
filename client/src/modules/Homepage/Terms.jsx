import React from 'react';

export default function TermsAndConditions({
  companyName = 'Alpha R',
  lastUpdated = 'September 24, 2025'
}) {
  return (
    <main className=" px-6 py-6 text-gray-800">
      <header className="mb-4">
        <h1 className="text-2xl font-bold mb-1">Terms & Conditions</h1>
        <p className="text-sm text-gray-600">Last updated: {lastUpdated}</p>
      </header>

      <section className="space-y-4 text-sm text-gray-800">
        <h2 className="font-semibold">1. Account & KYC</h2>
        <ul className="list-disc pl-5">
          <li>Users must complete KYC verification (PAN, Aadhaar, Bank/Wallet details) before making any deposit or withdrawal.</li>
          <li>Each user is allowed only one account. Multiple or fake accounts will be terminated.</li>
          <li>Account details (Bank/UPI/Wallet) must match the user’s KYC details.</li>
        </ul>

        <h2 className="font-semibold">2. Deposits</h2>
        <p><strong>INR Deposits:</strong></p>
        <ul className="list-disc pl-5">
          <li>Method: Bank Transfer / UPI only.</li>
          <li>Upload: Payment Screenshot + Reference Number/UTR (mandatory).</li>
          <li>Min Deposit: ₹5,000. Max: no limit per transaction (configurable).</li>
          <li>Only KYC-verified accounts can deposit.</li>
          <li>Third-party or mismatched deposits will be rejected.</li>
        </ul>
        <p><strong>USDT Deposits:</strong></p>
        <ul className="list-disc pl-5">
          <li>Method: Blockchain transfer to Admin’s official crypto address.</li>
          <li>Upload: Transaction Hash (TxID) + optional screenshot.</li>
          <li>Limits: Min USDT 50. Max: No limit per transaction.</li>
          <li>Network: TRC20 (default).</li>
          <li>Only KYC-verified accounts can deposit.</li>
        </ul>
        <p className="text-gray-600">Deposits are subject to Admin verification (0 – 48 hours).</p>

        <h2 className="font-semibold">3. Withdrawals</h2>
        <p><strong>INR Withdrawals:</strong></p>
        <ul className="list-disc pl-5">
          <li>Processed only to the user’s verified bank account.</li>
          <li>Min Withdrawal: ₹1,000.</li>
          <li>Fees: 3% Withdrawal Fee + 2% Platform Fee (configurable).</li>
          <li>Processing time: 0 – 7 days.</li>
        </ul>
        <p><strong>USDT Withdrawals:</strong></p>
        <ul className="list-disc pl-5">
          <li>Processed only to the user’s verified wallet address.</li>
          <li>Min Withdrawal: 10 USDT.</li>
          <li>Network fees apply.</li>
          <li>Processing time: 0 – 7 days.</li>
        </ul>
        <p className="text-gray-600">Withdrawals are shown in the user dashboard with status: Pending / Approved / Rejected. Users will be notified via Email + Dashboard Notification after status update.</p>

        <h2 className="font-semibold">4. Profits & Referral Earnings</h2>
        <ul className="list-disc pl-5">
          <li>Daily profits will be credited automatically as per selected plan.</li>
          <li>Referral bonus: Referrer earns 1% of referred user’s daily profit (not for deposit).</li>
          <li>{companyName} reserves the right to adjust profit percentages or referral bonuses at any time.</li>
        </ul>

        <h2 className="font-semibold">5. Complaints & Support</h2>
        <ul className="list-disc pl-5">
          <li>Users can raise complaints via the Complaint Section.</li>
          <li>Complaints will carry a status: Pending / Resolved / Rejected.</li>
          <li>Admin replies will be visible in complaint details.</li>
        </ul>

        <h2 className="font-semibold">6. General Rules</h2>
        <ul className="list-disc pl-5">
          <li>Users must not share OTP, passwords, or account details with anyone.</li>
          <li>{companyName} will not be responsible for losses due to user negligence.</li>
          <li>Any fraudulent activity will result in account suspension without refund.</li>
          <li>All transactions are subject to admin verification.</li>
        </ul>

        <h2 className="font-semibold">7. Amendments</h2>
        <p>{companyName} reserves the right to update or modify these Terms & Conditions anytime. Users will be notified of major changes by email or dashboard notification.</p>

        <h2 className="font-semibold">8. Risk Disclaimer ⚠️</h2>
        <p>All investments involve risk. Past performance does not guarantee future results. {companyName} does not promise fixed or guaranteed returns.</p>
        <p>By investing, you agree that you are doing so at your own risk. {companyName} will not be liable for any loss of capital, profit, or opportunity due to market conditions, user actions, or third-party services.</p>
        <p>Users are advised to invest only amounts they can afford to risk.</p>

        <footer className="mt-4 text-xs text-gray-500">
          By using the platform, you confirm that you have read, understood, and agreed to these Terms & Conditions.
        </footer>
      </section>
    </main>
  );
}
