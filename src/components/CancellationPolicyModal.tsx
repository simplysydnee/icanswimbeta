import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, Mail, Globe, AlertCircle, XCircle, CheckCircle } from "lucide-react";

interface CancellationPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  sessionStartTime: Date;
  isWithin24Hours: boolean;
}

export const CancellationPolicyModal = ({
  open,
  onOpenChange,
  onConfirm,
  sessionStartTime,
  isWithin24Hours,
}: CancellationPolicyModalProps) => {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (!isWithin24Hours) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Cancellation Policy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main Policy Text */}
          <div className="space-y-3 text-sm">
            <p className="font-medium">
              If you need to cancel a session, please do so at least 24 hours in advance.
            </p>
            <p>
              This gives us time to offer the spot to another swimmer.
            </p>
            <p>
              Cancellations can be made through your Parent Portal on the app or online.
            </p>
            <p>
              We understand life happens—illness, emergencies, and unexpected changes.
            </p>
            <p className="font-medium">
              However, when we don&apos;t receive notice in time, another swimmer misses the
              opportunity to take that spot.
            </p>
          </div>

          {/* Warning Section */}
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="space-y-3 text-sm">
              <p className="font-bold text-amber-900 dark:text-amber-100">
                ⚠️ If a session is canceled with less than 24 hours&apos; notice, your swimmer
                will be moved to Flexible Swimmer status:
              </p>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">No recurring weekly sessions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">
                    Only eligible to book single open sessions as available
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <p className="text-sm font-medium">
            Thank you for understanding as we work to keep the pool full and every swimmer
            progressing.
          </p>

          {/* Within 24 Hours Warning */}
          {isWithin24Hours && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p className="font-bold">
                  ❌ Cancellations are not allowed within 24 hours of your scheduled session.
                </p>
                <p>Please contact the front desk if this is an emergency.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Emergency Contact Section */}
          <div className="border-t pt-4 space-y-2">
            <p className="font-semibold text-sm">Have an emergency? Contact us:</p>
            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
              <p className="font-bold">Sutton Lucas</p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href="tel:209-985-1538" className="hover:underline">
                    209-985-1538
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href="mailto:sutton@icanswim209.com" className="hover:underline">
                    sutton@icanswim209.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <a
                    href="https://icanswim209.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    icanswim209.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Acknowledgment */}
          {!isWithin24Hours && (
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="policy-acknowledgment"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <label
                htmlFor="policy-acknowledgment"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I acknowledge this policy and understand the consequences of late cancellations
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
            Keep Session
          </Button>
          {isWithin24Hours ? (
            <Button
              variant="destructive"
              disabled
              className="w-full sm:w-auto opacity-50 cursor-not-allowed"
            >
              Cannot Cancel (Within 24h)
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!acknowledged}
              className="w-full sm:w-auto"
            >
              Confirm Cancellation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};