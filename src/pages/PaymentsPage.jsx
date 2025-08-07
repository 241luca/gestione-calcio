import React from 'react';
import PaymentList from '../components/payments/PaymentList';

const PaymentsPage = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PaymentList />
      </div>
    </div>
  );
};

export default PaymentsPage;