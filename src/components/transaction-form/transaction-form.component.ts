import { Component, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { AiService } from '../../services/ai.service';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-transaction-form',
  imports: [FormsModule, DatePipe, DecimalPipe, TitleCasePipe],
  template: `
    <div class="flex flex-col h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white p-4 shadow-sm border-b flex items-center gap-3">
        <button (click)="goBack()" class="p-2 -ml-2 text-gray-600 rounded-full hover:bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold capitalize leading-none">Add {{ type }}</h1>
          @if (customer(); as c) {
            <p class="text-xs text-gray-500 mt-1">for {{ c.name }}</p>
          }
        </div>
      </div>

      <!-- Customer Balance Context -->
      @if (customer(); as c) {
        @let bal = store.getCustomerBalance(c.id);
        <div class="px-5 py-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center text-sm">
          <span class="text-gray-600 font-medium">Current Balance:</span>
          <span class="font-bold text-base" 
            [class.text-red-600]="bal > 0" 
            [class.text-green-600]="bal <= 0">
            @if(bal > 0) { Due: \${{ bal | number }} }
            @else if (bal < 0) { Adv: \${{ Math.abs(bal) | number }} }
            @else { Settled }
          </span>
        </div>
      }

      <div class="p-5 flex-1 overflow-y-auto">
        
        <!-- Smart AI Input -->
        <div class="mb-8 bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm">
          <label class="block text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
              <path fill-rule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436-1.119.871-2.123 1.591-3.003 2.123a2.62 2.62 0 0 0-.955 1.645c-.2.962-.327 1.964-.374 2.966a.75.75 0 0 1-.75.746c-5.056 0-9.555-2.383-12.436-6.084C1.027 15.007.307 14.003-.225 13.123a2.62 2.62 0 0 1 1.645-.955c.962-.2 1.964-.327 2.966-.374a.75.75 0 0 1 .746-.75c0-.056.012-.11.03-.16Z" clip-rule="evenodd" />
            </svg>
            Auto-Fill Helper
          </label>
          <div class="flex gap-2">
            <input 
              type="text" 
              [(ngModel)]="magicInput"
              placeholder="e.g. 'Rice and Dal 300'" 
              class="flex-1 p-3 text-base border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 text-gray-900"
            >
            <button 
              (click)="processMagicInput()"
              [disabled]="isProcessing"
              class="bg-indigo-600 text-white px-4 rounded-lg font-bold disabled:opacity-50 active:bg-indigo-800">
              {{ isProcessing ? '...' : 'Fill' }}
            </button>
          </div>
          <p class="text-xs text-indigo-500 mt-2 font-medium">
            Tip: Type something like "500 for groceries" and tap Fill.
          </p>
        </div>

        <!-- Manual Form -->
        <form (submit)="saveTransaction()" class="space-y-6">
          
          <!-- Date Field -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">Date</label>
            <input 
              type="date" 
              name="date"
              [(ngModel)]="date"
              class="w-full p-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              required
            >
          </div>

          <!-- Amount Field -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">
              Amount ($)
            </label>
            <div class="relative">
               <span class="absolute left-4 top-4 text-gray-400 text-3xl font-light">$</span>
              <input 
                type="number" 
                name="amount"
                [(ngModel)]="amount"
                placeholder="0"
                class="w-full p-4 pl-10 text-4xl font-bold text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
            </div>
          </div>

          <!-- Description Field -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-1">Details / Note</label>
            <textarea 
              name="description"
              [(ngModel)]="description"
              rows="3"
              placeholder="What is this for?"
              class="w-full p-4 text-lg border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            ></textarea>
          </div>

          <div class="pt-4 pb-10">
            <button 
              type="submit" 
              [disabled]="!amount || amount <= 0"
              class="w-full py-4 px-6 rounded-xl text-white font-bold text-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              [class.bg-red-600]="type === 'bill'"
              [class.hover:bg-red-700]="type === 'bill'"
              [class.bg-green-600]="type === 'payment'"
              [class.hover:bg-green-700]="type === 'payment'">
              
              @if (type === 'bill') {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                   <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              }
              
              Save {{ type | titlecase }}
            </button>
          </div>
        </form>

      </div>
    </div>
  `
})
export class TransactionFormComponent {
  store = inject(StoreService);
  aiService = inject(AiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  Math = Math;

  type: 'bill' | 'payment' = 'bill';
  customerId = '';
  
  // Form Model
  date = new Date().toISOString().split('T')[0];
  amount: number | null = null;
  description = '';
  
  // Magic AI
  magicInput = '';
  isProcessing = false;

  constructor() {
    this.route.params.subscribe(p => {
      this.type = p['type'] as 'bill' | 'payment';
      this.customerId = p['customerId'];
      // Pre-set default description based on type
      if (this.type === 'payment' && !this.description) {
        this.description = 'Cash Payment';
      }
    });
  }

  customer = computed(() => this.store.getCustomer(this.customerId));

  async processMagicInput() {
    if (!this.magicInput.trim()) return;
    
    this.isProcessing = true;
    const result = await this.aiService.parseTransactionIntent(this.magicInput);
    this.isProcessing = false;

    if (result) {
      this.amount = result.amount;
      if (result.description) this.description = result.description;
      if (result.date) this.date = result.date;
      // Clear magic input to indicate success
      this.magicInput = '';
    } else {
      alert('Could not understand. Please fill manually.');
    }
  }

  saveTransaction() {
    if (!this.amount || this.amount <= 0) return;

    if (this.type === 'bill') {
      this.store.addBill(this.customerId, this.amount, this.description || 'Items purchased', this.date);
    } else {
      this.store.addPayment(this.customerId, this.amount, this.description || 'Payment received', this.date);
    }

    this.goBack();
  }

  goBack() {
    this.router.navigate(['/customer', this.customerId]);
  }
}