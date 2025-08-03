import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, Settings, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SubscriptionData {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
}

interface SubscriptionCardProps {
  subscription: SubscriptionData;
  onManageSubscription: () => void;
}

const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription, onManageSubscription }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'canceled':
        return 'Canceled';
      case 'past_due':
        return 'Past Due';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'No Subscription';
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription.stripeCustomerId) {
      alert('No subscription found');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error creating portal session:', error);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!subscription.subscriptionStatus) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            You don't have an active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Subscribe to unlock all features and start building your databases.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Subscription
        </CardTitle>
        <CardDescription>
          Manage your subscription and billing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Plan</span>
          <span className="font-semibold">{subscription.subscriptionPlan}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Status</span>
          <Badge className={getStatusColor(subscription.subscriptionStatus)}>
            {getStatusText(subscription.subscriptionStatus)}
          </Badge>
        </div>

        {subscription.subscriptionCurrentPeriodEnd && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Next billing</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {format(new Date(subscription.subscriptionCurrentPeriodEnd), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full"
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isLoading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard; 