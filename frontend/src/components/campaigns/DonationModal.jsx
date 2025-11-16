import React, { useState } from 'react';

const DonationModal = ({ campaign, onClose, onSubmit }) => {
  const [amount, setAmount] = useState(25);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const predefinedAmounts = [10, 25, 50, 100];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount < 1) {
      setError('Please enter a valid amount');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      onSubmit(amount, paymentMethod);
      setAmount(25);
    } catch {
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fundingPercent = Math.min(
    (campaign.funding.current / campaign.funding.goal) * 100,
    100
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 safe-area-inset">
      {/* Modal */}
      <div className="w-full bg-white rounded-t-2xl max-w-md mx-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Donate to Campaign</h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Campaign Info */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <h3 className="font-bold text-gray-900 mb-2">{campaign.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Raised:</span>
              <span className="font-bold text-gray-900">${campaign.funding.current}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Goal:</span>
              <span className="font-bold text-gray-900">${campaign.funding.goal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${fundingPercent}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 text-right mt-1">
              {Math.round(fundingPercent)}% funded
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Donation Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xl">💰</span>
              <input
                type="number"
                min="1"
                max="9999"
                value={amount}
                onChange={(e) => {
                  setAmount(parseInt(e.target.value) || '');
                  setError(null);
                }}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none text-lg font-bold"
                placeholder="0"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Predefined Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {predefinedAmounts.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setError(null);
                }}
                disabled={isProcessing}
                className={`py-2 px-3 rounded-lg font-bold text-sm transition-all duration-200 min-h-10 ${
                  amount === preset
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              {['card', 'paypal', 'apple_pay'].map((method) => (
                <label key={method} className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors duration-200">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isProcessing}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900">
                    {method === 'card' && '💳 Credit/Debit Card'}
                    {method === 'paypal' && '🅿️ PayPal'}
                    {method === 'apple_pay' && '🍎 Apple Pay'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
              ❌ {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || !amount}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg font-bold transition-all duration-200 min-h-12"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </div>
            ) : (
              `Donate $${amount}`
            )}
          </button>

          {/* Info Text */}
          <p className="text-xs text-gray-600 text-center">
            ✓ Secure payment processed instantly
          </p>
        </form>
      </div>
    </div>
  );
};

export default DonationModal;
