'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { DollarSignIcon, DownloadIcon, LockIcon } from 'lucide-react';
import { initiateTemplatePayment } from '@/actions/payments';

interface TemplatePurchaseButtonProps {
  templateId: string;
  sellerId: string;
  price: number;
  title: string;
}

export function TemplatePurchaseButton({
  templateId,
  sellerId,
  price,
  title,
}: TemplatePurchaseButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!session?.user?.email) {
    return (
      <Button
        onClick={() => router.push('/auth/sign-in')}
        className="w-full"
        size="lg"
      >
        Sign In to Purchase
      </Button>
    );
  }

  if (session.user.email === sellerId) {
    return (
      <Button disabled className="w-full" size="lg">
        You created this template
      </Button>
    );
  }

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const result = await initiateTemplatePayment(templateId, sellerId);

      if ('error' in result) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        <DollarSignIcon className="w-4 h-4 mr-2" />
        Buy Now - ${price.toFixed(2)}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Purchase Template</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to purchase &quot;{title}&quot; for ${price.toFixed(2)}.
              Your payment will be securely processed through Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePurchase}
              disabled={loading}
              className="bg-primary"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PurchaseStatus({
  status,
  escrowStatus,
}: {
  status: string;
  escrowStatus: string;
}) {
  const getStatusColor = () => {
    if (escrowStatus === 'RELEASED') return 'bg-green-500';
    if (escrowStatus === 'HELD') return 'bg-yellow-500';
    if (escrowStatus === 'REFUNDED') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusLabel = () => {
    if (escrowStatus === 'RELEASED') return 'Completed';
    if (escrowStatus === 'HELD') return 'Processing';
    if (escrowStatus === 'REFUNDED') return 'Refunded';
    return status;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium">{getStatusLabel()}</span>
    </div>
  );
}

export function SecurityBadge() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4 flex items-center gap-3">
        <LockIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Secure Payment</p>
          <p className="text-xs text-blue-700">
            Payments held in escrow until delivery confirmed
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
