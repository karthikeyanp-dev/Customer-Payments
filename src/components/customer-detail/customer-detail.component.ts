import { Component, inject, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreService } from '../../services/store.service';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    @if (customer(); as c) {
      <div class="flex flex-col h-full">
        <!-- Customer Header Summary -->
        <div class="bg-white p-6 shadow-sm border-b z-0">
          <h1 class="text-2xl font-bold text-gray-900">{{ c.name }}</h1>
          <p class="text-gray-500">{{ c.phone || 'No Phone' }}</p>
          
          <div class="mt-4 p-4 rounded-xl bg-gray-50 flex justify-between items-center border">
            <div>
              <p class="text-sm text-gray-500 font-medium">Net Balance</p>
              @let bal = store.getCustomerBalance(c.id);
              <p class="text-3xl font-extrabold" [class.text-red-600]="bal > 0" [class.text-green-600]="bal <= 0">
                @if(bal > 0) { \${{ bal | number:'1.0-2' }} }
                @else { \${{ Math.abs(bal) | number:'1.0-2' }} }
              </p>
              @if (bal > 0) {
                <p class="text-xs text-red-500 font-bold">DUE</p>
              } @else if (bal < 0) {
                 <p class="text-xs text-green-500 font-bold">ADVANCE PAID</p>
              } @else {
                <p class="text-xs text-gray-500 font-bold">SETTLED</p>
              }
            </div>
            
            <div class="text-right">
                @if(c.creditBalance > 0) {
                   <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-1">
                      Carry Fwd: \${{c.creditBalance | number}}
                   </div>
                }
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="grid grid-cols-2 gap-3 p-4 bg-white border-b">
          <a [routerLink]="['/transaction', 'bill', c.id]" 
             class="flex flex-col items-center justify-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 active:bg-red-100 touch-target">
             <span class="font-bold text-lg">+ BILL</span>
             <span class="text-xs">Give Items</span>
          </a>
          <a [routerLink]="['/transaction', 'payment', c.id]" 
             class="flex flex-col items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 active:bg-green-100 touch-target">
             <span class="font-bold text-lg">+ PAY</span>
             <span class="text-xs">Got Money</span>
          </a>
        </div>

        <!-- Transaction List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
           <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">History</h3>
           
           @for (t of transactions(); track t.id) {
             <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-start">
               <div class="flex-1">
                 <div class="flex items-center gap-2 mb-1">
                   <span class="text-xs font-bold px-2 py-0.5 rounded"
                     [class.bg-red-100]="t.type === 'BILL'" [class.text-red-700]="t.type === 'BILL'"
                     [class.bg-green-100]="t.type === 'PAYMENT'" [class.text-green-700]="t.type === 'PAYMENT'">
                     {{ t.type }}
                   </span>
                   <span class="text-xs text-gray-400">{{ t.date | date:'mediumDate' }}</span>
                 </div>
                 <p class="text-gray-800 font-medium leading-tight">{{ t.description }}</p>
                 
                 <!-- Status for Bills -->
                 @if (t.type === 'BILL') {
                   <div class="mt-2 text-xs">
                     @if (t.isFullyPaid) {
                       <span class="text-green-600 font-bold flex items-center gap-1">
                         ✓ PAID
                       </span>
                     } @else {
                       <div class="flex items-center gap-2 text-gray-500">
                         <span>Paid: \${{ t.paidAmount || 0 | number }}</span>
                         <span class="text-red-500 font-bold">Due: \${{ (t.amount - (t.paidAmount || 0)) | number }}</span>
                       </div>
                       <!-- Progress bar for partial payments -->
                       <div class="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                         <div class="bg-green-500 h-1.5 rounded-full" [style.width.%]="((t.paidAmount || 0) / t.amount) * 100"></div>
                       </div>
                     }
                   </div>
                 }
               </div>
               
               <div class="text-right">
                 <span class="text-lg font-bold block"
                   [class.text-red-600]="t.type === 'BILL'"
                   [class.text-green-600]="t.type === 'PAYMENT'">
                   {{ t.type === 'BILL' ? '-' : '+' }}\${{ t.amount | number }}
                 </span>
               </div>
             </div>
           }
           @if (transactions().length === 0) {
             <div class="text-center py-10 text-gray-400">No transactions yet.</div>
           }
        </div>
      </div>
    }
  `
})
export class CustomerDetailComponent {
  store = inject(StoreService);
  route = inject(ActivatedRoute);
  Math = Math;

  customerId = '';
  
  constructor() {
    this.route.params.subscribe(p => {
      this.customerId = p['id'];
    });
  }

  customer = computed(() => this.store.getCustomer(this.customerId));
  transactions = computed(() => this.store.getCustomerTransactions(this.customerId));
}