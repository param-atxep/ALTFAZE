'use client';

import { useState, useEffect } from 'react';
import {
  getWalletBalance,
  getEscrowBalance,
  requestWithdrawal,
  getWithdrawalHistory,
} from '@/actions/payments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DollarSignIcon, TrendingUpIcon, ClockIcon } from 'lucide-react';

export function WalletBalance() {
  const [balance, setBalance] = useState(0);
  const [escrowed, setEscrowed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalances();
  }, []);

  const loadBalances = async () => {
    try {
      const [walletResult, escrowResult] = await Promise.all([
        getWalletBalance(),
        getEscrowBalance(),
      ]);

      if (!('error' in walletResult)) {
        setBalance(walletResult.balance);
      }

      if (!('error' in escrowResult)) {
        setEscrowed(escrowResult.totalEscrowed);
      }
    } catch (error) {
      console.error('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSignIcon className="w-4 h-4" />
            Available Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${loading ? '...' : balance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            In Escrow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            ${loading ? '...' : escrowed.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pending confirmation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function WithdrawalForm() {
  const [amount, setAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !bankAccount) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await requestWithdrawal({
        amount: parseFloat(amount),
        bankAccount,
      });

      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Withdrawal request submitted!');
        setAmount('');
        setBankAccount('');
        setOpen(false);
      }
    } catch (error) {
      toast.error('Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Request Withdrawal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Enter your withdrawal amount and bank account details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10"
                max="10000"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank">Bank Account (Last 4 digits)</Label>
            <Input
              id="bank"
              placeholder="1234"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value.slice(-4))}
              maxLength="4"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Processing...' : 'Request Withdrawal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function WithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const result = await getWithdrawalHistory();
      if (!('error' in result)) {
        setWithdrawals(result);
      }
    } catch (error) {
      console.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-green-100 text-green-800',
    };

    return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No withdrawal requests yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div>
                <p className="font-semibold">${withdrawal.amount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(withdrawal.requestedAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className={getStatusBadge(withdrawal.status)}>
                {withdrawal.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
