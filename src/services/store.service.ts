import { Injectable, signal, computed, effect } from '@angular/core';

export interface Transaction {
  id: string;
  customerId: string;
  type: 'BILL' | 'PAYMENT';
  amount: number;
  date: string;
  description: string;
  // For Bills
  paidAmount?: number; 
  isFullyPaid?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  creditBalance: number; // Money they paid extra that carries forward
}

@Injectable({ providedIn: 'root' })
export class StoreService {
  readonly customers = signal<Customer[]>([]);
  readonly transactions = signal<Transaction[]>([]);

  readonly totalReceivables = computed(() => {
    return this.customers().reduce((total, c) => {
      const bal = this.getCustomerBalance(c.id);
      return total + (bal > 0 ? bal : 0);
    }, 0);
  });

  constructor() {
    this.loadData();
    
    // Auto-save effect
    effect(() => {
      localStorage.setItem('ek_customers', JSON.stringify(this.customers()));
      localStorage.setItem('ek_transactions', JSON.stringify(this.transactions()));
    });
  }

  private loadData() {
    const c = localStorage.getItem('ek_customers');
    const t = localStorage.getItem('ek_transactions');
    if (c) this.customers.set(JSON.parse(c));
    if (t) this.transactions.set(JSON.parse(t));
  }

  // --- Getters ---

  getCustomer(id: string) {
    return this.customers().find(c => c.id === id);
  }

  getCustomerTransactions(customerId: string) {
    return this.transactions()
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getCustomerBalance(customerId: string): number {
    const txs = this.transactions().filter(t => t.customerId === customerId);
    const totalBilled = txs.filter(t => t.type === 'BILL').reduce((acc, t) => acc + t.amount, 0);
    const totalPaid = txs.filter(t => t.type === 'PAYMENT').reduce((acc, t) => acc + t.amount, 0);
    return totalBilled - totalPaid; // Positive means they OWE money. Negative means they have CREDIT.
  }

  // --- Actions ---

  addCustomer(name: string, phone: string) {
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name,
      phone,
      creditBalance: 0
    };
    this.customers.update(prev => [...prev, newCustomer]);
    return newCustomer.id;
  }

  addBill(customerId: string, amount: number, description: string, date: string) {
    // 1. Check if customer has credit balance (carry forward)
    const customer = this.getCustomer(customerId);
    let paidFromCredit = 0;
    
    if (customer && customer.creditBalance > 0) {
      paidFromCredit = Math.min(amount, customer.creditBalance);
      // Reduce customer credit
      this.updateCustomerCredit(customerId, customer.creditBalance - paidFromCredit);
    }

    const newBill: Transaction = {
      id: crypto.randomUUID(),
      customerId,
      type: 'BILL',
      amount,
      date,
      description,
      paidAmount: paidFromCredit,
      isFullyPaid: paidFromCredit >= amount
    };

    this.transactions.update(prev => [...prev, newBill]);
  }

  addPayment(customerId: string, amount: number, description: string, date: string) {
    // 1. Create Payment Record
    const newPayment: Transaction = {
      id: crypto.randomUUID(),
      customerId,
      type: 'PAYMENT',
      amount,
      date,
      description
    };
    this.transactions.update(prev => [...prev, newPayment]);

    // 2. Allocation Logic (FIFO)
    this.allocatePaymentToBills(customerId, amount);
  }

  // --- Core Business Logic: FIFO Allocation ---
  private allocatePaymentToBills(customerId: string, paymentAmount: number) {
    let remainingPayment = paymentAmount;

    // Get all unpaid or partially paid bills, sorted by OLDEST DATE first
    const allTransactions = this.transactions();
    const customerBills = allTransactions
      .filter(t => t.customerId === customerId && t.type === 'BILL' && !t.isFullyPaid)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // We need to mutate specific transactions in the array. 
    // To be safe with signals, we map the whole array but only change what's needed.
    const updatedTransactions = allTransactions.map(t => {
      // If it's one of the target bills and we have money left
      if (t.customerId === customerId && t.type === 'BILL' && !t.isFullyPaid && remainingPayment > 0) {
        const alreadyPaid = t.paidAmount || 0;
        const due = t.amount - alreadyPaid;
        
        const toPay = Math.min(due, remainingPayment);
        remainingPayment -= toPay;

        const newPaidAmount = alreadyPaid + toPay;
        return {
          ...t,
          paidAmount: newPaidAmount,
          isFullyPaid: newPaidAmount >= t.amount
        };
      }
      return t;
    });

    this.transactions.set(updatedTransactions);

    // 3. If money still remains, add to Customer Credit Balance (Carry Forward)
    if (remainingPayment > 0) {
      const customer = this.getCustomer(customerId);
      if (customer) {
        this.updateCustomerCredit(customerId, customer.creditBalance + remainingPayment);
      }
    }
  }

  private updateCustomerCredit(customerId: string, newCredit: number) {
    this.customers.update(prev => prev.map(c => 
      c.id === customerId ? { ...c, creditBalance: newCredit } : c
    ));
  }
}