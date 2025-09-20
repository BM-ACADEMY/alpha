import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const RiskDisclaimerModal = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('RiskDisclaimerModal: Component mounted');
    const hasSeenDisclaimer = sessionStorage.getItem('hasSeenRiskDisclaimer');
    console.log('RiskDisclaimerModal: hasSeenRiskDisclaimer =', hasSeenDisclaimer);
    if (!hasSeenDisclaimer) {
      console.log('RiskDisclaimerModal: Opening modal');
      setIsOpen(true);
    } else {
      console.log('RiskDisclaimerModal: Modal skipped (already seen)');
    }
  }, []);

  const handleClose = () => {
    console.log('RiskDisclaimerModal: Closing modal');
    setIsOpen(false);
    sessionStorage.setItem('hasSeenRiskDisclaimer', 'true');
  };

  // Debugging: Force open modal for testing
  const forceOpenModal = () => {
    console.log('RiskDisclaimerModal: Forcing modal to open');
    sessionStorage.removeItem('hasSeenRiskDisclaimer');
    setIsOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-6"
          closeOnOverlayClick={true}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <AlertTriangle
                className="h-6 w-6 text-yellow-500 animate-pulse"
                style={{ animation: 'blink 1s infinite' }}
              />
              Risk Disclaimer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 text-sm text-gray-700">
            <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
              <ul className="list-disc pl-5 space-y-2">
                <li>All investments involve risk. Past performance does not guarantee future results.</li>
                <li>Alpha R does not promise fixed or guaranteed returns.</li>
                <li>By investing, you agree that you are doing so at your own risk.</li>
                <li>
                  Alpha R will not be liable for any loss of capital, profit, or opportunity due to
                  market conditions, user actions, or third-party services.
                </li>
                <li>Users are advised to invest only amounts they can afford to risk.</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="mt-6 flex flex-col gap-2">
            <Button
              variant="default"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleClose}
            >
              Got it
            </Button>
            {/* Debugging button to force modal open */}
            <Button
              variant="outline"
              className="w-full"
              onClick={forceOpenModal}
            >
              Show Modal Again (Debug)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
};

export default RiskDisclaimerModal;